const mongoose = require("mongoose");
const { S3Client } = require("@aws-sdk/client-s3");
require("dotenv").config({ path: "./config.env" });
const { Server } = require("socket.io");

const http = require("http");
const app = require("./app");

// CONNECT TO DB
const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);

mongoose
  .connect(DB)
  .then(() => console.log("Database is connected successfully 🛢️"))
  .catch(err => console.log(err));

// CONNECT TO AMAZON S3
exports.s3Client = new S3Client({
  region: process.env.BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

// CREATE SERVER AND CONNECT TO SOCKET.IO SERVER
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    // origin: "http://localhost:8080",
    origin: "https://socialapp-minnphuc.netlify.app",
    methods: ["GET", "POST"],
  },
});

let users = [];

const addUser = (userId, socketId) => {
  if (!users.some(user => user.userId === userId)) users.push({ userId, socketId });
};

const removeUser = socketId => {
  users = users.filter(user => user.socketId !== socketId);
};

const findUser = userId => {
  return users.find(user => user.userId === userId);
};

io.on("connection", socket => {
  //* CONNECT
  console.log(`User connected: ${socket.id}`);

  //? ADD NEW USER
  socket.on("addUser", userId => {
    addUser(userId, socket.id);
    io.emit("getUsers", users);
  });

  //? SEND AND GET MESSAGE
  socket.on("sendMessage", ({ userId, receiverId, msg }) => {
    const receiver = findUser(receiverId);

    if (!receiver) return;

    io.to(receiver.socketId).emit("getMessage", { senderId: userId, content: msg });
  });

  //! DISCONNECT
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    removeUser(socket.id);
    io.emit("getUsers", users);
  });
});

// START THE SERVER
const port = 3000;
server.listen(port, () => console.log(`Server is running on port ${port}...`));

console.log(process.env.NODE_ENV);
