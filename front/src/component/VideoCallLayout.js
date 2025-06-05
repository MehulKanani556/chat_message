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
    console.log(rect, "==========================================");

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
    if (X && Y) {
      setPosition({ x: X, y: Y });
    }
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

  console.log("VideoCallLayout");
  // console.log(participants.length, isVoiceCalling);

  const handleLocalVideoMouseDown = (e, participantId) => {
    if (participants.length !== 2 || participantId !== currentUser) return;

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

  // =============================Recording==========================
  const canvasRef = useRef(null);
  const videoElementsRef = useRef({});
  const mediaRecorderRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const recordedChunksRef = useRef([]);
  const animationFrameIdRef = useRef(null);


  const startRecording = async () => {
    try {
      // Get all video elements
      const videoElements = Object.values(videoElementsRef.current);

      console.log(videoElements);


      // Create a canvas to combine video streams
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Set canvas size to match video dimensions
      canvas.width = 1920;
      canvas.height = 1080;

      // Create a MediaStream from the canvas
      const canvasStream = canvas.captureStream(30); // 30 FPS

      const audioStreams = Array.from(participants).map(([id, stream]) => stream);
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();

      audioStreams.forEach((stream) => {
        if (stream && stream.getAudioTracks().length > 0) {
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(destination);
        }
      });

      // Add mixed audio tracks to the canvas stream
      destination.stream.getAudioTracks().forEach((track) => {
        canvasStream.addTrack(track);
      });

      // Start drawing loop
      const drawVideo = () => {
        // Clear canvas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw each video element
        videoElements.forEach((videoElement, index) => {
          if (videoElement && videoElement.videoWidth > 0) {
            const layout = calculateGridLayout(index, videoElements.length, canvas.width, canvas.height);
            if (layout.rounded) {
              const radius = Math.min(layout.width, layout.height) * 0.03;
              ctx.save();
              ctx.beginPath();
              ctx.moveTo(layout.x + radius, layout.y);
              ctx.lineTo(layout.x + layout.width - radius, layout.y);
              ctx.quadraticCurveTo(layout.x + layout.width, layout.y, layout.x + layout.width, layout.y + radius);
              ctx.lineTo(layout.x + layout.width, layout.y + layout.height - radius);
              ctx.quadraticCurveTo(layout.x + layout.width, layout.y + layout.height, layout.x + layout.width - radius, layout.y + layout.height);
              ctx.lineTo(layout.x + radius, layout.y + layout.height);
              ctx.quadraticCurveTo(layout.x, layout.y + layout.height, layout.x, layout.y + layout.height - radius);
              ctx.lineTo(layout.x, layout.y + radius);
              ctx.quadraticCurveTo(layout.x, layout.y, layout.x + radius, layout.y);
              ctx.closePath();
              ctx.clip();

              ctx.drawImage(videoElement, layout.x, layout.y, layout.width, layout.height);

              ctx.restore();

              // Draw border
              ctx.save();
              ctx.beginPath();
              ctx.moveTo(layout.x + radius, layout.y);
              ctx.lineTo(layout.x + layout.width - radius, layout.y);
              ctx.quadraticCurveTo(layout.x + layout.width, layout.y, layout.x + layout.width, layout.y + radius);
              ctx.lineTo(layout.x + layout.width, layout.y + layout.height - radius);
              ctx.quadraticCurveTo(layout.x + layout.width, layout.y + layout.height, layout.x + layout.width - radius, layout.y + layout.height);
              ctx.lineTo(layout.x + radius, layout.y + layout.height);
              ctx.quadraticCurveTo(layout.x, layout.y + layout.height, layout.x, layout.y + layout.height - radius);
              ctx.lineTo(layout.x, layout.y + radius);
              ctx.quadraticCurveTo(layout.x, layout.y, layout.x + radius, layout.y);
              ctx.closePath();
              ctx.lineWidth = 1;
              ctx.strokeStyle = "gray";
              ctx.stroke();
              ctx.restore();
            } else {
              ctx.drawImage(videoElement, layout.x, layout.y, layout.width, layout.height);
            }
            // ctx.drawImage(videoElement, layout.x, layout.y, layout.width, layout.height);
          }
        });

        // Continue drawing loop
        animationFrameIdRef.current = requestAnimationFrame(drawVideo);
      };

      // Start the drawing loop
      drawVideo();

      // Create MediaRecorder with canvas stream
      const mediaRecorder = new MediaRecorder(canvasStream, {
        mimeType: "video/webm;codecs=vp9,opus",
        videoBitsPerSecond: 2500000
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = handleStop;

      // Start recording
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setRecording(true);

      // Stop recording when call ends
      const stopRecordingOnCallEnd = () => {
        stopRecording();
      };

      // Add event listener for call end
      window.addEventListener('beforeunload', stopRecordingOnCallEnd);

      // Cleanup function
      return () => {
        window.removeEventListener('beforeunload', stopRecordingOnCallEnd);
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
        }
      };
    } catch (err) {
      console.error("Error starting video recording:", err);
    }
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

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
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
    a.download = `Videocall-${formatDate(new Date())}.webm`;
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

  const calculateGridLayout = (index, count, canvasWidth, canvasHeight) => {
    const gap = 32; // px gap between videos

    // 2 participants: one big, one small overlay
    if (count === 2) {
      if (index === 0) {
        return { x: 0, y: 0, width: canvasWidth, height: canvasHeight, rounded: false };
      } else {
        const smallWidth = canvasWidth * 0.25;
        const smallHeight = canvasHeight * 0.25;
        return {
          x: canvasWidth - smallWidth - gap,
          y: canvasHeight - smallHeight - gap,
          width: smallWidth,
          height: smallHeight,
          rounded: true,
        };
      }
    }

    // 1 participant: full screen
    if (count === 1) {
      return { x: 0, y: 0, width: canvasWidth, height: canvasHeight, rounded: false };
    }

    // 3+ participants: grid with centering and gap
    let cols, rows;
    if (count <= 4) {
      cols = 2;
      rows = 2;
    } else if (count <= 6) {
      cols = 3;
      rows = 2;
    } else if (count <= 9) {
      cols = 3;
      rows = 3;
    } else {
      cols = 4;
      rows = Math.ceil(count / cols);
    }

    const cellWidth = (canvasWidth - gap * (cols + 1)) / cols;
    const cellHeight = (canvasHeight - gap * (rows + 1)) / rows;
    const row = Math.floor(index / cols);
    const col = index % cols;

    // Center last row if not full
    let offsetX = gap;
    if (row === rows - 1) {
      const itemsInLastRow = count - (rows - 1) * cols;
      if (itemsInLastRow < cols) {
        const emptyCells = cols - itemsInLastRow;
        offsetX += ((cellWidth + gap) * emptyCells) / 2;
      }
    }

    return {
      x: offsetX + col * (cellWidth + gap),
      y: gap + row * (cellHeight + gap),
      width: cellWidth,
      height: cellHeight,
      rounded: true,
    };
  };
  // ====================================================================

  const content = (
    <div
      ref={containerRef}
      className={`flex-1 flex flex-col items-center justify-between p-2 md:p-4 overflow-hidden bg-black ${participantOpen ? "w-[70%]" : "w-full"
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
          : {}
      }
      onMouseDown={handleMouseDown}
    >
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        style={{ display: "none" }}
      />
      {/* Participant Grid */}
      <div className="flex flex-wrap relative justify-center items-center w-full overflow-hidden h-[calc(100vh-130px)]">
        {/* Add hidden canvas for recording */}
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
                    src={`${IMG_URL}${selectedChat.photo.replace(/\\/g, "/")}`}
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
                  <p className="mt-20 text-white text-lg font-medium text-center animate-pulse">
                    {selectedChat?.userName} {userIncall}
                  </p>
                )}
              </div>
            </div>
          ) : (
            participants.length > 0 &&
            Array.from(participants)?.map(([participantId, stream]) => {
              const participant = allUsers.find((u) => u._id === participantId);
              const isLocalUser = participantId === currentUser;
              const widthClass = getParticipantWidth(participants?.length);
              // console.log(cameraStatus, isCameraEnabled, participantId);
              const setVideoRef = (el) => {
                console.log(el, "--------------------");

                if (el) {
                  videoElementsRef.current[participantId] = el;
                } else {
                  // Clean up ref when element is unmounted
                  delete videoElementsRef.current[participantId];
                }
              }

              return (
                <div
                  key={participantId}
                  ref={isLocalUser ? localVideoRef : null}
                  className={`${participants.length == 2
                    ? isLocalUser
                      ? "absolute w-40 h-28 md:w-56 md:h-36 z-20 cursor-move bottom-4 right-4"
                      : widthClass
                    : widthClass
                    } p-2 flex items-center justify-center`}
                  style={{
                    height: `${!(isLocalUser && participants.length == 2)
                      ? `calc(100% / ${participants.length <= 2
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
                        bottom: "1rem",
                        right: "1rem",
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
                      className={`w-full h-full object-cover rounded-xl ${!isReceiving ? 'transform -translate-x-1 -scale-x-100' : ''}`}
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
                      <p className="mt-20 text-white text-lg font-medium text-center animate-pulse absolute bottom-2 left-[50%] px-3 py-1">
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

                // console.log(cameraStatus, isCameraEnabled, participantId);
                const setVideoRef = (el) => {
                  if (el) {
                    videoElementsRef.current[participantId] = el;
                  } else {
                    // Clean up ref when element is unmounted
                    delete videoElementsRef.current[participantId];
                  }
                }

                return (
                  <div
                    key={participantId}
                    ref={isLocalUser ? localVideoRef : null}
                    className={`${participants.length == 2
                      ? isLocalUser
                        ? "absolute w-40 h-28 md:w-56 md:h-36 z-20 cursor-move bottom-4 right-4"
                        : widthClass
                      : widthClass
                      } p-2 flex items-center justify-center`}
                    style={{
                      height: `${!(isLocalUser && participants.length == 2)
                        ? `calc(100% / ${participants.length <= 2
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
                          bottom: "1rem",
                          right: "1rem",
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
                            className={`w-full h-full object-cover rounded-xl ${!isReceiving ? 'transform -translate-x-1 -scale-x-100' : ''}`}
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
            className={`w-10 grid place-content-center rounded-full h-10 border ${callChatList
              ? "dark:bg-white dark:text-black bg-black/50 text-white"
              : "dark:text-white text-black"
              }`}
          >
            <BsChatDots className="text-xl" />
          </button>

          <button
            onClick={toggleMicrophone}
            className={`w-10 grid place-content-center border rounded-full h-10 text-white ${isMicrophoneOn
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
            className={`w-10 grid place-content-center border rounded-full h-10 text-white ${isVideoCalling ? "" : "hidden"
              }  ${isCameraOn
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
              className={`w-10 grid place-content-center rounded-full h-10 border text-white ${participantOpen
                ? "dark:bg-white dark:text-black bg-black/50 text-white"
                : "dark:text-white text-black"
                }`}
            >
              <MdOutlineGroupAdd className="text-xl" />
            </button>
          )}

          <button
            onClick={() => (recording ? stopRecording() : startRecording())}
            className={`w-10 grid place-content-center rounded-full h-10 border text-white 
             ${recording
                ? "dark:bg-white dark:text-black bg-black/50 text-white"
                : "dark:text-white text-black"}
              `}
          >
            <AiOutlineVideoCamera className="text-xl" />
          </button>
        </div >
      )}
    </div >
  );

  return content;
});

export default VideoCallLayout;


