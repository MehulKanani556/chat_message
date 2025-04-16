import React, { useState } from 'react'
import { FaChevronUp, FaChevronDown, FaFilePdf, FaFileWord, FaFileExcel, FaFileAudio, FaFile, FaDownload } from 'react-icons/fa';
import { CgProfile } from 'react-icons/cg';
import { FaPaperclip } from 'react-icons/fa';
import { IMG_URL } from '../utils/baseUrl';
import { IoCameraOutline } from 'react-icons/io5';
import { ImCross } from 'react-icons/im';
import { HiOutlineDownload } from "react-icons/hi";
export default function ProfileUser({ isOpen, onClose, selectedChat, messages, handleImageClick }) {

  const [userInfoOpen, setUserInfoOpen] = useState(false);
  const [filesOpen, setFilesOpen] = useState(false);

  const toggleAccordion = () => {
    setUserInfoOpen(!userInfoOpen);
  };
  function decryptMessage(encryptedText) {
    if (typeof encryptedText === 'string' && encryptedText.startsWith('data:')) {
      try {
        const key = 'chat';
        // Remove the 'data:' prefix
        const encodedText = encryptedText.split('data:')[1];
        // Decode from base64
        const decodedText = atob(encodedText);
        let result = '';
        // XOR each character with the key
        for (let i = 0; i < decodedText.length; i++) {
          result += String.fromCharCode(decodedText.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
      } catch (error) {
        console.error('Decryption error:', error);
        return encryptedText; // Return original text if decryption fails
      }
    }
    return encryptedText; // Return original text if not encrypted
  }
  return (
    <div className="w-[380px] bg-[#F7F7F7] dark:bg-primary-dark/95 h-full shadow-sm relative">
      <div>
        <div className="flex justify-between items-center pb-2 p-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-primary-light">Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <ImCross />
          </button>
        </div>
      </div>
      <div className=" overflow-hidde">
        {/* Profile Header */}
        <div className="flex flex-col items-center justify-center p-6   border-b border-gray-300 dark:border-primary-light/15">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary/10 overflow-hidden mb-3">
              {selectedChat?.photo && selectedChat.photo !== "null" && (selectedChat?.profilePhoto == "Everyone" || selectedChat.isGroup) ? (
                <img
                  src={`${IMG_URL}${selectedChat?.photo}`}
                  alt="Profile"
                  className="object-cover w-24 h-24  rounded-full"
                />
              ) : (
                <div
                  className="w-24 h-24 text-center rounded-full text-gray-600 grid place-content-center"
                // style={{
                //   background:
                //     "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(189,214,230,1) 48%, rgba(34,129,195,1) 100%)",
                // }}
                >
                  <span className="text-primary font-medium text-2xl">
                    {selectedChat?.userName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <h2 className="text-lg font-medium text-gray-800 dark:text-primary-light mt-2"> {selectedChat?.userName}</h2>

          {/* <div className="flex items-center mt-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-sm text-gray-500 dark:text-primary-light">Active</span>
                    </div> */}
        </div>

        {/* Profile Content */}
        <div className="max-w-md mx-auto p-8 dark:text-primary-light">
          <p>
            {selectedChat?.bio || "No bio available"}
          </p>

          {/* Main accordion header */}
          <div
            className="p-4 cursor-pointer flex items-center justify-between"
            onClick={toggleAccordion}
          >
          </div>
          {/* Accordion content */}
          <div className="w-full max-w-md bg-[#F9FAFA] dark:bg-primary-light/15 ">
            {/* User Info Section */}
            <div className="border-b border-gray-300">
              <button
                className="w-full px-4 py-3 flex justify-between items-center"
                onClick={() => setUserInfoOpen(!userInfoOpen)}
              >
                <div className="flex items-center space-x-2">
                  <CgProfile />
                  <span className="font-medium dark:text-primary-light">About</span>
                </div>
                {/* {userInfoOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />} */}
              </button>


              <div className="px-4 pb-4 pt-1">
                <div className="mb-4">
                  <p className="text-gray-400 text-sm">Name</p>
                  <p className="text-black font-semibold dark:text-primary-light">{selectedChat?.userName}</p>
                </div>

                <div className="mb-4">
                  <p className="text-gray-400 text-sm">Email</p>
                  <p className="text-black font-semibold dark:text-primary-light">{selectedChat?.email}</p>
                </div>
              </div>

            </div>

            {/* Files Section */}
            <div>
              <button
                className="w-full px-4 py-3 flex justify-between items-center"
                onClick={() => setFilesOpen(!filesOpen)}
              >
                <div className="flex items-center space-x-2">
                  <FaPaperclip size={18} className=" " />
                  <span className="font-medium">Attached Files</span>
                </div>
                {filesOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
              </button>

              {filesOpen && (
                <div className="grid grid-cols-3 gap-2 p-2 items-center max-h-[250px] justify-center overflow-y-auto scrollbar-hide">
                  {messages.filter(
                    (message) => message.content?.type === "file"
                  ).length > 0 ? (
                    messages
                      .filter((message) => message.content?.type === "file")
                      .map((message, index) => {
                        if (message.content?.fileType?.includes("image/")) {
                          // Display images in square format
                          return (
                            <div
                              key={index}
                              className="relative group aspect-square rounded-lg bg-primary-light dark:bg-primary-dark/50 p-2"
                            >
                              <img
                                src={`${IMG_URL}${message.content.fileUrl.replace(
                                  /\\/g,
                                  "/"
                                )}`}
                                alt={message.content.content}
                                className="w-full h-full object-cover rounded-lg cursor-pointer"
                                onClick={() =>
                                  handleImageClick(
                                    `${IMG_URL}${message.content.fileUrl.replace(
                                      /\\/g,
                                      "/"
                                    )}`
                                  )
                                }
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                              {decryptMessage(message.content.content)}
                              </div>
                            </div>
                          );
                        } else {
                          // Display other file types in square format
                          return (
                            <div
                              key={index}
                              className="relative bg-primary-light dark:bg-primary-dark/50 rounded-lg aspect-square p-3 flex flex-col items-center justify-center group"
                            >
                              <div className="flex-1 flex items-center justify-center">
                                {message.content.fileType?.includes("pdf") ? (
                                  <FaFilePdf className="w-12 h-12 text-red-500" />
                                ) : message.content.fileType?.includes(
                                  "word"
                                ) ? (
                                  <FaFileWord className="w-12 h-12 text-blue-500" />
                                ) : message.content.fileType?.includes(
                                  "excel"
                                ) ? (
                                  <FaFileExcel className="w-12 h-12 text-green-500" />
                                ) : message.content.fileType?.includes(
                                  "audio"
                                ) ? (
                                  <FaFileAudio className="w-12 h-12 text-purple-500" />
                                ) : (
                                  <FaFile className="w-12 h-12 text-gray-500" />
                                )}
                              </div>

                              <div className="w-full px-2 text-center">
                                <p className="text-xs font-medium break-words line-clamp-2 hover:line-clamp-none group-hover:text-blue-600">
                                  {decryptMessage(message.content.content)}
                                </p>
                              </div>

                              <a
                                href={`${IMG_URL}${message.content.fileUrl.replace(
                                  /\\/g,
                                  "/"
                                )}`}
                                download={message.content.content}
                                className="absolute top-2 right-2 text-blue-500 hover:text-blue-600 bg-white rounded-full p-1 shadow-sm"
                              >
                                <HiOutlineDownload className="w-4 h-4" />
                              </a>
                            </div>
                          );
                        }
                      })
                  ) : (
                    <div className="col-span-3 text-center text-gray-600">
                      No Attached Files
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
