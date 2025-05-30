import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FaPhone,
  FaRegSmile,
  FaDownload,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileAudio,
  FaFile,
  FaArrowDown,
  FaSearch,
} from "react-icons/fa";
import { MdOutlineCallMade, MdOutlineCallReceived, MdOutlineContentCopy, MdOutlineFlipCameraIos, MdPhoneEnabled } from "react-icons/md";
import { GoDeviceCameraVideo, GoDotFill } from "react-icons/go";
import { BiShare, BiReply } from "react-icons/bi";
import { VscCopy, VscEye } from "react-icons/vsc";
import { MdOutlineModeEdit } from "react-icons/md";
import { CiSquareRemove } from "react-icons/ci";
import {
  IoCheckmarkCircleOutline,
  IoCheckmarkDoneCircleOutline,
  IoCheckmarkDoneCircle,
} from "react-icons/io5";
import {
  PiDotsThreeCircleVerticalBold,
  PiDotsThreeVerticalBold,
} from "react-icons/pi";
import { FiEdit2 } from "react-icons/fi";
import { SlActionUndo } from "react-icons/sl";
import EmojiPicker, { EmojiStyle } from "emoji-picker-react";
import AudioPlayer from "./AudioPlayer";
import { FaRegClock } from "react-icons/fa";
import { IMG_URL } from "../utils/baseUrl";
import { HiOutlinePhoneMissedCall } from "react-icons/hi";
import { LuForward, LuReply } from "react-icons/lu";
import { decryptMessage } from "../utils/decryptMess";
import usePdfThumbnail from "../hooks/usePdfThumbnail";
import useExcelThumbnail from "../hooks/useExcelThumbnail";
import usePptThumbnail from "../hooks/usePptThumbnail";
import useWordThumbnail from "../hooks/useWordThumbnail";
import { useDispatch, useSelector } from "react-redux";
import { setCameraStream, setEditingMessage, setFacingMode, setForwardingMessage, setIsImageModalOpen, setIsSearchBoxOpen, setMessageInput, setOpenCameraState, setReplyingTo, setSearchInputbox, setSelectedImage, setShowForwardModal } from "../redux/slice/manageState.slice";
import { deleteMessage, getAllMessages } from "../redux/slice/user.slice";
import { useSocket } from "../context/SocketContext";
import { RxCross2 } from "react-icons/rx";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";



