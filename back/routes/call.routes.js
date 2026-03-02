const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getCallHistory } = require('../controller/call.controller');

router.get('/call-history', protect, getCallHistory);

module.exports = router; 