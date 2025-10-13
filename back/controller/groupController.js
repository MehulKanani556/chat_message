const Group = require("../models/groupModel"); // Assuming you have a Group model
const User = require("../models/userModels");
const { saveMessage } = require("./messageController");

async function createGroup(req, res) {
  try {
    const { userName, members, createdBy, bio } = req.body;

    // Handle members array properly - it might come as string or array
    let membersArray = members;
    if (typeof members === 'string') {
      try {
        membersArray = JSON.parse(members);
      } catch (e) {
        membersArray = [members]; // If it's a single member ID
      }
    } else if (Array.isArray(members)) {
      membersArray = members;
    } else {
      membersArray = [];
    }

    if (req.file) {
      req.body.photo = req.file.location
    }

    const groupData = {
      userName,
      members: membersArray,
      createdBy,
      photo: req.body.photo ? req.body.photo : undefined,
      bio: bio
    };

    const group = await Group.create(groupData);
    if (!group) {
      return res.status(400).json({ error: "Failed to create group", code: 400 });
    }
    return res.status(200).json({ groupId: group._id, group });
  } catch (error) {
    console.error("Error creating group:", error);
    return res
      .status(500)
      .json({ error: "Error creating group", code: error.code || 500 });
  }
}

async function updateGroup(req, res) {
  try {
    const groupId = req.body.groupId || req.params.groupId;
    // Only keep groupId from the body
    const updateData = {}; // Create an object to hold the fields to update

    if (req.body.userName) {
      updateData.userName = req.body.userName; // Add userName if it exists
    }
    if (req.body.members) {
      updateData.members = req.body.members; // Add members if it exists
    }
    if (req.body.bio) {
      updateData.bio = req.body.bio; // Add bio if it exists
    }
    if (req.file) {
      updateData.photo = req.file.location; // Update photo if a file is uploaded
    }

    const group = await Group.findByIdAndUpdate(groupId, updateData, { new: true }); // Update only the fields that are present and return the new data
    return res.status(200).json({ status: true, message: "Group updated successfully", group });
  } catch (error) {
    console.error("Error updating group:", error);
    return res
      .status(500)
      .json({ error: "Error updating group", code: error.code || 500 });
  }
}

async function addParticipants(req, res) {
  try {
    const { groupId, members, addedBy } = req.body;

    const group = await Group.findByIdAndUpdate(groupId, { $push: { members } }, { new: true });

    for (const memberId of members) {
      const addedByUser = await User.findById(addedBy);
      const memberName = await User.findById(memberId); // Function to get user name by ID

      await saveMessage({
        senderId: addedBy,
        receiverId: groupId,
        content: {
          type: "system",
          content: `**${addedByUser.userName}** added **${memberName.userName}** `,
        },
      });
    }

    return res.status(200).json({ status: true, group });
  } catch (error) {
    console.error("Error adding participants:", error);
    return res
      .status(500)
      .json({ error: "Error adding participants", code: error.code || 500 });
  }
}

async function deleteGroup(req, res) {
  try {
    const { groupId } = req.params; // Assuming groupId is passed as a URL parameter
    await Group.findByIdAndDelete(groupId);
    return res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("Error deleting group:", error);
    return res
      .status(500)
      .json({ error: "Error deleting group", code: error.code || 500 });
  }
}

async function getGroupById(req, res) {
  try {
    const { groupId } = req.params; // Assuming groupId is passed as a URL parameter
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found", code: 404 });
    }
    return res.status(200).json(group);
  } catch (error) {
    console.error("Error retrieving group by ID:", error);
    return res
      .status(500)
      .json({ error: "Error retrieving group", code: error.code || 500 });
  }
}

async function findGroupById(groupId) {
  try {
    const group = await Group.findById(groupId);
    return group; // Return the group or null if not found
  } catch (error) {
    console.error("Error retrieving group by ID:", error);
    return null; // Return null on error
  }
}

async function getAllGroups(req, res) {
  try {
    const userId = req.user._id;
    const groups = await Group.find({ members: userId });

    return res.status(200).json(groups);
  } catch (error) {
    console.error("Error retrieving all groups:", error);
    return res
      .status(500)
      .json({ error: "Error retrieving groups", code: error.code || 500 });
  }
}

async function leaveGroup(req, res) {
  try {
    const { userId, groupId, removeId } = req.body;

    const group = await Group.findByIdAndUpdate(
      groupId,
      { $pull: { members: userId } }, // Remove the user from the group's members
      { new: true, runValidators: true } // Return the updated group and run validators
    );
    if (!group) {
      return res.status(404).json({ error: "Group not found", code: 404 });
    }
    const user = await User.findById(userId);

    // Save a message indicating the user has left the group
    if (removeId) {
      const removeUser = await User.findById(removeId);
      await saveMessage({
        senderId: userId,
        receiverId: groupId,
        content: {
          type: "system",
          content: `**${removeUser.userName}** has removed **${user.userName}**`,
        },
      });
    } else {
      await saveMessage({
        senderId: userId,
        receiverId: groupId,
        content: {
          type: "system",
          content: `**${user.userName}** has left.`,
        },
      });
    }
    return res.status(200).json({ success: true, message: "User left the group successfully", group });
  } catch (error) {
    console.error("Error leaving group:", error);
    return res
      .status(500)
      .json({ error: "Error leaving group", code: error.code || 500 });
  }
}

module.exports = {
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupById,
  getAllGroups,
  findGroupById,
  leaveGroup,
  addParticipants,
};
