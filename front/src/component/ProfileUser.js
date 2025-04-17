import React, { useState } from 'react'
import { FaChevronUp, FaChevronDown, FaFilePdf, FaFileWord, FaFileExcel, FaFileAudio, FaFile, FaDownload, FaChevronRight, FaChevronLeft, FaFileVideo, FaFileArchive, FaLink } from 'react-icons/fa';
import { CgProfile } from 'react-icons/cg';
import { FaPaperclip } from 'react-icons/fa';
import { IMG_URL } from '../utils/baseUrl';
import { IoCameraOutline } from 'react-icons/io5';
import { ImCross } from 'react-icons/im';
import { HiOutlineDownload } from "react-icons/hi";
import { PiLinkSimpleBold } from "react-icons/pi";
export default function ProfileUser({ isOpen, onClose, selectedChat, messages, handleImageClick }) {

  const [userInfoOpen, setUserInfoOpen] = useState(false);
  const [filesOpen, setFilesOpen] = useState(false);
  const [attachFile, setAttachFile] = useState(false)
  const [activeTab, setActiveTab] = useState('media');

  const toggleAccordion = () => {
    setUserInfoOpen(!userInfoOpen);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
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
      {attachFile ?
        <>
          <div>
            <div className="flex justify-between items-center pb-2 p-4">
              <div className='flex gap-2 items-center'>
                <button
                  onClick={() => setAttachFile(false)}
                  className="text-primary-dark dark:text-primary-light hover:text-gray-500"
                >
                  <FaChevronLeft />
                </button>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-primary-light">Attach File</h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <ImCross />
              </button>
            </div>
          </div>

          <div className="mt-2">
            <div className="sm:block flex-1 h-[1px] bg-gradient-to-r from-gray-200/0  to-gray-400/0 via-gray-400/40 dark:bg-gradient-to-l dark:from-gray-300/0 dark:to-gray-300/0 dark:via-gray-400/40" />
          </div>
          <div>
            <div className='mt-5'>
              <div className="flex ">
                <button
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b  ${activeTab === 'media'
                    ? 'text-primary-dark dark:text-white bg-primary/20 border-primary'
                    : 'text-gray-600 dark:text-gray-400 dark:border-gray-700 bg-primary-light/20'
                    }`}
                  onClick={() => setActiveTab('media')}
                >
                  Media
                </button>
                <button
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b ${activeTab === 'docs'
                    ? 'text-primary-dark dark:text-white bg-primary/20 border-primary'
                    : 'text-gray-600 dark:text-gray-400 dark:border-gray-700 bg-primary-light/20'
                    }`}
                  onClick={() => setActiveTab('docs')}
                >
                  Docs
                </button>
                <button
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b   ${activeTab === 'links'
                    ? 'text-primary-dark dark:text-white bg-primary/20 border-primary'
                    : 'text-gray-600 dark:text-gray-400 dark:border-gray-700 bg-primary-light/20'
                    }`}
                  onClick={() => setActiveTab('links')}
                >
                  Links
                </button>
              </div>
              <div className="p-4">
                {activeTab === 'media' && (
                  <div className="space-y-6">
                    {Object.entries(
                      messages
                        .filter(message =>
                          message.content?.type === "file" &&
                          (message.content?.fileType?.includes("image/") ||
                            message.content?.fileType?.includes("video/") ||
                            message.content?.fileType?.includes("png") ||
                            message.content?.fileType?.includes("gif"))
                        )
                        .reduce((acc, message) => {
                          const date = formatDate(message.createdAt);
                          if (!acc[date]) acc[date] = [];
                          acc[date].push(message);
                          return acc;
                        }, {})
                    )
                      .sort((a, b) => {
                        if (a[0] === 'Today') return -1;
                        if (b[0] === 'Today') return 1;
                        if (a[0] === 'Yesterday') return -1;
                        if (b[0] === 'Yesterday') return 1;
                        return new Date(b[1][0].createdAt) - new Date(a[1][0].createdAt);
                      })
                      .map(([date, dateMessages]) => (
                        <div key={date}>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{date}</h3>
                          <div className="grid grid-cols-3 gap-3">
                            {dateMessages.map((message, index) => (
                              <div key={index} className="aspect-square rounded-lg overflow-hidden">
                                {message.content?.fileType?.includes("image/") || message.content?.fileType?.includes("png") || message.content?.fileType?.includes("gif") ? (
                                  <img
                                    src={`${IMG_URL}${message.content.fileUrl.replace(/\\/g, "/")}`}
                                    alt={message.content.content}
                                    className="w-full h-full object-cover cursor-pointer"
                                    onClick={() => handleImageClick(`${IMG_URL}${message.content.fileUrl.replace(/\\/g, "/")}`)}
                                  />
                                ) : (
                                  <video
                                    src={`${IMG_URL}${message.content.fileUrl.replace(/\\/g, "/")}`}
                                    alt={message.content.content}
                                    className="w-full h-full object-cover cursor-pointer"
                                    onClick={() => handleImageClick(`${IMG_URL}${message.content.fileUrl.replace(/\\/g, "/")}`)}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
                {activeTab === 'docs' && (
                  <div className="space-y-6">
                    {Object.entries(
                      messages
                        .filter(message =>
                          message.content?.type === "file" &&
                          (message.content?.fileType?.includes("pdf") ||
                            message.content?.fileType?.includes("word") ||
                            message.content?.fileType?.includes("excel") ||
                            message.content?.fileType?.includes("audio") ||
                            message.content?.fileType?.includes("zip"))
                        )
                        .reduce((acc, message) => {
                          const date = formatDate(message.createdAt);
                          if (!acc[date]) acc[date] = [];
                          acc[date].push(message);
                          return acc;
                        }, {})
                    )
                      .sort((a, b) => {
                        if (a[0] === 'Today') return -1;
                        if (b[0] === 'Today') return 1;
                        if (a[0] === 'Yesterday') return -1;
                        if (b[0] === 'Yesterday') return 1;
                        return new Date(b[1][0].createdAt) - new Date(a[1][0].createdAt);
                      })
                      .map(([date, dateMessages]) => (
                        <div key={date}>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{date}</h3>
                          <div className="space-y-2">
                            {dateMessages.map((message, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-primary-dark/50 rounded-lg cursor-pointer" onClick={() => {
                                const fileUrl = `${IMG_URL}${message.content.fileUrl.replace(/\\/g, "/")}`;
                                const fileName = decryptMessage(message.content.content);

                                // Create a fetch request to get the file content
                                fetch(fileUrl)
                                  .then(response => response.blob())
                                  .then(blob => {
                                    // Create a blob URL for the file
                                    const blobUrl = window.URL.createObjectURL(blob);

                                    // Create download link
                                    const link = document.createElement('a');
                                    link.href = blobUrl;
                                    link.download = fileName;

                                    // Append to body, click and remove
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);

                                    // Clean up the blob URL
                                    window.URL.revokeObjectURL(blobUrl);
                                  })
                                  .catch(error => {
                                    console.error("Download failed:", error);
                                    alert("Failed to download the file. Please try again.");
                                  });
                              }}>
                                <div className='flex items-center gap-2 px-2'>
                                  {message.content.fileType?.includes("pdf") ? (
                                    <img src={require("../img/pdf.png")} alt="PDF Icon" className="w-10 h-10 text-red-500" />
                                  ) : message.content.fileType?.includes("word") ? (
                                    <img src={require("../img/word.png")} alt="Word Icon" className="w-10 h-10 text-blue-500" />
                                  ) : message.content.fileType?.includes("excel") ? (
                                    <img src={require("../img/execel.png")} alt="Excel Icon" className="w-10 h-10 text-green-500" />
                                  ) : message.content.fileType?.includes("audio") ? (
                                    <img src={require("../img/audio.png")} alt="Audio Icon" className="w-10 h-10 text-purple-500" />
                                  ) : message.content.fileType?.includes("zip") ? (
                                    <img src={require("../img/zip.png")} alt="Zip Icon" className="w-10 h-10 text-orange-500" />
                                  ) : (
                                    <img src={require("../img/zip.png")} alt="File Icon" className="w-10 h-10 text-gray-500" />
                                  )}
                                  <div>
                                    <div className="flex-1 text-sm text-primary-dark dark:text-primary-light truncate">{decryptMessage(message.content.content)}</div>
                                    <div className="flex gap-3">
                                      <div className='text-xs text-primary-dark/50 dark:text-primary-light/50 truncate flex items-center gap-1'>
                                        <span className='text-xl'>•</span>
                                        <span>{message.content.size}</span>
                                      </div>
                                      <div className='text-xs text-primary-dark/50 dark:text-primary-light/50 truncate flex items-center gap-1'>
                                        <span className='text-xl'>•</span>
                                        <span>{message.content.fileType.split('/').pop()}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
                {activeTab === 'links' && (
                  <div className="space-y-6">
                    {Object.entries(
                      messages
                        .filter(message => {
                          const content = decryptMessage(message.content.content);
                          return typeof content === 'string' && (content.includes('http://') || content.includes('https://'));
                        })
                        .reduce((acc, message) => {
                          const date = formatDate(message.createdAt);
                          if (!acc[date]) acc[date] = [];
                          acc[date].push(message);
                          return acc;
                        }, {})
                    )
                      .sort((a, b) => {
                        if (a[0] === 'Today') return -1;
                        if (b[0] === 'Today') return 1;
                        if (a[0] === 'Yesterday') return -1;
                        if (b[0] === 'Yesterday') return 1;
                        return new Date(b[1][0].createdAt) - new Date(a[1][0].createdAt);
                      })
                      .map(([date, dateMessages]) => (
                        <div key={date}>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{date}</h3>
                          <div className="space-y-2">
                            {dateMessages.map((message, index) => {
                              const content = decryptMessage(message.content.content);
                              const urls = content.match(/https?:\/\/[^\s]+/g);
                              if (!urls) return null;

                              // Group duplicate URLs
                              const uniqueUrls = [...new Set(urls)];
                              return uniqueUrls.map((url, urlIndex) => {
                                const count = urls.filter(u => u === url).length;
                                // Extract domain for favicon
                                const domain = new URL(url).hostname;
                                return (
                                  <div key={`${index}-${urlIndex}`} className="flex items-center justify-between gap-2 px-3 py-2 bg-white dark:bg-primary-dark/50 rounded-lg text-primary-dark/50 dark:text-primary-light/50">
                                    <div className='min-w-[40px] h-[40px] rounded-full bg-primary-dark/20 dark:bg-primary-light/20 flex items-center justify-center flex-shrink-0 overflow-hidden relative'>

                                      <PiLinkSimpleBold className='w-[16px] h-[16px] absolute' />

                                      <img
                                        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                                        alt=""
                                        className="w-[24px] h-[24px] relative z-10"
                                        onLoad={(e) => {
                                          // Show the image only if it's a valid favicon (not a generic fallback)
                                          // This check might need adjustment based on the actual response
                                          if (e.target.width > 0 && e.target.height > 0) {
                                            e.target.style.display = 'block';
                                          } else {
                                            e.target.style.display = 'none';
                                          }
                                        }}
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                        }}
                                      />
                                    </div>
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-grow ml-2 break-all text-primary-dark dark:text-white"
                                    >
                                      {url}
                                    </a>
                                  </div>
                                );
                              });
                            })}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
        :
        <>
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
                    onClick={() => setAttachFile(true)}
                  >
                    <div className="flex items-center space-x-2" >
                      <FaPaperclip size={18} className=" " />
                      <span className="font-medium">Attached Files</span>
                    </div>
                    <FaChevronRight size={12} />
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
                                    download={decryptMessage(message.content.content)}
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
        </>
      }

    </div>
  )
}
