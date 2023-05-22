const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.ObjectId,
    ref: "Post",
    required: [true, "Comment must belong to a post"],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Comment must belong to a user"],
  },
  content: { type: String, required: [true, "Comment must have content"] },
  postedAt: { type: Date, default: Date.now },
  likedBy: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
});

commentSchema.pre(/^find/, function (next) {
  this.populate({ path: "user", select: "name photo photoUrl" });

  next();
});

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
