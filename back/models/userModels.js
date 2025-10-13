const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    userName: {
      type: String,
    },
    email: {
      type: String,
    },
    password: {
      type: String,
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
    contactList:{
      type:Array,
      default:[]
    },
    archiveUsers: {
      type: Array,
      default: [],
    },
    isMobile:{
      type:Boolean,
      default:false
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
    notification:{
      type:Boolean,
      default:true
    },
    deleteChatFor: {
      type: Array,
      default: [],
    },
    pinChatFor:{
      type:Array,
      default:[],
    },
    muteUsers:{
      type:Array,
      default:[],
    },
    devices: [{
      deviceId: String,
      deviceName: String,
      deviceType: String,
      lastLogin: {
        type: Date,
        default: Date.now
      }
    }],
    refreshToken:{
      type:String
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("user", userSchema);
