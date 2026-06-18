const mongoose = require("mongoose");

const messageCounterSchema = new mongoose.Schema(
  { _id: String, seq: { type: Number, default: 0 } },
  { versionKey: false }
);

module.exports = mongoose.model("messageCounter", messageCounterSchema);
