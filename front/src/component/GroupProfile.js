import React, { useEffect, useRef, useState } from "react";
import { ImCross, ImImages } from "react-icons/im";
import { MdBlock, MdInfoOutline, MdModeEdit, MdOutlineModeEdit } from "react-icons/md";
import { useDispatch } from "react-redux";
import {
  updateGroup,
  leaveGroup,
  getAllMessageUsers,
  updateUser,
} from "../redux/slice/user.slice";
import { CgProfile } from "react-icons/cg";
import {
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaChevronUp,
  FaPaperclip,
} from "react-icons/fa";
import { HiOutlineUserGroup } from "react-icons/hi";
import { BsThreeDotsVertical } from "react-icons/bs";
import { RiDeleteBin6Line, RiUserAddLine } from "react-icons/ri";
import { FiLogOut } from "react-icons/fi";
import { IoCallOutline, IoNotificationsOutline, IoVideocamOutline } from "react-icons/io5";
import { PiLinkSimpleBold } from "react-icons/pi";

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

const GroupProfile = ({
  selectedChat,
  setIsGroupModalOpen,
  setIsModalOpen,
  setGroupUsers,
  allUsers,
  userId,
  socket,
  IMG_URL,
  setSelectedChat,
  handleMakeCall,
  messages,
  handleImageClick
}) => {
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUserName, setEditedUserName] = useState("");
  const [groupPhoto, setGroupPhoto] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const containerRef = useRef(null);
  const [openDirection, setOpenDirection] = useState("bottom");
  const [attachFile, setAttachFile] = useState(false)
  const [activeTab, setActiveTab] = useState('media');
  const [urlTitles, setUrlTitles] = useState({}); // State to hold URL titles
  const [enabled, setEnabled] = useState(false);

  const handlePhotoChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setGroupPhoto(file);
      try {
        await dispatch(updateGroup({
          groupId: selectedChat._id,
          photo: file,
        }));

        socket.emit("update-group", {
          groupId: selectedChat._id,
          members: selectedChat?.members.filter((id) => id !== userId),
          updateType: "icon",
          user: userId
        });
        await dispatch(getAllMessageUsers());
      } catch (error) {
        console.error("Failed to update group photo:", error);
      }
    }
  };

  const handleLeaveGroup = () => {
    dispatch(leaveGroup({ groupId: selectedChat._id, userId: userId }));
    socket.emit("update-group", {
      groupId: selectedChat._id,
      members: selectedChat?.members.filter((id) => id !== userId),
    });
    dispatch(getAllMessageUsers());
    setIsGroupModalOpen(false);
    setSelectedChat(null);
  };

  const handleRemoveMember = (memberId) => {
    dispatch(
      leaveGroup({
        groupId: selectedChat._id,
        userId: memberId,
        removeId: userId,
      })
    );
    socket.emit("update-group", {
      groupId: selectedChat._id,
      members: selectedChat?.members.filter((id) => id !== memberId),
    });
    dispatch(getAllMessageUsers());
  };
  // ============changed==============
  const [profileData, setProfileData] = useState({
    name: selectedChat?.userName,
    createdBy:
      allUsers?.find((user) => user._id == selectedChat?.createdBy)?.userName ||
      "Unknown User",
    bio: selectedChat?.bio,
    profileImage: selectedChat?.photo,
  });
  const [tempData, setTempData] = useState({ ...profileData });
  const [editingField, setEditingField] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTempData({ ...tempData, [name]: value });
  };

  const handleEditField = (fieldName) => {
    setEditingField(fieldName);
    setTempData({ ...profileData });
  };

  const handleSaveField = async (fieldName) => {
    try {
      // Prepare the update object
      const updateObject = {
        userName: tempData.name,
        bio: tempData.bio,
      };

      // If there's a new image file, add it to the update object
      if (tempData.photoFile) {
        updateObject.photo = tempData.photoFile;
      }

      // Dispatch the update action
      const result = await dispatch(
        updateGroup({ groupId: selectedChat._id, ...updateObject })
      ).unwrap();

      // Update local state
      setProfileData({
        ...tempData,
        profileImage: tempData.photoFile
          ? URL.createObjectURL(tempData.photoFile)
          : tempData.profileImage,
      });

      // Update user state in Redux
      if (result.status === true) {
        // setUser(result.user);
        socket.emit("update-group", {
          groupId: selectedChat._id,
          members: selectedChat?.members.filter((id) => id !== userId),
          updateType: fieldName,
          oldData: fieldName == "name" ? selectedChat?.userName : selectedChat?.bio,
          newData: fieldName == "name" ? tempData.name : tempData.bio,
          user: userId
        });
        dispatch(getAllMessageUsers());
      }
      setEditingField(null);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleMenuToggle = (userId, index) => {
    const memberItem = document.getElementById(`member-${index}`);
    const container = containerRef.current;

    if (memberItem && container) {
      const memberRect = memberItem.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // Check if enough space below to open dropdown
      const spaceBelow = containerRect.bottom - memberRect.bottom;
      if (spaceBelow < 80) {
        setOpenDirection("top");
      } else {
        setOpenDirection("bottom");
      }
    }

    setMenuOpen((prev) => (prev === userId ? null : userId));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close if clicked outside the dropdown
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


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
      className="w-full  bg-primary-dark/5 dark:bg-primary-dark/90 dark:text-primary-light h-full"
      style={{
        boxShadow: "inset 0 0 5px 0 rgba(0, 0, 0, 0.1)",
      }}
    >
      {attachFile ? (
        <>
          <div className="flex justify-between items-center p-4 py-5">
            <h2 className="text-lg font-bold flex items-center">  <FaChevronLeft className="mr-2 cursor-pointer" onClick={() => setAttachFile(false)} />  Attach File</h2>
            <button
              onClick={() => setIsGroupModalOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <ImCross />
            </button>
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
                  <div className="space-y-6 overflow-hidden">
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
          <div className="flex justify-between items-center p-4 py-6">
            <h2 className="text-lg font-bold"> Group Info</h2>
            <button
              onClick={() => setIsGroupModalOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <ImCross />
            </button>
          </div>
          <div className="sm:block flex-1 h-[1px] bg-gradient-to-r from-gray-300/30 via-gray-300 to-gray-300/30 dark:bg-gradient-to-l dark:from-white/5 dark:via-white/30 dark:to-white/5 max-w-[100%] mx-auto" />
          <div className="p-5 px-6">
            <div className="flex flex-col items-center mb-6">
              <div className="relative w-24 h-24 rounded-full bg-gray-300  mt-4">
                {selectedChat?.photo && selectedChat.photo !== "null" ? (
                  <img
                    src={`${IMG_URL}${selectedChat?.photo}`}
                    alt="Profile"
                    className="cursor-pointer object-cover w-full h-full rounded-full"
                  />
                ) : (
                  <div className="text-gray-900 text-lg font-bold flex w-24 h-24 justify-center items-center">
                    <ImImages />
                  </div>
                )}

                <input
                  type="file"
                  id="fileInput"
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
                <div
                  onClick={() => document.getElementById("fileInput").click()}
                  className="cursor-pointer absolute bottom-0 right-0 z-50 dark:text-white text-gray-900 flex items-center justify-center bg-gray-300 dark:bg-gray-500 w-8 h-8 rounded-full transition-opacity duration-200"
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 17 17"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g clip-path="url(#clip0_62_16)">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12.8511 2.66699V5.33366C12.8511 5.46627 12.9038 5.59344 12.9975 5.68721C13.0913 5.78098 13.2185 5.83366 13.3511 5.83366C13.4837 5.83366 13.6109 5.78098 13.7046 5.68721C13.7984 5.59344 13.8511 5.46627 13.8511 5.33366V2.66699C13.8511 2.53438 13.7984 2.40721 13.7046 2.31344C13.6109 2.21967 13.4837 2.16699 13.3511 2.16699C13.2185 2.16699 13.0913 2.21967 12.9975 2.31344C12.9038 2.40721 12.8511 2.53438 12.8511 2.66699Z"
                        fill="currentColor"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12.0176 4.5H14.6842C14.8169 4.5 14.944 4.44732 15.0378 4.35355C15.1316 4.25979 15.1842 4.13261 15.1842 4C15.1842 3.86739 15.1316 3.74021 15.0378 3.64645C14.944 3.55268 14.8169 3.5 14.6842 3.5H12.0176C11.885 3.5 11.7578 3.55268 11.664 3.64645C11.5703 3.74021 11.5176 3.86739 11.5176 4C11.5176 4.13261 11.5703 4.25979 11.664 4.35355C11.7578 4.44732 11.885 4.5 12.0176 4.5Z"
                        fill="currentColor"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M9.35107 2.5H6.09641C5.8798 2.50001 5.66747 2.56032 5.4832 2.67418C5.29893 2.78804 5.14999 2.95095 5.05307 3.14467L4.42174 4.408C4.40774 4.4356 4.38639 4.4588 4.36003 4.47504C4.33368 4.49127 4.30336 4.49991 4.27241 4.5H2.68441C2.19818 4.5 1.73186 4.69315 1.38805 5.03697C1.04423 5.38079 0.851074 5.8471 0.851074 6.33333V13C0.851074 13.486 1.04441 13.9527 1.38774 14.2967C1.73189 14.6401 2.19819 14.8331 2.68441 14.8333H13.3511C13.8371 14.8333 14.3037 14.64 14.6477 14.2967C14.9912 13.9525 15.1842 13.4862 15.1844 13V7.33333C15.1844 7.20073 15.1317 7.07355 15.038 6.97978C14.9442 6.88601 14.817 6.83333 14.6844 6.83333C14.5518 6.83333 14.4246 6.88601 14.3309 6.97978C14.2371 7.07355 14.1844 7.20073 14.1844 7.33333V13C14.1841 13.2209 14.0961 13.4327 13.9399 13.5889C13.7837 13.7451 13.572 13.833 13.3511 13.8333H2.68441C2.4635 13.833 2.25175 13.7451 2.09554 13.5889C1.93934 13.4327 1.85143 13.2209 1.85107 13V6.33333C1.85107 5.87333 2.22441 5.5 2.68441 5.5H4.27241C4.48902 5.49999 4.70135 5.43968 4.88562 5.32582C5.06989 5.21196 5.21882 5.04905 5.31574 4.85533L5.94707 3.592C5.96108 3.5644 5.98243 3.5412 6.00878 3.52496C6.03513 3.50873 6.06546 3.50009 6.09641 3.5H9.35107C9.48368 3.5 9.61086 3.44732 9.70463 3.35355C9.7984 3.25979 9.85107 3.13261 9.85107 3C9.85107 2.86739 9.7984 2.74021 9.70463 2.64645C9.61086 2.55268 9.48368 2.5 9.35107 2.5Z"
                        fill="currentColor"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M8.01774 6.16699C6.26974 6.16699 4.85107 7.58566 4.85107 9.33366C4.85107 11.0817 6.26974 12.5003 8.01774 12.5003C9.76574 12.5003 11.1844 11.0817 11.1844 9.33366C11.1844 7.58566 9.76574 6.16699 8.01774 6.16699ZM8.01774 7.16699C8.58307 7.18102 9.12053 7.41545 9.51541 7.82025C9.91029 8.22505 10.1313 8.76815 10.1313 9.33366C10.1313 9.89916 9.91029 10.4423 9.51541 10.8471C9.12053 11.2519 8.58307 11.4863 8.01774 11.5003C7.45241 11.4863 6.91495 11.2519 6.52007 10.8471C6.12519 10.4423 5.90416 9.89916 5.90416 9.33366C5.90416 8.76815 6.12519 8.22505 6.52007 7.82025C6.91495 7.41545 7.45241 7.18102 8.01774 7.16699Z"
                        fill="currentColor"
                      />
                    </g>
                  </svg>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <h3 className="mt-2 text-xl font-semibold cursor-pointer">
                  {selectedChat?.userName}
                </h3>
              </div>
            </div>

            <div className="overflow-y-auto scrollbar-hide h-[calc(100vh-300px)]">

              <div className="max-w-md flex mb-3 gap-5">

                <button className="bg-[#F9FAFA] dark:bg-primary-dark  rounded-md p-2 flex-1 items-center flex flex-col">
                  <IoCallOutline
                    className="w-6 h-6 cursor-pointer"
                    onClick={() => handleMakeCall("voice")}
                    title="Voice Call"
                    data-tooltip="Voice Call"
                    data-tooltip-delay="0"
                    data-tooltip-duration="0"
                  />
                  <p className="">Voice Call</p>
                </button>
                <button className="bg-[#F9FAFA] dark:bg-primary-dark  rounded-md p-2 flex-1 items-center flex flex-col">
                  <IoVideocamOutline
                    className="w-6 h-6 cursor-pointer"
                    onClick={() => handleMakeCall("video")}
                    title="Video Call"
                    data-tooltip="Video Call"
                    data-tooltip-delay="0"
                    data-tooltip-duration="0"
                  />
                  <p>Video Call</p>
                </button>
              </div>
              {/* Accordion content */}
              <div className=" max-w-md bg-[#F9FAFA] dark:bg-primary-light/15  rounded-lg mb-5">
                {/* User Info Section */}
                <div className="border-b border-gray-300">
                  <button className="w-full px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <MdInfoOutline size={18} />
                      <span className="text-md font-medium ">About</span>
                    </div>
                  </button>

                  <div className="px-4 pb-4 pt-1">
                    <div className="mb-4">
                      <p className="text-gray-400 text-sm">Name</p>
                      {editingField === "name" ? (
                        <input
                          type="text"
                          name="name"
                          value={tempData.name}
                          onChange={handleInputChange}
                          onBlur={() => handleSaveField("name")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSaveField("name");
                            }
                          }}
                          className="w-full p-2 ps-0 border-b border-gray-300 focus:outline-none focus:ring-0 focus:ring-transparent dark:bg-transparent dark:text-primary-light"
                          autoFocus
                        />
                      ) : (
                        <div className="relative">
                          <p className="text-black font-semibold dark:text-primary-light">
                            {profileData.name}
                          </p>
                          <div className="flex justify-between items-center absolute top-1/2 right-0 -translate-y-1/2">
                            <button
                              onClick={() => handleEditField("name")}
                              className="text-black dark:text-white flex items-center gap-2"
                            >
                              <MdModeEdit size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-400 text-sm">About</p>
                      {editingField === "bio" ? (
                        <input
                          type="text"
                          name="bio"
                          value={tempData.bio}
                          onChange={handleInputChange}
                          onBlur={() => handleSaveField("bio")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSaveField("bio");
                            }
                          }}
                          className="w-full p-2 ps-0 border-b border-gray-300 focus:outline-none focus:ring-0 focus:ring-transparent dark:bg-transparent dark:text-primary-light"
                          autoFocus
                        />
                      ) : (
                        <div className="relative">
                          <p className="text-black font-semibold dark:text-primary-light">
                            {profileData.bio || "-"}
                          </p>
                          <div className="flex justify-between items-center absolute top-1/2 right-0 -translate-y-1/2">
                            <button
                              onClick={() => handleEditField("bio")}
                              className="text-black dark:text-white flex items-center gap-2"
                            >
                              <MdModeEdit size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="">
                      <p className="text-gray-400 text-sm">Created By</p>
                      <p className="text-black font-semibold dark:text-primary-light">
                        {profileData.createdBy}
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
                </div>
              </div>

              <div className="max-w-md bg-[#F9FAFA] dark:bg-primary-light/15 rounded-lg p-3">
                <button className="w-full px-2 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <HiOutlineUserGroup size={18} />
                    <span className="text-md font-medium">Group Members</span>
                  </div>
                </button>

                <div
                  ref={containerRef}
                  className="flex flex-col h-[190px] overflow-y-auto scrollbar-hide p-2"
                >
                  {selectedChat?.members
                    .slice()
                    .sort((a, b) => (a == userId ? -1 : b == userId ? 1 : 0))
                    .map((member, index) => {
                      const user = allUsers.find((user) => user._id === member);
                      const isMenuOpen = menuOpen === user._id;

                      return (
                        <div
                          key={index}
                          id={`member-${index}`}
                          className="flex items-center p-2 relative"
                        >
                          <div className="w-8 h-8 rounded-full mr-2 bg-gray-300 overflow-hidden flex items-center justify-center border-[1px] border-gray-400">
                            {user?.photo && user.photo !== "null" ? (
                              <img
                                src={`${IMG_URL}${user.photo.replace(/\\/g, "/")}`}
                                alt={`${user.userName}`}
                                className="object-cover h-full w-full"
                              />
                            ) : (
                              <span className="text-gray-900 text-lg font-bold">
                                {user.userName
                                  .split(" ")
                                  .map((n) => n[0].toUpperCase())
                                  .join("")}
                              </span>
                            )}
                          </div>
                          <span className="text-gray-800 dark:text-primary-light/80">
                            {user?.userName}
                          </span>

                          <button
                            className={`ml-auto text-md rounded-full px-2 py-1 ${isMenuOpen ? 'text-primary' : '',
                              member === userId ? 'hidden' : "block"
                              }`}
                            onClick={() => handleMenuToggle(user._id, index)}
                          >
                            <BsThreeDotsVertical />
                          </button>

                          {isMenuOpen && (
                            <div
                              ref={menuRef}
                              className={`absolute z-10 bg-white dark:bg-black/50 dark:text-white shadow-md rounded ${openDirection === "top" ? "bottom-5" : "top-5"
                                } right-8`}
                            >
                              <button className="px-4 py-2 text-sm flex items-center w-full hover:bg-opacity-25">
                                <MdBlock className="mr-2" /> Block
                              </button>
                              <button className=" px-4 py-2 text-sm text-red-600  flex items-center w-full hover:bg-opacity-25" onClick={() => handleRemoveMember(member)}>
                                <RiDeleteBin6Line className="mr-2" /> Remove
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
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
                    <div className={`w-9 h-5 rounded-full transition-colors duration-300 ${enabled ? 'bg-primary' : 'bg-gray-300 dark:bg-white/15'}`}>
                      <div
                        className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full shadow-md transform transition-transform duration-300 ${enabled ? 'translate-x-4' : ''}`}
                      ></div>
                    </div>
                  </label>

                </button>
              </div>

              <div className=" max-w-md bg-[#F9FAFA] flex dark:bg-primary-dark  rounded-lg p-3 my-3">
                <button
                  className="w-full flex justify-between items-center"
                  onClick={() => {
                    setGroupUsers(selectedChat?.members);
                    setIsGroupModalOpen(false);
                    setIsModalOpen(true);
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RiUserAddLine size={18} />
                    <span className="font-medium">Add Memebers</span>
                  </div>
                  <FaChevronRight size={12} />
                </button>
              </div>

              <div className=" max-w-md bg-[#F9FAFA] flex dark:bg-primary-dark  rounded-lg p-3 mt-3">
                <button
                  className="w-full flex justify-between items-center text-red-600"
                  onClick={() => handleLeaveGroup(userId)}
                >
                  <div className="flex items-center space-x-2">
                    <FiLogOut size={18} className={""} />
                    <span className="font-medium">Leave Group</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GroupProfile;
