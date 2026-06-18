const { saveMessage } = require("../controller/messageController");
const Message = require("../models/messageModel");
const { deleteGroup, getGroupById, findGroupById } = require("../controller/groupController");
const User = require("../models/userModels");
const jwt = require("jsonwebtoken");
const Groups = require("../models/groupModel");
const {
  createEventAndPush,
  markRead,
  getGroupRecipientIds,
} = require("../services/messageDeliveryService");

const onlineUsers = new Map();
const deviceRooms = new Map();

const activeSessions = {};

const activeCalls = {};

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key_change_this_in_production";

// Add device type tracking
const userDevices = new Map();

// Device types and priorities (lower number = higher priority)
const DEVICE_PRIORITIES = {
  'mobile': 1,
  'tablet': 2,
  'desktop': 3,
  'web': 4
};

// Helper function to detect device type from socket
function detectDeviceType(socket) {
  // Check if device type is provided in auth
  if (socket.handshake.auth && socket.handshake.auth.deviceType) {
    return socket.handshake.auth.deviceType;
  }

  // Fallback to user agent detection
  const userAgent = socket.handshake.headers['user-agent'] || '';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android(?=.*\bMobile\b)/i.test(userAgent);

  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  return 'desktop';
}

// Helper function to emit call notification with priority
function emitCallNotificationWithPriority(userId, event, data) {
  const devices = userDevices.get(userId);
  if (!devices || devices.size === 0) return;

  // Sort devices by priority (mobile first)
  const sortedDevices = Array.from(devices.entries())
    .sort(([, a], [, b]) => a.priority - b.priority);

  // Send to highest priority device first
  if (sortedDevices.length > 0) {
    const [socketId, deviceInfo] = sortedDevices[0];
    const socket = global.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit(event, { ...data, isPrimaryDevice: true });
    }
  }

  // Send to other devices with lower priority
  for (let i = 1; i < sortedDevices.length; i++) {
    const [socketId, deviceInfo] = sortedDevices[i];
    const socket = global.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit(event, { ...data, isPrimaryDevice: false });
    }
  }
}

// Helper function to emit screen share notification with priority
function emitScreenShareNotificationWithPriority(userId, event, data) {
  const devices = userDevices.get(userId);
  if (!devices || devices.size === 0) return;

  // Sort devices by priority (mobile first)
  const sortedDevices = Array.from(devices.entries())
    .sort(([, a], [, b]) => a.priority - b.priority);

  // Send to highest priority device first
  if (sortedDevices.length > 0) {
    const [socketId, deviceInfo] = sortedDevices[0];
    const socket = global.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit(event, { ...data, isPrimaryDevice: true });
    }
  }

  // Send to other devices with lower priority
  for (let i = 1; i < sortedDevices.length; i++) {
    const [socketId, deviceInfo] = sortedDevices[i];
    const socket = global.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit(event, { ...data, isPrimaryDevice: false });
    }
  }
}

// Helper function to dismiss call from all other devices
function dismissCallFromOtherDevices(userId, roomId, acceptedSocketId) {
  const devices = userDevices.get(userId);
  if (!devices || devices.size === 0) return;

  for (const [socketId, deviceInfo] of devices) {
    if (socketId !== acceptedSocketId) {
      const socket = global.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit("call-dismissed", { roomId, reason: "accepted-on-other-device" });
      }
    }
  }
}

// Helper function to dismiss screen share from all other devices
function dismissScreenShareFromOtherDevices(userId, roomId, acceptedSocketId) {
  const devices = userDevices.get(userId);
  if (!devices || devices.size === 0) return;

  for (const [socketId, deviceInfo] of devices) {
    if (socketId !== acceptedSocketId) {
      const socket = global.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit("screen-share-dismissed", { roomId, reason: "accepted-on-other-device" });
      }
    }
  }
}

// Helper function to broadcast message read status to all user devices
function broadcastMessageReadToAllDevices(userId, data) {
  const devices = userDevices.get(userId);
  if (!devices || devices.size === 0) return;

  for (const [socketId, deviceInfo] of devices) {
    const socket = global.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit("message-read-update", data);
    }
  }
}

// Helper function to broadcast group message read status to all user devices
function broadcastGroupMessageReadToAllDevices(userId, data) {
  const devices = userDevices.get(userId);
  if (!devices || devices.size === 0) return;

  for (const [socketId, deviceInfo] of devices) {
    const socket = global.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit("group-message-read-update", data);
    }
  }
}

async function handleUserLogin(socket, userId) {
  // Add new socket connection
  let sockets = onlineUsers.get(userId) || new Set();
  sockets.add(socket.id);
  onlineUsers.set(userId, sockets);
  socket.userId = userId;

  // Track device type and priority
  const deviceType = detectDeviceType(socket);
  const priority = DEVICE_PRIORITIES[deviceType] || DEVICE_PRIORITIES['web'];

  if (!userDevices.has(userId)) {
    userDevices.set(userId, new Map());
  }

  userDevices.get(userId).set(socket.id, {
    deviceType,
    priority,
    connectedAt: Date.now()
  });

  // Broadcast updated online users list to all connected clients
  const onlineUsersList = Array.from(onlineUsers.keys());
  global.io.emit("user-status-changed", onlineUsersList);

  try {
    // Find all unread messages for this user
    const pendingMessages = await Message.find({
      receiver: userId,
      status: "sent",
    });

    if (pendingMessages.length > 0) {
      // Update status to delivered
      for (const message of pendingMessages) {
        await Message.findByIdAndUpdate(message._id, { status: "delivered" });

        // Notify sender about delivery - use emitToUser for multiple sockets
        emitToUser(message.sender.toString(), "message-sent-status", {
          messageId: message._id,
          status: "delivered",
        });
      }
    }
  } catch (error) {
    console.error("Error updating pending messages:", error);
  }
}

