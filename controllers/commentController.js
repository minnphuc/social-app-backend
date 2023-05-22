const Comment = require("../models/commentModel");
const AppError = require("../utils/AppError");
const s3Util = require("../utils/s3Util");

exports.createComment = async (req, res, next) => {
  try {
    const body = { ...req.body, user: req.user._id };

    const newComment = await Comment.create(body);
    await newComment.populate({ path: "user", select: "name photo photoUrl" });

    newComment.user.photoUrl = await s3Util.signImageUrl(newComment.user.photo);

    res.status(201).json({
      status: "success",
      data: {
        comment: newComment,
      },
    });
  } catch (error) {
    error.statusCode = 404;
    next(error);
  }
};

exports.getAllComments = async (req, res, next) => {
  try {
    const comments = await Comment.find();

    res.status(200).json({
      status: "success",
      results: comments.length,
      data: {
        comments,
      },
    });
  } catch (error) {
    error.statusCode = 404;
    next(error);
  }
};

exports.getCommentsOfPost = async (req, res, next) => {
  try {
    const queryParams = req.query;

    if (!queryParams.post)
      throw new AppError("Please use '{url}/comments?post={postId}'", 400);

    const comments = await Comment.find({ post: queryParams.post }).sort("-postedAt");

    for (const comment of comments) {
      comment.user.photoUrl = await s3Util.signImageUrl(comment.user.photo);
    }

    res.status(200).json({
      status: "success",
      results: comments.length,
      data: {
        comments,
      },
    });
  } catch (error) {
    error.statusCode = 404;
    next(error);
  }
};

exports.updateComment = async (req, res, next) => {
  try {
    const updatedComment = await Comment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      data: {
        comment: updatedComment,
      },
    });
  } catch (error) {
    error.statusCode = 404;
    next(error);
  }
};

exports.countCommentsOfPost = async (req, res, next) => {
  try {
    const queryParams = req.query;

    if (!queryParams.post)
      throw new AppError("Please use '{url}/comments/count?post={postId}'", 400);

    const comments = await Comment.find({ post: queryParams.post });

    res.status(200).json({
      status: "success",
      data: {
        count: comments.length,
      },
    });
  } catch (error) {
    error.statusCode = 404;
    next(error);
  }
};
