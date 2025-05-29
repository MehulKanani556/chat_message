import React, { useState, useEffect, useRef, memo, useCallback } from "react";
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
  FaImage,
  FaVideo,
  FaMusic,
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
// import { useSocket } from "../hooks/useSocket";
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

import VideoCallLayout from "../component/VideoCallLayout";
import CallParticipantModal from "../component/CallParticipantModal";
import { setBackCameraAvailable, setCameraStatus, setCameraStream, setEditingMessage, setIncomingShare, setIsGroupCreateModalOpen, setIsGroupModalOpen, setIsImageModalOpen, setIsModalOpen, setIsSearchBoxOpen, setIsUserProfileModalOpen, setMessageInput, setOpenCameraState, setParticipantOpen, setReplyingTo, setSearchInputbox, setSelectedChat, setSelectedChatModule, setSelectedFiles, setSelectedImage, setShowCallHistory, setShowGroups, setShowLeftSidebar, setShowProfile, setShowSettings, setUploadProgress } from "../redux/slice/manageState.slice";
import MediaViewer from "../component/MediaViewer";
import { useSocket } from "../context/SocketContext";
import MessageInput from "../component/MessageInput";
import ChatHeader from "../component/ChatHeader";


const Chat2 = memo(() => {
  const { allUsers, messages, allMessageUsers, groups, user, allCallUsers } = useSelector((state) => state.user);
  const {
    remoteStreams,
    isConnected,
    onlineUsers,
    isVideoCalling,
    incomingCall,
    isCameraOn,
    isSharing,
    isReceiving,
    incomingShare,
    isVoiceCalling,
    callParticipants,
    isMicrophoneOn,
    cameraStatus,
    selectedChatModule,
    showProfile,
    showSettings,
    showGroups,
    showCallHistory,
    isGroupModalOpen,
    isModalOpen,
    isGroupCreateModalOpen,
    isUserProfileModalOpen,
    showLeftSidebar,
    selectedChat,
    selectedImage,
    isImageModalOpen,
    uploadProgress,
    selectedFiles,
    replyingTo,
    typingUsers,
    participantOpen,
    searchInputbox,
    backCameraAvailable,
    facingMode,
    isSearchBoxOpen,
    editingMessage,
    callChatList,
    chatMessages,
    videoCallChatList
  } = useSelector(state => state.magageState)

  const dispatch = useDispatch();
  // const [selectedChat, setSelectedChat] = useState(false);
  // const [selectedFiles, setSelectedFiles] = useState([]);

  // const emojiPickerRef = useRef(null);
  const [currentUser] = useState(sessionStorage.getItem("userId")); // Replace with actual user data
  // const [typingUsers, setTypingUsers] = useState([]);
  const localVideoRef = useRef(null);
  // const remoteVideoRef = useRef(null);
  const navigate = useNavigate();
  // const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, messageId: null });
  // const [docModel, setDocModel] = useState(false);
  // const [editingMessage, setEditingMessage] = useState(null);
  // const [messageInput, setMessageInput] = useState("");
  // const inputRef = useRef(null);
  // const [userId] = useState(sessionStorage.getItem("userId"));
  const [groupUsers, setGroupUsers] = useState([]);
  // const messagesContainerRef = useRef(null);


  // const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  // const [selectedImage, setSelectedImage] = useState(null);
  // const [isSearchBoxOpen, setIsSearchBoxOpen] = useState(false);
  // const [searchInputbox, setSearchInputbox] = useState("");

  const [isProfileImageModalOpen, setIsProfileImageModalOpen] = useState(false);
  const [selectedProfileImage, setSelectedProfileImage] = useState(null);
  const [isClearChatModalOpen, setIsClearChatModalOpen] = useState(false);
  const [isDeleteChatModalOpen, setIsDeleteChatModalOpen] = useState(false);
  // const [participantOpen, setParticipantOpen] = useState(false);

  // const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const [creatGroup, setCreatGroup] = useState(false)
  const [isDragging, setIsDragging] = useState(false);
// Object to hold durations keyed by message ID
 
  const [userStreams, setUserStreams] = useState({});

  //===========Use the custom socket hook===========
  const {
    socket,
    startSharing,
    endCall,
    cleanupConnection,
    toggleCamera,
    toggleMicrophone,
    markMessageAsRead,
    rejectCall,
    sendPrivateMessage,
    sendTypingStatus,
    subscribeToMessages,
    sendGroupMessage,
    acceptScreenShare,
    inviteToCall,
    forwardMessage,
    addMessageReaction,
    startCall,
    acceptCall,
  } = useSocket();

  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    if (window.innerWidth <= 1439) {
      setShowOverlay(true);
    }
  }, [showOverlay]);
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
    dispatch(getAllMessageUsers());
    dispatch(getAllGroups());
    dispatch(getUser(currentUser));
    dispatch(getAllCallUsers());
  }, []);


  useEffect(() => {
    if (selectedChat && allMessageUsers) {
      const updatedChat = allMessageUsers.find(
        (chat) => chat._id === selectedChat._id
      );
      // console.log("updatedChat", updatedChat);
      if (updatedChat) {
        dispatch(setSelectedChat(updatedChat));
      }
    }
  }, [allMessageUsers]);

  useEffect(() => {
    if (messages) {
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
  }, [messages]);


  //===========get all messages ===========
  useEffect(() => {
    if (selectedChat) {
      dispatch(getAllMessages({ selectedId: selectedChat._id }));
    }
  }, [selectedChat]);

  // ============Subscribe to messages ===========
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribeMessages = subscribeToMessages((message) => {
      if (message.type === "delete") {
        if (selectedChat) {
          dispatch(getAllMessages({ selectedId: selectedChat._id }));
        }
      } else if (message.type === "reaction") {
        if (selectedChat) {
          dispatch(getAllMessages({ selectedId: selectedChat._id })); // Refresh messages if needed
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
  }, [isConnected, selectedChat, allUsers]);


  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      dispatch(setSelectedFiles([...selectedFiles, ...files]));
    }
  }, [selectedChat]);

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
        dispatch(setEditingMessage(null));
        dispatch(getAllMessageUsers());
        dispatch(getAllMessages({ selectedId: selectedChat._id }));
      } catch (error) {
        console.error("Failed to update message:", error);
      }
    } else {
      const isBlockedByRecipient = selectedChat?.blockedUsers?.includes(currentUser);
      if (
        (data.type == "text" && data?.content?.trim() === "") ||
        !(selectedChat || userId)
      )return;

      console.log("data", data);

      try {
        const messageData = {
          data,
          isBlocked: isBlockedByRecipient,
        };

        const status = await sendPrivateMessage(userId ? userId : selectedChat._id, messageData);
        dispatch(getAllMessages({ selectedId: userId ? userId : selectedChat._id }));
        dispatch(getAllMessageUsers());
        dispatch(setReplyingTo(null));
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    }
    dispatch(setMessageInput(""));
  };

  //===========handle multiple file upload===========

  const handleMultipleFileUpload =  async(files, userId) => {
    const filesArray = Array.from(files);
    for (const file of filesArray) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await axios.post(`${BASE_URL}/upload`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            dispatch(setUploadProgress(prev => ({
              ...prev,
              [file.name]: { percentCompleted, size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`, fileType: file.type },
            })));
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
      } finally {
        dispatch(setUploadProgress(prev => {
          const updated = { ...prev };
          delete updated[file.name];
          return updated;
        }));
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

  const handleProfileImageClick = useCallback((imageUrl) => {
    setSelectedProfileImage(imageUrl);
    setIsProfileImageModalOpen(true);
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
          dispatch(setSelectedFiles([...selectedFiles, file]));
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
        dispatch(setShowLeftSidebar(true));
      } else {

        dispatch(setShowLeftSidebar(false));
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // console.log("aaaaaa-------", callUsers);
  // clear chat
  const handleClearChat = async () => {
    await dispatch(clearChat({ selectedId: selectedChat._id })).then(() => {
      dispatch(getAllMessages({ selectedId: selectedChat._id }));
      dispatch(getAllMessageUsers());
      setIsClearChatModalOpen(false);
    });
  };

  const handleDeleteChat = useCallback(async () => {
    await dispatch(clearChat({ selectedId: selectedChat._id })).then(() => {
      dispatch(deleteChat({ selectedUserId: selectedChat._id })).then(() => {
        if (user.pinChatFor?.includes(selectedChat?._id)) {
          dispatch(pinChat({ selectedUserId: selectedChat?._id, }));
        }
        dispatch(getAllMessages({ selectedId: selectedChat._id }));
        dispatch(getAllMessageUsers());
        setIsDeleteChatModalOpen(false);
        dispatch(setSelectedChat(null));
      });
    });
  }, [dispatch]);

  // Add useEffect to handle input focus when chat is selected
  // useEffect(() => {
  //   if (selectedChat && inputRef.current) {
  //     inputRef.current.focus();
  //   }
  // }, [selectedChat]);

  // const [replyingTo, setReplyingTo] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);


  const handleForwardMessage = (message) => {
    setForwardingMessage(message);
    setShowForwardModal(true);
    // setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
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
    // Set showLeftSidebar to true when no chat is selected
    if (!selectedChat) {
      // setShowLeftSidebar(false);
      if (window.innerWidth <= 600) {
        setShowLeftSidebar(true); // On mobile, always show chat list if no chat selected
      } else {
        setShowLeftSidebar(false); // On desktop, hide sidebar if no chat selected
      }
    }
  }, [selectedChat]);

  useEffect(() => {
    // Listen for the resetSelectedChat event
    const handleResetSelectedChat = () => {
      dispatch(setSelectedChat(null));
      dispatch(setShowLeftSidebar(true));
    };

    window.addEventListener("resetSelectedChat", handleResetSelectedChat);

    return () => {
      window.removeEventListener("resetSelectedChat", handleResetSelectedChat);
    };
  }, []);

  useEffect(() => {
    // Listen for the showChatList event
    const handleShowChatList = (event) => {
      dispatch(setShowGroups(false));
      if (event.detail?.selectedChat) {
        dispatch(setSelectedChat(event.detail.selectedChat));
      }
      if (event.detail?.openGroupCreateModal) {
        dispatch(setIsGroupCreateModalOpen(true));
      }
    };

    window.addEventListener("showChatList", handleShowChatList);

    return () => {
      window.removeEventListener("showChatList", handleShowChatList);
    };
  }, []);

  // const [showGroups, setShowGroups] = useState(false);

  useEffect(() => {
    // Listen for the showProfile event
    const handleShowProfile = () => {
      dispatch(setShowProfile(true));
      dispatch(setShowLeftSidebar(true));
      dispatch(setShowGroups(false));
      dispatch(setSelectedChatModule(false));
      dispatch(setShowSettings(false));
      dispatch(setShowCallHistory(false));
    };

    // Listen for the showGroups event
    const handleShowGroups = () => {
      dispatch(setShowGroups(true));
      dispatch(setShowProfile(false));
      dispatch(setSelectedChatModule(false));
      dispatch(setShowSettings(false));
      dispatch(setShowCallHistory(false));
      dispatch(setShowLeftSidebar(true));
    };

    // Listen for the showChatList event
    const handleShowChatList = () => {
      dispatch(setSelectedChatModule(true));
      dispatch(setShowProfile(false));
      dispatch(setShowGroups(false));
      dispatch(setShowSettings(false));
      dispatch(setShowCallHistory(false));
      dispatch(setShowLeftSidebar(true));
    };

    // Listen for the showSettings event
    const handleShowSettings = () => {
      dispatch(setShowSettings(true));
      dispatch(setShowProfile(false));
      dispatch(setShowGroups(false));
      dispatch(setSelectedChatModule(false));
      dispatch(setShowCallHistory(false));
      dispatch(setShowLeftSidebar(true));
    };

    // Listen for the showCall event
    const handleShowCall = () => {
      dispatch(setShowCallHistory(true));
      dispatch(setShowProfile(false));
      dispatch(setShowGroups(false));
      dispatch(setSelectedChatModule(false));
      dispatch(setShowSettings(false));
      dispatch(setShowLeftSidebar(true));
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
  // useEffect(() => {
  //   if (selectedChat && user) {
  //     // If the selectedChat is the current user, update it with the latest user data
  //     if (selectedChat._id === user._id) {
  //       dispatch(setSelectedChat(user));
  //     }
  //   }
  // }, [user, selectedChat?._id]);

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
 
// ==============================Camera ==================
  const openCamera = async () => {
    try {
      // {{ edit_2 }} request with current facingMode
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
      dispatch(setCameraStream(stream));
      dispatch(setOpenCameraState(true));

      // detect if an environment (back) camera exists
      const devices = await navigator.mediaDevices.enumerateDevices();
      const backCams = devices.filter(d =>
        d.kind === 'videoinput' && d.label.toLowerCase().includes('back')
      );
      if (backCams.length > 0) dispatch(setBackCameraAvailable(true));

    } catch (error) {
      console.error("Error accessing the camera: ", error);
    }
  };

  useEffect(() => {
    // Cleanup function to close the participant section when the component unmounts
    return () => {
      dispatch(setParticipantOpen(false));
    };
  }, []);

  return (
    <div className="flex h-screen bg-white transition-all duration-300">
      {(!(isReceiving || isVideoCalling || isVoiceCalling) || callChatList || chatMessages) && (
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
      {/* ==============================Right Sidebar chat list ============================== */}
       {(callChatList || showGroups || showProfile || selectedChatModule || showSettings || showCallHistory) && (
        <>
          {/* Left Side */}
          <div
            className={`${window.innerWidth <= 600
              ? "ml-0 w-full"
              : "md:ml-16 md:w-[300px] lg:w-[380px] shrink-0"
              } ${showLeftSidebar ? "block" : "hidden md600:block"}`}
          >
            {showGroups &&  <Groups/> }
            {showProfile && <Profile />}

            {selectedChatModule && (
              <ChatList
                handleMultipleFileUpload={handleMultipleFileUpload} // Pass the function here
              />
            )}
            {showSettings && <Setting />}
            {showCallHistory && ( <CallHistory />)}
          </div>
         

          {/* Right Side */}
          <>

           {(chatMessages || !(isReceiving || isVideoCalling || isVoiceCalling)) &&
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

                        <ChatHeader
                        handleProfileImageClick={handleProfileImageClick}
                        setIsClearChatModalOpen={setIsClearChatModalOpen}
                        setIsDeleteChatModalOpen={setIsDeleteChatModalOpen}
                        setGroupUsers={setGroupUsers}
                        />

                        {/*========================== Messages ==============================*/}
                        <div className="relative">
                    
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
                            {/* {visibleDate && <FloatingDateIndicator />} */}
                              <MessageList
                                handleMakeCall={handleMakeCall}
                                handleForward={handleForwardMessage}
                                handleMultipleFileUpload={handleMultipleFileUpload}
                                openCamera={openCamera}
                              />

                          {selectedFiles && selectedFiles?.length > 0 && (
                            <div className="flex px-6  dark:bg-primary-dark">
                              {selectedFiles?.map((file, index) => {
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
                                          dispatch(setSelectedFiles(
                                            selectedFiles?.filter((_, i) => i !== index)
                                          ));
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

                          {/*========== Message Input ==========*/}
                          {selectedChat &&
                            <MessageInput
                              handleMultipleFileUpload={handleMultipleFileUpload}
                              handleSendMessage={handleSendMessage}
                              openCamera={openCamera}
                              setIsDeleteChatModalOpen ={setIsDeleteChatModalOpen }
                              />
                          }
                        </div>
                       
                      </>
                    ) : (
                      <Front data={user} handleMultipleFileUpload={handleMultipleFileUpload} />
                    )}
                  </>
                )}
            </div>
            }

            {/* ============================== right sidebar =========================================== */}

            <div
              className={`transition-all duration-300 ease-in-out flex-grow shrink-0 ${((isGroupModalOpen || isModalOpen) && selectedChat?.members) ||
                isGroupCreateModalOpen ||
                (isUserProfileModalOpen && !selectedChat?.members)
                ? "2xl:w-[380px]  sm:max-w-full  xl:w-[380px]  opacity-100"
                : "w-0 opacity-0"
                }`}
              style={{
                boxShadow: showOverlay ? "0px 0px 5px 1px #80808054" : "none",
              }}
            >
              {isGroupModalOpen && (
                <GroupProfile
                  setGroupUsers={setGroupUsers}
                  handleMakeCall={handleMakeCall}
                />
              )}
              {isModalOpen && (
                <AddParticipants
                  socket={socket}
                  groupUsers={groupUsers}
                  setGroupUsers={setGroupUsers}
                  creatGroup={creatGroup}
                />
              )}
              {isGroupCreateModalOpen && (
                <CreatedGroup
                  isOpen={isGroupCreateModalOpen}
                  socket={socket}
                  creatGroup={creatGroup}
                  setCreatGroup={setCreatGroup}
                  groupUsers={groupUsers}
                  setGroupUsers={setGroupUsers}
                />
              )}
              {isUserProfileModalOpen && !selectedChat.members && (
                <ProfileUser
                  isOpen={isUserProfileModalOpen}
                  handleMakeCall={handleMakeCall}
                />
              )}
            </div>

          </>
        </>
      )}

      {/*=========================================== screen share ==================================*/}
      <div
        className={`h-full w-full flex-1 flex flex-col bg-primary-light dark:bg-primary-dark scrollbar-hide ${isReceiving || isVideoCalling || isVoiceCalling
          ? ""
          : "hidden"
          } ${participantOpen ? "mr-96" : ""}`}
      >
        {isReceiving && Object.keys(remoteStreams).length > 0 ? (
          Object.keys(remoteStreams).map((userId) => (
            <div key={userId} className="relative w-full flex items-center justify-center" style={{ minHeight: "120px", maxHeight: "250px", maxWidth: "100%" }}>
              <video autoPlay playsInline className="w-full h-full object-cover rounded-lg" ref={(el) => { if (el) { el.srcObject = userStreams[userId]; } }} />
              <div className="absolute bottom-2 left-2 text-white text-xl bg-blue-500 px-3 py-1 rounded-full text-center">
                {allUsers.find((user) => user._id === userId)?.userName || "Participant"}
              </div>
            </div>
          ))
        ) : (
          // ========================screen share section===============
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
                <p className="absolute top-36 text-white text-lg font-medium">
                  {selectedChat?.userName || "Unknown User"}
                </p>
              </div>

              {/* Always show controls buttons*/}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[100%]">
                <div className="bg-gray-800 p-2 flex justify-center items-center space-x-3 md:space-x-4">
                  <button
                    onClick={() => dispatch(setSelectedChatModule(!selectedChatModule))}
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
                        dispatch(setParticipantOpen(true));
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
            // ===============Video call screen================
            <VideoCallLayout/>
          )
        )}
      </div>
      {/* ========= incoming call ========= */}
      {incomingCall && (<IncomingCall/>)}

      {incomingShare && (
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
                    dispatch(setIncomingShare(null));
                    cleanupConnection();
                  }}
                  className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <LuScreenShareOff className="text-xl" />
                </button>
              </div>
            </div>
          </div>
      )}

      {/*======================= Call participant modal ==========================*/}
      <CallParticipantModal/>

      <input
        type="file"
        id="file-input"
        style={{ display: "none" }}
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            dispatch(updateUser({ id: currentUser, values: { photo: file } }));
          }
        }}
      />
      {isImageModalOpen && selectedImage && (
        <MediaViewer/>
      )}

      {/* profile photo */}
      {(isProfileImageModalOpen && selectedProfileImage) && (
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
                    dispatch(setIsImageModalOpen(false));
                  }
                }}
                className="absolute top-4 right-4 text-white hover:text-gray-300"
              >
                <ImCross className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
        
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
});


export default Chat2;