function emitToUser(userId, event, data, exceptSocketId = null) {
  const sockets = onlineUsers.get(userId);

  if (sockets) {
    for (const socketId of sockets) {
      if (exceptSocketId && socketId === exceptSocketId) continue;
      const s = global.io.sockets.sockets.get(socketId);
      if (s) s.emit(event, data);
    }
  }
}

function getSocketByUserId(userId) {
  const socketId = onlineUsers.get(userId);
  if (socketId && global.io && global.io.sockets) {
    return global.io.sockets.sockets.get(socketId) || global.io.sockets.get(socketId);
  }
  return null;
}

// async function handlePrivateMessage(socket, data) {
//   const { senderId, receiverId, content, replyTo, isBlocked } = data;

//   try {
//     // Save message to database with initial status 'sent'
//     const savedMessage = await saveMessage({
//       senderId,
//       receiverId,
//       content: content,
//       replyTo: replyTo,
//       status: "sent",
//       isBlocked: isBlocked,
//     });

//     if (!isBlocked) {
//       emitToUser(receiverId, "receive-message", {
//         _id: savedMessage._id,
//         sender: senderId,
//         content: savedMessage.content,
//         createdAt: savedMessage.createdAt,
//         status: "delivered",
//       });

//       await Message.findByIdAndUpdate(savedMessage._id, {
//         status: "delivered",
//       });

//       socket.emit("message-sent-status", {
//         messageId: savedMessage._id,
//         status: "delivered",
//       });
//     } else {
//       socket.emit("message-sent-status", {
//         messageId: savedMessage._id,
//         status: "sent",
//       });
//     }
//   } catch (error) {
//     console.error("Error handling private message:", error);
//     socket.emit("message-sent-status", {
//       messageId: Date.now(),
//       status: "failed",  
//       error: error.message,
//     });
//   }
// }

const cleanSlashes = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key].replace(/\\\//g, '/');
    } else if (typeof obj[key] === 'object') {
      cleanSlashes(obj[key]);
    }
  });
  return obj;
};

async function handlePrivateMessage(socket, data) {
  const { senderId, receiverId, content, replyTo, isBlocked, tempMessageId } = data;

  try {
    console.log("📥 Received private-message:");
    console.log("   Sender:", senderId);
    console.log("   Receiver:", receiverId);
    console.log("   Content type:", content?.type);
    console.log("   Temp ID:", tempMessageId);

    // Use it like this:
    const sanitizedContent = cleanSlashes(content);

    // ✅ CRITICAL FIX: Save message with correct content structure
    const savedMessage = await saveMessage({
      senderId,
      receiverId,
      content: sanitizedContent, // ✅ Pass the entire content object (includes type, fileUrl, etc.)
      replyTo: replyTo,
      status: "sent",
      isBlocked: isBlocked,
    });

    console.log("✅ Message saved with ID:", savedMessage._id);

    const event = await createEventAndPush(savedMessage, { recipients: [receiverId] });
    const serverMessageId = savedMessage._id.toString();

    if (!isBlocked) {
      // Send to receiver
      emitToUser(receiverId, "receive-message", {
        _id: serverMessageId,
        messageId: serverMessageId,
        sender: senderId,
        senderId: senderId,
        receiver: receiverId,
        receiverId: receiverId,
        content: savedMessage.content,
        createdAt: savedMessage.createdAt,
        status: "sent",
        tempMessageId: tempMessageId,
        eventId: event.eventId,
      });

      // ✅ CRITICAL: Send status back to sender with BOTH IDs
      socket.emit("message-sent-status", {
        messageId: serverMessageId,
        tempMessageId: tempMessageId,
        status: "sent",
        eventId: event.eventId,
      });

      // ✅ Echo back to sender so they see their own message
      socket.emit("private-message", {
        _id: serverMessageId,
        messageId: serverMessageId,
        tempMessageId: tempMessageId,
        sender: senderId,
        senderId: senderId,
        receiver: receiverId,
        receiverId: receiverId,
        content: savedMessage.content,
        createdAt: savedMessage.createdAt,
        status: "sent",
        eventId: event.eventId,
      });

      console.log("✅ Message delivered successfully");
    } else {
      // Blocked case
      socket.emit("message-sent-status", {
        messageId: serverMessageId,
        tempMessageId: tempMessageId,
        status: "sent",
      });
      
      console.log("⚠️ Message blocked");
    }
  } catch (error) {
    console.error("❌ Error handling private message:", error);
    console.error("Error details:", error.message);
    console.error("Stack trace:", error.stack);
    
    socket.emit("message-sent-status", {
      messageId: tempMessageId || Date.now().toString(),
      tempMessageId: tempMessageId,
      status: "failed",
      error: error.message,
    });
  }
}

