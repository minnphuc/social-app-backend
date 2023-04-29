const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const server = require("../server");

exports.signImageUrl = async function (photo) {
  if (!photo || photo.includes("assets")) return null;

  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: photo,
  };

  const command = new GetObjectCommand(params);
  const photoUrl = await getSignedUrl(server.s3Client, command, {
    expiresIn: process.env.PHOTO_URL_EXPIRES_IN,
  });

  return photoUrl;
};

exports.uploadImage = async (filename, buffer) => {
  // Upload image to s3
  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: filename,
    Body: buffer,
  };
  const command = new PutObjectCommand(params);

  await server.s3Client.send(command);
};

exports.deleteImage = async filename => {
  if (!filename || filename.includes("assets")) return null;

  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: filename,
  };
  const command = new DeleteObjectCommand(params);

  await server.s3Client.send(command);
};
