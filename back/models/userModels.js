const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    userName: {
      type: String,
      // require: true,
    },
    email: {
      type: String,
      // require: true,
      // unique: true,
    },
    password: {
      type: String,
      // require: true,
    },
    otp: {
      type: Number,
    },
    photo: {
      type: String,
    },
    mobileNumber: {
      type: String,
    },
    dob: {
      type: Date,
    },
    bio: {
      type: String,
    },
    archiveUsers: {
      type: Array,
      default: [],
    },
    groupToJoin: {
      type: String,
      default: "Everyone",
    },
    profilePhoto: {
      type: String,
      default: "Everyone",
    },
    blockedUsers: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("user", userSchema);
