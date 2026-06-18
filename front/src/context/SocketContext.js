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
import { getAllMessages, getAllMessageUsers } from "../redux/slice/user.slice";
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
  setCameraStatus,
  setCallParticipants,
  setTypingUsers,
  setUserIncall,
  setSelectedChatModule,
  setCallChatList,
  setshareRoomId,
  setShowScreenSource,
  setIsHost,
  setIsControlling,
  setViewerControlling,
  setMicStatus,
  updateMessageReadStatus,
  setSelectedChat,
  removeCallParticipants
} from "../redux/slice/manageState.slice";
import { BASE_URL } from "../utils/baseUrl";
import { useNavigate } from "react-router-dom";
import { registerWebPushToken } from "../utils/pushNotifications";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

const SOCKET_SERVER_URL = BASE_URL.replace("/api", "");
const SocketContext = createContext();

// Initialize FingerprintJS
const fpPromise = FingerprintJS.load();

// Function to get device ID

const getDeviceId = async () => {
  let deviceId = localStorage.getItem("deviceId");

  if (!deviceId) {
    const fp = await fpPromise;
    const result = await fp.get();
    deviceId = result.visitorId;
    localStorage.setItem("deviceId", deviceId);
  }
  return deviceId;
};

const decryptMessage = (encryptedText) => {
  const key = "chat";
  const base64 = encryptedText.replace(/^data:/, "");
  const decodedText = atob(base64);
  let result = "";
  for (let i = 0; i < decodedText.length; i++) {
    result += String.fromCharCode(
      decodedText.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return result;
};

const getDeviceType = () => {
  const userAgent = navigator.userAgent;
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent
    );
  const isTablet = /iPad|Android(?=.*\bMobile\b)/i.test(userAgent);

  if (isMobile) return "mobile";
  if (isTablet) return "tablet";
  return "desktop";
};



export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const peersRef = useRef({});
  const pendingSignals = useRef({});
  const [peerEmail, setPeerEmail] = useState("");
  const [error, setError] = useState(null);
  const [hasWebcam, setHasWebcam] = useState(false);
  const [hasMicrophone, setHasMicrophone] = useState(false);
  const streamRef = useRef(null);
  const [callAccept, setCallAccept] = useState(false);
  const [callStartTime, setCallStartTime] = useState(null);
  const [callDuration, setCallDuration] = useState(null);
  const callTimerRef = useRef(null);
  const [groupCall, setGroupCall] = useState(null);
  const [callFrom, setCallFrom] = useState("");
  const [allCallUsers, setAllCallUsers] = useState(new Map());
  const [callRoom, setCallRoom] = useState(null);
  const [callStatus, setCallStatus] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const userId =
    sessionStorage.getItem("userId") || localStorage.getItem("ChatuserId");
  const navigate = useNavigate();

  const dispatch = useDispatch();
  const {
    remoteStreams,
    callParticipantsList,
    isConnected,
    incomingCall,
    isCameraOn,
    isVideoCalling,
    isVoiceCalling,
    incomingShare,
    callParticipants,
    isMicrophoneOn,
    cameraStatus,
    micStatus,
    typingUsers,
    selectedChat,
    screenSource,
    showScreenSource,
    participants
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

  const processPendingSignals = (peerId) => {
    const queue = pendingSignals.current[peerId];
    const peer = peersRef.current[peerId];
    if (!queue || !peer) return;
    while (queue.length) {
      const sig = queue.shift();
      try {
        // ignore if already stable and sig is answer
        if (peer._pc && peer._pc.signalingState === "stable" && sig.type === "answer") {
          console.warn("Ignoring queued answer because peer already stable:", peerId);
          continue;
        }
        peer.signal(sig);
      } catch (err) {
        console.warn("Error applying queued signal for", peerId, err);
      }
    }
  };

  

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on("group-message-read", (data) => {
        dispatch(updateMessageReadStatus(data));
        dispatch(getAllMessageUsers());
      });
    }
  }, [socketRef.current]);

  // Socket connection effect
  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const token =
      sessionStorage.getItem("token") || localStorage.getItem("ChatToken");

    const initializeSocket = async () => {
      const deviceId = await getDeviceId();

      if (token) {
        socketRef.current = io(SOCKET_SERVER_URL, {
          transports: ["websocket", "polling"],
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 20000,
          forceNew: true,
          auth: {
            token,
            deviceId,
            deviceType: getDeviceType(), // Add this
          },
        });

        socketRef.current.on("connect", () => {
          console.log("Socket connection established");

          dispatch(setIsConnected());
          socketRef.current.emit("user-login", userId);
          // Join device room
          socketRef.current.emit("join-device-room", deviceId);
          registerWebPushToken({ deviceId }).catch((error) => console.warn("Web push registration skipped:", error.message));
        });

        socketRef.current.on("connect_error", (error) => {
          console.error("Socket connection error:", error);
          dispatch(setIsConnected(false));
          dispatch(setOnlineUsers([]));
        });

        socketRef.current.on("disconnect", () => {
          dispatch(setIsConnected(false));
          dispatch(setOnlineUsers([]));
        });

        socketRef.current.on("force-logout", (data) => {
          alert("Force logout received");
          // Clean up socket connection
          if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
          }
          // Clear all storage
          sessionStorage.clear();
          localStorage.removeItem("deviceId");
          // Redirect to login
          navigate("/login");
        });

        socketRef.current.on("user-status-changed", (onlineUserIds) => {
          dispatch(setOnlineUsers(onlineUserIds));
        });

        socketRef.current.on("reconnect", () => {
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
  }, [userId, navigate]);

  // Add call dismissal handler
  useEffect(() => {
    if (!socketRef.current) return;

    // Handle call dismissal
    socketRef.current.on("call-dismissed", (data) => {
      dispatch(setIncomingCall(null));
      dispatch(setIsVideoCalling(false));
      dispatch(setIsVoiceCalling(false));
    });

    // Handle screen share dismissal
    socketRef.current.on("screen-share-dismissed", (data) => {
      dispatch(setIncomingShare(null));
      dispatch(setIsSharing(false));
      dispatch(setIsReceiving(false));
    });

    // Handle message read updates from other devices
    socketRef.current.on("message-read-update", (data) => {
      dispatch(updateMessageReadStatus(data));
      dispatch(getAllMessageUsers());
    });

    // Handle group message read updates from other devices
    socketRef.current.on("group-message-read-update", (data) => {
      dispatch(updateMessageReadStatus(data));
      dispatch(getAllMessageUsers());
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off("call-dismissed");
        socketRef.current.off("screen-share-dismissed");
        socketRef.current.off("message-read-update");
        socketRef.current.off("group-message-read-update");
      }
    };
  }, [socketRef.current]);

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
        const hasEmoji = (str) => {
          const emojiRegex =
            /[\p{Emoji}\u{1F3FB}-\u{1F3FF}\u{1F9B0}-\u{1F9B3}]/gu;
          return emojiRegex.test(str);
        };

        if (typeof content === "string" && hasEmoji(content)) {
          content = content; // Keep emoji as is without encryption
        }

        if (!content.startsWith("data:") && !hasEmoji(content)) {
          const key = "chat";
          let result = "";
          for (let i = 0; i < content.length; i++) {
            result += String.fromCharCode(
              content.charCodeAt(i) ^ key.charCodeAt(i % key.length)
            );
          }
          content = "data:" + btoa(result);
        }

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
        socketRef.current.emit("camera-status-change", {
          userId,
          isCameraOn: newStatus,
        });
      }
    }
  };

  const toggleMicrophone = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("mic-status-change", {
        userId,
        isMicOn: !isMicrophoneOn,
        roomId: callRoom,
      });
    }
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach((track) => (track.enabled = !track.enabled));
      dispatch(setIsMicrophoneOn());
    }
  };

  const sendTypingStatus = (receiverId, isTyping) => {
    if (!socketRef.current?.connected) return;

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
      callback({ type: "status", ...data });
    };

    const messageReadHandler = (data) => {
      callback({ type: "read", ...data });
    };

    const messageDeletedHandler = (messageId) => {
      callback({ type: "delete", messageId });
    };

    const messageUpdatedHandler = (message) => {
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
      // Decrypt the message content if it's encrypted
      let content = message.content.content;
      const hasEmoji = (str) => {
        const emojiRegex =
          /[\p{Emoji}\u{1F3FB}-\u{1F3FF}\u{1F9B0}-\u{1F9B3}]/gu;
        return emojiRegex.test(str);
      };

      if (typeof content === "string" && hasEmoji(content)) {
        content = content; // Keep emoji as is without encryption
      }

      if (!content.startsWith("data:") && !hasEmoji(content)) {
        const key = "chat";
        let result = "";
        for (let i = 0; i < content.length; i++) {
          result += String.fromCharCode(
            content.charCodeAt(i) ^ key.charCodeAt(i % key.length)
          );
        }
        content = "data:" + btoa(result);
      }
      message.content.content = content;
      callback(message);
    };

    const reactionHandler = (data) => {
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
  useEffect(() => {
    if (screenSource) {
      startSharing(selectedChat);
    }
  }, [screenSource]);

  const startSharing = async (selectedChat) => {
    if (!selectedChat) {
      setError("No chat selected");
      return;
    }
    const roomId = generateCallRoomId();
    dispatch(setshareRoomId(roomId));
    setCallRoom(roomId);

    try {
      let stream;
      // Check if running in Electron
      if (window.electron) {
        if (!showScreenSource) {
          await dispatch(setShowScreenSource(true));
        }

        if (screenSource) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: false,
              video: {
                mandatory: {
                  chromeMediaSource: "desktop",
                  chromeMediaSourceId: screenSource.id,
                },
              },
            });
          } catch (err) {
            alert("Error: " + err.message);
          }
        } else {
          return;
        }
      } else {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
      }
      streamRef.current = stream;

      // Show local stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      dispatch(setIsHost(true));
      dispatch(setIsReceiving(true));
      dispatch(updateParticipant({ userId, stream }));

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
                  roomId: roomId,
                });
              });

              peer.on("error", (err) => {
                console.error("Peer error:", err);
                setError(
                  `Connection error with member ${memberId}: ${err.message}`
                );
              });

              peer.on("connect", () => {});

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
            roomId: roomId,
          });
        });

        peer.on("error", (err) => {
          console.error("Peer error:", err);
          setError("Connection error occurred: " + err.message);
          cleanupConnection();
        });

        peer.on("connect", () => {});

        peerRef.current = { [selectedChat._id]: peer };
      }

      dispatch(setIsSharing(true));

      // Handle stream end
      stream.getVideoTracks()[0].onended = () => {
        cleanupConnection();
      };

      dispatch(setShowScreenSource(false));

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

  const acceptScreenShare = () => {
    if (!incomingShare) return;
    dispatch(setIsHost(false));
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
        socketRef.current.emit("share-accept", {
          signal,
          fromEmail: incomingShare.fromEmail,
          toEmail: userId,
          groupId: incomingShare?.groupId,
          isGroup: incomingShare?.isGroup,
          roomId: incomingShare?.roomId,
        });
      });

      peer.on("stream", (stream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
          remoteVideoRef.current
            .play()
            .catch((e) => console.error("Error playing:", e));
        }
        console.log(stream,"strestreamstreamam");
        dispatch(
          setRemoteStreams(
            new Map(remoteStreams).set(incomingShare.fromEmail, stream)
          )
        );
        dispatch(
          updateParticipant({ userId: incomingShare.fromEmail, stream })
        );
      });

      peer.on("error", (err) => {
        console.error("Peer error:", err);
        setError("Connection error occurred");
        cleanupConnection();
      });

      // Signal the peer with the initial offer
      if (incomingShare.signal) {
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
    socketRef.current.on("call-requested", async (data) => {
      dispatch(
        setIncomingCall({
          fromEmail: data.fromEmail,
          signal: data.signal,
          type: data.type,
          participants: data.participants,
          isGroupCall: data.isGroupCall,
          groupId: data.groupId || null,
          roomId: data.roomId,
        })
      );
      setCallRoom(data.roomId);
      setCallStatus("ringing");
      if(data.groupId){
        setGroupCall(data.groupId)
      }
    });

    socketRef.current.on("call-invited", async (data) => {
      console.log("call-invited", data);

      dispatch(
        setIncomingCall({
          fromEmail: data.fromEmail,
          signal: data.signal,
          type: data.type,
          participants: data.participants || [],
          isGroupCall: data.isGroupCall || false,
          roomId: data.roomId,
          groupId:data.groupId
        })
      );
      setCallRoom(data.roomId);
      if(data.isGroupCall){
        setGroupCall(data.groupId)
      }
      setCallStatus("ringing");
    });

    socketRef.current.on(
      "participant-joined",
      async ({ newParticipantId, from, participants, roomId }) => {
        if (newParticipantId !== userId && streamRef.current) {
          // ensure we do NOT create a direct `new Peer(...)` here — use createPeer
          if (!peersRef.current[newParticipantId]) {
            const peer = createPeer(true, streamRef.current, newParticipantId);
    
            peer.on("signal", (signal) => {
              socketRef.current.emit("call-signal", {
                signal,
                to: newParticipantId,
                from: userId,
                roomId,
              });
            });
    
            peer.on("stream", (stream) => {
              dispatch(setRemoteStreams(new Map(remoteStreams).set(newParticipantId, stream)));
              dispatch(updateParticipant({ userId: newParticipantId, stream }));
              setAllCallUsers((prev) => new Map(prev).set(newParticipantId, stream));
            });
    
            peersRef.current[newParticipantId] = peer;
    
            // process any queued signals for this participant
            processPendingSignals(newParticipantId);
          }
    
          dispatch(setCallParticipants(new Set([...callParticipants, newParticipantId])));
        }
      }
    );
    

    socketRef.current.on("call-signal", ({ signal, from, roomId }) => {
      // if peer does not exist yet, queue the signal
      if (!peersRef.current[from]) {
        pendingSignals.current[from] = pendingSignals.current[from] || [];
        pendingSignals.current[from].push(signal);
        console.warn("Queued signal for future peer:", from);
        return;
      }
    
      const peer = peersRef.current[from];
    
      // Safe-guard: check internal pc state (if exists) and peer flag
      const signalingState = peer._pc ? peer._pc.signalingState : null;
      if (signalingState === "stable" && signal && signal.type === "answer") {
        console.warn("Ignoring answer for stable peer:", from);
        return;
      }
    
      try {
        peer.signal(signal);
      } catch (err) {
        // ignore invalid state errors and log them
        console.warn("Ignored signal due to error:", from, err);
      }
    });

    socketRef.current.on(
      "participant-lefted",
      ({ leavingUser, duration, roomId }) => {
        // Remove the leaving participant's remote stream
        dispatch(
          setRemoteStreams(() => {
            const newStreams = new Map(remoteStreams);
            newStreams.delete(leavingUser);
            return newStreams;
          })
        );
        dispatch(removeParticipant(leavingUser));
        dispatch(removeCallParticipants(leavingUser));


        // Clean up peer connection for the leaving participant
        if (peersRef.current[leavingUser]) {
          peersRef.current[leavingUser].destroy();
          delete peersRef.current[leavingUser];
        }
      }
    );

    // Handle when call is accepted
    socketRef.current.on("call-accepted", ({ signal, fromEmail, roomId }) => {
      setCallAccept(true);
      setCallStatus("connected");
    
      // ensure peer exists; if not create and then process queued signals
      let peer = peersRef.current[fromEmail];
      if (!peer) {
        peer = createPeer(false, streamRef.current, fromEmail);
        peersRef.current[fromEmail] = peer;
      }
    
      // If peer already stable and incoming signal is an answer -> ignore
      if (peer._pc && peer._pc.signalingState === "stable" && signal && signal.type === "answer") {
        console.warn("Ignoring answer because peer already stable:", fromEmail);
        return;
      }
    
      try {
        peer.signal(signal);
        // mark applied answer to avoid duplicates
        if (signal && signal.type === "answer") peer.hasAppliedRemoteAnswer = true;
      } catch (err) {
        console.warn("Error applying call-accepted signal for", fromEmail, err);
        // if error occurred because peer hadn't been fully created, queue it
        pendingSignals.current[fromEmail] = pendingSignals.current[fromEmail] || [];
        pendingSignals.current[fromEmail].push(signal);
      }
    
      // process any queued signals now
      processPendingSignals(fromEmail);
    });

    socketRef.current.on("call-ended", ({ to, from, duration, roomId }) => {
      if (!duration) {
        alert("User is Busy so Rejected  call");
      }
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
      dispatch(setSelectedChatModule(true));
    });

    socketRef.current.on("screen-share-request", async (data) => {
      dispatch(setIncomingShare(data));
      setCallRoom(data.roomId);
      dispatch(setshareRoomId(data.roomId));
    });

    // Handle when share is accepted
    socketRef.current.on("share-accepted", async ({ signal, fromEmail }) => {
      // const peer = peersRef.current[fromEmail];
      // if (peer && peer._pc.signalingState !== "stable") {
      //   try {
      //     peer.signal(signal);
      //   } catch (err) {
      //     console.warn("Ignored duplicate signal for", fromEmail, err);
      //   }
      // } else {
      //   console.warn("Peer is already stable, ignoring signal from", fromEmail);
      // }
      if (peerRef.current && peerRef.current[fromEmail]) {
        peerRef.current[fromEmail].signal(signal);
      } else {
        console.error("No peer connection found for:", fromEmail);
      }
    });

    socketRef.current.on("call:update-participant-list", (call) => {
      dispatch(setCallParticipantsList(call));
    });

    socketRef.current.on("user-in-call", (data) => {
      if (!selectedChat?.members) {
        dispatch(setUserIncall("is onther Call Runing"));
      }
    });

    let isDragging = false;

    socketRef.current.on("control-event", async ({ type, payload }) => {
      try {
        if (window.electron) {
          switch (type) {
            case "mousemove":
              await window.electron.remoteControl.moveMouse(
                payload.x,
                payload.y
              );
              break;

            case "click":
              await window.electron.remoteControl.click(payload.x, payload.y);
              break;

            case "rightClick":
              await window.electron.remoteControl.moveMouse(
                payload.x,
                payload.y
              );
              await window.electron.remoteControl.rightClick();
              break;

            case "doubleClick":
              await window.electron.remoteControl.moveMouse(
                payload.x,
                payload.y
              );
              await window.electron.remoteControl.doubleClick();
              break;

            case "keydown":
              await window.electron.remoteControl.pressKey(
                payload.key,
                payload.ctrlKey
              );
              break;

            case "scroll":
              await window.electron.remoteControl.moveMouse(
                payload.x,
                payload.y
              );
              await window.electron.remoteControl.scroll(payload.amount);
              break;

            case "dragStart":
              try {
                const { x, y } = payload;
                isDragging = true;
                await window.electron.remoteControl.moveMouse(x, y);
                await window.electron.remoteControl.pressButton();
              } catch (err) {
                console.error("Drag start failed:", err);
              }
              break;

            case "dragMove":
              if (!isDragging) break;
              try {
                const { x, y } = payload;
                await window.electron.remoteControl.moveMouse(x, y);
              } catch (err) {
                console.error("Drag move failed:", err);
              }
              break;

            case "dragEnd":
              if (!isDragging) break;
              try {
                const { x, y } = payload;
                await window.electron.remoteControl.moveMouse(x, y);
                await window.electron.remoteControl.releaseButton();
                isDragging = false;
              } catch (err) {
                console.error("Drag end failed:", err);
              }
              break;

            default:
          }
        }
      } catch (err) {
        console.error("Control error:", err);
      }
    });

    return () => {
      cleanupConnection();
      if (socketRef.current) {
        socketRef.current.off("call-requested");
        socketRef.current.off("call-accepted");
        socketRef.current.off("call-signal");
        socketRef.current.off("screen-share-request");
        socketRef.current.off("share-accepted");
        socketRef.current.off("share-signal");
        socketRef.current.off("call-ended");
        socketRef.current.off("call-invited");
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
    setGroupCall(isGroupCall ? receiverId : null);
    const calltype = type == "video" ? "video" : "voice";

    try {
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: calltype == "video" ? hasWebcam : false,
          audio: hasMicrophone,
        });
        if (calltype == "video") {
          dispatch(setIsCameraOn(true));
        }
        dispatch(setIsMicrophoneOn(true));
        streamRef.current = stream;

        dispatch(updateParticipant({ userId, stream }));
      } catch (err) {
        console.error("Could not get media devices:", err);
        setError(
          "Failed to access camera/microphone. Please check your device permissions."
        );
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
            dispatch(
              setRemoteStreams(new Map(remoteStreams).set(member, remoteStream))
            );
            dispatch(
              updateParticipant({ userId: member, stream: remoteStream })
            );
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
          dispatch(
            setRemoteStreams(
              new Map(remoteStreams).set(receiverId, remoteStream)
            )
          );
          dispatch(
            updateParticipant({ userId: receiverId, stream: remoteStream })
          );
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

      dispatch(setSelectedChatModule(false));
      dispatch(setCallChatList(false));
    } catch (err) {
      console.error("Error starting call:", err);
      endCall();
    }
  };

  const inviteToCall = async (newParticipantId) => {
    // console.log(callParticipants,"callParticipantscallParticipants");
    
    setCallFrom(userId);

    try {
      const newPeer = createPeer(true, streamRef.current, newParticipantId);

      newPeer.on("signal", (signal) => {
        socketRef.current.emit("call-invite", {
          fromEmail: userId,
          toEmail: newParticipantId,
          signal,
          type: isVideoCalling ? "video" : "voice",
          participants: Array.from(callParticipants),
          roomId: callRoom,
          isGroupCall: true,
        });
      });

      newPeer.on("stream", (remoteStream) => {
        const validRemoteStreams =
  remoteStreams instanceof Map
    ? remoteStreams
    : new Map();
    dispatch(
      setRemoteStreams(
        new Map(validRemoteStreams).set(newParticipantId, remoteStream)
      )
    );
        dispatch(
          updateParticipant({ userId: newParticipantId, stream: remoteStream })
        );
        setAllCallUsers((prev) =>
          new Map(prev).set(newParticipantId, remoteStream)
        );
      });

      peersRef.current[newParticipantId] = newPeer;

      // console.log(participants,"participants");
      

      // if (Array.isArray(participants)) {
      //   const participantIds = participants.map((p) => Array.isArray(p) ? p[0] : p);
      //   console.log(participantIds,"participantIdsparticipantIds");
        
      //   const updatedParticipants = new Set(participantIds);
      //   console.log(updatedParticipants,"updatedParticipantsupdatedParticipants");
        
      //   dispatch(setCallParticipants(updatedParticipants));
      // }


      // Notify all existing participants about the new member
      Array.from(callParticipants).forEach((participantId) => {
        if (participantId !== userId) {
          socketRef.current.emit("participant-join", {
            newParticipantId,
            to: participantId,
            from: userId,
            participants: Array.from(callParticipants),
          });
        }
      });

      dispatch(
        setCallParticipants(new Set([...callParticipants, newParticipantId]))
      );
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
      setGroupCall(incomingCall?.isGroupCall ? incomingCall?.groupId || true : null);
      setCallFrom(incomingCall?.fromEmail);
      setCallStatus("accepted");
      setCallAccept(true);

      let stream = null;
      try {
        // Try to get media stream but don't block if devices aren't available
        stream = await navigator.mediaDevices.getUserMedia({
          video: incomingCall.type == "video" ? hasWebcam : false,
          audio: hasMicrophone,
        });
      } catch (err) {
        console.warn("Could not get media devices:", err);
      }

      if (stream) {
        if (incomingCall.type == "video") {
          dispatch(setIsCameraOn(true));
        }
        dispatch(setIsMicrophoneOn(true));
        streamRef.current = stream;

        dispatch(updateParticipant({ userId, stream }));
      }

      // Create peer for the caller
      const peer = createPeer(false, stream, incomingCall.fromEmail);

      peer.on("signal", (signal) => {
        setTimeout(() => {
          socketRef.current.emit("call-accept", {
            signal,
            fromEmail: incomingCall.fromEmail,
            toEmail: userId,
            participants: incomingCall.participants,
            roomId: callRoom,
          });
        }, Math.random() * 500); // 0–500ms delay
      });

      peer.on("stream", (stream) => {
        dispatch(
          setRemoteStreams(
            new Map(remoteStreams).set(incomingCall.fromEmail, stream)
          )
        );
        dispatch(
          updateParticipant({ userId: incomingCall.fromEmail, stream: stream })
        );
        setAllCallUsers((prev) =>
          new Map(prev).set(incomingCall.fromEmail, stream)
        );
      });

      peer.signal(incomingCall.signal);
      peersRef.current[incomingCall.fromEmail] = peer;

      // Connect with other existing participants
      if (incomingCall.participants) {
        incomingCall.participants.forEach((participantId) => {
          if (participantId === userId || participantId === incomingCall.fromEmail) return;
        
          if (!peersRef.current[participantId]) {
            const participantPeer = createPeer(true, stream, participantId);
        
            participantPeer.on("signal", (signal) => {
              socketRef.current.emit("call-signal", {
                signal,
                to: participantId,
                from: userId,
              });
            });
        
            participantPeer.on("stream", (s) => {
              dispatch(setRemoteStreams(new Map(remoteStreams).set(participantId, s)));
              dispatch(updateParticipant({ userId: participantId, stream: s }));
              setAllCallUsers((prev) => new Map(prev).set(participantId, s));
            });
        
            peersRef.current[participantId] = participantPeer;
            // If any signals were queued for this peer, process them
            processPendingSignals(participantId);
          }
        });
      }

      if (incomingCall.type == "video") {
        dispatch(setIsVideoCalling(true));
      } else {
        dispatch(setIsVoiceCalling(true));
      }
      setCallAccept(true);
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

    if (callAccept) {
      if (groupCall) {
        if (callParticipantsList?.joined?.length > 2) {
          socketRef.current.emit("participant-left", {
            leavingUser: userId,
            duration: finalDuration,
            roomId: callRoom,
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
          socketRef.current.emit("participant-left", {
            leavingUser: userId,
            duration: finalDuration,
            roomId: callRoom,
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
    } else {
      if (socketRef.current && selectedChat) {
        socketRef.current.emit("end-call", {
          to: selectedChat._id,
          from: userId,
          duration: null,
          roomId: callRoom,
        });
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
    dispatch(setSelectedChatModule(true));
    setCallAccept(false);
  };

  const rejectCall = (type, userId, groupId, roomId, isGroupCall) => {
    if (!incomingCall) return;
    // Save missed call message

    console.log(
      type,
      userId,
      groupId,
      roomId,
      isGroupCall,
      "type, userId, groupId, roomId,isGroupCall"
    );

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

    if (socketRef.current && !groupId && !isGroupCall) {
      console.log("end-call");
      socketRef.current.emit("end-call", {
        to: incomingCall.fromEmail,
        from: userId,
        duration: null,
      });
    } else if (isGroupCall) {
      console.log("reject-group-call");

      socketRef.current.emit("reject-group-call", {
        to: incomingCall.fromEmail,
        userId,
        duration: null,
        roomId,
        groupId,
      });
    }

    dispatch(setIsVoiceCalling(false));
    dispatch(setIsVideoCalling(false));
    dispatch(setIncomingCall(null));
    dispatch(setSelectedChatModule(true));
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

      socketRef.current.emit("group-message", messageData);

      // Wait for message status (if needed)
      resolve();
    });
  };

  // ===========================message reaction=============================
  const addMessageReaction = (message, emoji) => {
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

  // Add new function to remove message reaction
  const removeMessageReaction = (message, emoji) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit("remove-message-reaction", {
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
    dispatch(setSelectedChatModule(true));
  };

  useEffect(() => {
    if (!socketRef.current) return;
    // Handle group updates
    const handleGroupUpdate = (data) => {
      dispatch(getAllMessageUsers())
        .then((res) => {
          const groupId = data.groupId;
          if (groupId && res && Array.isArray(res.payload)) {
            const found = res.payload.find((user) => user._id === groupId);
            if (!found) {
              dispatch(setSelectedChat(null));
            }
          }
        })
        .catch((error) => {
          console.error(
            "Failed to update message users on group update:",
            error
          );
        });
    };
    socketRef.current.on("group-updated", handleGroupUpdate);
    return () => {
      if (socketRef.current) {
        socketRef.current.off("group-updated", handleGroupUpdate);
      }
    };
  }, [socketRef.current]);

  // Add new socket event handlers
  // const forwardMessage = (receiverId, message) => {
  //   return new Promise((resolve, reject) => {
  //     if (!socketRef.current?.connected) {
  //       reject(new Error("Socket not connected"));
  //       return;
  //     }

  //     const messageData = {
  //       senderId: userId,
  //       receiverId,
  //       content: message.content,
  //       forwardedFrom: message.sender,
  //     };

  //     socketRef.current.emit("forward-message", messageData);
  //     resolve();
  //   });
  // };
  const forwardMessage = ({
    receiverId,
    groupId,
    message,
    isGroup = false,
  }) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error("Socket not connected"));
        return;
      }

      const payload = {
        senderId: userId,
        content: message.content,
        forwardedFrom: message.sender,
        isGroup,
      };

      if (isGroup) {
        payload.groupId = groupId;
      } else {
        payload.receiverId = receiverId;
      }

      socketRef.current.emit("forward-message", payload);
      resolve();
    });
  };

  useEffect(() => {
    if (!socketRef.current) return;

    // Add camera status change listener
    socketRef.current.on(
      "camera-status-change",
      ({ userId: remoteUserId, isCameraOn: remoteCameraStatus }) => {
        dispatch(
          setCameraStatus({
            ...cameraStatus,
            [remoteUserId]: remoteCameraStatus,
          })
        );
      }
    );
    socketRef.current.on(
      "mic-status-change",
      ({ userId: remoteUserId, isMicOn: remoteMicStatus }) => {
        dispatch(
          setMicStatus({
            ...micStatus,
            [remoteUserId]: remoteMicStatus,
          })
        );
      }
    );
    return () => {
      if (socketRef.current) {
        socketRef.current.off("camera-status-change");
        socketRef.current.off("mic-status-change");
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

          console.log(participants,groupCall,"aaaaaaaaaaaaa");
          

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
      
      if (remoteStreams && remoteStreams.size > 0) {
        dispatch(setRemoteStreams(new Map(remoteStreams).delete(peerId)));
      }

      dispatch(removeParticipant(peerId));
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
  
    // flag to avoid double-answer applying
    peer.hasAppliedRemoteAnswer = false;
  
    // When this peer emits a signal (offer/answer/ICE)
    peer.on("signal", (signal) => {
      // mark when an answer was produced locally
      if (signal && signal.type === "answer") {
        peer.hasAppliedRemoteAnswer = true;
      }
    });
  
    // Optional: fallback stream event hook
    peer.on("stream", (s) => {
      // You already handle remote streams where you create peers,
      // but this is kept for safety/debugging
      console.log(`[createPeer] Stream received from ${targetId}`, s);
    });
  
    // Centralized peer error handler
    peer.on("error", (err) => handlePeerError(err, targetId));
  
    // Process any queued signals that might have arrived before this peer existed
    setTimeout(() => processPendingSignals(targetId), 50);
  
    return peer;
  };

  // ====================type================
  const handleTypingStatus = (data) => {
    if (data.isTyping) {
      dispatch(setTypingUsers([...new Set([...typingUsers, data.userId])]));
      setTimeout(() => {
        dispatch(
          setTypingUsers([
            ...new Set(typingUsers.filter((id) => id !== data.userId)),
          ])
        );
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

  // ====================================Controle========================
  const sendControl = (type, payload, roomId) => {
    socketRef.current.emit("control-event", { roomId, type, payload });
  };

  const requestControl = useCallback(
    (hostId) => {
      if (!socketRef.current?.connected) return;
      socketRef.current.emit("request-control", { hostId });
    },
    [socketRef]
  );

  const grantControl = useCallback(
    (viewerId) => {
      if (!socketRef.current?.connected) return;
      socketRef.current.emit("grant-control", { viewerId });
    },
    [socketRef]
  );

  const revokeControl = useCallback(
    (viewerId) => {
      if (!socketRef.current?.connected) return;
      socketRef.current.emit("revoke-control", { viewerId });
    },
    [socketRef]
  );

  // Update socket event listeners
  useEffect(() => {
    if (!socketRef.current) return;

    const handleControlPermission = (granted) => {
      dispatch(setIsControlling(granted));
      if (granted) {
        alert("You have been granted control");
      } else {
        alert("Control has been revoked");
      }
    };

    const handleControlRequest = ({ viewerId }) => {
      if (window.confirm(`${viewerId} wants to control your screen. Allow?`)) {
        grantControl(viewerId);
      }
    };

    const handleControlRevoked = () => {
      dispatch(setIsControlling(false));
      alert("Control has been revoked by the host");
    };

    const handleControlGranted = ({ viewerId }) => {
      dispatch(setViewerControlling(viewerId));
    };

    const handleControlRevokedForHost = ({ viewerId }) => {
      dispatch(setViewerControlling(null));
    };

    socketRef.current.on("control-permission", handleControlPermission);
    socketRef.current.on("control-request", handleControlRequest);
    socketRef.current.on("control-revoked", handleControlRevoked);
    socketRef.current.on("control-granted", handleControlGranted);
    socketRef.current.on(
      "control-revoked-for-host",
      handleControlRevokedForHost
    );

    return () => {
      if (socketRef.current) {
        socketRef.current.off("control-permission", handleControlPermission);
        socketRef.current.off("control-request", handleControlRequest);
        socketRef.current.off("control-revoked", handleControlRevoked);
        socketRef.current.off("control-granted", handleControlGranted);
        socketRef.current.off(
          "control-revoked-for-host",
          handleControlRevokedForHost
        );
      }
    };
  }, [socketRef.current, grantControl]);

  const memoizedSendPrivateMessage = useCallback(sendPrivateMessage, [
    userId,
    socketRef,
  ]);
  const memoizedsendGroupMessage = useCallback(sendGroupMessage, [
    userId,
    socketRef,
  ]);
  const memoizedCleanupConnection = useCallback(cleanupConnection, [dispatch]);
  const memoizedStartSharing = useCallback(startSharing, [
    userId,
    socketRef,
    dispatch,
  ]);
  const memoizedStartCall = useCallback(startCall, [
    userId,
    socketRef,
    dispatch,
    hasWebcam,
    hasMicrophone,
  ]);
  const memoizedAcceptCall = useCallback(acceptCall, [
    userId,
    socketRef,
    dispatch,
    hasWebcam,
    hasMicrophone,
    incomingCall,
  ]);
  const memoizedEndCall = useCallback(endCall, [
    userId,
    socketRef,
    groupCall,
    callParticipantsList,
    callStartTime,
  ]);
  const memoizedToggleCamera = useCallback(toggleCamera, [
    streamRef,
    isCameraOn,
    userId,
    socketRef,
    dispatch,
  ]);
  const memoizedToggleMicrophone = useCallback(toggleMicrophone, [
    streamRef,
    dispatch,
    callRoom,
    userId,
    isMicrophoneOn,
  ]);
  const memoizedMarkMessageAsRead = useCallback(markMessageAsRead, [
    userId,
    socketRef,
    dispatch,
  ]);
  const memoizedRejectCall = useCallback(rejectCall, [
    userId,
    socketRef,
    dispatch,
    incomingCall,
  ]);
  const memoizedAcceptScreenShare = useCallback(acceptScreenShare, [
    incomingShare,
    dispatch,
    userId,
    socketRef,
  ]);
  const memoizedInviteToCall = useCallback(inviteToCall, [
    userId,
    socketRef,
    dispatch,
    callParticipants,
    isVideoCalling,
  ]);
  const memoizedForwardMessage = useCallback(forwardMessage, [
    userId,
    socketRef,
  ]);
  const memoizedAddMessageReaction = useCallback(addMessageReaction, [
    userId,
    socketRef,
    dispatch,
  ]);
  const memoizedRemoveMessageReaction = useCallback(removeMessageReaction, [
    userId,
    socketRef,
    dispatch,
  ]);
  const memoizedSubscribeToMessages = useCallback(subscribeToMessages, [
    socketRef,
  ]);
  const memoizedSendTypingStatus = useCallback(sendTypingStatus, [
    userId,
    socketRef,
  ]);
  const memoizedsendControls = useCallback(sendControl, [userId, socketRef]);

  // Use the memoized functions in useMemo
  const value = useMemo(
    () => ({
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
      removeMessageReaction: memoizedRemoveMessageReaction,
      subscribeToMessages: memoizedSubscribeToMessages,
      sendTypingStatus: memoizedSendTypingStatus,
      sendControl: memoizedsendControls,
      requestControl,
      grantControl,
      revokeControl,
      sendGroupMessage: memoizedsendGroupMessage,
    }),
    [
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
      memoizedRemoveMessageReaction,
      memoizedSubscribeToMessages,
      memoizedSendTypingStatus,
      memoizedsendControls,
      memoizedsendGroupMessage,
    ]
  );

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
