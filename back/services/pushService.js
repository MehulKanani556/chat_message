const DeviceToken = require("../models/deviceTokenModel");

let admin = null;
let firebaseReady = false;

function getFirebaseAdmin() {
  if (firebaseReady) return admin;
  firebaseReady = true;

  try {
    admin = require("firebase-admin");

    if (admin.apps.length) return admin;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      return admin;
    }

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      return admin;
    }

    admin = null;
    console.warn("Firebase Admin is not configured. Push notifications are disabled.");
  } catch (error) {
    admin = null;
    console.warn("Firebase Admin is not available. Push notifications are disabled.", error.message);
  }

  return admin;
}

function compactData(data) {
  return Object.entries(data).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null) acc[key] = String(value);
    return acc;
  }, {});
}

function isInvalidTokenError(error) {
  const code = error?.errorInfo?.code || error?.code;
  return [
    "messaging/registration-token-not-registered",
    "messaging/invalid-registration-token",
    "messaging/invalid-argument",
  ].includes(code);
}

async function sendDataPushToUsers(userIds, data) {
  const firebase = getFirebaseAdmin();
  if (!firebase || !userIds?.length) return { sent: 0, skipped: true };

  const tokens = await DeviceToken.find({
    userId: { $in: userIds },
    isActive: true,
    fcmToken: { $exists: true, $ne: "" },
  });

  if (!tokens.length) return { sent: 0 };

  const tokenValues = tokens.map((token) => token.fcmToken);
  const response = await firebase.messaging().sendEachForMulticast({
    tokens: tokenValues,
    data: compactData(data),
    android: {
      priority: "high",
      ttl: 1000 * 60 * 60 * 24,
    },
    apns: {
      headers: {
        "apns-priority": "10",
        "apns-expiration": `${Math.floor(Date.now() / 1000) + 60 * 60 * 24}`,
      },
      payload: {
        aps: {
          contentAvailable: true,
        },
      },
    },
  });

  const invalidTokens = [];
  response.responses.forEach((item, index) => {
    if (!item.success && isInvalidTokenError(item.error)) {
      invalidTokens.push(tokenValues[index]);
    }
  });

  if (invalidTokens.length) {
    await DeviceToken.updateMany(
      { fcmToken: { $in: invalidTokens } },
      { $set: { isActive: false } }
    );
  }

  return { sent: response.successCount, failed: response.failureCount };
}

module.exports = {
  sendDataPushToUsers,
};
