const multer = require("multer");
const AppError = require("./AppError");

//? Multer is needed to extract body from multipart form data
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) cb(null, true);
  else cb(new AppError("Not an image! Please upload only image.", 400), false);
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

module.exports = upload.single("photo");
