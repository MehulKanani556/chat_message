// ... existing imports ...
import { MdCallEnd, MdGroupAdd } from "react-icons/md";
import { FiCamera, FiCameraOff } from "react-icons/fi";
import { BsFillMicFill, BsFillMicMuteFill } from "react-icons/bs";

// ... existing code ...

const VideoCall = () => {
    // ... existing state and functions ...

    const endCall = () => {
        if (!callAccept && selectedChat) {
            if (isVideoCalling || isVoiceCalling) {
                isVideoCalling ? rejectVoiceCall(selectedChat._id, "video") : rejectVoiceCall(selectedChat._id, "voice");
            }
        } else {
            if (isVideoCalling || isVoiceCalling) {
                isVideoCalling ? endVideoCall() : endVoiceCall();
            }
        }
        cleanupConnection();
    };

    // New VideoControls component
    const VideoControls = ({ isVideoCalling, isVoiceCalling, toggleCamera, toggleMicrophone, isCameraOn, isMicrophoneOn }) => {
        return (
            <div className="h-10 flex gap-3 mb-4 absolute bottom-1 left-1/2">
                <button
                    onClick={endCall}
                    className="bg-red-500 h-10 w-10 text-white grid place-content-center rounded-full hover:bg-red-600 transition-colors"
                >
                    <MdCallEnd className="text-xl" />
                </button>
                {(isVideoCalling || isVoiceCalling) && (
                    <>
                        

                        <button
                            onClick={toggleCamera}
                            className={`w-10 grid place-content-center rounded-full h-10 ${isCameraOn ? "bg-primary" : "bg-gray-400"} text-white ${isVideoCalling ? "" : "hidden"}`}
                        >
                            {isCameraOn ? <FiCamera className="text-xl" /> : <FiCameraOff className="text-xl" />}
                        </button>
                        <button
                            onClick={toggleMicrophone}
                            className={`w-10 grid place-content-center rounded-full h-10 ${isMicrophoneOn ? "bg-primary" : "bg-gray-400"} text-white`}
                        >
                            {isMicrophoneOn ? <BsFillMicFill className="text-xl" /> : <BsFillMicMuteFill className="text-xl" />}
                        </button>
                        <button
                            onClick={() => setParticipantOpen(true)}
                            className="w-10 grid place-content-center rounded-full h-10 bg-primary text-white hover:bg-primary/80"
                        >
                            <MdGroupAdd className="text-xl" />
                        </button>
                    </>
                )}
            </div>
        );
    };

    return (
        <>
            {/* ... existing JSX ... */}
            <div
                className={`flex-grow flex flex-col p-4 ml-16 bg-primary-light dark:bg-primary-dark scrollbar-hide ${isReceiving || isVideoCalling || isVoiceCalling || voiceCallData ? "" : "hidden"}`}
            >
                <div
                    className={`flex-1 relative ${isReceiving ? "flex items-center justify-center" : `grid gap-4 ${getGridColumns(parseInt(remoteStreams.size) + (isVideoCalling ? 1 : 0))}`}`}
                >
                    {/* Local video */}
                    <div className={` ${isVideoCalling || isVoiceCalling || voiceCallData ? "" : "hidden"} ${isReceiving ? "hidden" : ""} ${remoteStreams.size === 1 ? "max-w-30 absolute top-2 right-2 z-10" : "relative"}`}>
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-contain"
                            style={{ maxHeight: `${remoteStreams.size === 1 ? "20vh" : "100%"}` }}
                        />
                        <div className="absolute bottom-2 left-2 text-white text-xl bg-primary px-3 py-1 rounded-full text-center">You</div>
                    </div>

                    {/* Remote videos */}
                    {isReceiving ? (
                        <div className="w-full h-full">
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full max-h-[80vh] object-contain"
                            />
                        </div>
                    ) : (
                        <>
                            {Array.from(remoteStreams).map(([participantId, stream]) => {
                                const participant = allUsers.find((user) => user._id === participantId);
                                const isCameraEnabled = cameraStatus?.[participantId] !== false;

                                return (
                                    <div key={participantId} className="relative w-full">
                                        {isCameraEnabled ? (
                                            <video
                                                autoPlay
                                                playsInline
                                                className="w-full h-full object-contain max-h-[80vh]"
                                                ref={(el) => {
                                                    if (el) {
                                                        el.srcObject = stream;
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-primary-dark" style={{ maxHeight: "80vh" }}>
                                                <div className="w-32 h-32 rounded-full overflow-hidden">
                                                    {participant?.photo && participant.photo !== "null" ? (
                                                        <img
                                                            src={`${IMG_URL}${participant.photo.replace(/\\/g, "/")}`}
                                                            alt="Profile"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-500 flex items-center justify-center">
                                                            <span className="text-white text-4xl">{participant?.userName?.charAt(0).toUpperCase()}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        <div className="absolute bottom-2 left-2 text-white text-xl bg-blue-500 px-3 py-1 rounded-full text-center">
                                            {participant?.userName?.charAt(0).toUpperCase() + participant?.userName?.slice(1) || "Participant"}
                                            {!isCameraEnabled && <span className="ml-2 text-sm">(Camera Off)</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}

                    {/* Controls */}
                    {(isSharing || isReceiving || isVideoCalling || isVoiceCalling) && (
                        <VideoControls
                            isVideoCalling={isVideoCalling}
                            isVoiceCalling={isVoiceCalling}
                            toggleCamera={toggleCamera}
                            toggleMicrophone={toggleMicrophone}
                            isCameraOn={isCameraOn}
                            isMicrophoneOn={isMicrophoneOn}
                        />
                    )}
                </div>
            </div>
            {/* ... existing code ... */}
        </>
    );
};

export default VideoCall;
// ... existing exports ...