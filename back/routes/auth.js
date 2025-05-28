const express = require('express');
const router = express.Router();
const auth = require('../helper/auth');
const { handleQrLogin, getSessionStatus } = require('../controller/authController');

// QR Login endpoint
router.post('/qr-login', auth, handleQrLogin);

// Get session status
router.get('/session/:sessionId', getSessionStatus);

module.exports = router; 