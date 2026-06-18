const Message = require("../models/messageModel");
const Group = require("../models/groupModel");
const User = require("../models/userModels");
const MessageCounter = require("../models/messageCounterModel");
const MessageEvent = require("../models/messageEventModel");
const MessageReceipt = require("../models/messageReceiptModel");
const { sendDataPushToUsers } = require("./pushService");

function asString(value) {
  if (value === undefined || value === null) return "";
  return value.toString();
}

function previewForContent(content = {}) {
  if (content.type === "file") return content.content || "Attachment";
  if (content.type === "call") return "Call";
  if (content.type === "system") return content.content || "System message";
  return content.content || "";
}

async function nextEventId() {
  const counter = await MessageCounter.findByIdAndUpdate(
    "message_events",
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return counter.seq;
}

async function getGroupRecipientIds(groupId, senderId) {
  const group = await Group.findById(groupId);
  if (!group?.members?.length) return [];
  return group.members
    .map((memberId) => memberId.toString())
    .filter((memberId) => memberId !== senderId.toString());
}

async function getMessageRecipients(message, explicitRecipients) {
  if (explicitRecipients?.length) {
    return [...new Set(explicitRecipients.map(asString).filter(Boolean))];
  }

  const group = await Group.findById(message.receiver);
  if (group) return getGroupRecipientIds(message.receiver, message.sender);

  return [message.receiver.toString()].filter(
    (recipientId) => recipientId !== message.sender.toString()
  );
}

async function createMessageEvent({ message, type = "message_created", recipients }) {
  const recipientIds = await getMessageRecipients(message, recipients);
  const eventId = await nextEventId();
  const event = await MessageEvent.create({
    eventId,
    type,
    message: message._id,
    chat: message.receiver,
    sender: message.sender,
    recipients: recipientIds,
    payload: {
      messageId: message._id.toString(),
      chatId: message.receiver.toString(),
      senderId: message.sender.toString(),
      receiverId: message.receiver.toString(),
      messageType: message.content?.type || message.messageType || "text",
      preview: previewForContent(message.content),
      createdAt: message.createdAt,
    },
  });
  return event;
}

async function sendPushForMessage({ message, event, recipients }) {
  const recipientIds = recipients?.length
    ? recipients.map(asString)
    : event.recipients.map(asString);
  if (!recipientIds.length) return;

  const [sender, group] = await Promise.all([
    User.findById(message.sender).select("userName email"),
    Group.findById(message.receiver).select("userName"),
  ]);

  await sendDataPushToUsers(recipientIds, {
    type: "chat_message",
    message_id: message._id,
    chat_id: message.receiver,
    sender_id: message.sender,
    sender_name: sender?.userName || sender?.email || "New message",
    message_type: message.content?.type || message.messageType || "text",
    preview: previewForContent(message.content),
    event_id: event.eventId,
    is_group: Boolean(group),
    chat_name: group?.userName || "",
  });
}

async function createEventAndPush(message, options = {}) {
  const event = await createMessageEvent({
    message,
    type: options.type,
    recipients: options.recipients,
  });
  await sendPushForMessage({ message, event, recipients: options.recipients });
  return event;
}

function emitToUserIfAvailable(userId, event, data) {
  const io = global.io;
  if (!io) return;
  const manager = require("../socketManager/SocketManager");
  manager.emitToUser?.(userId.toString(), event, data);
}

async function markDelivered({ messageIds, userId, deviceId = "unknown", deliveredAt = new Date() }) {
  const uniqueMessageIds = [...new Set((messageIds || []).map(asString).filter(Boolean))];
  const updates = [];

  for (const messageId of uniqueMessageIds) {
    const message = await Message.findById(messageId);
    if (!message) continue;

    await MessageReceipt.updateOne(
      { messageId, userId, deviceId, type: "delivered" },
      { $setOnInsert: { deliveredAt } },
      { upsert: true }
    );

    await Message.updateOne(
      { _id: messageId, "deliveredBy.userId": { $ne: userId } },
      {
        $addToSet: {
          deliveredBy: {
            userId,
            deviceId,
            deliveredAt,
          },
        },
      }
    );

    if (message.sender.toString() !== userId.toString() && message.status === "sent") {
      await Message.findByIdAndUpdate(messageId, { status: "delivered" });
      emitToUserIfAvailable(message.sender, "message-sent-status", {
        messageId,
        status: "delivered",
        deliveredBy: userId,
      });
    }

    updates.push(messageId);
  }

  return updates;
}

async function markRead({ chatId, messageIds, userId, deviceId = "unknown", readAt = new Date() }) {
  const uniqueMessageIds = [...new Set((messageIds || []).map(asString).filter(Boolean))];
  const group = chatId ? await Group.findById(chatId) : null;

  for (const messageId of uniqueMessageIds) {
    const message = await Message.findById(messageId);
    if (!message) continue;

    await MessageReceipt.updateOne(
      { messageId, userId, deviceId, type: "read" },
      { $setOnInsert: { readAt } },
      { upsert: true }
    );

    if (group) {
      await Message.findByIdAndUpdate(messageId, {
        $addToSet: {
          readBy: {
            userId,
            readAt,
          },
        },
      });
      group.members.forEach((memberId) => {
        emitToUserIfAvailable(memberId, "group-message-read-update", {
          messageId,
          readerId: userId,
          groupId: chatId,
          status: "read",
        });
      });
    } else {
      await Message.findByIdAndUpdate(messageId, { status: "read" });
      emitToUserIfAvailable(message.sender, "message-read-update", {
        messageId,
        readerId: userId,
        status: "read",
      });
    }
  }

  return uniqueMessageIds;
}

module.exports = {
  createEventAndPush,
  createMessageEvent,
  getGroupRecipientIds,
  markDelivered,
  markRead,
  previewForContent,
};
