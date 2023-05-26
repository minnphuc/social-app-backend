const { promisify } = require("util");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const User = require("../models/userModel");
const AppError = require("../utils/AppError");
const sendEmail = require("../utils/email");

const signJWT = function (id) {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = async (req, res, next) => {
  try {
    const newUser = await User.create(req.body);

    const token = signJWT(newUser._id);

    res.status(201).json({
      status: "success",
      data: {
        user: newUser,
        token,
      },
    });
  } catch (error) {
    error.statusCode = 404;

    // Can't set unique error message on schema
    if (error.code === 11000)
      error.message = "This email has been used for another account";

    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      throw new AppError("Please provide email and password to sign in", 400);

    const user = await User.findOne({ email: email }).select("+password");
    if (!user) throw new AppError("Account does not exist", 401);

    const correctPass = await bcrypt.compare(password, user.password);
    if (!correctPass) throw new AppError("Password is not correct", 401);

    const token = signJWT(user._id);

    res.status(200).json({
      status: "success",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith("Bearer"))
      token = req.headers.authorization.slice(7);

    if (!token)
      throw new AppError("You are not logged in! Please log in to get access.", 401);

    const decodedPayload = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const verifiedUser = await User.findById(decodedPayload.id);
    if (!verifiedUser)
      throw new AppError("The user belonging to this token no longer exist.", 401);

    // GRANT ACCESS TO USER
    req.user = verifiedUser;

    next();
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { password, newPassword } = req.body;

    if (!password || !newPassword)
      throw new AppError("Please provide password and new password", 400);

    const user = await User.findById(req.user._id).select("+password");

    //prettier-ignore
    const correctPassword = await bcrypt.compare(password, user?.password || '');

    if (!correctPassword) throw new AppError("Invalid password", 401);

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: "success",
      data: {
        message: "Change password successfully. Please login again to continue",
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    // 1. Get user by POSTed email
    const user = await User.findOne({ email: req.body.email });

    if (!user) throw new AppError("There is no user with that email address.", 404);

    // 2. Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3. Send it to the user's email
    //prettier-ignore
    const resetUrl = `${process.env.NODE_ENV === "development" ? process.env.FRONTEND_URL_DEV : process.env.FRONTEND_URL}/resetPassword/${resetToken}`

    try {
      await sendEmail({
        email: user.email,
        subject: "Your password reset token(valid for 10 minutes)",
        resetUrl,
      });

      res.status(200).json({
        status: "success",
        data: {
          message:
            "Token has been sent to email! Please check your email to reset the password.",
        },
      });
    } catch (error) {
      // De-activate the token when email failed to sent
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return next(
        new AppError("There was an error sending the email. Try again later!", 500)
      );
    }
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    // 1. Get user based on token
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.resetToken)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    // 2. If token has not expired and user does exist, set new password
    if (!user) throw new AppError("Token is invalid or has expired", 400);

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;

    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    res.status(200).json({
      status: "success",
      data: {
        message: "Password reset successfully",
      },
    });
  } catch (error) {
    next(error);
  }
};
