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
  contentType: (req, file, cb) => {
    // Always try to use the provided mimetype, but if missing, infer from extension or default to application/octet-stream
    let mimetype = file.mimetype;
    if (!mimetype || mimetype === 'application/octet-stream') {
      const ext = path.extname(file.originalname).toLowerCase();
      // Basic mapping for common types, fallback to octet-stream for unknowns
      const extToMime = {
        '.pdf': 'application/pdf',
        '.exe': 'application/vnd.microsoft.portable-executable',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xml': 'application/xml',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.ppt': 'application/vnd.ms-powerpoint',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.webm': 'audio/webm',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.txt': 'text/plain',
        '.csv': 'text/csv',
        '.zip': 'application/zip',
        '.rar': 'application/vnd.rar',
        '.7z': 'application/x-7z-compressed',
        '.json': 'application/json',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.bmp': 'image/bmp',
        '.svg': 'image/svg+xml',
        '.mp4': 'video/mp4',
        '.avi': 'video/x-msvideo',
        '.mov': 'video/quicktime',
        '.mkv': 'video/x-matroska',
      };
      mimetype = extToMime[ext] || 'application/octet-stream';
    }
    cb(null, mimetype);
  },
  acl: 'public-read',
  metadata: (req, file, cb) => {
    // Always provide extension and mimetype for all file types
    const ext = path.extname(file.originalname) || '';
    cb(null, { 
      fieldName: file.fieldname,
      originalName: file.originalname,
      extension: ext,
      mimetype: file.mimetype || '',
    });
  },
  key: (req, file, cb) => {
    // Always preserve extension if present, otherwise try to infer from mimetype, fallback to no extension
    let ext = path.extname(file.originalname);
    let baseName = file.originalname ? path.basename(file.originalname, ext) : 'file';
    if (!ext) {
      // Try to infer from mimetype
      const mimeToExt = {
        'application/pdf': '.pdf',
        'application/vnd.microsoft.portable-executable': '.exe',
        'application/msword': '.doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
        'application/xml': '.xml',
        'application/vnd.ms-excel': '.xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
        'application/vnd.ms-powerpoint': '.ppt',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
        'audio/webm': '.webm',
        'audio/mpeg': '.mp3',
        'audio/wav': '.wav',
        'text/plain': '.txt',
        'text/csv': '.csv',
        'application/zip': '.zip',
        'application/vnd.rar': '.rar',
        'application/x-7z-compressed': '.7z',
        'application/json': '.json',
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/bmp': '.bmp',
        'image/svg+xml': '.svg',
        'video/mp4': '.mp4',
        'video/x-msvideo': '.avi',
        'video/quicktime': '.mov',
        'video/x-matroska': '.mkv',
        // Add more as needed
      };
      ext = mimeToExt[file.mimetype] || '';
    }
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + (ext || '');
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