const FileModel = require("../models/fileModel");
const path = require("path");

const uploadController = {
  uploadFile: async (req, res) => {
    try {
      const file = req.file;
      // console.log("file", file);

      // Save file details to your database
      const fileDoc = await FileModel.create({
        filename: file.originalname,
        path: file.path,
        type: file.mimetype,
        size: file.size,
        userId: req.user._id, // Assuming you have user authentication
        uploadDate: new Date(),
      });

      // Return the complete file URL and type
      const baseUrl = process.env.SERVER_URL || 'https://chat-message-0fml.onrender.com';
      const filePath = file.path.replace(/\\/g, '/'); // Convert Windows backslashes to forward slashes
      res.status(200).json({
        fileUrl: `${baseUrl}/${filePath}`,
        fileType: file.mimetype,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  },
};

module.exports = uploadController;
