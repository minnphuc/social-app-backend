const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
  members: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
});

conversationSchema.pre(/^find/, function (next) {
  this.populate({ path: "members", select: "name photo photoUrl" });

  next();
});

const Conversation = mongoose.model("Conversation", conversationSchema);

module.exports = Conversation;
