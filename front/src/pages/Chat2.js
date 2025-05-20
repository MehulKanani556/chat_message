import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import {
  FaSearch,
  FaRegUser,
  FaCommentDots,
  FaPhone,
  FaUsers,
  FaDownload,
  FaPaperclip,
  FaMicrophone,
  FaRegSmile,
  FaPlusCircle,
  FaFilePdf,
  FaFileExcel,
  FaFileWord,
  FaFilePowerpoint,
  FaFileArchive,
  FaArrowDown,
  FaUserPlus,
  FaFile,
  FaFileAudio,
  FaChevronLeft,
  FaChevronRight,
  FaRegBell,
} from "react-icons/fa";
import { PiDotsThreeBold, PiSmiley } from "react-icons/pi";
import {
  MdCallEnd,
  MdOutlineModeEdit,
  MdGroupAdd,
  MdReport,
  MdOutlineBlock,
  MdOutlineCancel,
  MdOutlineGroupAdd,
  MdOutlineFlipCameraIos,
} from "react-icons/md";
import { RiDeleteBinFill, RiDeleteBinLine, RiShutDownLine, RiUserAddLine } from "react-icons/ri";
import {
  LuScreenShare,
  LuSendHorizontal,
  LuScreenShareOff,
} from "react-icons/lu";
import { IoIosArrowDown, IoIosArrowForward, IoIosArrowUp, IoMdSearch } from "react-icons/io";
import { GoDeviceCameraVideo, GoMute, GoPlusCircle, GoTrash, GoUnmute } from "react-icons/go";
import { ImCross } from "react-icons/im";
import { FiCamera, FiCameraOff, FiEdit2 } from "react-icons/fi";
import {
  BsCameraVideo,
  BsCameraVideoOff,
  BsChatDots,
  BsCrosshair,
  BsFillMicFill,
  BsFillMicMuteFill,
  BsMicMute,
  BsThreeDotsVertical,
} from "react-icons/bs";
import { RxCross2 } from "react-icons/rx";
import {
  IoArchiveOutline,
  IoCallOutline,
  IoCameraOutline,
  IoMicOffCircleOutline,
  IoMicOffOutline,
  IoMicOutline,
  IoPersonCircleOutline,
  IoVideocamOutline,
  IoVolumeLowOutline,
  IoVolumeOffOutline,
} from "react-icons/io5";
import { useSocket } from "../hooks/useSocket";
import { useDispatch, useSelector } from "react-redux";
import {
  createGroup,
  deleteMessage,
  getAllGroups,
  getAllMessages,
  getAllMessageUsers,
  getAllUsers,
  leaveGroup,
  getUser,
  updateGroup,
  updateUser,
  updateMessage,
  clearChat,
  addParticipants,
  getAllCallUsers,
  archiveUser,
  blockUser,
  deleteChat,
  pinChat,
  muteChat,
} from "../redux/slice/user.slice";
import { BASE_URL, IMG_URL } from "../utils/baseUrl";
import axios from "axios";
import Front from "../component/Front";
import { MdOutlineDeleteSweep } from "react-icons/md";
import ChatItem from "../component/ChatItem";
import MessageList from "../component/MessageList";
import Profile from "../component/Profile";
import Sidebar from "../component/SideBar";
import { BiBlock } from "react-icons/bi";
import ChatList from "../component/ChatList";
import Groups from "../component/Group";
import Setting from "../component/Setting";
import GroupProfile from "../component/GroupProfile";
import AddParticipants from "../component/AddParticipants";
import CreatedGroup from "../component/CreatedGroup";
import ProfileUser from "../component/ProfileUser";
import CallHistory from "../component/CallHistory";
import ForwardModal from "../component/ForwardModal";
import { SlPin } from "react-icons/sl";
import { AiOutlineAudioMuted, AiOutlineVideoCamera } from "react-icons/ai";
import IncomingCall from "../component/IncomingCall";
import { debounce } from 'lodash';

