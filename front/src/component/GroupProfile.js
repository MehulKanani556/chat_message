import React, { useState } from "react";
import { ImCross } from "react-icons/im";
import { MdOutlineModeEdit } from "react-icons/md";
import { useDispatch } from "react-redux";
import {
  updateGroup,
  leaveGroup,
  getAllMessageUsers,
} from "../redux/slice/user.slice";

const GroupProfile = ({
  selectedChat,
  setIsGroupModalOpen,
  setIsModalOpen,
  setGroupUsers,
  allUsers,
  userId,
  socket,
  IMG_URL,
}) => {
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUserName, setEditedUserName] = useState("");
  const [groupPhoto, setGroupPhoto] = useState(null);

  const handlePhotoChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setGroupPhoto(file);
      try {
        await dispatch(
          updateGroup({
            groupId: selectedChat._id,
            photo: file,
          })
        );
        socket.emit("update-group", {
          groupId: selectedChat._id,
          members: selectedChat?.members.filter((id) => id !== userId),
        });
        await dispatch(getAllMessageUsers());
      } catch (error) {
        console.error("Failed to update group photo:", error);
      }
    }
  };

  const handleUserNameUpdate = () => {
    dispatch(
      updateGroup({
        groupId: selectedChat._id,
        userName: editedUserName,
        members: selectedChat?.members,
      })
    );
    socket.emit("update-group", {
      groupId: selectedChat._id,
      members: selectedChat?.members.filter((id) => id !== userId),
    });
    dispatch(getAllMessageUsers());
    setIsEditing(false);
  };

  const handleLeaveGroup = () => {
    dispatch(leaveGroup({ groupId: selectedChat._id, userId: userId }));
    socket.emit("update-group", {
      groupId: selectedChat._id,
      members: selectedChat?.members.filter((id) => id !== userId),
    });
    dispatch(getAllMessageUsers());
    setIsGroupModalOpen(false);
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

  return (
    <div className="bg-white dark:bg-primary-dark dark:text-primary-light h-full">
      <div className="flex justify-between items-center pb-2 p-4">
        <h2 className="text-lg font-bold">Group Info</h2>
        <button
          onClick={() => setIsGroupModalOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <ImCross />
        </button>
      </div>
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24 rounded-full bg-gray-300 overflow-hidden mt-4">
          {selectedChat?.photo && selectedChat.photo !== "null" ? (
            <img
              src={`${IMG_URL}${selectedChat?.photo}`}
              alt="Profile"
              className="cursor-pointer object-cover w-full h-full rounded-full"
              onClick={() => document.getElementById("fileInput").click()}
            />
          ) : (
            <div className="text-gray-900 text-lg font-bold flex w-24 h-24 justify-center items-center">
              {selectedChat?.userName
                .split(" ")
                .map((n) => n[0].toUpperCase())
                .join("")}
            </div>
          )}

          <input
            type="file"
            id="fileInput"
            className="hidden"
            accept="image/*"
            onChange={handlePhotoChange}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity duration-200">
            <MdOutlineModeEdit
              className="text-white text-4xl cursor-pointer"
              onClick={() => document.getElementById("fileInput").click()}
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          {isEditing ? (
            <input
              type="text"
              value={editedUserName}
              onChange={(e) => setEditedUserName(e.target.value)}
              onBlur={handleUserNameUpdate}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleUserNameUpdate();
                }
              }}
              className="mt-2 text-xl font-semibold bg-transparent border-none outline-none text-center"
              autoFocus
            />
          ) : (
            <>
              <h3
                className="mt-2 text-xl font-semibold cursor-pointer"
                onClick={() => {
                  setIsEditing(true);
                  setEditedUserName(selectedChat?.userName);
                }}
              >
                {selectedChat?.userName}
              </h3>
              <MdOutlineModeEdit
                className="cursor-pointer"
                onClick={() => {
                  setIsEditing(true);
                  setEditedUserName(selectedChat?.userName);
                }}
              />
            </>
          )}
        </div>
        <div className="text-gray-500 mt-1">
          Created by{" "}
          {allUsers?.find((user) => user._id == selectedChat?.createdBy)
            ?.userName || "Unknown User"}
        </div>
      </div>
      <div className="mt-4 p-4">
        <div className="flex items-center justify-between p-2 border-b border-gray-400 dark:border-primary-light/20">
          <span className="text-gray-600 dark:text-primary-light/80 font-bold">
            Participants
          </span>
          <span className="text-gray-800 dark:text-primary-light/80">
            {selectedChat?.members?.length}
          </span>
        </div>

        <div className="flex flex-col h-[calc(100vh-360px)] overflow-y-auto modal_scroll">
          <div
            className="flex items-center p-2 cursor-pointer"
            onClick={() => {
              setGroupUsers(selectedChat?.members);
              setIsGroupModalOpen(false);
              setIsModalOpen(true);
            }}
          >
            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-primary-light/20 flex items-center justify-center mr-2 font-bold">
              +
            </div>
            <span className="text-gray-800 dark:text-primary-light/80 font-bold">
              Add participants
            </span>
          </div>
          {selectedChat?.members.map((member, index) => {
            const user = allUsers.find((user) => user._id === member);
            return (
              <div key={index} className="flex items-center p-2 group">
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
                  className="ml-auto text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs border border-red-500 rounded-full px-2 py-1"
                  onClick={() => handleRemoveMember(user._id)}
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between p-2">
          <span
            className="text-red-600 font-bold cursor-pointer"
            onClick={handleLeaveGroup}
          >
            Leave Group
          </span>
        </div>
      </div>
    </div>
  );
};

export default GroupProfile;
