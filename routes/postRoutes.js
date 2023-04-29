const express = require("express");

const postController = require("../controllers/postController");
const authController = require("../controllers/authController");
const uploadFormData = require("../utils/multer");

const router = express.Router();

router
  .route("/")
  .get(postController.getAllPosts)
  .post(
    authController.protect,
    uploadFormData,
    postController.processImage,
    postController.createPost
  );

router.route("/:id").patch(authController.protect, postController.updatePost);

module.exports = router;