// ===========================handle message read status=============================
async function handleMessageRead(socket, data) {
  const { messageId, readerId } = data;

  try {
    await markRead({ messageIds: [messageId], userId: readerId });

    // Broadcast read status to all devices of the reader
    broadcastMessageReadToAllDevices(readerId, {
      messageId,
      readerId,
      status: "read"
    });
  } catch (error) {
    console.error("Error handling message read status:", error);
  }
}

// ===========================handle group message read status=============================
async function handleGroupMessageRead(socket, data) {
  const { messageId, readerId, groupId } = data;

  try {
    // Update message to add reader to readBy array
    await Message.findByIdAndUpdate(
      messageId,
      {
        $addToSet: {
          readBy: {
            userId: readerId,
            readAt: new Date()
          }
        }
      },
      { new: true }
    );

    // Get group members to notify them about read status
    const group = await findGroupById(groupId);
    if (group && group.members) {
      group.members.forEach((memberId) => {
        // Use emitToUser to notify all sockets of each member
        emitToUser(memberId.toString(), "group-message-read", {
          messageId,
          readerId,
          groupId
        }, socket.id); // Exclude the current socket
      });
    }

    // Broadcast group read status to all devices of the reader
    broadcastGroupMessageReadToAllDevices(readerId, {
      messageId,
      readerId,
      groupId,
      status: "read"
    });
  } catch (error) {
    console.error("Error handling group message read status:", error);
  }
}

// ===========================handle typing status=============================
// function handleTypingStatus(socket, data) {
//   const { senderId, receiverId, isTyping } = data;

//   // Use emitToUser to notify all receiver's sockets
//   emitToUser(receiverId, "user-typing", {
//     userId: senderId,
//     isTyping,
//     receiverId,
//   });
// }

const typingTimers = {};
function handleTypingStatus(socket, data) {
  const { senderId, receiverId, isTyping } = data;

  // Immediately send typing update to receiver
  emitToUser(receiverId, "user-typing", {
    userId: senderId,
    isTyping,
    receiverId,
  });

  // If user is typing → start/reset timeout
  if (isTyping) {

    // Clear old timer if exists
    if (typingTimers[senderId]) {
      clearTimeout(typingTimers[senderId]);
    }

    // Auto stop typing after 3 seconds
    typingTimers[senderId] = setTimeout(() => {
      emitToUser(receiverId, "user-typing", {
        userId: senderId,
        isTyping: false,
        receiverId,
      });
      delete typingTimers[senderId];
    }, 3000);

  } else {
    // If typing:false received → immediately broadcast
    if (typingTimers[senderId]) {
      clearTimeout(typingTimers[senderId]);
      delete typingTimers[senderId];
    }

    emitToUser(receiverId, "user-typing", {
      userId: senderId,
      isTyping: false,
      receiverId,
    });
  }
}

async function handleDeleteMessage(socket, messageId) {
  try {
    // Assuming the message document contains senderId and receiverId
    const message = await Message.findById(messageId);
    if (!message) return;
    // Notify the other user about the message deletion
    // Use emitToUser to notify all receiver's sockets
    emitToUser(message.receiver.toString(), "message-deleted", messageId);
  } catch (error) {
    console.error("Error handling message deletion:", error);
  }
}

async function handleUpdateMessage(socket, data) {
  try {
    const { messageId, content } = data;
    const message = await Message.findById(messageId);
    if (!message) return;

    // Notify the other user about the message update
    // Use emitToUser to notify all receiver's sockets
    emitToUser(message.receiver.toString(), "message-updated", {
      messageId,
      content,
    });
  } catch (error) {
    console.error("Error handling message update:", error);
  }
}

// ===========================screen share=============================

function handleScreenShareRequest(socket, data) {
  socket.join(data.roomId);

  if (data.isGroup) {
    // For group sharing, forward to specific member with priority
    emitScreenShareNotificationWithPriority(data.toEmail, "screen-share-request", {
      fromEmail: data.fromEmail,
      signal: data.signal,
      groupId: data.groupId,
      isGroup: true,
      roomId: data.roomId
    });
  } else {
    // Original single-user logic with priority
    emitScreenShareNotificationWithPriority(data.toEmail, "screen-share-request", {
      fromEmail: data.fromEmail,
      signal: data.signal,
      isGroup: false,
      roomId: data.roomId
    });
  }
}

function handleScreenShareAccept(socket, data) {
  socket.join(data.roomId);

  // Send acceptance to the sender
  emitToUser(data.fromEmail, "share-accepted", {
    signal: data.signal,
    fromEmail: data.toEmail,
    groupId: data.groupId,
    isGroup: data.isGroup,
  });

  // Dismiss screen share notification from all other devices of the accepting user
  dismissScreenShareFromOtherDevices(data.toEmail, data.roomId, socket.id);
}

function handleScreenShareSignal(socket, data) {
  // Use emitToUser to notify all receiver's sockets
  emitToUser(data.toEmail, "share-signal", {
    signal: data.signal,
  });
}

// ===========================Video call=============================

