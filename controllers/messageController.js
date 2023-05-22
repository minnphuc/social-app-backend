const Message = require("../models/messageModel");

exports.createMessage = async (req, res, next) => {
  try {
    const body = { ...req.body, user: req.user._id };

    const newMessage = await Message.create(body);

    res.status(201).json({
      status: "success",
      data: {
        message: newMessage,
      },
    });
  } catch (error) {
    error.statusCode = 404;
    next(error);
  }
};

exports.getMessagesOfConversation = async (req, res, next) => {
  try {
    const queryParams = req.query;

    if (!queryParams.conversation)
      throw new AppError(
        "Please use '{url}/messages?conversation={conversationId}'",
        400
      );

    const messages = await Message.find({
      conversation: queryParams.conversation,
    });

    res.status(200).json({
      status: "success",
      results: messages.length,
      data: {
        messages,
      },
    });
  } catch (error) {
    error.statusCode = 404;
    next(error);
  }
};
