const express = require("express");

const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const uploadFormData = require("../utils/multer");

const skipIfQuery = function (middleware) {
  return function (req, res, next) {
    if (Object.keys(req.query).length !== 0) return next();
    return middleware(req, res, next);
  };
};

const router = express.Router();

// API Endpoint

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/changePassword", authController.protect, authController.changePassword);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:resetToken", authController.resetPassword);

router.patch(
  "/updateMe",
  authController.protect,
  uploadFormData,
  userController.processImage,
  userController.updateMe
);

router
  .route("/")
  .get(skipIfQuery(userController.getAllUsers), userController.searchUserByName);

router.route("/following").get(userController.getFollowingUsers);

router.route("/recommend").get(authController.protect, userController.getRecommendUsers);

router.route("/:id").get(userController.getUserById);

module.exports = router;
