const DeviceToken = require("../models/deviceTokenModel");

function normalizePlatform(platform) {
  if (!platform) return "unknown";
  const value = platform.toString().toLowerCase();
  if (["android", "ios", "web", "desktop"].includes(value)) return value;
  return "unknown";
}

exports.registerDevice = async (req, res) => {
  try {
    const {
      deviceId,
      platform,
      fcmToken,
      apnsToken,
      appVersion,
    } = req.body;

    if (!deviceId) {
      return res.status(400).json({ status: 400, message: "deviceId is required" });
    }

    if (!fcmToken && !apnsToken) {
      return res.status(400).json({ status: 400, message: "A push token is required" });
    }

    const device = await DeviceToken.findOneAndUpdate(
      {
        userId: req.user._id,
        deviceId,
        platform: normalizePlatform(platform),
      },
      {
        $set: {
          fcmToken,
          apnsToken,
          appVersion,
          lastSeenAt: new Date(),
          isActive: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ status: 200, message: "Device registered", device });
  } catch (error) {
    console.error("Device register error:", error);
    return res.status(500).json({ status: 500, message: error.message });
  }
};

exports.refreshDeviceToken = async (req, res) => {
  try {
    const { deviceId, platform, fcmToken, apnsToken, appVersion } = req.body;
    if (!deviceId) {
      return res.status(400).json({ status: 400, message: "deviceId is required" });
    }

    const device = await DeviceToken.findOneAndUpdate(
      {
        userId: req.user._id,
        deviceId,
        platform: normalizePlatform(platform),
      },
      {
        $set: {
          fcmToken,
          apnsToken,
          appVersion,
          isActive: true,
          lastSeenAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ status: 200, message: "Device token refreshed", device });
  } catch (error) {
    console.error("Device refresh error:", error);
    return res.status(500).json({ status: 500, message: error.message });
  }
};

exports.unregisterDevice = async (req, res) => {
  try {
    const { deviceId, platform } = req.body;
    if (!deviceId) {
      return res.status(400).json({ status: 400, message: "deviceId is required" });
    }

    await DeviceToken.updateMany(
      {
        userId: req.user._id,
        deviceId,
        ...(platform ? { platform: normalizePlatform(platform) } : {}),
      },
      { $set: { isActive: false, lastSeenAt: new Date() } }
    );

    return res.status(200).json({ status: 200, message: "Device unregistered" });
  } catch (error) {
    console.error("Device unregister error:", error);
    return res.status(500).json({ status: 500, message: error.message });
  }
};