async function handleCallRequest(socket, data) {
  const { fromEmail, toEmail, signal, type, participants, isGroupCall, groupId, roomId } = data;

  let isUserInCall = false;
  for (const [callRoomId, callData] of Object.entries(activeCalls)) {
    if (callData.joined.includes(toEmail) || callData.ringing.includes(toEmail)) {
      isUserInCall = true;
      break;
    }
  }

  if (isUserInCall) {
    socket.emit("user-in-call", {
      toEmail,
      message: "is currently in another call"
    });
    return;
  }

  socket.join(roomId);

  if (!activeCalls[roomId]) {
    activeCalls[roomId] = { invited: [], ringing: [], joined: [] };
  }

  const targetSockets = onlineUsers.get(toEmail);

  activeCalls[roomId].invited.push(toEmail);
  activeCalls[roomId].invited.push(fromEmail);

  if (targetSockets && targetSockets.size > 0) {
    activeCalls[roomId].ringing.push(toEmail);
  }

  if (targetSockets && targetSockets.size > 0) {
    socket.to(roomId).emit("call:update-participant-list", activeCalls[roomId]);
    socket.emit("call:update-participant-list", activeCalls[roomId]);

    // Use priority-based call notification
    emitCallNotificationWithPriority(toEmail, "call-requested", {
      fromEmail,
      signal,
      type,
      participants,
      isGroupCall,
      groupId: groupId || null,
      roomId,
    });
  }
}

const handleUserIncall = (socket, data) => {

  const { fromEmail, toEmail, signal, type, participants, isGroupCall, groupId, roomId } = data;

  const targetSocketId = onlineUsers.get(fromEmail);

  delete activeCalls[roomId];

  if (targetSocketId) {
    // Use emitToUser to notify all sender's sockets
    emitToUser(fromEmail, "user-in-call", {
      fromEmail,
      signal,
      type,
      participants,
      isGroupCall,
      groupId: groupId || null,
      roomId,
    });
  }

  socket.leave(roomId)
}

function handleCallInvite(socket, data) {
  const {
    fromEmail,
    toEmail,
    signal,
    participants,
    type,
    isGroupCall,
    roomId,
  } = data;

  let isUserInCall = false;
  for (const [callRoomId, callData] of Object.entries(activeCalls)) {
    if (callData.joined.includes(toEmail) || callData.ringing.includes(toEmail)) {
      isUserInCall = true;
      break;
    }
  }

  // console.log(data, "datadatadatadata");
  

  if (isUserInCall) {
    socket.emit("user-in-call", {
      toEmail,
      message: "is currently in another call"
    });
    return;
  }

  socket.join(roomId);

  if (!activeCalls[roomId]) {
    activeCalls[roomId] = { invited: [], ringing: [], joined: [] };
  }

  const targetSockets = onlineUsers.get(toEmail);

  activeCalls[roomId].invited.push(toEmail);
  if (targetSockets && targetSockets.size > 0) {
    activeCalls[roomId].ringing.push(toEmail);
  }

  if (targetSockets && targetSockets.size > 0) {
    socket.to(roomId).emit("call:update-participant-list", activeCalls[roomId]);
    socket.emit("call:update-participant-list", activeCalls[roomId]);

    // Use priority-based call notification
    emitCallNotificationWithPriority(toEmail, "call-invited", {
      fromEmail,
      signal,
      participants,
      type,
      isGroupCall,
      roomId,
      groupId:fromEmail
    });
  }
}

function handleParticipantJoined(socket, data) {
  const { newParticipantId, from, participants, roomId } = data;
  const targetSocketId = onlineUsers.get(data.to);

  if (targetSocketId) {

    // Use emitToUser to notify all target's sockets
    emitToUser(data.to, "participant-joined", {
      newParticipantId,
      from,
      participants,
      roomId,
    });
  }
}

function handleParticipantLeft(socket, data) {

  const { leavingUser, duration, roomId } = data;

  socket.to(roomId).emit("participant-lefted", {
    leavingUser,
    duration,
    roomId,
  });
  const call = activeCalls[roomId];


  if (call) {
    if (call?.joined && call?.joined.includes(leavingUser)) {
      call.joined = call?.joined.filter((id) => id !== leavingUser);
    }
    if (call?.invited) {
      if (!call.invited.includes(leavingUser)) {
        call.invited = [...call.invited, leavingUser];
      }
    } else {
      call.invited = [leavingUser];
    }

    socket.to(roomId).emit("call:update-participant-list", call);
  }
  socket.to(roomId).emit("participant-lefted", {
    leavingUser,
    duration,
    roomId,
  });
  socket.leave(roomId);
}
function handleRejectGroupCall(socket, data) {

  const { to,userId, groupId, duration, roomId } = data;

  // console.log(data,"datadatadatadata");
  

  const call = activeCalls[roomId];

  // console.log(call,"callcallcallcall");
  


  if (call) {  
    if(call?.ringing && call?.ringing.includes(userId)){
      // console.log("rrrrrrrrrrr");
      
      call.ringing = call?.ringing.filter((id) => id !== userId);
    } else {
      // console.log("qqqqqqqqqqq");
      if(!(call?.invited && call?.invited.includes(userId))){
        // console.log("ppppppppppppppp");
        call.invited.push(userId);
      }
    }
    socket.to(roomId).emit("call:update-participant-list", call);
  }
  socket.leave(roomId);
}

