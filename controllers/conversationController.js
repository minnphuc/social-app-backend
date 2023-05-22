const Conversation = require("../models/conversationModel");

const s3Util = require("../utils/s3Util");

exports.createConversation = async (req, res, next) => {
  try {
    const members = [req.user._id, req.body.receiverId];

    const newConversation = await Conversation.create({ members });

    await newConversation.populate({ path: "members", select: "name photo photoUrl" });

    for (const member of newConversation.members) {
      member.photoUrl = await s3Util.signImageUrl(member.photo);
    }

    res.status(201).json({
      status: "success",
      data: {
        conversation: newConversation,
      },
    });
  } catch (error) {
    error.statusCode = 404;
    next(error);
  }
};

exports.getMyConversation = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      members: { $in: [req.user._id] },
    });

    for (const conversation of conversations) {
      for (const member of conversation.members) {
        member.photoUrl = await s3Util.signImageUrl(member.photo);
      }
    }

    res.status(200).json({
      status: "success",
      results: conversations.length,
      data: {
        conversations,
      },
    });
  } catch (error) {
    error.statusCode = 404;
    next(error);
  }
};

exports.getConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      members: { $all: [req.user._id, req.params.receiverId] },
    });

    for (const member of conversation.members) {
      member.photoUrl = await s3Util.signImageUrl(member.photo);
    }

    res.status(200).json({
      status: "success",
      data: {
        conversation,
      },
    });
  } catch (error) {
    error.statusCode = 404;
    next(error);
  }
};