const MessageList = memo(({
  handleMakeCall,
  // handleEditMessage,
  // handleForward,
  // handleImageClick,
  // searchInputbox,
  // activeMessageId,
  // contextMenu,
  // setContextMenu,
  // setActiveMessageId,
  // showEmojiPicker,
  // setShowEmojiPicker,
  // addMessageReaction,
  // dropdownRef,
  // sendPrivateMessage,
  handleMultipleFileUpload,
}) => {

  console.log("msglist");
  

  const userId = useMemo(() => sessionStorage.getItem("userId"), []);
  const dispatch = useDispatch();
  const { allUsers, messages, allMessageUsers, groups, user, allCallUsers } = useSelector((state) => state.user);

  const selectedChat = useSelector(state => state.magageState.selectedChat);
  const typingUsers = useSelector(state => state.magageState.typingUsers);
  const selectedFiles = useSelector(state => state.magageState.selectedFiles);
  const uploadProgress = useSelector(state => state.magageState.uploadProgress);
  const replyingTo = useSelector(state => state.magageState.replyingTo);
  const cameraStream = useSelector(state => state.magageState.cameraStream);
  const openCameraState = useSelector(state => state.magageState.openCameraState);
  const backCameraAvailable = useSelector(state => state.magageState.backCameraAvailable);
  const facingMode = useSelector(state => state.magageState.facingMode);
  const searchInputbox = useSelector(state => state.magageState.searchInputbox);
  const isSearchBoxOpen = useSelector(state => state.magageState.isSearchBoxOpen);
  

  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, messageId: null });
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const messagesContainerRef = useRef(null);
  const handleReplyMessage = (message) => {dispatch(setReplyingTo(message))};
  const [totalMatches, setTotalMatches] = useState(0);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const searchBoxRef = useRef(null);


    //===========Use the custom socket hook===========
    const { socket,
      startSharing,
      endCall,
      cleanupConnection,
      toggleCamera,
      toggleMicrophone,
      markMessageAsRead,
      rejectCall,
      sendPrivateMessage,
      sendTypingStatus,
      subscribeToMessages,
      sendGroupMessage,
      acceptScreenShare,
      inviteToCall,
      forwardMessage,
      addMessageReaction,
      startCall,
      acceptCall,
    } = useSocket();


  //===========group messages by date===========
  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach((message) => {
      if (message.isBlocked && message.sender !== userId) return;
      const date = new Date(message.createdAt).toLocaleDateString("en-GB");
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

    // Update the handleCopyMessage function to handle both text and images
    const handleCopyMessage = async (message, callback) => {
      if (message.type === "file" && message.fileType?.includes("image/")) {
        try {
          const response = await fetch(
            `${IMG_URL}${message.fileUrl.replace(/\\/g, "/")}`
          );
          const blob = await response.blob();
          const item = new ClipboardItem({
            [blob.type]: blob,
          });
  
          await navigator.clipboard.write([item]);
          callback();
        } catch (error) {
          console.error("Error copying image:", error);
        }
      } else {
        // Handle text and emoji copying
        const content = message.content || message;
        navigator.clipboard.writeText(content).then(callback);
      }
    };
    // ===============Menu==================
  const handleContextMenu = (e, message) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      messageId: message._id,
      message: message,
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenu.visible && !event.target.closest('.context-menu')) {
        setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
      }
      if (
        searchBoxRef.current && !searchBoxRef.current.contains(event.target)
      ) {
        dispatch(setSearchInputbox(''))
        dispatch(setIsSearchBoxOpen(false));
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [contextMenu]);

  // ===========================delete message=============================
  
  const handleDeleteMessage = async (messageId) => {
    try {
      // Emit socket event for real-time deletion
      await socket.emit("delete-message", messageId);
      await dispatch(deleteMessage(messageId));
      if (selectedChat) {
        dispatch(getAllMessages({ selectedId: selectedChat._id }));
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
    setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
  };

  // ================== highlight word ==================
  const highlightText = (text, highlight) => {
    if (!searchInputbox?.trim() || !highlight?.trim()) {
      return text;
    }
    const regex = new RegExp(`(${highlight})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="highlight-text">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // ====================scroll to bottom====================
  const scrollToBottom = useCallback(() => {
    // console.log("scrollToBottom");

    const isEmojiPickerOpen = document.querySelector('.EmojiPickerReact');
    if (isEmojiPickerOpen) return; // Don't scroll if emoji picker is open
    
    if (messagesContainerRef.current) {
      const element = messagesContainerRef.current;
      element.scrollTop = element.scrollHeight;
      setShowScrollToBottom(false);
    }
  }, []);

  // Scroll event listener to show/hide the button with interval
  useEffect(() => {
    console.log("useEffect");
    scrollToBottom();
    const handleScroll = () => {
      if (messagesContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        setShowScrollToBottom(scrollTop + clientHeight < scrollHeight);
      }
    };

    const container = messagesContainerRef.current;
    let interval; // Declare interval variable
    if (container) {
      container.addEventListener("scroll", handleScroll);
      // Set interval to check scroll position every 500ms
      interval = setInterval(handleScroll, 500);
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
        clearInterval(interval); // Clear interval on component unmount
      }
    };
  }, [messages]);


  // Ensure scroll happens after messages are loaded
  useEffect(() => {
    if (messages.length > 0) {
      const timeoutId = setTimeout(scrollToBottom, 100); // Delay to ensure DOM updates
      return () => clearTimeout(timeoutId);
    }
  }, [messages.length]);

  // Scroll after component updates
  // useEffect(() => {
  //   const messageContainer = messagesContainerRef.current;
  //   if (messageContainer) {
  //     const config = { childList: true, subtree: true };

  //     const observer = new MutationObserver(() => {
  //       messageContainer.scrollTop = messageContainer.scrollHeight;
  //     });

  //     observer.observe(messageContainer, config);
  //     return () => observer.disconnect();
  //   }
  // }, []);

    // ==========================capture photo===================

    // const [cameraStream, setCameraStream] = useState(null);
    const videoRef = useRef(null);
    const [photo, setPhoto] = useState(null);
    // const [openCameraState, setOpenCameraState] = useState(false);
  
    // {{ edit_1 }} add state for facingMode & availability
    // const [facingMode, setFacingMode] = useState('user');
    // const [backCameraAvailable, setBackCameraAvailable] = useState(false);
  

  
    function dataURLtoBlob(dataurl) {
      const arr = dataurl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    }
    // const capturePhoto = () => {
    //   const canvas = document.createElement('canvas');
    //   const context = canvas.getContext('2d');
    //   if (videoRef.current) {
    //     canvas.width = videoRef.current.videoWidth;
    //     canvas.height = videoRef.current.videoHeight;
    //     context.drawImage(videoRef.current, 0, 0);
    //     const photoData = canvas.toDataURL('image/jpeg', 0.8); // JPEG
    //     setPhoto(photoData); // Store the photo data
    //     handleUploadCapturePic(photoData);
    //     console.log(photoData);
    //   }
    // };
  
    const capturePhoto = () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (videoRef.current) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
  
        // {{ edit_1 }} only mirror when using front camera
        if (facingMode === 'user') {
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
        }
  
        context.drawImage(
          videoRef.current,
          0,
          0,
          canvas.width,
          canvas.height
        );
  
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        setPhoto(photoData);
        handleUploadCapturePic(photoData);
        console.log(photoData);
      }
    };
  
    const closeCamera = () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        dispatch(setOpenCameraState(false));
        dispatch(setCameraStream(null));
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }
    };
  
    const handleUploadCapturePic = (dataUrl) => {
      const blob = dataURLtoBlob(dataUrl);
      // Optionally, give it a filename
      const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
      console.log(file);
  
      handleMultipleFileUpload([file]);
      closeCamera();
  
    };
  
    // {{ edit_3 }} switchCamera toggles facingMode and re-opens the stream
    const switchCamera = async () => {
      try {
        const newFacing = facingMode === 'user' ? 'environment' : 'user';
        dispatch(setFacingMode(newFacing));
  
        // stop old tracks
        if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop());
        }
  
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: newFacing }
        });
        dispatch(setCameraStream(newStream));
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      } catch (err) {
        console.error("Error switching camera:", err);
      }
    }


      // ===================search=====================

  // Function to count occurrences of a word in a message
  const countOccurrences = (text, word) => {
    if (!word.trim() || !text) return 0;
    const regex = new RegExp(word, "gi");
    // console.log(regex,text);
    const msg = decryptMessage(text);
    
    return (msg.match(regex) || []).length;
  };

  useEffect(() => {
    if (!searchInputbox.trim()) {
      setTotalMatches(0);
      return;
    }

    const matches = messages.reduce((count, message) => {
      const content =  typeof message?.content?.content === "string"
          ? message?.content?.content: "";

          const msg = decryptMessage(content);
          // console.log(countOccurrences(content, searchInputbox),content);
          
      return count + countOccurrences(msg, searchInputbox);
    }, 0);

    console.log("matches",matches);
    

    setTotalMatches(matches==0 ? 0 : matches);
  }, [searchInputbox, messages]);

  useEffect(() => {
    if (selectedChat) {
      dispatch(setIsSearchBoxOpen(false)); // Close the search box
      dispatch(setSearchInputbox('')); // Clear the search input
    }
  }, [selectedChat]);


    // Function to scroll to the current search result

    const scrollToSearchResult = (index) => {
      if (!searchInputbox.trim()) return;
  
      let currentMatchIndex = 0;
      let targetElement = null;
      let targetSpan = null;
  
      // Find all highlighted spans containing the search text
      const highlightedSpans = document.querySelectorAll(".highlight-text");
      // console.log("highlightedSpans", highlightedSpans);
  
      if (highlightedSpans.length > 0) {
        highlightedSpans.forEach((span) => {
          if (currentMatchIndex === index) {
            targetSpan = span;
            targetElement = span.closest(".message-content");
          }
          currentMatchIndex++;
        });
      }
      // console.log("targetElement", targetElement, targetSpan);
  
      // Scroll to the target element if found
      if (targetElement && targetSpan) {
        // Remove previous active highlights
        document.querySelectorAll(".active-search-result").forEach((el) => {
          el.classList.remove("active-search-result");
        });
  
        // Scroll the message into view
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
  
        // Highlight the specific occurrence
        targetElement.classList.add("active-search-result");
        setTimeout(() => {
          targetElement.classList.remove("active-search-result");
        }, 2000);
      }
    };
  
    // Function to handle search navigation
    const handleSearchNavigation = (direction) => {
      if (totalMatches === 0) return;
  
      setCurrentSearchIndex((prevIndex) => {
        let newIndex;
        if (direction === "up") {
          newIndex = prevIndex <= 0 ? totalMatches - 1 : prevIndex - 1;
        } else {
          newIndex = prevIndex >= totalMatches - 1 ? 0 : prevIndex + 1;
        }
        scrollToSearchResult(newIndex);
        return newIndex;
      });
    };


      // ===========================Edit message=============================

  const handleEditMessage = (message) => {
    dispatch(setEditingMessage(message));  

    const content = decryptMessage(message.content.content);
    dispatch(setMessageInput(content));

    setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
  };


  const handleForwardMessage = (message) => {
    console.log(message,"message");
    setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
    dispatch(setForwardingMessage(message));
    dispatch(setShowForwardModal(true));
  }

  // ===============handle image click================

  const handleImageClick = useCallback((imageUrl) => {
    dispatch(setSelectedImage(imageUrl));
    dispatch(setIsImageModalOpen(true));
  }, [dispatch]);

  // console.log("contextMenu");

    // // ======================Download file =====================
    // const handleDownload = (fileUrl, fileName) => {
    //   const durl = `${IMG_URL}${fileUrl}`;
    //   fetch(durl)
    //     .then((response) => response.blob())
    //     .then((blob) => {
    //       const url = URL.createObjectURL(blob);
    //       const link = document.createElement("a");
    //       link.href = url;
    //       link.download = fileName;
    //       document.body.appendChild(link);
    //       link.click();
    //       document.body.removeChild(link);
    //       URL.revokeObjectURL(url);
    //     })
    //     .catch((error) => console.error("Download error:", error));
    // };


  return (
    <div className="relative">
      <div
        className={`flex-1 overflow-y-auto p-4 modal_scroll border-dashed scrollbar-hide`}
        style={{
          height:
            selectedFiles?.length > 0
              ? "calc(100vh -  276px)"
              : Object.keys(uploadProgress).length != 0
              ? "calc(100vh - 250px)"
              : replyingTo
              ? replyingTo?.content?.fileType &&
                replyingTo?.content?.fileType?.startsWith("image/")
                ? "calc(100vh - 280px)"
                : "calc(100vh - 229px)"
              : window.innerWidth < 768
              ? "calc(100vh - 179px)"
              : "calc(100vh - 173px)",
        }}
        ref={messagesContainerRef}
      >
        {cameraStream ? (
          <></>
        ) : (
          <div className="flex flex-col w-full h-[100%]">
            {messages && messages.length > 0 ? (
              Object.entries(groupMessagesByDate(messages)).map(
                ([date, dateMessages]) => (
                  <div key={date} className="flex flex-col w-full">
                    <DateHeader date={date} />
                    {dateMessages.map((message, index) => {
                      const prevMessage =
                        index > 0 ? dateMessages[index - 1] : null;
                      const nextMessage =
                        index < dateMessages.length - 1
                          ? dateMessages[index + 1]
                          : null;
                      const isConsecutive =
                        nextMessage && nextMessage.sender === message.sender;
                      const isSameMinute =
                        prevMessage &&
                        new Date(message?.createdAt).getMinutes() ===
                          new Date(prevMessage?.createdAt).getMinutes();
                      const issameUser = message.sender === prevMessage?.sender;

                      const showTime =
                        !prevMessage ||
                        new Date(message?.createdAt).getMinutes() -
                          new Date(prevMessage?.createdAt).getMinutes() >
                          0 ||
                        !issameUser;

                      const name = allUsers.find(
                        (user) => user._id === message.sender
                      )?.userName;
                      const currentTime = new Date(
                        message.createdAt
                      ).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: false,
                      });
                      // console.log("message", message);
                      if (message.isBlocked && message.sender !== userId) {
                        console.log("message.isBlocked", message.isBlocked);
                        return;
                      }

                      if (message.content?.type === "system") {
                        return (
                          <SystemMessage key={message._id} message={message} />
                        );
                      }

                      if (message.content?.type === "call") {
                        return (
                          <CallMessage
                            key={message._id}
                            message={message}
                            userId={userId}
                            handleMakeCall={handleMakeCall}
                          />
                        );
                      }

                      return (
                        <RegularMessage
                          key={message._id}
                          message={message}
                          userId={userId}
                          showTime={showTime}
                          name={name}
                          currentTime={currentTime}
                          isConsecutive={isConsecutive}
                          handleContextMenu={handleContextMenu}
                          handleEditMessage={handleEditMessage}
                          handleDeleteMessage={handleDeleteMessage}
                          handleCopyMessage={handleCopyMessage}
                          handleReplyMessage={handleReplyMessage}
                          handleForwardMessage={handleForwardMessage}
                          handleImageClick={handleImageClick}
                          highlightText={highlightText}
                          searchInputbox={searchInputbox}
                          contextMenu={contextMenu}
                          setContextMenu={setContextMenu}
                          allUsers={allUsers}
                          IMG_URL={IMG_URL}
                          // showEmojiPicker={showEmojiPicker}
                          // setShowEmojiPicker={setShowEmojiPicker}
                          addMessageReaction={addMessageReaction}
                          selectedChat={selectedChat}
                          messages={messages}
                        />
                      );
                    })}
                  </div>
                )
              )
            ) : (
              <EmptyMessages
                selectedChat={selectedChat}
                sendPrivateMessage={sendPrivateMessage}
              />
            )}
            {selectedChat && typingUsers.includes(selectedChat._id) && (
              <div className="flex">
                <div className=" flex text-sm p-2 px-3 dark:text-white bg-primary rounded-e-xl rounded-tl-xl">
                  <span>{selectedChat.members ? `${""}` : ""}</span>
                  <div className="flex space-x-1 mt-3 ml-2">
                    <div
                      className="w-1 h-1 rounded-full animate-bounce dark:bg-white bg-black"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-1 h-1 rounded-full animate-bounce dark:bg-white bg-black"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-1 h-1 rounded-full animate-bounce dark:bg-white bg-black"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            {/* Show Send to Bottom button only if user has scrolled up */}
          </div>
        )}

        <div className="relative" style={{ maxHeight: "calc(100vh-300px)" }}>
          {openCameraState && (
            <button
              className="absolute top-2 right-2 text-white z-10 text-xl"
              onClick={() => {
                closeCamera();
              }}
            >
              <RxCross2 />
            </button>
          )}
          <video
            ref={(el) => {
              if (el && cameraStream instanceof MediaStream) {
                el.srcObject = cameraStream;
                el.play().catch((err) =>
                  console.error("Remote video error:", err)
                );
              }
              // If you want to keep localVideoRef for the current user:
              if (videoRef) {
                videoRef.current = el;
              }
            }}
            className="w-full aspect-video max-h-full h-[75vh] object-cover"
            autoPlay
            style={{
              display: cameraStream ? "block" : "none",
              transform: facingMode === "user" ? "scaleX(-1)" : "none",
            }}
          />
          {openCameraState && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
              <button
                className="btn  text-white  rounded-full border-4 border-white hover:border-white/75"
                onClick={capturePhoto}
              >
                <div className="bg-white w-10 h-10  rounded-full m-1 hover:bg-white/80 "></div>
              </button>
            </div>
          )}

          {openCameraState && backCameraAvailable && (
            <button
              className="btn absolute bottom-3 right-4 text-white rounded-full "
              onClick={switchCamera}
            >
              <div className="bg-white/40 w-10 h-10 flex items-center justify-center text-2xl rounded-full hover:bg-white/80">
                <MdOutlineFlipCameraIos />
              </div>
            </button>
          )}
        </div>
      </div>
      {showScrollToBottom && (
        <button
          type="button"
          className="absolute bottom-5 right-4 p-2 bg-primary/70 text-white rounded-full shadow-lg z-50"
          onClick={()=>{
            scrollToBottom();
            setShowScrollToBottom(false);
          }}
          aria-label="Send to Bottom"
        >
          <FaArrowDown className="w-5 h-5" />
        </button>
      )}

      {/* =========Search Box ==========*/}
      {isSearchBoxOpen && (
        <div
          className="absolute top-14 right-0 left-[50%] max-w-[700px] w-full bg-white dark:bg-[#202020] dark:text-gray-400 text-gray-700  rounded-lg shadow-lg p-4 py-5 z-50 flex items-center border-rounded justify-between"
          style={{
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            className="flex items-center bg-gray-200 dark:bg-white/15 w-[90%] px-4 rounded-md"
            ref={searchBoxRef}
          >
            <FaSearch className="text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Search..."
              className="flex-1 p-2 outline-none min-w-[20px] bg-transparent"
              value={searchInputbox}
              onChange={(e) => {
                dispatch(setSearchInputbox(e.target.value));
                setCurrentSearchIndex(0); // Reset current search index
              }}
            />
            <span className="mx-2 text-gray-500">
              {totalMatches > 0
                ? `${currentSearchIndex + 1} / ${totalMatches}`
                : "0 / 0"}
            </span>
            <button
              className="ms-5 mr-3 hover:text-black hover:dark:text-white text-xl"
              onClick={() => handleSearchNavigation("up")}
            >
              <IoIosArrowUp />
            </button>
            <button
              className="hover:text-black hover:dark:text-white text-xl"
              onClick={() => handleSearchNavigation("down")}
            >
              <IoIosArrowDown />
            </button>
          </div>
          <button
            className=" ms-5 text-xl font-bold hover:text-black hover:dark:text-white"
            onClick={() => {
              dispatch(setSearchInputbox(''));
              dispatch(setIsSearchBoxOpen(false));
            }}
          >
            <RxCross2 />
          </button>
        </div>
      )}
    </div>
  );
});

export default MessageList;

// =========================================================== Other Components ====================================================================

const DateHeader = memo(({ date }) => (
  <div
    className="flex justify-center items-center my-4  date-header px-2"
    data-date={date}
  >
    <div className="sm:block flex-1 h-[1px] bg-gradient-to-r from-gray-200/30 to-gray-300 dark:bg-gradient-to-l dark:from-gray-300/30 dark:to-gray-300/0 max-w-[45%]" />
    <span className=" text-xs whitespace-nowrap px-2 sm:px-5 py-1 rounded-full  bg-gray-300 dark:bg-[#1A1A1A] dark:text-white">
      {date === new Date().toLocaleDateString("en-GB") ? "Today" : date}
    </span>
    <div className="sm:block flex-1 h-[1px] bg-gradient-to-l from-gray-200/30 to-gray-300 dark:bg-gradient-to-r dark:from-gray-300/30 dark:to-gray-300/0 max-w-[45%]" />
  </div>
));

const SystemMessage =  memo(({ message }) => (
  <div className="flex justify-center my-2">
    <span className="bg-primary-dark/10 dark:bg-primary-light/10  dark:text-white/80 text-gray-700 text-[12px] md:text-sm px-4 py-1.5 rounded-full min-w-60 md:min-w-80 text-center">
      {message.content.content
        ?.split("**")
        .map((part, index) =>
          index % 2 === 1 ? (
            <strong key={index}>{part}</strong>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
    </span>
  </div>
));

const CallMessage = ({ message, userId, handleMakeCall }) => {
  const isCompleted = message.content.status === "ended";
  const group = !message?.content?.callfrom && message?.content?.joined;
  return (
    <div className={`flex  w-full my-2  ${message.sender === userId
      ? "justify-end items-end"
      : "justify-start items-start"}`}>

      <div
        className={`flex items-center  text-sm px-3 py-2 rounded-md bg-gray-300 dark:bg-white/15 max-w-[230px] w-full dark:text-white`}
      >
        <div className="rounded-full border w-8 h-8 p-1 text-xl border-gray-600 dark:border-white flex items-center justify-center">
          {isCompleted ? message.sender === userId ? <MdOutlineCallMade className="text-[#22C55E]" /> : <MdOutlineCallReceived className="text-[#22C55E]" /> : <HiOutlinePhoneMissedCall className=" text-[#FF0000]" />}
        </div>
        {/* <FaPhone
          className={message.sender === userId ? "rotate-90" : "-rotate-90"}
        /> */}
        <div className="flex flex-col ml-2 w-full">
          <span>
            {message.sender === userId ? isCompleted ? (group ? "Group call" : "Outgoing call") : "Call not answered"
              : isCompleted ? (group ? "Group call" : "Incoming call") : `Missed ${message.content.callType} call`}

          </span>
          <div className="flex justify-between w-full">

            <span className="text-center">
              {/* • */}
              {isCompleted && ` ${message.content.duration} sec`}

              {message?.content?.joined &&
                <span className="ml-2 opacity-75 text-xs"> • ({parseInt(message?.content?.joined) + 1}) Joined</span>}
            </span>
            <span className="text-gray-500 dark:text-white/70 text-xs">
              {new Date(message.content.timestamp).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
                hour12: false,
              })}
            </span>
          </div>
        </div>
        {/* <span className="cursor-pointer ml-12 bg-gray-300 p-2 rounded-full">
          {message.content.callType === "voice" ||
          message.content.callType === "audio" ? (
            <MdPhoneEnabled
              className="w-5 h-5 cursor-pointer text-black"
              onClick={() => handleMakeCall("audio")}
            />
          ) : (
            <GoDeviceCameraVideo
              className="w-5 h-5 cursor-pointer text-black"
              onClick={() => handleMakeCall("video")}
            />
          )}
        </span> */}
      </div>
    </div>
  );
};

const MessageContent =  memo(({
  message,
  userId,
  handleImageClick,
  IMG_URL,
  highlightText,
  searchInputbox,
  allUsers,
  messages,
}) => {
  // console.log("aaA", message)
  if (message.replyTo) {
    return (
      <ReplyPreview
        message={message}
        allUsers={allUsers}
        IMG_URL={IMG_URL}
        messages={messages}
        userId={userId}
        highlightText={highlightText}
        searchInputbox={searchInputbox}
      />
    );
  } else {
    if (message.content?.type === "file") {

      if (message.content?.fileType?.includes("image/")) {
        return (
          <ImageMessage
            message={message}
            userId={userId}
            handleImageClick={handleImageClick}
            IMG_URL={IMG_URL}
          />
        );
      }
      if (message.content?.fileType?.includes("video/")) {
        return (
          <VideoMessage
            message={message}
            userId={userId}
            handleImageClick={handleImageClick}
            IMG_URL={IMG_URL}
          />
        );
      }
      if (message.content?.fileType?.includes("audio/")) {
        return (
          <AudioMessage message={message} userId={userId} IMG_URL={IMG_URL} />
        );
      }
      return (
        <FileMessage
          message={message}
          userId={userId}
          IMG_URL={IMG_URL}
          highlightText={highlightText}
          searchInputbox={searchInputbox}
        />
      );
    }

    return (
      <TextMessage
        message={message}
        userId={userId}
        highlightText={highlightText}
        searchInputbox={searchInputbox}
      />
    );
  }
});

const ImageMessage =  memo(({ message, userId, handleImageClick, IMG_URL }) => (
  <div className={`max-w-[300px] max-h-[300px]  overflow-hidden rounded-xl`}>
    <img
      src={`${message.content.fileUrl.replace(/\\/g, "/")}`}
      alt={decryptMessage(message.content.content)}
      className={`w-full h-full object-contain rounded-lg`}
      onClick={() =>
        handleImageClick(
          `${message.content.fileUrl.replace(/\\/g, "/")}`
        )
      }
    />
  </div>
));

const VideoMessage =  memo(({ message, userId, handleImageClick, IMG_URL }) => {

  let messageContent = message?.content?.content;

  // Decrypt the message if it's encrypted
  if (typeof messageContent === 'string' && messageContent.startsWith('data:')) {
    try {
      const key = 'chat';
      // Assuming 'data:' prefix is part of the encrypted message, remove it before decoding
      const encodedText = messageContent.split('data:')[1];
      const decodedText = atob(encodedText);
      let result = '';
      for (let i = 0; i < decodedText.length; i++) {
        result += String.fromCharCode(decodedText.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      messageContent = result;
    } catch (error) {
      console.error('Decryption error:', error);
    }
  }

  return (
    <>
      <div className={`max-w-[300px] max-h-[300px]  overflow-hidden rounded-xl`}>
        <video
          src={`${message.content.fileUrl.replace(/\\/g, "/")}`}
          controls
          className={`w-full h-full object-contain rounded-lg`}
          onClick={() =>
            handleImageClick(
              `${message.content.fileUrl.replace(/\\/g, "/")}`
            )
          }
        />
        <div className=" w-full flex justify-between items-center mt-1">
          <div className="flex">
            <svg
              width="20"
              height="20"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="#afafaf"
              gradientcolor1="#afafaf"
              gradientcolor2="#afafaf"
            >
              <path
                d="M3.5 21h17c.275 0 .5-.225.5-.5v-17c0-.275-.225-.5-.5-.5h-17c-.275 0-.5.225-.5.5v17c0 .275.225.5.5.5Z"
                fill="#fff"
              ></path>
              <path
                opacity="0.64"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M3.5 22h17c.827 0 1.5-.673 1.5-1.5v-17c0-.827-.673-1.5-1.5-1.5h-17C2.673 2 2 2.673 2 3.5v17c0 .827.673 1.5 1.5 1.5ZM3 3.5a.5.5 0 0 1 .5-.5h17a.5.5 0 0 1 .5.5v17a.5.5 0 0 1-.5.5h-17a.5.5 0 0 1-.5-.5v-17Z"
                fill="#605E5C"
              ></path>
              <path
                d="M16 12a.47.47 0 0 1-.24.4l-6 3.53a.48.48 0 0 1-.26.07.5.5 0 0 1-.24-.06.46.46 0 0 1-.26-.41V12h7Z"
                fill="#BC1948"
              ></path>
              <path
                d="M16 12a.47.47 0 0 0-.24-.4l-6-3.536a.52.52 0 0 0-.5 0 .46.46 0 0 0-.26.4V12h7Z"
                fill="#E8467C"
              ></path>
            </svg>
            <div className="font-medium text-sm ps-1">{messageContent}</div>
          </div>
          <div className="text-[10px] opacity-60 flex items-center"><GoDotFill className="mr-0.5" />{message.content?.size}</div>
        </div>
      </div>



    </>
  );


});

const AudioMessage =  memo(({ message, userId, IMG_URL }) => {
  let messageContent = message?.content?.content;

  // Decrypt the message if it's encrypted
  if (typeof messageContent === 'string' && messageContent.startsWith('data:')) {
    try {
      const key = 'chat';
      // Assuming 'data:' prefix is part of the encrypted message, remove it before decoding
      const encodedText = messageContent.split('data:')[1];
      const decodedText = atob(encodedText);
      let result = '';
      for (let i = 0; i < decodedText.length; i++) {
        result += String.fromCharCode(decodedText.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      messageContent = result;
    } catch (error) {
      console.error('Decryption error:', error);
    }
  }

  return (
    <div className={`max-w-[400px] rounded-lg`}>
      <AudioPlayer
        audioUrl={`${message?.content?.fileUrl?.replace(/\\/g, "/")}`}
      />
      <div className=" w-full flex justify-between items-center mt-1">
        <div className="font-medium text-sm">{messageContent}</div>
        <div className="text-[10px] opacity-60 flex items-center"><GoDotFill className="mr-0.5" />{message.content?.size}</div>
      </div>
    </div>
  );
});

const FileMessage =  memo(({
  message,
  userId,
  IMG_URL,
  highlightText,
  searchInputbox,
}) => {

  let messageContent = message?.content?.content;

  // Decrypt the message if it's encrypted
  if (
    typeof messageContent === "string" &&
    messageContent.startsWith("data:")
  ) {
    try {
      const key = "chat";
      const encodedText = messageContent.split("data:")[1];
      const decodedText = atob(encodedText);
      let result = "";
      for (let i = 0; i < decodedText.length; i++) {
        result += String.fromCharCode(
          decodedText.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }
      messageContent = result;
    } catch (error) {
      console.error("Decryption error:", error);
    }
  }


  // Get thumbnails for different file types
  const { thumbnail: pdfThumbnail, error: pdfError } = usePdfThumbnail(
    message?.content?.fileType === "application/pdf"
      ? message?.content?.fileUrl?.replace(/\\/g, "/")
      : null
  );

  const { thumbnail: excelThumbnail, error: excelError } = useExcelThumbnail(
    message?.content?.fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ? message?.content?.fileUrl?.replace(/\\/g, "/")
      : null
  );

  const { thumbnail: pptThumbnail, error: pptError } = usePptThumbnail(
    message?.content?.fileType === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
      ? message?.content?.fileUrl?.replace(/\\/g, "/")
      : null
  );

  const { thumbnail: wordThumbnail, error: wordError } = useWordThumbnail(
    message?.content?.fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ? message?.content?.fileUrl?.replace(/\\/g, "/")
      : null
  );

  return (
    <div className={`max-w-[300px]`}>
      <div className="flex items-center flex-col">
        {message?.content?.fileType === "application/pdf" ? (
          <>
            {pdfError ? (
              <div className="text-red-500">Error loading thumbnail: {pdfError}</div>
            ) : pdfThumbnail ? (
              <div className="relative w-full">
                <img
                  src={pdfThumbnail}
                  alt="PDF thumbnail"
                  className="rounded-t-md w-full h-24 object-cover mb-2 mt-1"
                  style={{ objectPosition: "top" }}
                />
                <div className="absolute top-0 left-0 bg-primary-dark/50 w-full h-24  mb-2 mt-1 grid place-content-center rounded-t-md">
                  <DownloadButton
                    fileUrl={pdfThumbnail}
                    fileName={decryptMessage(message?.content?.content)}
                    className=" p-2 dark:text-primary-light bg-white rounded-full hover:underline disabled:opacity-50 relative"
                  />
                </div>
              </div>
            ) : (
              <div className="text-gray-500">Loading...</div>
            )}
            <span className="text-sm ml-1 py-2 flex gap-1 items-center">
              <div>
                <img src={require('../img/pdf.png')} className="w-[20px] h-[20px]" alt="" />
              </div>
              <div className="font-medium text-sm" style={{ wordBreak: "break-all" }}>
                <div className="flex flex-col">
                  {highlightText(messageContent, searchInputbox)}
                </div>
              </div>
              <div className="text-[12px] dark:text-gray-300 shrink-0 ms-2">
                {message?.content?.size}
              </div>
            </span>
          </>
        ) : message?.content?.fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ? (
          <>
            {excelError ? (
              <div className="text-red-500 text-sm p-2 bg-red-50 rounded-md">
                Error loading thumbnail: {excelError}
              </div>
            ) : excelThumbnail ? (
              <div className="relative w-full">
                <img
                  src={excelThumbnail}
                  alt="PDF thumbnail"
                  className="rounded-t-md w-full h-24 object-cover mb-2 mt-1"
                  style={{ objectPosition: "top" }}
                />
                <div className="absolute top-0 left-0 bg-primary-dark/50 w-full h-24  mb-2 mt-1 grid place-content-center rounded-t-md">
                  <DownloadButton
                    fileUrl={excelThumbnail}
                    fileName={decryptMessage(message?.content?.content)}
                    className=" p-2 dark:text-primary-light bg-white rounded-full hover:underline disabled:opacity-50 relative"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full h-24 bg-gray-50/50 rounded-t-md">
                <span className="text-gray-500">Loading...</span>
              </div>
            )}
            <span className="text-sm ml-1 py-2 flex gap-1 items-center">
              <div>
                <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#afafaf">
                  <path d="M15 3H7.8c-.442 0-.8.298-.8.667V7l8 5 3.5 1.5L22 12V7l-7-4Z" fill="#21A366"></path>
                  <path d="M7 12h8V7H7v5Z" fill="#107C41"></path>
                  <path d="M22 3.82V7h-7V3h6.17c.46 0 .83.37.83.82" fill="#33C481"></path>
                  <path d="M15 12H7v8.167c0 .46.373.833.833.833h13.334c.46 0 .833-.373.833-.833V17l-7-5Z" fill="#185C37"></path>
                </svg>
              </div>
              <div className="font-medium text-sm" style={{ wordBreak: "break-all" }}>
                {highlightText(messageContent, searchInputbox)}
              </div>
              <div className="text-[12px] dark:text-gray-300 shrink-0 ms-2">
                {message?.content?.size}
              </div>
            </span>
          </>
        ) : message?.content?.fileType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ? (
          <>
            {pptError ? (
              <div className="text-red-500 text-sm p-2 bg-red-50 rounded-md">
                Error loading thumbnail: {pptError}
              </div>
            ) : pptThumbnail ? (
              <div className="relative w-full">
                <img
                  src={pptThumbnail}
                  alt="PDF thumbnail"
                  className="rounded-t-md w-full h-24 object-cover mb-2 mt-1"
                  style={{ objectPosition: "top" }}
                />
                <div className="absolute top-0 left-0 bg-primary-dark/50 w-full h-24  mb-2 mt-1 grid place-content-center rounded-t-md">
                  <DownloadButton
                    fileUrl={pptThumbnail}
                    fileName={decryptMessage(message?.content?.content)}
                    className=" p-2 dark:text-primary-light bg-white rounded-full hover:underline disabled:opacity-50 relative"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full h-24 bg-gray-50/50 rounded-t-md">
                <span className="text-gray-500">Loading...</span>
              </div>
            )}
            <span className="text-sm ml-1 py-2 flex gap-1 items-center">
              <div>
                <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#afafaf">
                  <path d="M13 3c-4.95 0-9 4.05-9 9l11 1.5L13 3Z" fill="#ED6C47"></path>
                  <path d="M13 3c4.95 0 9 4.05 9 9l-4.5 2-4.5-2V3Z" fill="#FF8F6B"></path>
                  <path d="M22 12c0 4.95-4.05 9-9 9s-9-4.05-9-9h18Z" fill="#D35230"></path>
                </svg>
              </div>
              <div className="font-medium text-sm" style={{ wordBreak: "break-all" }}>
                {highlightText(messageContent, searchInputbox)}
              </div>
              <div className="text-[12px] dark:text-gray-300 shrink-0 ms-2">
                {message?.content?.size}
              </div>
            </span>
          </>
        ) : message?.content?.fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ? (
          <>
            {wordError ? (
              <div className="text-red-500 text-sm p-2 bg-red-50 rounded-md">
                Error loading thumbnail: {wordError}
              </div>
            ) : wordThumbnail ? (
              <div className="relative w-full">
                <img
                  src={wordThumbnail}
                  alt="PDF thumbnail"
                  className="rounded-t-md w-full h-24 object-cover mb-2 mt-1"
                  style={{ objectPosition: "top" }}
                />
                <div className="absolute top-0 left-0 bg-primary-dark/50 w-full h-24  mb-2 mt-1 grid place-content-center rounded-t-md">
                  <DownloadButton
                    fileUrl={wordThumbnail}
                    fileName={decryptMessage(message?.content?.content)}
                    className=" p-2 dark:text-primary-light bg-white rounded-full hover:underline disabled:opacity-50 relative"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full h-24 bg-gray-50/50 rounded-t-md">
                <span className="text-gray-500">Loading...</span>
              </div>
            )}
            <span className="text-sm ml-1 py-2 flex gap-1 items-center">
              <div>
                <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#afafaf">
                  <path d="M21.167 3H7.82a.82.82 0 0 0-.82.82v3.17l7.5 2.194L22 6.99V3.833A.836.836 0 0 0 21.167 3" fill="#41A5EE"></path>
                  <path d="M22 7H7v5l7.5 2.016L22 12V7Z" fill="#2B7CD3"></path>
                  <path d="M22 12H7v5l8 2 7-2v-5Z" fill="#185ABD"></path>
                  <path d="M22 17H7v3.177c0 .455.368.823.823.823h13.354a.822.822 0 0 0 .823-.823V17Z" fill="#103F91"></path>
                </svg>
              </div>
              <div className="font-medium text-sm" style={{ wordBreak: "break-all" }}>
                {highlightText(messageContent, searchInputbox)}
              </div>
              <div className="text-[12px] dark:text-gray-300 shrink-0 ms-2">
                {message?.content?.size}
              </div>
            </span>
          </>
        ) : (
          <>
            <div className="relative inline-flex items-center justify-center">
              <DownloadButton
                fileUrl={`${message?.content?.fileUrl?.replace(/\\/g, "/")}`}
                fileName={decryptMessage(message?.content?.content)}
                className="ml-2 my-2 p-2 bg-white rounded-full dark:text-primary-light hover:underline disabled:opacity-50 relative"
              />
            </div>
            <div className=" flex justify-content-between gap-1">
              {message?.content?.fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ? (
                <span className="text-sm ml-1 flex gap-1 items-center">
                  {/* Word Icon */}
                  <div>
                    <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#afafaf">
                      <path d="M21.167 3H7.82a.82.82 0 0 0-.82.82v3.17l7.5 2.194L22 6.99V3.833A.836.836 0 0 0 21.167 3" fill="#41A5EE"></path>
                      <path d="M22 7H7v5l7.5 2.016L22 12V7Z" fill="#2B7CD3"></path>
                      <path d="M22 12H7v5l8 2 7-2v-5Z" fill="#185ABD"></path>
                      <path d="M22 17H7v3.177c0 .455.368.823.823.823h13.354a.822.822 0 0 0 .823-.823V17Z" fill="#103F91"></path>
                    </svg>
                  </div>
                  <div className="font-medium text-sm" style={{ wordBreak: "break-all" }}>
                    {highlightText(messageContent, searchInputbox)}
                  </div>
                </span>
              ) : message?.content?.fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ? (
                <span className="text-sm ml-1 flex gap-1 items-center">
                  {/* Excel Icon */}
                  <div>
                    <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#afafaf">
                      <path d="M15 3H7.8c-.442 0-.8.298-.8.667V7l8 5 3.5 1.5L22 12V7l-7-4Z" fill="#21A366"></path>
                      <path d="M7 12h8V7H7v5Z" fill="#107C41"></path>
                      <path d="M22 3.82V7h-7V3h6.17c.46 0 .83.37.83.82" fill="#33C481"></path>
                      <path d="M15 12H7v8.167c0 .46.373.833.833.833h13.334c.46 0 .833-.373.833-.833V17l-7-5Z" fill="#185C37"></path>
                    </svg>
                  </div>
                  <div className="font-medium text-sm " style={{ wordBreak: "break-all" }}>
                    {highlightText(messageContent, searchInputbox)}
                  </div>
                </span>
              ) : message?.content?.fileType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ? (
                <span className="text-sm ml-1 flex gap-1 items-center">
                  {/* PowerPoint Icon */}
                  <div>

                    <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#afafaf">
                      <path d="M13 3c-4.95 0-9 4.05-9 9l11 1.5L13 3Z" fill="#ED6C47"></path>
                      <path d="M13 3c4.95 0 9 4.05 9 9l-4.5 2-4.5-2V3Z" fill="#FF8F6B"></path>
                      <path d="M22 12c0 4.95-4.05 9-9 9s-9-4.05-9-9h18Z" fill="#D35230"></path>
                    </svg>
                  </div>
                  <div className="font-medium text-sm" style={{ wordBreak: "break-all" }}>
                    {highlightText(messageContent, searchInputbox)}
                  </div>
                </span>
              ) : message?.content?.fileType === "application/zip" ? (
                <span className="text-sm ml-1 flex gap-1 items-center">
                  {/* ZIP Icon */}
                  <div>
                    <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#afafaf">
                      <path d="m12 6-1.268-1.268A2.5 2.5 0 0 0 8.964 4H2.5A1.5 1.5 0 0 0 1 5.5v13A1.5 1.5 0 0 0 2.5 20h19a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 21.5 6H12Z" fill="#FFB900"></path>
                    </svg>
                  </div>
                  <div className="font-medium text-sm" style={{ wordBreak: "break-all" }}>
                    {highlightText(messageContent, searchInputbox)}
                  </div>
                </span>
              ) : (
                <span className="text-sm ml-1 flex gap-1 items-center">
                  {/* Default File Icon */}
                  <div>
                    <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#afafaf">
                      <path d="M5.5 22h13c.275 0 .5-.225.5-.5V7h-3.5c-.827 0-1.5-.673-1.5-1.5V2H5.5c-.275 0-.5.225-.5.5v19c0 .275.225.5.5.5Z" fill="#fff"></path>
                      <path d="M18.293 6 15 2.707V5.5c0 .275.225.5.5.5h2.793Z" fill="#fff"></path>
                      <path opacity="0.64" fillRule="evenodd" clipRule="evenodd" d="m19.56 5.854-4.414-4.415A1.51 1.51 0 0 0 14.086 1H5.5C4.673 1 4 1.673 4 2.5v19c0 .827.673 1.5 1.5 1.5h13c.827 0 1.5-.673 1.5-1.5V6.914c0-.4-.156-.777-.44-1.06ZM15 2.707 18.293 6H15.5a.501.501 0 0 1-.5-.5V2.707ZM5.5 22h13c.275 0 .5-.225.5-.5V7h-3.5c-.827 0-1.5-.673-1.5-1.5V2H5.5c-.275 0-.5.225-.5.5v19c0 .276.224.5.5.5Z" fill="#605E5C"></path>
                    </svg>
                  </div>
                  <div className="font-medium text-sm" style={{ wordBreak: "break-all" }}>
                    {highlightText(messageContent, searchInputbox)}
                  </div>
                </span>
              )}
              <div className="text-[12px] dark:text-gray-300  shrink-0">
                {message?.content?.size}
              </div>
            </div>
          </>

        )}
      </div>
    </div>
  );
});

const TextMessage = ({ message, userId, highlightText, searchInputbox }) => {
  let messageContent = message?.content?.content;

  // Decrypt the message if it's encrypted
  if (
    typeof messageContent === "string" &&
    messageContent.startsWith("data:")
  ) {
    try {
      const key = "chat";
      // console.log(messageContent, typeof messageContent && messageContent.startsWith('data:'))
      // Assuming 'data:' prefix is part of the encrypted message, remove it before decoding
      const encodedText = messageContent.split("data:")[1];
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

  // Check if message contains only a single emoji
  const isSingleEmoji = messageContent?.match(/^\p{Emoji}$/gu);

  return (
    <div
      className={`group flex-1 flex justify-between items-center relative rounded-lg`}
    >
      <div className="flex-1 flex flex-col">
        <p className="flex-1">
          {messageContent?.split(/(\p{Emoji})/gu).map((part, index) => {
            // Check if the part is an emoji
            if (part.match(/\p{Emoji}/gu)) {
              return (
                <span key={index} className="inline-block align-middle">
                  <img
                    src={`https://cdn.jsdelivr.net/npm/emoji-datasource-facebook/img/facebook/64/${part
                      .codePointAt(0)
                      .toString(16)}.png`}
                    alt={part}
                    className={`inline ${isSingleEmoji ? "h-14 w-14" : "h-5 w-5"
                      }`}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.replaceWith(document.createTextNode(part));
                    }}
                  />
                </span>
              );
            }
            // If not an emoji, apply the highlight text function
            return (
              <span key={index}>{highlightText(part, searchInputbox)}</span>
            );
          })}
        </p>
      </div>
    </div>
  );
};

const MessageStatus =  memo(({ message, userId, last }) => (
  <div
    className={`flex items-end mt-1 ${message.showTime ? "bottom-3" : "-bottom-2"
      } right-0`}
  >
    {message.status === "sent" && <div className="p-3"> </div>}
    {message.status === "delivered" && message._id === last._id ? (
      <IoCheckmarkCircleOutline className="text-md mr-1 text-gray-600 font-bold" />
    ) : message.status === "delivered" ? (
      <div className="p-3"> </div>
    ) : null}

    {message.status === "read" && message._id == last._id ? (
      <VscEye className="text-md mx-1 text-primary font-bold" />
    ) : message.status === "read" ? (
      <div className="p-3"> </div>
    ) : null}
  </div>
));

const ReplyPreview =  memo(({
  message,
  allUsers,
  IMG_URL,
  messages,
  userId,
  highlightText,
  searchInputbox,
}) => {
  const getReplyContent = () => {

    return (
      <p>
        {message?.replyTo?.content &&
          message.replyTo.content.fileType?.startsWith("image/") ? (
          <img
            src={`${IMG_URL}${message?.replyTo?.content.fileUrl.replace(
              /\\/g,
              "/"
            )}`}
            alt=""
            className="max-w-[300px] max-h-[300px]"
          />
        ) : message?.replyTo?.content &&
          message.replyTo.content.fileType?.startsWith("video/") ? (
          <video
            src={`${IMG_URL}${message?.replyTo?.content.fileUrl.replace(
              /\\/g,
              "/"
            )}`}
            controls
            className="max-w-[300px] max-h-[300px]"
          />
        ) : message?.replyTo?.content &&
          message.replyTo.content.fileType?.startsWith("text/") ? (
          <>
            <span className="text-center grid place-content-center">
              <svg
                width="50"
                height="50"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="#afafaf"
                gradientcolor1="#afafaf"
                gradientcolor2="#afafaf"
              >
                <path
                  d="M5.5 22h13c.275 0 .5-.225.5-.5V7h-3.5c-.827 0-1.5-.673-1.5-1.5V2H5.5c-.275 0-.5.225-.5.5v19c0 .275.225.5.5.5Z"
                  fill="#fff"
                ></path>
                <path
                  d="M18.293 6 15 2.707V5.5c0 .275.225.5.5.5h2.793Z"
                  fill="#fff"
                ></path>
                <path
                  opacity="0.64"
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="m19.56 5.854-4.414-4.415A1.51 1.51 0 0 0 14.086 1H5.5C4.673 1 4 1.673 4 2.5v19c0 .827.673 1.5 1.5 1.5h13c.827 0 1.5-.673 1.5-1.5V6.914c0-.4-.156-.777-.44-1.06ZM15 2.707 18.293 6H15.5a.501.501 0 0 1-.5-.5V2.707ZM5.5 22h13c.275 0 .5-.225.5-.5V7h-3.5c-.827 0-1.5-.673-1.5-1.5V2H5.5c-.275 0-.5.225-.5.5v19c0 .276.224.5.5.5Z"
                  fill="#605E5C"
                ></path>
              </svg>
            </span>
            <span className="flex gap-2">
              <svg
                width="16"
                height="16"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="#afafaf"
                gradientcolor1="#afafaf"
                gradientcolor2="#afafaf"
              >
                <path
                  d="M5.5 22h13c.275 0 .5-.225.5-.5V7h-3.5c-.827 0-1.5-.673-1.5-1.5V2H5.5c-.275 0-.5.225-.5.5v19c0 .275.225.5.5.5Z"
                  fill="#fff"
                ></path>
                <path
                  d="M18.293 6 15 2.707V5.5c0 .275.225.5.5.5h2.793Z"
                  fill="#fff"
                ></path>
                <path
                  opacity="0.64"
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="m19.56 5.854-4.414-4.415A1.51 1.51 0 0 0 14.086 1H5.5C4.673 1 4 1.673 4 2.5v19c0 .827.673 1.5 1.5 1.5h13c.827 0 1.5-.673 1.5-1.5V6.914c0-.4-.156-.777-.44-1.06ZM15 2.707 18.293 6H15.5a.501.501 0 0 1-.5-.5V2.707ZM5.5 22h13c.275 0 .5-.225.5-.5V7h-3.5c-.827 0-1.5-.673-1.5-1.5V2H5.5c-.275 0-.5.225-.5.5v19c0 .276.224.5.5.5Z"
                  fill="#605E5C"
                ></path>
              </svg>
              <span>
                {highlightText(
                  message?.replyTo?.content?.content,
                  searchInputbox
                )}
              </span>
            </span>
          </>
        ) : message?.replyTo?.content?.fileType == "application/zip" ? (
          <>
            <span className="text-center grid place-content-center">
              <svg
                width="50"
                height="50"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="#afafaf"
                gradientcolor1="#afafaf"
                gradientcolor2="#afafaf"
              >
                <path
                  d="m12 6-1.268-1.268A2.5 2.5 0 0 0 8.964 4H2.5A1.5 1.5 0 0 0 1 5.5v13A1.5 1.5 0 0 0 2.5 20h19a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 21.5 6H12Z"
                  fill="#FFB900"
                ></path>
                <path
                  d="m12 6-1.268 1.268A2.5 2.5 0 0 1 8.964 8H1v10.5A1.5 1.5 0 0 0 2.5 20h19a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 21.5 6H12Z"
                  fill="#FFD75E"
                ></path>
                <path
                  d="m12 6-1.268 1.268A2.5 2.5 0 0 1 8.964 8H1v.5h8.007a3 3 0 0 0 2.122-.879Z"
                  fill="#fff"
                ></path>
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M2.5 11h8a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5V15h.75a.25.25 0 0 0 .25-.25v-2.5a.25.25 0 0 0-.25-.25H2v-.5a.5.5 0 0 1 .5-.5Zm10 4a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 1 0v2a.5.5 0 0 1-.5.5Zm2 0a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 1 0v2a.5.5 0 0 1-.5.5Zm1.5-.5a.5.5 0 0 0 1 0v-2a.5.5 0 0 0-1 0v2Zm2.5.5a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 1 0v2a.5.5 0 0 1-.5.5Zm1.5-.5a.5.5 0 0 0 1 0v-2a.5.5 0 0 0-1 0v2Zm2.5.5a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 1 0v2a.5.5 0 0 1-.5.5ZM10 14.75a.25.25 0 0 1-.25.25h-2.5a.25.25 0 0 1-.25-.25v-2.5a.25.25 0 0 1 .25-.25h2.5a.25.25 0 0 1 .25.25v2.5ZM1 15h.75a.25.25 0 0 0 .25-.25v-2.5a.25.25 0 0 0-.25-.25H1v3Z"
                  fill="#BF5712"
                ></path>
              </svg>
            </span>
            <span className="flex gap-2">
              <svg
                width="16"
                height="16"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="#afafaf"
                gradientcolor1="#afafaf"
                gradientcolor2="#afafaf"
              >
                <path
                  d="m12 6-1.268-1.268A2.5 2.5 0 0 0 8.964 4H2.5A1.5 1.5 0 0 0 1 5.5v13A1.5 1.5 0 0 0 2.5 20h19a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 21.5 6H12Z"
                  fill="#FFB900"
                ></path>
                <path
                  d="m12 6-1.268 1.268A2.5 2.5 0 0 1 8.964 8H1v10.5A1.5 1.5 0 0 0 2.5 20h19a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 21.5 6H12Z"
                  fill="#FFD75E"
                ></path>
                <path
                  d="m12 6-1.268 1.268A2.5 2.5 0 0 1 8.964 8H1v.5h8.007a3 3 0 0 0 2.122-.879Z"
                  fill="#fff"
                ></path>
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M2.5 11h8a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5V15h.75a.25.25 0 0 0 .25-.25v-2.5a.25.25 0 0 0-.25-.25H2v-.5a.5.5 0 0 1 .5-.5Zm10 4a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 1 0v2a.5.5 0 0 1-.5.5Zm2 0a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 1 0v2a.5.5 0 0 1-.5.5Zm1.5-.5a.5.5 0 0 0 1 0v-2a.5.5 0 0 0-1 0v2Zm2.5.5a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 1 0v2a.5.5 0 0 1-.5.5Zm1.5-.5a.5.5 0 0 0 1 0v-2a.5.5 0 0 0-1 0v2Zm2.5.5a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 1 0v2a.5.5 0 0 1-.5.5ZM10 14.75a.25.25 0 0 1-.25.25h-2.5a.25.25 0 0 1-.25-.25v-2.5a.25.25 0 0 1 .25-.25h2.5a.25.25 0 0 1 .25.25v2.5ZM1 15h.75a.25.25 0 0 0 .25-.25v-2.5a.25.25 0 0 0-.25-.25H1v3Z"
                  fill="#BF5712"
                ></path>
              </svg>
              <span>
                {highlightText(
                  message?.replyTo?.content?.content,
                  searchInputbox
                )}
              </span>
            </span>
          </>
        ) : message?.replyTo?.content?.fileType ==
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          message?.replyTo?.content?.fileType == "application/ms-excel" ? (
          <>
            <span className="text-center grid place-content-center">
              <svg
                width="50"
                height="50"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="#afafaf"
                gradientcolor1="#afafaf"
                gradientcolor2="#afafaf"
              >
                <path
                  d="M15 3H7.8c-.442 0-.8.298-.8.667V7l8 5 3.5 1.5L22 12V7l-7-4Z"
                  fill="#21A366"
                ></path>
                <path d="M7 12h8V7H7v5Z" fill="#107C41"></path>
                <path
                  d="M22 3.82V7h-7V3h6.17c.46 0 .83.37.83.82"
                  fill="#33C481"
                ></path>
                <path
                  d="M15 12H7v8.167c0 .46.373.833.833.833h13.334c.46 0 .833-.373.833-.833V17l-7-5Z"
                  fill="#185C37"
                ></path>
                <path d="M15 17h7v-5h-7v5Z" fill="#107C41"></path>
                <path
                  opacity="0.5"
                  d="M13.963 7H7v12h6.759c.63 0 1.241-.611 1.241-1.161V8c0-.55-.467-1-1.037-1"
                ></path>
                <path
                  d="M13 18H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1"
                  fill="#107C41"
                ></path>
                <path
                  d="m4.762 15.625 2.346-3.635-2.15-3.615h1.73l1.173 2.311c.108.219.182.382.223.49h.015c.077-.175.158-.345.242-.511l1.254-2.29h1.588L8.978 11.97l2.26 3.655H9.55l-1.355-2.538a2.07 2.07 0 0 1-.162-.339h-.02a1.612 1.612 0 0 1-.157.329L6.46 15.625h-1.7Z"
                  fill="#fff"
                ></path>
              </svg>
            </span>
            <span className="flex gap-2">
              <svg
                width="16"
                height="16"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="#afafaf"
                gradientcolor1="#afafaf"
                gradientcolor2="#afafaf"
              >
                <path
                  d="M15 3H7.8c-.442 0-.8.298-.8.667V7l8 5 3.5 1.5L22 12V7l-7-4Z"
                  fill="#21A366"
                ></path>
                <path d="M7 12h8V7H7v5Z" fill="#107C41"></path>
                <path
                  d="M22 3.82V7h-7V3h6.17c.46 0 .83.37.83.82"
                  fill="#33C481"
                ></path>
                <path
                  d="M15 12H7v8.167c0 .46.373.833.833.833h13.334c.46 0 .833-.373.833-.833V17l-7-5Z"
                  fill="#185C37"
                ></path>
                <path d="M15 17h7v-5h-7v5Z" fill="#107C41"></path>
                <path
                  opacity="0.5"
                  d="M13.963 7H7v12h6.759c.63 0 1.241-.611 1.241-1.161V8c0-.55-.467-1-1.037-1"
                ></path>
                <path
                  d="M13 18H3a1 1 0 0 1-1-1V7c0-.55.45-1 1-1h10c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1"
                  fill="#107C41"
                ></path>
                <path
                  d="m4.762 15.625 2.346-3.635-2.15-3.615h1.73l1.173 2.311c.108.219.182.382.223.49h.015c.077-.175.158-.345.242-.511l1.254-2.29h1.588L8.978 11.97l2.26 3.655H9.55l-1.355-2.538a2.07 2.07 0 0 1-.162-.339h-.02a1.612 1.612 0 0 1-.157.329L6.46 15.625h-1.7Z"
                  fill="#fff"
                ></path>
              </svg>

              <span>
                {highlightText(
                  message?.replyTo?.content?.content,
                  searchInputbox
                )}
              </span>
            </span>
          </>
        ) : message?.replyTo?.content?.fileType ==
          "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
          message?.replyTo?.content?.fileType ==
          "application/vnd.ms-powerpoint" ? (
          <>
            <span className="text-center grid place-content-center">
              <svg
                width="50"
                height="50"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="#afafaf"
                gradientcolor1="#afafaf"
                gradientcolor2="#afafaf"
              >
                <path
                  d="M13 3c-4.95 0-9 4.05-9 9l11 1.5L13 3Z"
                  fill="#ED6C47"
                ></path>
                <path
                  d="M13 3c4.95 0 9 4.05 9 9l-4.5 2-4.5-2V3Z"
                  fill="#FF8F6B"
                ></path>
                <path
                  d="M22 12c0 4.95-4.05 9-9 9s-9-4.05-9-9h18Z"
                  fill="#D35230"
                ></path>
                <path
                  opacity="0.5"
                  d="M14.013 7H5.529a8.93 8.93 0 0 0-1.53 5c0 2.821 1.319 5.347 3.367 7h6.453c.599 0 1.18-.611 1.18-1.161V8c0-.55-.443-1-.986-1"
                ></path>
                <path
                  d="M13 18H3c-.55 0-1-.45-1-1V7c0-.55.45-1 1-1h10c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1"
                  fill="#C43E1C"
                ></path>
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M10.093 8.957c-.46-.388-1.124-.582-1.99-.582H5.216v7.25h1.416v-2.36h1.38c.553 0 1.04-.101 1.46-.306.418-.204.742-.49.97-.857.227-.367.341-.99.341-1.463 0-.733-.23-1.295-.69-1.682ZM7.85 12.008H6.632v-2.51h1.264c.93 0 1.395.399 1.395 1.197 0 .412-.12.778-.364.992-.242.215-.6.322-1.077.322Z"
                  fill="#fff"
                ></path>
              </svg>
            </span>
            <span className="flex gap-2">
              <svg
                width="16"
                height="16"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="#afafaf"
                gradientcolor1="#afafaf"
                gradientcolor2="#afafaf"
              >
                <path
                  d="M13 3c-4.95 0-9 4.05-9 9l11 1.5L13 3Z"
                  fill="#ED6C47"
                ></path>
                <path
                  d="M13 3c4.95 0 9 4.05 9 9l-4.5 2-4.5-2V3Z"
                  fill="#FF8F6B"
                ></path>
                <path
                  d="M22 12c0 4.95-4.05 9-9 9s-9-4.05-9-9h18Z"
                  fill="#D35230"
                ></path>
                <path
                  opacity="0.5"
                  d="M14.013 7H5.529a8.93 8.93 0 0 0-1.53 5c0 2.821 1.319 5.347 3.367 7h6.453c.599 0 1.18-.611 1.18-1.161V8c0-.55-.443-1-.986-1"
                ></path>
                <path
                  d="M13 18H3c-.55 0-1-.45-1-1V7c0-.55.45-1 1-1h10c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1"
                  fill="#C43E1C"
                ></path>
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M10.093 8.957c-.46-.388-1.124-.582-1.99-.582H5.216v7.25h1.416v-2.36h1.38c.553 0 1.04-.101 1.46-.306.418-.204.742-.49.97-.857.227-.367.341-.99.341-1.463 0-.733-.23-1.295-.69-1.682ZM7.85 12.008H6.632v-2.51h1.264c.93 0 1.395.399 1.395 1.197 0 .412-.12.778-.364.992-.242.215-.6.322-1.077.322Z"
                  fill="#fff"
                ></path>
              </svg>

              <span>
                {highlightText(
                  message?.replyTo?.content?.content,
                  searchInputbox
                )}
              </span>
            </span>
          </>
        ) : message?.replyTo?.content?.fileType ==
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
          message?.replyTo?.content?.fileType == "application/msword" ? (
          <>
            <span className="text-center grid place-content-center">
              <svg
                width="50"
                height="50"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="#afafaf"
                gradientcolor1="#afafaf"
                gradientcolor2="#afafaf"
              >
                <path
                  d="M21.167 3H7.82a.82.82 0 0 0-.82.82v3.17l7.5 2.194L22 6.99V3.833A.836.836 0 0 0 21.167 3"
                  fill="#41A5EE"
                ></path>
                <path d="M22 7H7v5l7.5 2.016L22 12V7Z" fill="#2B7CD3"></path>
                <path d="M22 12H7v5l8 2 7-2v-5Z" fill="#185ABD"></path>
                <path
                  d="M22 17H7v3.177c0 .455.368.823.823.823h13.354a.822.822 0 0 0 .823-.823V17Z"
                  fill="#103F91"
                ></path>
                <path
                  opacity="0.5"
                  d="M13.963 7H7v12h6.759c.63 0 1.241-.611 1.241-1.161V8c0-.55-.467-1-1.037-1"
                ></path>
                <path
                  d="M13 18H3c-.55 0-1-.45-1-1V7c0-.55.45-1 1-1h10c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1"
                  fill="#185ABD"
                ></path>
                <path
                  d="M6.009 13.86c.021.173.034.323.04.45h.024a8.54 8.54 0 0 1 .133-.875l1.104-5.06h1.427l1.142 4.986c.057.246.105.559.143.94h.019c.016-.263.055-.566.119-.91l.913-5.016h1.299l-1.598 7.25H9.256l-1.09-4.803a13.053 13.053 0 0 1-.107-.541 6.634 6.634 0 0 1-.073-.485h-.019a16.446 16.446 0 0 1-.162 1.042l-1.023 4.787H5.241l-1.613-7.25h1.323l.994 5.07c.022.106.043.244.064.416"
                  fill="#fff"
                ></path>
              </svg>
            </span>
            <span className="flex gap-2">
              <svg
                width="16"
                height="16"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="#afafaf"
                gradientcolor1="#afafaf"
                gradientcolor2="#afafaf"
              >
                <path
                  d="M21.167 3H7.82a.82.82 0 0 0-.82.82v3.17l7.5 2.194L22 6.99V3.833A.836.836 0 0 0 21.167 3"
                  fill="#41A5EE"
                ></path>
                <path d="M22 7H7v5l7.5 2.016L22 12V7Z" fill="#2B7CD3"></path>
                <path d="M22 12H7v5l8 2 7-2v-5Z" fill="#185ABD"></path>
                <path
                  d="M22 17H7v3.177c0 .455.368.823.823.823h13.354a.822.822 0 0 0 .823-.823V17Z"
                  fill="#103F91"
                ></path>
                <path
                  opacity="0.5"
                  d="M13.963 7H7v12h6.759c.63 0 1.241-.611 1.241-1.161V8c0-.55-.467-1-1.037-1"
                ></path>
                <path
                  d="M13 18H3c-.55 0-1-.45-1-1V7c0-.55.45-1 1-1h10c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1"
                  fill="#185ABD"
                ></path>
                <path
                  d="M6.009 13.86c.021.173.034.323.04.45h.024a8.54 8.54 0 0 1 .133-.875l1.104-5.06h1.427l1.142 4.986c.057.246.105.559.143.94h.019c.016-.263.055-.566.119-.91l.913-5.016h1.299l-1.598 7.25H9.256l-1.09-4.803a13.053 13.053 0 0 1-.107-.541 6.634 6.634 0 0 1-.073-.485h-.019a16.446 16.446 0 0 1-.162 1.042l-1.023 4.787H5.241l-1.613-7.25h1.323l.994 5.07c.022.106.043.244.064.416"
                  fill="#fff"
                ></path>
              </svg>

              <span>
                {highlightText(
                  message?.replyTo?.content?.content,
                  searchInputbox
                )}
              </span>
            </span>
          </>
        ) : (
          <span>
            {highlightText(message?.replyTo?.content?.content, searchInputbox)}
          </span>
        )}
      </p>
    );
  };

  return (
    <div
      className="flex justify-between rounded-lg flex-col-reverse relative"
    // style={{
    //   backgroundColor: `${message.sender === userId ? "#ccf7ff" : "#f1f1f1"}`,
    // }}
    >
      {/* <div className="flex flex-col-reverse"> */}
      <div
        className="reply-preview bg-gray-50 p-1 rounded mb-1 text-sm order-2 mx-1 my-1 cursor-pointer"
        onClick={() => {
          const originalMessage = messages.find(
            (msg) => msg._id === message.replyTo._id
          );
          console.log(
            "originalMessage",
            originalMessage,
            messages,
            message.replyTo._id
          );
          if (originalMessage) {
            const messageElement = document.getElementById(
              `message-${originalMessage._id}`
            );
            if (messageElement) {
              document.querySelectorAll(".highlight-message").forEach((el) => {
                el.classList.remove("highlight-message");
              });
              messageElement.classList.add("highlight-message");

              messageElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });

              setTimeout(() => {
                messageElement.classList.remove("highlight-message");
              }, 2000);
            }
          }
        }}
      >
        <div className="flex justify-between items-center mb-2">
          <p className="text-gray-600">
            <SlActionUndo />
          </p>
          <div className="flex">
            <p className="text-blue-600 font-medium">
              {
                allUsers.find((user) => user._id === message.replyTo.sender)
                  ?.userName
              }
            </p>
            <p className="text-gray-600 ml-2">
              {new Date(message.replyTo.createdAt).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
                hour12: false,
              })}
            </p>
          </div>
        </div>
        {getReplyContent()}
      </div>
      <p className="p-2">
        {highlightText(message.content.content, searchInputbox)}
      </p>
      {/* </div> */}
    </div>
  );
});

const MessageReactions = memo(({
  message,
  userId,
  // showEmojiPicker,
  // setShowEmojiPicker,
  addMessageReaction,
  allUsers,
}) => {

  const [showEmojiPicker, setShowEmojiPicker] = useState({ messageId: null, position: null });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showEmojiPicker?.messageId &&
        !event.target.closest(".EmojiPickerReact") &&
        !event.target.closest(".emoji-trigger-button")
      ) {
        setShowEmojiPicker(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  return (
    <>
      {message.sender !== userId && (
        <>
          <div className="relative">
            <button
              className="hover:scale-125 transition-transform absolute -right-6 -top-0 text-gray-400"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault(); 

                const messageElement = document.getElementById(
                  `message-${message._id}`
                );
                const messageRect = messageElement.getBoundingClientRect();
                const windowHeight = window.innerHeight;

                const isInBottomHalf = messageRect.top > windowHeight / 2;

                setShowEmojiPicker({
                  messageId: message._id,
                  position: isInBottomHalf ? "top" : "bottom",
                });
              }}
            >
              <FaRegSmile />
            </button>
            {showEmojiPicker?.messageId === message._id && (
              <div
                className="absolute z-50"
                style={{
                  right: "calc(-290px + 24px)",
                  ...(showEmojiPicker.position === "top"
                    ? { bottom: "24px" }
                    : { top: "24px" }),
                }}
                // onMouseLeave={() => setShowEmojiPicker(null)}
              >
                <EmojiPicker
                  onEmojiClick={(event) => {
                    addMessageReaction(message, event.emoji);
                    setShowEmojiPicker(null);
                  }}
                  width={250}
                  height={300}
                  searchDisabled
                  reactionsDefaultOpen
                  skinTonesDisabled
                  previewConfig={{
                    showPreview: false,
                  }}
                  theme="light"
                  emojiSize={20}
                  emojiStyle="google"
                  emojiSet="google"
                  lazyLoadEmojis={true}
                />
              </div>
            )}
          </div>
        </>
      )}
      {message.reactions && message.reactions.length > 0 && (
        <div className="absolute -bottom-4 left-1 flex space-x-1" onClick={(e) => e.stopPropagation()}>
          {message.reactions.map((reaction, index) => (
            <div
              key={index}
              className="z-40 bg-white rounded-full p-1 w-6 h-6 flex items-center justify-center shadow-md shadow-gray-400"
              title={allUsers.find((u) => u._id === reaction.userId)?.userName}
            >
              <img
                src={`https://cdn.jsdelivr.net/npm/emoji-datasource-facebook/img/facebook/64/${reaction.emoji
                  .codePointAt(0)
                  .toString(16)}.png`}
                alt={reaction.emoji}
                className="w-4 h-4"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.innerHTML = reaction.emoji;
                }}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
});

MessageReactions.displayName = 'MessageReactions';

const MessageContextMenu = ({
  message,
  contextMenu,
  handleEditMessage,
  handleDeleteMessage,
  handleCopyMessage,
  handleReplyMessage,
  handleForwardMessage,
  setContextMenu,
  setActiveMessageId,
  dropdownRef,
  userId,
}) => {
  const getMenuPosition = () => {
    if (!contextMenu.visible) return {};

    const menuWidth = 112; // w-28 = 7rem = 112px
    const menuHeight = 200; // Approximate max height of menu
    const screenPadding = 10; // Minimum padding from screen edges

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = contextMenu.x;
    let y = contextMenu.y;

    // Check horizontal overflow
    if (x + menuWidth > viewportWidth - screenPadding) {
      x = viewportWidth - menuWidth - screenPadding;
    } else if (x < screenPadding) {
      x = screenPadding;
    }

    // Check vertical overflow
    if (y + menuHeight > viewportHeight - screenPadding) {
      y = y - menuHeight; // Show menu above the click position
    }

    return {
      top: `${y}px`,
      left: `${x}px`,
      transform: "translate(-50%, 0)",  
    };
  };

  // Add useEffect to handle wheel event prevention
  useEffect(() => {
    const preventScroll = (e) => {
      e.preventDefault();
    };

    if (contextMenu.visible) {
      // Add wheel event listener when menu is visible
      document.addEventListener('wheel', preventScroll, { passive: false });
    }

    // Cleanup function to remove event listener
    return () => {
      document.removeEventListener('wheel', preventScroll);
    };
  }, [contextMenu.visible]);

  return (
    <>
      {contextMenu.visible && contextMenu.messageId === message._id && (
        <div
          className="fixed bg-white dark:bg-[#2C2C2C] dark:text-white  rounded shadow-lg z-[1000] context-menu"
          style={getMenuPosition()}
          onClick={(e) => e.stopPropagation()}
        >
          {!message.content?.fileType?.includes("image/") &&
            !message.content?.fileType?.includes("audio/") &&
            !message.content?.type?.includes("file") &&
            message.receiver !== userId && (
              <>
                <button
                  className="w-28 px-4 py-2 text-left text-black dark:text-white flex items-center hover:bg-gray-100 dark:hover:text-primary-dark"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    console.log("SDFbsdbsdb");

                    handleEditMessage(contextMenu.message);
                  }}
                >
                  <span className="mr-2">
                    <svg width={24} height={24} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.50834 18C2.44155 18.0001 2.3754 17.9869 2.3137 17.9613C2.25201 17.9357 2.19599 17.8982 2.14886 17.8508C2.08679 17.7888 2.04185 17.7118 2.01843 17.6273C1.995 17.5427 1.99389 17.4536 2.0152 17.3685L2.97035 13.5346C2.99264 13.4451 3.03884 13.3632 3.10401 13.2979L13.8564 2.54547C14.5836 1.81818 15.7675 1.81818 16.4948 2.54547L17.454 3.50472C18.1814 4.23208 18.1814 5.41591 17.454 6.14311L6.70177 16.8955C6.63654 16.9609 6.55466 17.0071 6.46501 17.0292L2.63122 17.9843C2.59114 17.995 2.54983 18.0002 2.50837 18H2.50834ZM3.92289 13.9173L3.20651 16.7924L6.08165 16.076L16.7349 5.42335C17.0653 5.09294 17.0653 4.55429 16.7349 4.22387L15.7757 3.26462C15.4446 2.93357 14.9059 2.93418 14.5762 3.26462L3.92289 13.9173Z" fill="currentColor" />
                      <path d="M15.441 7.94777C15.3107 7.94777 15.1804 7.89819 15.0814 7.79856L12.2029 4.92068C12.004 4.72179 12.004 4.39958 12.2029 4.20083C12.4017 4.00207 12.7239 4.00207 12.9227 4.20083L15.8013 7.07947C16.0001 7.27823 16.0001 7.60044 15.8013 7.79919C15.7008 7.89819 15.5706 7.94777 15.441 7.94777ZM6.34325 17.0455C6.21296 17.0455 6.0828 16.9959 5.98377 16.8962L3.10512 14.0177C2.90637 13.8188 2.90637 13.4966 3.10512 13.2978C3.30388 13.0991 3.62612 13.0991 3.82501 13.2978L6.70352 16.1765C6.90228 16.3752 6.90228 16.6975 6.70352 16.8962C6.65629 16.9436 6.60014 16.9812 6.5383 17.0069C6.47647 17.0325 6.41018 17.0456 6.34325 17.0455Z" fill="currentColor" />
                    </svg>

                  </span> Edit
                </button>

              </>
            )}


          <button
            className="w-28 px-4 py-2 text-left text-black dark:text-white flex items-center hover:bg-gray-100 dark:hover:text-primary-dark"
            onClick={() => {
              handleReplyMessage(message);
              setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
            }}
          >
            <LuReply className="mr-2" /> Reply
          </button>
          <button
            className="w-28 px-4 py-2 text-left text-black dark:text-white flex items-center hover:bg-gray-100 dark:hover:text-primary-dark"
            onClick={() => handleForwardMessage(message)}
          >
            <LuForward className="mr-2 " /> Forward
          </button>
          {
            (message.content?.fileType?.includes("image/") ||
              message.content?.type?.includes("text")) && (
              <button
                className="w-28 px-4 py-2 text-left text-black dark:text-white flex items-center hover:bg-gray-100 dark:hover:text-primary-dark"
                onClick={() => {
                  handleCopyMessage(message.content, () =>
                    setActiveMessageId(null)
                  );
                  setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
                }}
              >
                <MdOutlineContentCopy className="mr-2 " /> Copy
              </button>
            )}
          <button
            className="w-28 px-4 py-2 text-left text-red-500  flex items-center hover:bg-gray-100 dark:hover:text-primary-dark"
            onClick={() => handleDeleteMessage(message._id)}
          >
            <span className="mr-2">

              <svg width={24} height={24} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.6562 3.875H13.3125V3.40625C13.3125 2.63084 12.6817 2 11.9062 2H8.15625C7.38084 2 6.75 2.63084 6.75 3.40625V3.875H4.40625C3.63084 3.875 3 4.50584 3 5.28125C3 5.904 3.40703 6.43316 3.96891 6.61753L4.805 16.7105C4.86522 17.4336 5.48078 18 6.20638 18H13.8561C14.5817 18 15.1973 17.4336 15.2576 16.7103L16.0936 6.6175C16.6555 6.43316 17.0625 5.904 17.0625 5.28125C17.0625 4.50584 16.4317 3.875 15.6562 3.875ZM7.6875 3.40625C7.6875 3.14778 7.89778 2.9375 8.15625 2.9375H11.9062C12.1647 2.9375 12.375 3.14778 12.375 3.40625V3.875H7.6875V3.40625ZM14.3232 16.6327C14.3032 16.8737 14.098 17.0625 13.8561 17.0625H6.20638C5.96453 17.0625 5.75934 16.8737 5.73931 16.6329L4.91544 6.6875H15.1471L14.3232 16.6327ZM15.6562 5.75H4.40625C4.14778 5.75 3.9375 5.53972 3.9375 5.28125C3.9375 5.02278 4.14778 4.8125 4.40625 4.8125H15.6562C15.9147 4.8125 16.125 5.02278 16.125 5.28125C16.125 5.53972 15.9147 5.75 15.6562 5.75Z" fill="currentColor" />
                <path d="M8.15538 15.6273L7.68663 8.06477C7.6706 7.80636 7.44694 7.60983 7.18979 7.62592C6.93138 7.64195 6.73491 7.86439 6.75091 8.12277L7.21966 15.6853C7.23507 15.9338 7.44144 16.125 7.68707 16.125C7.95854 16.125 8.17204 15.8964 8.15538 15.6273ZM10.0313 7.62505C9.77241 7.62505 9.56254 7.83492 9.56254 8.0938V15.6563C9.56254 15.9152 9.77241 16.125 10.0313 16.125C10.2902 16.125 10.5 15.9152 10.5 15.6563V8.0938C10.5 7.83492 10.2902 7.62505 10.0313 7.62505ZM12.8728 7.62595C12.6149 7.60992 12.3919 7.80639 12.3759 8.0648L11.9072 15.6273C11.8912 15.8857 12.0877 16.1081 12.346 16.1241C12.6046 16.1401 12.8269 15.9436 12.8429 15.6853L13.3116 8.1228C13.3276 7.86439 13.1312 7.64195 12.8728 7.62595Z" fill="currentColor" />
              </svg>
            </span>

            Remove
          </button>

          {/* {message.content?.fileType?.includes("audio/") && (
            <button
              className="w-28 px-4 py-2 text-left text-black dark:text-white flex items-center hover:bg-gray-100 dark:hover:text-primary-dark"
              onClick={() => handleDeleteMessage(message._id)}
            >
              <CiSquareRemove className="mr-2" /> Remove
            </button>
          )} */}
        </div>
      )}
    </>
  );
};

const RegularMessage = memo(({
  message,
  userId,
  showTime,
  name,
  currentTime,
  isConsecutive,
  handleContextMenu,
  handleEditMessage,
  handleDeleteMessage,
  handleCopyMessage,
  handleReplyMessage,
  handleForwardMessage,
  handleImageClick,
  highlightText,
  searchInputbox,
  contextMenu,
  setContextMenu,
  setActiveMessageId,
  allUsers,
  IMG_URL,
  // showEmojiPicker,
  // setShowEmojiPicker,
  addMessageReaction,
  dropdownRef,
  selectedChat,
  messages,
}) => {
  const messageContent = message?.content?.content;
  const isSingleEmoji = messageContent?.match(/^\p{Emoji}$/gu);
  const lastMessageFromCurrentUser = messages
    .filter((message) => message.sender === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  return (
    <div
      key={message._id}
      id={`message-${message._id}`}
      className={`flex relative ${message.sender === userId
        ? "justify-end items-end"
        : "justify-start items-start"
        }  message-content 
    ${message.reactions && message.reactions.length > 0
          ? "mb-8"
          : `${isConsecutive ? "mb-1" : "mb-4"}`
        }
    ${showTime ? "mt-3" : ""}`}
    >
      <div
        className="flex flex-col relative group"
        onContextMenu={(e) => handleContextMenu(e, message)}
      >
        <div className="flex justify-between items-center">
          <div>
            {message?.forwardedFrom && (
              <div className="forwarded-label text-gray-500 text-sm mb-1">
                <BiShare className="inline mr-1" />
              </div>
            )}
          </div>
        {showTime && (
          <div
            className={`text-[11px] flex  text-gray-700 dark:text-gray-400  mb-1 w-full mt-1 ${message.sender == userId
              ? "pe-7 text-right justify-end"
              : "text-left"
              }`}
            style={{
              alignItems: "center",
            }}
          >
            {selectedChat?.members && message.sender !== userId
              ? `${name},`
              : ""}{" "}
            <FaRegClock className="mr-[2px]" /> {currentTime}
          </div>
        )}
        </div>{" "}
        <div className="flex">
          <div
            className={`p-2 pl-3 relative min-w-[100px] dark:text-white ${isSingleEmoji
              ? "bg-transparent"
              : message.sender === userId
                ? "bg-primary/50 rounded-s-xl"
                : "bg-primary rounded-e-xl "
              }
          ${showTime ? " rounded-tr-xl rounded-tl-xl" : ""}
          ${message.reactions && message.reactions.length > 0 ? "pb-4" : ""}
          `}
          >
            <MessageContent
              message={message}
              userId={userId}
              handleImageClick={handleImageClick}
              highlightText={highlightText}
              searchInputbox={searchInputbox}
              IMG_URL={IMG_URL}
              messages={messages}
              allUsers={allUsers}
            />

            {message.edited && (
              <div
                className={`absolute bottom-0 ${message.sender === userId ? "-left-5" : "-right-5"
                  } flex items-center text-xs text-gray-500 mt-1`}
              >
                <FiEdit2 className="w-4 h-4" />
              </div>
            )}

            {/* Add three dots icon */}
            <div
              className={`absolute ${message.sender === userId ? "-right-4" : "-left-4"
                } top-0 opacity-0 group-hover:opacity-100 cursor-pointer`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();

                const x =
                  message.sender === userId
                    ? rect.x + 200 // For right-aligned messages
                    : rect.x + 70; // For left-aligned messages

                setContextMenu({
                  visible: true,
                  x: x,
                  y: rect.y + rect.height,
                  messageId: message._id,
                  message: message,
                });
              }}
            >
              <PiDotsThreeVerticalBold className="text-gray-700 hover:text-gray-900" />
            </div>
          </div>
          {message.sender === userId && (
            <MessageStatus
              message={message}
              userId={userId}
              last={lastMessageFromCurrentUser}
            />
          )}

          {!isSingleEmoji && (
            <MessageReactions
              message={message}
              userId={userId}
              // showEmojiPicker={showEmojiPicker}
              // setShowEmojiPicker={setShowEmojiPicker}
              addMessageReaction={addMessageReaction}
              allUsers={allUsers}
            />
          )}
        </div>
        {/* {console.log("contextMenu", contextMenu)} */}
        <MessageContextMenu
          message={message}
          contextMenu={contextMenu}
          handleEditMessage={handleEditMessage}
          handleDeleteMessage={handleDeleteMessage}
          handleCopyMessage={handleCopyMessage}
          handleReplyMessage={handleReplyMessage}
          handleForwardMessage={handleForwardMessage}
          setContextMenu={setContextMenu}
          setActiveMessageId={setActiveMessageId}
          dropdownRef={dropdownRef}
          userId={userId}
        />
      </div>
    </div>
  );
});

const EmptyMessages = ({ selectedChat, sendPrivateMessage }) => {

  const handleSayHello = async () => {
    if (!selectedChat?._id) return;

    try {
      const messageData = {
        data: {
          type: "text",
          content: "Hello"
        }
      };

      await sendPrivateMessage(selectedChat._id, messageData);
    } catch (error) {
      console.error("Error sending hello message:", error);
    }
  };
  return (
    <div className=" flex flex-col items-center justify-center w-full">
      <div
        className="flex justify-center items-center my-4  date-header px-2 w-full"
      // data-date={date}
      >
        <div className="sm:block flex-1 h-[1px] bg-gradient-to-r from-gray-200/30 to-gray-300 dark:bg-gradient-to-l dark:from-gray-300/30 dark:to-gray-300/20 max-w-[45%]" />
        <span className=" text-xs whitespace-nowrap px-2 sm:px-5 py-1 rounded-full  bg-gray-300 dark:bg-gray-500 text">
          Today
        </span>
        <div className="sm:block flex-1 h-[1px] bg-gradient-to-l from-gray-200/30 to-gray-300 dark:bg-gradient-to-r dark:from-gray-300/30 dark:to-gray-300/20 max-w-[45%]" />
      </div>

      <div className="flex flex-col items-center justify-center dark:bg-primary-light/10 dark:text-white shadow-lg p-6 rounded-lg min-w-[300px]">
        <div className="w-10 h-10 rounded-full overflow-hidden mb-4 bg-gray-500 flex items-center justify-center">
          {selectedChat?.photo &&
            selectedChat.photo !== "null" &&
            selectedChat?.profilePhoto == "Everyone" ? (
            <img
              src={`${IMG_URL}${selectedChat.photo.replace(/\\/g, "/")}`}
              alt="Profile"
              className="object-cover"
            />
          ) : (
            <span className="text-white text-xl font-bold">
              {selectedChat?.userName && selectedChat?.userName.includes(" ")
                ? selectedChat?.userName.split(" ")?.[0][0] +
                selectedChat?.userName.split(" ")?.[1][0]
                : selectedChat?.userName?.[0]}
            </span>
          )}
        </div>
        <p className="text-gray-400 text-lg mb-4">
          Say Hello to {selectedChat?.userName}.
        </p>
        <button onClick={handleSayHello} className="bg-primary hover:bg-primary/80 text-white font-medium py-2 px-6 rounded-full transition duration-200">
          Say Hello
        </button>
      </div>
    </div>
  )
};

const DownloadButton =  memo(({ fileUrl, fileName, className = "" }) => {
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (e) => {
    e.preventDefault();
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const response = await fetch(fileUrl);
      const contentLength = response.headers.get("content-length");
      const total = parseInt(contentLength, 10);
      let loaded = 0;

      const reader = response.body.getReader();
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        loaded += value.length;
        setDownloadProgress((loaded / total) * 100);
      }

      const blob = new Blob(chunks);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  return (
    <button
      onClick={handleDownload}
      className={`p-2 bg-white rounded-full dark:text-primary-light hover:underline disabled:opacity-50 relative ${className}`}
    >
      <span className="text-primary">
        <svg width={24} height={24} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.5003 15.8337H2.50033C2.27931 15.8337 2.06735 15.9215 1.91107 16.0777C1.75479 16.234 1.66699 16.446 1.66699 16.667C1.66699 16.888 1.75479 17.1 1.91107 17.2562C2.06735 17.4125 2.27931 17.5003 2.50033 17.5003H17.5003C17.7213 17.5003 17.9333 17.4125 18.0896 17.2562C18.2459 17.1 18.3337 16.888 18.3337 16.667C18.3337 16.446 18.2459 16.234 18.0896 16.0777C17.9333 15.9215 17.7213 15.8337 17.5003 15.8337ZM10.0003 1.66699C9.77931 1.66699 9.56735 1.75479 9.41107 1.91107C9.25479 2.06735 9.16699 2.27931 9.16699 2.50033V11.3253L6.42533 8.57533C6.26841 8.41841 6.05558 8.33025 5.83366 8.33025C5.61174 8.33025 5.39891 8.41841 5.24199 8.57533C5.08507 8.73225 4.99692 8.94507 4.99692 9.16699C4.99692 9.38891 5.08507 9.60174 5.24199 9.75866L9.40866 13.9253C9.48613 14.0034 9.5783 14.0654 9.67984 14.1077C9.78139 14.15 9.89032 14.1718 10.0003 14.1718C10.1103 14.1718 10.2193 14.15 10.3208 14.1077C10.4224 14.0654 10.5145 14.0034 10.592 13.9253L14.7587 9.75866C14.8364 9.68096 14.898 9.58872 14.94 9.4872C14.9821 9.38568 15.0037 9.27688 15.0037 9.16699C15.0037 9.05711 14.9821 8.9483 14.94 8.84678C14.898 8.74527 14.8364 8.65302 14.7587 8.57533C14.681 8.49763 14.5887 8.43599 14.4872 8.39394C14.3857 8.35189 14.2769 8.33025 14.167 8.33025C14.0571 8.33025 13.9483 8.35189 13.8468 8.39394C13.7453 8.43599 13.653 8.49763 13.5753 8.57533L10.8337 11.3253V2.50033C10.8337 2.27931 10.7459 2.06735 10.5896 1.91107C10.4333 1.75479 10.2213 1.66699 10.0003 1.66699Z" fill="currentColor" />
        </svg>
      </span>
      {isDownloading && (
        <div className="absolute -inset-4 flex items-center justify-center">
          <svg className="w-12 h-12" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="15.9155"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="2"
            />
            <circle
              cx="18"
              cy="18"
              r="15.9155"
              fill="none"
              className="stroke-primary/90"
              strokeWidth="2"
              strokeDasharray={`${downloadProgress}, 100`}
              strokeLinecap="round"
              style={{
                transition: "stroke-dasharray 0.3s ease 0s",
                transform: "rotate(-90deg)",
                transformOrigin: "50% 50%",
              }}
            />
          </svg>
        </div>
      )}
    </button>
  );
});


