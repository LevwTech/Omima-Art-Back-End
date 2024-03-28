const { S3Client } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;

const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const maxFileSize = 30 * 1024 * 1024;

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: bucketName,
    fileFilter(req, file, cb) {
      if (!file.originalname.match(/\.(jpe?g|png|PNG|JPG|JPEG|gif|bmp)$/)) {
        return cb(new Error("File must be an Image"));
      }
      cb(undefined, true);
    },
    key: function (req, file, cb) {
      cb(null, Date.now() + file.originalname.replace(/ /g, ""));
    },
  }),
  limits: { fileSize: maxFileSize },
});

module.exports = upload;
