const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ... existing code ...

// QR Code Login Route
router.post('/qr-login', async (req, res) => {
  try {
    const { qrData } = req.body;

    // Verify the QR code data
    if (!qrData || !qrData.userId || !qrData.timestamp) {
      return res.status(400).json({ message: 'Invalid QR code data' });
    }

    // Check if QR code is expired (e.g., 5 minutes validity)
    const currentTime = Date.now();
    const qrTime = new Date(qrData.timestamp).getTime();
    if (currentTime - qrTime > 5 * 60 * 1000) {
      return res.status(400).json({ message: 'QR code has expired' });
    }

    // Find the user
    const user = await User.findById(qrData.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      userId: user._id,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('QR Login Error:', error);
    res.status(500).json({ message: 'Server error during QR login' });
  }
});

module.exports = router; 