import React, { useState } from 'react';
import { ImCross } from 'react-icons/im';
import { useDispatch } from 'react-redux';
import { updateGroup, getAllMessageUsers, addParticipants } from '../redux/slice/user.slice';

const AddParticipants = ({
  selectedChat,
  setIsModalOpen,
  allUsers,
  userId,
  socket,
  groupUsers,
  setGroupUsers,
}) => {
  const dispatch = useDispatch();
  const [selectedUsers, setSelectedUsers] = useState([]);

  const handleAddParticipants = async () => {
    try {
        const data = {
            groupId: selectedChat._id,
            members: selectedUsers,
            addedBy: userId,
          };
          dispatch(addParticipants(data));
          socket.emit("update-group", data);
          setGroupUsers([]);
          setIsModalOpen(false);
          dispatch(getAllMessageUsers());
    } catch (error) {
      console.error("Failed to add participants:", error);
    }
  };
  const handleUserSelect = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  return (
    <div className="bg-white dark:bg-primary-dark dark:text-primary-light h-full">
      <div className="flex justify-between items-center pb-2 p-4">
        <h2 className="text-lg font-bold">Add Participants</h2>
        <button
          onClick={() => setIsModalOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <ImCross />
        </button>
      </div>
      <div className="p-4">
        <div className="flex flex-col h-[calc(100vh-160px)] overflow-y-auto modal_scroll">
          {allUsers
            ?.filter((user) => !selectedChat.members.includes(user._id))
            .map((user, index) => (
              <div
                key={index}
                className="flex items-center p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-primary-light/10 rounded-lg"
                onClick={() => handleUserSelect(user._id)}
              >
                <div className="w-10 h-10 rounded-full mr-3 bg-gray-300 overflow-hidden flex items-center justify-center border-[1px] border-gray-400">
                  {user?.photo && user.photo !== "null" ? (
                    <img
                      src={`${process.env.REACT_APP_IMG_URL}${user.photo.replace(
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
                  <p className="text-gray-500 text-sm">{user.email}</p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 ${
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
              </div>
            ))}
        </div>
        <div className="mt-4 flex justify-center">
          <button
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/50 transition-colors"
            onClick={() => handleAddParticipants()}
            disabled={selectedUsers.length == 0}
          >
            Add Selected
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddParticipants;