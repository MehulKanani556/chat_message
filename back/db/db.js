const mongoose = require("mongoose");
const { ensureMessageIndexes } = require("../services/messageIndexService");

exports.connectDB = async (req, res) => {
  try {
    await mongoose.connect(process.env.MONGODB_PATH);
    console.log("DB IS Connected");
    await ensureMessageIndexes();
  } catch (error) {
    console.log(error);

    if (res) {
      return res
        .status(500)
        .json({ status: 500, message: error.message });
    }

    throw error;
  }
};
