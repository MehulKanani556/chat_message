const jwt = require('jsonwebtoken');
const User = require('../models/userModels');

// Store active QR sessions
const activeSessions = new Map();

// Clean up expired sessions every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [sessionId, session] of activeSessions.entries()) {
        if (now - session.timestamp > 5 * 60 * 1000) {
            activeSessions.delete(sessionId);
        }
    }
}, 5 * 60 * 1000);

// QR Login handler
const handleQrLogin = async (req, res) => {
    try {
        const { qrData, deviceInfo } = req.body;
        const { sessionId, timestamp } = qrData;

        // console.log('QR data:', qrData);
        console.log('Device info:', deviceInfo);

        // Validate QR data
        if (!sessionId || !timestamp) {
            return res.status(400).json({ message: 'Invalid QR code data' });
        }

        // Check if QR code is expired (5 minutes)
        const currentTime = Date.now();
        const qrTime = new Date(timestamp).getTime();
        if (currentTime - qrTime > 5 * 60 * 1000) {
            return res.status(400).json({ message: 'QR code has expired' });
        }

        // Get the logged-in user's data from the auth middleware
        const { _id } = req.user;

        // Get full user data
        const user = await User.findById(_id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Store device information
        if (deviceInfo) {
            const { deviceId, deviceName, deviceType } = deviceInfo;
            
            // Check if device already exists
            const existingDeviceIndex = user.devices.findIndex(d => d.deviceId === deviceId);
            
            if (existingDeviceIndex !== -1) {
                // Update existing device's last login
                user.devices[existingDeviceIndex].lastLogin = new Date();
            } else {
                // Check if user has reached device limit (5 devices)
                if (user.devices.length >= 5) {
                    return res.status(403).json({ 
                        message: 'Device limit reached. You can only log in from 5 devices. Please log out from another device first.' 
                    });
                }
                
                // Add new device
                user.devices.push({
                    deviceId,
                    deviceName,
                    deviceType,
                    lastLogin: new Date()
                });
            }
            
            await user.save();
        }

        // Store session data
        activeSessions.set(sessionId, {
            userId: user._id,
            username: user.username,
            timestamp: currentTime
        });

        // Generate JWT token
        const token = jwt.sign(
            { _id: user._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        // Emit success event through Socket.IO
        if (global.io) {
            global.io.emit('qr-scan-success', {
                sessionId,
                token,
                userId: user._id,
                username: user.username,
                userData: {
                    email: user.email,
                    photo: user.photo,
                    bio: user.bio
                }
            });
        }

        res.json({
            token,
            userId: user._id,
            username: user.username,
            userData: {
                email: user.email,
                photo: user.photo,
                bio: user.bio
            },
            message: 'QR login successful'
        });
    } catch (error) {
        console.error('QR login error:', error);
        res.status(500).json({ message: 'QR login failed' });
    }
};

// Get session status handler
const getSessionStatus = (req, res) => {
    const { sessionId } = req.params;
    const session = activeSessions.get(sessionId);

    if (!session) {
        return res.status(404).json({ message: 'Session not found' });
    }

    res.json({
        userId: session.userId,
        username: session.username,
        timestamp: session.timestamp
    });
};

module.exports = {
    handleQrLogin,
    getSessionStatus
}; 