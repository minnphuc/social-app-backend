const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, "User must have a name"] },
  email: {
    type: String,
    required: [true, "User must have an email"],
    unique: true,
    lowercase: true,
    validate: {
      validator: validator.isEmail,
      message: "Please provide a valid email",
    },
  },
  password: {
    type: String,
    required: [true, "User must have a password"],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "User have to confirm the password"],
    validate: {
      validator: function (currentField) {
        return currentField === this.password;
      },
      message: "Password confirm doesn't match the password",
    },
  },
  photo: {
    type: String,
    default: "/assets/default.jpg",
  },
  photoUrl: String,
  cover: {
    type: String,
    default: "/assets/cover.jpg",
  },
  coverUrl: String,
  location: String,
  hometown: String,
  relationship: Boolean,
  biography: String,
});

userSchema.pre("save", async function (next) {
  const encryptedPassword = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;
  this.password = encryptedPassword;

  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
