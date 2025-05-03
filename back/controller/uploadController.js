const FileModel = require("../models/fileModel");
const path = require("path");
const { getObjectUrl } = require("../helper/upload");

const uploadController = {
  uploadFile: async (req, res) => {
    try {
      const file = req.file;
      console.log("file1");

      // grab Bearer token from the Authorization header
      const authHeader = req.headers.authorization || "";
      const token = authHeader.split(" ")[1];
      console.log("file2");

      // Save file details to your database, storing the S3 key:
      const fileDoc = await FileModel.create({
        filename: file.originalname,
        path: file.key,
        type: file.mimetype,
        size: file.size,
        userId: req.user._id, // Assuming you have user authentication
        uploadDate: new Date(),
        originalName: file.originalname,
        extension: path.extname(file.originalname),
        accessToken: token,
        awsToken: file.key,
      });
      console.log("file3");


      // use the public URL that multer-s3 already gave us
      const fileUrl = file.location;
      console.log("file4");


      // return the public URL
      res.status(200).json({
        fileUrl,
        awsToken: file.key,
        fileType: file.mimetype,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  },
};

module.exports = uploadController;
