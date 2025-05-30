import React, { useState, useEffect, useRef, memo, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {FaPaperclip,FaFilePdf, FaFileExcel,FaFileWord,FaFilePowerpoint,FaFileArchive} from "react-icons/fa";
import {LuScreenShare,LuScreenShareOff} from "react-icons/lu";
import { ImCross } from "react-icons/im";
import { RxCross2 } from "react-icons/rx";
import { useDispatch, useSelector } from "react-redux";
import {getAllGroups, getAllMessages,getAllMessageUsers,getAllUsers,getUser,updateMessage, clearChat, getAllCallUsers,deleteChat, pinChat} from "../redux/slice/user.slice";
import { BASE_URL, IMG_URL } from "../utils/baseUrl";
import axios from "axios";
import Front from "../component/Front";
import MessageList from "../component/MessageList";
import Profile from "../component/Profile";
import Sidebar from "../component/SideBar";
import ChatList from "../component/ChatList";
import Groups from "../component/Group";
import Setting from "../component/Setting";
import GroupProfile from "../component/GroupProfile";
import AddParticipants from "../component/AddParticipants";
import CreatedGroup from "../component/CreatedGroup";
import ProfileUser from "../component/ProfileUser";
import CallHistory from "../component/CallHistory";
import ForwardModal from "../component/ForwardModal";
import IncomingCall from "../component/IncomingCall";
import VideoCallLayout from "../component/VideoCallLayout";
import CallParticipantModal from "../component/CallParticipantModal";
import { setBackCameraAvailable, setCameraStatus, setCameraStream, setEditingMessage, setIncomingShare, setIsGroupCreateModalOpen, setIsGroupModalOpen, setIsImageModalOpen, setIsModalOpen, setIsSearchBoxOpen, setIsUserProfileModalOpen, setMessageInput, setOpenCameraState, setParticipantOpen, setReplyingTo, setSearchInputbox, setSelectedChat, setSelectedChatModule, setSelectedFiles, setSelectedImage, setShowCallHistory, setShowGroups, setShowLeftSidebar, setShowProfile, setShowSettings, setUploadProgress } from "../redux/slice/manageState.slice";
import MediaViewer from "../component/MediaViewer";
import { useSocket } from "../context/SocketContext";
import MessageInput from "../component/MessageInput";
import ChatHeader from "../component/ChatHeader";


const Chat2 = () => {
  const { allUsers, user } = useSelector((state) => state.user);

  const remoteStreams = useSelector(state => state.magageState.remoteStreams);
  const isConnected = useSelector(state => state.magageState.isConnected);
  const isVideoCalling = useSelector(state => state.magageState.isVideoCalling);
  const incomingCall = useSelector(state => state.magageState.incomingCall);
  const isReceiving = useSelector(state => state.magageState.isReceiving);
  const incomingShare = useSelector(state => state.magageState.incomingShare);
  const isVoiceCalling = useSelector(state => state.magageState.isVoiceCalling);
  const selectedChatModule = useSelector(state => state.magageState.selectedChatModule);
  const showProfile = useSelector(state => state.magageState.showProfile);
  const showSettings = useSelector(state => state.magageState.showSettings);
  const showGroups = useSelector(state => state.magageState.showGroups);
  const showCallHistory = useSelector(state => state.magageState.showCallHistory);
  const isGroupModalOpen = useSelector(state => state.magageState.isGroupModalOpen);
  const isModalOpen = useSelector(state => state.magageState.isModalOpen);
  const isGroupCreateModalOpen = useSelector(state => state.magageState.isGroupCreateModalOpen);
  const isUserProfileModalOpen = useSelector(state => state.magageState.isUserProfileModalOpen);
  const showLeftSidebar = useSelector(state => state.magageState.showLeftSidebar);
  const selectedChat = useSelector(state => state.magageState.selectedChat);
  const selectedImage = useSelector(state => state.magageState.selectedImage);
  const isImageModalOpen = useSelector(state => state.magageState.isImageModalOpen);
  const selectedFiles = useSelector(state => state.magageState.selectedFiles);
  const participantOpen = useSelector(state => state.magageState.participantOpen);
  const editingMessage = useSelector(state => state.magageState.editingMessage);
  const callChatList = useSelector(state => state.magageState.callChatList);
  const chatMessages = useSelector(state => state.magageState.chatMessages);
  const showForwardModal = useSelector(state => state.magageState.showForwardModal);
  const onlineUsers = useSelector(state => state.magageState.onlineUsers)
  // const participants = useSelector(state => state.magageState.participants)

  console.log("onlineUsers",onlineUsers);
  

  const dispatch = useDispatch();
  // const currentUser = useMemo(() => sessionStorage.getItem("userId"), []);
  const [currentUser] = useState(sessionStorage.getItem("userId"));
 
  // const localVideoRef = useRef(null);
  const navigate = useNavigate();
  const [groupUsers, setGroupUsers] = useState([]);

  const [isProfileImageModalOpen, setIsProfileImageModalOpen] = useState(false);
  const [selectedProfileImage, setSelectedProfileImage] = useState(null);
  const [isClearChatModalOpen, setIsClearChatModalOpen] = useState(false);
  const [isDeleteChatModalOpen, setIsDeleteChatModalOpen] = useState(false);

  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const [creatGroup, setCreatGroup] = useState(false)
  const [isDragging, setIsDragging] = useState(false);
  // Object to hold durations keyed by message ID

  const [userStreams, setUserStreams] = useState({});
  const [showOverlay, setShowOverlay] = useState(false);

  // console.log(remoteStreams);
  


  //===========Use the custom socket hook===========
  const {socket,cleanupConnection,sendPrivateMessage,subscribeToMessages,acceptScreenShare, startCall} = useSocket();
  
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

    //===========get all users===========
    useEffect(() => {
      dispatch(getAllUsers());
      dispatch(getAllMessageUsers());
      dispatch(getAllGroups());
      dispatch(getUser(currentUser));
      dispatch(getAllCallUsers());
    }, []);
  // =================Notification=======================

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
      icon: "/chat.png", // Use your app's icon
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
      timestamp: new Date().getTime(), 
      sound: "/Notifications.mp3", 
    });

    // Close notification after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);
  };

  // useEffect(() => {
  //   if (selectedChat && allMessageUsers) {
  //     const updatedChat = allMessageUsers.find(
  //       (chat) => chat._id === selectedChat._id
  //     );
  //     // console.log("updatedChat", updatedChat);
  //     if (updatedChat) {
  //       dispatch(setSelectedChat(updatedChat));
  //     }
  //   }
  // }, [allMessageUsers]);

  const [ringtone] = useState(new Audio('/Ringtone.mp3')); // Add your ringtone file to public folder
  
  // Add useEffect to handle ringtone
  useEffect(() => {
    if (incomingCall) {
      ringtone.loop = true;
      ringtone.play().catch(err => console.error('Error playing ringtone:', err));
    } else {
      ringtone.pause();
      ringtone.currentTime = 0;
    }

    return () => {
      ringtone.pause();
      ringtone.currentTime = 0;
    };
  }, [incomingCall]);

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
      ) return;

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

  const handleMultipleFileUpload =  useCallback(async(files, userId) => {
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
  }, []);
  // =========================== video call=============================

  // Add call handling functions

  const handleMakeCall = useCallback(async (type) => {
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
  }, []);

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

  // useEffect(() => {
  //   // Set showLeftSidebar to true when no chat is selected
  //   if (!selectedChat) {
  //     // setShowLeftSidebar(false);
  //     if (window.innerWidth <= 600) {
  //       setShowLeftSidebar(true); // On mobile, always show chat list if no chat selected
  //     } else {
  //       setShowLeftSidebar(false); // On desktop, hide sidebar if no chat selected
  //     }
  //   }
  // }, [selectedChat]);


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


  useEffect(() => {
    // Cleanup function to close the participant section when the component unmounts
    return () => {
      dispatch(setParticipantOpen(false));
    };
  }, []);

  console.log("cHAT2");

  return (
    <div className="flex h-screen bg-white transition-all duration-300">
      {(!(isReceiving || isVideoCalling || isVoiceCalling) || callChatList || chatMessages) && (
        <Sidebar/>
      )}
      {/* ==============================Right Sidebar chat list ============================== */}
      {(!(isReceiving || isVideoCalling || isVoiceCalling) || callChatList || chatMessages) && (

        <>
          {/* Left Side */}
          {(callChatList || showGroups || showProfile || selectedChatModule || showSettings || showCallHistory) &&
            <div
              className={`${window.innerWidth <= 600
                ? "ml-0 w-full"
                : "md:ml-16 md:w-[300px] lg:w-[380px] shrink-0"
                } ${showLeftSidebar ? "block" : "hidden md600:block"}`}
            >
              {showGroups && <Groups />}
              {showProfile && <Profile />}

              {selectedChatModule && (
                <ChatList
                  handleMultipleFileUpload={handleMultipleFileUpload} // Pass the function here
                />
              )}
              {showSettings && <Setting />}
              {showCallHistory && (<CallHistory />)}
            </div>
          }
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
                                // handleForward={handleForwardMessage}
                                handleMultipleFileUpload={handleMultipleFileUpload}
                                // openCamera={openCamera}
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
    
                         <MessageInput
                              handleMultipleFileUpload={handleMultipleFileUpload}
                              handleSendMessage={handleSendMessage}
                              // openCamera={openCamera}
                              setIsDeleteChatModalOpen ={setIsDeleteChatModalOpen }
                          />
                        </div>
                       
                      </>
                    ) : (
                      <Front data={user} handleMultipleFileUpload={handleMultipleFileUpload} />
                    )}
                  </>
                )}
            </div>
}
  {/* // ============================== right sidebar =========================================== */}
            
            {!(isReceiving || isVideoCalling || isVoiceCalling) &&
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
            }
          </>
        </>
      ) }

      {/*=========================================== screen share ==================================*/}
      < div
        className={`h-full w-full flex-1 flex flex-col bg-primary-light dark:bg-primary-dark scrollbar-hide ${isReceiving || isVideoCalling || isVoiceCalling
          ? ""
          : "hidden"
          } ${participantOpen ? "mr-96" : ""}`}
      >
           <VideoCallLayout/>
      </div>

{/* =============================================All Modal Section======================================================= */}

      {/* ==== incoming call===== */}
      {incomingCall && (<IncomingCall/>)}

      {incomingShare && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-black rounded-lg p-6 w-72 text-center">
              <h3 className="text-2xl text-gray-300 mb-2 ">
                Incoming Screen <br /> Request...
              </h3>
              <p className="text-gray-400 mb-8">
                {allUsers.find((user) => user._id === incomingShare.fromEmail)?.userName}
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

      {/*======= Call participant modal ======*/}
      <CallParticipantModal/>

      {isImageModalOpen && selectedImage && <MediaViewer/>}

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
      {showForwardModal &&  <ForwardModal/>}

      {/* delete message modal */}
      {isClearChatModalOpen && (
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
      )}

      {isDeleteChatModalOpen && (
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
      )}
    </div >
  );
};


export default Chat2;