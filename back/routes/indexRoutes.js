const express = require("express");
const {
  createUser,
  getAllUsers,
  getAllMessageUsers,
  updateUser,
  getSingleUser,
  getAllCallUsers,
  updateUserGroupToJoin,
  updateUserProfilePhotoPrivacy,
  archiveUser,
  blockUser,
  deleteChat,
  pinChat,
  muteUsers,
  mute,
  getDevices, removeDevice 
} = require("../controller/userController");
const {
  userLogin,
  googleLogin,
  forgotPassword,
  verifyOtp,
  changePassword,
  sendOtpToMobile,
  verifyMobileOtp,
} = require("../auth/auth");
const { getOnlineUsers } = require("../socketManager/SocketManager");
const {
  getMessageHistory,
  getAllMessages,
  deleteMessage,
  updateMessage,
  clearChat,
} = require("../controller/messageController");
const {upload} = require("../helper/upload");
const uploadController = require("../controller/uploadController");
const {
  createGroup,
  updateGroup,
  deleteGroup,
  getAllGroups,
  getGroupById,
  leaveGroup,
  addParticipants,
} = require("../controller/groupController");
const { handleQrLogin, getSessionStatus, logoutDevice } = require('../controller/authController');
  const { auth } = require("../helper/auth");

const indexRoutes = express.Router();

// Auth Routes
indexRoutes.post('/mobile-otp', sendOtpToMobile);
indexRoutes.post('/verify-mobile-otp', verifyMobileOtp);
indexRoutes.post("/usrLogin", userLogin);
indexRoutes.post("/google-login", googleLogin);
indexRoutes.post("/forgotPassword", forgotPassword);
indexRoutes.post("/verifyOtp", verifyOtp);
indexRoutes.post("/changePassword", changePassword);

// User Routes
indexRoutes.post("/createUser", createUser);
indexRoutes.get("/allUsers", auth, getAllUsers);
indexRoutes.get("/allMessageUsers", auth, getAllMessageUsers);
indexRoutes.get("/allCallUsers", auth, getAllCallUsers);
indexRoutes.put("/editUser/:id", auth, upload.single("photo"), updateUser);
indexRoutes.get("/singleUser/:id", auth, getSingleUser);
indexRoutes.post("/archiveUser", auth, archiveUser);
indexRoutes.post("/blockUser", auth, blockUser);
indexRoutes.post("/deleteChat", auth, deleteChat);
indexRoutes.post("/pinChat", auth, pinChat);
indexRoutes.post("/muteChat", auth, muteUsers);
indexRoutes.post("/updateUserGroupToJoin/:id", auth, updateUserGroupToJoin);
indexRoutes.post("/updateUserProfilePhotoPrivacy/:id", auth, updateUserProfilePhotoPrivacy);

// Group Routes
indexRoutes.post("/createGroup", auth, upload.single("photo"), createGroup);
indexRoutes.put("/updateGroup/:groupId", auth, upload.single("photo"), updateGroup);
indexRoutes.delete("/deleteGroup/:groupId", auth, deleteGroup);
indexRoutes.get("/allGroups", getAllGroups);
indexRoutes.get("/getGroupById/:groupId", auth, getGroupById);
indexRoutes.post("/leaveGroup", auth, leaveGroup);
indexRoutes.post("/addParticipants", auth, addParticipants);

// Message Routes
indexRoutes.get("/messages/:userId", auth, getMessageHistory);
indexRoutes.get("/online-users", getOnlineUsers);
indexRoutes.post("/allMessages", auth, getAllMessages);
indexRoutes.get("/deleteMessage/:messageId", auth, deleteMessage);
indexRoutes.put("/updateMessage/:messageId", auth, updateMessage);
indexRoutes.post("/clearChat", auth, clearChat);



// QR Login endpoint
indexRoutes.post('/qr-login', auth, handleQrLogin);

// Get session status
indexRoutes.get('/session/:sessionId', getSessionStatus);

// File upload endpoint
indexRoutes.post("/upload", auth, upload.single("file"), uploadController.uploadFile);

// Device management routes
indexRoutes.get('/devices', auth, getDevices);
indexRoutes.delete('/devices/:deviceId', auth, removeDevice);
indexRoutes.post('/logout-device', auth, logoutDevice);

module.exports = indexRoutes;
