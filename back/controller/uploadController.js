const FileModel = require("../models/fileModel");
const path = require("path");
const { getObjectUrl } = require("../helper/upload");

const uploadController = {
  uploadFile: async (req, res) => {
    try {
      const file = req.file;

      // grab Bearer token from the Authorization header
      const authHeader = req.headers.authorization || "";
      const token = authHeader.split(" ")[1];

      // use the public URL that multer-s3 already gave us
      const fileUrl = file.location;

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
