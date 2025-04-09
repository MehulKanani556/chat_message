import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllGroups } from '../redux/slice/user.slice';
import { useNavigate } from 'react-router-dom';
import { IMG_URL } from '../utils/baseUrl';
import { FaUserPlus, FaArrowLeft } from 'react-icons/fa';
import { createGroup } from "../redux/slice/user.slice";
import { useSocket } from "../hooks/useSocket";
import { ImCross } from 'react-icons/im';


const Groups = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchInput, setSearchInput] = useState('');
    const { groups, loading } = useSelector((state) => state.user);
    const currentUser = useSelector((state) => state.user.user?._id);
    const [isGroupCreateModalOpen, setIsGroupCreateModalOpen] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [groupUsers, setGroupUsers] = useState([]);
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
                detail: { selectedChat: group }
            });
            window.dispatchEvent(event);
        } else {
            alert("You are not a member of this group");
        }
    };

    const handleCreateGroup = async () => {
        const data = {
            userName: groupName,
            members: [...groupUsers, userId],
            createdBy: userId,
        };
        try {
            await dispatch(createGroup({ groupData: data, socket }));
            setGroupUsers([]);
            setGroupName("");
            setIsGroupCreateModalOpen(false);
            // dispatch(getAllMessageUsers());
        } catch (error) {
            // Handle any errors that occur during group creation
            console.error("Error creating group:", error);
            // Optionally show error to user via toast/alert
        }
    };

    const handleBack = () => {
        const event = new CustomEvent('showChatList');
        window.dispatchEvent(event);
    };



    return (
        <div className="h-screen w-[380px] bg-[#F5F7FB]">
            <div className="p-4">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                        <button
                            onClick={handleBack}
                            className="mr-4 p-2 rounded-full hover:bg-gray-100"
                        >
                            <FaArrowLeft className="h-5 w-5 text-gray-600" />
                        </button>
                        <h1 className="text-xl font-semibold text-gray-800">Groups</h1>
                    </div>
                    <button
                        onClick={handleCreateGroup}
                        className="p-2 rounded-full hover:bg-gray-100"
                    >
                        <FaUserPlus className="h-6 w-6 text-gray-600" />
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
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-600"
                    />
                </div>

                {isGroupCreateModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-[#F7F7FF] rounded-lg w-96">
                            <div className="flex justify-between items-center pb-2 p-4">
                                <h2 className="text-lg font-bold">Create Group</h2>
                                <button
                                    onClick={() => setIsGroupCreateModalOpen(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <ImCross />
                                </button>
                            </div>
                            <div className="mt-4 p-4">
                                <div className="flex items-center justify-between p-2 border-b border-gray-400">
                                    <span className="text-gray-600 font-bold">Participants</span>
                                    <span className="text-gray-800 ">{groupUsers.length || 0}</span>
                                </div>
                                <div className="flex flex-col max-h-48 overflow-y-auto cursor-pointer modal_scroll">
                                    {allUsers
                                        .filter((user) => user._id !== currentUser)
                                        .map((user, index) => {
                                            const isChecked = groupUsers.includes(user._id); // Check if user is already selected
                                            return (
                                                <div
                                                    key={index}
                                                    className={`flex items-center justify-between p-2 hover:bg-gray-100 rounded ${isChecked ? "order-first" : ""
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
                                                        <div className="w-8 h-8 rounded-full mr-2 bg-gray-300 overflow-hidden flex items-center justify-center border-[1px] border-gray-400">
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
                                                                <span className="text-gray-900 text-lg font-bold">
                                                                    {user.userName
                                                                        .split(" ")
                                                                        .map((n) => n[0].toUpperCase())
                                                                        .join("")}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span>{user.userName}</span>
                                                    </div>
                                                    <input
                                                        id={`checkbox-${user._id}`}
                                                        type="checkbox"
                                                        checked={isChecked} // Set checkbox state based on selection
                                                        readOnly // Make checkbox read-only to prevent direct interaction
                                                        className="form-checkbox rounded-full"
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
                                        className="bg-blue-500 text-white px-4 py-1 rounded-full hover:bg-blue-600"
                                    >
                                        Create Group
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Groups List */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="text-center text-gray-500">Loading groups...</div>
                    ) : filteredGroups.length > 0 ? (
                        filteredGroups.map((group) => (
                            <div
                                key={group._id}
                                className="flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
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
                                        <span className="text-purple-600 font-medium">
                                            {group.userName.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div className="ml-3 flex-1">
                                    <span className="text-gray-700">#{group.userName}</span>
                                    <div className="text-xs text-gray-500">
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