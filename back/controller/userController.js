const user = require("../models/userModels");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const message = require("../models/messageModel");

exports.createUser = async (req, res) => {
  try {
    let { userName, email, password, mobileNumber } = req.body;

    let checkExistUser = await user.findOne({ email });
    // let checkExistUserByMobileNumber = await user.findOne({ mobileNumber });

    if (checkExistUser) {
      return res
        .status(409)
        .json({ status: 409, message: "User Already Exist..." });
    }

    const user = userName ? userName : `user_${new Date()}`

    let salt = await bcrypt.genSalt(10);
    let hashPassword = await bcrypt.hash(password, salt);

    checkExistUser = await user.create({
      userName:user,
      email,
      password: hashPassword,
      // mobileNumber,
    });
    let token = await jwt.sign(
      { _id: checkExistUser._id },
      process.env.SECRET_KEY,
      { expiresIn: "1D" }
    );
    return res.status(201).json({
      status: 201,
      message: "User Created SuccessFully...",
      user: checkExistUser,
      token: token,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: 500, message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    let page = parseInt(req.query.page);
    let pageSize = parseInt(req.query.pageSize);

    if (page < 1 || pageSize < 1) {
      return res.status(401).json({
        status: 401,
        message: "Page And PageSize Cann't Be Less Than 1",
      });
    }

    let paginatedUser;

    paginatedUser = await user.find();

    let count = paginatedUser.length;

    if (count === 0) {
      return res.status(404).json({ status: 404, message: "User Not Found" });
    }

    if (page && pageSize) {
      let startIndex = (page - 1) * pageSize;
      let lastIndex = startIndex + pageSize;
      paginatedUser = await paginatedUser.slice(startIndex, lastIndex);
    }

    return res.status(200).json({
      status: 200,
      totalUsers: count,
      message: "All Users Found SuccessFully...",
      users: paginatedUser,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: 500, message: error.message });
  }
};

exports.getContactUsers = async (req, res) => {
  try {
    // Replace with how you get the userId, e.g. from token or params
    const userId = req.user._id || req.params.id;

    const userData = await user.findById(userId);

    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found" });
    }

    const contactList = userData.contactList || [];
    // Assuming each contact has a "phone" field
    const contactPhones = contactList.map(contact => contact.phone);

    // Now find all Users whose mobileNumber is in contactPhones
    const users = await user.find({ mobileNumber: { $in: contactPhones } });

    return res.status(200).json({
      status: 200,
      message: "Contact Users found successfully",
      users,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 500, message: error.message });
  }
};

exports.getAllMessageUsers = async (req, res) => {
  try {
    
    const pipeline = [
      // Match messages where user is either sender or receiver
      {
        $match: {
          $or: [{ sender: req.user._id }, { receiver: req.user._id }],
        },
      },

      // Project to get the other user in the conversation
      {
        $project: {
          user: {
            $cond: {
              if: { $eq: ["$sender", req.user._id] },
              then: "$receiver",
              else: "$sender",
            },
          },
        },
      },

      // Group by user to remove duplicates
      {
        $group: {
          _id: "$user",
        },
      },

      // Lookup user details
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userData",
        },
      },

      // Unwind user data
      {
        $unwind: {
          path: "$userData",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Project required user fields
      {
        $project: {
          _id: 1,
          userName: { $ifNull: ["$userData.userName", null] },
          email: { $ifNull: ["$userData.email", null] },
          photo: { $ifNull: ["$userData.photo", null] },
          profilePhoto: { $ifNull: ["$userData.profilePhoto", null] },
          createdAt: { $ifNull: ["$userData.createdAt", null] },
          mobileNumber: { $ifNull: ["$userData.mobileNumber", null] },
          dob: { $ifNull: ["$userData.dob", null] },
          bio: { $ifNull: ["$userData.bio", null] },
          archiveUsers: { $ifNull: ["$userData.archiveUsers", null] },
          blockedUsers: { $ifNull: ["$userData.blockedUsers", null] },
          isUser: {
            $cond: [{ $ifNull: ["$userData._id", null] }, true, false],
          },
          deleteChatFor: { $ifNull: ["$userData.deleteChatFor", null] },
        },
      },

      // Union with current user's data
      {
        $unionWith: {
          coll: "users",
          pipeline: [
            {
              $match: {
                _id: req.user._id,
              },
            },
            {
              $project: {
                _id: 1,
                userName: 1,
                email: 1,
                photo: 1,
                profilePhoto: 1,
                createdAt: 1,
                mobileNumber: 1,
                dob: 1,
                bio: 1,
                archiveUsers: 1,
                blockedUsers: 1,
                isUser: { $literal: true },
                deleteChatFor: 1,
              },
            },
          ],
        },
      },

      // Group again to remove potential duplicates
      {
        $group: {
          _id: "$_id",
          userName: { $first: "$userName" },
          email: { $first: "$email" },
          photo: { $first: "$photo" },
          profilePhoto: { $first: "$profilePhoto" },
          createdAt: { $first: "$createdAt" },
          mobileNumber: { $first: "$mobileNumber" },
          dob: { $first: "$dob" },
          bio: { $first: "$bio" },
          archiveUsers: { $first: "$archiveUsers" },
          blockedUsers: { $first: "$blockedUsers" },
          isUser: { $first: "$isUser" },
          deleteChatFor: { $first: "$deleteChatFor" },
        },
      },

      // Lookup group information
      {
        $lookup: {
          from: "groups",
          pipeline: [
            {
              $match: {
                members: req.user._id,
              },
            },
            {
              $project: {
                _id: 1,
                userName: 1,
                members: 1,
                admin: 1,
                description: 1,
                createdBy: 1,
                createdAt: 1,
                photo: 1,
                bio: 1,
                deleteChatFor: 1,
              },
            },
          ],
          as: "groups",
        },
      },

      // Modified messages lookup for direct messages
      {
        $lookup: {
          from: "messages",
          let: {
            userId: "$_id",
            currentUserId: req.user._id,
            isUser: "$isUser",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$$isUser", true] },
                    {
                      $or: [
                        {
                          $and: [
                            { $eq: ["$sender", "$$userId"] },
                            { $eq: ["$receiver", "$$currentUserId"] },
                            { $ne: ["$isBlocked", true] },
                          ],
                        },
                        {
                          $and: [
                            { $eq: ["$sender", "$$currentUserId"] },
                            { $eq: ["$receiver", "$$userId"] },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },
            {
              $sort: { createdAt: -1 },
            },
            {
              $limit: 20,
            },
          ],
          as: "directMessages",
        },
      },

      // Final projection for users
      {
        $project: {
          _id: 1,
          userName: 1,
          email: 1,
          profilePhoto: 1,
          photo: 1,
          createdAt: 1,
          mobileNumber: 1,
          dob: 1,
          bio: 1,
          archiveUsers: 1,
          blockedUsers: 1,
          isUser: 1,
          directMessages: 1,
          groups: 1,
          deleteChatFor: 1,
        },
      },
    ];

    const results = await message.aggregate(pipeline);

    // Process the results to include group messages
    const userResults = results.filter((item) => item.isUser);

    // Extract unique groups from the results using a Map
    const uniqueGroupsMap = new Map();

    results.forEach((result) => {
      if (result.groups && result.groups.length > 0) {
        result.groups.forEach((group) => {
          // Use group ID as key to ensure uniqueness
          uniqueGroupsMap.set(group._id.toString(), group);
        });
      }
    });

    // Convert Map values to array to get unique groups
    const uniqueGroups = Array.from(uniqueGroupsMap.values());

    // Get current user's data to check deleteChatFor
    const currentUser = results.find(
      (r) => r._id.toString() === req.user._id.toString()
    );


    // Now fetch messages for each group
    const groupsWithMessages = [];
    for (const group of uniqueGroups) {
      // Skip groups that are in deleteChatFor
      if (currentUser?.deleteChatFor?.includes(group._id.toString())) {
        continue;
      }

      const groupMessages = await message
        .find({
          receiver: group._id,
          deletedFor: { $ne: req.user._id },
        })
        .sort({ createdAt: -1 })
        .limit(20);

      groupsWithMessages.push({
        _id: group._id,
        userName: group.userName,
        photo: group.photo,
        createdAt: group.createdAt,
        members: group.members,
        admin: group.admin,
        description: group.description,
        createdBy: group.createdBy,
        isGroup: true,
        messages: groupMessages,
        bio: group.bio,
      });
    }

    // Format the user results and filter out users in deleteChatFor without messages
    const formattedUsers = userResults
      .filter((user) => {

        const isInDeleteChatFor = currentUser?.deleteChatFor?.includes(
          user._id.toString()
        );

        let hasMessages ;
        if(isInDeleteChatFor){
          hasMessages =
          user?.directMessages &&
          user?.directMessages.filter((u) => {
            const deletedForStrings = u.deletedFor.map((id) => id.toString());
            return !deletedForStrings.includes(currentUser._id.toString());
          });
        }

        if(hasMessages && hasMessages?.length <= 0){
          return false
        }else{
          return true
        }
      })
      .map((user) => ({
        _id: user._id,
        userName: user.userName,
        email: user.email,
        photo: user.photo,
        profilePhoto: user.profilePhoto,
        createdAt: user.createdAt,
        mobileNumber: user.mobileNumber,
        dob: user.dob,
        bio: user.bio,
        archiveUsers: user.archiveUsers,
        blockedUsers: user.blockedUsers,
        isUser: true,
        messages: user.directMessages || [],
      }));

    return res.status(200).json({
      status: 200,
      message: "All Message Users and Groups Found Successfully...",
      users: [...formattedUsers, ...groupsWithMessages],
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    // Include the photo field in the update
    if (req.file) {
      req.body.photo = req.file.location;
    }
    const updatedUser = await user.findByIdAndUpdate(
      req.params.id,
      { ...req.body, photo: req.body.photo ? req.body.photo : undefined }, // Ensure photo is included if provided
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: 200,
      message: "User updated successfully",
      users: updatedUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

exports.getSingleUser = async (req, res) => {
  try {
    const users = await user.findById(req.params.id);
    if (!users) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    } else {
      return res.status(200).json({
        status: 200,
        message: "User found successfully",
        users,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

exports.getAllCallUsers = async (req, res) => {
  try {
    const pipeline = [
      // Match messages where user is either sender or receiver and content type is "call"
      {
        $match: {
          $and: [
            {
              $or: [{ sender: req.user._id }, { receiver: req.user._id }],
            },
            {
              "content.type": "call", // Filter for call messages
            },
          ],
        },
      },

      // Project to get the other user in the conversation
      {
        $project: {
          user: {
            $cond: {
              if: { $eq: ["$sender", req.user._id] },
              then: "$receiver",
              else: "$sender",
            },
          },
          message: "$$ROOT", // Include the entire message document
        },
      },

      // Group by user to remove duplicates and get the last message
      {
        $group: {
          _id: "$user",
          lastMessage: { $last: "$message" }, // Get the last message for each user
        },
      },

      // Lookup user details
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userData",
        },
      },

      // Unwind user data
      {
        $unwind: "$userData",
      },

      // Group again to ensure uniqueness and project required user fields
      {
        $group: {
          _id: "$userData._id",
          userName: { $first: "$userData.userName" },
          email: { $first: "$userData.email" },
          photo: { $first: "$userData.photo" },
          createdAt: { $first: "$userData.createdAt" },
          messages: { $addToSet: "$lastMessage" }, // Include messages in the final output as an array
        },
      },
      {
        $sort: { createdAt: -1 }
      },

      // Final projection
      {
        $project: {
          _id: 1,
          userName: 1,
          email: 1,
          photo: 1,
          createdAt: 1,
          messages: 1, // Include messages in the response as an array
        },
      },
    ];

    const results = await message.aggregate(pipeline);

    return res.status(200).json({
      status: 200,
      message: "All Unique Call Users and Last Messages Found Successfully...",
      users: results,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

exports.updateUserGroupToJoin = async (req, res) => {
  try {
    const updatedUser = await user.findByIdAndUpdate(
      req.params.id,
      { $set: { groupToJoin: req.body.groupToJoin } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: 200,
      message: "User privacy updated successfully",
      users: updatedUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

exports.updateUserProfilePhotoPrivacy = async (req, res) => {
  try {
    const updatedUser = await user.findByIdAndUpdate(
      req.params.id,
      { $set: { profilePhoto: req.body.profilePhoto } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: 200,
      message: "User profile photo privacy updated successfully",
      users: updatedUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

exports.archiveUser = async (req, res) => {
  try {
    const { selectedUserId } = req.body;
    const currentUser = req.user._id;
    const userdata = await user.findById(currentUser);
    if (!userdata) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }
    if (userdata.archiveUsers.includes(selectedUserId)) {
      userdata.archiveUsers = userdata.archiveUsers.filter(
        (id) => id !== selectedUserId
      );
    } else {
      userdata.archiveUsers.push(selectedUserId);
    }
    await userdata.save();
    return res.status(200).json({
      status: 200,
      message: "User archived successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const { selectedUserId } = req.body;
    const currentUser = req.user._id;

    const userData = await user.findById(currentUser);
    if (!userData) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }

    if (userData.blockedUsers.includes(selectedUserId)) {
      // Unblock user
      userData.blockedUsers = userData.blockedUsers.filter(
        (id) => id !== selectedUserId
      );
      await userData.save();
      return res.status(200).json({
        status: 200,
        message: "User unblocked successfully",
      });
    } else {
      // Block user
      userData.blockedUsers.push(selectedUserId);
      await userData.save();
      return res.status(200).json({
        status: 200,
        message: "User blocked successfully",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

exports.deleteChat = async (req, res) => {
  try {
    const { selectedUserId } = req.body;
    const currentUser = req.user._id;
    const userData = await user.findById(currentUser);
    if (!userData) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }
    if (userData.deleteChatFor.includes(selectedUserId)) {
      // Unblock user
      userData.deleteChatFor = userData.deleteChatFor.filter(
        (id) => id !== selectedUserId
      );
    } else {
      userData.deleteChatFor.push(selectedUserId);
    }
    await userData.save();
    return res.status(200).json({
      status: 200,
      message: "Chat deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

exports.pinChat = async (req, res) => {
  try {
    const { selectedUserId } = req.body;
    const currentUser = req.user._id;
    const userData = await user.findById(currentUser);
    if (!userData) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }
    if (userData.pinChatFor.includes(selectedUserId)) {
      // Unblock user
      userData.pinChatFor = userData.pinChatFor.filter(
        (id) => id !== selectedUserId
      );
    } else {
      userData.pinChatFor.push(selectedUserId);
    }
    await userData.save();
    return res.status(200).json({
      status: 200,
      message: "Chat pined successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

exports.muteUsers = async (req, res) => {
  try {
    const { selectedUserId } = req.body;
    const currentUser = req.user._id;
    const userData = await user.findById(currentUser);
    if (!userData) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }
    if (userData.muteUsers.includes(selectedUserId)) {
      // Unblock user
      userData.muteUsers = userData.muteUsers.filter(
        (id) => id !== selectedUserId
      );
    } else {
      userData.muteUsers.push(selectedUserId);
    }
    await userData.save();
    return res.status(200).json({
      status: 200,
      message: "Chat Mute successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
}

exports.getDevices = async (req, res) => {
  try {
      const userId = req.user._id;
      const userData = await user.findById(userId);
      
      if (!userData) {
          return res.status(404).json({ status: 404, message: "User not found" });
      }

      return res.status(200).json({
          status: 200,
          devices: userData.devices || []
      });
  } catch (error) {
      console.error('Error getting devices:', error);
      return res.status(500).json({ status: 500, message: error.message });
  }
};

exports.removeDevice = async (req, res) => {
  try {
      const userId = req.user._id;
      const { deviceId } = req.params;

      const userData = await user.findById(userId);
      if (!userData) {
          return res.status(404).json({ status: 404, message: "User not found" });
      }

      // Remove the device from the devices array
      userData.devices = userData.devices.filter(device => device.deviceId !== deviceId);
      await userData.save();

      return res.status(200).json({
          status: 200,
          message: "Device removed successfully"
      });
  } catch (error) {
      console.error('Error removing device:', error);
      return res.status(500).json({ status: 500, message: error.message });
  }
};

exports.addContactList = async (req, res) => {
  try {
    const contacts = Array.isArray(req.body.contacts) ? req.body.contacts : [];

    const currentUserId = req.user._id;
    const userData = await user.findById(currentUserId);

    if (!userData) {
      return res.status(404).json({
        status: 404,
        message: "User not found"
      });
    }

    // Initialize contactList if missing
    if (!Array.isArray(userData.contactList)) {
      userData.contactList = [];
    }

    for (const contact of contacts) {
      if (!contact.id || !contact.name || !contact.phone) {
        continue; // skip invalid
      }

      // Check if contact already exists; if so, skip
      if (userData.contactList.some(c => c.phone === contact.phone)) {
        continue;
      }

      // Look up if the phone belongs to an existing user
      const existingUser = await user.findOne({ mobileNumber: contact.phone });

      const newContact = {
        contactId: contact.id,
        userName: contact.name,
        phone: contact.phone,
        photo: contact.photoUri || null,
        addedAt: new Date(),
        status: "active",
      };

      // If this contact is also a registered user, add profile fields
      if (existingUser) {
        // newContact._id = existingUser._id;
        // newContact.userName = existingUser.userName;
        newContact.photo = existingUser.photo || contact.photoUri || null;
      }

      userData.contactList.push(newContact);
    }

    await userData.save();

    return res.status(200).json({
      status: 200,
      message: "Contacts added successfully",
      contacts: userData.contactList
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
}