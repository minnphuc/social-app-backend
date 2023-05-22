const ReplyComment = require("../models/replyCommentModel");
const AppError = require("../utils/AppError");
const s3Util = require("../utils/s3Util");

exports.createReplyComment = async (req, res, next) => {
  try {
    const body = { ...req.body, user: req.user._id };

    const newRepComment = await ReplyComment.create(body);
    await newRepComment.populate({ path: "user", select: "name photo photoUrl" });
    await newRepComment.populate({ path: "replyTo", select: "name" });

    newRepComment.user.photoUrl = await s3Util.signImageUrl(newRepComment.user.photo);

    res.status(201).json({
      status: "success",
      data: {
        reply: newRepComment,
      },
    });
  } catch (error) {
    error.statusCode = 404;
    next(error);
  }
};

exports.getAllReplies = async (req, res, next) => {
  try {
    const replies = await ReplyComment.find();

    res.status(200).json({
      status: "success",
      results: replies.length,
      data: {
        replies,
      },
    });
  } catch (error) {
    error.statusCode = 404;
    next(error);
  }
};

exports.getRepliesOfComment = async (req, res, next) => {
  try {
    const queryParams = req.query;

    if (!queryParams.comment)
      throw new AppError("Please use '{url}/replyComments?comment={commentId}'", 400);

    const replies = await ReplyComment.find({ comment: queryParams.comment }).sort(
      "-postedAt"
    );

    for (const reply of replies) {
      reply.user.photoUrl = await s3Util.signImageUrl(reply.user.photo);
    }

    res.status(200).json({
      status: "success",
      results: replies.length,
      data: {
        replies,
      },
    });
  } catch (error) {
    error.statusCode = 404;
    next(error);
  }
};

exports.updateReply = async (req, res, next) => {
  try {
    const updatedReply = await ReplyComment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      data: {
        reply: updatedReply,
      },
    });
  } catch (error) {
    error.statusCode = 404;
    next(error);
  }
};

exports.countRepliesOfComment = async (req, res, next) => {
  try {
    const queryParams = req.query;

    if (!queryParams.comment)
      throw new AppError(
        "Please use '{url}/replyComments/count?comment={commentId}'",
        400
      );

    const replies = await ReplyComment.find({ comment: queryParams.comment });

    res.status(200).json({
      status: "success",
      data: {
        count: replies.length,
      },
    });
  } catch (error) {
    error.statusCode = 404;
    next(error);
  }
};
