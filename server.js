const mongoose = require("mongoose");
const { S3Client } = require("@aws-sdk/client-s3");
require("dotenv").config({ path: "./config.env" });

const app = require("./app");

// CONNECT TO DB
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

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

// START THE SERVER
const port = 3000;
app.listen(port, () => console.log(`Server is running on port ${port}...`));

console.log(process.env.NODE_ENV);
