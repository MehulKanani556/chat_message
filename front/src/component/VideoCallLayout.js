import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { AiOutlineVideoCamera } from "react-icons/ai";
import { BsCameraVideo, BsCameraVideoOff, BsChatDots } from "react-icons/bs";
import { GoUnmute } from "react-icons/go";
import {
  IoCallOutline,
  IoMicOffCircleOutline,
  IoMicOffOutline,
  IoMicOutline,
} from "react-icons/io5";
import { MdOutlineGroupAdd } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { IMG_URL } from "../utils/baseUrl";
import {
  setParticipantOpen,
  setSelectedChatModule,
  setChatMessages,
  setvideoCallChatList,
  setCallChatList,
} from "../redux/slice/manageState.slice";
import { useSocket } from "../context/SocketContext";
import { LuFullscreen } from "react-icons/lu";
import html2canvas from "html2canvas";
import { FFmpeg } from '@ffmpeg/ffmpeg';
// import { fetchFile } from '@ffmpeg/util';

const getParticipantWidth = (count) => {
  if (count === 1) return "w-full";
  if (count === 2) return "w-full";
  if (count <= 4) return "w-1/2";
  if (count <= 6) return "w-1/3";
  if (count <= 9) return "w-1/3";
  return "w-1/4";
};

