const User = require("../models/userModel");
const sharp = require("sharp");
const s3Util = require("../utils/s3Util");
const AppError = require("../utils/AppError");

const filterBody = body => {
  const { password, passwordConfirm, email, photo, cover, ...filteredBody } = body;

  return filteredBody;
};

exports.processImage = async (req, res, next) => {
  try {
    if (!req.file) return next();

    const imgType = req.body.imageType;
    const width = imgType === "avatar" ? 500 : 1300;
    const height = imgType === "avatar" ? 500 : 400;

    req.file.filename = `${imgType}-${req.user._id}-${Date.now()}.jpeg`;

    const buffer = await sharp(req.file.buffer)
      .resize(width, height)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toBuffer();

    await Promise.all([
      s3Util.uploadImage(req.file.filename, buffer),
      s3Util.deleteImage(req.body.oldPhoto),
    ]);

    next();
  } catch (error) {
    error.statusCode = 404;
    next(error);
  }
};

exports.updateMe = async (req, res, next) => {
  try {
    const filteredBody = filterBody(req.body);

    if (req.file) {
      req.body.imageType === "avatar"
        ? (filteredBody.photo = req.file.filename)
        : (filteredBody.cover = req.file.filename);
    }

    const me = await User.findByIdAndUpdate(req.user._id, filteredBody, {
      new: true,
      runValidators: true,
    });

    //? SAVING COST
    if (req.file) {
      req.body.imageType === "avatar"
        ? (me.photoUrl = await s3Util.signImageUrl(me.photo))
        : (me.coverUrl = await s3Util.signImageUrl(me.cover));
    }

    res.status(200).json({
      status: "success",
      data: {
        user: me,
      },
    });
  } catch (error) {
    error.statusCode = 404;
    next(error);
  }
};

exports.getFollowingUsers = async (req, res, next) => {
  try {
    const queryParams = req.query;

    if (!queryParams.user)
      throw new AppError("Please use '{url}/users/following?user={userId}'", 400);

    const currentUser = await User.findById(queryParams.user).populate({
      path: "following",
      select: "name photo photoUrl",
    });

    for (const user of currentUser.following) {
      user.photoUrl = await s3Util.signImageUrl(user.photo);
    }

    res.status(200).json({
      status: "success",
      results: currentUser.following.length,
      data: {
        following: currentUser.following,
      },
    });
  } catch (error) {
    error.statusCode = 404;
    next(error);
  }
};

exports.getRecommendUsers = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id);

    const followingUsers = [...currentUser.following, req.user._id];

    const recommendUser = await User.find({ _id: { $nin: followingUsers } }).limit(3);

    for (const user of recommendUser) {
      user.photoUrl = await s3Util.signImageUrl(user.photo);
    }

    res.status(200).json({
      status: "success",
      results: recommendUser.length,
      data: {
        recommend: recommendUser,
      },
    });
  } catch (error) {
    error.statusCode = 404;
    next(error);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find();

    res.status(200).json({
      status: "success",
      results: users.length,
      data: {
        users,
      },
    });
  } catch (error) {
    error.statusCode = 404;
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    const [photoUrl, coverUrl] = await Promise.all([
      s3Util.signImageUrl(user.photo),
      s3Util.signImageUrl(user.cover),
    ]);
    user.photoUrl = photoUrl;
    user.coverUrl = coverUrl;

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (error) {
    error.statusCode = 404;
    next(error);
  }
};

exports.searchUserByName = async (req, res, next) => {
  try {
    const queryParams = req.query;

    if (!queryParams.name)
      throw new AppError("Please use '{url}/users?name={query}' to search", 400);

    // Reg-ex to match pattern and case-insensitive option
    const users = await User.find({
      name: { $regex: `${queryParams.name}`, $options: "i" },
    });

    for (const user of users) {
      user.photoUrl = await s3Util.signImageUrl(user.photo);
    }

    res.status(200).json({
      status: "success",
      results: users.length,
      data: {
        users,
      },
    });
  } catch (error) {
    next(error);
  }
};
