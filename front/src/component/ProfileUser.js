import React, { useState, useEffect } from 'react'
import { FaChevronUp, FaChevronDown, FaFilePdf, FaFileWord, FaFileExcel, FaFileAudio, FaFile, FaDownload, FaChevronRight, FaChevronLeft, FaFileVideo, FaFileArchive, FaLink } from 'react-icons/fa';
import { CgProfile } from 'react-icons/cg';
import { FaPaperclip } from 'react-icons/fa';
import { IMG_URL } from '../utils/baseUrl';
import { IoCallOutline, IoCameraOutline, IoNotificationsOutline, IoVideocamOutline } from 'react-icons/io5';
import { ImCross } from 'react-icons/im';
import { HiOutlineDownload } from "react-icons/hi";
import { PiLinkSimpleBold } from "react-icons/pi";
import { FiLogOut } from 'react-icons/fi';
import { MdBlock } from 'react-icons/md';
import { blockUser, getAllMessageUsers, getUser } from '../redux/slice/user.slice';
import { useDispatch, useSelector } from 'react-redux';

// Function to fetch URL titles
const fetchUrlTitle = async (url) => {
  try {
    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    const parser = new DOMParser();
    const doc = parser.parseFromString(data.contents, 'text/html');
    const title = doc.querySelector('title')?.textContent || 'No title available';
    return title;
  } catch (error) {
    console.error("Error fetching URL title:", error);
    return 'Could not fetch title';
  }
};