const VideoCallLayout = memo(() => {
  const participants = useSelector((state) => state.magageState.participants);
  const selectedChat = useSelector((state) => state.magageState.selectedChat);
  const selectedChatModule = useSelector(
    (state) => state.magageState.selectedChatModule
  );
  const isMicrophoneOn = useSelector(
    (state) => state.magageState.isMicrophoneOn
  );
  const isCameraOn = useSelector((state) => state.magageState.isCameraOn);
  const isVideoCalling = useSelector(
    (state) => state.magageState.isVideoCalling
  );
  const isVoiceCalling = useSelector(
    (state) => state.magageState.isVoiceCalling
  );
  const cameraStatus = useSelector((state) => state.magageState.cameraStatus);
  const isReceiving = useSelector((state) => state.magageState.isReceiving);
  const userIncall = useSelector((state) => state.magageState.userIncall);
  const chatMessages = useSelector((state) => state.magageState.chatMessages);
  const participantOpen = useSelector(
    (state) => state.magageState.participantOpen
  );
  const callChatList = useSelector((state) => state.magageState.callChatList);

  const { allUsers, messages } = useSelector((state) => state.user);
  const currentUser = useMemo(() => sessionStorage.getItem("userId"), []);
  const dispatch = useDispatch();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const [localVideoPosition, setLocalVideoPosition] = useState({ x: 0, y: 0 });
  const [isDraggingLocal, setIsDraggingLocal] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const localVideoRef = useRef(null);

  //===========Use the custom socket hook===========
  const { endCall, cleanupConnection, toggleCamera, toggleMicrophone } =
    useSocket();

  //===========Use the custom socket hook===========
  const handleMouseDown = (e) => {
    if (!chatMessages) return;

    const rect = containerRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
  };

  let LocalX, LocalY, X, Y;
  const handleMouseMove = (e) => {
    if (!isDragging || !chatMessages) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    // Get window dimensions
    const maxX = window.innerWidth - containerRef.current.offsetWidth;
    const maxY = window.innerHeight - containerRef.current.offsetHeight;

    // Constrain position within window bounds
    const constrainedX = Math.max(0, Math.min(newX, maxX));
    const constrainedY = Math.max(0, Math.min(newY, maxY));

    containerRef.current.style.left = `${constrainedX}px`;
    containerRef.current.style.top = `${constrainedY}px`;

    X = constrainedX;
    Y = constrainedY;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setPosition({ x: X, y: Y });
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const [ringtone] = useState(new Audio("/Ring_ring.mp3")); // Add your ringtone file to public folder

  // Add useEffect to handle ringtone
  useEffect(() => {
    if (participants.length == 1 && !isReceiving) {
      ringtone.loop = true;
      ringtone
        .play()
        .catch((err) => console.error("Error playing ringtone:", err));
    } else {
      ringtone.pause();
      ringtone.currentTime = 0;
    }

    return () => {
      ringtone.pause();
      ringtone.currentTime = 0;
    };
  }, [isReceiving, ringtone, participants]);

  // console.log("VideoCallLayout");
  // console.log(participants.length, isVoiceCalling);

  const handleLocalVideoMouseDown = (e, participantId) => {
    if (participants.length !== 2 || participantId !== currentUser) return;
    if (callChatList && chatMessages) return;

    setIsDraggingLocal(true);
    setDragStart({
      x: e.clientX - localVideoPosition.x,
      y: e.clientY - localVideoPosition.y,
    });
  };

  const handleLocalVideoMouseMove = (e) => {
    if (!isDraggingLocal || participants.length !== 2) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Get window dimensions
    const maxX = window.innerWidth - (localVideoRef.current?.offsetWidth || 0);
    const maxY =
      window.innerHeight - (localVideoRef.current?.offsetHeight || 0);

    // Constrain position within window bounds
    const constrainedX = Math.max(0, Math.min(newX, maxX));
    const constrainedY = Math.max(0, Math.min(newY, maxY));

    localVideoRef.current.style.left = `${constrainedX}px`;
    localVideoRef.current.style.top = `${constrainedY}px`;

    LocalX = constrainedX;
    LocalY = constrainedY;
  };

  const handleLocalVideoMouseUp = () => {
    setIsDraggingLocal(false);
    setLocalVideoPosition({ x: LocalX, y: LocalY });
  };

  useEffect(() => {
    if (isDraggingLocal) {
      window.addEventListener("mousemove", handleLocalVideoMouseMove);
      window.addEventListener("mouseup", handleLocalVideoMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleLocalVideoMouseMove);
      window.removeEventListener("mouseup", handleLocalVideoMouseUp);
    };
  }, [isDraggingLocal]);





  const canvasRef = useRef(null);
  const videoElementsRef = useRef({});
  const [isRecording , setIsRecording] = useState(false)
  const mediaRecorderRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const recordedChunksRef = useRef([]);
  // Ref for the animation frame ID to cancel the drawing loop
  const animationFrameIdRef = useRef(null);


 const startRecording = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Stop any existing drawing loop
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }

    const drawFrames = () => {
      // Clear canvas for the new frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Correctly iterate over participants to get the MediaStream
      // participantEntries is an array of [participantId, [participantId, MediaStream]]
      // We need to destructure participantValue to get the actual stream at index 1
      Array.from(participants).forEach(([participantId, participantValue], index) => {
     
        const stream = participantValue; 

        const videoElement = videoElementsRef.current[participantId];
        
        const participant = allUsers.find(u => u._id === participantId);
        const hasActiveVideoTrack = stream && stream instanceof MediaStream && stream.getVideoTracks().some(track => track.readyState === 'live' && !track.muted);

        const { x, y, width, height } = calculateGridLayout(
          index,
          participants.size, // Use size for Map
          canvas.width,
          canvas.height
        );

        if (videoElement && hasActiveVideoTrack && videoElement.readyState >= 2) {
          // Draw the video frame onto the canvas if there's an active track and the video element is ready
          try {
             ctx.drawImage(videoElement, x, y, width, height);
          } catch (e) {
             // Catch potential errors if drawImage fails unexpectedly
             console.error(`Error drawing video for ${participantId}:`, e);
             // Fallback to drawing placeholder if drawImage fails
             ctx.fillStyle = 'grey';
             ctx.fillRect(x, y, width, height);
             // Optionally draw profile picture or initials on the placeholder
             drawParticipantPlaceholder(ctx, participant, x, y, width, height);
          }
        } else {
           // Draw a placeholder (grey background + profile picture/initials)
           // if no active video track or video element not ready
           ctx.fillStyle = 'grey'; // Example placeholder background
           ctx.fillRect(x, y, width, height);
           // Draw profile picture or initials on the placeholder
           drawParticipantPlaceholder(ctx, participant, x, y, width, height);

           // Only log if the video element exists but isn't ready AND has an active track
           // This helps debug actual stream/video element issues vs. camera off
           if (videoElement && hasActiveVideoTrack && videoElement.readyState < 2) {
              console.log(`Video element for ${participantId} not ready (readyState: ${videoElement.readyState}).`);
           }
           // Avoid logging when camera is simply off
        }
      });

      // Request the next frame
      animationFrameIdRef.current = requestAnimationFrame(drawFrames);
    };

    // Define a helper function to draw placeholder (initials or image)
    const drawParticipantPlaceholder = (ctx, participant, x, y, width, height) => {
        // ... (Your implementation of drawing initials/photo) ...
        ctx.fillStyle = 'white';
        ctx.font = `${Math.min(width, height) / 4}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const textX = x + width / 2;
        const textY = y + height / 2;
        const initials = participant?.userName?.[0]?.toUpperCase() || '?';
        ctx.fillText(initials, textX, textY);
    };

    // Start the drawing loop
    drawFrames();

    // Create a stream from the canvas
    const canvasStream = canvas.captureStream(30); // 30 frames per second

    console.log(canvasStream,"canvasStream");
    

    // Use the canvas stream for MediaRecorder
    const mediaRecorder = new MediaRecorder(canvasStream, {
      mimeType: "video/webm;codecs=vp9,opus", // Or 'video/mp4' if supported by browser
    });

    mediaRecorder.ondataavailable = (event) => {
      console.log(event.data);
      
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = handleStop;

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    // Stop the drawing loop when recording stops
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
  };

  const handleStop = async () => {
    // ... existing handleStop logic ...
    const blob = new Blob(recordedChunksRef.current, {
      type: "video/webm",
    });

    // Optional: Convert to MP4 using ffmpeg.wasm here

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "recording.webm"; // change to .mp4 after conversion
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    recordedChunksRef.current = [];

    // Ensure drawing loop is stopped if not already (should be stopped by stopRecording)
     if (animationFrameIdRef.current) {
       cancelAnimationFrame(animationFrameIdRef.current);
       animationFrameIdRef.current = null;
     }
  };

  // Add a useEffect to cleanup the animation frame on component unmount
  useEffect(() => {
      return () => {
          if (animationFrameIdRef.current) {
              cancelAnimationFrame(animationFrameIdRef.current);
          }
      };
  }, []);

  const content = (
    <>
      <div
        ref={containerRef}
        className={`flex-1 flex flex-col items-center justify-between p-2 md:p-4 overflow-hidden bg-black ${
          participantOpen ? "w-[70%]" : "w-full"
        }`}
        style={
          chatMessages
            ? {
                width: "25%",
                height: "34%",
                position: "absolute",
                top: position.y,
                left: position.x,
                cursor: isDragging ? "grabbing" : "grab",
                userSelect: "none",
                transform: "none",
              }
            : { position: "relative" }
        }
        onMouseDown={handleMouseDown}
      >
        {/* Participant Grid */}
        <div className="flex flex-wrap relative justify-center items-center w-full overflow-hidden h-[calc(100vh-130px)]">
          {participants.length == 1 ? (
            isVoiceCalling ? (
              <div className="w-full h-full dark:bg-white/10 relative rounded-xl">
                <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2">
                  <span className="absolute w-24 h-24 rounded-full border animate-wave dark:border-white/50 [animation-delay:0s]" />
                  <span className="absolute w-24 h-24 rounded-full border animate-wave dark:border-white/50 [animation-delay:0.5s]" />
                  <span className="absolute w-24 h-24 rounded-full border animate-wave dark:border-white/50 [animation-delay:1s]" />
                  <span className="absolute w-24 h-24 rounded-full border animate-wave dark:border-white/50 [animation-delay:1.5s]" />
                  {selectedChat &&
                  selectedChat.photo &&
                  selectedChat.photo !== "null" ? (
                    <img
                      src={`${IMG_URL}${selectedChat.photo.replace(
                        /\\/g,
                        "/"
                      )}`}
                      alt="User profile"
                      className="object-cover border rounded-full w-24 h-24"
                    />
                  ) : (
                    <div className="flex items-center justify-center border rounded-full w-24 h-24 bg-black/50">
                      <span className="text-white text-4xl text-center">
                        {selectedChat?.userName?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <p className="mt-20 text-white text-lg font-medium text-center">
                    {selectedChat?.userName || "Unknown User"}
                  </p>
                  {userIncall && (
                    <p className="mt-20 text-xs text-red-400 font-medium text-center animate-pulse">
                      {selectedChat?.userName} {userIncall}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              participants.length > 0 &&
              Array.from(participants)?.map(([participantId, stream]) => {
                const participant = allUsers.find(
                  (u) => u._id === participantId
                );
                const isLocalUser = participantId === currentUser;
                const widthClass = getParticipantWidth(participants?.length);

                const setVideoRef = (el) => {
                  if (el) {
                      videoElementsRef.current[participantId] = el;
                  } else {
                      // Clean up ref when element is unmounted
                      delete videoElementsRef.current[participantId];
                  }
                };
                return (
                  <div
                    key={participantId}
                    ref={isLocalUser ? localVideoRef : null}
                    className={`${
                      participants.length == 2
                        ? isLocalUser
                          ? "absolute w-40 h-28 md:w-56 md:h-36 z-20 cursor-move left-[84%]"
                          : widthClass
                        : widthClass
                    } p-2 flex items-center justify-center`}
                    style={{
                      height: `${
                        !(isLocalUser && participants.length == 2)
                          ? `calc(100% / ${
                              participants.length <= 2
                                ? 1
                                : participants.length <= 8 &&
                                  participants.length >= 2
                                ? 2
                                : 3
                            })`
                          : ""
                      }`,
                      ...(isLocalUser && participants.length == 2
                        ? {
                            position: "absolute",
                            left: `${localVideoPosition.x}px`,
                            top: `${localVideoPosition.y}px`,
                            cursor: isDraggingLocal ? "grabbing" : "grab",
                          }
                        : {}),
                    }}
                    onMouseDown={(e) =>
                      handleLocalVideoMouseDown(e, participantId)
                    }
                  >
                    <div className="aspect-video relative w-full h-full bg-primary-dark rounded-xl overflow-hidden shadow-lg">
                      <video
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover rounded-xl"
                        style={{width:"100%", height:"100%",borderRadius:"10px", objectFit:"cover"}}
                        muted={participantId === currentUser}
                        ref={(el) => {
                          setVideoRef(el);
                          if (el && stream instanceof MediaStream) {
                            el.srcObject = stream;
                            el.play().catch((err) =>
                              console.error("Remote video error:", err)
                            );
                          }
                          // If you want to keep localVideoRef for the current user:
                          // if (participantId === currentUser && localVideoRef) {
                          //   localVideoRef.current = el;
                          // }
                        }}
                      />
                      <div className="absolute bottom-2 left-2 px-3 py-1 rounded-full text-white bg-blue-600 text-[clamp(10px,1.2vw,14px)]">
                        {isLocalUser ? "You" : participant?.userName || "Par"}
                      </div>
                      {userIncall && (
                        <p className="mt-20 text-xs text-red-400 font-medium text-center animate-pulse absolute bottom-2 left-[50%] px-3 py-1">
                          {selectedChat?.userName} {userIncall}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )
          ) : (
            <>
              {chatMessages && (
                <div
                  className={`absolute w-full h-full flex justify-center group items-center z-[100] transition-opacity duration-200 hover:backdrop-brightness-50`}
                >
                  <LuFullscreen
                    className="text-white cursor-pointer h-12 w-12 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={() => {
                      dispatch(setChatMessages(!chatMessages));
                      dispatch(setCallChatList(!callChatList));
                    }}
                  />
                </div>
              )}
              {participants.length > 0 &&
                Array.from(participants)?.map(([participantId, stream]) => {
                  const participant = allUsers.find(
                    (u) => u._id === participantId
                  );
                  const isCameraEnabled = isVideoCalling
                    ? cameraStatus?.[participantId] !== false
                    : false;
                  const isLocalUser = participantId === currentUser;
                  const widthClass = getParticipantWidth(participants?.length);
                  // localVideoRef.current.srcObject = isLocalUser ? stream : null

                  console.log(cameraStatus, isCameraEnabled, participantId);

                  const setVideoRef = (el) => {
                    if (el) {
                        videoElementsRef.current[participantId] = el;
                    } else {
                        // Clean up ref when element is unmounted
                        delete videoElementsRef.current[participantId];
                    }
                };

                  return (
                    <div
                      key={participantId}
                      ref={isLocalUser ? localVideoRef : null}
                      className={`${
                        participants.length == 2
                          ? isLocalUser
                            ? "absolute w-40 h-28 md:w-56 md:h-36 z-20 cursor-move left-[84%]"
                            : widthClass
                          : widthClass
                      } p-2 flex items-center justify-center`}
                      style={{
                        height: `${
                          !(isLocalUser && participants.length == 2)
                            ? `calc(100% / ${
                                participants.length <= 2
                                  ? 1
                                  : participants.length <= 8 &&
                                    participants.length >= 2
                                  ? 2
                                  : 3
                              })`
                            : ""
                        }`,
                        ...(isLocalUser && participants.length == 2
                          ? {
                              position: "absolute",
                              left: `${localVideoPosition.x}px`,
                              top: `${localVideoPosition.y}px`,
                              cursor: isDraggingLocal ? "grabbing" : "grab",
                            }
                          : {}),
                      }}
                      onMouseDown={(e) =>
                        handleLocalVideoMouseDown(e, participantId)
                      }
                    >
                      <div className="aspect-video relative w-full h-full bg-primary-dark rounded-xl overflow-hidden shadow-lg border border-black/20 dark:border-white/20 ">
                        {isCameraEnabled ? (
                          <>
                            <video
                              autoPlay
                              playsInline
                              className="w-full h-full object-cover rounded-xl"
                              style={{width:"100%", height:"100%",borderRadius:"10px", objectFit:"cover"}}
                              muted={participantId === currentUser}
                              ref={(el) => {
                                setVideoRef(el); 
                                if (el && stream instanceof MediaStream) {
                                  el.srcObject = stream;
                                  el.play().catch((err) =>
                                    console.error("Remote video error:", err)
                                  );
                                }
                                // If you want to keep localVideoRef for the current user:
                                // if (participantId === currentUser && localVideoRef) {
                                //   localVideoRef.current = el;
                                // }
                              }}
                            />
                            <div className="absolute bottom-2 left-2 px-3 py-1 rounded-full text-white bg-blue-600 text-[clamp(10px,1.2vw,14px)]">
                              {isLocalUser
                                ? "You"
                                : participant?.userName || "Par"}
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full bg-gray-800 flex items-center justify-center flex-col rounded-xl">
                            <video
                              autoPlay
                              playsInline
                              className="w-full h-full object-cover rounded-xl hidden"
                              style={{width:"100%", height:"100%",borderRadius:"10px", objectFit:"cover", display:"none"}}
                              muted={participantId === currentUser}
                              ref={(el) => {
                                setVideoRef(el); 
                                if (el && stream instanceof MediaStream) {
                                  el.srcObject = stream;
                                  el.play().catch((err) =>
                                    console.error("Remote video error:", err)
                                  );
                                }
                                // If you want to keep localVideoRef for the current user:
                                // if (participantId === currentUser && localVideoRef) {
                                //   localVideoRef.current = el;
                                // }
                              }}
                            />
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden">
                              {participant?.photo &&
                              participant.photo !== "null" ? (
                                <img
                                  src={`${IMG_URL}${participant.photo.replace(
                                    /\\/g,
                                    "/"
                                  )}`}
                                  alt="Profile"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-500 flex items-center justify-center rounded-full">
                                  <span className="text-white text-[clamp(18px,4vw,28px)] font-bold">
                                    {participant?.userName?.[0]?.toUpperCase() ||
                                      "?"}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="mt-2 text-white text-[clamp(10px,1.2vw,14px)]">
                              {participant?.userName || "Pa"}{" "}
                              {!isVideoCalling ? "" : " (Camera Off)"}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </>
          )}
        </div>

        {!chatMessages && (
          <div className="p-2  w-full flex justify-center items-center space-x-3 md:space-x-4 dark:bg-[#1A1A1A] bg-black/10">
            <button
              onClick={() => {
                dispatch(setParticipantOpen(false));
                // dispatch(setvideoCallChatList(true));
                dispatch(setSelectedChatModule(true));
                dispatch(setCallChatList(!callChatList));
                // dispatch(setChatMessages(true));
              }}
              className={`w-10 grid place-content-center rounded-full h-10 border ${
                callChatList
                  ? "dark:bg-white dark:text-black bg-black/50 text-white"
                  : "dark:text-white text-black"
              }`}
            >
              <BsChatDots className="text-xl" />
            </button>

            <button
              onClick={toggleMicrophone}
              className={`w-10 grid place-content-center border rounded-full h-10 text-white ${
                isMicrophoneOn
                  ? "dark:bg-white dark:text-black bg-black/50 text-white"
                  : "dark:text-white text-black"
              }`}
            >
              {isMicrophoneOn ? (
                <IoMicOutline className="text-xl" />
              ) : (
                <IoMicOffOutline className="text-xl" />
              )}
            </button>

            <button
              onClick={toggleCamera}
              className={`w-10 grid place-content-center border rounded-full h-10 text-white ${
                isVideoCalling ? "" : "hidden"
              }  ${
                isCameraOn
                  ? "dark:bg-white dark:text-black bg-black/50 text-white"
                  : "dark:text-white text-black"
              }`}
            >
              {isCameraOn ? (
                <BsCameraVideo className="text-xl" />
              ) : (
                <BsCameraVideoOff className="text-xl" />
              )}
            </button>

            <button
              onClick={() => {
                if (!isReceiving) {
                  endCall();
                }
                cleanupConnection();
                dispatch(setSelectedChatModule(true));
                dispatch(setParticipantOpen(false));
                dispatch(setCallChatList(false));
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
                  dispatch(setParticipantOpen(!participantOpen));
                  dispatch(setCallChatList(false));
                }}
                className={`w-10 grid place-content-center rounded-full h-10 border text-white ${
                  participantOpen
                    ? "dark:bg-white dark:text-black bg-black/50 text-white"
                    : "dark:text-white text-black"
                }`}
              >
                <MdOutlineGroupAdd className="text-xl" />
              </button>
            )}
            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              style={{ display: "none" }}
            />
            <button
               onClick={() => isRecording ? (setIsRecording(false), stopRecording()) : (setIsRecording(true), startRecording())}
              className={`w-10 grid place-content-center rounded-full h-10 border text-white ${
                isRecording ? "bg-red-500" : ""
              }`}
            >
              <AiOutlineVideoCamera className="text-xl" />
            </button>
          </div>
        )}
      </div>
    </>
  );

  return content;
});

export default VideoCallLayout;

const calculateGridLayout = (index, count, canvasWidth, canvasHeight) => {
  let cols, rows;

  if (count <= 1) {
    cols = 1;
    rows = 1;
  } else if (count <= 4) {
    cols = 2;
    rows = 2;
  } else if (count <= 6) {
    cols = 3;
    rows = 2;
  } else if (count <= 9) {
    cols = 3;
    rows = 3;
  } else { // For more than 9, you might need a different strategy, let's use 4 cols
    cols = 4;
    rows = Math.ceil(count / cols);
  }

  const cellWidth = canvasWidth / cols;
  const cellHeight = canvasHeight / rows;

  const col = index % cols;
  const row = Math.floor(index / cols);

  const x = col * cellWidth;
  const y = row * cellHeight;

  return { x, y, width: cellWidth, height: cellHeight };
};
