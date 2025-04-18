import React, { useState, useEffect } from "react";
import { ImCross } from "react-icons/im";
import { MdOutlineModeEdit } from "react-icons/md";
import { IMG_URL } from "../utils/baseUrl"; // Assuming IMG_URL is needed here
import { createGroup, getAllMessageUsers } from "../redux/slice/user.slice";
import { useDispatch } from "react-redux";
const CreatedGroup = ({
  isOpen,
  onClose,
  allUsers,
  currentUser,
  onCreateGroup,
  socket,
}) => {
  const dispatch = useDispatch();
  const [groupName, setGroupName] = useState("");
  const [groupUsers, setGroupUsers] = useState([]);
  const [groupPhoto, setGroupPhoto] = useState(null);

  // Reset state when modal is closed/opened
  useEffect(() => {
    if (!isOpen) {
      setGroupName("");
      setGroupUsers([]);
      setGroupPhoto(null);
    }
  }, [isOpen]);

  const handleCreateClick = () => {
    // Pass the data up to the parent component
    onCreateGroup({
      userName: groupName || "Group", // Default name if empty
      photo: groupPhoto,
      members: [...groupUsers, currentUser], // Add current user as member
    });
    onClose(); // Close modal after attempting creation
  };

  const handleUserSelection = (userId) => {
    setGroupUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  if (!isOpen) {
    return null;
  }

  const handleCreateGroup = async () => {
    const data = {
      userName: groupName,
      members: [...groupUsers, currentUser],
      createdBy: currentUser,
      photo: groupPhoto,
    };
    try {
      await dispatch(createGroup({ groupData: data, socket }));
      setGroupUsers([]);
      setGroupPhoto(null);
      setGroupName("");
      onClose();
      dispatch(getAllMessageUsers());
    } catch (error) {
      // Handle any errors that occur during group creation
      console.error("Error creating group:", error);
      // Optionally show error to user via toast/alert
    }
  };

  return (
    <div className="bg-white  dark:bg-primary-dark w-full h-full">
      <div className="flex justify-between items-center pb-2 p-4">
        <h2 className="text-lg font-bold dark:text-primary-light">
          Create Group
        </h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <ImCross />
        </button>
      </div>
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24 rounded-full bg-gray-300 overflow-hidden mt-4 group">
          <img
            src={
              groupPhoto
                ? URL.createObjectURL(groupPhoto)
                : require("../img/group.png") // Make sure this path is correct relative to this file or use a placeholder
            }
            alt="Group Profile"
            className="cursor-pointer object-cover w-full h-full rounded-full"
            onClick={() => document.getElementById("groupFileInput").click()}
          />
          <input
            type="file"
            id="groupFileInput"
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setGroupPhoto(e.target.files[0]);
              }
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <MdOutlineModeEdit
              className="text-white text-4xl cursor-pointer"
              onClick={() => document.getElementById("groupFileInput").click()}
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
            autoFocus
          />
        </div>
      </div>
      <div className="mt-4 p-4">
        <div className="flex items-center justify-between p-2 border-b border-gray-400">
          <span className="text-gray-600 font-bold dark:text-primary-light">
            Participants
          </span>
          {/* Display count including the current user */}
          <span className="text-gray-800 dark:text-primary-light">
            {groupUsers.length + 1}
          </span>
        </div>
        <div className="flex flex-col h-[calc(100vh-360px)] overflow-y-auto cursor-pointer scrollbar-hide">
          {allUsers
            .filter((user) => user._id !== currentUser) // Exclude current user from list
            .map((user, index) => {
              const isChecked = groupUsers.includes(user._id);
              return (
                <div
                  key={index}
                  className={`flex items-center justify-between p-2 hover:bg-primary/50 rounded ${
                    isChecked ? "order-first" : ""
                  }`}
                  onClick={() => handleUserSelection(user._id)}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full mr-2 bg-gray-300 dark:bg-primary-light/15 overflow-hidden flex items-center justify-center">
                      {user?.photo && user.photo !== "null" ? (
                        <img
                          src={`${IMG_URL}${user.photo.replace(/\\/g, "/")}`}
                          alt={`${user.userName}`}
                          className="object-cover h-full w-full"
                        />
                      ) : (
                        <span className="text-gray-900 dark:text-primary-light text-sm font-bold">
                          {user.userName
                            .split(" ")
                            .map((n) => n[0].toUpperCase())
                            .join("")}
                        </span>
                      )}
                    </div>
                    <span className="text-gray-900 dark:text-primary-light/70">
                      {user.userName}
                    </span>
                  </div>
                  <input
                    id={`checkbox-${user._id}`}
                    type="checkbox"
                    checked={isChecked}
                    readOnly
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
            onClick={handleCreateGroup}
            disabled={!groupName && groupUsers.length === 0} // Optional: Disable button if no name and no users selected
            className="bg-primary text-white px-4 py-1 rounded-full hover:bg-primary/70 disabled:opacity-50"
          >
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatedGroup;
