const mongoose = require("mongoose");

const deviceTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    deviceId: {
      type: String,
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ["android", "ios", "web", "desktop", "unknown"],
      default: "unknown",
    },
    fcmToken: String,
    apnsToken: String,
    appVersion: String,
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, versionKey: false }
);

deviceTokenSchema.index({ userId: 1, deviceId: 1, platform: 1 }, { unique: true });
deviceTokenSchema.index({ fcmToken: 1 }, { sparse: true });

module.exports = mongoose.model("deviceToken", deviceTokenSchema);
