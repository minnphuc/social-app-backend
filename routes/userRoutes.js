const express = require("express");

const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const uploadFormData = require("../utils/multer");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);

router.patch(
  "/updateMe",
  authController.protect,
  uploadFormData,
  userController.processImage,
  userController.updateMe
);

router.route("/").get(userController.getAllUsers);

router.route("/:id").get(userController.getUserById);

module.exports = router;
