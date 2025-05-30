import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { AiOutlineVideoCamera } from "react-icons/ai";
import { BsCameraVideo, BsCameraVideoOff, BsChatDots } from "react-icons/bs";
import { GoUnmute } from "react-icons/go";
import { IoCallOutline, IoMicOffCircleOutline, IoMicOffOutline } from "react-icons/io5";
import { MdOutlineGroupAdd } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { IMG_URL } from "../utils/baseUrl";
import { setParticipantOpen, setSelectedChatModule, setChatMessages, setvideoCallChatList, setCallChatList } from "../redux/slice/manageState.slice";
import { useSocket } from "../context/SocketContext";
import { LuFullscreen } from "react-icons/lu";

const getParticipantWidth = (count) => {
  if (count === 1) return 'w-full';
  if (count === 2) return 'w-full';
  if (count <= 4) return 'w-1/2';
  if (count <= 6) return 'w-1/3';
  if (count <= 9) return 'w-1/3';
  return 'w-1/4';
};

const VideoCallLayout = memo(() => {
 
  const participants = useSelector(state => state.magageState.participants);
  const selectedChat = useSelector(state => state.magageState.selectedChat);
  const selectedChatModule = useSelector(state => state.magageState.selectedChatModule);
  const isMicrophoneOn = useSelector(state => state.magageState.isMicrophoneOn);
  const isCameraOn = useSelector(state => state.magageState.isCameraOn);
  const isVideoCalling = useSelector(state => state.magageState.isVideoCalling);
  const isVoiceCalling = useSelector(state => state.magageState.isVoiceCalling);
  const cameraStatus = useSelector(state => state.magageState.cameraStatus);
  const isReceiving = useSelector(state => state.magageState.isReceiving);
  const userIncall = useSelector(state => state.magageState.userIncall);
  const chatMessages = useSelector(state => state.magageState.chatMessages);
  const participantOpen  = useSelector(state => state.magageState.participantOpen );
  const callChatList  = useSelector(state => state.magageState.callChatList );

  const { allUsers,messages } = useSelector((state) => state.user);
  const currentUser = useMemo(() => sessionStorage.getItem("userId"), []);
  const dispatch = useDispatch();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

    //===========Use the custom socket hook===========
    const {endCall,cleanupConnection, toggleCamera,toggleMicrophone} = useSocket();

  //===========Use the custom socket hook===========
  const handleMouseDown = (e) => {
    if (!chatMessages) return;

    const rect = containerRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  };

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

    setPosition({ x: constrainedX, y: constrainedY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const [ringtone] = useState(new Audio('/Ring_ring.mp3')); // Add your ringtone file to public folder
  
  // Add useEffect to handle ringtone
  useEffect(() => {
    if (participants.length == 1 && !isReceiving) {
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
  }, [isReceiving, ringtone,participants]);




    console.log("VideoCallLayout");
    // console.log(participants.length, isVoiceCalling);

  const content = (
    <div
      ref={containerRef}
      className={`flex-1 flex flex-col items-center justify-between p-2 md:p-4 overflow-hidden bg-black ${participantOpen ? 'w-[70%]' : 'w-full'}`}
      style={(chatMessages) ? {
        width: '25%',
        height: '34%',
        position: 'absolute',
        top: position.y,
        left: position.x,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        transform: 'none'
      } : {}}
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
                {userIncall &&
                <p className="mt-20 text-white text-lg font-medium text-center animate-pulse">
                  {selectedChat?.userName + ' ' + userIncall}
                </p>
                 }
              </div>
            </div>
          ) : (
            participants.length > 0 &&
            Array.from(participants)?.map(([participantId, stream]) => {
              const participant = allUsers.find((u) => u._id === participantId);
              const isLocalUser = participantId === currentUser;
              const widthClass = getParticipantWidth(participants?.length);

              return (
                <div
                  key={participantId}
                  className={`${
                    participants.length == 2
                      ? isLocalUser
                        ? "absolute bottom-8 right-8 w-40 h-28 md:w-56 md:h-36 z-20"
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
                  }}
                >
                  <div className="aspect-video relative w-full h-full bg-primary-dark rounded-xl overflow-hidden shadow-lg border border-black/20 dark:border-white/20 ">
                    <video
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover rounded-xl"
                      muted={participantId === currentUser}
                      ref={(el) => {
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
                    {userIncall &&
                    <p className="mt-20 text-white text-lg font-medium text-center animate-pulse absolute bottom-2 left-[50%] px-3 py-1">
                      {selectedChat?.userName + ' ' + userIncall}
                    </p>
                    }
                  </div>
                </div>
              );
            })
          )
        ) : (
          <>
          {(chatMessages) && (
            <div className={`absolute w-full h-full flex justify-center group items-center z-[100] transition-opacity duration-200 hover:backdrop-brightness-50`}>
              <LuFullscreen
                className="text-white cursor-pointer h-12 w-12 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                onClick={() => {
                  dispatch(setChatMessages(!chatMessages))
                  dispatch(setCallChatList(!callChatList))
                }}
              />
            </div>
          )}
         { participants.length > 0 &&
          Array.from(participants)?.map(([participantId, stream]) => {
            const participant = allUsers.find((u) => u._id === participantId);
            const isCameraEnabled = isVideoCalling
              ? cameraStatus?.[participantId] !== false
              : false;
            const isLocalUser = participantId === currentUser;
            const widthClass = getParticipantWidth(participants?.length);
            // localVideoRef.current.srcObject = isLocalUser ? stream : null

            console.log(cameraStatus, isCameraEnabled, participantId);

            return (
              <div
                key={participantId}
                className={`${
                  participants.length == 2
                    ? isLocalUser
                      ? "absolute bottom-8 right-8 w-40 h-28 md:w-56 md:h-36 z-20"
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
                }}
              >
                <div className="aspect-video relative w-full h-full bg-primary-dark rounded-xl overflow-hidden shadow-lg border border-black/20 dark:border-white/20 ">
                  {isCameraEnabled ? (
                    <>
                      <video
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover rounded-xl"
                        muted={participantId === currentUser}
                        ref={(el) => {
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
                    </>
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center flex-col rounded-xl">
                      <video
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover rounded-xl hidden"
                        muted={participantId === currentUser}
                        ref={(el) => {
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
                        {participant?.photo && participant.photo !== "null" ? (
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
                              {participant?.userName?.[0]?.toUpperCase() || "?"}
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
        <div className="p-2  w-full flex justify-center items-center space-x-3 md:space-x-4 bg-[#1A1A1A]">
          <button
            onClick={() => {
              dispatch(setSelectedChatModule(true))
              // dispatch(setvideoCallChatList(true));
              dispatch(setCallChatList(true));
              // dispatch(setChatMessages(true));
            }}
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
                setParticipantOpen(true);
                dispatch(setCallChatList(false));
              }}
              className="w-10 grid place-content-center rounded-full h-10 border text-white"
            >
              <MdOutlineGroupAdd className="text-xl" />
            </button>
          )}

          <button className="w-10 grid place-content-center rounded-full h-10 border text-white">
            <AiOutlineVideoCamera className="text-xl" />
          </button>
        </div>
      )}

    </div>
  );

  return content;
});

export default VideoCallLayout;
