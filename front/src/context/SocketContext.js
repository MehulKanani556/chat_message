import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllMessages,
  getAllMessageUsers,
  setOnlineuser,
} from "../redux/slice/user.slice";
import {
  setRemoteStreams,
  setParticipants,
  updateParticipant,
  removeParticipant,
  setCallParticipantsList,
  setIsConnected,
  setOnlineUsers,
  setIsReceiving,
  setIncomingCall,
  setIsVideoCalling,
  setIsVoiceCalling,
  setIncomingShare,
  setIsSharing,
  setIsCameraOn,
  setIsMicrophoneOn,
  setVoiceCallData,
  setCameraStatus,
  setCallParticipants,
  setTypingUsers,
  setUserIncall,
} from "../redux/slice/manageState.slice";
import { BASE_URL } from '../utils/baseUrl';
import { useNavigate } from 'react-router-dom';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

const SOCKET_SERVER_URL = BASE_URL.replace('/api', '');

const SocketContext = createContext();

// Initialize FingerprintJS
const fpPromise = FingerprintJS.load();

// Function to get device ID
const getDeviceId = async () => {
  let deviceId = localStorage.getItem('deviceId');
  
  if (!deviceId) {
    const fp = await fpPromise;
    const result = await fp.get();
    deviceId = result.visitorId;
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
};

// Simple encryption/decryption functions
const encryptMessage = (text) => {
  const key = "chat";
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return btoa(result);
};

const decryptMessage = (encryptedText) => {
  const key = "chat";
  const decodedText = atob(encryptedText);
  let result = "";
  for (let i = 0; i < decodedText.length; i++) {
    result += String.fromCharCode(
      decodedText.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return result;
};

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const peerRef = useRef(null);
  const peersRef = useRef({});
  const [peerEmail, setPeerEmail] = useState("");
  const [error, setError] = useState(null);
  const [hasWebcam, setHasWebcam] = useState(false);
  const [hasMicrophone, setHasMicrophone] = useState(false);
  const streamRef = useRef(null);
  const [callAccept, setCallAccept] = useState(false);
  const [callStartTime, setCallStartTime] = useState(null);
  const [callDuration, setCallDuration] = useState(null);
  const callTimerRef = useRef(null);
  const [groupCall, setGroupCall] = useState("");
  const [callFrom, setCallFrom] = useState("");
  const [allCallUsers, setAllCallUsers] = useState(new Map());
  const [callRoom, setCallRoom] = useState(null);
  const [callStatus, setCallStatus] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const userId = sessionStorage.getItem("userId");
  const navigate = useNavigate();

  const dispatch = useDispatch();
  const {
    remoteStreams,
    callParticipantsList,
    isConnected,
    onlineUsers,
    incomingCall,
    isCameraOn,
    isSharing,
    isVideoCalling,
    isReceiving,
    isVoiceCalling,
    incomingShare,
    callParticipants,
    isMicrophoneOn,
    voiceCallData,
    cameraStatus,
    typingUsers,
    selectedChat,
  } = useSelector((state) => state.magageState);

  const { messages } = useSelector((state) => state.user);

  // Helper functions
  const generateCallRoomId = () => {
    return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const checkMediaDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );
      const audioDevices = devices.filter(
        (device) => device.kind === "audioinput"
      );
      setHasWebcam(videoDevices.length > 0);
      setHasMicrophone(audioDevices.length > 0);
    } catch (err) {
      console.error("Error checking media devices:", err);
      setError(
        "Unable to detect media devices. Please ensure you have granted necessary permissions."
      );
    }
  };

  // Socket connection effect
  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const token = sessionStorage.getItem('token');
    
    const initializeSocket = async () => {
      const deviceId = await getDeviceId();
      
      if (token) {
        socketRef.current = io(SOCKET_SERVER_URL, {
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 20000,
          forceNew: true,
          auth: {
            token,
            deviceId
          }
        });

        socketRef.current.on("connect", () => {
          dispatch(setIsConnected());
          console.log("Socket connected with userId:", userId);
          socketRef.current.emit("user-login", userId);
          // Join device room
          socketRef.current.emit("join-device-room", deviceId);
        });

        socketRef.current.on("connect_error", (error) => {
          console.error("Socket connection error:", error);
          dispatch(setIsConnected(false));
          dispatch(setOnlineUsers([]));
        });

        socketRef.current.on("disconnect", () => {
          dispatch(setIsConnected(false));
          dispatch(setOnlineUsers([]));
          console.log("Socket disconnected");
        });
        // alert("Socket connected");

        socketRef.current.on("force-logout", (data) => {
          console.log('Force logout received:', data);
          alert("Force logout received");
          // Clean up socket connection
          if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
          }
          // Clear all storage
          sessionStorage.clear();
          localStorage.removeItem('deviceId');
          // Redirect to login
          navigate('/login');
        });

        socketRef.current.on("user-status-changed", (onlineUserIds) => {
          dispatch(setOnlineUsers(onlineUserIds));
        });

        socketRef.current.on("reconnect", () => {
          console.log("Socket reconnected, re-emitting user-login");
          socketRef.current.emit("user-login", userId);
        });

        return () => {
          if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
          }
        };
      }
    };

    initializeSocket();
  }, [userId, navigate, dispatch]);

  // Media devices check effect
  useEffect(() => {
    checkMediaDevices();
  }, []);

  // Call users effect
  useEffect(() => {
    const callusers = Array.from(allCallUsers?.keys()) || [];
    sessionStorage.setItem("callUser", callusers.length);
  }, [allCallUsers]);

  // All the functions from the original useSocket hook
  const sendPrivateMessage = (receiverId, message) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error("Socket not connected"));
        return;
      }

      try {
        let content = message.data.content;
        if (!content.startsWith("data:")) {
          const key = "chat";
          let result = "";
          for (let i = 0; i < content.length; i++) {
            result += String.fromCharCode(
              content.charCodeAt(i) ^ key.charCodeAt(i % key.length)
            );
          }
          content = "data:" + btoa(result);
        }

        console.log("message", message);

        const messageData = {
          senderId: userId,
          receiverId,
          content: {
            type: message.data.type,
            content: content,
            fileType: message.data.fileType,
            fileUrl: message.data.fileUrl,
            size: message.data.size,
          },
          replyTo: message.data.replyTo,
          isBlocked: message.isBlocked,
        };
        socketRef.current.emit("private-message", messageData);

        socketRef.current.once("message-sent-status", (status) => {
          resolve(status);
        });
      } catch (error) {
        reject(error);
      }
    });
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach((track) => (track.enabled = !track.enabled));
      const newStatus = !isCameraOn;
      dispatch(setIsCameraOn(newStatus));

      if (socketRef.current?.connected) {
        console.log(
          `[Camera Status] User ${userId} is ${newStatus ? "turning ON" : "turning OFF"
          } their camera`
        );
        socketRef.current.emit("camera-status-change", {
          userId,
          isCameraOn: newStatus,
        });
      }
    }
  };

  const toggleMicrophone = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach((track) => (track.enabled = !track.enabled));
      dispatch(setIsMicrophoneOn());
    }
  };

  // console.log("userId", userId);

  const sendTypingStatus = (receiverId, isTyping) => {
    if (!socketRef.current?.connected) return;

    // console.log(userId, receiverId, isTyping);

    socketRef.current.emit("typing-status", {
      senderId: userId,
      receiverId,
      isTyping,
    });
  };

  // ===========================messages=============================

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

      // Mark these messages as read
      if (unreadMessages.length > 0) {
        markMessageAsRead(unreadMessages);
        // dispatch(getAllMessageUsers());
      }
    }
  }, [selectedChat, messages]);

  const markMessageAsRead = (messageIds) => {
    if (!socketRef.current?.connected || !messageIds?.length) return;

    // Mark each message as read
    messageIds.forEach((messageId) => {
      socketRef.current.emit("message-read", {
        messageId,
        readerId: userId,
      });
    });
    dispatch(getAllMessageUsers());
  };

  const subscribeToMessages = (callback) => {
    if (!socketRef.current?.connected) return;

    const messageHandler = (message) => {
      console.log("Received message:", message);
      // Decrypt the message content if it's encrypted
      if (message.content && message.content.content) {
        try {
          const decryptedContent = decryptMessage(message.content.content);
          message.content.content = decryptedContent;
        } catch (error) {
          console.error("Decryption error:", error);
        }
      }
      callback(message);
    };

    const messageStatusHandler = (data) => {
      console.log("Message status update:", data);
      callback({ type: "status", ...data });
    };

    const messageReadHandler = (data) => {
      console.log("Message read update:", data);
      callback({ type: "read", ...data });
    };

    const messageDeletedHandler = (messageId) => {
      console.log("Received message deleted:", messageId);
      callback({ type: "delete", messageId });
    };

    const messageUpdatedHandler = (message) => {
      console.log("Received message updated:", message);
      // Decrypt the message content if it's encrypted
      if (message.content && message.content.content) {
        try {
          const decryptedContent = decryptMessage(message.content.content);
          message.content.content = decryptedContent;
        } catch (error) {
          console.error("Decryption error:", error);
        }
      }
      callback(message);
    };

    const groupMessageHandler = (message) => {
      console.log("Received group message:", message);
      // Decrypt the message content if it's encrypted
      if (message.content && message.content.content) {
        try {
          const decryptedContent = decryptMessage(message.content.content);
          message.content.content = decryptedContent;
        } catch (error) {
          console.error("Decryption error:", error);
        }
      }
      callback(message);
    };

    const reactionHandler = (data) => {
      console.log("Received reaction:", data);
      callback({ type: "reaction", ...data });
    };

    socketRef.current.on("receive-message", messageHandler);
    socketRef.current.on("message-sent-status", messageStatusHandler);
    socketRef.current.on("message-read", messageReadHandler);
    socketRef.current.on("message-deleted", messageDeletedHandler);
    socketRef.current.on("message-updated", messageUpdatedHandler);
    socketRef.current.on("receive-group", groupMessageHandler);
    socketRef.current.on("message-reaction", reactionHandler);

    return () => {
      if (socketRef.current) {
        socketRef.current.off("receive-message", messageHandler);
        socketRef.current.off("message-sent-status", messageStatusHandler);
        socketRef.current.off("message-read", messageReadHandler);
        socketRef.current.off("message-deleted", messageDeletedHandler);
        socketRef.current.off("message-updated", messageUpdatedHandler);
        socketRef.current.off("receive-group", groupMessageHandler);
        socketRef.current.off("message-reaction", reactionHandler);
      }
    };
  };

  // ===========================screen share=============================

  const startSharing = async (selectedChat) => {
    if (!selectedChat) {
      setError("No chat selected");
      return;
    }

    try {
      console.log("Requesting screen share...");
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      console.log("Got screen stream, creating peer...");
      streamRef.current = stream;

      // Show local stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Check if it's a group chat
      const isGroup = selectedChat.isGroupChat || selectedChat.members;

      if (isGroup) {
        // Request group members from server
        socketRef.current.emit("get-group-members", selectedChat._id);

        socketRef.current.once("group-members", ({ members }) => {
          members.forEach((memberId) => {
            if (memberId !== userId) {
              // Don't create connection to self
              const peer = new Peer({
                initiator: true,
                trickle: false,
                stream: stream,
              });

              peer.on("signal", (signal) => {
                socketRef.current.emit("screen-share-request", {
                  fromEmail: userId,
                  toEmail: memberId,
                  signal,
                  groupId: selectedChat._id,
                  isGroup: true,
                });
              });

              peer.on("error", (err) => {
                console.error("Peer error:", err);
                setError(
                  `Connection error with member ${memberId}: ${err.message}`
                );
              });

              peer.on("connect", () => {
                console.log(
                  "Peer connection established with member:",
                  memberId
                );
              });

              // Store peer connection for this member
              if (!peerRef.current) peerRef.current = {};
              peerRef.current[memberId] = peer;
            }
          });
        });
      } else {
        // Single user share
        const peer = new Peer({
          initiator: true,
          trickle: false,
          stream: stream,
        });

        peer.on("signal", (signal) => {
          socketRef.current.emit("screen-share-request", {
            fromEmail: userId,
            toEmail: selectedChat._id,
            signal,
            isGroup: false,
          });
        });

        peer.on("error", (err) => {
          console.error("Peer error:", err);
          setError("Connection error occurred: " + err.message);
          cleanupConnection();
        });

        peer.on("connect", () => {
          console.log("Peer connection established");
        });

        peerRef.current = { [selectedChat._id]: peer };
      }

      dispatch(setIsSharing(true));

      // Handle stream end
      stream.getVideoTracks()[0].onended = () => {
        console.log("Stream ended by user");
        cleanupConnection();
      };

      return true;
    } catch (err) {
      console.error("Error starting share:", err);
      setError(
        "Failed to start screen sharing: " + (err.message || "Unknown error")
      );
      cleanupConnection();
      return false;
    }
  };
  // Add socket listeners for screen sharing

  const acceptScreenShare = () => {
    if (!incomingShare) return;

    try {
      dispatch(setIsReceiving(true));
      setPeerEmail(incomingShare.fromEmail);

      // Create receiving peer
      const peer = new Peer({
        initiator: false,
        trickle: false,
      });

      // Initialize peerRef.current if needed
      if (!peerRef.current) peerRef.current = {};

      // Store the peer connection immediately
      peerRef.current[incomingShare.fromEmail] = peer;

      peer.on("signal", (signal) => {
        console.log("Receiver generated signal, sending accept");
        socketRef.current.emit("share-accept", {
          signal,
          fromEmail: incomingShare.fromEmail,
          toEmail: userId,
          groupId: incomingShare?.groupId,
          isGroup: incomingShare?.isGroup,
        });
      });

      peer.on("stream", (stream) => {
        console.log("Receiver got stream");
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
          remoteVideoRef.current
            .play()
            .catch((e) => console.error("Error playing:", e));
        }

        dispatch(setRemoteStreams(
          new Map(remoteStreams).set(incomingShare.fromEmail, stream)
        ));
        dispatch(updateParticipant({ userId:incomingShare.fromEmail, stream }));

      });

      peer.on("error", (err) => {
        console.error("Peer error:", err);
        setError("Connection error occurred");
        cleanupConnection();
      });

      // Signal the peer with the initial offer
      if (incomingShare.signal) {
        console.log("Receiver signaling with initial offer");
        peer.signal(incomingShare.signal);
      }
      dispatch(setIncomingShare(null));
    } catch (err) {
      console.error("Error starting screen share:", err);
      setError(
        "Failed to start screen share: " + (err.message || "Unknown error")
      );
      cleanupConnection();
    }
  };

  useEffect(() => {
    let timeoutId;
    if (callStatus === "ringing" && incomingCall) {
      timeoutId = setTimeout(() => {
        if (callDuration === null) {
          console.log("Call timed out after 30 seconds");
          setCallStatus("ended");

          // Save missed call message
          socketRef.current.emit("save-call-message", {
            senderId: incomingCall.fromEmail,
            receiverId: userId,
            callType: incomingCall.type,
            status: "missed",
            timestamp: new Date(),
            roomId: incomingCall.roomId,
          });

          if (incomingCall.isGroupCall) {
            socketRef.current.emit("participant-left", {
              leavingUser: userId,
              to: incomingCall.fromEmail,
              duration: null,
              roomId: incomingCall.roomId,
            });
          } else {
            // End the call
            // End the call
            socketRef.current.emit("end-call", {
              to: incomingCall.fromEmail,
              from: userId,
              roomId: incomingCall.roomId,
              duration: null,
            });
          }

          // Cleanup
          dispatch(setIncomingCall(null));
          dispatch(setIsVideoCalling(false));
          dispatch(setIsVoiceCalling(false));
          cleanupConnection();
        }
      }, 30000);
    }

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [callStatus, incomingCall, callDuration, userId]);

  useEffect(() => {
    if (!socketRef.current) return;

    // Handle incoming video call request with 30 sec timeout and disconnect function
    socketRef.current.on("call-request", async (data) => {
      console.log("Incoming call from:", data);

      if(isVideoCalling || isReceiving || isVoiceCalling){
        socketRef.current.emit("user-in-call",{
          ...data,
          message: " is currently in another call"
        });
        return;
      }else{
        dispatch(setIncomingCall({
          fromEmail: data.fromEmail,
          signal: data.signal,
          type: data.type,
          participants: data.participants,
          isGroupCall: data.isGroupCall,
          groupId: data.groupId || null,
          roomId: data.roomId,
        }));
        setCallRoom(data.roomId);
        setCallStatus("ringing");
      }
    });

    // console.log("callDuration", callDuration);

    socketRef.current.on("call-invite", async (data) => {
      console.log("Incoming call invite from:", data);
      if(isVideoCalling || isReceiving || isVoiceCalling){
        socketRef.current.emit("user-in-call",{
          ...data,
          message: " is currently in another call"
        });
        return;
      }else{
      dispatch(setIncomingCall({
        fromEmail: data.fromEmail,
        signal: data.signal,
        type: data.type,
        participants: data.participants || [],
        isGroupCall: data.isGroupCall || false,
        roomId: data.roomId,
      }));
      setCallRoom(data.roomId);

      setCallStatus("ringing");
    }
    });

    socketRef.current.on("participant-joined", async ({ newParticipantId, from, participants, roomId }) => {
      if (newParticipantId !== userId && streamRef.current) {

        const peer = new Peer({
          initiator: false,
          trickle: false,
          stream: streamRef.current,
        });

        peer.on("signal", (signal) => {
          socketRef.current.emit("call-signal", {
            signal,
            to: newParticipantId,
            from: userId,
            roomId,
          });
        });

        peer.on("stream", (stream) => {
          dispatch(setRemoteStreams(
            new Map(remoteStreams).set(newParticipantId, stream)
          ));

          dispatch(updateParticipant({ userId: newParticipantId, stream: stream }));

          setAllCallUsers((prev) =>
            new Map(prev).set(newParticipantId, stream)
          );
        });

        peersRef.current[newParticipantId] = peer;
        dispatch(setCallParticipants(new Set([...callParticipants, newParticipantId])));
      }
    }
    );

    socketRef.current.on("call-signal", ({ signal, from, roomId }) => {
      if (peersRef.current[from]) {
        peersRef.current[from].signal(signal);
      }
    });

    socketRef.current.on("participant-lefted", ({ leavingUser, duration, roomId }) => {

      console.log("xbxbgfbdvb", leavingUser);

      // Remove the leaving participant's remote stream
      dispatch(setRemoteStreams(() => {
        const newStreams = new Map(remoteStreams);
        newStreams.delete(leavingUser);
        return newStreams;
      }));

      dispatch(removeParticipant(leavingUser))


      // Remove the leaving participant from the participants list
      const newParticipants = new Set(callParticipants);
      newParticipants.delete(leavingUser);
      dispatch(setCallParticipants(newParticipants));

      // Clean up peer connection for the leaving participant
      if (peersRef.current[leavingUser]) {
        peersRef.current[leavingUser].destroy();
        delete peersRef.current[leavingUser];
      }
    }
    );

    // Handle when call is accepted
    socketRef.current.on("call-accepted", ({ signal, fromEmail, roomId }) => {
      console.log("Call accepted by:", fromEmail);
      setCallAccept(true);
      setCallStatus("connected");

      if (peersRef.current) {
        peersRef.current[fromEmail].signal(signal);
      } else {
        console.error("No peer connection found for:", fromEmail);
      }
    });

    socketRef.current.on("call-ended", ({ to, from, duration, roomId }) => {

      if(!duration){
        alert("User is Busy so Rejected  call")
        // return
      }
      // Reset call-related states
      // Reset call-related states
      setCallStartTime(null);
      setCallDuration(null);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // Clean up peer connections
      if (peersRef.current) {
        Object.entries(peersRef.current).forEach(([peerId, peer]) => {
          if (peer && typeof peer.destroy === "function") {
            peer.destroy();
            delete peersRef.current[peerId];
          }
        });
      }

      // Clean up video refs
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }

      // Reset all call states
      dispatch(setIsVideoCalling(false));
      dispatch(setIsVoiceCalling(false));
      dispatch(setIncomingCall(null));
      dispatch(setIsCameraOn(false));
      dispatch(setIsMicrophoneOn(false));
      setCallDuration(null);
      setCallStartTime(null);
      setPeerEmail(null);
      dispatch(setRemoteStreams(new Map()));
      dispatch(setParticipants([]));
      cleanupConnection()
    });

    socketRef.current.on("screen-share-request", async (data) => {
      console.log("Incoming screen share from:", data.fromEmail);
      if(isVideoCalling || isReceiving || isVoiceCalling){
        socketRef.current.emit("user-in-call",{
          ...data,
          message: " is currently in another call"
        });
        return;
      }else{
      dispatch(setIncomingShare(data));
      }
    });

    // Handle when share is accepted
    socketRef.current.on("share-accepted", async ({ signal, fromEmail }) => {
      console.log("Share accepted by peer:", fromEmail);
      if (peerRef.current && peerRef.current[fromEmail]) {
        peerRef.current[fromEmail].signal(signal);
      } else {
        console.error("No peer connection found for:", fromEmail);
      }
    });

    socketRef.current.on("call:update-participant-list", (call) => {
      // console.log("call:update-participant-list", call);
      dispatch(setCallParticipantsList(call));
    });

    socketRef.current.on("user-in-call", (data) => {
      if(!selectedChat?.members){
        dispatch(setUserIncall("is on another Call Running"));
      }
    });

    return () => {
      cleanupConnection();
      if (socketRef.current) {
        socketRef.current.off("call-request");
        socketRef.current.off("call-accepted");
        socketRef.current.off("call-signal");
        socketRef.current.off("screen-share-request");
        socketRef.current.off("share-accepted");
        socketRef.current.off("share-signal");
        socketRef.current.off("call-ended");
        socketRef.current.off("call-invite");
        socketRef.current?.off("participant-joined");
        socketRef.current?.off("participant-left");
        socketRef.current?.off("call:update-participant-list");
      }
    };
  }, [socketRef.current, userId]);

  //==========================call=============================

  const startCall = async (
    receiverId,
    isGroupCall = false,
    selectedChat = null,
    type
  ) => {
    if (!receiverId) {
      setError("Please enter peer email first");
      return;
    }
    // Initialize call room and metadata
    const roomId = generateCallRoomId();
    setCallRoom(roomId);
    setCallStatus("ringing");
    setCallFrom(userId);
    setGroupCall(isGroupCall ? receiverId : "");
    const calltype = type == "video" ? "video" : "voice";

    try {
      let stream = null;
      try {
        console.log("Requesting media devices...");
        stream = await navigator.mediaDevices.getUserMedia({
          video: calltype == "video" ? hasWebcam : false,
          audio: hasMicrophone,
        });
        console.log("Media stream obtained:", stream);

        if (calltype == "video") {
          dispatch(setIsCameraOn(true));
        }
        dispatch(setIsMicrophoneOn(true));
        streamRef.current = stream;

        dispatch(updateParticipant({ userId, stream }));

        // if (localVideoRef?.current) {
        //   console.log("Attaching stream to local video element");
        //   localVideoRef.current.srcObject = stream;
        //   try {
        //     await localVideoRef.current.play();
        //     console.log("Local video playback started");
        //   } catch (err) {
        //     console.error("Error playing local video:", err);
        //   }
        // } else {
        //   console.error("Local video element not found");
        // }
      } catch (err) {
        console.error("Could not get media devices:", err);
        setError("Failed to access camera/microphone. Please check your device permissions.");
        return;
      }

      setCallStartTime(new Date());

      const otherMembers =
        selectedChat &&
        selectedChat?.members?.filter((memberId) => memberId !== userId);

      if (otherMembers) {
        // Group call handling
        otherMembers.forEach((member) => {

          const peer = createPeer(true, stream, member);
          peer.on("signal", (signal) => {
            const data = {
              fromEmail: userId,
              toEmail: member,
              signal,
              type: calltype,
              isGroupCall: true,
              participants: selectedChat.members,
              groupId: receiverId,
              roomId,
            };
            socketRef.current.emit("call-request", data);
          });

          peer.on("stream", (remoteStream) => {
            dispatch(setRemoteStreams(new Map(remoteStreams).set(member, remoteStream)));
            dispatch(updateParticipant({ userId: member, stream: remoteStream }));
            setAllCallUsers((prev) => new Map(prev).set(member, remoteStream));
          });

          peersRef.current[member] = peer;
          setPeerEmail(member);
          dispatch(setCallParticipants(new Set(selectedChat.members)));
        });
      } else {
        // Single user call handling

        const peer = createPeer(true, stream, receiverId);

        peer.on("signal", (signal) => {
          const data = {
            fromEmail: userId,
            toEmail: receiverId,
            signal,
            type: calltype,
            isGroupCall: false,
            participants: [userId, receiverId],
            roomId,
          };
          socketRef.current.emit("call-request", data);
        });

        peer.on("stream", (remoteStream) => {
          dispatch(setRemoteStreams(new Map(remoteStreams).set(receiverId, remoteStream)));
          dispatch(updateParticipant({ userId: receiverId, stream: remoteStream }));
          setAllCallUsers((prev) =>
            new Map(prev).set(receiverId, remoteStream)
          );
        });

        peersRef.current[receiverId] = peer;
        setPeerEmail(receiverId);
        dispatch(setCallParticipants(new Set([userId, receiverId])));
      }

      if (calltype == "video") {
        dispatch(setIsVideoCalling(true));
      } else {
        dispatch(setIsVoiceCalling(true));
      }
    } catch (err) {
      console.error("Error starting call:", err);
      endCall();
    }
  };

  const inviteToCall = async (newParticipantId) => {
    console.log("cvcvcvc", newParticipantId);

    setCallFrom(userId);
    // if (!streamRef.current) return;

    try {
      const newPeer = new Peer({
        initiator: true,
        trickle: false,
        stream: streamRef.current,
      });

      newPeer.on("signal", (signal) => {
        socketRef.current.emit("call-invite", {
          fromEmail: userId,
          toEmail: newParticipantId,
          signal,
          type: isVideoCalling ? "video" : "voice",
          participants: Array.from(callParticipants),
          roomId: callRoom,
        });
      });

      newPeer.on("stream", (remoteStream) => {
        dispatch(setRemoteStreams(new Map(remoteStreams).set(newParticipantId, remoteStream)));
        dispatch(updateParticipant({ userId: newParticipantId, stream: remoteStream }));
        setAllCallUsers((prev) =>
          new Map(prev).set(newParticipantId, remoteStream)
        );
      });

      peersRef.current[newParticipantId] = newPeer;

      // Notify all existing participants about the new member
      Array.from(callParticipants).forEach((participantId) => {
        if (participantId !== userId) {
          socketRef.current.emit("participant-join", {
            newParticipantId,
            to: participantId,
            from: userId,
            participants: Array.from(callParticipants),
            // roomId,
          });
        }
      });

      dispatch(setCallParticipants(new Set([...callParticipants, newParticipantId])));
    } catch (err) {
      console.error("Error inviting to call:", err);
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    try {
      // Set call start time when call is accepted
      setCallStartTime(new Date());
      startCallDurationTimer();
      setGroupCall(incomingCall?.isGroupCall ? incomingCall?.groupId : "");
      setCallFrom(incomingCall?.fromEmail);
      setCallStatus("accepted");

      let stream = null;
      try {
        // Try to get media stream but don't block if devices aren't available
        stream = await navigator.mediaDevices.getUserMedia({
          video: incomingCall.type == "video" ? hasWebcam : false,
          audio: hasMicrophone,
        });
        // stream = await navigator.mediaDevices.getDisplayMedia({
        //   video: true,
        // });
      } catch (err) {
        console.warn("Could not get media devices:", err);
        // Continue without media stream
      }

      if (stream) {
        if (incomingCall.type == "video") {
          dispatch(setIsCameraOn(true));
        }
        dispatch(setIsMicrophoneOn(true));
        streamRef.current = stream;

        dispatch(updateParticipant({ userId, stream }));

        // if (localVideoRef.current) {
        //   localVideoRef.current.srcObject = stream;
        // }
      }

      // Create peer for the caller
      const peer = createPeer(false, stream, incomingCall.fromEmail);

      peer.on("signal", (signal) => {
        socketRef.current.emit("call-accept", {
          signal,
          fromEmail: incomingCall.fromEmail,
          toEmail: userId,
          participants: incomingCall.participants,
          roomId: callRoom,
        });
      });

      peer.on("stream", (stream) => {
        console.log("Got stream from caller:", incomingCall.fromEmail);
        dispatch(setRemoteStreams(
          new Map(remoteStreams).set(incomingCall.fromEmail, stream)
        ));
        dispatch(updateParticipant({ userId: incomingCall.fromEmail, stream: stream }));
        setAllCallUsers((prev) =>
          new Map(prev).set(incomingCall.fromEmail, stream)
        );
      });

      peer.signal(incomingCall.signal);
      peersRef.current[incomingCall.fromEmail] = peer;

      // Connect with other existing participants
      if (incomingCall.participants) {
        incomingCall.participants.forEach((participantId) => {
          if (
            participantId !== userId &&
            participantId !== incomingCall.fromEmail
          ) {
            const participantPeer = new Peer({
              initiator: true,
              trickle: false,
              stream,
            });

            participantPeer.on("signal", (signal) => {
              socketRef.current.emit("call-signal", {
                signal,
                to: participantId,
                from: userId,
              });
            });

            participantPeer.on("stream", (stream) => {
              console.log(
                "Got stream from existing participant:",
                participantId
              );
              dispatch(setRemoteStreams(
                new Map(remoteStreams).set(participantId, stream)
              ));
              dispatch(updateParticipant({ userId: participantId, stream }));
              setAllCallUsers((prev) =>
                new Map(prev).set(participantId, stream)
              );
            });

            peersRef.current[participantId] = participantPeer;
          }
        });
      }

      if (incomingCall.type == "video") {
        dispatch(setIsVideoCalling(true));
      } else {
        dispatch(setIsVoiceCalling(true));
      }
      setPeerEmail(incomingCall.fromEmail);
      dispatch(setCallParticipants(new Set(incomingCall.participants)));
      dispatch(setIncomingCall(null));
    } catch (err) {
      console.error("Error accepting call:", err);
      endCall();
    }
  };

  const startCallDurationTimer = () => {
    callTimerRef.current = setInterval(() => {
      if (callStartTime) {
        const duration = Math.floor((new Date() - callStartTime) / 1000);
        setCallDuration(duration);
      }
    }, 1000);
  };

  const endCall = () => {
    // Calculate final call duration
    const finalDuration = callStartTime
      ? Math.floor((new Date() - callStartTime) / 1000)
      : 0;
    const no_of_callUser = sessionStorage.getItem("callUser");

    if(callAccept){
    if (groupCall) {
      if (callParticipantsList?.joined?.length > 2) {
        callParticipantsList?.joined.forEach((participantId) => {
          if (participantId !== userId) {
            if (socketRef.current) {
              socketRef.current.emit("participant-left", {
                leavingUser: userId,
                to: participantId,
                duration: finalDuration,
                roomId: callRoom,
              });
            }
          }
        });
      } else {
        callParticipantsList?.joined.forEach((participantId) => {
          if (participantId !== userId) {
            if (socketRef.current) {
              socketRef.current.emit("end-call", {
                to: participantId,
                from: userId,
                duration: finalDuration,
                roomId: callRoom,
              });
            }
          }
        });
      }

      if (callStartTime && callParticipantsList?.joined.length == 2) {
        socketRef.current.emit("save-call-message", {
          senderId: callFrom,
          receiverId: groupCall,
          callType: isVideoCalling ? "video" : "voice",
          status: "ended",
          duration: finalDuration,
          timestamp: new Date(),
          callfrom: callFrom,
          joined: no_of_callUser,
          roomId: callRoom,
        });
      }
    } else {
      if (callParticipantsList?.joined?.length > 2) {
        callParticipantsList?.joined.forEach((participantId) => {
          if (participantId !== userId) {
            if (socketRef.current) {
              socketRef.current.emit("participant-left", {
                leavingUser: userId,
                to: participantId,
                duration: finalDuration,
                roomId: callRoom,
              });
            }
          }
        });

        callParticipantsList?.joined.forEach((participantId) => {
          if (participantId !== userId) {
            if (callStartTime) {
              socketRef.current.emit("save-call-message", {
                senderId: userId,
                receiverId: groupCall ? groupCall : participantId,
                callType: isVideoCalling ? "video" : "voice",
                status: "ended",
                duration: finalDuration,
                timestamp: new Date(),
                joined: no_of_callUser,
                roomId: callRoom,
              });
            }
          }
        });
      } else {
        callParticipantsList?.joined.forEach((participantId) => {
          if (participantId !== userId) {
            if (socketRef.current) {
              socketRef.current.emit("end-call", {
                to: participantId,
                from: userId,
                duration: finalDuration,
                roomId: callRoom,
              });
            }
          }
        });

        callParticipantsList?.joined.forEach((participantId) => {
          if (participantId !== userId) {
            if (callStartTime) {
              socketRef.current.emit("save-call-message", {
                senderId: userId,
                receiverId: participantId,
                callType: isVideoCalling ? "video" : "voice",
                status: "ended",
                duration: finalDuration,
                timestamp: new Date(),
                joined: no_of_callUser,
                roomId: callRoom,
              });
            }
          }
        });
      }
    }
  }

    // Reset call-related states
    setCallStartTime(null);
    setCallDuration(null);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Clean up peer connections
    if (peersRef.current) {
      Object.entries(peersRef.current).forEach(([peerId, peer]) => {
        if (peer && typeof peer.destroy === "function") {
          peer.destroy();
          delete peersRef.current[peerId];
        }
      });
    }

    // Clean up video refs
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Reset all call states
    dispatch(setIsVideoCalling(false));
    dispatch(setIsVoiceCalling(false));
    dispatch(setIncomingCall(null));
    dispatch(setIsCameraOn(false));
    dispatch(setIsMicrophoneOn(false));
    setCallDuration(null);
    setCallStartTime(null);
    setPeerEmail(null);
    dispatch(setParticipants([]));
    dispatch(setRemoteStreams(new Map()));
  };

  const rejectCall = (type, userId, groupId) => {
    if (!incomingCall) return;
    // Save missed call message

    if (groupId) {
      socketRef.current.emit("save-call-message", {
        senderId: userId,
        receiverId: groupId,
        callType: type,
        status: "missed",
        timestamp: new Date(),
      });
    } else {
      socketRef.current.emit("save-call-message", {
        senderId: incomingCall.fromEmail,
        receiverId: userId,
        callType: type,
        status: "missed",
        timestamp: new Date(),
      });
    }
    if (socketRef.current) {
      socketRef.current.emit("end-call", {
        to: incomingCall.fromEmail,
        from: userId,
        duration: null,
      });
    }
    dispatch(setIsVoiceCalling(false));
    dispatch(setIsVideoCalling(false));
    dispatch(setIncomingCall(null));
  };

  // ==================group message=============================
  // Send group message
  const sendGroupMessage = (groupId, message) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error("Socket not connected"));
        return;
      }

      const messageData = {
        senderId: userId,
        groupId,
        content: message,
      };

      console.log("Sending group message:", messageData);

      socketRef.current.emit("group-message", messageData);

      // Wait for message status (if needed)
      resolve();
    });
  };

  // ===========================message reaction=============================
  const addMessageReaction = (message, emoji) => {
    console.log("addMessageReaction", message, emoji);
    if (!socketRef.current?.connected) return;
    socketRef.current.emit("message-reaction", {
      messageId: message._id,
      userId,
      emoji,
    });
    if (message.receiver === userId) {
      dispatch(getAllMessages({ selectedId: message.sender }));
    } else {
      dispatch(getAllMessages({ selectedId: message.receiver }));
    }
  };

  // ===========================cleanup Connection=============================

  const cleanupConnection = () => {
    // Safely cleanup stream
    if (streamRef?.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Safely cleanup peer connections
    if (peerRef?.current) {
      Object.values(peerRef.current).forEach((peer) => {
        if (peer && typeof peer.destroy === "function") {
          peer.destroy();
        }
      });
      peerRef.current = {};
    }

    // Safely cleanup video refs
    if (localVideoRef?.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef?.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Reset states
    dispatch(setIsSharing(false));
    dispatch(setIsReceiving(false));
    setPeerEmail("");
    setError("");
    dispatch(setIsVideoCalling(false));
    dispatch(setIsVoiceCalling(false));
    dispatch(setIncomingCall(null));
    dispatch(setIsCameraOn(false));
    dispatch(setIsMicrophoneOn(false));
    dispatch(setIncomingShare(null));
    dispatch(setRemoteStreams(new Map()));
    dispatch(setParticipants([]));
    dispatch(setUserIncall(null));
  };

  useEffect(() => {
    if (!socketRef.current) return;

    // Handle group updates
    const handleGroupUpdate = (data) => {
      console.log("Group update received:", data);
      // dispatch(getAllGroups());
      dispatch(getAllMessageUsers());
    };
    socketRef.current.on("group-updated", handleGroupUpdate);
    return () => {
      if (socketRef.current) {
        socketRef.current.off("group-updated", handleGroupUpdate);
      }
    };
  }, [socketRef.current]);

  // Add new socket event handlers
  const forwardMessage = (receiverId, message) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error("Socket not connected"));
        return;
      }

      const messageData = {
        senderId: userId,
        receiverId,
        content: message.content,
        forwardedFrom: message.sender,
      };
      console.log("messageDatabbbbbbbb", messageData);

      socketRef.current.emit("forward-message", messageData);
      resolve();
    });
  };

  useEffect(() => {
    if (!socketRef.current) return;

    // Add camera status change listener
    socketRef.current.on(
      "camera-status-change",
      ({ userId: remoteUserId, isCameraOn: remoteCameraStatus }) => {
        console.log(
          `[Camera Status] Received update: User ${remoteUserId} camera is now ${remoteCameraStatus ? "ON" : "OFF"
          }`
        );
        dispatch(setCameraStatus({
          ...cameraStatus,
          [remoteUserId]: remoteCameraStatus,
        }));
      }
    );

    return () => {
      if (socketRef.current) {
        socketRef.current.off("camera-status-change");
      }
    };
  }, [socketRef.current]);

  useEffect(() => {
    // Add beforeunload event listener to handle page refresh/close
    const handleBeforeUnload = () => {
      if (isVideoCalling || isVoiceCalling) {
        // Clean up connections before page unload
        cleanupConnection();

        // Notify other participants about disconnection
        if (socketRef.current?.connected) {
          const callusers = Array.from(remoteStreams.keys());
          const no_of_callUser = sessionStorage.getItem("callUser");

          if (groupCall) {
            Array.from(callParticipants).forEach((participantId) => {
              if (participantId !== userId) {
                socketRef.current.emit("participant-left", {
                  leavingUser: userId,
                  to: participantId,
                  duration: callStartTime
                    ? Math.floor((new Date() - callStartTime) / 1000)
                    : 0,
                });
              }
            });
          } else {
            Array.from(callParticipants).forEach((participantId) => {
              if (participantId !== userId) {
                socketRef.current.emit("end-call", {
                  to: participantId,
                  from: userId,
                  duration: callStartTime
                    ? Math.floor((new Date() - callStartTime) / 1000)
                    : 0,
                });
              }
            });
          }
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [
    isVideoCalling,
    isVoiceCalling,
    callParticipants,
    groupCall,
    userId,
    callStartTime,
  ]);

  // Add error handling for peer connections
  const handlePeerError = (err, peerId) => {
    console.error(`Peer connection error with ${peerId}:`, err);

    // If error is due to user-initiated abort (page refresh/close)
    if (
      err.name === "OperationError" &&
      err.message.includes("User-Initiated Abort")
    ) {
      // Clean up the specific peer connection
      if (peersRef.current[peerId]) {
        peersRef.current[peerId].destroy();
        delete peersRef.current[peerId];
      }

      // Remove from remote streams
      dispatch(setRemoteStreams(
        new Map(remoteStreams).delete(peerId)
      ));

      dispatch(removeParticipant(peerId))


      // Remove from call participants
      const newParticipants = new Set(callParticipants);
      newParticipants.delete(peerId);
      dispatch(setCallParticipants(newParticipants));

      // Notify other participants about the disconnection
      if (socketRef.current?.connected) {
        socketRef.current.emit("participant-left", {
          leavingUser: peerId,
          to: Array.from(callParticipants).filter(
            (id) => id !== peerId && id !== userId
          ),
          duration: callStartTime
            ? Math.floor((new Date() - callStartTime) / 1000)
            : 0,
        });
      }
    }
  };

  // Modify the peer creation in startVideoCall and acceptVideoCall
  const createPeer = (isInitiator, stream, targetId) => {
    const peer = new Peer({
      initiator: isInitiator,
      trickle: false,
      stream,
    });

    peer.on("error", (err) => handlePeerError(err, targetId));

    return peer;
  };


  // ====================type================

  const handleTypingStatus = (data) => {
    if (data.isTyping) {
      dispatch(setTypingUsers([...new Set([...typingUsers, data.userId])]));
      setTimeout(() => {
        dispatch(setTypingUsers([...new Set(typingUsers.filter(id => id !== data.userId))]));
      }, 5000);
    }
  };
  useEffect(() => {
    if (!isConnected) return;

    socketRef.current.on("user-typing", handleTypingStatus);
    return () => {
      if (socketRef.current) {
        socketRef.current.off("user-typing", handleTypingStatus); // Check if socket is not null
      }
    };
  }, [isConnected]);



const memoizedSendPrivateMessage = useCallback(sendPrivateMessage, [userId, socketRef]);
const memoizedCleanupConnection = useCallback(cleanupConnection, [dispatch]);
const memoizedStartSharing = useCallback(startSharing, [userId, socketRef, dispatch]);
const memoizedStartCall = useCallback(startCall, [userId, socketRef, dispatch, hasWebcam, hasMicrophone]);
const memoizedAcceptCall = useCallback(acceptCall, [userId, socketRef, dispatch, hasWebcam, hasMicrophone, incomingCall]);
const memoizedEndCall = useCallback(endCall, [userId, socketRef, dispatch, groupCall, callParticipantsList, callStartTime]);
const memoizedToggleCamera = useCallback(toggleCamera, [streamRef, isCameraOn, userId, socketRef, dispatch]);
const memoizedToggleMicrophone = useCallback(toggleMicrophone, [streamRef, dispatch]);
const memoizedMarkMessageAsRead = useCallback(markMessageAsRead, [userId, socketRef, dispatch]);
const memoizedRejectCall = useCallback(rejectCall, [userId, socketRef, dispatch, incomingCall]);
const memoizedAcceptScreenShare = useCallback(acceptScreenShare, [incomingShare, dispatch, userId, socketRef]);
const memoizedInviteToCall = useCallback(inviteToCall, [userId, socketRef, dispatch, callParticipants, isVideoCalling]);
const memoizedForwardMessage = useCallback(forwardMessage, [userId, socketRef]);
const memoizedAddMessageReaction = useCallback(addMessageReaction, [userId, socketRef, dispatch]);
const memoizedSubscribeToMessages = useCallback(subscribeToMessages, [socketRef]);
const memoizedSendTypingStatus = useCallback(sendTypingStatus, [userId, socketRef]);

// Use the memoized functions in useMemo
const value = useMemo(() => ({
  socket: socketRef.current,
  sendPrivateMessage: memoizedSendPrivateMessage,
  cleanupConnection: memoizedCleanupConnection,
  startSharing: memoizedStartSharing,
  startCall: memoizedStartCall,
  acceptCall: memoizedAcceptCall,
  endCall: memoizedEndCall,
  toggleCamera: memoizedToggleCamera,
  toggleMicrophone: memoizedToggleMicrophone,
  markMessageAsRead: memoizedMarkMessageAsRead,
  rejectCall: memoizedRejectCall,
  acceptScreenShare: memoizedAcceptScreenShare,
  inviteToCall: memoizedInviteToCall,
  forwardMessage: memoizedForwardMessage,
  addMessageReaction: memoizedAddMessageReaction,
  subscribeToMessages: memoizedSubscribeToMessages,
  sendTypingStatus: memoizedSendTypingStatus
}), [
  userId,
  socketRef,
  dispatch,
  hasWebcam,
  hasMicrophone,
  incomingCall,
  groupCall,
  callParticipantsList,
  callStartTime,
  streamRef,
  isCameraOn,
  incomingShare,
  callParticipants,
  isVideoCalling,
  memoizedSendPrivateMessage,
  memoizedCleanupConnection,
  memoizedStartSharing,
  memoizedStartCall,
  memoizedAcceptCall,
  memoizedEndCall,
  memoizedToggleCamera,
  memoizedToggleMicrophone,
  memoizedMarkMessageAsRead,
  memoizedRejectCall,
  memoizedAcceptScreenShare,
  memoizedInviteToCall,
  memoizedForwardMessage,
  memoizedAddMessageReaction,
  memoizedSubscribeToMessages,
  memoizedSendTypingStatus
]);

  // const value = {
  //   socket: socketRef.current,
  //   isConnected,
  //   onlineUsers,
  //   sendPrivateMessage,
  //   isVideoCalling,
  //   incomingCall,
  //   setIncomingCall,
  //   cleanupConnection,
  //   peerEmail,
  //   setPeerEmail,
  //   hasWebcam,
  //   hasMicrophone,
  //   isCameraOn,
  //   startSharing,
  //   startCall,
  //   acceptCall,
  //   endCall,
  //   isSharing,
  //   setIsSharing,
  //   isReceiving,
  //   setIsReceiving,
  //   toggleCamera,
  //   toggleMicrophone,
  //   markMessageAsRead,
  //   rejectCall,
  //   incomingShare,
  //   setIncomingShare,
  //   acceptScreenShare,
  //   isVoiceCalling,
  //   callAccept,
  //   remoteStreams,
  //   inviteToCall,
  //   callParticipants,
  //   isMicrophoneOn,
  //   voiceCallData,
  //   forwardMessage,
  //   addMessageReaction,
  //   cameraStatus,
  //   startCall,
  //   acceptCall,
  //   callParticipantsList,
  //   subscribeToMessages,
  //   sendTypingStatus
  // };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
