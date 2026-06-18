const mongoose = require("mongoose");

const messageEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["message_created", "message_updated", "message_deleted"],
      default: "message_created",
      index: true,
    },
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "message",
      required: true,
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    recipients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        index: true,
      },
    ],
    payload: Object,
  },
  { timestamps: true, versionKey: false }
);

messageEventSchema.index({ recipients: 1, eventId: 1 });
messageEventSchema.index({ sender: 1, eventId: 1 });

module.exports = mongoose.model("messageEvent", messageEventSchema);
