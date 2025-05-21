import React, { useState } from 'react';
import { ImCross } from 'react-icons/im';
import { useDispatch } from 'react-redux';
import { updateGroup, getAllMessageUsers, addParticipants } from '../redux/slice/user.slice';
import { IoIosArrowBack } from "react-icons/io";
import { IMG_URL } from '../utils/baseUrl';
import { setIsGroupCreateModalOpen, setIsGroupModalOpen, setIsModalOpen } from '../redux/slice/manageState.slice';

const AddParticipants = ({
  selectedChat,
  // setIsModalOpen,
  allUsers,
  userId,
  socket,
  groupUsers,
  setGroupUsers,
  // setIsGroupModalOpen,
  creatGroup,
}) => {
  const dispatch = useDispatch();
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchInput, setSearchInput] = useState("");

  console.log(creatGroup);
  
  const filteredAllUsers = allUsers.filter(
    (user) =>
      // !user.members &&
      // user._id !== userId &&
      user.userName?.toLowerCase().includes(searchInput?.toLowerCase())
  );

  const handleAddParticipants = async () => {
    if(creatGroup){
      dispatch(setIsModalOpen(false));
      dispatch(setIsGroupCreateModalOpen(true));
    }else{

      try {
          const data = {
              groupId: selectedChat._id,
              members: selectedUsers,
              addedBy: userId,
            };
           const result = await dispatch(addParticipants(data)).unwrap();
  
           if (result.status === true) {
            socket.emit("update-group", data);
            setGroupUsers([]);
            dispatch(setIsModalOpen(false));
            dispatch(setIsGroupModalOpen(true));
            dispatch(getAllMessageUsers());
           }
      } catch (error) {
        console.error("Failed to add participants:", error);
      }
    }
  };
  const handleUserSelect = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
      setGroupUsers(groupUsers.filter((id) => id !== userId));

    } else {
      setSelectedUsers([...selectedUsers, userId]);
      setGroupUsers([...groupUsers, userId]);
    }
  };

  return (
    <div
      className="w-full  bg-primary-dark/5 dark:bg-primary-dark/90 dark:text-primary-light h-full"
      style={{
        boxShadow: "inset 0 0 5px 0 rgba(0, 0, 0, 0.1)",
      }}
    >
     <div className="flex justify-between items-center p-4 py-6">
        <h2 className="text-lg font-bold flex items-center"><IoIosArrowBack className="mr-2 cursor-pointer hover:text-primary" onClick={() => {dispatch(setIsGroupModalOpen(true)); dispatch(setIsModalOpen(false));}}/>Add Participants</h2>
        <button
          onClick={() => dispatch(setIsModalOpen(false))}
          className="text-gray-500 hover:text-gray-700"
        >
          <ImCross />
        </button>
      </div>
      <div className="sm:block flex-1 h-[1px] bg-gradient-to-r from-gray-300/30 via-gray-300 to-gray-300/30 dark:bg-gradient-to-l dark:from-white/5 dark:via-white/30 dark:to-white/5 max-w-[100%] mx-auto" />
     
        {/* Search bar */}
        <div className="relative p-4">
            <input
              type="text"
              placeholder="Search users"
              className="w-full py-2 pl-10 pr-4 bg-[#E0E5EB] rounded-md text-gray-600 dark:text-white dark:bg-white/10  focus:outline-none"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <svg
              className="absolute left-7 top-7 text-gray-400"
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

          <div className="text-gray-700 font-medium dark:text-primary-light cursor-pointer flex items-center gap-2 px-4">
           All Users
          </div>
     
      <div className="p-4">
        <div className="flex flex-col h-[calc(100vh-275px)] overflow-y-auto modal_scroll">
          {filteredAllUsers
            ?.filter((user) => !creatGroup ? !selectedChat.members.includes(user._id) : user._id !== userId)
            .map((user, index) => (
              <div
                key={index}
                className="flex items-center p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-primary-light/10 rounded-md bg-primary-dark/80 mb-2"
                onClick={() => handleUserSelect(user._id)}
              >
                  <div
                  className={`w-5 h-5 rounded border mr-3 ${
                    selectedUsers.includes(user._id)
                      ? "bg-primary border-primary"
                      : "border-gray-400"
                  }`}
                >
                  {selectedUsers.includes(user._id) && (
                    <svg
                      className="w-full h-full text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                <div className="w-9 h-9 rounded-full mr-3 bg-gray-300 overflow-hidden flex items-center justify-center border-[1px] border-gray-400">
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
                <div className="flex-1">
                  <h3 className="text-gray-800 dark:text-primary-light/80 font-semibold">
                    {user.userName}
                  </h3>
                  {/* <p className="text-gray-500 text-sm">{user.email}</p> */}
                </div>
              
              </div>
            ))}
        </div>
        <div className="mt-4 flex justify-center w-full">
          <button
            className="px-4 py-2 w-full bg-primary text-white rounded-md hover:bg-primary/50 transition-colors"
            onClick={() => handleAddParticipants()}
            disabled={selectedUsers.length == 0}
          >
            Add Members
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddParticipants;