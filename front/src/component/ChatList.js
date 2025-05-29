import { GoPencil } from "react-icons/go";
import { PiPencilSimpleBold } from "react-icons/pi";
import { VscCallIncoming, VscCallOutgoing } from "react-icons/vsc";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaAngleLeft, FaChevronDown } from "react-icons/fa";
import { RiArrowUpDownLine } from "react-icons/ri";
import { SlPin } from "react-icons/sl";
import { setChatMessages, setShowLeftSidebar } from "../redux/slice/manageState.slice";
const ChatList = ({
  allMessageUsers,
  item,
  currentUser,
  selectedChat,
  setSelectedChat,
  allUsers,
  handleMultipleFileUpload,
  typingUsers,
  isVideoCalling
}) => {
  const [findUser, setFindUser] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [archive, setArchive] = useState(false);
  const [filteredMessageUsers, setFilteredMessageUsers] = useState([]);
  const { user } =
    useSelector((state) => state.user);
  const { onlineUsers } = useSelector(state => state.magageState)
  const [draggedUser, setDraggedUser] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    let filteredUsers = [];
    if (archive) {
      filteredUsers = allMessageUsers.filter(item => user?.archiveUsers?.includes(item._id))
      filteredUsers = filteredUsers.filter(item => item.userName.toLowerCase().includes(searchInput.toLowerCase()))
    } else {
      filteredUsers = allMessageUsers.filter(item => !user?.archiveUsers?.includes(item._id))
      filteredUsers = filteredUsers.filter(item => item.userName.toLowerCase().includes(searchInput.toLowerCase()))
    }
    setFilteredMessageUsers(filteredUsers);
  }, [archive, searchInput, allMessageUsers]);

  // Filter all users based on search input
  const filteredAllUsers = allUsers?.filter(
    (user) =>
      !user.members &&
      user._id !== currentUser &&
      user.userName?.toLowerCase().includes(searchInput?.toLowerCase())
  );

  // Add decryption function
  const decryptMessage = (content) => {
    if (typeof content === 'string' && content.startsWith('data:')) {
      try {
        const key = 'chat';
        const encodedText = content.split('data:')[1];
        const decodedText = atob(encodedText);
        let result = '';
        for (let i = 0; i < decodedText.length; i++) {
          result += String.fromCharCode(decodedText.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
      } catch (error) {
        console.error('Decryption error:', error);
        return content;
      }
    }
    return content;
  };

  // Function to handle drag start
  const handleDragStart = (event, user) => {
    console.log('Drag started:', user);
    setDraggedUser(user);
    event.dataTransfer.effectAllowed = 'move';
  };

  // Function to handle drag over
  const handleDragOver = (event) => {
    console.log('Dragging over');
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  // Function to handle drop
  const handleDrop = (event, user) => {
    console.log('Dropped on:', user, event.dataTransfer.files);
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleMultipleFileUpload(event.dataTransfer.files, user);
    }
    setDraggedUser(null);
  };

  // Add event listeners for drag and drop
  const handleFileDrop = (event, user) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    console.log(files);

    if (files.length > 0) {
      console.log('Files dropped:', files);
      const file = files[0];
    }
  };

  return (
    <div className="w-full bg-primary-dark/5 dark:bg-primary-dark/90 h-full  relative"
      style={{
        boxShadow: "inset 0 0 5px 0 rgba(0, 0, 0, 0.1)"
      }}>
      <>
        <div className="p-4 pb-2">
          <h1 className="text-lg font-semibold text-gray-800 dark:text-primary-light mb-4 flex items-center gap-2">
            {findUser ? <FaAngleLeft className="cursor-pointer" onClick={() => setFindUser(false)} /> : ""} Chats
          </h1>

          {/* Search bar */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search users"
              className="w-full py-2 pl-10 pr-4 bg-[#E0E5EB] rounded-md text-gray-600 dark:text-white dark:bg-white/10  focus:outline-none"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <svg
              className="absolute left-3 top-2.5 text-gray-400"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <div className="text-gray-700 font-medium dark:text-primary-light cursor-pointer flex items-center gap-2" onClick={() => {
            if (!findUser) {
              setArchive(!archive)
            }
          }}>
            {!findUser ? `${archive ? `Archived` : "Recent"}` : "All Users"}
            {!findUser && <RiArrowUpDownLine />}
          </div>
        </div>

        {/* Chat list - scrollable area */}
        {!findUser ? (
          <div className="overflow-y-auto h-[calc(100vh-175px)] p-3 scrollbar-hide">
            {
              filteredMessageUsers
                .slice()
                .sort((a, b) => {
                  // Prioritize the current user
                  if (a._id === currentUser) return -1;
                  if (b._id === currentUser) return 1;
                  // Check if users are pinned
                  const isAPinned = user?.pinChatFor?.includes(a._id);
                  const isBPinned = user?.pinChatFor?.includes(b._id);

                  // If one is pinned and other is not, prioritize pinned
                  if (isAPinned && !isBPinned) return -1;
                  if (!isAPinned && isBPinned) return 1;

                  const lastMessageA = Array.isArray(a.messages)
                    ? [...a.messages].sort(
                      (x, y) => new Date(y.createdAt) - new Date(x.createdAt)
                    )[0]
                    : null;
                  const lastMessageB = Array.isArray(b.messages)
                    ? [...b.messages].sort(
                      (x, y) => new Date(y.createdAt) - new Date(x.createdAt)
                    )[0]
                    : null;

                  // New sorting logic for no messages
                  if (!lastMessageA && !lastMessageB) {
                    return new Date(b.createdAt) - new Date(a.createdAt); // Sort by createdAt if both have no messages
                  }
                  if (!lastMessageA) return 1; // If A has no messages, B comes first
                  if (!lastMessageB) return -1; // If B has no messages, A comes first

                  return (
                    new Date(lastMessageB.createdAt) -
                    new Date(lastMessageA.createdAt)
                  );
                })
                .map((item) => {
                  const lastMessage = Array.isArray(item.messages)
                    ? [...item.messages].sort(
                      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                    )[0]
                    : null;
                  if (lastMessage?.deletedFor?.includes(currentUser) && lastMessage?.receiver == currentUser && lastMessage?.sender != currentUser) {
                    return null;
                  }
                  return (
                    <div
                      key={item._id}
                      className={`px-3 py-2  hover:bg-primary  hover:dark:bg-primary/85 hover:text-white cursor-pointer rounded-md mb-2
                    ${selectedChat?._id === item._id
                          ? "bg-primary dark:bg-primary/85 text-white"
                          : "bg-white dark:bg-primary-dark/50"
                        }`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => {
                        handleDrop(e, item);
                        handleFileDrop(e, item);
                      }}
                      onClick={() => {
                        if (isVideoCalling) {
                          dispatch(setChatMessages(item));
                        }
                        setSelectedChat(item);
                        dispatch(setShowLeftSidebar(false));
                      }}
                    >
                      <div className="flex items-center">
                        {/* {console.log("object", item)}  */}
                        <div className="relative mr-3">
                          {item?.photo && item.photo !== "null" && !item?.blockedUsers?.includes(currentUser) && (item?.profilePhoto == "Everyone" || item._id === currentUser || item.isGroup) ? (
                            <img
                              src={`${item.photo.replace(/\\/g, "/")}`}
                              alt="Profile"
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                              {item?.userName && item?.userName.includes(" ")
                                ? item?.userName.split(" ")[0][0].toUpperCase() +
                                item?.userName.split(" ")[1][0].toUpperCase()
                                : item?.userName[0].toUpperCase()}
                            </div>
                          )}
                          {onlineUsers.includes(item._id) && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="font-medium dark:text-primary-light">
                              {" "}
                              {item._id === currentUser
                                ? `${item.userName} (You)`
                                : item.userName}{" "}
                            </span>
                            <span className="text-xs dark:text-primary-light/45">
                              {lastMessage
                                ? (() => {
                                  const messageDate = new Date(
                                    lastMessage.createdAt
                                  );
                                  const now = new Date();
                                  const tomorrow = new Date();
                                  tomorrow.setDate(now.getDate() + 1);
                                  const oneWeekAgo = new Date();
                                  oneWeekAgo.setDate(now.getDate() - 7);
                                  if (
                                    messageDate.toDateString() ===
                                    now.toDateString()
                                  ) {
                                    return messageDate.toLocaleTimeString([], {
                                      hour: "numeric",
                                      minute: "2-digit",
                                      hour12: false,
                                    });
                                  } else if (
                                    messageDate.toDateString() ===
                                    tomorrow.toDateString()
                                  ) {
                                    return "Tomorrow";
                                  } else if (messageDate >= oneWeekAgo) {
                                    return messageDate.toLocaleDateString(
                                      "en-US",
                                      { weekday: "long" }
                                    );
                                  } else {
                                    // Format date as dd/mm/yyyy
                                    const day = String(
                                      messageDate.getDate()
                                    ).padStart(2, "0");
                                    const month = String(
                                      messageDate.getMonth() + 1
                                    ).padStart(2, "0"); // Months are zero-based
                                    const year = messageDate.getFullYear();
                                    return `${day}/${month}/${year}`;
                                  }
                                })()
                                : ""}
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            {typingUsers?.includes(item._id) ?
                              <div className="text-sm truncate max-w-[200px] animate-pulse text-green-500">
                                Typing ...
                              </div>
                              :
                              <div className="text-sm truncate max-w-[200px] dark:text-primary-light/45">
                                {item?.messages?.[0]?.deletedFor?.includes(
                                  currentUser
                                ) ? (
                                  ""
                                ) : (
                                  item.messages?.filter((message) =>
                                    message.receiver === currentUser &&
                                    message.status !== "read"
                                  ).length >= 2 ? (
                                    <span className=" ml-1 flex gap-1 items-center">
                                      <span
                                        style={{
                                          overflow: "hidden",
                                          whiteSpace: "nowrap",
                                          textOverflow: "ellipsis",
                                          maxWidth: "150px",
                                        }}
                                      >
                                        {item.messages?.filter((message) =>
                                          message.receiver === currentUser &&
                                          message.status !== "read"
                                        ).length} New Messages
                                      </span>
                                    </span>
                                  ) : (
                                    <>
                                      {item?.messages?.[0]?.content?.type ===
                                        "call" &&
                                        item.messages && (
                                          <div className="flex gap-1 items-center">
                                            {item.messages[item.messages.length - 1]
                                              .sender !== currentUser ? (
                                              <VscCallIncoming className="self-center text-base" />
                                            ) : (
                                              <VscCallOutgoing className="self-center text-base" />
                                            )}
                                            &nbsp;
                                            {item.messages[item.messages.length - 1]
                                              .content.status === "missed"
                                              ? "No answer"
                                              : "Call ended"}
                                            {item.messages[item.messages.length - 1]
                                              .content.duration && (
                                                <span>
                                                  &nbsp;|&nbsp;
                                                  {
                                                    item.messages[
                                                      item.messages.length - 1
                                                    ].content.duration
                                                  }
                                                </span>
                                              )}
                                          </div>
                                        )}
                                      {item?.messages?.[0]?.content.fileType?.startsWith(
                                        "image/"
                                      ) ? (
                                        <>
                                          <span className="text-sm ml-1 flex gap-1 items-center">
                                            <span>
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
                                                  d="M3.5 21h17c.275 0 .5-.225.5-.5v-17c0-.275-.225-.5-.5-.5h-17c-.275 0-.5.225-.5.5v17c0 .275.225.5.5.5Z"
                                                  fill="#fff"
                                                ></path>
                                                <path
                                                  fillRule="evenodd"
                                                  clipRule="evenodd"
                                                  d="M16 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
                                                  stroke="#FF9810"
                                                  fill="#fff"
                                                ></path>
                                                <path
                                                  fillRule="evenodd"
                                                  clipRule="evenodd"
                                                  d="m14.116 12.815-1.162 1.702-2.103-2.9a1 1 0 0 0-1.619 0l-3.115 4.296a1 1 0 0 0 .81 1.587h10.146a1 1 0 0 0 .826-1.564l-2.131-3.121a1 1 0 0 0-1.652 0Z"
                                                  stroke="#A6CCC3"
                                                  fill="#fff"
                                                ></path>
                                                <path
                                                  opacity="0.64"
                                                  fillRule="evenodd"
                                                  clipRule="evenodd"
                                                  d="M3.5 22h17c.827 0 1.5-.673 1.5-1.5v-17c0-.827-.673-1.5-1.5-1.5h-17C2.673 2 2 2.673 2 3.5v17c0 .827.673 1.5 1.5 1.5ZM3 3.5a.5.5 0 0 1 .5-.5h17a.5.5 0 0 1 .5.5v17a.5.5 0 0 1-.5.5h-17a.5.5 0 0 1-.5-.5v-17Z"
                                                  fill="#605E5C"
                                                ></path>
                                              </svg>
                                            </span>{" "}
                                            photo
                                          </span>
                                        </>
                                      ) : item?.messages?.[0]?.content.fileType ===
                                        "application/pdf" ? (
                                        <span
                                          className="text-sm ml-1 flex gap-1 items-center"
                                          style={{
                                            overflow: "hidden",
                                            whiteSpace: "nowrap",
                                            textOverflow: "ellipsis",
                                            maxWidth: "150px",
                                          }}
                                        >
                                          <span>
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
                                              <path
                                                fillRule="evenodd"
                                                clipRule="evenodd"
                                                d="M7.5 10h9a.5.5 0 0 0 0-1h-9a.5.5 0 0 0 0 1Zm0 2h9a.5.5 0 0 0 0-1h-9a.5.5 0 0 0 0 1Z"
                                                fill="#C8C6C4"
                                              ></path>
                                              <path
                                                fillRule="evenodd"
                                                clipRule="evenodd"
                                                d="M14.5 20.5h-5a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1Z"
                                                stroke="#D65532"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                fill="#fff"
                                              ></path>
                                              <path
                                                fillRule="evenodd"
                                                clipRule="evenodd"
                                                d="M6.75 20H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h2.75a.25.25 0 0 1 .25.25v4.5a.25.25 0 0 1-.25.25Zm10.5-5H20a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-2.75a.25.25 0 0 1-.25-.25v-4.5a.25.25 0 0 1 .25-.25Z"
                                                fill="#D65532"
                                              ></path>
                                            </svg>
                                          </span>
                                          <span
                                            style={{
                                              overflow: "hidden",
                                              whiteSpace: "nowrap",
                                              textOverflow: "ellipsis",
                                              maxWidth: "150px",
                                            }}
                                          >
                                            {decryptMessage(item?.messages?.[0]?.content.content)}
                                          </span>
                                        </span>
                                      ) : item?.messages?.[0]?.content.fileType ===
                                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ? (
                                        <span
                                          className="text-sm ml-1 flex gap-1 items-center"
                                          style={{
                                            overflow: "hidden",
                                            whiteSpace: "nowrap",
                                            textOverflow: "ellipsis",
                                            maxWidth: "150px",
                                          }}
                                        >
                                          <span>
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
                                              <path
                                                d="M22 7H7v5l7.5 2.016L22 12V7Z"
                                                fill="#2B7CD3"
                                              ></path>
                                              <path
                                                d="M22 12H7v5l8 2 7-2v-5Z"
                                                fill="#185ABD"
                                              ></path>
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
                                          <span
                                            style={{
                                              overflow: "hidden",
                                              whiteSpace: "nowrap",
                                              textOverflow: "ellipsis",
                                              maxWidth: "150px",
                                            }}
                                          >
                                            {decryptMessage(item?.messages?.[0]?.content.content)}
                                          </span>
                                        </span>
                                      ) : item?.messages?.[0]?.content.fileType ===
                                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ? (
                                        <span className="text-sm ml-1 flex gap-1 items-center">
                                          <span>
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
                                              <path
                                                d="M7 12h8V7H7v5Z"
                                                fill="#107C41"
                                              ></path>
                                              <path
                                                d="M22 3.82V7h-7V3h6.17c.46 0 .83.37.83.82"
                                                fill="#33C481"
                                              ></path>
                                              <path
                                                d="M15 12H7v8.167c0 .46.373.833.833.833h13.334c.46 0 .833-.373.833-.833V17l-7-5Z"
                                                fill="#185C37"
                                              ></path>
                                              <path
                                                d="M15 17h7v-5h-7v5Z"
                                                fill="#107C41"
                                              ></path>
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
                                          <span
                                            style={{
                                              overflow: "hidden",
                                              whiteSpace: "nowrap",
                                              textOverflow: "ellipsis",
                                              maxWidth: "150px",
                                            }}
                                          >
                                            {decryptMessage(item?.messages?.[0]?.content.content)}
                                          </span>
                                        </span>
                                      ) : item?.messages?.[0]?.content.fileType ===
                                        "application/vnd.openxmlformats-officedocument.presentationml.presentation" ? (
                                        <span className="text-sm ml-1 flex gap-1 items-center">
                                          <span>
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
                                          </span>
                                          <span
                                            style={{
                                              overflow: "hidden",
                                              whiteSpace: "nowrap",
                                              textOverflow: "ellipsis",
                                              maxWidth: "150px",
                                            }}
                                          >
                                            {decryptMessage(item?.messages?.[0]?.content.content)}
                                          </span>
                                        </span>
                                      ) : item?.messages?.[0]?.content.fileType ===
                                        "application/zip" ? (
                                        <span
                                          className="text-sm ml-1 flex gap-1 items-center"
                                          style={{
                                            overflow: "hidden",
                                            whiteSpace: "nowrap",
                                            textOverflow: "ellipsis",
                                            maxWidth: "150px",
                                          }}
                                        >
                                          <span>
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
                                          </span>
                                          <span
                                            style={{
                                              overflow: "hidden",
                                              whiteSpace: "nowrap",
                                              textOverflow: "ellipsis",
                                              maxWidth: "150px",
                                            }}
                                          >
                                            {decryptMessage(item?.messages?.[0]?.content.content)}
                                          </span>
                                        </span>
                                      ) : item?.messages?.[0]?.content.fileType ===
                                        "video/mp4" ? (
                                        <span className="text-sm ml-1 flex  items-center">
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
                                          &nbsp; Video
                                        </span>
                                      ) : item?.messages?.[0]?.content.fileType ===
                                        "text/plain" ? (
                                        <span className="text-sm ml-1 flex gap-1 items-center">
                                          <span>
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
                                          </span>
                                          <span
                                            style={{
                                              overflow: "hidden",
                                              whiteSpace: "nowrap",
                                              textOverflow: "ellipsis",
                                              maxWidth: "150px",
                                            }}
                                          >
                                            {decryptMessage(item?.messages?.[0]?.content.content)}
                                          </span>
                                        </span>
                                      ) : item?.messages?.[0]?.content.type ===
                                        "file" ? (
                                        <span className="text-sm ml-1 flex gap-1 items-center">
                                          <span>
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
                                          </span>
                                          <span
                                            style={{
                                              overflow: "hidden",
                                              whiteSpace: "nowrap",
                                              textOverflow: "ellipsis",
                                              maxWidth: "150px",
                                            }}
                                          >
                                            {decryptMessage(item?.messages?.[0]?.content.content)}
                                          </span>
                                        </span>
                                      ) : (
                                        <span className=" ml-1 flex gap-1 items-center">
                                          <span
                                            style={{
                                              overflow: "hidden",
                                              whiteSpace: "nowrap",
                                              textOverflow: "ellipsis",
                                              maxWidth: "150px",
                                            }}
                                          >
                                            {decryptMessage(item?.messages?.[0]?.content?.content?.replace(
                                              /\*\*/g,
                                              ""
                                            ))}
                                          </span>
                                        </span>
                                      )}
                                    </>
                                  )
                                )}
                              </div>
                            }
                            <div className="flex gap-2">
                              {user?.pinChatFor.length > 0 && user?.pinChatFor?.includes(item?._id) ? <SlPin className="text-lg" /> : ""}
                              {user?.muteUsers?.includes(item?._id) ?
                                <svg width="19" height="16" viewBox="0 0 19 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M9.20285 4.59811L13.4544 1.40611C13.5041 1.36989 13.5626 1.34782 13.6239 1.34226C13.6851 1.33669 13.7467 1.34784 13.8021 1.37451C13.8575 1.40118 13.9046 1.44237 13.9384 1.4937C13.9722 1.54504 13.9915 1.60458 13.9942 1.666V8.99627C13.9942 9.173 14.0644 9.3425 14.1894 9.46747C14.3143 9.59245 14.4838 9.66265 14.6606 9.66265C14.8373 9.66265 15.0068 9.59245 15.1318 9.46747C15.2567 9.3425 15.3269 9.173 15.3269 8.99627V1.666C15.3269 1.35661 15.2408 1.05334 15.0781 0.790152C14.9155 0.526969 14.6827 0.31428 14.406 0.175916C14.1293 0.0375526 13.8195 -0.0210183 13.5114 0.00676668C13.2032 0.0345517 12.9089 0.147595 12.6614 0.333229L8.40318 3.53189C8.33317 3.5844 8.27419 3.65018 8.2296 3.72548C8.18502 3.80078 8.1557 3.88413 8.14332 3.97076C8.13095 4.05739 8.13576 4.14561 8.15748 4.23038C8.17919 4.31516 8.2174 4.39482 8.2699 4.46483C8.32241 4.53484 8.38819 4.59382 8.46349 4.63841C8.53879 4.68299 8.62214 4.71231 8.70877 4.72469C8.7954 4.73706 8.88363 4.73226 8.9684 4.71054C9.05317 4.68882 9.13284 4.65062 9.20285 4.59811ZM18.4256 14.8205L1.09957 0.159968C0.965254 0.0450888 0.7908 -0.0117266 0.61459 0.00202033C0.438379 0.0157672 0.274847 0.0989504 0.159968 0.233271C0.0450888 0.367591 -0.0117266 0.542045 0.00202033 0.718255C0.0157672 0.894466 0.0989503 1.058 0.23327 1.17288L4.09165 4.43818C3.85605 4.62435 3.6654 4.86121 3.53389 5.13117C3.40237 5.40112 3.33336 5.69724 3.33197 5.99752V9.99585C3.33197 10.5261 3.5426 11.0346 3.91751 11.4095C4.29243 11.7844 4.80092 11.995 5.33113 11.995H7.77678L12.6614 15.6668C12.9089 15.8524 13.2032 15.9655 13.5114 15.9933C13.8195 16.0211 14.1293 15.9625 14.406 15.8241C14.6827 15.6858 14.9155 15.4731 15.0781 15.2099C15.2408 14.9467 15.3269 14.6434 15.3269 14.334V13.9542L17.5593 15.8401C17.681 15.9409 17.8345 15.9952 17.9925 15.9933C18.1287 15.9933 18.2617 15.9516 18.3735 15.8737C18.4852 15.7959 18.5705 15.6856 18.6177 15.5578C18.6649 15.43 18.6718 15.2908 18.6374 15.159C18.6031 15.0272 18.5292 14.909 18.4256 14.8205ZM13.9942 14.3274C13.9899 14.3873 13.97 14.4452 13.9366 14.4951C13.9032 14.5451 13.8573 14.5855 13.8035 14.6124C13.7497 14.6393 13.6899 14.6518 13.6298 14.6485C13.5698 14.6453 13.5116 14.6265 13.4611 14.5939L8.39652 10.7955C8.28117 10.709 8.14087 10.6622 7.99669 10.6622H5.33113C5.1544 10.6622 4.9849 10.592 4.85993 10.4671C4.73496 10.3421 4.66475 10.1726 4.66475 9.99585V5.99752C4.66098 5.84348 4.71072 5.69289 4.80549 5.57139C4.90026 5.44989 5.0342 5.36499 5.18453 5.33113L13.9942 12.8147V14.3274Z" fill="currentColor" />
                                </svg> : ""}

                              {item.messages?.filter(
                                (message) =>
                                  message.receiver === currentUser &&
                                  message.status !== "read"
                              ).length > 0 && (
                                  <div
                                    className={`ml-2 w-5 h-5 text-center flex items-center justify-center text-xs font-semibold rounded-full
                              ${selectedChat?._id === item._id
                                        ? "bg-white text-primary-dark"
                                        : "bg-primary text-white"
                                      }`}
                                  >
                                    {item.messages?.filter(
                                      (message) =>
                                        message.receiver === currentUser &&
                                        message.status !== "read"
                                    ).length > 99
                                      ? "99+"
                                      : item.messages?.filter(
                                        (message) =>
                                          message.receiver === currentUser &&
                                          message.status !== "read"
                                      ).length}
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
          </div>
        ) : (
          <div className="overflow-y-auto h-[calc(100vh-150px)] p-3 scrollbar-hide">
            {filteredAllUsers.map((item) => {
              return (
                <div
                  key={item._id}
                  className={`px-3 py-2    hover:bg-primary  hover:dark:bg-primary/85 cursor-pointer rounded-md mb-2
                    ${selectedChat?._id === item._id
                      ? "bg-primary dark:bg-primary/85"
                      : "bg-white dark:bg-primary-dark/50"
                    }`}
                  onClick={() => {
                    setSelectedChat(item);
                    setSearchInput("");
                    setFindUser(!findUser);
                    if (window.innerWidth <= 425) {
                      dispatch(setShowLeftSidebar(false));
                    }
                  }}
                >
                  <div className="flex items-center">
                    <div className="relative mr-3">
                      {item?.photo && item.photo !== "null" && (item?.profilePhoto == "Everyone" || item.isGroup) ? (
                        <img
                          src={`${item.photo.replace(/\\/g, "/")}`}
                          alt="Profile"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                          {item?.userName && item?.userName.includes(" ")
                            ? item?.userName.split(" ")[0][0].toUpperCase() +
                            item?.userName.split(" ")[1][0].toUpperCase()
                            : item?.userName[0].toUpperCase()}
                        </div>
                      )}
                      {onlineUsers.includes(item._id) && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-800 dark:text-primary-light">
                          {" "}
                          {item._id === currentUser
                            ? `${item.userName} (You)`
                            : item.userName}{" "}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div
          className={`bg-primary cursor-pointer w-10 h-10 absolute bottom-24 md:bottom-7 right-4 rounded-full text-xl text-white text-center flex justify-center ${findUser ? "hidden" : "block"}`}
          style={{
            alignItems: "center",
          }}
          onClick={() => {
            setFindUser(!findUser);
            setSearchInput("");
          }}
        >
          <GoPencil />
        </div>
      </>
    </div>
  );
};

export default ChatList;
