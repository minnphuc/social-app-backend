const express = require("express");
const authController = require("../controllers/authController");
const conversationController = require("../controllers/conversationController");

const router = express.Router();

router.use(authController.protect);

router
  .route("/")
  .get(conversationController.getMyConversation)
  .post(conversationController.createConversation);

router.route("/:receiverId").get(conversationController.getConversation);

module.exports = router;