function handleCallAccept(socket, data) {
  const { signal, fromEmail, toEmail, participants, roomId } = data;

  socket.join(roomId);
  const call = activeCalls[roomId];

  if (call) {
    if (!call.joined.includes(fromEmail)) {
      call.joined.push(fromEmail);
      call.invited = call.invited.filter((id) => id != fromEmail);
    }
    if (!call.joined.includes(toEmail)) {
      call.joined.push(toEmail);
      call.invited = call.invited.filter((id) => id != toEmail);
    }
    call.ringing = call.ringing.filter((id) => id !== fromEmail);
    call.ringing = call.ringing.filter((id) => id !== toEmail);
  }

  const targetSockets = onlineUsers.get(fromEmail);

  if (targetSockets && targetSockets.size > 0) {
    // Send call acceptance to the caller
    emitToUser(fromEmail, "call-accepted", {
      signal,
      fromEmail: toEmail,
      roomId,
    });

    // Emit to all participants in the room including the accepting user
    socket.to(roomId).emit("call:update-participant-list", call);
    socket.emit("call:update-participant-list", call);

    // Dismiss call notification from all other devices of the accepting user
    dismissCallFromOtherDevices(toEmail, roomId, socket.id);
  }
}

function handleCallSignal(socket, data) {
  const { signal, to, from, roomId } = data;
  const targetSocketId = onlineUsers.get(to);

  if (targetSocketId) {
    emitToUser(to, "call-signal", {
      signal,
      from,
      roomId,
    });
  }
}

function handleCallEnd(socket, data) {
  const { to, from, duration, roomId } = data;
  const targetSocketId = onlineUsers.get(to);

  if (targetSocketId) {

    const call = activeCalls[roomId];
    if (call) {

      call.joined = call.joined.filter((id) => id !== from);
      call.joined = call.joined.filter((id) => id !== to);
      call.ringing = call.ringing.filter((id) => id !== from);
      call.ringing = call.ringing.filter((id) => id !== to);
      call.invited.push(from);
      call.invited.push(to);
    }

    socket.to(roomId).emit("call:update-participant-list", call);

    // Use emitToUser to notify all receiver's sockets
    emitToUser(to, "call-ended", {
      from,
      duration,
      roomId,
    });

    socket.leave(roomId);
  }
}

// ================ Handle save call message================
async function handleSaveCallMessage(socket, data) {
  try {
    const {
      senderId,
      receiverId,
      callType,
      status,
      duration,
      timestamp,
      callfrom,
      joined,
    } = data;
    // Format duration string if exists
    let durationStr = "";
    if (duration) {
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      durationStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }

    // Create message content based on status
    let content = {
      type: "call",
      callType,
      status,
      timestamp,
      callfrom,
      joined,
    };

    // Add duration for ended calls
    if (status === "ended") {
      content.duration = durationStr;
    }

    // Save the message
    const savedMessage = await saveMessage({
      senderId,
      receiverId,
      content,
    });

    // Use emitToUser to notify all sockets of both sender and receiver
    emitToUser(senderId, "receive-message", savedMessage);
    emitToUser(receiverId, "receive-message", savedMessage);
  } catch (error) {
    console.error("Error saving call message:", error);
  }
}

// ===========================group=============================

async function handleCreateGroup(socket, data) {
  try {
    const { members, userName, createdBy } = data;

    const createdByUser = await User.findById(createdBy);

    // Create system message for group creation
    const systemMessage = await saveMessage({
      senderId: createdBy,
      receiverId: data._id, // group ID
      content: {
        type: "system",
        content: `**${createdByUser.userName}** has created the group`,
      },
    });

    // Create system messages for each member added
    for (const memberId of members) {
      const memberName = await User.findById(memberId); // Function to get user name by ID
      if (createdBy !== memberId) {
        await saveMessage({
          senderId: createdBy,
          receiverId: data._id,
          content: {
            type: "system",
            content: `**${createdByUser.userName}** added **${memberName.userName}** `,
          },
        });
      }
    }

    // Emit to all members of the group - use emitToUser for each member
    members.forEach((memberId) => {
      emitToUser(memberId.toString(), "group-updated", {
        type: "created",
        group: data,
      });
    });
  } catch (error) {
    console.error("Error creating group:", error);
  }
}

async function handleUpdateGroup(socket, data) {
  const { groupId, name, members, updateType, user, newData, oldData, removeId } = data;

  try {
    const userData = await User.findById(user);
    let contentData;

    if (updateType == "name") {
      contentData = `**${userData.userName}** Changed Group name  **${oldData}** to  **${newData}**`;
    } else if (updateType == "bio") {
      contentData = `**${userData.userName}** Changed Group bio  **${oldData}** to  **${newData}**`;
    } else if (updateType == "icon") {
      contentData = `**${userData.userName}** Changed Group icon`;
    }

    if (updateType == "name" || updateType == "bio" || updateType == "icon") {
      await saveMessage({
        senderId: groupId,
        receiverId: groupId,
        content: {
          type: "system",
          content: contentData,
        },
      });
    }

    // Use emitToUser for each member
    members.forEach((memberId) => {
      emitToUser(memberId, "group-updated", {
        type: "updated",
        // group: updatedGroup,
      });
    });
    if (removeId) {
      emitToUser(removeId, "group-updated", {
        type: "updated",
        groupId,
      });
    }
  } catch (error) {
    console.error("Error updating group:", error);
  }
}

async function handleDeleteGroup(socket, groupId) {
  try {
    const group = await getGroupById(groupId);
    await deleteGroup(groupId);

    // Use emitToUser for each member
    group.members.forEach((memberId) => {
      emitToUser(memberId.toString(), "group-updated", {
        type: "deleted",
        groupId,
      });
    });
  } catch (error) {
    console.error("Error deleting group:", error);
  }
}

