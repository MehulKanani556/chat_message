import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { IoMicOutline } from "react-icons/io5";
import { PiSmiley } from "react-icons/pi";
import { RxCross2 } from "react-icons/rx";
import { GoPlusCircle } from "react-icons/go";
import { FaPaperclip } from "react-icons/fa";
import EmojiPicker from "emoji-picker-react";
import { useDispatch, useSelector } from "react-redux";
import { useSocket } from "../context/SocketContext";
import { blockUser, getAllMessages, getAllMessageUsers, getUser } from "../redux/slice/user.slice";
import { BASE_URL, IMG_URL } from "../utils/baseUrl";
import { setBackCameraAvailable, setCameraStream, setEditingMessage, setMessageInput, setOpenCameraState, setReplyingTo, setSelectedFiles, setUploadProgress } from "../redux/slice/manageState.slice";
import axios from "axios";
import { decryptMessage } from "../utils/decryptMess";

const MessageInput = memo(
  ({
    // selectedFiles,
    // setSelectedFiles,
    handleMultipleFileUpload,
    // editingMessage,
    // setEditingMessage,
    // cameraStream,
    handleSendMessage,
    // openCamera,
    setIsDeleteChatModalOpen,
  }) => {

    //===========Use the custom socket hook===========
    const { sendTypingStatus, sendGroupMessage } = useSocket();

    const dispatch = useDispatch();
    const { allUsers, user } = useSelector((state) => state.user);

    const selectedChat = useSelector(state => state.magageState.selectedChat);
    const uploadProgress = useSelector(state => state.magageState.uploadProgress);
    const selectedFiles = useSelector(state => state.magageState.selectedFiles);
    const replyingTo = useSelector(state => state.magageState.replyingTo);
    const cameraStream = useSelector(state => state.magageState.cameraStream);
    const messageInput = useSelector(state => state.magageState.messageInput);
    const editingMessage = useSelector(state => state.magageState.editingMessage);
    const facingMode = useSelector(state => state.magageState.facingMode);

    // const [messageInput, setMessageInput] = useState("");
    const emojiPickerRef = useRef(null);
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    let typingTimeout;
    const [waveformData, setWaveformData] = useState([]);
    // Add state to manage recording
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioChunks, setAudioChunks] = useState([]);
    const [recordingTime, setRecordingTime] = useState(0); // State to hold recording time
    const [docModel, setDocModel] = useState(false);
    const [currentUser] = useState(sessionStorage.getItem("userId"));
    const inputRef = useRef(null);


    console.log(messageInput, "messageInput");


    useEffect(() => {
      if (inputRef.current && replyingTo) {
        inputRef.current.focus();
      }
    }, [replyingTo, messageInput, editingMessage])


    const handleInputChange = (e) => {
      const files = e.target.files;

      if (files && files.length > 0) {
        const filesArray = Array.from(files);
        dispatch(setSelectedFiles([...selectedFiles, ...filesArray]));
        return;
      }

      // console.log("e.target.value", e.target.value);
      dispatch(setMessageInput(e.target.value));

      if (selectedChat) {
        if (typingTimeout) clearTimeout(typingTimeout);

        typingTimeout = setTimeout(() => {
          sendTypingStatus(selectedChat._id, true);
        }, 2000); // Wait 3 seconds after last input
      }
    };

    //======== Audio recording=========

    // Timer effect for recording
    useEffect(() => {
      let interval = null;
      if (isRecording) {
        interval = setInterval(() => {
          setRecordingTime((prev) => prev + 1); // Increment recording time every second
        }, 1000);
      } else {
        setRecordingTime(0); // Reset recording time when not recording
      }
      return () => clearInterval(interval); // Cleanup on unmount
    }, [isRecording]);

    const handleVoiceMessage = async () => {
      if (!isRecording) {
        // Start recording
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              noiseSuppression: true,
              echoCancellation: true,
              sampleRate: 44100, // Set sample rate for better quality
            },
          });
          const recorder = new MediaRecorder(stream);
          const chunks = [];

          recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              chunks.push(event.data);
            }
          };

          recorder.onstop = async () => {
            stopRecording();
            const audioBlob = new Blob(chunks, { type: "audio/webm" }); // Change to 'audio/webm' for better quality
            // console.log("Audio Blob:", audioBlob);

            // Dispatch the audio message
            if (selectedChat) {
              const data = {
                type: "file", // Determine the type based on input
                content: audioBlob, // The actual content of the message
              };
              // console.log("add", audioBlob);

              // Use the same upload logic as for other files
              const formData = new FormData();
              formData.append("file", audioBlob);

              try {
                const response = await axios.post(
                  `${BASE_URL}/upload`,
                  formData,
                  {
                    headers: {
                      "Content-Type": "multipart/form-data",
                      Authorization: `Bearer ${sessionStorage.getItem("token")}`,
                    },
                  }
                );

                if (response.status === 200) {
                  const { fileUrl, fileType } = response.data;

                  await handleSendMessage({
                    type: "file",
                    content: "Audio Message",
                    fileUrl: fileUrl,
                    fileType: fileType || "audio/webm", // Update file type accordingly
                    size: `${(audioBlob.size / (1024 * 1024)).toFixed(2)} MB`,
                  });
                }
              } catch (error) {
                console.error("Error uploading audio message:", error);
              }
            }
            // Reset audio chunks
            setAudioChunks([]);
            // Stop the audio stream to release the microphone
            stream.getTracks().forEach((track) => track.stop());
            setRecordingTime(0);
          };

          recorder.start();
          setMediaRecorder(recorder);
          setIsRecording(true);
        } catch (error) {
          console.error("Error accessing microphone:", error);
        }
      } else {
        // Stop recording
        mediaRecorder.stop();
        setIsRecording(false);
      }
    };


    //   =============

    const [recording, setRecording] = useState(false);
    const [audioURL, setAudioURL] = useState('');

    const [animationPhase, setAnimationPhase] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animationRef = useRef(null);
    const chunksRef = useRef([]);
    // For storing cumulative data
    const cumulativeDataRef = useRef([]);

    useEffect(() => {
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };
    }, []);

    // Start recording function
    const startRecording = async () => {
      try {
        // Reset cumulative data
        cumulativeDataRef.current = [];
        setWaveformData([]);

        // Get user's audio stream
        console.log(navigator)
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Set up audio context and analyser
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 2048; // Larger FFT for more detailed data

        // Connect audio source to analyser
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);

        // Start visualization and data collection
        collectAudioData();

        // Set up media recorder
        mediaRecorderRef.current = new MediaRecorder(stream);
        chunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(audioBlob);
          setAudioURL(audioUrl);
        };

        // Start recording
        mediaRecorderRef.current.start(100); // Collect chunks every 100ms
        setRecording(true);
      } catch (error) {
        console.error('Error accessing microphone:', error);
      }
    };

    const stopRecording = () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        cancelAnimationFrame(animationRef.current);
        setRecording(false);
      }
    };
    const collectAudioData = () => {
      if (!analyserRef.current) return;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let frameCount = 0;

      const updateVisualData = () => {
        frameCount++;
        if (frameCount % 2 !== 0) {
          animationRef.current = requestAnimationFrame(updateVisualData);
          return;
        }
        analyserRef.current.getByteTimeDomainData(dataArray);

        // Calculate RMS (root mean square) value to represent volume
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          const normalized = (dataArray[i] / 128.0) - 1.0;
          sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / bufferLength);

        // Scale RMS with a quadratic function for more dynamic range
        const scaledRMS = Math.min(100, Math.max(12, rms * rms * 700));

        // Add this data point to our cumulative collection
        cumulativeDataRef.current.push(scaledRMS);

        // Keep a fixed number of data points
        if (cumulativeDataRef.current.length > 170) {
          cumulativeDataRef.current = cumulativeDataRef.current.slice(-170);
        }

        // Update state with the latest cumulative data
        setWaveformData([...cumulativeDataRef.current]);

        // Continue collecting data
        animationRef.current = requestAnimationFrame(updateVisualData);
      };

      updateVisualData();
    };
    const generateBarHeights = () => {
      if (waveformData.length > 0) {
        return waveformData;
      }

      // Generate idle animation that looks more like the reference image
      const barCount = 200;
      const idleData = [];

      for (let i = 0; i < barCount; i++) {
        // Create a pattern that mimics an audio waveform with varying heights
        const baseHeight = 15;
        const variation = 30;

        // Multiple sine waves with different frequencies and amplitudes
        const wave1 = Math.sin((i / 4) + animationPhase) * variation * 0.4;
        const wave2 = Math.sin((i / 7) + animationPhase * 1.3) * variation * 0.6;
        const wave3 = Math.sin((i / 3) + animationPhase * 0.7) * variation * 0.3;

        // Combine waves and ensure minimum height
        const waveHeight = baseHeight + Math.abs(wave1 + wave2 + wave3);
        idleData.push(waveHeight);
      }

      return idleData;
    };
    const barHeights = generateBarHeights();


    // ================


    const handleUnblock = useCallback(async () => {
      await dispatch(blockUser({ selectedUserId: selectedChat?._id }));
      await dispatch(getUser(currentUser));
      await dispatch(getAllMessageUsers());
    }, [dispatch, selectedChat, currentUser]);

    const handleKeyDown = async (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (selectedFiles.length > 0) {
          await handleMultipleFileUpload(selectedFiles);
          dispatch(setSelectedFiles([]));
        }
        await handleSubmit(e);
      } else if (e.key === "Escape" && editingMessage) {
        dispatch(setEditingMessage(null));
        dispatch(setMessageInput(""));
      }
    };


    const handleSubmit = (e) => {
      e.preventDefault();
      console.log("messageInput", messageInput);
      const data = {
        type: messageInput instanceof FileList ? "file" : "text",
        content: messageInput,

      };

      if (replyingTo) {
        data.replyTo = replyingTo
      }

      if (selectedChat && selectedChat?.members?.length > 0) {
        handleSendGroupMessage(data); // Send group message
      } else if (data.type === "file") {
        handleMultipleFileUpload(messageInput);
      } else if (data.type === "text") {
        handleSendMessage(data);
      }
      dispatch(setMessageInput(""));
    };

    //===========handle send group message===========
    const handleSendGroupMessage = useCallback(async (data) => {
      if (data.content.trim() === "") return;

      try {
        await sendGroupMessage(selectedChat._id, data);
        dispatch(getAllMessages({ selectedId: selectedChat._id })); // Refresh messages if needed
      } catch (error) {
        console.error("Failed to send group message:", error);
      }
    }, []);

    //=========== emoji picker ===========
    const onEmojiClick = (event, emojiObject) => {
      console.log(event.emoji);
      
      dispatch(setMessageInput(messageInput + event.emoji));
    };

    //===========emoji picker===========
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          emojiPickerRef.current &&
          !emojiPickerRef.current.contains(event.target)
        ) {
          setIsEmojiPickerOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);


    useEffect(() => {
      const handleClickOutside = (event) => {
        if ((docModel) && !event.target.closest(".optionMenu")) {
          setDocModel(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [docModel]);



    // ====================================return======================================  
    if (!selectedChat) return null;

    if (user.blockedUsers?.includes(selectedChat._id)) {
      return (
        <div className="w-full mx-auto px-4 py-2 mb-5 md:mb-0 dark:bg-primary-dark/95 text-white">
          <div className="text-center text-red-700 mb-2">
            This user is blocked.
          </div>
          <div className="flex justify-center items-center gap-4 mb-4">
            <button
              className="bg-primary dark:hover:bg-primary/70 py-1 rounded-md w-32"
              onClick={() => setIsDeleteChatModalOpen(true)}
            >
              Delete
            </button>
            <button
              className="bg-primary dark:hover:bg-primary/70 py-1 rounded-md w-32"
              onClick={handleUnblock}
            >
              Unblock
            </button>
          </div>
        </div>
      );
    }

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

    return (
      <div className="w-full mx-auto px-4 py-3 mb-5 md:mb-0 dark:bg-[#1A1A1A]">

        <form
          onSubmit={handleSubmit}
          className={`flex items-center gap-2 ${replyingTo || selectedFiles?.length > 0
            ? "rounded-b-lg"
            : "rounded-lg"
            } md:px-4 md:py-2 w-full max-w-full`}
        >

          {isRecording ?
            <>
              <div>
                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors bg-primary  dark:text-white dark:hover:bg-primary dark:hover:text-black"
                  aria-label="Voice message"
                  onClick={handleVoiceMessage}
                >
                  <IoMicOutline
                    className={`w-6 h-6 ${isRecording ? "text-white" : ""
                      }`}
                  />
                </button>

              </div>

              <div className="flex-1">
                <div className=" w-full h-9 rounded-lg px-4  overflow-hidden">
                  <div className="flex items-center justify-start h-full w-full relative">
                    <div className="flex items-center  gap-1 h-full absolute">
                      {barHeights.map((height, index) => {
                        // Calculate a height that centers around the middle
                        const variationFactor = recording ? 1 : 0.6;
                        const barHeight = height * variationFactor;

                        return (
                          <div
                            key={index}
                            className="flex flex-col justify-center h-full"
                          >
                            <div
                              style={{
                                width: '3px',
                                height: `${barHeight * 2}%`,
                                marginTop: `-${barHeight / 2}%`
                              }}
                              className="bg-black dark:bg-white rounded-xl"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <div className=" text-black/60 dark:text-white/60  me-3 text-sm">
                {isRecording && <span>{new Date(recordingTime * 1000).toISOString().substr(14, 5)}</span>} {/* Display recording time in mm:ss format */}
              </div>
            </>

            : ''}


          {!isRecording && (
            <>
              <div className="flex-1">
                {replyingTo && (
                  <div className="w-full dark:bg-primary-dark/15">
                    <div className="bg-gray-100 dark:bg-primary-dark/15 p-3 rounded-t-lg flex justify-between items-start border-l-4 border-blue-500">
                      <div>
                        <div className="text-sm text-blue-500 font-medium">
                          Replying to{" "}
                          {
                            allUsers.find(
                              (user) => user._id === replyingTo.sender
                            )?.userName
                          }
                        </div>
                        <div className="text-gray-600 text-sm line-clamp-2">
                          {decryptMessage(replyingTo.content.content)}
                          {replyingTo?.content?.fileType &&
                            replyingTo?.content?.fileType?.startsWith(
                              "image/"
                            ) && (
                              <img
                                src={`${IMG_URL}${replyingTo.content.fileUrl.replace(
                                  /\\/g,
                                  "/"
                                )}`}
                                alt=""
                                className="h-10"
                              />
                            )}
                        </div>
                      </div>
                      <button
                        onClick={() => dispatch(setReplyingTo(null))}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <RxCross2 size={20} />
                      </button>
                    </div>
                  </div>
                )}
                {Object.keys(uploadProgress).length != 0 && (
                  <div className="w-full dark:bg-primary-dark/15">
                    <div className="bg-gray-100 dark:bg-primary-dark/15 p-3 rounded-t-lg flex justify-between items-start border-l-4 border-blue-500">
                      <div className="flex justify-between w-full">
                        <div className="w-full">
                          {Object.keys(uploadProgress).map((file, index) => (
                            <div key={index} className="">
                              <div className="flex gap-2 items-center">
                                <div>
                                  {uploadProgress[file].fileType?.startsWith('image/') ? (
                                    <img src={require('../img/img.png')} className="w-[20px] h-[20px]" alt="" />
                                  ) : uploadProgress[file].fileType === 'application/pdf' ? (
                                    <img src={require('../img/pdf.png')} className="w-[20px] h-[20px]" alt="" />
                                  ) : uploadProgress[file].fileType?.includes('video/') ? (
                                    <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#afafaf" gradientcolor1="#afafaf" gradientcolor2="#afafaf" >
                                      <path d="M3.5 21h17c.275 0 .5-.225.5-.5v-17c0-.275-.225-.5-.5-.5h-17c-.275 0-.5.225-.5.5v17c0 .275.225.5.5.5Z" fill="#fff" ></path>
                                      <path opacity="0.64" fillRule="evenodd" clipRule="evenodd" d="M3.5 22h17c.827 0 1.5-.673 1.5-1.5v-17c0-.827-.673-1.5-1.5-1.5h-17C2.673 2 2 2.673 2 3.5v17c0 .827.673 1.5 1.5 1.5ZM3 3.5a.5.5 0 0 1 .5-.5h17a.5.5 0 0 1 .5.5v17a.5.5 0 0 1-.5.5h-17a.5.5 0 0 1-.5-.5v-17Z" fill="#605E5C"></path>
                                      <path d="M16 12a.47.47 0 0 1-.24.4l-6 3.53a.48.48 0 0 1-.26.07.5.5 0 0 1-.24-.06.46.46 0 0 1-.26-.41V12h7Z" fill="#BC1948"></path>
                                      <path d="M16 12a.47.47 0 0 0-.24-.4l-6-3.536a.52.52 0 0 0-.5 0 .46.46 0 0 0-.26.4V12h7Z" fill="#E8467C"></path>
                                    </svg>
                                  ) : uploadProgress[file].fileType?.includes('audio/') ? (
                                    <img src={require('../img/audio.png')} className="w-[20px] h-[20px]" alt="" />
                                  ) : uploadProgress[file].fileType == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ? (
                                    <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#afafaf">
                                      <path d="M21.167 3H7.82a.82.82 0 0 0-.82.82v3.17l7.5 2.194L22 6.99V3.833A.836.836 0 0 0 21.167 3" fill="#41A5EE"></path>
                                      <path d="M22 7H7v5l7.5 2.016L22 12V7Z" fill="#2B7CD3"></path>
                                      <path d="M22 12H7v5l8 2 7-2v-5Z" fill="#185ABD"></path>
                                      <path d="M22 17H7v3.177c0 .455.368.823.823.823h13.354a.822.822 0 0 0 .823-.823V17Z" fill="#103F91"></path>
                                    </svg>
                                  ) : uploadProgress[file].fileType == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ? (
                                    <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#afafaf">
                                      <path d="M15 3H7.8c-.442 0-.8.298-.8.667V7l8 5 3.5 1.5L22 12V7l-7-4Z" fill="#21A366"></path>
                                      <path d="M7 12h8V7H7v5Z" fill="#107C41"></path>
                                      <path d="M22 3.82V7h-7V3h6.17c.46 0 .83.37.83.82" fill="#33C481"></path>
                                      <path d="M15 12H7v8.167c0 .46.373.833.833.833h13.334c.46 0 .833-.373.833-.833V17l-7-5Z" fill="#185C37"></path>
                                    </svg>
                                  ) : uploadProgress[file].fileType == "application/vnd.openxmlformats-officedocument.presentationml.presentation" ? (
                                    <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#afafaf">
                                      <path d="M13 3c-4.95 0-9 4.05-9 9l11 1.5L13 3Z" fill="#ED6C47"></path>
                                      <path d="M13 3c4.95 0 9 4.05 9 9l-4.5 2-4.5-2V3Z" fill="#FF8F6B"></path>
                                      <path d="M22 12c0 4.95-4.05 9-9 9s-9-4.05-9-9h18Z" fill="#D35230"></path>
                                    </svg>
                                  ) : uploadProgress[file].fileType?.includes('zip') || uploadProgress[file].fileType?.includes('compressed') ? (
                                    <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#afafaf">
                                      <path d="m12 6-1.268-1.268A2.5 2.5 0 0 0 8.964 4H2.5A1.5 1.5 0 0 0 1 5.5v13A1.5 1.5 0 0 0 2.5 20h19a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 21.5 6H12Z" fill="#FFB900"></path>
                                    </svg>
                                  ) : (
                                    <FaPaperclip className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                                <div>
                                  {console.log(uploadProgress)}

                                  <div className="text-white text-sm line-clamp-2 ">
                                    {file}
                                  </div>
                                  <div className="text-sm text-gray-500 hover:text-gray-700">
                                    {uploadProgress[file].size}
                                  </div>
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <div className="w-full bg-gray-200 h-[8px] dark:bg-gray-700 rounded-full overflow-hidden flex">
                                  <div
                                    className="bg-blue-600 h-[8px] rounded-full"
                                    style={{ width: `${uploadProgress[file].percentCompleted}%` }}
                                  ></div>
                                </div>
                                <div className="ml-2 text-sm text-gray-500 hover:text-gray-700">
                                  {uploadProgress[file].percentCompleted}%
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => dispatch(setUploadProgress({}))}
                          className="text-gray-500 hover:text-gray-700 ml-4"
                        >
                          <RxCross2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <div className={`flex-1 min-w-0 p-1 md:p-2 ${replyingTo || Object.keys(uploadProgress).length != 0 ? 'rounded-b-md' : 'rounded-md'} bg-[#e5e7eb] dark:text-white dark:bg-white/10 relative`}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={messageInput}
                    onChange={handleInputChange}
                    placeholder={
                      editingMessage
                        ? "Edit message..."
                        : "Type a message..."
                    }
                    className="px-9 md:ps-2 w-full md:px-2 py-1 outline-none text-black dark:text-white bg-transparent"
                    onKeyDown={async (e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();

                        if (selectedFiles.length > 0) {
                          await handleMultipleFileUpload(
                            selectedFiles
                          ); // Upload selected files
                          dispatch(setSelectedFiles([])); // Clear selected files after sending
                        }
                        await handleSubmit(e);
                      } else if (
                        e.key === "Escape" &&
                        editingMessage
                      ) {
                        dispatch(setEditingMessage(null));
                        dispatch(setMessageInput(""));
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="absolute top-1/2 left-1 block md:hidden -translate-y-1/2 p-1  hover:bg-gray-100 dark:text-white dark:hover:bg-primary dark:hover:text-black rounded-full transition-colors flex-shrink-0"
                    aria-label="Add emoji"
                    onClick={() =>
                      setIsEmojiPickerOpen(!isEmojiPickerOpen)
                    }
                  >
                    <PiSmiley className="w-6 h-6 " />
                  </button>
                  <button
                    type="button"
                    className="p-1 absolute top-1/2 right-1 block md:hidden -translate-y-1/2 hover:bg-gray-100 rounded-full transition-colors dark:text-white dark:hover:bg-primary dark:hover:text-black"
                    aria-label="Attach file"
                    onClick={() =>
                      // document
                      //   .getElementById("file-upload")
                      //   .click()
                      setDocModel(!docModel)

                    }
                  >
                    {selectedFiles &&
                      selectedFiles.length > 0 ? (
                      <GoPlusCircle className="w-6 h-6 " />
                    ) : (
                      <svg
                        width={24}
                        height={24}
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-6 h-6"
                      >
                        <path
                          d="M11.9688 12V15.5C11.9688 17.43 13.5388 19 15.4688 19C17.3987 19 18.9688 17.43 18.9688 15.5V10C18.9688 6.13 15.8388 3 11.9688 3C8.09875 3 4.96875 6.13 4.96875 10V16C4.96875 19.31 7.65875 22 10.9688 22"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="p-1 hover:bg-gray-100 hidden md:block dark:text-white dark:hover:bg-primary dark:hover:text-black rounded-full transition-colors flex-shrink-0"
                aria-label="Add emoji"
                onClick={() =>
                  setIsEmojiPickerOpen(!isEmojiPickerOpen)
                }
              >
                <PiSmiley className="w-6 h-6 " />
              </button>
            </>
          )}

          {isEmojiPickerOpen && (
            <div
              ref={emojiPickerRef}
              className="absolute rounded shadow-lg bottom-[90px] right-[100px] z-50"
            >
              <EmojiPicker
                onEmojiClick={onEmojiClick}
                previewConfig={{
                  showPreview: false,
                }}
              >
              </EmojiPicker>
            </div>
          )}

          <div className="flex items-center gap-1 flex-shrink-0">
            {!isRecording &&
              <>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="*/*"
                  className="hidden"
                  onChange={handleInputChange}
                />
                <input
                  id="image-upload"
                  type="file"
                  multiple
                  accept=".jpg, .jpeg, .png, .mp4, .avi, .mov, .gif, .heic, .webp, .svg, .m4v"
                  className="hidden"
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="p-1 hover:bg-gray-100  hidden md:block rounded-full transition-colors dark:text-white dark:hover:bg-primary dark:hover:text-black"
                  aria-label="Attach file"
                  onClick={() =>
                    // document
                    //   .getElementById("file-upload")
                    //   .click()
                    setDocModel(!docModel)

                  }
                >
                  {selectedFiles &&
                    selectedFiles.length > 0 ? (
                    <GoPlusCircle className="w-6 h-6 " />
                  ) : (
                    <svg
                      width={24}
                      height={24}
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-6 h-6"
                    >
                      <path
                        d="M11.9688 12V15.5C11.9688 17.43 13.5388 19 15.4688 19C17.3987 19 18.9688 17.43 18.9688 15.5V10C18.9688 6.13 15.8388 3 11.9688 3C8.09875 3 4.96875 6.13 4.96875 10V16C4.96875 19.31 7.65875 22 10.9688 22"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  className={`${selectedFiles.length > 0 || messageInput || cameraStream ? 'hidden md:block' : 'block md:block'} p-1 hover:bg-gray-100 rounded-full transition-colors dark:text-white dark:hover:bg-primary dark:hover:text-black`}
                  aria-label="Voice message"
                  onClick={() => { handleVoiceMessage(); startRecording() }}
                >
                  <IoMicOutline
                    className={`w-6 h-6 ${isRecording ? "text-red-500" : ""
                      }`}
                  />
                </button>
              </>
            }
            <button
              type="submit"
              className={`${selectedFiles.length > 0 || messageInput || cameraStream || isRecording ? 'block md:block' : 'hidden md:block'} p-1 hover:bg-gray-100 rounded-full transition-colors text-xl text-primary dark:hover:bg-primary dark:hover:text-black`}
              onClick={() => {
                if (selectedFiles.length > 0) {
                  handleMultipleFileUpload(selectedFiles); // Upload selected files
                  dispatch(setSelectedFiles([])); // Clear selected files after sending
                }
                if (isRecording) {
                  handleVoiceMessage();
                }
              }}
            >
              <svg
                width={20}
                height={20}
                x={0}
                y={0}
                viewBox="0 0 32 32"
                style={{
                  enableBackground: "new 0 0 24 24",
                }}
                xmlSpace="preserve"
                className
              >
                <g>
                  <path
                    d="M28.986 3.014a3.415 3.415 0 0 0-3.336-.893L4.56 7.77a3.416 3.416 0 0 0-2.55 3.066 3.415 3.415 0 0 0 2.041 3.426l8.965 3.984c.329.146.59.408.737.738l3.984 8.964a3.41 3.41 0 0 0 3.426 2.04 3.416 3.416 0 0 0 3.066-2.55l5.65-21.089a3.416 3.416 0 0 0-.893-3.336zm-7.98 24.981c-.493.04-1.133-.166-1.442-.859 0 0-4.066-9.107-4.105-9.181l5.152-5.152a1 1 0 1 0-1.414-1.414l-5.152 5.152c-.073-.04-9.181-4.105-9.181-4.105-.693-.309-.898-.947-.86-1.442.04-.495.342-1.095 1.074-1.29C5.543 9.63 26.083 3.975 26.55 4c.379 0 .742.149 1.02.427.372.372.513.896.377 1.404l-5.651 21.09c-.196.732-.796 1.035-1.29 1.073z"
                    fill="currentColor"
                    opacity={1}
                    data-original="#000000"
                    className
                  />
                </g>
              </svg>
            </button>
            {docModel && (
              <div className="optionMenu absolute right-5 bottom-14 bg-white dark:bg-gray-800 shadow-lg rounded-md p-2 z-10 min-w-36 dark:text-white " onClick={() => setDocModel(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <ul className="dark:text-white  flex flex-col ">
                    <li className="flex gap-2 items-center  hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-2 rounded-md cursor-pointer" onClick={() => { openCamera(); setDocModel(false); }}>
                      <span className="w-5">
                        <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} x={0} y={0} viewBox="0 0 512 512" style={{ enableBackground: 'new 0 0 512 512' }} xmlSpace="preserve" className><g><path fill="#477b9e" d="M431.159 118.263v-9.562c0-24.511-19.968-44.566-44.374-44.566H253.843c-24.406 0-44.374 20.055-44.374 44.566v9.562z" opacity={1} data-original="#477b9e" /><path fill="#3f6d8e" d="M311.846 64.135h-58.003c-24.406 0-44.374 20.055-44.374 44.566v9.562h58.003v-9.562c-.001-24.511 19.968-44.566 44.374-44.566zM136.449 179.924v223.208c0 15.71-12.854 28.564-28.564 28.564h375.551c15.71 0 28.564-12.854 28.564-28.564V179.924z" opacity={1} data-original="#3f6d8e" /><path fill="#365e7d" d="M191.656 403.133V179.924h-55.207v223.208c0 15.71-12.854 28.564-28.564 28.564h55.207c15.71.001 28.564-12.853 28.564-28.563z" opacity={1} data-original="#365e7d" className /><path fill="#b5dcff" d="M483.436 118.03H107.885c15.711 0 28.564 12.854 28.564 28.564v35.391H512v-35.391c0-15.71-12.853-28.564-28.564-28.564z" opacity={1} data-original="#b5dcff" /><path fill="#b5dcff" d="M483.436 118.03H107.885c15.711 0 28.564 12.854 28.564 28.564v35.391H512v-35.391c0-15.71-12.853-28.564-28.564-28.564z" opacity={1} data-original="#b5dcff" /><path fill="#8bcaff" d="M163.092 118.03h-55.207c15.711 0 28.564 12.854 28.564 28.564v35.391h55.207v-35.391c0-15.71-12.854-28.564-28.564-28.564z" opacity={1} data-original="#8bcaff" /><path fill="#477b9e" d="M94.406 77.486H44.104c-7.114 0-12.935 5.846-12.935 12.991v14.795c0 7.145 5.821 12.991 12.935 12.991h50.302c7.114 0 12.935-5.846 12.935-12.991V90.477c-.001-7.145-5.821-12.991-12.935-12.991z" opacity={1} data-original="#477b9e" /><path fill="#3f6d8e" d="M69.255 105.272V90.477c0-7.145 5.821-12.991 12.935-12.991H44.104c-7.114 0-12.935 5.846-12.935 12.991v14.795c0 7.145 5.821 12.991 12.935 12.991H82.19c-7.115 0-12.935-5.846-12.935-12.991z" opacity={1} data-original="#3f6d8e" /><path fill="#477b9e" d="M0 179.924v223.208c0 15.71 12.854 28.564 28.564 28.564h81.381c15.71 0 28.564-12.854 28.564-28.564V179.924z" opacity={1} data-original="#477b9e" /><path fill="#3f6d8e" d="M51.695 403.133V179.924H0v223.208c0 15.71 12.854 28.564 28.564 28.564h51.695c-15.71.001-28.564-12.853-28.564-28.563z" opacity={1} data-original="#3f6d8e" /><path fill="#dbedff" d="M109.945 118.03H28.564C12.854 118.03 0 130.884 0 146.594v35.391h138.51v-35.391c0-15.71-12.854-28.564-28.565-28.564z" opacity={1} data-original="#dbedff" /><path fill="#b5dcff" d="M80.259 118.03H28.564C12.854 118.03 0 130.884 0 146.594v35.391h51.695v-35.391c0-15.71 12.854-28.564 28.564-28.564z" opacity={1} data-original="#b5dcff" /><path fill="#365e7d" d="M320.314 447.866c-82.219 0-149.109-66.89-149.109-149.109s66.89-149.109 149.109-149.109 149.109 66.89 149.109 149.109-66.891 149.109-149.109 149.109z" opacity={1} data-original="#365e7d" className /><path fill="#294b64" d="M221.27 298.757c0-73.689 53.735-135.055 124.076-146.996a149.48 149.48 0 0 0-25.032-2.113c-82.219 0-149.109 66.89-149.109 149.109s66.89 149.109 149.109 149.109c8.53 0 16.891-.73 25.032-2.112-70.341-11.942-124.076-73.308-124.076-146.997z" opacity={1} data-original="#294b64" className /><circle cx="320.314" cy="298.757" r="116.772" fill="#7fb3fa" transform="rotate(-45 320.284 298.838)" opacity={1} data-original="#7fb3fa" className /><path fill="#64a6f4" d="M253.607 298.757c0-55.797 39.341-102.571 91.739-114.061a116.755 116.755 0 0 0-25.032-2.71c-64.389 0-116.772 52.384-116.772 116.772S255.926 415.53 320.314 415.53c8.591 0 16.965-.941 25.032-2.71-52.398-11.492-91.739-58.266-91.739-114.063z" opacity={1} data-original="#64a6f4" className /><circle cx="320.314" cy="298.757" r="71.576" fill="#64a6f4" transform="rotate(-45 320.284 298.838)" opacity={1} data-original="#64a6f4" className /><path fill="#3d8bd8" d="M298.803 298.757c0-30.664 19.387-56.877 46.544-67.049a71.225 71.225 0 0 0-25.033-4.527c-39.467 0-71.576 32.109-71.576 71.576s32.109 71.576 71.576 71.576a71.23 71.23 0 0 0 25.033-4.527c-27.157-10.172-46.544-36.385-46.544-67.049z" opacity={1} data-original="#3d8bd8" /><circle cx="320.314" cy="298.757" r="21.813" fill="#9cc5fa" transform="rotate(-45 320.284 298.838)" opacity={1} data-original="#9cc5fa" /><path fill="#7fb3fa" d="M320.314 298.757c0-8.053 4.398-15.083 10.907-18.862a21.655 21.655 0 0 0-10.907-2.951c-12.028 0-21.813 9.785-21.813 21.813s9.786 21.813 21.813 21.813c3.975 0 7.694-1.086 10.907-2.952-6.509-3.778-10.907-10.808-10.907-18.861z" opacity={1} data-original="#7fb3fa" className /></g></svg>
                      </span>
                      <span>Camera</span>
                    </li>
                    <li className="flex gap-2 items-center hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-2 rounded-md cursor-pointer" onClick={() => { document.getElementById("image-upload").click(); setDocModel(false); }}>
                      <span className="w-5">
                        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlnsXlink="http://www.w3.org/1999/xlink" width={22} height={22} x={0} y={0} viewBox="0 0 64 64" style={{ enableBackground: 'new 0 0 512 512' }} xmlSpace="preserve" className><g><path fill="#29afea" d="M44.8 13.5h4.7c2.6 0 4.7 2.1 4.7 4.7v27.6c0 2.6-2.1 4.7-4.7 4.7h-35c-2.6 0-4.7-2.1-4.7-4.7V18.2c0-2.6 2.1-4.7 4.7-4.7h4.7z" opacity={1} data-original="#29afea" className /><path fill="#436dcd" d="M9.8 43.4 26 36.6c1.5-.6 3.3-.3 4.4 1 1.3 1.4 3.3 1.7 4.9.7L46 31.6c1.3-.8 3-.8 4.3.1l4 2.7v11.5c0 2.6-2.1 4.6-4.6 4.6H14.4c-2.6 0-4.6-2.1-4.6-4.6z" opacity={1} data-original="#436dcd" /><circle cx={24} cy={24} r={4} fill="#cdecfa" opacity={1} data-original="#cdecfa" /></g></svg>

                      </span>
                      <span className="text-nowrap">
                        Photo & Video
                      </span>
                    </li>
                    <li className="flex gap-2 items-center  hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-2 rounded-md cursor-pointer" onClick={() => { document.getElementById("file-upload").click(); setDocModel(false) }}>
                      <span className="w-5"><svg width={20} height={20} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16.0359 5.92891V17.8398C16.0359 18.4797 15.5156 19 14.8758 19H4.16016C3.52031 19 3 18.4797 3 17.8398V2.16016C3 1.52031 3.52031 1 4.16016 1H11.107L16.0359 5.92891Z" fill="#518FF5" />
                        <path d="M6.18457 10.0371H12.8502V10.7789H6.18457V10.0371ZM6.18457 11.6895H12.8502V12.4313H6.18457V11.6895ZM6.18457 13.3453H12.8502V14.0871H6.18457V13.3453ZM6.18457 14.9977H10.9271V15.7395H6.18457V14.9977Z" fill="white" />
                        <path d="M11.7803 5.74258L16.0377 9.19141V5.95L13.626 4.55078L11.7803 5.74258Z" fill="black" fillOpacity="0.0980392" />
                        <path d="M16.0363 5.92891H12.2676C11.6277 5.92891 11.1074 5.40859 11.1074 4.76875V1L16.0363 5.92891Z" fill="#A6C5FA" />
                      </svg>

                      </span> <span>Document</span></li>
                  </ul>
                </div>
              </div>
            )}

          </div>
          {editingMessage && (
            <button
              onClick={() => {
                dispatch(setEditingMessage(null));
                dispatch(setMessageInput(""));
              }}
              className="ml-2 text-gray-500"
            >
              Cancel
            </button>
          )}
        </form>
      </div>
    );
  }
);

// MessageInput.displayName = "MessageInput";

export default MessageInput;
