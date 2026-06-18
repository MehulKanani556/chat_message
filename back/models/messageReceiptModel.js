const mongoose = require("mongoose");

const messageReceiptSchema = new mongoose.Schema(
  {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "message",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    deviceId: {
      type: String,
      default: "unknown",
    },
    type: {
      type: String,
      enum: ["delivered", "read"],
      required: true,
      index: true,
    },
    deliveredAt: Date,
    readAt: Date,
  },
  { timestamps: true, versionKey: false }
);

messageReceiptSchema.index(
  { messageId: 1, userId: 1, deviceId: 1, type: 1 },
  { unique: true }
);

module.exports = mongoose.model("messageReceipt", messageReceiptSchema);