async function handleGroupMessage(socket, data) {
  const { groupId, senderId, content } = data;

  try {
    const { replyTo, ...contentWithoutReplyTo } = content || {};
    const savedMessage = await saveMessage({
      senderId,
      receiverId: groupId,
      content: contentWithoutReplyTo ? contentWithoutReplyTo : content,
      replyTo: replyTo,
      isGroupMessage: true,
    });
    const recipients = await getGroupRecipientIds(groupId, senderId);
    const event = await createEventAndPush(savedMessage, { recipients });

    // Use emitToUser for each member instead of direct socket emission
    const group = await findGroupById(groupId);
    if (group && group.members) {
      group.members.forEach((memberId) => {
        if (memberId.toString() !== senderId.toString()) { // Don't send to sender
          emitToUser(memberId.toString(), "receive-group", {
            _id: savedMessage._id.toString(),
            messageId: savedMessage._id.toString(),
            sender: senderId,
            senderId,
            receiver: groupId,
            receiverId: groupId,
            content: savedMessage.content,
            groupId,
            createdAt: savedMessage.createdAt,
            status: "sent",
            group: true,
            eventId: event.eventId,
          }, socket.id); // Exclude current socket
        }
      });
    }
    socket.emit("message-sent-status", {
      messageId: savedMessage._id.toString(),
      status: "sent",
      eventId: event.eventId,
    });
  } catch (error) {
    console.error("Error handling group message:", error);
  }
}

// ===========================message reaction=============================

async function handleMessageReaction(socket, data) {
  const { messageId, userId, emoji } = data;

  try {
    // Find the message
    const message = await Message.findById(messageId);
    if (!message) return;

    // Check if user already has a reaction with this emoji
    const existingReactionIndex = message.reactions.findIndex(
      reaction => reaction.userId.toString() === userId && reaction.emoji === emoji
    );

    if (existingReactionIndex !== -1) {
      // Remove existing reaction (toggle off)
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      // Add new reaction
      message.reactions.push({
        userId,
        emoji,
        createdAt: new Date(),
      });
    }

    await message.save();

    const reactionData = {
      messageId,
      userId,
      emoji,
      action: existingReactionIndex !== -1 ? 'removed' : 'added'
    };

    // Use emitToUser for both sender and receiver
    emitToUser(message.receiver.toString(), "message-reaction", reactionData);
    emitToUser(message.sender.toString(), "message-reaction", reactionData, socket.id);
  } catch (error) {
    console.error("Error handling message reaction:", error);
  }
}

// Add new function to handle removing reactions
async function handleRemoveMessageReaction(socket, data) {
  const { messageId, userId, emoji } = data;

  try {
    // Find the message
    const message = await Message.findById(messageId);
    if (!message) return;

    // Remove reaction from this user
    message.reactions = message.reactions.filter(
      reaction => !(reaction.userId.toString() === userId && reaction.emoji === emoji)
    );

    await message.save();

    const reactionData = {
      messageId,
      userId,
      emoji,
      action: 'removed'
    };

    // Use emitToUser for both sender and receiver
    emitToUser(message.receiver.toString(), "message-reaction", reactionData);
    emitToUser(message.sender.toString(), "message-reaction", reactionData, socket.id);
  } catch (error) {
    console.error("Error handling remove message reaction:", error);
  }
}

// ===========================socket connection=============================

function handleDisconnect(socket) {
  if (socket.userId) {
    // Remove from onlineUsers
    let sockets = onlineUsers.get(socket.userId);
    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        onlineUsers.delete(socket.userId);
      } else {
        onlineUsers.set(socket.userId, sockets);
      }
    }

    // Remove from userDevices
    const devices = userDevices.get(socket.userId);
    if (devices) {
      devices.delete(socket.id);
      if (devices.size === 0) {
        userDevices.delete(socket.userId);
      }
    }

    // Broadcast updated online users list
    const onlineUsersList = Array.from(onlineUsers.keys());
    global.io.emit("user-status-changed", onlineUsersList);

    // Remove userId from activeCalls
    Object.keys(activeCalls).forEach(roomId => {
      activeCalls[roomId].ringing = activeCalls[roomId].ringing.filter(id => id !== socket.userId);
      activeCalls[roomId].joined = activeCalls[roomId].joined.filter(id => id !== socket.userId);
    });
  }
}

async function getOnlineUsers(req, res) {
  const onlineUsersArray = Array.from(onlineUsers.keys());

  if (res) {
    return res.status(200).json(onlineUsersArray);
  }
  return onlineUsersArray;
}

// Add new function to handle group member retrieval
async function handleGetGroupMembers(socket, groupId) {
  try {
    const group = await findGroupById(groupId);
    if (!group) {
      socket.emit("error", { message: "Group not found" });
      return;
    }

    socket.emit("group-members", {
      members: group.members,
    });
  } catch (error) {
    console.error("Error getting group members:", error);
    socket.emit("error", { message: "Failed to get group members" });
  }
}

// async function handleForwardMessage(socket, data) {
//   const { senderId, receiverId, content, forwardedFrom } = data;

//   try {
//     // Save forwarded message to database
//     const savedMessage = await saveMessage({
//       senderId,
//       receiverId,
//       content: content,
//       forwardedFrom: forwardedFrom,
//       status: "sent",
//     });

//     // Use emitToUser to notify all receiver's sockets
//     emitToUser(receiverId, "receive-message", savedMessage);

