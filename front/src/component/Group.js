import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllGroups } from '../redux/slice/user.slice';
import { useNavigate } from 'react-router-dom';
import { IMG_URL } from '../utils/baseUrl';
import { FaUserPlus, FaArrowLeft } from 'react-icons/fa';
import { createGroup } from "../redux/slice/user.slice";
import { useSocket } from "../hooks/useSocket";
import { ImCross } from 'react-icons/im';
import { MdOutlineModeEdit } from 'react-icons/md';


const Groups = ({setShowLeftSidebar, setSelectedChat, selectedChat, isGroupCreateModalOpen, setIsGroupCreateModalOpen}) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchInput, setSearchInput] = useState('');
    const { groups, loading } = useSelector((state) => state.user);
    const currentUser = useSelector((state) => state.user.user?._id);
    const [groupName, setGroupName] = useState("");
    const [groupUsers, setGroupUsers] = useState([]);
    const [groupPhoto, setGroupPhoto] = useState(null);
    const [userId, setUserId] = useState(sessionStorage.getItem("userId"));
    const { allUsers } = useSelector((state) => state.user);
    const { socket } = useSocket(currentUser,);

    useEffect(() => {
        dispatch(getAllGroups());
    }, [dispatch]);

    const filteredGroups = groups.filter(group =>
        group.userName.toLowerCase().includes(searchInput.toLowerCase())
    );

    const handleGroupClick = (group) => {
        if (group.members?.includes(currentUser)) {
            const event = new CustomEvent('showChatList', {
            });
            window.dispatchEvent(event);
            setSelectedChat(group);
            setShowLeftSidebar(false);
        } else {
            alert("You are not a member of this group");
        }
    };
    return (
      <div className="w-full bg-primary-dark/5 dark:bg-primary-dark/90 h-full  relative"
      style={{
        boxShadow: "inset 0 0 5px 0 rgba(0, 0, 0, 0.1)"
      }}>
            <div className="p-4">
                {/* Header */}  
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                        <h1 className="text-lg font-semibold text-gray-800 dark:text-primary-light">Groups</h1>
                    </div>
                    <button
                        onClick={ ()=> setIsGroupCreateModalOpen(true)}
                        className="w-5 h-5 rounded-full hover:text-primary dark:text-primary-light"
                    >
                        <FaUserPlus className="hover:text-primary" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search groups..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-200 dark:bg-primary-light/15 dark:text-primary-light rounded-md focus:outline-none  text-gray-600"
                    />
                </div>

                {/* {isGroupCreateModalOpen && (
                    <div className="fixed inset-0 bg-black dark:bg-white dark:bg-opacity-10 bg-opacity-50  flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg w-96 dark:bg-primary-dark">
                      <div className="flex justify-between items-center pb-2 p-4">
                        <h2 className="text-lg font-bold dark:text-primary-light">Create Group</h2>
                        <button
                          onClick={() => setIsGroupCreateModalOpen(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <ImCross />
                        </button>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="relative w-24 h-24 rounded-full bg-gray-300 overflow-hidden mt-4 group">
                          <img
                            src={
                              groupPhoto
                                ? URL.createObjectURL(groupPhoto)
                                : require("../img/group.png")
                            }
                            alt="Profile"
                            className="cursor-pointer object-cover w-full h-full rounded-full"
                            onClick={() => document.getElementById("fileInput").click()}
                          />
                          <input
                            type="file"
                            id="fileInput"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                setGroupPhoto(file);
                              }
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <MdOutlineModeEdit
                              className="text-white text-4xl cursor-pointer"
                              onClick={() => document.getElementById("fileInput").click()}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            placeholder="Group Name"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="mt-2 text-xl font-semibold bg-transparent border-none dark:text-primary-light outline-none text-center"
                            autoFocus // This will focus the input when isEditing is true
                          />
                        </div>
                      </div>
                      <div className="mt-4 p-4">
                        <div className="flex items-center justify-between p-2 border-b border-gray-400">
                          <span className="text-gray-600 font-bold dark:text-primary-light">Participants</span>
                          <span className="text-gray-800 dark:text-primary-light">{groupUsers.length || 0}</span>
                        </div>
                        <div className="flex flex-col max-h-48 overflow-y-auto cursor-pointer scrollbar-hide">
                          {allUsers
                            .filter((user) => user._id !== currentUser)
                            .map((user, index) => {
                              const isChecked = groupUsers.includes(user._id); // Check if user is already selected
                              return (
                                <div
                                  key={index}
                                  className={`flex items-center justify-between p-2 hover:bg-primary/50 rounded ${isChecked ? "order-first" : ""
                                    }`}
                                  onClick={() => {
                                    if (!isChecked) {
                                      setGroupUsers((prev) => [...prev, user._id]); // Add user ID to groupUsers state
                                    } else {
                                      setGroupUsers((prev) =>
                                        prev.filter((id) => id !== user._id)
                                      ); // Remove user ID from groupUsers state
                                    }
                                  }}
                                >
                                  <div className="flex items-center">
                                    <div className="w-8 h-8 rounded-full mr-2 bg-gray-300 dark:bg-primary-light/15 overflow-hidden flex items-center justify-center">
                                      {user?.photo && user.photo !== "null" ? (
                                        <img
                                          src={`${IMG_URL}${user.photo.replace(
                                            /\\/g,
                                            "/"
                                          )}`}
                                          alt={`${user.userName}`}
                                          className="object-cover h-full w-full"
                                        />
                                      ) : (
                                        <span className="text-gray-900 dark:text-primary-light   text-sm font-bold">
                                          {user.userName
                                            .split(" ")
                                            .map((n) => n[0].toUpperCase())
                                            .join("")}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-gray-900 dark:text-primary-light/70">{user.userName}</span>
                                  </div>
                                  <input
                                    id={`checkbox-${user._id}`}
                                    type="checkbox"
                                    checked={isChecked} // Set checkbox state based on selection
                                    readOnly // Make checkbox read-only to prevent direct interaction
                                    className="form-checkbox rounded-full accent-primary"
                                    style={{
                                      width: "20px",
                                      height: "20px",
                                      borderRadius: "50%",
                                      border: "2px solid #ccc",
                                      backgroundColor: "#fff",
                                      cursor: "pointer",
                                    }}
                                  />
                                </div>
                              );
                            })}
                        </div>
                        <div className="mt-4 flex justify-center">
                          <button
                            onClick={() => handleCreateGroup()}
                            className="bg-primary text-white px-4 py-1 rounded-full hover:bg-primary/70"
                          >
                            Create Group
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )} */}

                {/* Groups List */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="text-center text-gray-500">Loading groups...</div>
                    ) : filteredGroups.length > 0 ? (
                        filteredGroups.map((group) => (
                            <div
                                key={group._id}
                                className="flex items-center p-2 rounded-lg hover:bg-primary dark:hover:bg-primary hover:text-white cursor-pointer"
                                onClick={() => handleGroupClick(group)}
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                    {group.photo ? (
                                        <img
                                            src={`${IMG_URL}${group.photo.replace(/\\/g, "/")}`}
                                            alt={group.userName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-primary font-medium">
                                            {group.userName.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div className="ml-3 flex-1">
                                    <span className=" dark:text-primary-light">{group.userName}</span>
                                    <div className="text-xs dark:text-primary-light/70">
                                        {group.members?.length} members
                                    </div>
                                </div>
                                {!group.members?.includes(currentUser) && (
                                    <span className="text-xs text-blue-500">
                                        • Not a member
                                    </span>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-gray-500">
                            {searchInput ? 'No groups found' : 'No groups available'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Groups; 