const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const compression = require("compression");

const userRouter = require("./routes/userRoutes");
const postRouter = require("./routes/postRoutes");
const AppError = require("./utils/AppError");

const app = express();

app.use(morgan("dev"));
app.use(compression());
app.use(cors());
app.use(express.json());

app.use("/api/v1/users", userRouter);
app.use("/api/v1/posts", postRouter);

//! ERROR HANDLE
app.use("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!!!`, 404));
});

app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Something went wrong. Please try again!";

  res.status(err.statusCode).json({
    status: err.statusCode.toString().startsWith("4") ? "fail" : "error",
    data: {
      message: err.message,
    },
  });
});

module.exports = app;
