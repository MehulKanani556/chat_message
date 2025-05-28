const jwt = require('jsonwebtoken');
const User = require('../models/userModels');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('No authentication token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'iafdsfusd----Jhjhdjaf+++++999^&^%^ddhdhddhdh');
    
    // For demo purposes, we'll use the decoded _id directly
    // In production, you should verify the user exists in the database
    console.log('Decoded token:', decoded);
    req.user = {
      userId: decoded._id || decoded.userId
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Please authenticate' });
  }
};

module.exports = auth;