//     await Message.findByIdAndUpdate(savedMessage._id, {
//       status: "delivered",
//     });

//     socket.emit("message-sent-status", {
//       messageId: savedMessage._id,
//       status: "delivered",
//     });
//   } catch (error) {
//     console.error("Error handling forward message:", error);
//     socket.emit("message-sent-status", {
//       messageId: Date.now(),
//       status: "failed",
//       error: error.message,
//     });
//   }
// }

// ===========================camera status=============================

async function handleForwardMessage(socket, data) {
  const { senderId, receiverId, groupId, content, forwardedFrom, isGroup } = data;

  try {
    if (isGroup && groupId) {
      // Save as group message
      const savedMessage = await saveMessage({
        senderId,
        receiverId: groupId,
        content: content,
        forwardedFrom: forwardedFrom,
        status: "sent",
        isGroupMessage: true,
      });

      // Deliver to all group members except the sender
      const group = await findGroupById(groupId);
      if (group && group.members) {
        group.members.forEach((memberId) => {
          if (memberId.toString() !== senderId.toString()) {
            emitToUser(memberId.toString(), "receive-group", {
              _id: savedMessage._id?.toString() || Date.now().toString(),
              sender: senderId,
              content: savedMessage.content,
              groupId,
              createdAt: savedMessage.createdAt || new Date().toISOString(),
              group: true,
              forwardedFrom: forwardedFrom,
            }, socket.id); // exclude current socket
          }
        });
      }

      await Message.findByIdAndUpdate(savedMessage._id, { status: "delivered" });

      socket.emit("message-sent-status", {
        messageId: savedMessage._id,
        status: "delivered",
      });
    } else {
      // Original 1:1 forward
      const savedMessage = await saveMessage({
        senderId,
        receiverId,
        content: content,
        forwardedFrom: forwardedFrom,
        status: "sent",
      });

      emitToUser(receiverId, "receive-message", savedMessage);

      await Message.findByIdAndUpdate(savedMessage._id, {
        status: "delivered",
      });

      socket.emit("message-sent-status", {
        messageId: savedMessage._id,
        status: "delivered",
      });
    }
  } catch (error) {
    console.error("Error handling forward message:", error);
    socket.emit("message-sent-status", {
      messageId: Date.now(),
      status: "failed",
      error: error.message,
    });
  }
}

function handleCameraStatusChange(socket, data) {
  const { userId, isCameraOn } = data;

  // Get all online users except the sender
  const onlineUsersList = Array.from(onlineUsers.entries());

  // Broadcast camera status to all other users
  onlineUsersList.forEach(([onlineUserId, sockets]) => {
    if (onlineUserId !== userId) {
      // Use emitToUser for each user
      emitToUser(onlineUserId, "camera-status-change", {
        userId,
        isCameraOn,
      });
    }
  });

  // Also emit to the sender's other sockets
  emitToUser(userId, "camera-status-change", {
    userId,
    isCameraOn,
  }, socket.id);
}

// ===========================mic status=============================
function handleMicStatusChange(socket, data) {
  const { userId, isMicOn, roomId } = data;
  // Get all online users except the sender
  socket.to(roomId).emit("mic-status-change", {
    userId,
    isMicOn,
    roomId
  });
}

// ===========================host control=============================

function handleRegisterAsHost(socket) {
  socket.isHost = true;
}

function handleUnregisterAsHost(socket) {
  socket.isHost = false;
  // Notify any viewers that control has been revoked
  socket.broadcast.emit('control-revoked');
}

function handleRequestControl(socket, data) {
  const { hostId } = data;

  const hostSocket = getSocketByUserId(hostId);
  if (hostSocket) {
    hostSocket.emit('control-request', {
      viewerId: socket.userId
    });
  } else {
    socket.emit('control-permission', false);
  }
}

function handleGrantControl(socket, data) {
  const { viewerId } = data;

  // Use emitToUser to emit to the viewer
  emitToUser(viewerId, 'control-permission', true);

  // Notify host that control is granted
  socket.emit('control-granted', { viewerId });
}

function handleRevokeControl(socket, data) {
  const { viewerId } = data;
  // Use emitToUser to emit to the viewer
  emitToUser(viewerId, "control-permission", false);
  // Notify host that control is revoked
  socket.emit("control-revoked-for-host", { viewerId });
}

function handleControlEvent(socket, data) {
  const { roomId, type, payload } = data;

  // Broadcast the control event to all sockets in the room
  socket.to(roomId).emit('control-event', { type, payload });
}

// =================================================================================

