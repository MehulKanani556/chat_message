import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";
import {
  getAllMessages,
  getAllMessageUsers,
  setOnlineuser,
} from "../redux/slice/user.slice";
import { useDispatch } from "react-redux";

// Simple encryption/decryption functions
const encryptMessage = (text) => {
  const key = "chat";
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return btoa(result); // Convert to base64 for safe transmission
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

const SOCKET_SERVER_URL = "https://chat-message-0fml.onrender.com";
// const SOCKET_SERVER_URL = "http://localhost:5000";

export const useSocket = (userId, localVideoRef, remoteVideoRef, allUsers) => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const peersRef = useRef({});
  const [peerEmail, setPeerEmail] = useState("");
  const [isReceiving, setIsReceiving] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isVideoCalling, setIsVideoCalling] = useState(false);
  const [isVoiceCalling, setIsVoiceCalling] = useState(false);
  const [incomingShare, setIncomingShare] = useState(null);
  const [error, setError] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [hasWebcam, setHasWebcam] = useState(false);
  const [hasMicrophone, setHasMicrophone] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicrophoneOn, setIsMicrophoneOn] = useState(false);
  const [voiceCallData, setVoiceCallData] = useState(null);
  const [cameraStatus, setCameraStatus] = useState({});
  const streamRef = useRef(null);
  const [callAccept, setCallAccept] = useState(false);
  const [callParticipants, setCallParticipants] = useState(new Set());
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [callStartTime, setCallStartTime] = useState(null);
  const [callDuration, setCallDuration] = useState(null);
  const callTimerRef = useRef(null);
  const [groupCall, setGroupCall] = useState("");
  const [callFrom, setCallFrom] = useState("");
  const [allCallUsers, setAllCallUsers] = useState(new Map());

  // New state variables for call management
  const [callRoom, setCallRoom] = useState(null);
  const [invitedUsers, setInvitedUsers] = useState(new Set());
  const [ringingUsers, setRingingUsers] = useState(new Set());
  const [joinedUsers, setJoinedUsers] = useState(new Set());
  const [callStatus, setCallStatus] = useState(null); // 'idle', 'ringing', 'connected', 'ended'
  const [callType, setCallType] = useState(null); // 'video' or 'voice'
  const [callInitiator, setCallInitiator] = useState(null);
  const [callMetadata, setCallMetadata] = useState({
    startTime: null,
    endTime: null,
    duration: 0,
    participants: new Set(),
    type: null,
    isGroupCall: false,
    groupId: null,
  });

  const dispatch = useDispatch();

  // Helper functions for call management
  const generateCallRoomId = () => {
    return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const updateCallMetadata = (updates) => {
    setCallMetadata((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const addToInvitedUsers = (userId) => {
    setInvitedUsers((prev) => new Set([...prev, userId]));
  };

  const addToRingingUsers = (userId) => {
    setRingingUsers((prev) => new Set([...prev, userId]));
    setInvitedUsers((prev) => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
  };

  const addToJoinedUsers = (userId) => {
    setJoinedUsers((prev) => new Set([...prev, userId]));
    setRingingUsers((prev) => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
  };

  const removeFromCall = (userId) => {
    setJoinedUsers((prev) => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
    setRingingUsers((prev) => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
    setInvitedUsers((prev) => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
  };

  const resetCallState = () => {
    setCallRoom(null);
    setInvitedUsers(new Set());
    setRingingUsers(new Set());
    setJoinedUsers(new Set());
    setCallStatus(null);
    setCallType(null);
    setCallInitiator(null);
    setCallMetadata({
      startTime: null,
      endTime: null,
      duration: 0,
      participants: new Set(),
      type: null,
      isGroupCall: false,
      groupId: null,
    });
  };

  // console.log("callRoom", callRoom, joinedUsers, invitedUsers, ringingUsers);

  useEffect(() => {
    checkMediaDevices();
  }, []);

  useEffect(() => {
    const callusers = Array.from(allCallUsers?.keys()) || [];
    sessionStorage.setItem("callUser", callusers.length);
  }, [allCallUsers]);

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

      console.log("Available devices:", {
        webcams: videoDevices.length,
        microphones: audioDevices.length,
      });
    } catch (err) {
      console.error("Error checking media devices:", err);
      setError(
        "Unable to detect media devices. Please ensure you have granted necessary permissions."
      );
    }
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach((track) => (track.enabled = !track.enabled));
      const newStatus = !isCameraOn;
      setIsCameraOn(newStatus);

      if (socketRef.current?.connected) {
        console.log(
          `[Camera Status] User ${userId} is ${
            newStatus ? "turning ON" : "turning OFF"
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
      setIsMicrophoneOn((prev) => !prev);
    }
  };

  // ===========================socket connection=============================

  useEffect(() => {
    // Clear any existing connection
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Only create socket connection if we have a userId
    if (userId) {
      socketRef.current = io(SOCKET_SERVER_URL);

      socketRef.current.on("connect", () => {
        setIsConnected(true);
        console.log("Socket connected with userId:", userId);

        // Emit user-login after connection
        socketRef.current.emit("user-login", userId);
      });

      socketRef.current.on("disconnect", () => {
        setIsConnected(false);
        setOnlineUsers([]); // Clear online users on disconnect
        console.log("Socket disconnected");
      });

      socketRef.current.on("user-status-changed", (onlineUserIds) => {
        // console.log("Online users updated:", onlineUserIds);
        setOnlineUsers(onlineUserIds);
        if (onlineUserIds.length > 0) {
          dispatch(setOnlineuser(onlineUserIds));
        }
      });

      // Handle reconnection
      socketRef.current.on("reconnect", () => {
        console.log("Socket reconnected, re-emitting user-login");
        socketRef.current.emit("user-login", userId);
      });

      socketRef.current.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setIsConnected(false);
        setOnlineUsers([]);
      });

      socketRef.current.on("connect_timeout", () => {
        console.error("Socket connection timeout");
        setIsConnected(false);
        setOnlineUsers([]);
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    }
  }, [userId]); // Only depend on userId

  // ===========================private message=============================

  const sendPrivateMessage = (receiverId, message) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error("Socket not connected"));
        return;
      }

      try {
        // Check if message is already encrypted
        let content = message.data.content;
        if (!content.startsWith("data:")) {
          // Encrypt the message content if it's not already encrypted
          const key = "chat";
          let result = "";
          for (let i = 0; i < content.length; i++) {
            result += String.fromCharCode(
              content.charCodeAt(i) ^ key.charCodeAt(i % key.length)
            );
          }
          content = "data:" + btoa(result);
        }
        // console.log(message)
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
          replyTo: message.replyTo,
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

  // ===========================typing status=============================

  const sendTypingStatus = (receiverId, isTyping) => {
    if (!socketRef.current?.connected) return;

    console.log(userId, receiverId, isTyping);

    socketRef.current.emit("typing-status", {
      senderId: userId,
      receiverId,
      isTyping,
    });
  };

  // ===========================messages=============================

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

      setIsSharing(true);

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
      setIsReceiving(true);
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
      setIncomingShare(null);
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
          setIncomingCall(null);
          setIsVideoCalling(false);
          setIsVoiceCalling(false);
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
      setIncomingCall({
        fromEmail: data.fromEmail,
        signal: data.signal,
        type: data.type,
        participants: data.participants,
        isGroupCall: data.isGroupCall,
        groupId: data.groupId || null,
        roomId: data.roomId,
      });
      setCallRoom(data.roomId);
      setCallType(data.type);
      setCallStatus("ringing");
      addToRingingUsers(data.fromEmail);

      // console.log("callStatus", callStatus);
    });

    // console.log("callDuration", callDuration);

    socketRef.current.on("call-invite", async (data) => {
      console.log("Incoming call invite from:", data);
      setIncomingCall({
        fromEmail: data.fromEmail,
        signal: data.signal,
        type: data.type,
        participants: data.participants || [],
        isGroupCall: data.isGroupCall || false,
        roomId: data.roomId,
      });
      setCallRoom(data.roomId);
      setCallType(data.type);
      setCallStatus("ringing");
      addToRingingUsers(data.fromEmail);
    });

    socketRef.current.on("participant-joined",async ({ newParticipantId, from, participants, roomId }) => {
        if (newParticipantId !== userId && streamRef.current) {
          addToJoinedUsers(newParticipantId);
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
            setRemoteStreams((prev) =>
              new Map(prev).set(newParticipantId, stream)
            );
            setAllCallUsers((prev) =>
              new Map(prev).set(newParticipantId, stream)
            );
          });

          peersRef.current[newParticipantId] = peer;
          setCallParticipants((prev) => new Set([...prev, newParticipantId]));
        }
      }
    );

    socketRef.current.on("call-signal", ({ signal, from, roomId }) => {
      if (peersRef.current[from]) {
        peersRef.current[from].signal(signal);
      }
    });

    socketRef.current.on(
      "participant-left",
      ({ leavingUser, duration, roomId }) => {
        removeFromCall(leavingUser);
        // Remove the leaving participant's remote stream
        setRemoteStreams((prev) => {
          const newStreams = new Map(prev);
          newStreams.delete(leavingUser);
          return newStreams;
        });

        // Remove the leaving participant from the participants list
        setCallParticipants((prev) => {
          const newParticipants = new Set(prev);
          newParticipants.delete(leavingUser);
          return newParticipants;
        });

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
      addToJoinedUsers(fromEmail);
      if (peersRef.current) {
        peersRef.current[fromEmail].signal(signal);
      } else {
        console.error("No peer connection found for:", fromEmail);
      }
    });

    socketRef.current.on("call-ended", ({ to, from, duration, roomId }) => {
      endCall();
      setIsVoiceCalling(false);
      setIsVideoCalling(false);
      setIncomingCall(null);
      setCallStatus("ended");
      updateCallMetadata({
        endTime: new Date(),
        duration: duration || 0,
      });
      resetCallState();
    });

    socketRef.current.on("screen-share-request", async (data) => {
      console.log("Incoming screen share from:", data.fromEmail);
      setIncomingShare(data);
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
      console.log("call:update-participant-list", call);
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
    setCallType(type);
    setCallInitiator(userId);
    setCallStatus("ringing");
    setCallFrom(userId);
    setGroupCall(isGroupCall ? receiverId : "");
    const calltype = type == "video" ? "video" : "voice";

    try {
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: calltype == "video" ? hasWebcam : false,
          audio: hasMicrophone,
        });
      } catch (err) {
        console.warn("Could not get media devices:", err);
      }

      if (stream) {
        if (calltype == "video") {
          setIsCameraOn(true);
        }
        setIsMicrophoneOn(true);
        streamRef.current = stream;

        if (localVideoRef?.current) {
          localVideoRef.current.srcObject = stream;
          try {
            await localVideoRef.current.play();
          } catch (err) {
            console.error("Error playing local video:", err);
          }
        }
      }

      setCallStartTime(new Date());
      updateCallMetadata({
        startTime: new Date(),
        type: calltype,
        isGroupCall,
        groupId: isGroupCall ? receiverId : null,
      });

      const otherMembers =
        selectedChat &&
        selectedChat?.members?.filter((memberId) => memberId !== userId);

      if (otherMembers) {
        // Group call handling
        otherMembers.forEach((member) => {
          addToInvitedUsers(member);
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
            setRemoteStreams((prev) => new Map(prev).set(member, remoteStream));
            setAllCallUsers((prev) => new Map(prev).set(member, remoteStream));
          });

          peersRef.current[member] = peer;
          setPeerEmail(member);
          setCallParticipants(new Set(selectedChat.members));
        });
      } else {
        // Single user call handling
        addToInvitedUsers(receiverId);
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
          setRemoteStreams((prev) =>
            new Map(prev).set(receiverId, remoteStream)
          );
          setAllCallUsers((prev) =>
            new Map(prev).set(receiverId, remoteStream)
          );
        });

        peersRef.current[receiverId] = peer;
        setPeerEmail(receiverId);
        setCallParticipants(new Set([userId, receiverId]));
      }

      if (calltype == "video") {
        setIsVideoCalling(true);
      } else {
        setIsVoiceCalling(true);
      }
    } catch (err) {
      console.error("Error starting call:", err);
      endCall();
    }
  };

  const inviteToCall = async (newParticipantId) => {
    console.log("cvcvcvc", newParticipantId);

    setCallFrom(userId);
    if (!streamRef.current) return;

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
        setRemoteStreams((prev) =>
          new Map(prev).set(newParticipantId, remoteStream)
        );
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

      setCallParticipants((prev) => new Set([...prev, newParticipantId]));
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
          setIsCameraOn(true);
        }
        setIsMicrophoneOn(true);
        streamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
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
        setRemoteStreams((prev) =>
          new Map(prev).set(incomingCall.fromEmail, stream)
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
              setRemoteStreams((prev) =>
                new Map(prev).set(participantId, stream)
              );
              setAllCallUsers((prev) =>
                new Map(prev).set(participantId, stream)
              );
            });

            peersRef.current[participantId] = participantPeer;
          }
        });
      }

      if (incomingCall.type == "video") {
        setIsVideoCalling(true);
      } else {
        setIsVoiceCalling(true);
      }
      setPeerEmail(incomingCall.fromEmail);
      setCallParticipants(new Set(incomingCall.participants));
      setIncomingCall(null);
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

    const callusers = Array.from(remoteStreams?.keys());
    const no_of_callUser = sessionStorage.getItem("callUser");

    // Update call metadata
    updateCallMetadata({
      endTime: new Date(),
      duration: finalDuration,
    });

    if (groupCall) {
      if (callParticipants.size > 2) {
        Array.from(callParticipants).forEach((participantId) => {
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
        Array.from(callParticipants).forEach((participantId) => {
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

      if (callStartTime && callusers.length == 1) {
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
      if (callParticipants.size > 2) {
        Array.from(callParticipants).forEach((participantId) => {
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

        Array.from(callParticipants).forEach((participantId) => {
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
        Array.from(callParticipants).forEach((participantId) => {
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

        Array.from(callParticipants).forEach((participantId) => {
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
    setIsVideoCalling(false);
    setIsVoiceCalling(false);
    setIncomingCall(null);
    setIsCameraOn(false);
    setIsMicrophoneOn(false);
    setCallDuration(null);
    setCallStartTime(null);
    setPeerEmail(null);
    setRemoteStreams(new Map());
    setAllCallUsers(new Map());
    setCallStatus("ended");
    resetCallState();
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
    setIsVoiceCalling(false);
    setIsVideoCalling(false);
    setIncomingCall(null);
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
    setIsSharing(false);
    setIsReceiving(false);
    setPeerEmail("");
    setError("");
    setIsVideoCalling(false);
    setIsVoiceCalling(false);
    setIncomingCall(null);
    setIsCameraOn(false);
    setIsMicrophoneOn(false);
    setIncomingShare(null);
    setRemoteStreams(new Map());
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
          `[Camera Status] Received update: User ${remoteUserId} camera is now ${
            remoteCameraStatus ? "ON" : "OFF"
          }`
        );
        setCameraStatus((prev) => ({
          ...prev,
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
      setRemoteStreams((prev) => {
        const newStreams = new Map(prev);
        newStreams.delete(peerId);
        return newStreams;
      });

      // Remove from call participants
      setCallParticipants((prev) => {
        const newParticipants = new Set(prev);
        newParticipants.delete(peerId);
        return newParticipants;
      });

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

  // ====================================================================================================

  return {
    socket: socketRef.current,
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
    startCall,
    acceptCall,
    endCall,
    isSharing,
    setIsSharing,
    isReceiving,
    setIsReceiving,
    toggleCamera,
    toggleMicrophone,
    markMessageAsRead,
    rejectCall,
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
    startCall,
    acceptCall,
  };
};