const Chat2 = () => {
  const { allUsers, messages, allMessageUsers, groups, user, allCallUsers } =
    useSelector((state) => state.user);
  const [selectedTab, setSelectedTab] = useState("All");
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const emojiPickerRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser] = useState(sessionStorage.getItem("userId")); // Replace with actual user data
  const [typingUsers, setTypingUsers] = useState([]);
  const localVideoRef = useRef(null);
  const [callUsers, setCallUsers] = useState([]);
  const remoteVideoRef = useRef(null);
  const navigate = useNavigate();
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    messageId: null,
  });
  const [docModel, setDocModel] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const inputRef = useRef(null);
  const [userId, setUserId] = useState(sessionStorage.getItem("userId"));
  const [groupUsers, setGroupUsers] = useState([]);
  const [groupNewUsers, setGroupNewUsers] = useState([]);
  const messagesContainerRef = useRef(null);
  const [searchInput, setSearchInput] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUserName, setEditedUserName] = useState(user?.userName || "");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState(null);
  const [isGroupCreateModalOpen, setIsGroupCreateModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupPhoto, setGroupPhoto] = useState(null);
  const dispatch = useDispatch();
  const dropdownRef = useRef(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSearchBoxOpen, setIsSearchBoxOpen] = useState(false);
  const [searchInputbox, setSearchInputbox] = useState("");
  const [totalMatches, setTotalMatches] = useState(0);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [isProfileImageModalOpen, setIsProfileImageModalOpen] = useState(false);
  const [selectedProfileImage, setSelectedProfileImage] = useState(null);
  //changes
  const [activeSearchTab, setActiveSearchTab] = useState("All");
  const [filteredGroups, setFilteredGroups] = useState([]);
  //changes end
  const [isClearChatModalOpen, setIsClearChatModalOpen] = useState(false);
  const [videoDuration, setVideoDuration] = useState(null);
  const [isDeleteChatModalOpen, setIsDeleteChatModalOpen] = useState(false);

  const [participantOpen, setParticipantOpen] = useState(false);
  const [isEditingUserName, setIsEditingUserName] = useState(false);
  const [isEditingDob, setIsEditingDob] = useState(false);
  const [editedDob, setEditedDob] = useState(user?.dob || "");
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editedPhone, setEditedPhone] = useState(user?.phone || "");
  const [visibleDate, setVisibleDate] = useState(null);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState({
    messageId: null,
    position: null,
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const searchRef = useRef(null); // Define searchRef
  const mobileMenuRef = useRef(null);
  const searchBoxRef = useRef(null);

  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showProfileInSidebar, setShowProfileInSidebar] = useState(false);

  const [showGroups, setShowGroups] = useState(false);

  const [notificationPermission, setNotificationPermission] = useState(
    Notification.permission
  );

  const [showCallHistory, setShowCallHistory] = useState(false);
  const [creatGroup, setCreatGroup] = useState(false)

  const [isDragging, setIsDragging] = useState(false);
  const dropAreaRef = useRef(null);
  const [videoDurations, setVideoDurations] = useState({}); // Object to hold durations keyed by message ID

  const [waveformData, setWaveformData] = useState([]);

  const [showFirstSection, setShowFirstSection] = useState(true);
  const [userStreams, setUserStreams] = useState({});

  const getStreamForUser = (userId) => {
    return userStreams[userId]; // Return the stream for the given user ID
  };
  //===========Use the custom socket hook===========
  const {
    socket,
    isConnected,
    onlineUsers,
    sendPrivateMessage,
    sendTypingStatus,
    subscribeToMessages,
    sendGroupMessage,
    isVideoCalling,
    incomingCall,
    setIncomingCall,
    cleanupConnection,
    peerEmail,
    setPeerEmail,
    hasWebcam,
    hasMicrophone,
    isCameraOn,
    startSharing,
    startVideoCall,
    acceptVideoCall,
    endCall,
    isSharing,
    setIsSharing,
    isReceiving,
    setIsReceiving,
    toggleCamera,
    toggleMicrophone,
    markMessageAsRead,
    rejectCall,
    rejectVoiceCall,
    incomingShare,
    setIncomingShare,
    acceptScreenShare,
    isVoiceCalling,
    callAccept,
    remoteStreams,
    inviteToCall,
    callParticipants,
    isMicrophoneOn,
    voiceCallData,
    setVoiceCallData,
    forwardMessage,
    addMessageReaction,
    cameraStatus,
    setCameraStatus,
    // leaveCall,
    startCall,
    acceptCall
  } = useSocket(user?._id, localVideoRef, remoteVideoRef, allUsers);

  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    if (window.innerWidth <= 1439) {
      setShowOverlay(true);
    }
  }, [showOverlay]);

  // Add camera status listener
  useEffect(() => {
    if (!socket) return;

    socket.on(
      "camera-status-change",
      ({ userId: remoteUserId, isCameraOn: remoteCameraStatus }) => {
        console.log(
          `[Camera Status] Received update: User ${remoteUserId} camera is now ${remoteCameraStatus ? "ON" : "OFF"
          }`
        );
        setCameraStatus((prev) => ({
          ...prev,
          [remoteUserId]: remoteCameraStatus,
        }));
      }
    );

    return () => {
      if (socket) {
        socket.off("camera-status-change");
      }
    };
  }, [socket]);

  // ====================auth=======================

  useEffect(() => {
    if (!currentUser) {
      navigate("/");
    }
  }, []);

  useEffect(() => {
    if (Notification.permission === "default") {
      requestNotificationPermission();
    }
  }, []);

  // Function to request notification permission
  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      console.log("Notification permission:", permission);
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  };

  // Function to show notification for new message
  const showMessageNotification = (message, senderName) => {
    if (notificationPermission !== "granted") return;

    // Don't show notification if the chat is currently selected
    if (selectedChat && selectedChat._id === message.sender) return;

    if (!user?.notification) return;
    if (user?.muteUsers?.includes(message.sender)) return;

    // Create notification content
    let notificationTitle = senderName || "New Message";
    let notificationBody = "";

    // Handle different message types
    if (message.content.type === "text") {

      let messageContent;
      if (
        typeof message.content.content === "string" &&
        message.content.content.startsWith("data:")
      ) {
        try {
          const key = "chat";
          // console.log(messageContent, typeof messageContent && messageContent.startsWith('data:'))
          // Assuming 'data:' prefix is part of the encrypted message, remove it before decoding
          const encodedText = message.content.content.split("data:")[1];
          const decodedText = atob(encodedText);
          let result = "";
          for (let i = 0; i < decodedText.length; i++) {
            result += String.fromCharCode(
              decodedText.charCodeAt(i) ^ key.charCodeAt(i % key.length)
            );
          }
          messageContent = result;
          // console.log(messageContent)
        } catch (error) {
          console.error("Decryption error:", error);
        }
      }
      notificationBody = messageContent || "New message received";
    } else if (message.content.type === "file") {
      if (message.content.fileType?.startsWith("image/")) {
        notificationBody = "Sent you a photo";
      } else if (message.content.fileType === "video/mp4") {
        notificationBody = "Sent you a video";
      } else {
        notificationBody = "Sent you a file";
      }
    } else if (message.content.type === "call") {
      notificationBody = "Call message";
    }

    // Create and show the notification
    const notification = new Notification(notificationTitle, {
      body: notificationBody,
      icon: "/logo.png", // Use your app's icon
      requireInteraction: true, // Prevents the notification from closing automatically
      silent: false, // Allows the notification to make a sound
      vibrate: [200, 100, 200], // Vibrates the device for the specified duration
      tag: "new-message", // Identifies the notification
      renotify: true, // Allows the notification to be re-shown if it's already active
      // badge: "/logo.png", // Sets the badge icon for the notification
      // image: "/logo.png", // Sets the image for the notification
      // actions: [
      //   { action: "reply", title: "Reply" },
      //   { action: "dismiss", title: "Dismiss" }
      // ], // Adds actions to the notification
      dir: "auto", // Sets the direction of the text
      lang: "en-US", // Sets the language of the notification
      timestamp: new Date().getTime(), // Sets the timestamp of the notification
    });

    // Close notification after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);
  };

  //===========get all users===========
  useEffect(() => {
    dispatch(getAllUsers());
    // dispatch(getOnlineUsers());
    dispatch(getAllMessageUsers());
    dispatch(getAllGroups());
    dispatch(getUser(currentUser));
    dispatch(getAllCallUsers());
  }, [dispatch]);

  // Add this effect to filter users based on search input
  useEffect(() => {
    if (searchInput) {
      // Filter people
      const matchingPeople = allUsers.filter((user) =>
        user.userName.toLowerCase().includes(searchInput.toLowerCase())
      );
      setFilteredUsers(matchingPeople);

      // Filter groups
      const matchingGroups = groups.filter(
        (group) =>
          group.userName.toLowerCase().includes(searchInput.toLowerCase()) &&
          group.members?.includes(currentUser)
      );

      //changes
      setFilteredGroups(matchingGroups);
      //changes end
    } else {
      if (selectedTab === "Unread") {
        setFilteredUsers(
          allMessageUsers.filter((user) => {
            // console.log(user.messages),
            if (user.messages && user.messages.length > 0) {
              return user.messages.some(
                (message) =>
                  message.status === "sent" || message.status === "delivered"
              );
            }
          })
        );
      } else {
        setFilteredUsers(allMessageUsers); // Show allMessageUsers when searchInput is empty
      }
    }
  }, [
    searchInput,
    allUsers,
    groups,
    selectedTab,
    currentUser,
    allMessageUsers,
  ]);
  useEffect(() => {
    if (selectedChat && allMessageUsers) {
      const updatedChat = allMessageUsers.find(
        (chat) => chat._id === selectedChat._id
      );
      // console.log("updatedChat", updatedChat);
      if (updatedChat) {
        setSelectedChat(updatedChat);
      }
    }
  }, [allMessageUsers]);

  useEffect(() => {
    if (selectedChat) {
      // Get unread messages for this conversation
      const unreadMessages = messages
        .filter(
          (msg) =>
            msg.sender === selectedChat._id &&
            (msg.status === "sent" || msg.status === "delivered") &&
            !msg.isBlocked
        )
        .map((msg) => msg._id);
      // console.log("unreadMessages", unreadMessages, messages);
      // Mark these messages as read
      if (unreadMessages.length > 0) {
        markMessageAsRead(unreadMessages);
        // dispatch(getAllMessageUsers());
      }
    }
  }, [selectedChat, messages]);

  //===========profile dropdown===========
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileDropdownOpen && !event.target.closest(".profile-dropdown")) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileDropdownOpen]);

  //===========get all messages ===========
  useEffect(() => {
    if (selectedChat) {
      dispatch(getAllMessages({ selectedId: selectedChat._id }));
    }
    // setIsGroupModalOpen(false);
    // setIsGroupCreateModalOpen(false);
    // setIsModalOpen(false);
    // setIsUserProfileModalOpen(false);
  }, [selectedChat]);

  // ============Subscribe to messages ===========
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribeMessages = subscribeToMessages((message) => {
      if (message.type === "delete") {
        if (selectedChat) {
          dispatch(getAllMessages({ selectedId: selectedChat._id }));
        }
      } else {
        if (selectedChat) {
          dispatch(getAllMessages({ selectedId: selectedChat._id }));
        }

        if (
          message.type !== "status" &&
          message.type !== "read" &&
          message.type !== "reaction"
        ) {
          // Find sender name
          const sender = allUsers.find((user) => user._id === message.sender);
          const senderName = sender ? sender.userName : "Someone";

          // Show notification
          showMessageNotification(message, senderName);
        }
      }
      dispatch(getAllMessageUsers());
      dispatch(getAllCallUsers());
    });
    return () => {
      unsubscribeMessages?.();
    };
  }, [isConnected, selectedChat, notificationPermission, allUsers]);

  // ===========================typing=============================

  useEffect(() => {


    if (!isConnected) return;

    const handleTypingStatus = (data) => {
      if (data.isTyping) {
        setTypingUsers((prev) => [...new Set([...prev, data.userId])]);
        setTimeout(() => {
          setTypingUsers((prev) => [...new Set(prev.filter(id => id !== data.userId))]);
        }, 5000);
      }
      // }
    };
    socket.on("user-typing", handleTypingStatus);
    return () => {
      if (socket) {
        socket.off("user-typing", handleTypingStatus); // Check if socket is not null
      }
    };
  }, [isConnected, selectedChat]);

  // console.log(typingUsers);


  let typingTimeout; // define outside the function

  const handleInputChange = (e) => {
    const files = e.target.files;

    if (files && files.length > 0) {
      const filesArray = Array.from(files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
      return;
    }

    setMessageInput(e.target.value);

    if (selectedChat) {
      if (typingTimeout) clearTimeout(typingTimeout);

      typingTimeout = setTimeout(() => {
        sendTypingStatus(selectedChat._id, true);
      }, 2000); // Wait 3 seconds after last input
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  //===========handle send message ===========

  const handleSendMessage = async (data, userId) => {
    if (editingMessage) {
      try {
        await dispatch(
          updateMessage({
            messageId: editingMessage._id,
            content: data.content,
          })
        );
        socket.emit("update-message", {
          messageId: editingMessage._id,
          content: data.content,
        });
        setEditingMessage(null);
        dispatch(getAllMessageUsers());

        dispatch(getAllMessages({ selectedId: selectedChat._id }));
      } catch (error) {
        console.error("Failed to update message:", error);
      }
    } else {
      const isBlockedByRecipient =
        selectedChat.blockedUsers?.includes(currentUser);
      if (
        (data.type == "text" && data?.content?.trim() === "") ||
        !(selectedChat || userId)
      )
        return;

      // console.log("data", data);

      try {
        const messageData = {
          data,
          isBlocked: isBlockedByRecipient,
        };

        const status = await sendPrivateMessage(userId ? userId : selectedChat._id, messageData);
        dispatch(getAllMessages({ selectedId: userId ? userId : selectedChat._id }));
        dispatch(getAllMessageUsers());
        setReplyingTo(null);
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    }
    setMessageInput("");
  };

  //===========reply  preview===========
  const ReplyPreview = ({ replyData, onCancel }) => {
    const repliedUser = allUsers.find((user) => user._id === replyData.sender);

    return (
      <div className="reply-preview bg-gray-100 dark:bg-gray-700 p-2 rounded-t-lg flex items-start">
        <div className="flex-1">
          <div className="text-sm font-medium text-blue-500 dark:text-blue-400">
            Replying to {repliedUser?.userName || "User"}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
            {replyData.content}
          </div>
        </div>
        <button
          onClick={onCancel}
          className="ml-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <RxCross2 size={20} />
        </button>
      </div>
    );
  };

  //===========handle send group message===========
  const handleSendGroupMessage = async (data) => {
    if (data.content.trim() === "") return;

    try {
      await sendGroupMessage(selectedChat._id, data);
      dispatch(getAllMessages({ selectedId: selectedChat._id })); // Refresh messages if needed
    } catch (error) {
      console.error("Failed to send group message:", error);
    }
  };
  // console.log("object")
  //===========emoji picker===========
  const onEmojiClick = (event, emojiObject) => {
    // console.log("event", event, emojiObject);
    setMessageInput((prevMessage) => prevMessage + event.emoji);
  };

  //===========emoji picker===========
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setIsEmojiPickerOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setMobileMenuOpen(false);
      }
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(event.target)
      ) {
        setIsSearchBoxOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  //===========handle multiple file upload===========

  const handleMultipleFileUpload = async (files, userId) => {
    const filesArray = Array.from(files); // Convert FileList to an array
    for (const file of filesArray) {
      const formData = new FormData();
      formData.append("file", file);
      console.log("multiple file upload", file);

      try {
        const response = await axios.post(`${BASE_URL}/upload`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        });

        if (response.status === 200) {
          const { fileUrl, fileType } = response.data;

          await handleSendMessage({
            type: "file",
            content: file.name,
            fileUrl: fileUrl,
            fileType: fileType || file.type,
            size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          }, userId);
        }
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
      }
    }
  };

  //================screen sharing================

  const handleStartScreenShare = async () => {
    // console.log(selectedChat);
    if (selectedChat) {
      const success = await startSharing(selectedChat);
      // console.log(success);
      if (!success) {
        console.error("Failed to start screen sharing");
      }
    }
  };




  // =========================== video call=============================

  // Add call handling functions

  const handleMakeCall = async (type) => {
    if (!selectedChat) return;
    if (selectedChat?.members) {
      const success = await startCall(selectedChat._id, true, selectedChat, type);
      // const success = await startCall(selectedChat, type);
      if (!success) {
        console.error("Failed to start screen sharing");
      }
    } else {
      const success = await startCall(selectedChat._id, false, selectedChat, type);
      // const success = await startCall(selectedChat._id,type);
      if (!success) {
        console.error("Failed to start screen sharing");
      }
    }
  };

  // ===========================delete message=============================

  const handleContextMenu = (e, message) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      messageId: message._id,
      message: message,
    });
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      // Emit socket event for real-time deletion
      await socket.emit("delete-message", messageId);
      await dispatch(deleteMessage(messageId));
      if (selectedChat) {
        dispatch(getAllMessages({ selectedId: selectedChat._id }));
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
    setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
  };

  const handleEditMessage = (message) => {
    setEditingMessage(message);
    setMessageInput(message.content.content);
    setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  useEffect(() => {
    const handleClickaaa = () =>
      setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
    document.addEventListener("click", handleClickaaa);
    return () => document.removeEventListener("click", handleClickaaa);
  }, []);
  // ==================group chat=================

  const handleAddParticipants = () => {
    const data = {
      groupId: selectedChat._id,
      members: Array.from(selectedCallUsers),
      addedBy: userId,
    };
    dispatch(addParticipants(data));
    socket.emit("update-group", data);
    setGroupUsers([]);
    setGroupNewUsers([]);
    setSelectedCallUsers(new Set());
    setIsModalOpen(false);
    dispatch(getAllMessageUsers());
  };

  // Subscribe to group messages
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribeGroupMessages = subscribeToMessages((message) => {
      if (message.type === "group") {
        if (selectedChat) {
          dispatch(getAllMessages({ selectedId: selectedChat._id })); // Refresh messages if needed
        }
      } else if (message.type === "reaction") {
        if (selectedChat) {
          dispatch(getAllMessages({ selectedId: selectedChat._id })); // Refresh messages if needed
        }
      }
      if (
        message.type !== "status" &&
        message.type !== "read" &&
        message.type !== "reaction"
      ) {
        // Find sender name
        const sender = allUsers.find((user) => user._id === message.sender);
        const senderName = sender ? sender.userName : "Someone";

        // Show notification
        showMessageNotification(message, senderName);
      }
      dispatch(getAllMessageUsers());
      dispatch(getAllCallUsers());
    });

    return () => {
      unsubscribeGroupMessages?.();
    };
  }, [isConnected, selectedChat, notificationPermission, allUsers]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      type: messageInput instanceof FileList ? "file" : "text",
      content: messageInput,
    };

    if (selectedChat && selectedChat?.members?.length > 0) {
      handleSendGroupMessage(data); // Send group message
    } else if (data.type === "file") {
      handleMultipleFileUpload(messageInput);
    } else if (data.type === "text") {
      handleSendMessage(data);
    }
    setMessageInput("");
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      const element = messagesContainerRef.current;
      element.scrollTop = element.scrollHeight;
      setShowScrollToBottom(false);
    }
  };

  // Scroll event listener to show/hide the button
  useEffect(() => {
    scrollToBottom();
    const handleScroll = () => {
      if (messagesContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } =
          messagesContainerRef.current;
        // Show button if user is not at the bottom
        setShowScrollToBottom(scrollTop + clientHeight < scrollHeight);
      }
    };

    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, [messages]);

  // Scroll when chat is selected
  useEffect(() => {
    if (selectedChat) {
      scrollToBottom();
    }
  }, [selectedChat]);

  // Add this effect to ensure scrolling works after the component mounts
  useEffect(() => {
    scrollToBottom();
  }, []);

  // Ensure scroll happens after messages are loaded
  useEffect(() => {
    if (messages.length > 0) {
      const timeoutId = setTimeout(scrollToBottom, 100); // Delay to ensure DOM updates
      return () => clearTimeout(timeoutId);
    }
  }, [messages.length]);

  // Scroll after component updates
  useEffect(() => {
    const messageContainer = messagesContainerRef.current;
    if (messageContainer) {
      const config = { childList: true, subtree: true };

      const observer = new MutationObserver(() => {
        messageContainer.scrollTop = messageContainer.scrollHeight;
      });

      observer.observe(messageContainer, config);
      return () => observer.disconnect();
    }
  }, []);

  //===========group messages by date===========
  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach((message) => {
      if (message.isBlocked && message.sender !== currentUser) return;
      const date = new Date(message.createdAt).toLocaleDateString("en-GB");
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  const profileDropdown = () => {
    setIsDropdownOpen((prevState) => !prevState);
  };

  // console.log("dfbgsdg");


  const handleDropdownToggle = (messageId) => {
    setActiveMessageId((prev) => (prev === messageId ? null : messageId));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveMessageId(null); // Close the dropdown by setting activeMessageId to null
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  // ============================Log out ============================

  const handleEditClick = () => {
    setIsEditingUserName(true);
  };

  const handleUserNameChange = (e) => {
    setEditedUserName(e.target.value);
  };

  const handleUserNameBlur = () => {
    setIsEditingUserName(false);
    // Optionally, dispatch an action to update the username in the store
    // dispatch(updateUserName(editedUserName));
    dispatch(
      updateUser({ id: currentUser, values: { userName: editedUserName } })
    );
  };
  // ================== highlight word ==================

  const highlightText = (text, highlight) => {
    if (!highlight.trim()) {
      return text;
    }
    const regex = new RegExp(`(${highlight})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="highlight-text">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Function to count occurrences of a word in a message
  const countOccurrences = (text, word) => {
    if (!word.trim() || !text) return 0;
    const regex = new RegExp(word, "gi");
    return (text.match(regex) || []).length;
  };

  useEffect(() => {
    if (!searchInputbox.trim()) {
      setTotalMatches(0);
      return;
    }

    const matches = messages.reduce((count, message) => {
      const content =
        typeof message?.content?.content === "string"
          ? message?.content?.content
          : "";

      return count + countOccurrences(content, searchInputbox);
    }, 0);

    setTotalMatches(matches);
  }, [searchInputbox, messages]);

  useEffect(() => {
    if (selectedChat) {
      setIsSearchBoxOpen(false); // Close the search box
      setSearchInputbox(""); // Clear the search input
    }
  }, [selectedChat]);

  // Function to scroll to the current search result

  const scrollToSearchResult = (index) => {
    if (!searchInputbox.trim()) return;

    let currentMatchIndex = 0;
    let targetElement = null;
    let targetSpan = null;

    // Find all highlighted spans containing the search text
    const highlightedSpans = document.querySelectorAll(".highlight-text");
    // console.log("highlightedSpans", highlightedSpans);

    if (highlightedSpans.length > 0) {
      highlightedSpans.forEach((span) => {
        if (currentMatchIndex === index) {
          targetSpan = span;
          targetElement = span.closest(".message-content");
        }
        currentMatchIndex++;
      });
    }
    // console.log("targetElement", targetElement, targetSpan);

    // Scroll to the target element if found
    if (targetElement && targetSpan) {
      // Remove previous active highlights
      document.querySelectorAll(".active-search-result").forEach((el) => {
        el.classList.remove("active-search-result");
      });

      // Scroll the message into view
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      // Highlight the specific occurrence
      targetElement.classList.add("active-search-result");
      setTimeout(() => {
        targetElement.classList.remove("active-search-result");
      }, 2000);
    }
  };

  // Function to handle search navigation
  const handleSearchNavigation = (direction) => {
    if (totalMatches === 0) return;

    setCurrentSearchIndex((prevIndex) => {
      let newIndex;
      if (direction === "up") {
        newIndex = prevIndex <= 0 ? totalMatches - 1 : prevIndex - 1;
      } else {
        newIndex = prevIndex >= totalMatches - 1 ? 0 : prevIndex + 1;
      }
      scrollToSearchResult(newIndex);
      return newIndex;
    });
  };
  // Add state to manage recording
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0); // State to hold recording time

  // Timer effect for recording
  useEffect(() => {
    let interval = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1); // Increment recording time every second
      }, 1000);
    } else {
      setRecordingTime(0); // Reset recording time when not recording
    }
    return () => clearInterval(interval); // Cleanup on unmount
  }, [isRecording]);

  const handleVoiceMessage = async () => {
    if (!isRecording) {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            noiseSuppression: true,
            echoCancellation: true,
            sampleRate: 44100, // Set sample rate for better quality
          },
        });
        const recorder = new MediaRecorder(stream);
        const chunks = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        recorder.onstop = async () => {
          stopRecording();
          const audioBlob = new Blob(chunks, { type: "audio/webm" }); // Change to 'audio/webm' for better quality
          // console.log("Audio Blob:", audioBlob);

          // Dispatch the audio message
          if (selectedChat) {
            const data = {
              type: "file", // Determine the type based on input
              content: audioBlob, // The actual content of the message
            };
            // console.log("add", audioBlob);

            // Use the same upload logic as for other files
            const formData = new FormData();
            formData.append("file", audioBlob);

            try {
              const response = await axios.post(
                `${BASE_URL}/upload`,
                formData,
                {
                  headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${sessionStorage.getItem("token")}`,
                  },
                }
              );

              if (response.status === 200) {
                const { fileUrl, fileType } = response.data;

                await handleSendMessage({
                  type: "file",
                  content: "Audio Message",
                  fileUrl: fileUrl,
                  fileType: fileType || "audio/webm", // Update file type accordingly
                  size: `${(audioBlob.size / (1024 * 1024)).toFixed(2)} MB`,
                });
              }
            } catch (error) {
              console.error("Error uploading audio message:", error);
            }
          }
          // Reset audio chunks
          setAudioChunks([]);
          // Stop the audio stream to release the microphone
          stream.getTracks().forEach((track) => track.stop());
          setRecordingTime(0);
        };

        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    } else {
      // Stop recording
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  // Add intersection observer to track date headers
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const date = entry.target.getAttribute("data-date");
            setVisibleDate(date);
          }
        });
      },
      {
        threshold: 0.5, // Trigger when date header is 50% visible
        root: messagesContainerRef.current,
      }
    );

    // Observe all date headers
    const dateHeaders = document.querySelectorAll(".date-header");
    dateHeaders.forEach((header) => observer.observe(header));

    return () => {
      dateHeaders.forEach((header) => observer.unobserve(header));
    };
  }, [messages]);

  // Add floating date indicator
  const FloatingDateIndicator = () => (
    <div className="sticky top-0 z-10 flex justify-center my-2 pointer-events-none">
      <span className="bg-white/80 text-gray-600 text-sm px-5 py-1 rounded-full shadow">
        {visibleDate === new Date().toLocaleDateString("en-GB")
          ? "Today"
          : visibleDate}
      </span>
    </div>
  );

  useEffect(() => {
    if (isVideoCalling && !isReceiving) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error("Error accessing camera:", err);
        });

      // Cleanup function
      return () => {
        if (localVideoRef.current && localVideoRef.current.srcObject) {
          const tracks = localVideoRef.current.srcObject.getTracks();
          tracks.forEach((track) => track.stop());
          localVideoRef.current.srcObject = null;
        }
      };
    }
  }, [isVideoCalling, isReceiving]);

  const handleProfileImageClick = (imageUrl) => {
    setSelectedProfileImage(imageUrl);
    setIsProfileImageModalOpen(true);
  };

  // Update the handleCopyMessage function to handle both text and images
  const handleCopyMessage = async (message, callback) => {
    if (message.type === "file" && message.fileType?.includes("image/")) {
      try {
        const response = await fetch(
          `${IMG_URL}${message.fileUrl.replace(/\\/g, "/")}`
        );
        const blob = await response.blob();
        const item = new ClipboardItem({
          [blob.type]: blob,
        });

        await navigator.clipboard.write([item]);
        callback();
      } catch (error) {
        console.error("Error copying image:", error);
      }
    } else {
      // Handle text and emoji copying
      const content = message.content || message;
      navigator.clipboard.writeText(content).then(callback);
    }
  };

  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);

  // Add this useEffect to handle clicking outside the search dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Add this useEffect to handle paste events
  useEffect(() => {
    const handlePaste = async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageItems = Array.from(items).filter(
        (item) => item.type.indexOf("image") !== -1
      );

      for (const item of imageItems) {
        const file = item.getAsFile();
        if (file) {
          // Add the pasted file to selectedFiles
          setSelectedFiles((prev) => [...prev, file]);
        }
      }
    };

    // Add paste event listener to the document
    document.addEventListener("paste", handlePaste);

    // Cleanup
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, []);

  // Add useEffect to handle initial sidebar state based on screen width and selected chat
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 600) {
        setShowLeftSidebar(true);
      } else {

        setShowLeftSidebar(false);
      }
    };
    handleResize(); // Set initial state
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleFilter = (text) => {
    if (text == "chat") {
      setFilteredUsers(allMessageUsers);
      setCallUsers([]);
    } else {
      setFilteredUsers([]);
      setCallUsers(allCallUsers);
    }
  };
  // console.log("aaaaaa-------", callUsers);
  // clear chat
  const handleClearChat = async () => {
    await dispatch(clearChat({ selectedId: selectedChat._id })).then(() => {
      dispatch(getAllMessages({ selectedId: selectedChat._id }));
      dispatch(getAllMessageUsers());
      setIsClearChatModalOpen(false);
    });
  };

  const handleDeleteChat = async () => {
    await dispatch(clearChat({ selectedId: selectedChat._id })).then(() => {
      dispatch(deleteChat({ selectedUserId: selectedChat._id })).then(() => {
        if (user.pinChatFor?.includes(selectedChat?._id)) {
          dispatch(pinChat({ selectedUserId: selectedChat?._id, }));
        }
        dispatch(getAllMessages({ selectedId: selectedChat._id }));
        dispatch(getAllMessageUsers());
        setIsDeleteChatModalOpen(false);
        setSelectedChat('')
      });
    });


  };

  // Add useEffect to handle input focus when chat is selected
  useEffect(() => {
    if (selectedChat && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedChat]); // Dependency on selectedChat

  const getGridColumns = (count) => {
    if (count <= 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    if (count <= 4) return "grid-cols-2 md:grid-cols-2";
    if (count <= 6) return "grid-cols-3 md:grid-cols-3";
    if (count <= 9) return "grid-cols-3 md:grid-cols-3";
    if (count <= 12) return "grid-cols-4 md:grid-cols-4";
    return "grid-cols-5 md:grid-cols-5";
  };

  const [replyingTo, setReplyingTo] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [invitedUsers, setInvitedUsers] = useState([]);

  const handleReplyMessage = (message) => {
    setReplyingTo(message);
    // console.log("message", message);
    // setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleForwardMessage = (message) => {
    setForwardingMessage(message);
    setShowForwardModal(true);
    setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
  };

  const handleForwardSubmit = async (selectedUsers) => {
    try {
      for (const userId of selectedUsers) {
        await forwardMessage(userId, forwardingMessage);
      }
      setShowForwardModal(false);
      setForwardingMessage(null);
    } catch (error) {
      console.error("Error forwarding message:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false); // Close the dropdown if clicked outside
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []); // Add this effect to handle clicks outside

  // ======================Download file =====================
  const handleDownload = (fileUrl, fileName) => {
    const durl = `${IMG_URL}${fileUrl}`;
    fetch(durl)
      .then((response) => response.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      })
      .catch((error) => console.error("Download error:", error));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if ((menuOpen || docModel) && !event.target.closest(".optionMenu")) {
        setMenuOpen(false);
        setDocModel(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen, docModel]);

  useEffect(() => {
    // Set showLeftSidebar to true when no chat is selected
    if (!selectedChat) {
      setShowLeftSidebar(false);
    }
  }, [selectedChat]);

  useEffect(() => {
    // Listen for the resetSelectedChat event
    const handleResetSelectedChat = () => {
      setSelectedChat(null);
      setShowLeftSidebar(true);
    };

    window.addEventListener("resetSelectedChat", handleResetSelectedChat);

    return () => {
      window.removeEventListener("resetSelectedChat", handleResetSelectedChat);
    };
  }, []);

  useEffect(() => {
    // Listen for the showChatList event
    const handleShowChatList = (event) => {
      setShowGroups(false);
      if (event.detail?.selectedChat) {
        setSelectedChat(event.detail.selectedChat);
      }
      if (event.detail?.openGroupCreateModal) {
        setIsGroupCreateModalOpen(true);
      }
    };

    window.addEventListener("showChatList", handleShowChatList);

    return () => {
      window.removeEventListener("showChatList", handleShowChatList);
    };
  }, []);

  // const [showGroups, setShowGroups] = useState(false);
  const [selectedChatModule, setSelectedChatModule] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);

  useEffect(() => {
    // Listen for the showProfile event
    const handleShowProfile = () => {
      setShowProfile(true);
      setShowLeftSidebar(true);
      setShowGroups(false);
      setSelectedChatModule(false);
      setShowSettings(false);
      setShowCallHistory(false);
    };

    // Listen for the showGroups event
    const handleShowGroups = () => {
      setShowGroups(true);
      setShowProfile(false);
      setSelectedChatModule(false);
      setShowSettings(false);
      setShowCallHistory(false);
      setShowLeftSidebar(true);
    };

    // Listen for the showChatList event
    const handleShowChatList = () => {
      setSelectedChatModule(true);
      setShowProfile(false);
      setShowGroups(false);
      setShowSettings(false);
      setShowCallHistory(false);
      setShowLeftSidebar(true);
    };

    // Listen for the showSettings event
    const handleShowSettings = () => {
      setShowSettings(true);
      setShowProfile(false);
      setShowGroups(false);
      setSelectedChatModule(false);
      setShowCallHistory(false);
      setShowLeftSidebar(true);
    };

    // Listen for the showCall event
    const handleShowCall = () => {
      setShowCallHistory(true);
      setShowProfile(false);
      setShowGroups(false);
      setSelectedChatModule(false);
      setShowSettings(false);
      setShowLeftSidebar(true);
    };

    window.addEventListener("showProfile", handleShowProfile);
    window.addEventListener("showGroups", handleShowGroups);
    window.addEventListener("showChatList", handleShowChatList);
    window.addEventListener("showSettings", handleShowSettings);
    window.addEventListener("showCall", handleShowCall);

    return () => {
      window.removeEventListener("showProfile", handleShowProfile);
      window.removeEventListener("showGroups", handleShowGroups);
      window.removeEventListener("showChatList", handleShowChatList);
      window.removeEventListener("showSettings", handleShowSettings);
      window.removeEventListener("showCall", handleShowCall);
    };
  }, []);

  // Add this useEffect hook after the other useEffect hooks
  useEffect(() => {
    if (selectedChat && user) {
      // If the selectedChat is the current user, update it with the latest user data
      if (selectedChat._id === user._id) {
        setSelectedChat(user);
      }
    }
  }, [user, selectedChat?._id]);

  // Function to get video duration
  const getVideoDuration = (videoElement) => {
    return videoElement.duration; // Return the duration of the video
  };

  // Function to handle video metadata loading
  const handleVideoMetadataLoad = (messageId, videoElement) => {
    const duration = getVideoDuration(videoElement); // Get the duration using the utility function
    setVideoDurations((prev) => ({
      ...prev,
      [messageId]: duration, // Store duration by message ID
    }));
  };

  // let audioContext;

  // try {
  //   audioContext = new (window.AudioContext || window.webkitAudioContext)();
  //   console.log('AudioContext created successfully');
  // } catch (error) {
  //   console.error('Failed to create AudioContext:', error);
  // }

  // // Example of resuming the AudioContext
  // if (audioContext.state === 'suspended') {
  //   audioContext.resume().then(() => {
  //     console.log('AudioContext resumed');
  //   }).catch(err => {
  //     console.error('Error resuming AudioContext:', err);
  //   });
  // }

  // const analyser = audioContext.createAnalyser();
  // const dataArray = new Uint8Array(analyser.frequencyBinCount);
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState('');

  const [animationPhase, setAnimationPhase] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);
  const chunksRef = useRef([]);
  // For storing cumulative data
  const cumulativeDataRef = useRef([]);
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Bar animation loop
  // useEffect(() => {
  //   let barAnimationId;

  //   const animateBars = () => {
  //     setAnimationPhase(prev => (prev + 0.1) % 10);
  //     barAnimationId = requestAnimationFrame(animateBars);
  //   };

  //   if (recording || waveformData.length === 0) {
  //     barAnimationId = requestAnimationFrame(animateBars);
  //   }

  //   return () => {
  //     if (barAnimationId) {
  //       cancelAnimationFrame(barAnimationId);
  //     }
  //   };
  // }, []);

  // Start recording function
  const startRecording = async () => {
    try {
      // Reset cumulative data
      cumulativeDataRef.current = [];
      setWaveformData([]);

      // Get user's audio stream
      console.log(navigator)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Set up audio context and analyser
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048; // Larger FFT for more detailed data

      // Connect audio source to analyser
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // Start visualization and data collection
      collectAudioData();

      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);
      };

      // Start recording
      mediaRecorderRef.current.start(100); // Collect chunks every 100ms
      setRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      cancelAnimationFrame(animationRef.current);
      setRecording(false);
    }
  };
  const collectAudioData = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let frameCount = 0;

    const updateVisualData = () => {
      frameCount++;
      if (frameCount % 2 !== 0) {
        animationRef.current = requestAnimationFrame(updateVisualData);
        return;
      }

      analyserRef.current.getByteTimeDomainData(dataArray);

      // Calculate RMS (root mean square) value to represent volume
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const normalized = (dataArray[i] / 128.0) - 1.0;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / bufferLength);

      // Scale RMS with a quadratic function for more dynamic range
      const scaledRMS = Math.min(100, Math.max(12, rms * rms * 700));

      // Add this data point to our cumulative collection
      cumulativeDataRef.current.push(scaledRMS);

      // Keep a fixed number of data points
      if (cumulativeDataRef.current.length > 170) {
        cumulativeDataRef.current = cumulativeDataRef.current.slice(-170);
      }

      // Update state with the latest cumulative data
      setWaveformData([...cumulativeDataRef.current]);

      // Continue collecting data
      animationRef.current = requestAnimationFrame(updateVisualData);
    };

    updateVisualData();
  };
  const generateBarHeights = () => {
    if (waveformData.length > 0) {
      return waveformData;
    }

    // Generate idle animation that looks more like the reference image
    const barCount = 200;
    const idleData = [];

    for (let i = 0; i < barCount; i++) {
      // Create a pattern that mimics an audio waveform with varying heights
      const baseHeight = 15;
      const variation = 30;

      // Multiple sine waves with different frequencies and amplitudes
      const wave1 = Math.sin((i / 4) + animationPhase) * variation * 0.4;
      const wave2 = Math.sin((i / 7) + animationPhase * 1.3) * variation * 0.6;
      const wave3 = Math.sin((i / 3) + animationPhase * 0.7) * variation * 0.3;

      // Combine waves and ensure minimum height
      const waveHeight = baseHeight + Math.abs(wave1 + wave2 + wave3);
      idleData.push(waveHeight);
    }

    return idleData;
  };
  const barHeights = generateBarHeights();

  const [selectedCallUsers, setSelectedCallUsers] = useState(new Set());

  const handleEndCall = () => {
    setParticipantOpen(false);
    setSelectedCallUsers(new Set());
    // ... existing end call logic ...
  };


  // ==========================capture photo

  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [openCameraState, setOpenCameraState] = useState(false);

  // {{ edit_1 }} add state for facingMode & availability
  const [facingMode, setFacingMode] = useState('user');
  const [backCameraAvailable, setBackCameraAvailable] = useState(false);

  const openCamera = async () => {
    try {
      // {{ edit_2 }} request with current facingMode
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
      setCameraStream(stream);
      setOpenCameraState(true);

      // detect if an environment (back) camera exists
      const devices = await navigator.mediaDevices.enumerateDevices();
      const backCams = devices.filter(d =>
        d.kind === 'videoinput' && d.label.toLowerCase().includes('back')
      );
      if (backCams.length > 0) setBackCameraAvailable(true);

      if (videoRef.current) {
        // console.log(stream)
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing the camera: ", error);
    }
  };
  function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }
  // const capturePhoto = () => {
  //   const canvas = document.createElement('canvas');
  //   const context = canvas.getContext('2d');
  //   if (videoRef.current) {
  //     canvas.width = videoRef.current.videoWidth;
  //     canvas.height = videoRef.current.videoHeight;
  //     context.drawImage(videoRef.current, 0, 0);
  //     const photoData = canvas.toDataURL('image/jpeg', 0.8); // JPEG
  //     setPhoto(photoData); // Store the photo data
  //     handleUploadCapturePic(photoData);
  //     console.log(photoData);
  //   }
  // };
  const capturePhoto = () => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (videoRef.current) {
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      // {{ edit_1 }} only mirror when using front camera
      if (facingMode === 'user') {
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
      }

      context.drawImage(
        videoRef.current,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const photoData = canvas.toDataURL('image/jpeg', 0.8);
      setPhoto(photoData);
      handleUploadCapturePic(photoData);
      console.log(photoData);
    }
  };
  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setOpenCameraState(false);
      setCameraStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };
  const handleUploadCapturePic = (dataUrl) => {
    const blob = dataURLtoBlob(dataUrl);
    // Optionally, give it a filename
    const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
    console.log(file);

    handleMultipleFileUpload([file]);
    closeCamera();

  };

  // {{ edit_3 }} switchCamera toggles facingMode and re-opens the stream
  const switchCamera = async () => {
    try {
      const newFacing = facingMode === 'user' ? 'environment' : 'user';
      setFacingMode(newFacing);

      // stop old tracks
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacing }
      });
      setCameraStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error("Error switching camera:", err);
    }
  };

  // button
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isImageModalOpen || !selectedImage) return;

      const mediaMessages = messages.filter(message =>
        message.content &&
        message.content.fileType &&
        (message.content.fileType.startsWith('image/') || message.content.fileType.startsWith('video/'))
      );
      const currentIndex = mediaMessages.findIndex(message =>
        `${message.content.fileUrl.replace(/\\/g, '/')}` === selectedImage
      );

      if (e.key === 'ArrowLeft') {
        const prevIndex = (currentIndex - 1 + mediaMessages.length) % mediaMessages.length;
        setSelectedImage(`${mediaMessages[prevIndex].content.fileUrl.replace(/\\/g, '/')}`);
      } else if (e.key === 'ArrowRight') {
        const nextIndex = (currentIndex + 1) % mediaMessages.length;
        setSelectedImage(`${mediaMessages[nextIndex].content.fileUrl.replace(/\\/g, '/')}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isImageModalOpen, selectedImage, messages]);
  useEffect(() => {
    // Cleanup function to close the participant section when the component unmounts
    return () => {
      setParticipantOpen(false);
    };
  }, []);

  const handleUserJoin = (userId, stream) => {
    setUserStreams((prevStreams) => ({
      ...prevStreams,
      [userId]: stream, // Store the stream for the user
    }));
  };

  useEffect(() => {
    if (!socket) return; // Only add listener if socket is ready

    const handler = (data) => setIncomingCall(data);
    socket.on('incoming-call', handler);

    // Clean up the listener when the component unmounts or socket changes
    return () => {
      socket.off('incoming-call', handler);
    };
  }, [socket]);

  const getGridCols = (count) => {
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    if (count <= 4) return "grid-cols-2 md:grid-cols-2";
    if (count <= 6) return "grid-cols-3 md:grid-cols-3";
    if (count <= 9) return "grid-cols-3 md:grid-cols-3";
    if (count <= 12) return "grid-cols-4 md:grid-cols-4";
    return "grid-cols-5 md:grid-cols-5";
  };

  // console.log(remoteStreams);

  const demoUsers = [
    { id: 1, name: 'User 1', videoEnabled: true, audioEnabled: true },
  ];

  const [participants, setParticipants] = useState(Array.from(remoteStreams));
  const [isJoined, setIsJoined] = useState(false);

  // Simulate adding a new user when joining
  const handleJoinCall = () => {
    if (Array.from(remoteStreams).length < 12) {
      const newUser = {
        id: Array.from(remoteStreams).length + 1,
        name: `User ${Array.from(remoteStreams).length + 1}`,
        videoEnabled: Math.random() > 0.3,
        audioEnabled: Math.random() > 0.3
      };
      setParticipants([...Array.from(remoteStreams), newUser]);
    }
    setIsJoined(true);
  };

  // Determine optimal grid configuration based on participant count and screen size
  const getLayoutConfig = (count) => {
    if (count === 1) return { cols: 1, gap: 'gap-2' };
    if (count === 2) return { cols: 2, gap: 'gap-2' };
    if (count <= 4) return { cols: 2, gap: 'gap-2' };
    if (count <= 9) return { cols: 3, gap: 'gap-1' };
    return { cols: 4, gap: 'gap-1' };
  };

  // Arrange participants into rows
  const arrangeParticipantsInRows = (participants) => {
    const { cols } = getLayoutConfig(participants.length);
    const rows = [];

    for (let i = 0; i < participants.length; i += cols) {
      rows.push(participants.slice(i, i + cols));
    }

    return rows;
  };

  const participantRows = arrangeParticipantsInRows(Array.from(remoteStreams));
  const { gap } = getLayoutConfig(Array.from(remoteStreams).length);

  const [showBell, setShowBell] = useState(false);
  useEffect(() => {
    setShowBell(false);
    if (invitedUsers && invitedUsers.length > 0) {
      const timer = setTimeout(() => setShowBell(true), 30000);
      return () => clearTimeout(timer);
    }
  }, [invitedUsers]);


  return (
    <div className="flex h-screen bg-white transition-all duration-300">
      {!(isReceiving || isVideoCalling || isVoiceCalling) && (
        <Sidebar
          user={user}
          onProfileClick={(userId) => {
            // Find the ChatList component and set the selected profile
            const chatListElement = document.querySelector(".ml-16");
            if (chatListElement) {
              // Dispatch the custom event to show the profile
              const event = new CustomEvent("showProfile", {
                detail: { userId },
              });
              window.dispatchEvent(event);
            }
          }}
        />
      )}

      {/* Right Sidebar */}
      {!(isReceiving || isVideoCalling || isVoiceCalling) && (
        <>
          {/* Left Side */}

          <div
            className={`${window.innerWidth <= 600
              ? "ml-0 w-full"
              : "md:ml-16 md:w-[300px] lg:w-[380px] shrink-0"
              } ${showLeftSidebar ? "block" : "hidden md600:block"}`}
          >
            {showGroups && (
              <Groups
                setShowLeftSidebar={setShowLeftSidebar}
                setSelectedChat={setSelectedChat}
                selectedChat={selectedChat}
                isGroupCreateModalOpen={isGroupCreateModalOpen}
                setIsGroupCreateModalOpen={setIsGroupCreateModalOpen}
              />
            )}
            {showProfile && <Profile />}
            {selectedChatModule && (
              <ChatList
                allMessageUsers={allMessageUsers}
                currentUser={currentUser}
                onlineUsers={onlineUsers}
                setSelectedChat={setSelectedChat}
                setShowLeftSidebar={setShowLeftSidebar}
                IMG_URL={IMG_URL}
                selectedChat={selectedChat}
                allUsers={allUsers}
                handleMultipleFileUpload={handleMultipleFileUpload} // Pass the function here
                typingUsers={typingUsers}
              />
            )}
            {showSettings && <Setting />}
            {showCallHistory && (
              <CallHistory setShowLeftSidebar={setShowLeftSidebar} />
            )}
          </div>

          {/* Right Side */}
          <>
            <div
              className={`flex flex-col relative transition-all duration-300 ease-in-out bg-primary-light dark:bg-primary-dark ${showOverlay &&
                (isGroupModalOpen ||
                  isModalOpen ||
                  isGroupCreateModalOpen ||
                  isUserProfileModalOpen)
                ? "w-0 opacity-0"
                : "w-full opacity-100"
                } ${!showLeftSidebar ? "block" : "hidden md600:block"}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >

              {(!(
                isGroupModalOpen ||
                isModalOpen ||
                isGroupCreateModalOpen ||
                isUserProfileModalOpen
              ) ||
                !showOverlay) && (
                  <>
                    {selectedChat ? (
                      <>
                        <div
                          className="flex items-center justify-between p-4  relative dark:bg-[#1A1A1A] bg:primary-light border-b border-gray-200 dark:border-transparent"
                        // style={{ boxShadow: "0px 0px 5px 1px #80808054" }}
                        >
                          <div className="flex items-center">
                            {/* Add back button for mobile */}
                            {window.innerWidth <= 600 && (
                              <button
                                className=" text-gray-600 hover:text-gray-800 mr-2"
                                onClick={() => setShowLeftSidebar(true)}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-6 w-6"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                  />
                                </svg>
                              </button>
                            )}
                            <div
                              className="w-10 h-10 rounded-full bg-primary  overflow-hidden flex items-center justify-center cursor-pointer"
                              onClick={() => {
                                if (
                                  selectedChat?.photo &&
                                  selectedChat.photo !== "null"
                                ) {
                                  handleProfileImageClick(
                                    `${IMG_URL}${selectedChat.photo.replace(
                                      /\\/g,
                                      "/"
                                    )}`
                                  );
                                }
                              }}
                            >
                              {selectedChat?.photo && selectedChat.photo !== "null" && (selectedChat?.profilePhoto == "Everyone" || selectedChat.isGroup) ? (
                                <img
                                  src={`${IMG_URL}${selectedChat.photo.replace(
                                    /\\/g,
                                    "/"
                                  )}`}
                                  alt="Profile"
                                  className="object-cover h-full"
                                />
                              ) : (
                                <span className="text-white text-xl font-bold">
                                  {selectedChat?.userName &&
                                    selectedChat?.userName.includes(" ")
                                    ? selectedChat?.userName.split(
                                      " "
                                    )?.[0][0] +
                                    selectedChat?.userName.split(" ")?.[1][0]
                                    : selectedChat?.userName?.[0]}
                                </span>
                              )}
                            </div>
                            <div
                              className="ml-3 cursor-pointer"
                              onClick={() => {
                                console.log("selectedChat", selectedChat);
                                if (selectedChat?.members) {
                                  console.log("selectedChat");
                                  setIsGroupModalOpen(true);
                                } else {
                                  setIsUserProfileModalOpen(true);
                                  // setIsModalOpen(true);
                                }
                              }}
                            >
                              <div className="font-medium dark:text-primary-light">
                                {selectedChat?.userName || "Select a chat"}
                              </div>
                              {selectedChat?.members ? (
                                <div className="text-sm text-gray-500">
                                  {selectedChat?.members?.length} participants
                                </div>
                              ) : (
                                <div
                                  className={`text-sm ${onlineUsers.includes(selectedChat?._id)
                                    ? "text-green-500"
                                    : "text-gray-500"
                                    }`}
                                >
                                  {onlineUsers.includes(selectedChat?._id)
                                    ? "Online"
                                    : "Offline"}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            {/* Show regular icons on larger screens */}
                            <div className="hidden md:flex items-center gap-4 dark:text-white">
                              <IoMdSearch
                                className="w-6 h-6 cursor-pointer"
                                onClick={() =>
                                  setIsSearchBoxOpen((prev) => !prev)
                                }
                                title="Find"
                                data-tooltip="Find"
                                data-tooltip-delay="0"
                                data-tooltip-duration="0"
                              />

                              {/* <MdOutlineDeleteSweep
                      onClick={() => setIsClearChatModalOpen(true)}
                      title="Clear chat"
                      data-tooltip="Clear chat"
                      data-tooltip-delay="0"
                      data-tooltip-duration="0"
                      className="w-7 h-7 cursor-pointer hover:text-red-600 text-4xl"
                    /> */}
                              {isSharing ? (
                                <LuScreenShareOff
                                  title="Stop sharing"
                                  data-tooltip="Stop sharing"
                                  data-tooltip-delay="0"
                                  data-tooltip-duration="0"
                                  className="w-6 h-6 cursor-pointer text-red-500 hover:text-red-600 animate-bounce"
                                  onClick={() => cleanupConnection()}
                                />
                              ) : (
                                // <LuScreenShare
                                //   title="Screen sharing"
                                //   data-tooltip="Screen sharing"
                                //   data-tooltip-delay="0"
                                //   data-tooltip-duration="0"
                                //   className="w-6 h-6 cursor-pointer"
                                //   onClick={() => handleStartScreenShare()}
                                // />
                                <div
                                  className="w-6 h-6 cursor-pointer"
                                  onClick={() => handleStartScreenShare()}
                                >
                                  <svg
                                    width={24}
                                    height={24}
                                    x={0}
                                    y={0}
                                    viewBox="0 0 32 32"
                                    style={{
                                      enableBackground: "new 0 0 512 512",
                                    }}
                                    xmlSpace="preserve"
                                    className
                                  >
                                    <g>
                                      <path
                                        d="M14.592 8.39a2.453 2.453 0 0 1 2.817 0l4.764 3.339a1 1 0 0 1-1.148 1.639l-5.024-3.522-5.024 3.522a1 1 0 0 1-1.148-1.639l4.764-3.339z"
                                        fill="currentColor"
                                        opacity={1}
                                        data-original="#000000"
                                      />
                                      <path
                                        d="M15 8.742h2v10.815a1 1 0 0 1-2 0z"
                                        fill="currentColor"
                                        opacity={1}
                                        data-original="#000000"
                                      />
                                      <path
                                        d="M25 25H7c-3.309 0-6-2.691-6-6V9c0-3.308 2.691-6 6-6h18c3.309 0 6 2.691 6 6v10c0 3.309-2.691 6-6 6zM7 5C4.794 5 3 6.794 3 9v10c0 2.206 1.794 4 4 4h18c2.206 0 4-1.794 4-4V9c0-2.206-1.794-4-4-4z"
                                        fill="currentColor"
                                        opacity={1}
                                        data-original="#000000"
                                      />
                                      <path
                                        d="M19 29h-6c-1.654 0-3-1.346-3-3v-3h12v3c0 1.654-1.346 3-3 3zm-7-4v1a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-1z"
                                        fill="currentColor"
                                        opacity={1}
                                        data-original="#000000"
                                      />
                                    </g>
                                  </svg>
                                </div>
                              )}

                              <IoVideocamOutline
                                className="w-6 h-6 cursor-pointer"
                                onClick={() => handleMakeCall("video")}
                                title="Video Call"
                                data-tooltip="Video Call"
                                data-tooltip-delay="0"
                                data-tooltip-duration="0"
                              />
                              <IoCallOutline
                                className="w-6 h-6 cursor-pointer"
                                onClick={() => handleMakeCall("voice")}
                                title="Voice Call"
                                data-tooltip="Voice Call"
                                data-tooltip-delay="0"
                                data-tooltip-duration="0"
                              />
                              <BsThreeDotsVertical
                                className="text-2xl cursor-pointer "
                                onClick={() => setMenuOpen(!menuOpen)}
                                title="More options"
                                data-tooltip="More options"
                                data-tooltip-delay="0"
                                data-tooltip-duration="0"
                              />
                              {menuOpen && (
                                <div className="optionMenu absolute right-5 top-14 bg-white dark:bg-gray-800 shadow-lg rounded-md p-2 z-10 min-w-36">
                                  <ul>
                                    <li
                                      className="py-2 px-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2"
                                      onClick={async () => {
                                        await dispatch(pinChat({ selectedUserId: selectedChat?._id, }));
                                        await dispatch(getUser(currentUser));
                                        await dispatch(getAllMessageUsers());
                                      }}
                                    >
                                      {console.log(user)}

                                      <SlPin className="text-lg" />{" "}
                                      {user.pinChatFor?.includes(selectedChat?._id)
                                        ? "UnPin Chat"
                                        : "Pin Chat"}
                                    </li>

                                    <li className="py-2 px-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2"
                                      onClick={async () => {
                                        await dispatch(muteChat({ selectedUserId: selectedChat?._id, }));
                                        await dispatch(getUser(currentUser));
                                        await dispatch(getAllMessageUsers());
                                      }}>
                                      {/* <GoMute className="text-lg" />  */}
                                      {user.muteUsers?.includes(selectedChat?._id) ?
                                        <>
                                          <IoVolumeOffOutline className="text-2xl w-5" />
                                          UnMute
                                        </>
                                        :
                                        <>
                                          <svg width="19" height="16" viewBox="0 0 19 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9.20285 4.59811L13.4544 1.40611C13.5041 1.36989 13.5626 1.34782 13.6239 1.34226C13.6851 1.33669 13.7467 1.34784 13.8021 1.37451C13.8575 1.40118 13.9046 1.44237 13.9384 1.4937C13.9722 1.54504 13.9915 1.60458 13.9942 1.666V8.99627C13.9942 9.173 14.0644 9.3425 14.1894 9.46747C14.3143 9.59245 14.4838 9.66265 14.6606 9.66265C14.8373 9.66265 15.0068 9.59245 15.1318 9.46747C15.2567 9.3425 15.3269 9.173 15.3269 8.99627V1.666C15.3269 1.35661 15.2408 1.05334 15.0781 0.790152C14.9155 0.526969 14.6827 0.31428 14.406 0.175916C14.1293 0.0375526 13.8195 -0.0210183 13.5114 0.00676668C13.2032 0.0345517 12.9089 0.147595 12.6614 0.333229L8.40318 3.53189C8.33317 3.5844 8.27419 3.65018 8.2296 3.72548C8.18502 3.80078 8.1557 3.88413 8.14332 3.97076C8.13095 4.05739 8.13576 4.14561 8.15748 4.23038C8.17919 4.31516 8.2174 4.39482 8.2699 4.46483C8.32241 4.53484 8.38819 4.59382 8.46349 4.63841C8.53879 4.68299 8.62214 4.71231 8.70877 4.72469C8.7954 4.73706 8.88363 4.73226 8.9684 4.71054C9.05317 4.68882 9.13284 4.65062 9.20285 4.59811ZM18.4256 14.8205L1.09957 0.159968C0.965254 0.0450888 0.7908 -0.0117266 0.61459 0.00202033C0.438379 0.0157672 0.274847 0.0989504 0.159968 0.233271C0.0450888 0.367591 -0.0117266 0.542045 0.00202033 0.718255C0.0157672 0.894466 0.0989503 1.058 0.23327 1.17288L4.09165 4.43818C3.85605 4.62435 3.6654 4.86121 3.53389 5.13117C3.40237 5.40112 3.33336 5.69724 3.33197 5.99752V9.99585C3.33197 10.5261 3.5426 11.0346 3.91751 11.4095C4.29243 11.7844 4.80092 11.995 5.33113 11.995H7.77678L12.6614 15.6668C12.9089 15.8524 13.2032 15.9655 13.5114 15.9933C13.8195 16.0211 14.1293 15.9625 14.406 15.8241C14.6827 15.6858 14.9155 15.4731 15.0781 15.2099C15.2408 14.9467 15.3269 14.6434 15.3269 14.334V13.9542L17.5593 15.8401C17.681 15.9409 17.8345 15.9952 17.9925 15.9933C18.1287 15.9933 18.2617 15.9516 18.3735 15.8737C18.4852 15.7959 18.5705 15.6856 18.6177 15.5578C18.6649 15.43 18.6718 15.2908 18.6374 15.159C18.6031 15.0272 18.5292 14.909 18.4256 14.8205ZM13.9942 14.3274C13.9899 14.3873 13.97 14.4452 13.9366 14.4951C13.9032 14.5451 13.8573 14.5855 13.8035 14.6124C13.7497 14.6393 13.6899 14.6518 13.6298 14.6485C13.5698 14.6453 13.5116 14.6265 13.4611 14.5939L8.39652 10.7955C8.28117 10.709 8.14087 10.6622 7.99669 10.6622H5.33113C5.1544 10.6622 4.9849 10.592 4.85993 10.4671C4.73496 10.3421 4.66475 10.1726 4.66475 9.99585V5.99752C4.66098 5.84348 4.71072 5.69289 4.80549 5.57139C4.90026 5.44989 5.0342 5.36499 5.18453 5.33113L13.9942 12.8147V14.3274Z" fill="currentColor" />
                                          </svg>
                                          Mute
                                        </>}
                                    </li>
                                    {selectedChat?.members && (
                                      <li
                                        className="py-2 px-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2"
                                        onClick={() => {
                                          setIsModalOpen(true);
                                        }}>
                                        <RiUserAddLine
                                          title="Add to group"
                                          data-tooltip="Add to group"
                                          data-tooltip-delay="0"
                                          data-tooltip-duration="0"
                                          className=" cursor-pointer text-lg" />
                                        Add Members
                                      </li>
                                    )}
                                    <li
                                      className="py-2 px-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2"
                                      onClick={async () => {
                                        await dispatch(
                                          archiveUser({
                                            selectedUserId: selectedChat?._id,
                                          })
                                        );
                                        await dispatch(getUser(currentUser));
                                      }}
                                    >
                                      <IoArchiveOutline className="text-lg" />
                                      {user.archiveUsers.includes(
                                        selectedChat?._id
                                      )
                                        ? "UnArchive Chat"
                                        : "Archive Chat"}
                                    </li>
                                    <li
                                      onClick={() => {
                                        setIsClearChatModalOpen(true);
                                      }}
                                      className="py-2 px-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2"
                                    >
                                      <MdOutlineCancel className="text-lg" />{" "}
                                      Clear Chat
                                    </li>

                                    <li
                                      onClick={() => {
                                        setIsDeleteChatModalOpen(true);
                                      }}
                                      className="py-2 px-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2"
                                    >
                                      <RiDeleteBinLine className="text-lg" />{" "}
                                      Delete Chat
                                    </li>
                                    <li
                                      className="py-2 px-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2 text-red-500"
                                      onClick={async () => {
                                        await dispatch(
                                          blockUser({
                                            selectedUserId: selectedChat?._id,
                                          })
                                        );
                                        await dispatch(getUser(currentUser));
                                        await dispatch(getAllMessageUsers());
                                      }}
                                    >
                                      <MdOutlineBlock className="text-lg text-red-500" />
                                      {user.blockedUsers?.includes(
                                        selectedChat?._id
                                      )
                                        ? "Unblock"
                                        : "Block"}
                                    </li>
                                  </ul>
                                </div>
                              )}
                            </div>

                            {/* Show three dots menu on mobile */}
                            <div className="md:hidden relative mobile-menu flex items-center gap-2">
                              <IoMdSearch
                                className="w-6 h-6 cursor-pointer"
                                onClick={() =>
                                  setIsSearchBoxOpen((prev) => !prev)
                                }
                                title="Find"
                                data-tooltip="Find"
                                data-tooltip-delay="0"
                                data-tooltip-duration="0"
                              />
                              <BsThreeDotsVertical
                                className="w-6 h-6 cursor-pointer"
                                onClick={() =>
                                  setMobileMenuOpen(!mobileMenuOpen)
                                }
                              />

                              {mobileMenuOpen && (
                                <div
                                  className="absolute right-0 top-full mt-2 bg-white border rounded-lg shadow-lg z-50"
                                  ref={mobileMenuRef}
                                >
                                  <div className="py-2 w-48">
                                    <button
                                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center text-nowrap"
                                      onClick={() => {
                                        setIsClearChatModalOpen(true);
                                        setMobileMenuOpen(false);
                                      }}
                                    >
                                      <MdOutlineDeleteSweep className="w-5 h-5 mr-2" />
                                      <span>Clear Chat</span>
                                    </button>

                                    <button
                                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center text-nowrap"
                                      onClick={() => {
                                        setIsDeleteChatModalOpen(true);
                                        setMobileMenuOpen(false);
                                      }}
                                    >
                                      <RiDeleteBinLine className="w-5 h-5 mr-2" />
                                      <span>Delete Chat</span>
                                    </button>

                                    <button
                                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center text-nowrap"
                                      onClick={() => {
                                        handleStartScreenShare();
                                        setMobileMenuOpen(false);
                                      }}
                                    >
                                      <LuScreenShare className="w-5 h-5 mr-2" />
                                      <span>Screen Share</span>
                                    </button>

                                    {selectedChat?.members && (
                                      <button
                                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center text-nowrap"
                                        onClick={() => {
                                          if (selectedChat?.members) {
                                            setGroupUsers(
                                              selectedChat?.members
                                            );
                                          } else {
                                            setGroupUsers([selectedChat?._id]);
                                          }
                                          setIsModalOpen(true);
                                          setMobileMenuOpen(false);
                                        }}
                                      >
                                        <MdGroupAdd className="w-5 h-5 mr-2" />
                                        <span>Add to Group</span>
                                      </button>
                                    )}

                                    <button
                                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center text-nowrap"
                                      onClick={() => {
                                        handleMakeCall("video");
                                        setMobileMenuOpen(false);
                                      }}
                                    >
                                      <GoDeviceCameraVideo className="w-5 h-5 mr-2" />
                                      <span>Video Call</span>
                                    </button>

                                    <button
                                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                                      onClick={() => {
                                        handleMakeCall("voice");
                                        setMobileMenuOpen(false);
                                      }}
                                    >
                                      <IoCallOutline className="w-5 h-5 mr-2" />
                                      <span>Voice Call</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {isSearchBoxOpen && (
                          <div className="absolute top-32 right-0 left-[50%] max-w-[700px] w-full bg-white dark:bg-[#202020] dark:text-gray-400 text-gray-700  rounded-lg shadow-lg p-4 py-5 z-50 flex items-center border-rounded justify-between"
                            style={{
                              transform: "translate(-50%, -50%)",
                            }}>
                            <div
                              className="flex items-center bg-gray-200 dark:bg-white/15 w-[90%] px-4 rounded-md"
                              ref={searchBoxRef}
                            >
                              <FaSearch className="text-gray-500 mr-2" />
                              <input
                                type="text"
                                placeholder="Search..."
                                className="flex-1 p-2 outline-none min-w-[20px] bg-transparent"
                                value={searchInputbox}
                                onChange={(e) => {
                                  setSearchInputbox(e.target.value);
                                  setCurrentSearchIndex(0); // Reset current search index
                                }}
                              />
                              <span className="mx-2 text-gray-500">
                                {totalMatches > 0
                                  ? `${currentSearchIndex + 1} / ${totalMatches}`
                                  : "0 / 0"}
                              </span>
                              <button
                                className="ms-5 mr-3 hover:text-black hover:dark:text-white text-xl"
                                onClick={() => handleSearchNavigation("up")}
                              >
                                <IoIosArrowUp />
                              </button>
                              <button
                                className="hover:text-black hover:dark:text-white text-xl"
                                onClick={() => handleSearchNavigation("down")}
                              >
                                <IoIosArrowDown />
                              </button>

                            </div>
                            <button
                              className=" ms-5 text-xl font-bold hover:text-black hover:dark:text-white"
                              onClick={() => {
                                setIsSearchBoxOpen(false);
                                setSearchInputbox(""); // Clear the input box
                              }}
                            >
                              <RxCross2 />
                            </button>
                          </div>
                        )}


                        {/*========== Messages ==========*/}
                        <div className="relative">
                          {/* {console.log("replyingTo",replyingTo)} */}
                          {isDragging && (
                            <div className="absolute inset-0 flex items-center justify-center bg-primary-dark/15 dark:bg-primary-light/15 backdrop-blur-sm z-50 p-8">
                              <div className="rounded-lg p-8 w-full h-full mx-4 transform transition-all border-2 border-white border-dashed flex items-center justify-center">
                                <div className="text-center">
                                  <div className="mb-4">
                                    <svg className="w-20 h-20 mx-auto text-primary dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                  </div>
                                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Drag and Drop here</h3>
                                </div>
                              </div>
                            </div>
                          )}
                          <div
                            className={`flex-1 overflow-y-auto p-4 modal_scroll border-dashed scrollbar-hide`}
                            style={{
                              height:
                                selectedFiles.length > 0
                                  ? "calc(100vh -  276px)"
                                  : replyingTo
                                    ? replyingTo?.content?.fileType &&
                                      replyingTo?.content?.fileType?.startsWith(
                                        "image/"
                                      )
                                      ? "calc(100vh - 280px)"
                                      : "calc(100vh -  229px)"
                                    : window.innerWidth < 768
                                      ? "calc(100vh - 179px)"
                                      : "calc(100vh - 173px)",
                            }}
                            ref={messagesContainerRef}
                          >
                            {/* {visibleDate && <FloatingDateIndicator />} */}

                            {cameraStream ? <>

                            </> :
                              <MessageList
                                messages={messages}
                                groupMessagesByDate={groupMessagesByDate}
                                userId={userId}
                                handleMakeCall={handleMakeCall}
                                handleContextMenu={handleContextMenu}
                                handleDropdownToggle={handleDropdownToggle}
                                handleEditMessage={handleEditMessage}
                                handleDeleteMessage={handleDeleteMessage}
                                handleCopyMessage={handleCopyMessage}
                                handleReplyMessage={handleReplyMessage}
                                handleForwardMessage={handleForwardMessage}
                                highlightText={highlightText}
                                searchInputbox={searchInputbox}
                                activeMessageId={activeMessageId}
                                contextMenu={contextMenu}
                                setContextMenu={setContextMenu}
                                setActiveMessageId={setActiveMessageId}
                                allUsers={allUsers}
                                selectedChat={selectedChat}
                                IMG_URL={IMG_URL}
                                showEmojiPicker={showEmojiPicker}
                                setShowEmojiPicker={setShowEmojiPicker}
                                addMessageReaction={addMessageReaction}
                                setSelectedFiles={setSelectedFiles}
                                selectedFiles={selectedFiles}
                                setReplyingTo={setReplyingTo}
                                replyingTo={replyingTo}
                                setMessageInput={setMessageInput}
                                messageInput={messageInput}
                                handleImageClick={handleImageClick}
                                sendPrivateMessage={sendPrivateMessage}
                                typingUsers={typingUsers}
                              />
                            }
                            <div className="relative" style={{ maxHeight: "calc(100vh-300px)" }}>
                              {openCameraState &&
                                <button className="absolute top-2 right-2 text-white z-10 text-xl" onClick={() => { closeCamera() }}>
                                  <RxCross2 />
                                </button>
                              }
                              <video
                                ref={videoRef}
                                className="w-full"
                                autoPlay
                                // -   style={{ display: cameraStream ? 'block' : 'none', transform: 'scaleX(-1)' }}
                                // only mirror when using front camera
                                style={{
                                  display: cameraStream ? 'block' : 'none',
                                  transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
                                }}
                              />
                              {openCameraState && (
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                                  <button className="btn  text-white  rounded-full border-4 border-white hover:border-white/75" onClick={capturePhoto}>
                                    <div className="bg-white w-10 h-10  rounded-full m-1 hover:bg-white/80 "></div>
                                  </button>
                                </div>

                              )}

                              {openCameraState && backCameraAvailable && (
                                <button
                                  className="btn absolute bottom-3 right-4 text-white rounded-full "
                                  onClick={switchCamera}
                                >
                                  <div className="bg-white/40 w-10 h-10 flex items-center justify-center text-2xl rounded-full hover:bg-white/80">
                                    <MdOutlineFlipCameraIos />
                                  </div>
                                </button>
                              )}
                            </div>
                          </div>

                          {selectedFiles && selectedFiles.length > 0 && (
                            <div className="flex px-6  dark:bg-primary-dark">
                              {selectedFiles.map((file, index) => {
                                const fileUrl = URL.createObjectURL(file); // Create a URL for the file
                                let fileIcon;
                                if (file.type.startsWith("image/")) {
                                  fileIcon = (
                                    <img
                                      src={fileUrl}
                                      alt={`Selected ${index}`}
                                      className="w-20 h-[40px] object-cover "
                                    />
                                  );
                                } else if (file.type === "application/pdf") {
                                  fileIcon = (
                                    <FaFilePdf className="w-20 h-[40px] text-gray-500" />
                                  ); // PDF file icon
                                } else if (
                                  file.type === "application/vnd.ms-excel" ||
                                  file.type ===
                                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                ) {
                                  fileIcon = (
                                    <FaFileExcel className="w-20 h-[40px] text-gray-500" />
                                  ); // Excel file icon
                                } else if (
                                  file.type === "application/msword" ||
                                  file.type ===
                                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                ) {
                                  fileIcon = (
                                    <FaFileWord className="w-20 h-[40px] text-gray-500" />
                                  ); // Word file icon
                                } else if (
                                  file.type === "application/vnd.ms-powerpoint" ||
                                  file.type ===
                                  "application/vnd.openxmlformats-officedocument.presentationml.presentation"
                                ) {
                                  fileIcon = (
                                    <FaFilePowerpoint className="w-20 h-[40px] text-gray-500" />
                                  ); // PowerPoint file icon
                                } else if (file.type === "application/zip") {
                                  fileIcon = (
                                    <FaFileArchive className="w-20 h-[40px] text-gray-500" />
                                  ); // ZIP file icon
                                } else {
                                  fileIcon = (
                                    <FaPaperclip className="w-20 h-[40px] text-gray-500" />
                                  ); // Generic file icon
                                }
                                return (
                                  <div className=" rounded-t-lg  p-2">
                                    <div
                                      key={index}
                                      className="relative mx-1 flex flex-col items-center w-20 h-20 p-1 overflow-hidden dark:bg-primary-light/70 bg-primary-dark/30 rounded-lg"
                                    >
                                      {fileIcon}
                                      <div className="w-full text-sm text-ellipsis  text-nowrap ">
                                        {file.name.length > 8 ? `${file.name.substring(0, 8)}...` : file.name}
                                      </div>{" "}
                                      {/* Display file name */}
                                      <span className="text-xs text-gray-500">
                                        {(file.size / (1024 * 1024)).toFixed(2)}{" "}
                                        MB
                                      </span>{" "}
                                      {/* Display file size */}
                                      <button
                                        className="absolute top-1 right-1 bg-white rounded-full"
                                        onClick={() => {
                                          setSelectedFiles(
                                            selectedFiles.filter(
                                              (_, i) => i !== index
                                            )
                                          );
                                        }}
                                      >
                                        <RxCross2 />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {replyingTo && (
                            <div className="w-full dark:bg-primary-dark/15">
                              <div className="bg-gray-100 dark:bg-primary-dark/15 p-3 rounded-t-lg flex justify-between items-start border-l-4 border-blue-500">
                                <div>
                                  <div className="text-sm text-blue-500 font-medium">
                                    Replying to{" "}
                                    {
                                      allUsers.find(
                                        (user) => user._id === replyingTo.sender
                                      )?.userName
                                    }
                                  </div>
                                  <div className="text-gray-600 text-sm line-clamp-2">
                                    {console.log(
                                      replyingTo.content.fileType === "image/jpeg"
                                    )}
                                    {replyingTo.content.content}
                                    {replyingTo?.content?.fileType &&
                                      replyingTo?.content?.fileType?.startsWith(
                                        "image/"
                                      ) && (
                                        <img
                                          src={`${IMG_URL}${replyingTo.content.fileUrl.replace(
                                            /\\/g,
                                            "/"
                                          )}`}
                                          alt=""
                                          className="h-10"
                                        />
                                      )}
                                  </div>
                                  <button
                                    onClick={() => setReplyingTo(null)}
                                    className="text-gray-500 hover:text-gray-700"
                                  >
                                    <RxCross2 size={20} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/*========== Message Input ==========*/}
                          {selectedChat &&
                            (user.blockedUsers?.includes(selectedChat._id) ? (
                              <div className="w-full mx-auto px-4 py-2 mb-5 md:mb-0 dark:bg-primary-dark/95 text-white">
                                <div className="text-center text-red-700 mb-2">
                                  This user is blocked.
                                </div>
                                <div className="flex justify-center items-center gap-4 mb-4">
                                  <button
                                    className="bg-primary  dark:hover:bg-primary/70 py-1 rounded-md w-32"
                                    onClick={() => {
                                      setIsDeleteChatModalOpen(true);
                                    }}
                                  >
                                    Delete Chat
                                  </button>

                                  <button
                                    className="bg-primary  dark:hover:bg-primary/70 py-1 rounded-md w-32"
                                    onClick={async () => {
                                      await dispatch(
                                        blockUser({
                                          selectedUserId: selectedChat?._id,
                                        })
                                      );
                                      await dispatch(getUser(currentUser));
                                      await dispatch(getAllMessageUsers());
                                    }}
                                  >
                                    Unblock
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="w-full mx-auto px-4 py-3 mb-5 md:mb-0 dark:bg-[#1A1A1A]">
                                <form
                                  onSubmit={handleSubmit}
                                  className={`flex items-center gap-2 ${replyingTo || selectedFiles.length > 0
                                    ? "rounded-b-lg"
                                    : "rounded-lg"
                                    } md:px-4 md:py-2 w-full max-w-full`}
                                >
                                  {isRecording ?
                                    <>
                                      <div>
                                        <button
                                          type="button"
                                          className="p-2 hover:bg-gray-100 rounded-full transition-colors bg-primary  dark:text-white dark:hover:bg-primary dark:hover:text-black"
                                          aria-label="Voice message"
                                          onClick={handleVoiceMessage}
                                        >
                                          <IoMicOutline
                                            className={`w-6 h-6 ${isRecording ? "text-white" : ""
                                              }`}
                                          />
                                        </button>

                                      </div>
                                      <div className="flex-1">
                                        <div className=" w-full h-9 rounded-lg px-4  overflow-hidden">
                                          <div className="flex items-center justify-start h-full w-full relative">
                                            <div className="flex items-center  gap-1 h-full absolute">
                                              {barHeights.map((height, index) => {
                                                // Calculate a height that centers around the middle
                                                const variationFactor = recording ? 1 : 0.6;
                                                const barHeight = height * variationFactor;

                                                return (
                                                  <div
                                                    key={index}
                                                    className="flex flex-col justify-center h-full"
                                                  >
                                                    <div
                                                      style={{
                                                        width: '3px',
                                                        height: `${barHeight * 2}%`,
                                                        marginTop: `-${barHeight / 2}%`
                                                      }}
                                                      className="bg-black dark:bg-white rounded-xl"
                                                    />
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      <div className=" text-black/60 dark:text-white/60  me-3 text-sm">
                                        {isRecording && <span>{new Date(recordingTime * 1000).toISOString().substr(14, 5)}</span>} {/* Display recording time in mm:ss format */}
                                      </div>
                                    </>

                                    : ''}

                                  {!isRecording && (
                                    <>
                                      <div className="flex-1 min-w-0 p-1 md:p-2 rounded-md bg-[#e5e7eb] dark:text-white dark:bg-white/10 relative">
                                        <input
                                          ref={inputRef}
                                          type="text"
                                          value={messageInput}
                                          onChange={handleInputChange}
                                          placeholder={
                                            editingMessage
                                              ? "Edit message..."
                                              : "Type a message..."
                                          }
                                          className="ps-9 md:ps-2 w-full px-2 py-1 outline-none text-black dark:text-white bg-transparent"
                                          onKeyDown={async (e) => {
                                            if (e.key === "Enter") {
                                              e.preventDefault();

                                              if (selectedFiles.length > 0) {
                                                await handleMultipleFileUpload(
                                                  selectedFiles
                                                ); // Upload selected files
                                                setSelectedFiles([]); // Clear selected files after sending
                                              }
                                              await handleSubmit(e);
                                            } else if (
                                              e.key === "Escape" &&
                                              editingMessage
                                            ) {
                                              setEditingMessage(null);
                                              setMessageInput("");
                                            }
                                          }}
                                        />
                                        <button
                                          type="button"
                                          className="absolute top-1/2 left-1 block md:hidden -translate-y-1/2 p-1  hover:bg-gray-100 dark:text-white dark:hover:bg-primary dark:hover:text-black rounded-full transition-colors flex-shrink-0"
                                          aria-label="Add emoji"
                                          onClick={() =>
                                            setIsEmojiPickerOpen(!isEmojiPickerOpen)
                                          }
                                        >
                                          <PiSmiley className="w-6 h-6 " />
                                        </button>
                                        <button
                                          type="button"
                                          className="p-1 absolute top-1/2 right-1 block md:hidden -translate-y-1/2 hover:bg-gray-100 rounded-full transition-colors dark:text-white dark:hover:bg-primary dark:hover:text-black"
                                          aria-label="Attach file"
                                          onClick={() =>
                                            // document
                                            //   .getElementById("file-upload")
                                            //   .click()
                                            setDocModel(!docModel)

                                          }
                                        >
                                          {selectedFiles &&
                                            selectedFiles.length > 0 ? (
                                            <GoPlusCircle className="w-6 h-6 " />
                                          ) : (
                                            <svg
                                              width={24}
                                              height={24}
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              xmlns="http://www.w3.org/2000/svg"
                                              className="w-6 h-6"
                                            >
                                              <path
                                                d="M11.9688 12V15.5C11.9688 17.43 13.5388 19 15.4688 19C17.3987 19 18.9688 17.43 18.9688 15.5V10C18.9688 6.13 15.8388 3 11.9688 3C8.09875 3 4.96875 6.13 4.96875 10V16C4.96875 19.31 7.65875 22 10.9688 22"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              />
                                            </svg>
                                          )}
                                        </button>
                                      </div>
                                      <button
                                        type="button"
                                        className="p-1 hover:bg-gray-100 hidden md:block dark:text-white dark:hover:bg-primary dark:hover:text-black rounded-full transition-colors flex-shrink-0"
                                        aria-label="Add emoji"
                                        onClick={() =>
                                          setIsEmojiPickerOpen(!isEmojiPickerOpen)
                                        }
                                      >
                                        <PiSmiley className="w-6 h-6 " />
                                      </button>
                                    </>
                                  )}

                                  {isEmojiPickerOpen && (
                                    <div
                                      ref={emojiPickerRef}
                                      className="absolute rounded shadow-lg bottom-[90px] right-[100px] z-50"
                                    >
                                      <EmojiPicker
                                        onEmojiClick={onEmojiClick}
                                        previewConfig={{
                                          showPreview: false,
                                        }}
                                      >
                                      </EmojiPicker>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    {!isRecording &&
                                      <>
                                        <input
                                          id="file-upload"
                                          type="file"
                                          multiple
                                          accept="*/*"
                                          className="hidden"
                                          onChange={handleInputChange}
                                        />
                                        <input
                                          id="image-upload"
                                          type="file"
                                          multiple
                                          accept=".jpg, .jpeg, .png, .mp4, .avi, .mov, .gif, .heic, .webp, .svg, .m4v"
                                          className="hidden"
                                          onChange={handleInputChange}
                                        />
                                        <button
                                          type="button"
                                          className="p-1 hover:bg-gray-100  hidden md:block rounded-full transition-colors dark:text-white dark:hover:bg-primary dark:hover:text-black"
                                          aria-label="Attach file"
                                          onClick={() =>
                                            // document
                                            //   .getElementById("file-upload")
                                            //   .click()
                                            setDocModel(!docModel)

                                          }
                                        >
                                          {selectedFiles &&
                                            selectedFiles.length > 0 ? (
                                            <GoPlusCircle className="w-6 h-6 " />
                                          ) : (
                                            <svg
                                              width={24}
                                              height={24}
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              xmlns="http://www.w3.org/2000/svg"
                                              className="w-6 h-6"
                                            >
                                              <path
                                                d="M11.9688 12V15.5C11.9688 17.43 13.5388 19 15.4688 19C17.3987 19 18.9688 17.43 18.9688 15.5V10C18.9688 6.13 15.8388 3 11.9688 3C8.09875 3 4.96875 6.13 4.96875 10V16C4.96875 19.31 7.65875 22 10.9688 22"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              />
                                            </svg>
                                          )}
                                        </button>
                                        <button
                                          type="button"
                                          className={`${selectedFiles.length > 0 || messageInput || cameraStream ? 'hidden md:block' : 'block md:block'} p-1 hover:bg-gray-100 rounded-full transition-colors dark:text-white dark:hover:bg-primary dark:hover:text-black`}
                                          aria-label="Voice message"
                                          onClick={() => { handleVoiceMessage(); startRecording() }}
                                        >
                                          <IoMicOutline
                                            className={`w-6 h-6 ${isRecording ? "text-red-500" : ""
                                              }`}
                                          />
                                        </button>
                                      </>
                                    }
                                    <button
                                      type="submit"
                                      className={`${selectedFiles.length > 0 || messageInput || cameraStream || isRecording ? 'block md:block' : 'hidden md:block'} p-1 hover:bg-gray-100 rounded-full transition-colors text-xl text-primary dark:hover:bg-primary dark:hover:text-black`}
                                      onClick={() => {
                                        if (selectedFiles.length > 0) {
                                          handleMultipleFileUpload(selectedFiles); // Upload selected files
                                          setSelectedFiles([]); // Clear selected files after sending
                                        }
                                        if (isRecording) {
                                          handleVoiceMessage();
                                        }
                                      }}
                                    >
                                      <svg
                                        width={20}
                                        height={20}
                                        x={0}
                                        y={0}
                                        viewBox="0 0 32 32"
                                        style={{
                                          enableBackground: "new 0 0 24 24",
                                        }}
                                        xmlSpace="preserve"
                                        className
                                      >
                                        <g>
                                          <path
                                            d="M28.986 3.014a3.415 3.415 0 0 0-3.336-.893L4.56 7.77a3.416 3.416 0 0 0-2.55 3.066 3.415 3.415 0 0 0 2.041 3.426l8.965 3.984c.329.146.59.408.737.738l3.984 8.964a3.41 3.41 0 0 0 3.426 2.04 3.416 3.416 0 0 0 3.066-2.55l5.65-21.089a3.416 3.416 0 0 0-.893-3.336zm-7.98 24.981c-.493.04-1.133-.166-1.442-.859 0 0-4.066-9.107-4.105-9.181l5.152-5.152a1 1 0 1 0-1.414-1.414l-5.152 5.152c-.073-.04-9.181-4.105-9.181-4.105-.693-.309-.898-.947-.86-1.442.04-.495.342-1.095 1.074-1.29C5.543 9.63 26.083 3.975 26.55 4c.379 0 .742.149 1.02.427.372.372.513.896.377 1.404l-5.651 21.09c-.196.732-.796 1.035-1.29 1.073z"
                                            fill="currentColor"
                                            opacity={1}
                                            data-original="#000000"
                                            className
                                          />
                                        </g>
                                      </svg>
                                    </button>
                                    {docModel && (
                                      <div className="optionMenu absolute right-5 bottom-14 bg-white dark:bg-gray-800 shadow-lg rounded-md p-2 z-10 min-w-36 dark:text-white " onClick={() => setDocModel(false)}>
                                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                          <ul className="dark:text-white  flex flex-col ">
                                            <li className="flex gap-2 items-center  hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-2 rounded-md cursor-pointer" onClick={() => { openCamera(); setDocModel(false); }}>
                                              <span className="w-5">
                                                <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} x={0} y={0} viewBox="0 0 512 512" style={{ enableBackground: 'new 0 0 512 512' }} xmlSpace="preserve" className><g><path fill="#477b9e" d="M431.159 118.263v-9.562c0-24.511-19.968-44.566-44.374-44.566H253.843c-24.406 0-44.374 20.055-44.374 44.566v9.562z" opacity={1} data-original="#477b9e" /><path fill="#3f6d8e" d="M311.846 64.135h-58.003c-24.406 0-44.374 20.055-44.374 44.566v9.562h58.003v-9.562c-.001-24.511 19.968-44.566 44.374-44.566zM136.449 179.924v223.208c0 15.71-12.854 28.564-28.564 28.564h375.551c15.71 0 28.564-12.854 28.564-28.564V179.924z" opacity={1} data-original="#3f6d8e" /><path fill="#365e7d" d="M191.656 403.133V179.924h-55.207v223.208c0 15.71-12.854 28.564-28.564 28.564h55.207c15.71.001 28.564-12.853 28.564-28.563z" opacity={1} data-original="#365e7d" className /><path fill="#b5dcff" d="M483.436 118.03H107.885c15.711 0 28.564 12.854 28.564 28.564v35.391H512v-35.391c0-15.71-12.853-28.564-28.564-28.564z" opacity={1} data-original="#b5dcff" /><path fill="#b5dcff" d="M483.436 118.03H107.885c15.711 0 28.564 12.854 28.564 28.564v35.391H512v-35.391c0-15.71-12.853-28.564-28.564-28.564z" opacity={1} data-original="#b5dcff" /><path fill="#8bcaff" d="M163.092 118.03h-55.207c15.711 0 28.564 12.854 28.564 28.564v35.391h55.207v-35.391c0-15.71-12.854-28.564-28.564-28.564z" opacity={1} data-original="#8bcaff" /><path fill="#477b9e" d="M94.406 77.486H44.104c-7.114 0-12.935 5.846-12.935 12.991v14.795c0 7.145 5.821 12.991 12.935 12.991h50.302c7.114 0 12.935-5.846 12.935-12.991V90.477c-.001-7.145-5.821-12.991-12.935-12.991z" opacity={1} data-original="#477b9e" /><path fill="#3f6d8e" d="M69.255 105.272V90.477c0-7.145 5.821-12.991 12.935-12.991H44.104c-7.114 0-12.935 5.846-12.935 12.991v14.795c0 7.145 5.821 12.991 12.935 12.991H82.19c-7.115 0-12.935-5.846-12.935-12.991z" opacity={1} data-original="#3f6d8e" /><path fill="#477b9e" d="M0 179.924v223.208c0 15.71 12.854 28.564 28.564 28.564h81.381c15.71 0 28.564-12.854 28.564-28.564V179.924z" opacity={1} data-original="#477b9e" /><path fill="#3f6d8e" d="M51.695 403.133V179.924H0v223.208c0 15.71 12.854 28.564 28.564 28.564h51.695c-15.71.001-28.564-12.853-28.564-28.563z" opacity={1} data-original="#3f6d8e" /><path fill="#dbedff" d="M109.945 118.03H28.564C12.854 118.03 0 130.884 0 146.594v35.391h138.51v-35.391c0-15.71-12.854-28.564-28.565-28.564z" opacity={1} data-original="#dbedff" /><path fill="#b5dcff" d="M80.259 118.03H28.564C12.854 118.03 0 130.884 0 146.594v35.391h51.695v-35.391c0-15.71 12.854-28.564 28.564-28.564z" opacity={1} data-original="#b5dcff" /><path fill="#365e7d" d="M320.314 447.866c-82.219 0-149.109-66.89-149.109-149.109s66.89-149.109 149.109-149.109 149.109 66.89 149.109 149.109-66.891 149.109-149.109 149.109z" opacity={1} data-original="#365e7d" className /><path fill="#294b64" d="M221.27 298.757c0-73.689 53.735-135.055 124.076-146.996a149.48 149.48 0 0 0-25.032-2.113c-82.219 0-149.109 66.89-149.109 149.109s66.89 149.109 149.109 149.109c8.53 0 16.891-.73 25.032-2.112-70.341-11.942-124.076-73.308-124.076-146.997z" opacity={1} data-original="#294b64" className /><circle cx="320.314" cy="298.757" r="116.772" fill="#7fb3fa" transform="rotate(-45 320.284 298.838)" opacity={1} data-original="#7fb3fa" className /><path fill="#64a6f4" d="M253.607 298.757c0-55.797 39.341-102.571 91.739-114.061a116.755 116.755 0 0 0-25.032-2.71c-64.389 0-116.772 52.384-116.772 116.772S255.926 415.53 320.314 415.53c8.591 0 16.965-.941 25.032-2.71-52.398-11.492-91.739-58.266-91.739-114.063z" opacity={1} data-original="#64a6f4" className /><circle cx="320.314" cy="298.757" r="71.576" fill="#64a6f4" transform="rotate(-45 320.284 298.838)" opacity={1} data-original="#64a6f4" className /><path fill="#3d8bd8" d="M298.803 298.757c0-30.664 19.387-56.877 46.544-67.049a71.225 71.225 0 0 0-25.033-4.527c-39.467 0-71.576 32.109-71.576 71.576s32.109 71.576 71.576 71.576a71.23 71.23 0 0 0 25.033-4.527c-27.157-10.172-46.544-36.385-46.544-67.049z" opacity={1} data-original="#3d8bd8" /><circle cx="320.314" cy="298.757" r="21.813" fill="#9cc5fa" transform="rotate(-45 320.284 298.838)" opacity={1} data-original="#9cc5fa" /><path fill="#7fb3fa" d="M320.314 298.757c0-8.053 4.398-15.083 10.907-18.862a21.655 21.655 0 0 0-10.907-2.951c-12.028 0-21.813 9.785-21.813 21.813s9.786 21.813 21.813 21.813c3.975 0 7.694-1.086 10.907-2.952-6.509-3.778-10.907-10.808-10.907-18.861z" opacity={1} data-original="#7fb3fa" className /></g></svg>
                                              </span>
                                              <span>Camera</span>
                                            </li>
                                            <li className="flex gap-2 items-center hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-2 rounded-md cursor-pointer" onClick={() => { document.getElementById("image-upload").click(); setDocModel(false); }}>
                                              <span className="w-5">
                                                <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlnsXlink="http://www.w3.org/1999/xlink" width={22} height={22} x={0} y={0} viewBox="0 0 64 64" style={{ enableBackground: 'new 0 0 512 512' }} xmlSpace="preserve" className><g><path fill="#29afea" d="M44.8 13.5h4.7c2.6 0 4.7 2.1 4.7 4.7v27.6c0 2.6-2.1 4.7-4.7 4.7h-35c-2.6 0-4.7-2.1-4.7-4.7V18.2c0-2.6 2.1-4.7 4.7-4.7h4.7z" opacity={1} data-original="#29afea" className /><path fill="#436dcd" d="M9.8 43.4 26 36.6c1.5-.6 3.3-.3 4.4 1 1.3 1.4 3.3 1.7 4.9.7L46 31.6c1.3-.8 3-.8 4.3.1l4 2.7v11.5c0 2.6-2.1 4.6-4.6 4.6H14.4c-2.6 0-4.6-2.1-4.6-4.6z" opacity={1} data-original="#436dcd" /><circle cx={24} cy={24} r={4} fill="#cdecfa" opacity={1} data-original="#cdecfa" /></g></svg>

                                              </span>
                                              <span className="text-nowrap">
                                                Photo & Video
                                              </span>
                                            </li>
                                            <li className="flex gap-2 items-center  hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-2 rounded-md cursor-pointer" onClick={() => { document.getElementById("file-upload").click(); setDocModel(false) }}>
                                              <span className="w-5"><svg width={20} height={20} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M16.0359 5.92891V17.8398C16.0359 18.4797 15.5156 19 14.8758 19H4.16016C3.52031 19 3 18.4797 3 17.8398V2.16016C3 1.52031 3.52031 1 4.16016 1H11.107L16.0359 5.92891Z" fill="#518FF5" />
                                                <path d="M6.18457 10.0371H12.8502V10.7789H6.18457V10.0371ZM6.18457 11.6895H12.8502V12.4313H6.18457V11.6895ZM6.18457 13.3453H12.8502V14.0871H6.18457V13.3453ZM6.18457 14.9977H10.9271V15.7395H6.18457V14.9977Z" fill="white" />
                                                <path d="M11.7803 5.74258L16.0377 9.19141V5.95L13.626 4.55078L11.7803 5.74258Z" fill="black" fillOpacity="0.0980392" />
                                                <path d="M16.0363 5.92891H12.2676C11.6277 5.92891 11.1074 5.40859 11.1074 4.76875V1L16.0363 5.92891Z" fill="#A6C5FA" />
                                              </svg>

                                              </span> <span>Document</span></li>
                                          </ul>
                                        </div>
                                      </div>
                                    )}

                                  </div>
                                  {editingMessage && (
                                    <button
                                      onClick={() => {
                                        setEditingMessage(null);
                                        setMessageInput("");
                                      }}
                                      className="ml-2 text-gray-500"
                                    >
                                      Cancel
                                    </button>
                                  )}
                                </form>
                              </div>
                            ))}
                        </div>
                        {/* Show Send to Bottom button only if user has scrolled up */}
                        {showScrollToBottom && (
                          <button
                            type="button"
                            className="absolute bottom-24 right-4 p-2 bg-primary/50 text-white rounded-full shadow-lg "
                            onClick={scrollToBottom}
                            aria-label="Send to Bottom"
                          >
                            <FaArrowDown className="w-5 h-5" />
                          </button>
                        )}
                      </>
                    ) : (
                      <Front data={user} handleMultipleFileUpload={handleMultipleFileUpload} />
                    )}
                  </>
                )}
            </div>

            <div
              className={`transition-all duration-300 ease-in-out flex-grow shrink-0 ${((isGroupModalOpen || isModalOpen) && selectedChat.members) ||
                isGroupCreateModalOpen ||
                (isUserProfileModalOpen && !selectedChat.members)
                ? "2xl:w-[380px]  sm:max-w-full  xl:w-[380px]  opacity-100"
                : "w-0 opacity-0"
                }`}
              style={{
                boxShadow: showOverlay ? "0px 0px 5px 1px #80808054" : "none",
              }}
            >
              {isGroupModalOpen && (
                <GroupProfile
                  selectedChat={selectedChat}
                  setIsGroupModalOpen={setIsGroupModalOpen}
                  setIsModalOpen={setIsModalOpen}
                  setGroupUsers={setGroupUsers}
                  allUsers={allUsers}
                  userId={userId}
                  socket={socket}
                  IMG_URL={IMG_URL}
                  setSelectedChat={setSelectedChat}
                  handleMakeCall={handleMakeCall}
                  messages={messages}
                  handleImageClick={handleImageClick}
                />
              )}
              {isModalOpen && (
                <AddParticipants
                  selectedChat={selectedChat}
                  setIsModalOpen={setIsModalOpen}
                  allUsers={allUsers}
                  userId={userId}
                  socket={socket}
                  groupUsers={groupUsers}
                  setGroupUsers={setGroupUsers}
                  setIsGroupModalOpen={setIsGroupModalOpen}
                  creatGroup={creatGroup}
                  setIsGroupCreateModalOpen={setIsGroupCreateModalOpen}
                />
              )}
              {isGroupCreateModalOpen && (
                <CreatedGroup
                  isOpen={isGroupCreateModalOpen}
                  onClose={() => setIsGroupCreateModalOpen(false)}
                  allUsers={allUsers}
                  currentUser={currentUser}
                  socket={socket}
                  creatGroup={creatGroup}
                  setCreatGroup={setCreatGroup}
                  setIsGroupCreateModalOpen={setIsGroupCreateModalOpen}
                  setIsModalOpen={setIsModalOpen}
                  groupUsers={groupUsers}
                  setGroupUsers={setGroupUsers}
                />
              )}
              {isUserProfileModalOpen && !selectedChat.members && (
                <ProfileUser
                  isOpen={isUserProfileModalOpen}
                  onClose={() => setIsUserProfileModalOpen(false)}
                  selectedChat={selectedChat}
                  messages={messages}
                  handleImageClick={handleImageClick}
                  handleMakeCall={handleMakeCall}
                  onlineUsers={onlineUsers}
                />
              )}
            </div>
          </>
        </>
      )}

      {/*========== screen share ==========*/}
      <div
        className={`flex-grow flex flex-col bg-primary-light dark:bg-primary-dark scrollbar-hide ${isReceiving || isVideoCalling || isVoiceCalling || voiceCallData
          ? ""
          : "hidden"
          } ${participantOpen ? "mr-96" : ""}`}
      >
        <div
          className={`flex-1 relative ${isReceiving ? "flex items-center justify-center" : `grid ${getGridColumns(Object.keys(userStreams).length)} gap-4`}`}
        >

          {Object.keys(remoteStreams).length > 0 ? (
            Object.keys(remoteStreams).map((userId) => (
              <div key={userId} className="relative w-full flex items-center justify-center" style={{ minHeight: "120px", maxHeight: "250px", maxWidth: "100%" }}>
                <video autoPlay playsInline className="w-full h-full object-cover rounded-lg" ref={(el) => { if (el) { el.srcObject = userStreams[userId]; } }} />
                <div className="absolute bottom-2 left-2 text-white text-xl bg-blue-500 px-3 py-1 rounded-full text-center">
                  {allUsers.find((user) => user._id === userId)?.userName || "Participant"}
                </div>
              </div>
            ))
          ) : (
            isVoiceCalling ? (
              // Voice call screen
              <div className="relative flex items-center justify-center w-full h-full">
                <div className="absolute top-1/2 -translate-y-1/2">
                  <span className="absolute w-24 h-24 rounded-full border animate-wave dark:border-white/100" />
                  <span className="absolute w-24 h-24 rounded-full border animate-wave dark:border-white/100 [animation-delay:0.5s]" />
                  <span className="absolute w-24 h-24 rounded-full border animate-wave dark:border-white/100 [animation-delay:1s]" />
                  <span className="absolute w-24 h-24 rounded-full border animate-wave dark:border-white/100 [animation-delay:1.5s]" />
                  {selectedChat && selectedChat.photo && selectedChat.photo !== "null" ? (
                    <img
                      src={`${IMG_URL}${selectedChat.photo.replace(/\\/g, "/")}`}
                      alt="User profile"
                      className="object-cover border rounded-full w-24 h-24"
                    />
                  ) : (
                    <div className="flex items-center justify-center">
                      <span className="text-white text-4xl">
                        {selectedChat?.userName?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <p className="absolute bottom-72 text-white text-lg font-medium">
                    {selectedChat?.userName || "Unknown User"}
                  </p>
                </div>

                {/* Always show controls buttons*/}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[100%]">
                  <div className="bg-gray-800 p-2 flex justify-center items-center space-x-3 md:space-x-4">
                    <button
                      onClick={() => setSelectedChatModule(!selectedChatModule)}
                      className="w-10 grid place-content-center rounded-full h-10 border text-white"
                    >
                      <BsChatDots className="text-xl" />
                    </button>

                    <button
                      onClick={toggleMicrophone}
                      className="w-10 grid place-content-center border rounded-full h-10 text-white"
                    >
                      {isMicrophoneOn ? (
                        <IoMicOffOutline className="text-xl" />
                      ) : (
                        <IoMicOffCircleOutline className="text-xl" />
                      )}
                    </button>

                    <button
                      onClick={toggleCamera}
                      className={`w-10 grid place-content-center border rounded-full h-10 text-white ${isVideoCalling ? "" : "hidden"}`}
                    >
                      {isCameraOn ? (
                        <BsCameraVideo className="text-xl" />
                      ) : (
                        <BsCameraVideoOff className="text-xl" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        endCall();
                        cleanupConnection();
                      }}
                      className="bg-red-500 h-12 w-12 text-white grid place-content-center rounded-full hover:bg-red-600 transition-colors"
                    >
                      <IoCallOutline className="text-2xl" />
                    </button>

                    <button className="w-10 grid place-content-center rounded-full h-10 border text-white">
                      <GoUnmute className="text-xl" />
                    </button>

                    {(isVideoCalling || isVoiceCalling) && (
                      <button
                        onClick={() => {
                          setParticipantOpen(true);
                          setShowFirstSection(true);
                        }}
                        className="w-10 grid place-content-center rounded-full h-10 border text-white"
                      >
                        <MdOutlineGroupAdd className="text-xl" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (


              // Video call screen
              <div className="flex-1 flex flex-col relative overflow-hidden">

                {/* Always show the video grid */}
                {/* <div className="flex-1 flex items-center justify-center p-2 md:p-4 overflow-hidden">
                  <div className={`w-full h-full flex flex-col ${gap} max-w-7xl mx-auto`}>
                    {participantRows.map((row, rowIndex) => (
                      <div key={rowIndex} className={`flex justify-center ${gap} flex-1`}>

                        {row.map(user => (
                          <div
                            key={user.id}
                            className="flex-1 min-w-0"
                            style={{ maxWidth: `${100 / getLayoutConfig(Array.from(remoteStreams).length).cols}%` }}
                          >
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div> */}
                {/* Always show the video grid */}
                <div className="flex-1 flex items-center justify-center p-2 md:p-4 overflow-hidden">

                  <div className={`w-full h-full grid ${getLayoutConfig(Object.keys(remoteStreams).length + 1).gap} max-w-7xl mx-auto`}
                    style={{
                      gridTemplateColumns: `repeat(${getLayoutConfig(Object.keys(remoteStreams).length + 1).cols}, minmax(0, 1fr))`,
                      gap: '8px'
                    }}>

                    {/* Local participant video */}
                    <div className="relative w-full h-full min-h-[120px] aspect-video">
                      {isVideoCalling && (
                        <div className="relative w-full h-full">
                          <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <div className="absolute bottom-2 left-2 text-white text-sm bg-blue-500 px-3 py-1 rounded-full">
                            {user?.userName || "You"}
                          </div>
                        </div>
                      )}
                      {!isVideoCalling && (
                        <VideoParticipant
                          user={{ videoEnabled: isCameraOn, audioEnabled: isMicrophoneOn, name: user?.userName || "You" }}
                          selectedChat={selectedChat}
                          IMG_URL={IMG_URL}
                          isLocal={true}
                        />
                      )}
                    </div>

                    {/* Remote participants */}
                    {Array.from(remoteStreams).map(([participantId, stream]) => {
                      const participant = allUsers.find(user => user._id === participantId);
                      const isCameraEnabled = cameraStatus?.[participantId] !== false;

                      return (
                        <div key={participantId} className="relative w-full h-full min-h-[120px] aspect-video">
                          {isCameraEnabled ? (
                            <div className="relative w-full h-full">
                              <video
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover rounded-lg"
                                ref={(el) => {
                                  if (el) {
                                    el.srcObject = stream;
                                    el.play().catch(err => console.error("Error playing remote video:", err));
                                  }
                                }}
                              />
                              <div className="absolute bottom-2 left-2 text-white text-sm bg-blue-500 px-3 py-1 rounded-full">
                                {participant?.userName || "Participant"}
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-full bg-primary-dark rounded-lg flex items-center justify-center">
                              <div className="w-20 h-20 rounded-full overflow-hidden">
                                {participant?.photo && participant.photo !== "null" ? (
                                  <img
                                    src={`${IMG_URL}${participant.photo.replace(/\\/g, "/")}`}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-500 flex items-center justify-center">
                                    <span className="text-white text-2xl">
                                      {participant?.userName?.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="absolute bottom-2 left-2 text-white text-sm bg-blue-500 px-3 py-1 rounded-full flex items-center">
                                {participant?.userName || "Participant"}
                                <span className="ml-2 text-xs">(Camera Off)</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Always show controls buttons*/}
                <div className="p-2 flex justify-center items-center space-x-3 md:space-x-4 bg-[#1A1A1A]">
                  <button
                    onClick={() => setSelectedChatModule(!selectedChatModule)}
                    className="w-10 grid place-content-center rounded-full h-10 border text-white"
                  >
                    <BsChatDots className="text-xl" />
                  </button>

                  <button
                    onClick={toggleMicrophone}
                    className="w-10 grid place-content-center border rounded-full h-10 text-white"
                  >
                    {isMicrophoneOn ? (
                      <IoMicOffOutline className="text-xl" />
                    ) : (
                      <IoMicOffCircleOutline className="text-xl" />
                    )}
                  </button>

                  <button
                    onClick={toggleCamera}
                    className={`w-10 grid place-content-center border rounded-full h-10 text-white ${isVideoCalling ? "" : "hidden"}`}
                  >
                    {isCameraOn ? (
                      <BsCameraVideo className="text-xl" />
                    ) : (
                      <BsCameraVideoOff className="text-xl" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      endCall();
                      cleanupConnection();
                    }}
                    className="bg-red-500 h-12 w-12 text-white grid place-content-center rounded-full hover:bg-red-600 transition-colors"
                  >
                    <IoCallOutline className="text-2xl" />
                  </button>

                  <button className="w-10 grid place-content-center rounded-full h-10 border text-white">
                    <GoUnmute className="text-xl" />
                  </button>

                  {(isVideoCalling || isVoiceCalling) && (
                    <button
                      onClick={() => {
                        setParticipantOpen(true);
                        setShowFirstSection(true);
                      }}
                      className="w-10 grid place-content-center rounded-full h-10 border text-white"
                    >
                      <MdOutlineGroupAdd className="text-xl" />
                    </button>
                  )}

                  <button className="w-10 grid place-content-center rounded-full h-10 border text-white">
                    <AiOutlineVideoCamera className="text-xl" />
                  </button>

                  {Array.from(remoteStreams).length < 12 && (
                    <button
                      className="text-blue-400 hover:text-blue-300 text-xs"
                      onClick={handleJoinCall}
                    >
                      +User
                    </button>
                  )}
                </div>
              </div>
            )
          )}
        </div >
      </div>



      {/* ========= incoming call ========= */}
      {
        incomingCall && (
          <IncomingCall
            incomingCall={incomingCall}
            allUsers={allUsers}
            groups={groups}
            rejectCall={rejectCall}
            acceptCall={acceptCall}
          />
        )
      }

      {
        incomingShare && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-black rounded-lg p-6 w-72 text-center">
              <h3 className="text-2xl text-gray-300 mb-2 ">
                Incoming Screen <br /> Request...
              </h3>
              <p className="text-gray-400 mb-8">
                {
                  allUsers.find((user) => user._id === incomingShare.fromEmail)?.userName
                }
              </p>
              <div className="flex justify-center gap-8">
                <button
                  onClick={() => acceptScreenShare()}
                  className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 animate-bounce"
                >
                  <LuScreenShare className="w-6 h-6 cursor-pointer" />
                </button>
                <button
                  onClick={() => {
                    setIncomingShare(null);
                    cleanupConnection();
                  }}
                  className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <LuScreenShareOff className="text-xl" />
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Profile Modal */}
      {
        isProfileModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-96 modal_background">
              <div className="flex justify-between items-center pb-2 p-4">
                <h2 className="text-lg font-bold">Profile</h2>
                <button
                  onClick={() => setIsProfileModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <ImCross />
                </button>
              </div>

              <div className="flex flex-col items-center">
                <div className="relative w-24 h-24  rounded-full bg-gray-300 mt-4 group">
                  {user?.photo && user.photo !== "null" ? (
                    <img
                      src={`${IMG_URL}${user.photo.replace(/\\/g, "/")}`}
                      alt="Profile"
                      className="object-cover w-24 h-24  rounded-full"
                    />
                  ) : (
                    <div
                      className="w-24 h-24 text-center rounded-full text-gray-600 grid place-content-center"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(189,214,230,1) 48%, rgba(34,129,195,1) 100%)",
                      }}
                    >
                      <IoCameraOutline className="text-3xl cursor-pointer" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center rounded-full  bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <MdOutlineModeEdit
                      className="text-white text-3xl cursor-pointer"
                      onClick={profileDropdown} // Ensure this function toggles isDropdownOpen
                    />
                  </div>

                  {isDropdownOpen && (
                    <div
                      ref={dropdownRef}
                      className="absolute top-full mt-2 bg-white border rounded shadow-lg z-50"
                    >
                      <ul>
                        <li
                          className="p-2 px-3 text-nowrap hover:bg-gray-100 cursor-pointer"
                          onClick={() =>
                            document.getElementById("file-input").click()
                          } // Trigger file input click
                        >
                          Upload Photo
                        </li>
                        <li
                          className="p-2 px-3 text-nowrap hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            dispatch(
                              updateUser({
                                id: currentUser,
                                values: { photo: null },
                              })
                            );
                          }}
                        >
                          Remove Photo
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
                <div className="flex mt-2 items-center justify-between gap-4">
                  {isEditingUserName ? (
                    <input
                      type="text"
                      value={!editedUserName ? user?.userName : editedUserName}
                      onChange={handleUserNameChange}
                      onBlur={handleUserNameBlur}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleUserNameBlur();
                        }
                      }}
                      className="text-xl font-semibold bg-transparent focus:ring-0 focus-visible:outline-none"
                      autoFocus
                    />
                  ) : (
                    <h3 className="text-xl font-semibold">{user?.userName}</h3>
                  )}
                  <MdOutlineModeEdit
                    className="cursor-pointer"
                    onClick={handleEditClick}
                  />
                </div>
              </div>
              <div className="mt-4 p-4">
                <div className="flex items-center justify-between p-2 border-b mb-2">
                  <span className="text-gray-600 font-bold">Skype Name</span>
                  <span className="text-gray-800">{user?.userName}</span>
                </div>
                <div className="flex items-center justify-between p-2 border-b mb-2">
                  <span className="text-gray-600 font-bold">Birthday</span>
                  {isEditingDob ? (
                    <input
                      type="date"
                      value={!editedDob ? user.dob : editedDob}
                      onChange={(e) => setEditedDob(e.target.value)}
                      onBlur={() => {
                        setIsEditingDob(false);
                        // Optionally, dispatch an action to update the dob in the store
                        dispatch(
                          updateUser({
                            id: currentUser,
                            values: { dob: editedDob },
                          })
                        );
                      }}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          setIsEditingDob(false);
                          // Optionally, dispatch an action to update the dob in the store
                          dispatch(
                            updateUser({
                              id: currentUser,
                              values: { dob: editedDob },
                            })
                          );
                        }
                      }}
                      className="text-base text-gray-800 font-semibold bg-transparent focus:ring-0 focus-visible:outline-none"
                      autoFocus
                    />
                  ) : (
                    <span
                      className={`text-gray-800 cursor-pointer ${!user?.dob ? "text-sm" : ""
                        } `}
                      onClick={() => setIsEditingDob(true)}
                    >
                      {new Date(user?.dob).toLocaleDateString() || "Add dob"}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between p-2 mb-2">
                  <span className="text-gray-600 font-bold">Phone Number</span>
                  {isEditingPhone ? (
                    <span>
                      <input
                        type="text"
                        value={!editedPhone ? user.phone : editedPhone}
                        onChange={(e) => setEditedPhone(e.target.value)}
                        max={12}
                        onBlur={() => {
                          setIsEditingPhone(false);
                          // Optionally, dispatch an action to update the phone number in the store
                          dispatch(
                            updateUser({
                              id: currentUser,
                              values: { phone: editedPhone },
                            })
                          );
                        }}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            setIsEditingPhone(false);
                            // Optionally, dispatch an action to update the phone number in the store
                            dispatch(
                              updateUser({
                                id: currentUser,
                                values: { phone: editedPhone },
                              })
                            );
                          }
                        }}
                        className="text-base text-gray-800 font-semibold bg-transparent focus:ring-0 focus-visible:outline-none"
                        autoFocus
                      />
                    </span>
                  ) : (
                    <span
                      className={`text-gray-800 cursor-pointer ${!user?.phone ? "text-sm" : ""
                        } `}
                      onClick={() => setIsEditingPhone(true)}
                    >
                      {user?.phone || "Add phone number"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Call participant modal */}
      {
        participantOpen && (
          <div className="fixed inset-0 bg-opacity-50 z-50">
            {/* first section */}
            {showFirstSection && (
              <div className="absolute right-0 top-0 h-full w-96 bg-primary-light dark:bg-primary-dark/90 dark:text-white shadow-lg transition-transform duration-300 ease-in-out">
                <div className="w-full bg-primary-dark/5 dark:bg-primary-dark/90 dark:text-primary-light h-full" style={{ boxShadow: "inset 0 0 5px 0 rgba(0, 0, 0, 0.1)" }}>
                  <div className="flex justify-between items-center p-4 py-6">
                    <h2 className="text-lg font-bold">Add Members</h2>
                    <button
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => {
                        setParticipantOpen(false);
                        setSelectedCallUsers(new Set());
                      }}
                    >
                      <RxCross2 className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="sm:block flex-1 h-[1px] bg-gradient-to-r from-gray-300/30 via-gray-300 to-gray-300/30 dark:bg-gradient-to-l dark:from-white/5 dark:via-white/30 dark:to-white/5 max-w-[100%] mx-auto" />

                  {/* Search bar */}
                  <div className="relative p-4">
                    <input
                      type="text"
                      placeholder="Search users"
                      className="w-full py-2 pl-10 pr-4 bg-[#E0E5EB] rounded-md text-gray-600 dark:text-white dark:bg-white/10 focus:outline-none"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)} // Update search input state
                    />
                    <svg
                      className="absolute left-7 top-7 text-gray-400"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </div>

                  <div className="text-gray-700 font-medium dark:text-primary-light cursor-pointer flex items-center gap-2 px-4">
                    All Users
                  </div>

                  <div className="p-4">
                    <div className="flex flex-col h-[calc(100vh-275px)] overflow-y-auto modal_scroll">
                      {allUsers
                        .filter(user =>
                          user.userName.toLowerCase().includes(searchInput.toLowerCase())
                        )
                        .filter(
                          (user) =>
                            !callParticipants.has(user._id) && user._id !== userId
                        )
                        .map((user) => (
                          <div
                            key={user._id}
                            className="flex items-center p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-primary-light/10 rounded-md bg-primary-dark/80 mb-2"
                            onClick={() => {
                              const newSelectedUsers = new Set(selectedCallUsers);
                              if (newSelectedUsers.has(user._id)) {
                                newSelectedUsers.delete(user._id);
                              } else {
                                newSelectedUsers.add(user._id);
                              }
                              setSelectedCallUsers(newSelectedUsers);
                            }}
                          >
                            <div
                              className={`w-5 h-5 rounded border mr-3 ${selectedCallUsers.has(user._id)
                                ? "bg-primary border-primary"
                                : "border-gray-400"
                                }`}
                            >
                              {selectedCallUsers.has(user._id) && (
                                <svg
                                  className="w-full h-full text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </div>
                            <div className="w-9 h-9 rounded-full mr-3 bg-gray-300 overflow-hidden flex items-center justify-center border-[1px] border-gray-400">
                              {user?.photo && user.photo !== "null" ? (
                                <img
                                  src={`${IMG_URL}${user.photo.replace(/\\/g, "/")}`}
                                  alt={`${user.userName}`}
                                  className="object-cover h-full w-full"
                                />
                              ) : (
                                <span className="text-gray-900 text-lg font-bold">
                                  {user.userName
                                    .split(" ")
                                    .map((n) => n[0].toUpperCase())
                                    .join("")}
                                </span>
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-gray-800 dark:text-primary-light/80 font-semibold">
                                {user.userName}
                              </h3>
                            </div>
                          </div>
                        ))}
                    </div>
                    <div className="mt-4 flex justify-center w-full">
                      {Array.from(remoteStreams).length < 12 && (
                        <button
                          className="cursor-pointer px-4 py-2 w-full bg-primary text-white rounded-md hover:bg-primary/50 transition-colors"
                          onClick={() => {
                            console.log("Inviting users:", Array.from(selectedCallUsers));
                            const invited = allUsers.filter(user => selectedCallUsers.has(user._id));
                            setInvitedUsers(invited); // <-- update invited users
                            console.log("selectedCallUsers", selectedCallUsers);
                            selectedCallUsers.forEach(userId => {
                              console.log("userId", userId);
                              inviteToCall(userId);
                            });
                            setSelectedCallUsers(new Set());
                            setShowFirstSection(false); // Switch to the second section
                          }}
                          disabled={selectedCallUsers.size === 0}
                        >
                          Add Members
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* second section */}
            {!showFirstSection && (
              <div className="absolute right-0 top-0 h-full w-96 bg-primary-light dark:text-white shadow-lg transition-transform duration-300 ease-in-out">
                <div className="w-full bg-primary-dark/5 dark:bg-primary-dark/95 dark:text-primary-light h-full" style={{ boxShadow: "inset 0 0 5px 0 rgba(0, 0, 0, 0.1)" }}>
                  <div className="flex justify-between items-center p-4 py-6">
                    <h2 className="text-lg font-bold"> Add Members</h2>
                    <button
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => {
                        setParticipantOpen(false);
                        setSelectedCallUsers(new Set());
                      }}
                    >
                      <RxCross2 className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="sm:block flex-1 h-[1px] bg-gradient-to-r from-gray-300/30 via-gray-300 to-gray-300/30 dark:bg-gradient-to-l dark:from-white/5 dark:via-white/30 dark:to-white/5 max-w-[100%] mx-auto" />

                  <div className="relative p-4">
                    <button
                      className="bg-black flex items-center justify-between w-full py-2 text-white rounded-md transition-colors"
                      onClick={() => setShowFirstSection(true)}
                    >
                      <span className="flex items-center">
                        <RiUserAddLine className="mr-2 ml-4" />
                        Add Members
                      </span>
                      <IoIosArrowForward className="mr-4" />
                    </button>
                  </div>
                  <div className="text-gray-700 font-medium dark:text-primary-light flex items-center gap-2 px-4">
                    joined
                  </div>

                  <div className="p-4">
                    <div className="flex flex-col overflow-y-auto modal_scroll ">
                      <div className="flex items-center p-2 cursor-pointer hover:bg-gray-100 rounded-md dark:bg-primary-dark/80 mb-2" >
                        <div className="w-9 h-9 rounded-full mr-3 bg-gray-300 overflow-hidden flex items-center justify-center border-[1px] border-gray-400" >
                          <img src="./img/f1.png" alt="User Profile" className="object-cover w-full h-full" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-gray-800 dark:text-primary-light/80 font-semibold">
                            hello
                          </h3>
                        </div>
                        <AiOutlineAudioMuted className="h-6 w-6" />
                      </div>
                    </div>
                  </div>

                  <div className="text-gray-700 font-medium dark:text-primary-light flex items-center gap-2 px-4">
                    invited
                  </div>
                  <div className="p-4">
                    <div className="flex flex-col overflow-y-auto modal_scroll">
                      {invitedUsers.map(user => (
                        <div
                          key={user._id}
                          className="flex items-center p-2 cursor-pointer hover:bg-gray-100 rounded-md dark:bg-primary-dark/80 mb-2"
                        >
                          <div className="w-9 h-9 rounded-full mr-3 bg-gray-300 overflow-hidden flex items-center justify-center border-[1px] border-gray-400">
                            {user?.photo && user.photo !== "null" ? (
                              <img
                                src={`${IMG_URL}${user.photo.replace(/\\/g, "/")}`}
                                alt={`${user.userName}`}
                                className="object-cover h-full w-full"
                              />
                            ) : (
                              <span className="text-gray-900 text-lg font-bold">
                                {user.userName
                                  .split(" ")
                                  .map((n) => n[0].toUpperCase())
                                  .join("")}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-gray-800 dark:text-primary-light/80 font-semibold">
                              {user.userName}
                            </h3>
                          </div>
                          {showBell ? (
                            <FaRegBell className="h-6 w-6" />
                          ) : (
                            <div className="flex items-center justify-center gap-1 h-6 w-8 cursor-pointer" >
                              {Array.from({ length: 7 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-2 bg-primary  rounded-full transform transition-all duration-300 ease-in-out  animate-callwaveform }`}
                                  style={{
                                    animationDelay: `${i * 0.1}s`,
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      }

      {/* Add a hidden file input for photo upload */}
      <input
        type="file"
        id="file-input"
        style={{ display: "none" }}
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            // Handle the file upload logic here
            dispatch(updateUser({ id: currentUser, values: { photo: file } }));
          }
        }}
      />

      {/* {console.log("aa", isProfileImageModalOpen, isImageModalOpen, messages)} */}

      {
        (
          (isImageModalOpen && selectedImage)) && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="relative w-full h-full flex items-center flex-col justify-center gap-2 p-8">
              <div style={{ height: 'calc(100vh - 80px)' }} className="">
                {selectedImage && ( // Conditionally render the selected media
                  <div className="mb-4">
                    {selectedImage.endsWith('.mp4') ? ( // Check if the selected media is a video
                      <video
                        src={selectedImage}
                        alt="Selected Video"
                        style={{ height: 'calc(100vh - 180px)', width: 'calc(100vh - 180px)' }}
                        className="object-cover mb-2" // Adjust styles as needed
                        controls // Add controls for video playback
                        autoPlay
                      />
                    ) : (
                      <img
                        src={selectedImage}
                        alt="Selected"
                        style={{ height: 'calc(100vh - 180px)', width: 'calc(100vh - 180px)' }}
                        className="object-cover mb-2" // Adjust styles as needed
                      />
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2 items-end ">
                {messages.map((message, index) => (
                  <React.Fragment key={index}>
                    {message.content && message.content.fileType && message.content.fileType.startsWith('image/') && (
                      <div className="relative">
                        {selectedImage === `${message.content.fileUrl.replace(/\\/g, '/')}` &&

                          <div className="absolute inset-0 bg-black opacity-60 z-10" >
                            <div className="text-white flex items-center justify-center h-full text-2xl cursor-pointer" onClick={() => { handleDeleteMessage(message._id); setIsImageModalOpen(false); }}>
                              <GoTrash />
                            </div>
                          </div>
                        }

                        <img
                          className={`w-[75px] h-[75px] object-cover rounded cursor-pointer ${selectedImage === `${message.content.fileUrl.replace(/\\/g, '/')}` ? 'border-2 border-blue-500' : ''}`} // Add cursor pointer for interactivity
                          src={`${message.content.fileUrl.replace(/\\/g, '/')}`}
                          alt={`Image ${index}`}
                          onClick={() => {
                            setSelectedImage(`${message.content.fileUrl.replace(/\\/g, '/')}`); // Set selected image on click
                          }}
                        />
                      </div>
                    )}
                    {message.content && message.content.fileType && message.content.fileType.startsWith('video/') && ( // Add video rendering
                      <div className="flex flex-col items-center relative cursor-pointer" onClick={() => {
                        setSelectedImage(`${message.content.fileUrl.replace(/\\/g, '/')}`); // Set selected video on click
                      }}>
                        <div className="relative ">
                          <div className="absolute inset-0 bg-black opacity-50 z-10" /> {/* Overlay layer */}
                          <video
                            className={`w-[75px] h-[75px] rounded object-cover cursor-pointer ${selectedImage == `${message.content.fileUrl.replace(/\\/g, '/')}` ? 'border-2 border-blue-500' : ''}`} // Add cursor pointer for interactivity
                            src={`${message.content.fileUrl.replace(/\\/g, '/')}`}
                            alt={`Video ${index}`}
                            onLoadedMetadata={(e) => {
                              handleVideoMetadataLoad(message._id, e.target); // Call the function to update duration
                            }}

                          />
                          {videoDurations[message._id] && (
                            <span className="text-xs text-white absolute bottom-1 left-1 z-20">
                              {Math.floor(videoDurations[message._id] / 60)}:
                              {(Math.floor(videoDurations[message._id]) % 60).toString().padStart(2, '0')} {/* Format duration */}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Add buttons to switch images and videos */}
              <div className="absolute top-1/2 left-4 transform -translate-y-1/2">
                <button
                  onClick={() => {
                    // Filter messages to only include media messages (images and videos)
                    const mediaMessages = messages.filter(message => message.content && message.content.fileType && (message.content.fileType.startsWith('image/') || message.content.fileType.startsWith('video/')));
                    const currentIndex = mediaMessages.findIndex(message => `${message.content.fileUrl.replace(/\\/g, '/')}` === selectedImage);
                    const prevIndex = (currentIndex - 1 + mediaMessages.length) % mediaMessages.length; // Wrap around to the last media
                    setSelectedImage(`${mediaMessages[prevIndex].content.fileUrl.replace(/\\/g, '/')}`);
                  }}
                  className="bg-primary flex justify-center items-center h-[40px] w-[40px] text-white p-2 rounded-full"
                >
                  <span>
                    <FaChevronLeft />
                  </span>
                </button>
              </div>
              <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
                <button
                  onClick={() => {
                    // Filter messages to only include media messages (images and videos)
                    const mediaMessages = messages.filter(message => message.content && message.content.fileType && (message.content.fileType.startsWith('image/') || message.content.fileType.startsWith('video/')));
                    const currentIndex = mediaMessages.findIndex(message => `${message.content.fileUrl.replace(/\\/g, '/')}` === selectedImage);
                    const nextIndex = (currentIndex + 1) % mediaMessages.length; // Wrap around to the first media
                    setSelectedImage(`${mediaMessages[nextIndex].content.fileUrl.replace(/\\/g, '/')}`);
                  }}
                  className="bg-primary flex justify-center items-center h-[40px] w-[40px] text-white p-2 rounded-full"
                >
                  <span>
                    <FaChevronRight />
                  </span>
                </button>
              </div>

              <button
                onClick={() => {
                  if (isProfileImageModalOpen) {
                    setIsProfileImageModalOpen(false);
                  } else if (isImageModalOpen) {
                    setIsImageModalOpen(false);
                  }
                }}
                className="absolute top-4 right-4 text-white hover:text-gray-300"
              >
                <RxCross2 className="w-6 h-6" />
              </button>
            </div>
          </div>
        )
      }

      {/* profile photo */}
      {
        (isProfileImageModalOpen && selectedProfileImage) && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="relative w-full h-full flex items-center justify-center p-8">

              <img
                src={
                  isProfileImageModalOpen ? selectedProfileImage : ''
                }
                alt="Profile"
                className="max-w-full max-h-full object-contain"
              />
              <button
                onClick={() => {
                  if (isProfileImageModalOpen) {
                    setIsProfileImageModalOpen(false);
                  } else if (isImageModalOpen) {
                    setIsImageModalOpen(false);
                  }
                }}
                className="absolute top-4 right-4 text-white hover:text-gray-300"
              >
                <ImCross className="w-6 h-6" />
              </button>
            </div>
          </div>
        )
      }
      {/* Forward Modal */}
      {
        showForwardModal && (
          <ForwardModal
            show={showForwardModal}
            onClose={() => setShowForwardModal(false)}
            onSubmit={handleForwardSubmit} // Corrected the onSubmit prop
            users={allUsers}
          />
        )
      }

      {/* delete message modal */}
      {
        isClearChatModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-primary-light/15 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 dark:bg-primary-dark dark:text-white">
              <h3 className=" mb-4 flex justify-between">
                <p className="text-lg font-bold">Clear Chat</p>
                <button
                  onClick={() => setIsClearChatModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <ImCross />
                </button>
              </h3>
              <p className="text-gray-600 dark:text-white/50 mb-6 font-semibold text-center">
                Are you sure you want to clear this chat?
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setIsClearChatModalOpen(false)}
                  className="py-2 bg-primary text-white hover:bg-primary/50 rounded font-semibold w-32"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearChat}
                  className=" py-2 bg-red-500 text-white rounded hover:bg-red-600 font-semibold w-32"
                >
                  Clear Chat
                </button>
              </div>
            </div>
          </div>
        )
      }

      {
        isDeleteChatModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-primary-light/15 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 dark:bg-primary-dark dark:text-white">
              <h3 className=" mb-4 flex justify-between">
                <p className="text-lg font-bold">Delete Chat</p>
                <button
                  onClick={() => setIsDeleteChatModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <ImCross />
                </button>
              </h3>
              <p className="text-gray-600 dark:text-white/50 mb-6 font-semibold text-center">
                Are you sure you want to delete this chat?
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setIsDeleteChatModalOpen(false)}
                  className="py-2 bg-primary text-white hover:bg-primary/50 rounded font-semibold w-32"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteChat}
                  className=" py-2 bg-red-500 text-white rounded hover:bg-red-600 font-semibold w-32"
                >
                  Delete Chat
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}

const VideoParticipant = ({ user, selectedChat, IMG_URL }) => {
  return (
    <div className="relative h-full w-full rounded-lg overflow-hidden shadow-lg">
      <div className="aspect-video w-full h-full flex items-center justify-center">
        {user.videoEnabled ? (
          <div className="absolute inset-0 bg-[#222] flex items-center justify-center">
            <div className="flex flex-col items-center justify-center">

              {selectedChat && selectedChat.photo && selectedChat.photo !== "null" ? (
                <img
                  src={`${IMG_URL}${selectedChat.photo.replace(/\\/g, "/")}`}
                  alt="User profile"
                  className="object-cover border-4 border-white shadow-lg rounded-full w-24 h-24"
                />
              ) : (
                <div className="flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 text-white text-4xl font-bold border-4 border-white shadow-lg">
                  {selectedChat?.userName?.charAt(0).toUpperCase() || user.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute top-1/2 -translate-y-1/2">
                <span className="absolute w-24 h-24 rounded-full border animate-wave dark:border-white/100" />
                <span className="absolute w-24 h-24 rounded-full border animate-wave dark:border-white/100 [animation-delay:0.5s]" />
                <span className="absolute w-24 h-24 rounded-full border animate-wave dark:border-white/100 [animation-delay:1s]" />
                <span className="absolute w-24 h-24 rounded-full border animate-wave dark:border-white/100 [animation-delay:1.5s]" />
                {selectedChat && selectedChat.photo && selectedChat.photo !== "null" ? (
                  <img
                    src={`${IMG_URL}${selectedChat.photo.replace(/\\/g, "/")}`}
                    alt="User profile"
                    className="object-cover border rounded-full w-24 h-24"

                  />
                ) : (
                  <div className="flex items-center justify-center">
                    <span className="text-white text-4xl">
                      {selectedChat?.userName?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                {/* <p className="absolute bottom-72 text-white text-lg font-medium">
                  {selectedChat?.userName || "Unknown User"}
                </p> */}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl text-white font-bold mb-2">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <p className="text-gray-400 mt-1">{user.name}</p>
          </div>
        )}
      </div>
      {/* Name label overlay */}
      <div className="absolute bottom-64 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-white text-sm font-medium">
        {selectedChat?.userName || user.name || "Unknown User"}
      </div>
      {/* User controls and info */}
      <div className="absolute top-2 right-2 flex items-center space-x-2">
        {user.audioEnabled ? (
          <BsMicMute size={20} className="text-white w-8 h-8 rounded-full p-1" />
        ) : (
          <IoMicOffCircleOutline size={20} className="text-white bg-black/60 rounded-full p-1" />
        )}
      </div>
    </div>
  );
};
export default Chat2;
