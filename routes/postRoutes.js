const express = require("express");

const postController = require("../controllers/postController");
const authController = require("../controllers/authController");
const uploadFormData = require("../utils/multer");

const skipIfQuery = function (middleware) {
  return function (req, res, next) {
    if (Object.keys(req.query).length !== 0) return next();
    return middleware(req, res, next);
  };
};

const router = express.Router();

router
  .route("/")
  .get(skipIfQuery(postController.getAllPosts), postController.getPostByUser)
  .post(
    authController.protect,
    uploadFormData,
    postController.processImage,
    postController.createPost
  );

router.route("/following").get(authController.protect, postController.getFollowingPosts);

router.route("/:id").patch(authController.protect, postController.updatePost);

module.exports = router;
