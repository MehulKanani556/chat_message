const { saveMessage } = require("../controller/messageController");
const Message = require("../models/messageModel");
const {
  deleteGroup,
  getGroupById,
  findGroupById,
} = require("../controller/groupController");
const User = require("../models/userModels");
const jwt = require("jsonwebtoken");
const Groups = require("../models/groupModel");

const onlineUsers = new Map();

// Store active sessions
const activeSessions = {};

const activeCalls = {};

// Add call room management
const callRooms = new Map();

// Add your JWT secret
const JWT_SECRET =
  process.env.JWT_SECRET || "your_jwt_secret_key_change_this_in_production";

// Helper function to manage call rooms
function createCallRoom(
  roomId,
  initiator,
  type,
  isGroupCall = false,
  groupId = null
) {
  callRooms.set(roomId, {
    id: roomId,
    initiator,
    type,
    isGroupCall,
    groupId,
    participants: new Set([initiator]),
    invitedUsers: new Set(),
    ringingUsers: new Set(),
    joinedUsers: new Set([initiator]),
    startTime: new Date(),
    endTime: null,
    duration: 0,
    status: "active",
  });
  return callRooms.get(roomId);
}

function getCallRoom(roomId) {
  return callRooms.get(roomId);
}

function updateCallRoom(roomId, updates) {
  const room = callRooms.get(roomId);
  if (room) {
    callRooms.set(roomId, { ...room, ...updates });
  }
  return callRooms.get(roomId);
}

function deleteCallRoom(roomId) {
  callRooms.delete(roomId);
}

async function handleUserLogin(socket, userId) {
  // Remove any existing socket connection for this user
  for (const [existingUserId, existingSocketId] of onlineUsers.entries()) {
    if (existingUserId === userId && existingSocketId !== socket.id) {
      const existingSocket = global.io.sockets.sockets.get(existingSocketId);
      if (existingSocket) {
        existingSocket.disconnect();
      }
      onlineUsers.delete(existingUserId);
    }
  }

  // Add new socket connection
  onlineUsers.set(userId, socket.id);
  socket.userId = userId;

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

        // Notify sender about delivery
        const senderSocketId = onlineUsers.get(message.sender.toString());
        if (senderSocketId) {
          socket.to(senderSocketId).emit("message-sent-status", {
            messageId: message._id,
            status: "delivered",
          });
        }
      }
    }
  } catch (error) {
    console.error("Error updating pending messages:", error);
  }

  // console.log("User logged in:", userId);
  // console.log("Current online users:", onlineUsersList);
}

function getSocketByUserId(userId) {
  // console.log("userId", userId, onlineUsers);
  const socketId = onlineUsers.get(userId);
  if (socketId && global.io && global.io.sockets) {
    return global.io.sockets.get(socketId);
  }
  return null;
}

async function handlePrivateMessage(socket, data) {
  const { senderId, receiverId, content, replyTo, isBlocked } = data;

  try {
    // console.log("replyTo", content);

    // Save message to database with initial status 'sent'
    const savedMessage = await saveMessage({
      senderId,
      receiverId,
      content: content,
      replyTo: replyTo,
      status: "sent", // Add initial status
      isBlocked: isBlocked,
    });

    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId && !isBlocked) {
      socket.to(receiverSocketId).emit("receive-message", {
        _id: savedMessage._id,
        sender: senderId,
        content: savedMessage.content,
        createdAt: savedMessage.createdAt,
        status: "delivered",
      });

      await Message.findByIdAndUpdate(savedMessage._id, {
        status: "delivered",
      });

      socket.emit("message-sent-status", {
        messageId: savedMessage._id,
        status: "delivered",
      });
    } else {
      socket.emit("message-sent-status", {
        messageId: savedMessage._id,
        status: "sent",
      });
    }
  } catch (error) {
    console.error("Error handling private message:", error);
    socket.emit("message-sent-status", {
      messageId: Date.now(),
      status: "failed",
      error: error.message,
    });
  }
}

