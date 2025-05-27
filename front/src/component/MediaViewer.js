import React, { memo, useEffect, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { RxCross2 } from 'react-icons/rx';
import { GoTrash } from 'react-icons/go';
import { useDispatch, useSelector } from 'react-redux';
import { setIsImageModalOpen, setSelectedImage } from '../redux/slice/manageState.slice';
import { deleteMessage, getAllMessages } from '../redux/slice/user.slice';
import { useSocket } from '../context/SocketContext';

const MediaViewer = memo(({
  isOpen,
  onClose,
  // onDeleteMessage,
}) => {
  const dispatch = useDispatch();
  const { socket } = useSocket();
  const { messages } = useSelector((state) => state.user);
  const {selectedImage,isImageModalOpen,selectedChat} = useSelector(state => state.magageState)
  const [videoDurations, setVideoDurations] = useState({}); 
   // button
   useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isImageModalOpen || !selectedImage) return;

      const mediaMessages = messages.filter(message =>
        message.content &&
        message.content.fileType &&
        (message.content.fileType.startsWith('image/') || message.content.fileType.startsWith('video/'))
      );
      const currentIndex = mediaMessages.findIndex(message =>
        `${message.content.fileUrl.replace(/\\/g, '/')}` === selectedImage
      );

      if (e.key === 'ArrowLeft') {
        const prevIndex = (currentIndex - 1 + mediaMessages.length) % mediaMessages.length;
        dispatch(setSelectedImage(`${mediaMessages[prevIndex].content.fileUrl.replace(/\\/g, '/')}`));
      } else if (e.key === 'ArrowRight') {
        const nextIndex = (currentIndex + 1) % mediaMessages.length;
        dispatch(setSelectedImage(`${mediaMessages[nextIndex].content.fileUrl.replace(/\\/g, '/')}`));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isImageModalOpen, selectedImage, messages]);

  const getVideoDuration = (videoElement) => {
    return videoElement.duration; // Return the duration of the video
  };

  const onVideoMetadataLoad = (messageId, videoElement) => {
    const duration = getVideoDuration(videoElement); // Get the duration using the utility function
    setVideoDurations((prev) => ({
      ...prev,
      [messageId]: duration, // Store duration by message ID
    }));
  };

  const onDeleteMessage = async (messageId) => {
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
  };

  if (!isImageModalOpen || !selectedImage) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="relative w-full h-full flex items-center flex-col justify-center gap-2 p-8">
        <div style={{ height: 'calc(100vh - 80px)' }} className="">
          {selectedImage && (
            <div className="mb-4">
              {selectedImage.endsWith('.mp4') ? (
                <video
                  src={selectedImage}
                  alt="Selected Video"
                  style={{ height: 'calc(100vh - 180px)', width: 'calc(100vh - 180px)' }}
                  className="object-cover mb-2"
                  controls
                  autoPlay
                />
              ) : (
                <img
                  src={selectedImage}
                  alt="Selected"
                  style={{ height: 'calc(100vh - 180px)', width: 'calc(100vh - 180px)' }}
                  className="object-cover mb-2"
                />
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 items-end">
          {messages.map((message, index) => (
            <React.Fragment key={index}>
              {message.content?.fileType?.startsWith('image/') && (
                <div className="relative">
                  {selectedImage === `${message.content.fileUrl.replace(/\\/g, '/')}` && (
                    <div className="absolute inset-0 bg-black opacity-60 z-10">
                      <div 
                        className="text-white flex items-center justify-center h-full text-2xl cursor-pointer" 
                        onClick={() => { 
                          onDeleteMessage(message._id); 
                          dispatch(setIsImageModalOpen(false))
                        }}
                      >
                        <GoTrash />
                      </div>
                    </div>
                  )}

                  <img
                    className={`w-[75px] h-[75px] object-cover rounded cursor-pointer ${
                      selectedImage === `${message.content.fileUrl.replace(/\\/g, '/')}` ? 'border-2 border-blue-500' : ''
                    }`}
                    src={`${message.content.fileUrl.replace(/\\/g, '/')}`}
                    alt={`Image ${index}`}
                    onClick={() => {
                      dispatch(setSelectedImage(`${message.content.fileUrl.replace(/\\/g, '/')}`));
                    }}
                  />
                </div>
              )}
              {message.content?.fileType?.startsWith('video/') && (
                <div 
                  className="flex flex-col items-center relative cursor-pointer" 
                  onClick={() => {
                    dispatch(setSelectedImage(`${message.content.fileUrl.replace(/\\/g, '/')}`));
                  }}
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-black opacity-50 z-10" />
                    <video
                      className={`w-[75px] h-[75px] rounded object-cover cursor-pointer ${
                        selectedImage === `${message.content.fileUrl.replace(/\\/g, '/')}` ? 'border-2 border-blue-500' : ''
                      }`}
                      src={`${message.content.fileUrl.replace(/\\/g, '/')}`}
                      alt={`Video ${index}`}
                      onLoadedMetadata={(e) => {
                        onVideoMetadataLoad(message._id, e.target);
                      }}
                    />
                    {videoDurations[message._id] && (
                      <span className="text-xs text-white absolute bottom-1 left-1 z-20">
                        {Math.floor(videoDurations[message._id] / 60)}:
                        {(Math.floor(videoDurations[message._id]) % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="absolute top-1/2 left-4 transform -translate-y-1/2">
          <button
            onClick={() => {
              const mediaMessages = messages.filter(
                message => message.content?.fileType && 
                (message.content.fileType.startsWith('image/') || message.content.fileType.startsWith('video/'))
              );
              const currentIndex = mediaMessages.findIndex(
                message => `${message.content.fileUrl.replace(/\\/g, '/')}` === selectedImage
              );
              const prevIndex = (currentIndex - 1 + mediaMessages.length) % mediaMessages.length;
              dispatch(setSelectedImage(`${mediaMessages[prevIndex].content.fileUrl.replace(/\\/g, '/')}`));
            }}
            className="bg-primary flex justify-center items-center h-[40px] w-[40px] text-white p-2 rounded-full"
          >
            <span>
              <FaChevronLeft />
            </span>
          </button>
        </div>

        <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
          <button
            onClick={() => {
              const mediaMessages = messages.filter(
                message => message.content?.fileType && 
                (message.content.fileType.startsWith('image/') || message.content.fileType.startsWith('video/'))
              );
              const currentIndex = mediaMessages.findIndex(
                message => `${message.content.fileUrl.replace(/\\/g, '/')}` === selectedImage
              );
              const nextIndex = (currentIndex + 1) % mediaMessages.length;
              dispatch(setSelectedImage(`${mediaMessages[nextIndex].content.fileUrl.replace(/\\/g, '/')}`));
            }}
            className="bg-primary flex justify-center items-center h-[40px] w-[40px] text-white p-2 rounded-full"
          >
            <span>
              <FaChevronRight />
            </span>
          </button>
        </div>

        <button
          onClick={()=>{dispatch(setIsImageModalOpen(false))}}
          className="absolute top-4 right-4 text-white hover:text-gray-300"
        >
          <RxCross2 className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
});

export default MediaViewer;