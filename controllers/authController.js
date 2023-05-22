const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const User = require("../models/userModel");
const AppError = require("../utils/AppError");

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

    const encryptedPassword = await bcrypt.hash(newPassword, 12);

    await User.findByIdAndUpdate(
      req.user._id,
      { password: encryptedPassword },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      status: "success",
      data: {
        message: "Change password successfully. Please login again to continue",
      },
    });
  } catch (error) {
    next(err);
  }
};