// ===========================handle message read status=============================
async function handleMessageRead(socket, data) {
  const { messageId, readerId } = data;

  try {
    // Update message status to 'read' in database
    await Message.findByIdAndUpdate(messageId, { status: "read" });

    // Get sender's socket ID to notify them
    const message = await Message.findById(messageId);
    const senderSocketId = onlineUsers.get(message.sender.toString());

    if (senderSocketId) {
      // Notify sender that message was read
      socket.to(senderSocketId).emit("message-read", {
        messageId,
        readerId,
      });
    }
  } catch (error) {
    console.error("Error handling message read status:", error);
  }
}

// ===========================handle typing status=============================
function handleTypingStatus(socket, data) {
  const { senderId, receiverId, isTyping } = data;
  const receiverSocketId = onlineUsers.get(receiverId);

  if (receiverSocketId) {
    socket.to(receiverSocketId).emit("user-typing", {
      userId: senderId,
      isTyping,
      receiverId,
    });
  }
}

async function handleDeleteMessage(socket, messageId) {
  try {
    // console.log("messageId", messageId);
    // Assuming the message document contains senderId and receiverId
    const message = await Message.findById(messageId);
    if (!message) return;

    // console.log("message", message.receiver.toString());

    // Notify the other user about the message deletion
    const receiverSocketId = onlineUsers.get(message.receiver.toString());
    // console.log("receiverSocketId", receiverSocketId);
    if (receiverSocketId) {
      socket.to(receiverSocketId).emit("message-deleted", messageId);
    }
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
    const receiverSocketId = onlineUsers.get(message.receiver.toString());
    if (receiverSocketId) {
      socket.to(receiverSocketId).emit("message-updated", {
        messageId,
        content,
      });
    }
  } catch (error) {
    console.error("Error handling message update:", error);
  }
}

// ===========================screen share=============================

function handleScreenShareRequest(socket, data) {
  if (data.isGroup) {
    // For group sharing, forward to specific member
    const targetSocketId = onlineUsers.get(data.toEmail);
    if (targetSocketId) {
      socket.to(targetSocketId).emit("screen-share-request", {
        fromEmail: data.fromEmail,
        signal: data.signal,
        groupId: data.groupId,
        isGroup: true,
      });
    }
  } else {
    // Original single-user logic
    const targetSocketId = onlineUsers.get(data.toEmail);
    if (targetSocketId) {
      socket.to(targetSocketId).emit("screen-share-request", {
        fromEmail: data.fromEmail,
        signal: data.signal,
        isGroup: false,
      });
    }
  }
}

function handleScreenShareAccept(socket, data) {
  const targetSocketId = onlineUsers.get(data.fromEmail);
  if (targetSocketId) {
    socket.to(targetSocketId).emit("share-accepted", {
      signal: data.signal,
      fromEmail: data.toEmail,
      groupId: data.groupId,
      isGroup: data.isGroup,
    });
  }
}

function handleScreenShareSignal(socket, data) {
  const targetSocketId = onlineUsers.get(data.toEmail);
  if (targetSocketId) {
    socket.to(targetSocketId).emit("share-signal", {
      signal: data.signal,
    });
  }
}

// ===========================Video call=============================

