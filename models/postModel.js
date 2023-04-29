const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  caption: String,
  photo: {
    type: String,
    required: function () {
      return !this.caption;
    },
  },
  photoUrl: String,
  postedAt: { type: Date, default: Date.now },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Post must belong to a user"],
  },
  likedBy: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
  commentCount: { type: Number, default: 0 },
});

postSchema.pre(/^find/, function (next) {
  this.populate({ path: "user", select: "name photo photoUrl" });

  next();
});

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
