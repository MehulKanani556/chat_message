// front/src/components/ChatInput.js
import React, { useRef, useState } from 'react';
import { IoMicOutline } from 'react-icons/io5';
import { PiSmiley } from 'react-icons/pi';
import { GoPlusCircle } from 'react-icons/go';
import EmojiPicker from 'emoji-picker-react';

const ChatInput = ({
  user,
  selectedChat,
  messageInput,
  setMessageInput,
  editingMessage,
  setEditingMessage,
  selectedFiles,
  setSelectedFiles,
  isRecording,
  recordingTime,
  barHeights,
  cameraStream,
  handleInputChange,
  handleSubmit,
  handleVoiceMessage,
  startRecording,
  handleMultipleFileUpload,
  onEmojiClick,
  openCamera,
  dispatch,
  blockUser,
  getUser,
  currentUser,
  getAllMessageUsers,
  setIsDeleteChatModalOpen,
  replyingTo
}) => {
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [docModel, setDocModel] = useState(false);
  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);

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
            Delete Chat
          </button>
          <button
            className="bg-primary dark:hover:bg-primary/70 py-1 rounded-md w-32"
            onClick={async () => {
              await dispatch(blockUser({ selectedUserId: selectedChat?._id }));
              await dispatch(getUser(currentUser));
              await dispatch(getAllMessageUsers());
            }}
          >
            Unblock
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto px-4 py-3 mb-5 md:mb-0 dark:bg-[#1A1A1A]">
    <form
      onSubmit={handleSubmit}
      className={`flex items-center gap-2 ${replyingTo || selectedFiles.length > 0
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
          <div className="flex-1 min-w-0 p-1 md:p-2 rounded-md bg-[#e5e7eb] dark:text-white dark:bg-white/10 relative">
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
              className="ps-9 md:ps-2 w-full px-2 py-1 outline-none text-black dark:text-white bg-transparent"
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  e.preventDefault();

                  if (selectedFiles.length > 0) {
                    await handleMultipleFileUpload(
                      selectedFiles
                    ); // Upload selected files
                    setSelectedFiles([]); // Clear selected files after sending
                  }
                  await handleSubmit(e);
                } else if (
                  e.key === "Escape" &&
                  editingMessage
                ) {
                  setEditingMessage(null);
                  setMessageInput("");
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
              className={`${selectedFiles.length>0 ||messageInput ||cameraStream ?'hidden md:block' :'block md:block' } p-1 hover:bg-gray-100 rounded-full transition-colors dark:text-white dark:hover:bg-primary dark:hover:text-black`}
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
          className={`${selectedFiles.length>0 ||messageInput  ||cameraStream || isRecording?'block md:block' :'hidden md:block' } p-1 hover:bg-gray-100 rounded-full transition-colors text-xl text-primary dark:hover:bg-primary dark:hover:text-black`}
          onClick={() => {
            if (selectedFiles.length > 0) {
              handleMultipleFileUpload(selectedFiles); // Upload selected files
              setSelectedFiles([]); // Clear selected files after sending
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
            setEditingMessage(null);
            setMessageInput("");
          }}
          className="ml-2 text-gray-500"
        >
          Cancel
        </button>
      )}
    </form>
  </div>
  );
};

export default ChatInput;