async function handleCallRequest(socket, data) {
  const {
    fromEmail,
    toEmail,
    signal,
    type,
    participants,
    isGroupCall,
    groupId,
    roomId,
  } = data;

  socket.join(roomId);

  console.log("kcjvopxc============================");
  

  if (!activeCalls[roomId]) {
    activeCalls[roomId] = { invited: [], ringing: [], joined: [] };
  }

  const targetSocketId = onlineUsers.get(toEmail);
  activeCalls[roomId].invited.push(toEmail);
  activeCalls[roomId].invited.push(fromEmail);

  if (targetSocketId) {
    activeCalls[roomId].ringing.push(toEmail);
  }

  if (targetSocketId) {
    // Create or get call room
    let callRoom = getCallRoom(roomId);
    if (!callRoom) {
      callRoom = createCallRoom(roomId, fromEmail, type, isGroupCall, groupId);
    }

    // Add user to invited list
    callRoom.invitedUsers.add(toEmail);
    updateCallRoom(roomId, { invitedUsers: callRoom.invitedUsers });

    socket.to(roomId).emit("call:update-participant-list", activeCalls[roomId]);
    socket.emit("call:update-participant-list", activeCalls[roomId]);

    socket.to(targetSocketId).emit("call-request", {
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

  socket.join(roomId);

  if (!activeCalls[roomId]) {
    activeCalls[roomId] = { invited: [], ringing: [], joined: [] };
  }

  const targetSocketId = onlineUsers.get(toEmail);

  activeCalls[roomId].invited.push(toEmail);
  if (targetSocketId) {
    activeCalls[roomId].ringing.push(toEmail);
  }
  if (targetSocketId) {
    // Create or get call room
    let callRoom = getCallRoom(roomId);
    if (!callRoom) {
      callRoom = createCallRoom(roomId, fromEmail, type, isGroupCall);
    }

    // Add user to invited list
    callRoom.invitedUsers.add(toEmail);
    updateCallRoom(roomId, { invitedUsers: callRoom.invitedUsers });

    socket.to(roomId).emit("call:update-participant-list", activeCalls[roomId]);
    socket.emit("call:update-participant-list", activeCalls[roomId]);

    socket.to(targetSocketId).emit("call-invite", {
      fromEmail,
      signal,
      participants,
      type,
      isGroupCall,
      roomId,
    });
  }
}

function handleParticipantJoined(socket, data) {
  const { newParticipantId, from, participants, roomId } = data;
  const targetSocketId = onlineUsers.get(data.to);

  if (targetSocketId) {
    const callRoom = getCallRoom(roomId);
    if (callRoom) {
      // Update room state
      callRoom.participants.add(newParticipantId);
      callRoom.joinedUsers.add(newParticipantId);
      callRoom.ringingUsers.delete(newParticipantId);
      updateCallRoom(roomId, {
        participants: callRoom.participants,
        joinedUsers: callRoom.joinedUsers,
        ringingUsers: callRoom.ringingUsers,
      });
    }

    socket.to(targetSocketId).emit("participant-joined", {
      newParticipantId,
      from,
      participants,
      roomId,
    });
  }
}

function handleParticipantLeft(socket, data) {
  const { leavingUser, to, duration, roomId } = data;
  const targetSocketId = onlineUsers.get(to);

  if (targetSocketId) {
    const callRoom = getCallRoom(roomId);
    if (callRoom) {
      // Update room state
      callRoom.participants.delete(leavingUser);
      callRoom.joinedUsers.delete(leavingUser);
      callRoom.ringingUsers.delete(leavingUser);
      updateCallRoom(roomId, {
        participants: callRoom.participants,
        joinedUsers: callRoom.joinedUsers,
        ringingUsers: callRoom.ringingUsers,
      });

      // If no participants left, delete the room
      if (callRoom.participants.size === 0) {
        deleteCallRoom(roomId);
      }
    }

    const call = activeCalls[roomId];

    if (call) {
      if (call?.joined.includes(leavingUser)) {
        call.joined = call?.joined.filter((id) => id !== leavingUser);
      }
      if (!call?.invited.includes(leavingUser)) {
        call.invited = call?.invited.push(leavingUser)
      }
    }
    
    socket.to(targetSocketId).emit("participant-lefted", {
      leavingUser,
      duration,
      roomId,
    });
    socket.to(roomId).emit("call:update-participant-list", call);
  }
  socket.leave(roomId);
}

function handleCallAccept(socket, data) {
  const { signal, fromEmail, toEmail, participants, roomId } = data;

  socket.join(roomId);
  const call = activeCalls[roomId];
  console.log("call", call, roomId);

  if (call) {
    if (!call.joined.includes(fromEmail)) {
      call.joined.push(fromEmail);
      call.invited = call.invited.filter((id) => id != fromEmail)
    }
    if (!call.joined.includes(toEmail)) {
      call.joined.push(toEmail);
      call.invited = call.invited.filter((id) => id != toEmail)
    }
    call.ringing = call.ringing.filter((id) => id !== fromEmail);
    call.ringing = call.ringing.filter((id) => id !== toEmail);
  }

  const targetSocketId = onlineUsers.get(fromEmail);
  const toSocketId = onlineUsers.get(toEmail);

  if (targetSocketId) {
    const callRoom = getCallRoom(roomId);
    if (callRoom) {
      // Update room state
      callRoom.ringingUsers.delete(toEmail);
      callRoom.joinedUsers.add(toEmail);
      updateCallRoom(roomId, {
        ringingUsers: callRoom.ringingUsers,
        joinedUsers: callRoom.joinedUsers,
      });
    }

    // Send call acceptance to the caller
    socket.to(targetSocketId).emit("call-accepted", {
      signal,
      fromEmail: toEmail,
      roomId,
    });

    // Emit to all participants in the room including the accepting user
    socket.to(roomId).emit("call:update-participant-list", call);
    socket.emit("call:update-participant-list", call);
  }
}

function handleCallSignal(socket, data) {
  const { signal, to, from, roomId } = data;
  const targetSocketId = onlineUsers.get(to);

  if (targetSocketId) {
    socket.to(targetSocketId).emit("call-signal", {
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
    const callRoom = getCallRoom(roomId);
    if (callRoom) {
      // Update room state
      callRoom.status = "ended";
      callRoom.endTime = new Date();
      callRoom.duration = duration;
      updateCallRoom(roomId, {
        status: "ended",
        endTime: callRoom.endTime,
        duration: callRoom.duration,
      });

      // Delete room after a delay to allow for cleanup
      setTimeout(() => {
        deleteCallRoom(roomId);
      }, 5000);
    }

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

    socket.to(targetSocketId).emit("call-ended", {
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

    // Emit to both sender and receiver
    const senderSocket = onlineUsers.get(senderId);
    const receiverSocket = onlineUsers.get(receiverId);

    if (senderSocket) {
      socket.to(senderSocket).emit("receive-message", savedMessage);
    }
    if (receiverSocket) {
      socket.to(receiverSocket).emit("receive-message", savedMessage);
    }
  } catch (error) {
    console.error("Error saving call message:", error);
  }
}

// ===========================group=============================

async function handleCreateGroup(socket, data) {
  try {
    const { members, userName, createdBy } = data;
    console.log("members", members, data);

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

    // Emit to all members of the group
    members.forEach((memberId) => {
      const memberSocket = onlineUsers.get(memberId.toString());
      console.log("memberSocket", memberSocket);
      if (memberSocket) {
        socket.to(memberSocket).emit("group-updated", {
          type: "created",
          group: data,
        });
      }
    });
  } catch (error) {
    console.error("Error creating group:", error);
  }
}

async function handleUpdateGroup(socket, data) {
  const { groupId, name, members, updateType, user, newData, oldData } = data;
  try {
    const userData = await User.findById(user);
    let contentData;

    // console.log("icon",updateType)

    if (updateType == "name") {
      contentData = `**${userData.userName}** Changed Group name  **${oldData}** to  **${newData}**`;
    } else if (updateType == "bio") {
      contentData = `**${userData.userName}** Changed Group bio  **${oldData}** to  **${newData}**`;
    } else if (updateType == "icon") {
      contentData = `**${userData.userName}** Changed Group icon`;
    }
    // console.log("aa",contentData);
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

    members.forEach((memberId) => {
      const memberSocket = onlineUsers.get(memberId);
      if (memberSocket) {
        // console.log("aa",updatedGroup)
        socket.to(memberSocket).emit("group-updated", {
          type: "updated",
          // group: updatedGroup,
        });
      }
    });
  } catch (error) {
    console.error("Error updating group:", error);
  }
}

async function handleDeleteGroup(socket, groupId) {
  try {
    const group = await getGroupById(groupId);
    await deleteGroup(groupId);
    // Emit to all members of the group
    group.members.forEach((memberId) => {
      const memberSocket = onlineUsers.get(memberId.toString());
      if (memberSocket) {
        socket.to(memberSocket).emit("group-updated", {
          type: "deleted",
          groupId,
        });
      }
    });
  } catch (error) {
    console.error("Error deleting group:", error);
  }
}

async function handleGroupMessage(socket, data) {
  const { groupId, senderId, content } = data;
  // console.log("Handling group message:", data, socket.id);

  try {
    // Save message to database (you may need to adjust this part)
    await saveMessage({
      senderId,
      receiverId: groupId,
      content,
    });

    async function getGroupMembers(groupId) {
      // Assuming you have a way to get group members from your database or in-memory store
      const group = await findGroupById(groupId); // Implement this function to retrieve the group
      // console.log("group", group);
      return group.members
        .map((memberId) => onlineUsers.get(memberId.toString()))
        .filter(Boolean);
    }

    const groupMembers = await getGroupMembers(groupId);
    // console.log("Group members' socket IDs:", groupMembers); // Log the socket IDs

    groupMembers.forEach((memberSocketId) => {
      if (memberSocketId !== socket.id) {
        socket.to(memberSocketId).emit("receive-group", {
          _id: Date.now().toString(),
          sender: senderId,
          content: content,
          createdAt: new Date().toISOString(),
        });
      }
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

    // Remove existing reaction from this user if any
    // message.reactions = message.reactions.filter(
    //   reaction => reaction.userId.toString() !== userId
    // );

    // Add new reaction
    message.reactions.push({
      userId,
      emoji,
      createdAt: new Date(),
    });

    await message.save();

    // Emit to sender and receiver
    const receiverSocketId = onlineUsers.get(message.receiver.toString());
    const senderSocketId = onlineUsers.get(message.sender.toString());

    const reactionData = {
      messageId,
      userId,
      emoji,
    };

    if (receiverSocketId) {
      socket.to(receiverSocketId).emit("message-reaction", reactionData);
    }
    if (senderSocketId && senderSocketId !== socket.id) {
      socket.to(senderSocketId).emit("message-reaction", reactionData);
    }
  } catch (error) {
    console.error("Error handling message reaction:", error);
  }
}

// ===========================socket connection=============================

function handleDisconnect(socket) {
  if (socket.userId) {
    onlineUsers.delete(socket.userId);
    // Broadcast updated online users list
    const onlineUsersList = Array.from(onlineUsers.keys());
    global.io.emit("user-status-changed", onlineUsersList);

    // console.log("User disconnected:", socket.userId);
    // console.log("Current online users:", onlineUsersList);
  }
}

async function getOnlineUsers(req, res) {
  // console.log("onlineUsers", onlineUsers);
  const onlineUsersArray = Array.from(onlineUsers.keys());
  // console.log("onlineUsersArray", onlineUsersArray);

  return res.status(200).json(onlineUsersArray);
  // return onlineUsersArray;
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

async function handleForwardMessage(socket, data) {
  const { senderId, receiverId, content, forwardedFrom } = data;

  try {
    console.log("content", data);
    // Save forwarded message to database
    const savedMessage = await saveMessage({
      senderId,
      receiverId,
      content: content,
      forwardedFrom: forwardedFrom,
      status: "sent",
    });

    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      socket.to(receiverSocketId).emit("receive-message", savedMessage);

      await Message.findByIdAndUpdate(savedMessage._id, {
        status: "delivered",
      });

      socket.emit("message-sent-status", {
        messageId: savedMessage._id,
        status: "delivered",
      });
    } else {
      socket.emit("message-sent-status", {
        messageId: savedMessage._id,
        status: "sent",
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

// ===========================camera status=============================
function handleCameraStatusChange(socket, data) {
  const { userId, isCameraOn } = data;

  console.log(
    `[Camera Status] Backend received: User ${userId} camera status change to ${isCameraOn ? "ON" : "OFF"
    }`
  );

  // Get all online users except the sender
  const onlineUsersList = Array.from(onlineUsers.entries());

  console.log(
    `[Camera Status] Broadcasting to ${onlineUsersList.length - 1} other users`
  );

  // Broadcast camera status to all other users
  onlineUsersList.forEach(([onlineUserId, socketId]) => {
    if (onlineUserId !== userId) {
      console.log(`[Camera Status] Sending update to user ${onlineUserId}`);
      socket.to(socketId).emit("camera-status-change", {
        userId,
        isCameraOn,
      });
    }
  });
}

function initializeSocket(io) {
  io.on("connection", (socket) => {
    console.log("New socket connection:", socket.id);

    // Handle session creation from website
    socket.on("create_session", (data) => {
      const { sessionId } = data;
      console.log("Session created:", sessionId);

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

        console.log(
          `User ${userId} (${username}) authenticated for session ${sessionId}`
        );

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
    socket.on("disconnect", () => handleDisconnect(socket));

    // Handle private messages
    socket.on("private-message", (data) => handlePrivateMessage(socket, data));

    // Add handler for message read status
    socket.on("message-read", (data) => handleMessageRead(socket, data));

    // Handle typing status
    socket.on("typing-status", (data) => handleTypingStatus(socket, data));

    // Handle message deletion
    socket.on("delete-message", (messageId) =>
      handleDeleteMessage(socket, messageId)
    );

    // Handle message update
    socket.on("update-message", (data) => handleUpdateMessage(socket, data));

    // ===========================screen share=============================
    socket.on("screen-share-request", (data) =>
      handleScreenShareRequest(socket, data)
    );
    socket.on("share-accept", (data) => handleScreenShareAccept(socket, data));
    socket.on("share-signal", (data) => handleScreenShareSignal(socket, data));

    // ===========================Video call=============================
    socket.on("call-request", (data) => handleCallRequest(socket, data));
    socket.on("call-accept", (data) => handleCallAccept(socket, data));
    socket.on("call-signal", (data) => handleCallSignal(socket, data));
    socket.on("end-call", (data) => handleCallEnd(socket, data));
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
    // socket.on("create-group", (data) => console.log("create-group", data));
    socket.on("update-group", (data) => handleUpdateGroup(socket, data));
    socket.on("delete-group", (groupId) => handleDeleteGroup(socket, groupId));

    // Handle group messages
    socket.on("group-message", (data) => handleGroupMessage(socket, data));

    // Add new handler for getting group members
    socket.on("get-group-members", (groupId) =>
      handleGetGroupMembers(socket, groupId)
    );

    // ===========================message reaction=============================
    socket.on("message-reaction", (data) =>
      handleMessageReaction(socket, data)
    );

    // Add to socket.on handlers
    socket.on("forward-message", (data) => handleForwardMessage(socket, data));

    // Add camera status handler
    socket.on("camera-status-change", (data) =>
      handleCameraStatusChange(socket, data)
    );

    // Handle QR code scanning events
    socket.on('qr-scan-success', (data) => {
      console.log('QR scan success:', data);
      // Broadcast to all clients except sender
      socket.broadcast.emit('qr-scan-success', data);
    });

    socket.on('qr-scan-error', (data) => {
      console.log('QR scan error:', data);
      // Broadcast to all clients except sender
      socket.broadcast.emit('qr-scan-error', data);
    });

    // ===========================================================================================================
  });
}

// Clean expired sessions every minute
setInterval(() => {
  const now = Date.now();
  Object.keys(activeSessions).forEach((sessionId) => {
    if (now > activeSessions[sessionId].expires) {
      const socketId = activeSessions[sessionId].socketId;
      io.to(socketId).emit("session_expired", { sessionId });
      delete activeSessions[sessionId];
      console.log("Session expired:", sessionId);
    }
  });
}, 60 * 1000);

module.exports = {
  handleDisconnect,
  getOnlineUsers,
  getSocketByUserId,
  initializeSocket,
  onlineUsers, // Export if needed elsewhere
  createCallRoom,
  getCallRoom,
  updateCallRoom,
  deleteCallRoom,
};
