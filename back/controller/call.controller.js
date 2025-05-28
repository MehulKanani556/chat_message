const Call = require('../models/call.model');
const User = require('../models/user.model');

const getCallHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all calls where the user is either the sender or receiver
    const calls = await Call.find({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    })
    .sort({ timestamp: -1 }) // Sort by most recent first
    .limit(50); // Limit to last 50 calls

    // Get user details for each call
    const callsWithUserDetails = await Promise.all(
      calls.map(async (call) => {
        const otherUserId = call.senderId.equals(userId) ? call.receiverId : call.senderId;
        const user = await User.findById(otherUserId).select('userName photo');
        
        return {
          ...call.toObject(),
          user: {
            _id: user._id,
            userName: user.userName,
            photo: user.photo
          }
        };
      })
    );

    res.json(callsWithUserDetails);
  } catch (error) {
    console.error('Error fetching call history:', error);
    res.status(500).json({ message: 'Error fetching call history' });
  }
};

module.exports = {
  getCallHistory
}; 