function initializeSocket(io) {
  io.on("connection", (socket) => {

    // Add device room joining when socket connects
    socket.on("join-device-room", (deviceId) => {
      socket.join(deviceId);
      deviceRooms.set(deviceId, socket.id);
    });

    // Handle force logout
    socket.on("force-logout", (data) => {
      const { deviceId } = data;

      // Get all sockets in the device room
      const deviceRoom = io.sockets.adapter.rooms.get(deviceId);
      if (deviceRoom) {
        // Emit force-logout event to all sockets in the device room
        io.to(deviceId).emit('force-logout', {
          message: 'You have been logged out from another device'
        });

        // Clean up the device room
        deviceRooms.delete(deviceId);
      }
    });

    // Handle session creation from website
    socket.on("create_session", (data) => {
      const { sessionId } = data;

      // Store session with TTL (Time To Live)
      activeSessions[sessionId] = {
        socketId: socket.id,
        createdAt: Date.now(),
        expires: Date.now() + 2 * 60 * 1000, // 2 minutes expiry
      };
    });

    // Handle authentication from mobile app
    socket.on("authenticate", (data) => {
      const { sessionId, userId, username } = data;

      if (activeSessions[sessionId]) {
        const sessionSocketId = activeSessions[sessionId].socketId;

        // Generate JWT token
        const token = jwt.sign({ userId, username }, JWT_SECRET, {
          expiresIn: "7d",
        });

        // Notify web client of successful authentication
        io.to(sessionSocketId).emit("auth_success", {
          sessionId,
          userId,
          username,
          token,
        });

        // Clean up the session
        delete activeSessions[sessionId];
      } else {
        // Session not found or expired
        socket.emit("auth_error", {
          message: "Invalid or expired session",
          sessionId,
        });
      }
    });

    socket.on("user-login", async (userId) => {
      handleUserLogin(socket, userId);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      // Remove from device room if exists
      const rooms = Array.from(socket.rooms);
      rooms.forEach(room => {
        if (room !== socket.id) {
          socket.leave(room);
        }
      });
      handleDisconnect(socket);
    });

    // Handle private messages
    socket.on("private-message", (data) => handlePrivateMessage(socket, data));

    // Add handler for message read status
    socket.on("message-read", (data) => handleMessageRead(socket, data));
    socket.on("group-message-read", (data) => handleGroupMessageRead(socket, data));

    // Handle typing status
    socket.on("typing-status", (data) => handleTypingStatus(socket, data));

    // Handle message deletion
    socket.on("delete-message", (messageId) =>
      handleDeleteMessage(socket, messageId)
    );

    // Handle message update
    socket.on("update-message", (data) => handleUpdateMessage(socket, data));

    // ===========================screen share=============================
    socket.on("screen-share-request", (data) => handleScreenShareRequest(socket, data));
    socket.on("share-accept", (data) => handleScreenShareAccept(socket, data));
    socket.on("share-signal", (data) => handleScreenShareSignal(socket, data));

    // ===========================Video call=============================
    socket.on("call-request", (data) => handleCallRequest(socket, data));
    socket.on("call-accept", (data) => handleCallAccept(socket, data));
    socket.on("call-signal", (data) => handleCallSignal(socket, data));
    socket.on("end-call", (data) => handleCallEnd(socket, data));
    socket.on("reject-group-call", (data) => handleRejectGroupCall(socket, data));
    socket.on("call-invite", (data) => handleCallInvite(socket, data));
    socket.on("participant-join", (data) => handleParticipantJoined(socket, data));
    socket.on("participant-left", (data) => handleParticipantLeft(socket, data));

    // ===========================save call message=============================

    socket.on("save-call-message", (data) =>
      handleSaveCallMessage(socket, data)
    );
    // ===========================group=============================
    // Add group handlers
    socket.on("create-group", (data) => handleCreateGroup(socket, data));
    socket.on("update-group", (data) => handleUpdateGroup(socket, data));
    socket.on("delete-group", (groupId) => handleDeleteGroup(socket, groupId));

    // Handle group messages
    socket.on("group-message", (data) => {
      handleGroupMessage(socket, data);
    });

    // Add new handler for getting group members
    socket.on("get-group-members", (groupId) =>
      handleGetGroupMembers(socket, groupId)
    );

    // ===========================message reaction=============================
    socket.on("message-reaction", (data) =>
      handleMessageReaction(socket, data)
    );
    socket.on("remove-message-reaction", (data) =>
      handleRemoveMessageReaction(socket, data)
    );

    // Add to socket.on handlers
    socket.on("forward-message", (data) => handleForwardMessage(socket, data));

    // Add camera status handler
    socket.on("camera-status-change", (data) => handleCameraStatusChange(socket, data));
    socket.on("mic-status-change", (data) => handleMicStatusChange(socket, data));


    // Handle QR code scanning events
    socket.on('qr-scan-success', (data) => {
      // Broadcast to all clients except sender
      socket.broadcast.emit('qr-scan-success', data);
    });

    socket.on('qr-scan-error', (data) => {
      // Broadcast to all clients except sender
      socket.broadcast.emit('qr-scan-error', data);
    });

    socket.on("user-in-call", (data) => handleUserIncall(socket, data));
    // ===========================================================================================================

    socket.on('register-as-host', () => handleRegisterAsHost(socket));
    socket.on('unregister-as-host', () => handleUnregisterAsHost(socket));
    socket.on('request-control', (data) => handleRequestControl(socket, data));
    socket.on('grant-control', (data) => handleGrantControl(socket, data));
    socket.on('revoke-control', (data) => handleRevokeControl(socket, data));
    socket.on('control-event', (data) => handleControlEvent(socket, data));
  })
}

// Clean expired sessions every minute
setInterval(() => {
  const now = Date.now();
  Object.keys(activeSessions).forEach((sessionId) => {
    if (now > activeSessions[sessionId].expires) {
      const socketId = activeSessions[sessionId].socketId;
      io.to(socketId).emit("session_expired", { sessionId });
      delete activeSessions[sessionId];
    }
  });
}, 60 * 1000);

module.exports = {
  handleDisconnect,
  getOnlineUsers,
  getSocketByUserId,
  initializeSocket,
  emitToUser,
  onlineUsers,
};
