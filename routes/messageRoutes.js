const express = require("express");
const messageController = require("../controllers/messageController");
const authController = require("../controllers/authController");

const router = express.Router();

router
  .route("/")
  .get(messageController.getMessagesOfConversation)
  .post(authController.protect, messageController.createMessage);

module.exports = router;