export default function ProfileUser({ isOpen, onClose, selectedChat, messages, handleImageClick, handleMakeCall }) {

  const [userInfoOpen, setUserInfoOpen] = useState(false);
  const [filesOpen, setFilesOpen] = useState(false);
  const [attachFile, setAttachFile] = useState(false)
  const [activeTab, setActiveTab] = useState('media');
  const [urlTitles, setUrlTitles] = useState({}); // State to hold URL titles
  const [enabled, setEnabled] = useState(false);
  const [currentUser] = useState(sessionStorage.getItem("userId"));
  const { user } = useSelector((state) => state.user);
  const { onlineUsers } = useSelector(state => state.magageState)
  const dispatch = useDispatch();

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

  // Fetch titles for all URLs when messages change
  useEffect(() => {
    const fetchTitles = async () => {
      const titles = {};
      const urls = messages.flatMap(message => {
        const content = decryptMessage(message.content.content);
        const foundUrls = content?.match(/https?:\/\/[^\s]+/g);
        return foundUrls ? [...new Set(foundUrls)] : [];
      });

      for (const url of urls) {
        titles[url] = await fetchUrlTitle(url);
      }
      setUrlTitles(titles);
    };

    fetchTitles();
  }, [messages]);

  return (
    <div
      className={`w-full sm:w-[425px] md:w-[404px] lg:w-[580px] xl:w-[380px] bg-primary-dark/5 dark:bg-primary-dark/90 dark:text-primary-light h-full relative transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      style={{ boxShadow: "inset 0 0 5px 0 rgba(0, 0, 0, 0.1)", }} >
      {/* <div
      className="w-full  bg-primary-dark/5 dark:bg-primary-dark/90 dark:text-primary-light h-full relative"
      style={{
        boxShadow: "inset 0 0 5px 0 rgba(0, 0, 0, 0.1)",
      }}
    > */}
      {attachFile ? (
        <>
          <div>
            <div className="flex justify-between items-center pb-2 p-4">
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setAttachFile(false)}
                  className="text-primary-dark dark:text-primary-light hover:text-gray-500"
                >
                  <FaChevronLeft />
                </button>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-primary-light">
                  Attach File
                </h2>
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
            <div className="mt-5">
              <div className="flex ">
                <button
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b  ${activeTab === "media"
                    ? "text-primary-dark dark:text-white bg-primary/20 border-primary"
                    : "text-gray-600 dark:text-gray-400 dark:border-gray-700 bg-primary-light/20"
                    }`}
                  onClick={() => setActiveTab("media")}
                >
                  Media
                </button>
                <button
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b ${activeTab === "docs"
                    ? "text-primary-dark dark:text-white bg-primary/20 border-primary"
                    : "text-gray-600 dark:text-gray-400 dark:border-gray-700 bg-primary-light/20"
                    }`}
                  onClick={() => setActiveTab("docs")}
                >
                  Docs
                </button>
                <button
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b   ${activeTab === "links"
                    ? "text-primary-dark dark:text-white bg-primary/20 border-primary"
                    : "text-gray-600 dark:text-gray-400 dark:border-gray-700 bg-primary-light/20"
                    }`}
                  onClick={() => setActiveTab("links")}
                >
                  Links
                </button>
              </div>
              <div className="p-4">
                {activeTab === "media" && (
                  <div className="space-y-6">
                    {Object.entries(
                      messages
                        .filter(
                          (message) =>
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
                        if (a[0] === "Today") return -1;
                        if (b[0] === "Today") return 1;
                        if (a[0] === "Yesterday") return -1;
                        if (b[0] === "Yesterday") return 1;
                        return (
                          new Date(b[1][0].createdAt) -
                          new Date(a[1][0].createdAt)
                        );
                      })
                      .map(([date, dateMessages]) => (
                        <div key={date}>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                            {date}
                          </h3>
                          <div className="grid grid-cols-3 gap-3">
                            {dateMessages.map((message, index) => (
                              <div
                                key={index}
                                className="aspect-square rounded-lg overflow-hidden"
                              >
                                {message.content?.fileType?.includes(
                                  "image/"
                                ) ||
                                  message.content?.fileType?.includes("png") ||
                                  message.content?.fileType?.includes("gif") ? (
                                  <img
                                    src={`${IMG_URL}${message.content.fileUrl.replace(
                                      /\\/g,
                                      "/"
                                    )}`}
                                    alt={message.content.content}
                                    className="w-full h-full object-cover cursor-pointer"
                                    onClick={() =>
                                      handleImageClick(
                                        `${IMG_URL}${message.content.fileUrl.replace(
                                          /\\/g,
                                          "/"
                                        )}`
                                      )
                                    }
                                  />
                                ) : (
                                  <video
                                    src={`${IMG_URL}${message.content.fileUrl.replace(
                                      /\\/g,
                                      "/"
                                    )}`}
                                    alt={message.content.content}
                                    className="w-full h-full object-cover cursor-pointer"
                                    onClick={() =>
                                      handleImageClick(
                                        `${IMG_URL}${message.content.fileUrl.replace(
                                          /\\/g,
                                          "/"
                                        )}`
                                      )
                                    }
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
                {activeTab === "docs" && (
                  <div className="space-y-6">
                    {Object.entries(
                      messages
                        .filter(
                          (message) =>
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
                        if (a[0] === "Today") return -1;
                        if (b[0] === "Today") return 1;
                        if (a[0] === "Yesterday") return -1;
                        if (b[0] === "Yesterday") return 1;
                        return (
                          new Date(b[1][0].createdAt) -
                          new Date(a[1][0].createdAt)
                        );
                      })
                      .map(([date, dateMessages]) => (
                        <div key={date}>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                            {date}
                          </h3>
                          <div className="space-y-2">
                            {dateMessages.map((message, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-white dark:bg-primary-dark/50 rounded-lg cursor-pointer"
                                onClick={() => {
                                  const fileUrl = `${IMG_URL}${message.content.fileUrl.replace(
                                    /\\/g,
                                    "/"
                                  )}`;
                                  const fileName = decryptMessage(
                                    message.content.content
                                  );

                                  // Create a fetch request to get the file content
                                  fetch(fileUrl)
                                    .then((response) => response.blob())
                                    .then((blob) => {
                                      // Create a blob URL for the file
                                      const blobUrl =
                                        window.URL.createObjectURL(blob);

                                      // Create download link
                                      const link = document.createElement("a");
                                      link.href = blobUrl;
                                      link.download = fileName;

                                      // Append to body, click and remove
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);

                                      // Clean up the blob URL
                                      window.URL.revokeObjectURL(blobUrl);
                                    })
                                    .catch((error) => {
                                      console.error("Download failed:", error);
                                      alert(
                                        "Failed to download the file. Please try again."
                                      );
                                    });
                                }}
                              >
                                <div className="flex items-center gap-2 px-2">
                                  {message.content.fileType?.includes("pdf") ? (
                                    <img
                                      src={require("../img/pdf.png")}
                                      alt="PDF Icon"
                                      className="w-10 h-10 text-red-500"
                                    />
                                  ) : message.content.fileType?.includes(
                                    "word"
                                  ) ? (
                                    <img
                                      src={require("../img/word.png")}
                                      alt="Word Icon"
                                      className="w-10 h-10 text-blue-500"
                                    />
                                  ) : message.content.fileType?.includes(
                                    "excel"
                                  ) ? (
                                    <img
                                      src={require("../img/execel.png")}
                                      alt="Excel Icon"
                                      className="w-10 h-10 text-green-500"
                                    />
                                  ) : message.content.fileType?.includes(
                                    "audio"
                                  ) ? (
                                    <img
                                      src={require("../img/audio.png")}
                                      alt="Audio Icon"
                                      className="w-10 h-10 text-purple-500"
                                    />
                                  ) : message.content.fileType?.includes(
                                    "zip"
                                  ) ? (
                                    <img
                                      src={require("../img/zip.png")}
                                      alt="Zip Icon"
                                      className="w-10 h-10 text-orange-500"
                                    />
                                  ) : (
                                    <img
                                      src={require("../img/zip.png")}
                                      alt="File Icon"
                                      className="w-10 h-10 text-gray-500"
                                    />
                                  )}
                                  <div>
                                    <div className="flex-1 text-sm text-primary-dark dark:text-primary-light truncate">
                                      {decryptMessage(message.content.content)}
                                    </div>
                                    <div className="flex gap-3">
                                      <div className="text-xs text-primary-dark/50 dark:text-primary-light/50 truncate flex items-center gap-1">
                                        <span className="text-xl">•</span>
                                        <span>{message.content.size}</span>
                                      </div>
                                      <div className="text-xs text-primary-dark/50 dark:text-primary-light/50 truncate flex items-center gap-1">
                                        <span className="text-xl">•</span>
                                        <span>
                                          {message.content.fileType
                                            .split("/")
                                            .pop()}
                                        </span>
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
                {activeTab === "links" && (
                  <div className="space-y-6">
                    {Object.entries(
                      messages
                        .filter((message) => {
                          const content = decryptMessage(
                            message.content.content
                          );
                          return (
                            typeof content === "string" &&
                            (content.includes("http://") ||
                              content.includes("https://"))
                          );
                        })
                        .reduce((acc, message) => {
                          const date = formatDate(message.createdAt);
                          if (!acc[date]) acc[date] = [];
                          acc[date].push(message);
                          return acc;
                        }, {})
                    )
                      .sort((a, b) => {
                        if (a[0] === "Today") return -1;
                        if (b[0] === "Today") return 1;
                        if (a[0] === "Yesterday") return -1;
                        if (b[0] === "Yesterday") return 1;
                        return (
                          new Date(b[1][0].createdAt) -
                          new Date(a[1][0].createdAt)
                        );
                      })
                      .map(([date, dateMessages]) => (
                        <div key={date}>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                            {date}
                          </h3>
                          <div className="space-y-2">
                            {dateMessages.map((message, index) => {
                              const content = decryptMessage(
                                message.content.content
                              );
                              const urls = content.match(/https?:\/\/[^\s]+/g);
                              if (!urls) return null;

                              // Group duplicate URLs
                              const uniqueUrls = [...new Set(urls)];
                              return uniqueUrls.map((url, urlIndex) => {
                                const domain = new URL(url).hostname;

                                return (
                                  <div
                                    key={`${index}-${urlIndex}`}
                                    className="flex flex-col bg-white dark:bg-primary-dark/50 rounded-lg text-primary-dark/50 dark:text-primary-light/50 p-3"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="min-w-[40px] h-[40px] rounded-full bg-primary-dark/20 dark:bg-primary-light/20 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                                        <PiLinkSimpleBold className="w-[16px] h-[16px] absolute" />
                                        <img
                                          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                                          alt=""
                                          className="w-[24px] h-[24px] relative z-10"
                                          onLoad={(e) => {
                                            if (
                                              e.target.width > 0 &&
                                              e.target.height > 0
                                            ) {
                                              e.target.style.display = "block";
                                            } else {
                                              e.target.style.display = "none";
                                            }
                                          }}
                                          onError={(e) => {
                                            e.target.style.display = "none";
                                          }}
                                        />
                                      </div>
                                      <div className="flex-grow">
                                        {/* Display the title */}
                                        <div className=" text-primary-dark dark:text-white ">
                                          {urlTitles[url] || "Loading title..."}
                                        </div>
                                        <a
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-sm break-all  flex gap-2 items-center text-primary-dark/50 dark:text-primary-light/50 hover:underline"
                                        >
                                          <span className="text-xl">•</span>
                                          <span>{url}</span>
                                        </a>
                                      </div>
                                    </div>
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
      ) : (
        <>
          <div>
            <div className="flex justify-between items-center p-4 py-6">
              <h2 className="text-lg font-bold"> Profile</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <ImCross />
              </button>
            </div>
            <div className="sm:block flex-1 h-[1px] bg-gradient-to-r from-gray-300/30 via-gray-300 to-gray-300/30 dark:bg-gradient-to-l dark:from-white/5 dark:via-white/30 dark:to-white/5 max-w-[100%] mx-auto" />
          </div>
          <div className=" overflow-hidde p-6">
            {/* Profile Header */}
            <div className="flex flex-col items-center justify-center dark:border-primary-light/15">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-primary/10 overflow-hidden mb-3">
                  {selectedChat?.photo &&
                    selectedChat.photo !== "null" &&
                    (selectedChat?.profilePhoto == "Everyone" ||
                      selectedChat.isGroup) ? (
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
                {onlineUsers?.includes(selectedChat?._id) && (
                  <div className="w-4 h-4 absolute bottom-4 right-3 border rounded-full bg-[#1FBD41]"></div>
                )}
              </div>

              <h2 className="text-lg font-medium text-gray-800 dark:text-primary-light">
                {" "}
                {selectedChat?.userName}
              </h2>

              {/* <div className="flex items-center mt-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-sm text-gray-500 dark:text-primary-light">Active</span>
                    </div> */}
            </div>

            {/* Profile Content */}
            <div className="max-w-md mx-auto  dark:text-primary-light mt-4">
              <div className="max-w-md flex mb-3 gap-5">
                <button className="bg-[#F9FAFA] dark:bg-primary-dark  rounded-md p-2 flex-1 items-center flex flex-col" onClick={() => handleMakeCall("voice")}>
                  <IoCallOutline
                    className="w-6 h-6 cursor-pointer"
                    title="Voice Call"
                    data-tooltip="Voice Call"
                    data-tooltip-delay="0"
                    data-tooltip-duration="0"
                  />
                  <p className="">Voice Call</p>
                </button>
                <button className="bg-[#F9FAFA] dark:bg-primary-dark  rounded-md p-2 flex-1 items-center flex flex-col" onClick={() => handleMakeCall("video")}>
                  <IoVideocamOutline
                    className="w-6 h-6 cursor-pointer"
                    title="Video Call"
                    data-tooltip="Video Call"
                    data-tooltip-delay="0"
                    data-tooltip-duration="0"
                  />
                  <p>Video Call</p>
                </button>
              </div>
              {/* Accordion content */}
              <div className="max-w-md bg-[#F9FAFA] dark:bg-primary-light/15  rounded-lg mb-5 ">
                {/* User Info Section */}
                <div className="border-b border-gray-300">
                  <button
                    className="w-full px-4 py-3 flex justify-between items-center cursor-default"
                    onClick={() => setUserInfoOpen(!userInfoOpen)}
                  >
                    <div className="flex items-center space-x-2">
                      <CgProfile />
                      <span className="font-medium dark:text-primary-light">
                        About
                      </span>
                    </div>
                    {/* {userInfoOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />} */}
                  </button>

                  <div className="px-4 pb-2 pt-1">
                    <div className="mb-4">
                      <p className="text-gray-400 text-sm">Name</p>
                      <p className="text-black font-semibold dark:text-primary-light">
                        {selectedChat?.userName}
                      </p>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-400 text-sm">About</p>
                      <p className="text-black font-semibold dark:text-primary-light">
                        {selectedChat?.bio || "-"}
                      </p>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-400 text-sm">Email</p>
                      <p className="text-black font-semibold dark:text-primary-light">
                        {selectedChat?.email}
                      </p>
                    </div>
                    <div className="mb-4">
                      <p className="text-gray-400 text-sm">Mobile Number</p>
                      <p className="text-black font-semibold dark:text-primary-light">
                        {selectedChat?.mobileNumber || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Files Section */}
                <div>
                  <button
                    className="w-full px-4 py-3 flex justify-between items-center"
                    onClick={() => setAttachFile(true)}
                  >
                    <div className="flex items-center space-x-2">
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
                                    {message.content.fileType?.includes(
                                      "pdf"
                                    ) ? (
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
                                    download={decryptMessage(
                                      message.content.content
                                    )}
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

              <div className=" max-w-md bg-[#F9FAFA] flex dark:bg-primary-dark  rounded-lg p-3 my-3">
                <button
                  className="w-full flex justify-between items-center"
                // onClick={() => {
                //   setGroupUsers(selectedChat?.members);
                //   setIsGroupModalOpen(false);
                //   setIsModalOpen(true);
                // }}
                >
                  <div className="flex items-center space-x-2">
                    <IoNotificationsOutline size={18} />
                    <span className="font-medium">Notification</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => setEnabled(!enabled)}
                      className="sr-only peer"
                    />
                    <div
                      className={`w-9 h-5 rounded-full transition-colors duration-300 ${enabled ? "bg-primary" : "bg-gray-300 dark:bg-white/15"
                        }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full shadow-md transform transition-transform duration-300 ${enabled ? "translate-x-4" : ""
                          }`}
                      ></div>
                    </div>
                  </label>
                </button>
              </div>

              <div className=" max-w-md bg-[#F9FAFA] flex dark:bg-primary-dark  rounded-lg p-3 mt-3">
                <button
                  className="w-full flex justify-between items-center text-[#FF0000]"
                  onClick={async () => {
                    await dispatch(
                      blockUser({
                        selectedUserId: selectedChat?._id,
                      })
                    );
                    await dispatch(getUser(currentUser));
                    await dispatch(getAllMessageUsers());
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <MdBlock size={18} className={""} />
                    <span className="font-medium"> {user.blockedUsers?.includes(selectedChat?._id) ? "Unblock" : "Block"}</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
