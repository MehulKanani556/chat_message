const multer = require("multer");
const path = require("path");

// -------------- insert AWS config here --------------
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const {getSignedUrl} = require("@aws-sdk/s3-request-presigner");
const multerS3 = require('multer-s3');

// configure a V3 S3Client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
// ----------------------------------------------------


async function getOgjectURL (key){
  const command =new GetObjectCommand({
    Bucket:process.env.S3_BUCKET_NAME,
    key:key
  });
  const url = await getSignedUrl(s3,command);
  return url ;
}

// Configure multer for file upload
const storage = multerS3({
  s3,
  bucket: process.env.S3_BUCKET_NAME,
   contentType: multerS3.AUTO_CONTENT_TYPE, 
  acl: 'public-read',
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random()*1e9)
                     + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = "*/*";
  if (true) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }

  // if (allowedTypes.includes(file.mimetype)) {
  //   cb(null, true);
  // } else {
  //   cb(new Error("Invalid file type"), false);
  // }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 600 * 1024 * 1024, // 600MB limit
  },
});

async function getObjectUrl(key) {
  const cmd = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  });
  return getSignedUrl(s3, cmd, { expiresIn: 31536000  });
}

module.exports = {
  upload,
  getObjectUrl,
};




// const express = require("express");
// const multer = require("multer");
// const path = require("path");
// const FileModel = require("../models/fileModel");
// const router = express.Router();

// // Configure multer for file upload
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     // Create different folders based on file type
//     let uploadPath = "uploads/";
   

//     // Create directory if it doesn't exist
//     require("fs").mkdirSync(uploadPath, { recursive: true });
//     cb(null, uploadPath);
//   },
//   filename: function (req, file, cb) {
//     // Generate unique filename
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(null, uniqueSuffix + path.extname(file.originalname));
//   },
// });

// // File filter
// const fileFilter = (req, file, cb) => {
//   // Add allowed file types
//   const allowedTypes = [
//     "image/jpeg",
//     "image/png",
//     "image/gif",
//     "video/mp4",
//     "video/webm",
//     "audio/mpeg",
//     "audio/wav",
//     "application/pdf",
//     "application/msword",
//     "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//     "text/plain",
//   ];

//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error("Invalid file type"), false);
//   }
// };

// const upload = multer({
//   storage: storage,
//   fileFilter: fileFilter,
//   limits: {
//     fileSize: 50 * 1024 * 1024, // 50MB limit
//   },
// });

// // File upload endpoint
// router.post("/upload", upload.single("file"), async (req, res) => {
//   try {
//     const file = req.file;

//     // Save file details to your database
//     const fileDoc = await FileModel.create({
//       filename: file.originalname,
//       path: file.path,
//       type: file.mimetype,
//       size: file.size,
//       userId: req.user.id, // Assuming you have user authentication
//       uploadDate: new Date(),
//     });

//     // Return the file URL and type
//     res.status(200).json({
//       fileUrl: `${process.env.SERVER_URL}/${file.path}`,
//       fileType: file.mimetype,
//     });
//   } catch (error) {
//     console.error("Upload error:", error);
//     res.status(500).json({ error: "Upload failed" });
//   }
// });

// module.exports = router;
