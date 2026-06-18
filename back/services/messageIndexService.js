const Message = require("../models/messageModel");

const CLIENT_MESSAGE_INDEX_NAME = "clientMessageId_1_sender_1";

const hasClientMessagePartialFilter = (index) =>
  Boolean(index?.partialFilterExpression?.clientMessageId);

exports.ensureMessageIndexes = async () => {
  try {
    const collection = Message.collection;
    const indexes = await collection.indexes();
    const clientMessageIndex = indexes.find(
      (index) => index.name === CLIENT_MESSAGE_INDEX_NAME
    );

    if (
      clientMessageIndex &&
      !hasClientMessagePartialFilter(clientMessageIndex)
    ) {
      await collection.dropIndex(CLIENT_MESSAGE_INDEX_NAME);
      console.log("Dropped legacy clientMessageId unique index");
    }

    await collection.updateMany(
      { clientMessageId: null },
      { $unset: { clientMessageId: "" } }
    );

    await Message.syncIndexes();
  } catch (error) {
    console.error("Failed to ensure message indexes:", error);
  }
};
