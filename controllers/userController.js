const User = require("../models/userModel");
const sharp = require("sharp");
const s3Util = require("../utils/s3Util");

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
