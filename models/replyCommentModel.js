const mongoose = require("mongoose");

const replyCommentSchema = new mongoose.Schema({
  comment: { type: mongoose.Schema.ObjectId, ref: "Comment" },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Comment must belong to a user"],
  },
  replyTo: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Reply comment must reply to a user"],
  },
  content: { type: String, required: [true, "Comment must have content"] },
  postedAt: { type: Date, default: Date.now },
  likedBy: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
});

replyCommentSchema.pre(/^find/, function (next) {
  this.populate({ path: "user", select: "name photo photoUrl" });
  this.populate({ path: "replyTo", select: "name" });

  next();
});

const ReplyComment = mongoose.model("ReplyComment", replyCommentSchema);

module.exports = ReplyComment;
