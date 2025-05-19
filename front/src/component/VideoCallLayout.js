import React, { useRef } from "react";
import { AiOutlineVideoCamera } from "react-icons/ai";
import { BsCameraVideo, BsCameraVideoOff, BsChatDots } from "react-icons/bs";
import { GoUnmute } from "react-icons/go";
import { IoCallOutline, IoMicOffCircleOutline, IoMicOffOutline } from "react-icons/io5";
import { MdOutlineGroupAdd } from "react-icons/md";
import Draggable from "react-draggable";

const getParticipantWidth = (count) => {
  if (count === 1) return 'w-full';
  if (count === 2) return 'w-full';
  if (count <= 4) return 'w-1/2';
  if (count <= 6) return 'w-1/3';
  if (count <= 9) return 'w-1/3';
  return 'w-1/4';
};

const VideoCallLayout = ({
    participants,
    currentUser,
  localVideoRef,
  allUsers,
  cameraStatus,
  IMG_URL,
  endCall,
  toggleMicrophone,
  toggleCamera,
  setSelectedChatModule,
  selectedChatModule,
  isMicrophoneOn,
  isCameraOn,
  isVideoCalling,
  isVoiceCalling,
  setParticipantOpen,
  setShowFirstSection,
  cleanupConnection
}) => {

  return (
    <div className="flex-1 flex flex-col items-center justify-between p-2 md:p-4 overflow-hidden bg-black">
      {/* Participant Grid */}
      <div className="flex flex-wrap relative justify-center items-center w-full overflow-hidden h-[calc(100vh-130px)]">
       { participants.map(([participantId, stream]) => {
          const participant = allUsers.find(u => u._id === participantId);
          const isCameraEnabled = cameraStatus?.[participantId] !== false;
          const isLocalUser = participantId === currentUser;
          const widthClass = getParticipantWidth(participants.length);

          return (
            <div
              key={participantId}
              className={`${participants.length == 2 ? (isLocalUser ? "absolute bottom-8 right-8 w-40 h-28 md:w-56 md:h-36 z-20" : widthClass) : widthClass} p-2 flex items-center justify-center`}
              style={{ height: `${!(isLocalUser && participants.length == 2) ? `calc(100% / ${participants.length <= 2 ? 1 : participants.length <= 8 && participants.length >= 2 ? 2 : 3})` : ''}` }}
            >
              <div className="aspect-video relative w-full h-full bg-primary-dark rounded-xl overflow-hidden shadow-lg">
                {isCameraEnabled ? (
                  <>
                    {isLocalUser ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover rounded-xl"
                        onLoadedMetadata={() => {
                          if (localVideoRef.current) {
                            localVideoRef.current.play().catch(err =>
                              console.error("Local video error:", err)
                            );
                          }
                        }}
                      />
                    ) : (
                      <video
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover rounded-xl"
                        ref={(el) => {
                          if (el) {
                            el.srcObject = stream;
                            el.play().catch(err =>
                              console.error("Remote video error:", err)
                            );
                          }
                        }}
                      />
                    )}
                    <div className="absolute bottom-2 left-2 px-3 py-1 rounded-full text-white bg-blue-600 text-[clamp(10px,1.2vw,14px)]">
                      {isLocalUser ? "You" : participant?.userName || "Participant"}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center flex-col rounded-xl">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden">
                      {participant?.photo && participant.photo !== "null" ? (
                        <img
                          src={`${IMG_URL}${participant.photo.replace(/\\/g, "/")}`}
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
                      {participant?.userName || "Participant"} (Camera Off)
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

        <div className="p-2  w-full flex justify-center items-center space-x-3 md:space-x-4 bg-[#1A1A1A]">
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
        </div>

    </div>
      
  );
};

export default VideoCallLayout;
