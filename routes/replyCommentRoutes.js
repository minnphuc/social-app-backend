const express = require("express");
const authController = require("../controllers/authController");
const replyCommentController = require("../controllers/replyCommentController");

const skipIfQuery = function (middleware) {
  return function (req, res, next) {
    if (Object.keys(req.query).length !== 0) return next();
    return middleware(req, res, next);
  };
};

const router = express.Router();

router
  .route("/")
  .get(
    skipIfQuery(replyCommentController.getAllReplies),
    replyCommentController.getRepliesOfComment
  )
  .post(authController.protect, replyCommentController.createReplyComment);

router.route("/count").get(replyCommentController.countRepliesOfComment);

router.route("/:id").patch(authController.protect, replyCommentController.updateReply);

module.exports = router;
