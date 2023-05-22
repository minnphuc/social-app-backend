const Post = require("../models/postModel");
const sharp = require("sharp");

const s3Util = require("../utils/s3Util");
const AppError = require("../utils/AppError");

exports.processImage = async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `post-${req.user._id}-${Date.now()}.jpeg`;

  const buffer = await sharp(req.file.buffer)
    .resize(700, 400)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toBuffer();

  await s3Util.uploadImage(req.file.filename, buffer);

  next();
};

exports.createPost = async (req, res, next) => {
  try {
    const body = { ...req.body, user: req.user._id };

    if (req.file) body.photo = req.file.filename;

    const newPost = await Post.create(body);

    // Image processing
    newPost.photoUrl = await s3Util.signImageUrl(newPost.photo);
    await newPost.populate({ path: "user", select: "name photo" });
    newPost.user.photoUrl = await s3Util.signImageUrl(newPost.user.photo);

    res.status(201).json({
      status: "success",
      data: {
        post: newPost,
      },
    });
  } catch (error) {
    error.statusCode = 404;
    next(error);
  }
};

exports.getAllPosts = async (req, res, next) => {
  try {
    const posts = await Post.find();

    for (const post of posts) {
      post.user.photoUrl = await s3Util.signImageUrl(post.user.photo);

      post.photoUrl = await s3Util.signImageUrl(post.photo);
    }

    res.status(200).json({
      status: "success",
      results: posts.length,
      data: {
        posts,
      },
    });
  } catch (error) {
    error.statusCode = 404;
    next(error);
  }
};

exports.getFollowingPosts = async (req, res, next) => {
  try {
    const postedBy = [...req.user.following, req.user._id];

    const posts = await Post.find({ user: { $in: postedBy } }).sort("-postedAt");

    for (const post of posts) {
      post.user.photoUrl = await s3Util.signImageUrl(post.user.photo);

      post.photoUrl = await s3Util.signImageUrl(post.photo);
    }

    res.status(200).json({
      status: "success",
      results: posts.length,
      data: {
        posts,
      },
    });
  } catch (error) {
    error.statusCode = 404;
    next(error);
  }
};

exports.getPostByUser = async (req, res, next) => {
  try {
    const queryParams = req.query;

    if (!queryParams.user)
      throw new AppError("Please use '{url}/posts?user={userId}'", 400);

    const posts = await Post.find({ user: queryParams.user }).sort("-postedAt");

    for (const post of posts) {
      post.user.photoUrl = await s3Util.signImageUrl(post.user.photo);

      post.photoUrl = await s3Util.signImageUrl(post.photo);
    }

    res.status(200).json({
      status: "success",
      results: posts.length,
      data: {
        posts,
      },
    });
  } catch (error) {
    error.statusCode = 404;
    next(error);
  }
};

exports.updatePost = async (req, res, next) => {
  try {
    const updatedPost = await Post.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      data: {
        post: updatedPost,
      },
    });
  } catch (error) {
    error.statusCode = 404;
    next(error);
  }
};
