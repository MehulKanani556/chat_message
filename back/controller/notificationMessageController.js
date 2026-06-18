const Message = require("../models/messageModel");
const MessageEvent = require("../models/messageEventModel");
const Group = require("../models/groupModel");
const { saveMessage } = require("./messageController");
const {
  createEventAndPush,
  getGroupRecipientIds,
  markDelivered,
  markRead,
} = require("../services/messageDeliveryService");

function parseEventId(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function asString(value) {
  if (value === undefined || value === null) return "";
  return value.toString();
}

async function isMessageVisibleToUser(message, userId) {
  if (!message) return false;
  if (message.sender?.toString() === userId.toString()) return true;
  if (message.receiver?.toString() === userId.toString()) return true;
  const group = await Group.findById(message.receiver);
  return Boolean(group?.members?.some((memberId) => memberId.toString() === userId.toString()));
}

exports.syncMessages = async (req, res) => {
  try {
    const afterEventId = parseEventId(req.query.afterEventId);
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 100, 500);

    const events = await MessageEvent.find({
      eventId: { $gt: afterEventId },
      $or: [{ recipients: req.user._id }, { sender: req.user._id }],
    })
      .sort({ eventId: 1 })
      .limit(limit)
      .populate({
        path: "message",
        populate: [
          { path: "sender", select: "userName email photo mobileNumber" },
          { path: "receiver", select: "userName email photo mobileNumber" },
        ],
      })
      .lean();

    const latestEventId = events.length ? events[events.length - 1].eventId : afterEventId;

    return res.status(200).json({
      status: 200,
      events: events.map((event) => ({
        eventId: event.eventId,
        type: event.type,
        message: event.message,
        chat: {
          _id: event.chat,
          isGroup: event.payload?.isGroup,
        },
      })),
      latestEventId,
      hasMore: events.length === limit,
    });
  } catch (error) {
    console.error("Message sync error:", error);
    return res.status(500).json({ status: 500, message: error.message });
  }
};

exports.getMessageById = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId)
      .populate("sender receiver", "userName email photo mobileNumber");
    if (!message) {
      return res.status(404).json({ status: 404, message: "Message not found" });
    }
    if (!(await isMessageVisibleToUser(message, req.user._id))) {
      return res.status(403).json({ status: 403, message: "Not allowed" });
    }
    return res.status(200).json({ status: 200, message });
  } catch (error) {
    console.error("Get message error:", error);
    return res.status(500).json({ status: 500, message: error.message });
  }
};

exports.markDeliveredReceipt = async (req, res) => {
  try {
    const { messageIds, deviceId, deliveredAt } = req.body;
    const delivered = await markDelivered({
      messageIds,
      userId: req.user._id,
      deviceId,
      deliveredAt: deliveredAt ? new Date(deliveredAt) : new Date(),
    });
    return res.status(200).json({ status: 200, messageIds: delivered });
  } catch (error) {
    console.error("Delivered receipt error:", error);
    return res.status(500).json({ status: 500, message: error.message });
  }
};

exports.markReadReceipt = async (req, res) => {
  try {
    const { chatId, messageIds, deviceId, readAt } = req.body;
    const read = await markRead({
      chatId,
      messageIds,
      userId: req.user._id,
      deviceId,
      readAt: readAt ? new Date(readAt) : new Date(),
    });
    return res.status(200).json({ status: 200, messageIds: read });
  } catch (error) {
    console.error("Read receipt error:", error);
    return res.status(500).json({ status: 500, message: error.message });
  }
};

exports.replyFromNotification = async (req, res) => {
  try {
    const { chatId, replyText, clientMessageId, deviceId } = req.body;
    if (!chatId || !replyText) {
      return res.status(400).json({ status: 400, message: "chatId and replyText are required" });
    }

    if (clientMessageId) {
      const existing = await Message.findOne({
        clientMessageId,
        sender: req.user._id,
      });
      if (existing) {
        return res.status(200).json({ status: 200, message: "Message already created", data: existing });
      }
    }

    const group = await Group.findById(chatId);
    const receiverId = chatId;
    const savedMessage = await saveMessage({
      senderId: req.user._id,
      receiverId,
      content: {
        type: "text",
        content: replyText,
      },
      isGroupMessage: Boolean(group),
      clientMessageId,
    });

    const recipients = group
      ? await getGroupRecipientIds(group._id, req.user._id)
      : [chatId].filter((id) => id !== req.user._id.toString());
    const event = await createEventAndPush(savedMessage, { recipients });

    const payload = {
      _id: savedMessage._id.toString(),
      messageId: savedMessage._id.toString(),
      sender: asString(req.user._id),
      senderId: asString(req.user._id),
      receiver: receiverId,
      receiverId,
      groupId: group ? receiverId : undefined,
      content: savedMessage.content,
      createdAt: savedMessage.createdAt,
      status: savedMessage.status,
      eventId: event.eventId,
      deviceId,
    };

    recipients.forEach((recipientId) => {
      const manager = require("../socketManager/SocketManager");
      manager.emitToUser?.(recipientId, group ? "receive-group" : "receive-message", payload);
    });

    return res.status(201).json({ status: 201, message: "Reply sent", data: savedMessage, eventId: event.eventId });
  } catch (error) {
    console.error("Notification reply error:", error);
    return res.status(500).json({ status: 500, message: error.message });
  }
};
