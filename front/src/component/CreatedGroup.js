import React, { useState, useEffect } from "react";
import { ImCross } from "react-icons/im";
import { MdOutlineModeEdit } from "react-icons/md";
import { IMG_URL } from "../utils/baseUrl"; // Assuming IMG_URL is needed here
import { createGroup, getAllMessageUsers } from "../redux/slice/user.slice";
import { useDispatch } from "react-redux";
import { RiUserAddLine } from "react-icons/ri";
import { FaChevronRight } from "react-icons/fa";
import { setIsGroupCreateModalOpen, setIsModalOpen } from "../redux/slice/manageState.slice";
const CreatedGroup = ({
  isOpen,
  allUsers,
  currentUser,
  onCreateGroup,
  socket,
  creatGroup,
  setCreatGroup,
  groupUsers,
  setGroupUsers
}) => {
  const dispatch = useDispatch();
  const [groupName, setGroupName] = useState("");
  const [groupBio, setGroupBio] = useState("");
  // const [groupUsers, setGroupUsers] = useState([]);
  const [groupPhoto, setGroupPhoto] = useState(null);

  console.log(creatGroup, groupUsers);
  // Reset state when modal is closed/opened
  useEffect(() => {
    if (!isOpen) {
      setGroupName("");
      setGroupBio("");
      setGroupUsers([]);
      setGroupPhoto(null);
    }
  }, [isOpen]);

  const handleCreateClick = () => {
    // Pass the data up to the parent component
    onCreateGroup({
      userName: groupName || "Group", // Default name if empty
      photo: groupPhoto,
      bio: groupBio,
      members: [...groupUsers, currentUser], // Add current user as member
    });
    dispatch(setIsGroupCreateModalOpen(false));
  };

  const handleCreateGroup = async () => {
    const data = {
      userName: groupName,
      members: [...groupUsers, currentUser],
      createdBy: currentUser,
      photo: groupPhoto,
      bio: groupBio,
    };
    try {
      await dispatch(createGroup({ groupData: data, socket }));
      setGroupUsers([]);
      setGroupPhoto(null);
      setGroupName("");
      setGroupBio("");
      dispatch(setIsGroupCreateModalOpen(false));
      dispatch(getAllMessageUsers());
    } catch (error) {
      // Handle any errors that occur during group creation
      console.error("Error creating group:", error);
      // Optionally show error to user via toast/alert
    }
  };

  return (
    <div
      className="w-full  bg-primary-dark/5 dark:bg-primary-dark/90 dark:text-primary-light h-full relative"
      style={{
        boxShadow: "inset 0 0 5px 0 rgba(0, 0, 0, 0.1)",
      }}
    >
      <div className="flex justify-between items-center p-4 py-6">
        <h2 className="text-lg font-bold dark:text-primary-light">
          Create Group
        </h2>
        <button onClick={() => dispatch(setIsGroupCreateModalOpen(false))} className="text-gray-500 hover:text-gray-700">
          <ImCross />
        </button>
      </div>
      <div className="sm:block flex-1 h-[1px] bg-gradient-to-r from-gray-300/30 via-gray-300 to-gray-300/30 dark:bg-gradient-to-l dark:from-white/5 dark:via-white/30 dark:to-white/5 max-w-[100%] mx-auto" />

      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24 rounded-full bg-gray-300  mt-4 group">
          <img
            src={
              groupPhoto
                ? URL.createObjectURL(groupPhoto)
                : require("../img/grouplogo.jpg") // Make sure this path is correct relative to this file or use a placeholder
            }
            alt="Group Profile"
            className="cursor-pointer object-cover w-full h-full rounded-full"
          // onClick={() => document.getElementById("groupFileInput").click()}
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
          <div
            onClick={() => document.getElementById("groupFileInput").click()}
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
          <input
            type="text"
            placeholder="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="mt-2 text-xl font-semibold bg-transparent border-none dark:text-primary-light outline-none text-center disabled"
            disabled
          />
        </div>
      </div>
      <div className="p-4 space-y-3">
        <label className="py-2 text-md">Group Name</label>
        <input
          type="text"
          placeholder="Group Name"
          className="w-full py-2 pl-2 pr-4 bg-[#E0E5EB] rounded-md text-gray-600 dark:text-white dark:bg-white/10  focus:outline-none"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />

        <label className="py-2 text-md">About </label>
        <textarea
          type="text"
          placeholder="About"
          className="w-full py-2 pl-2 pr-4 bg-[#E0E5EB] rounded-md text-gray-600 dark:text-white dark:bg-white/10  focus:outline-none"
          value={groupBio}
          onChange={(e) => setGroupBio(e.target.value)}
        />


        <div className=" max-w-md bg-[#F9FAFA] flex dark:bg-primary-dark  rounded-lg p-3 my-3">
          <button
            className="w-full flex justify-between items-center"
            onClick={() => {
              // setGroupUsers(selectedChat?.members);
              setCreatGroup(true);
              dispatch(setIsGroupCreateModalOpen(false));
              dispatch(setIsModalOpen(true));
            }}
          >
            <div className="flex items-center space-x-2">
              <RiUserAddLine size={18} />
              <span className="font-medium">Add Memebers</span>
            </div>
            <FaChevronRight size={12} />
          </button>
        </div>
      </div>
      <div className="mt-4 p-4">
        {/* <div className="flex items-center justify-between p-2 border-b border-gray-400">
          <span className="text-gray-600 font-bold dark:text-primary-light">
            Participants
          </span>
         
          <span className="text-gray-800 dark:text-primary-light">
            {groupUsers.length + 1}
          </span>
        </div> */}
        {/* <div className="flex flex-col h-[calc(100vh-360px)] overflow-y-auto cursor-pointer scrollbar-hide">
          {allUsers
            .filter((user) => user._id !== currentUser) // Exclude current user from list
            .map((user, index) => {
              const isChecked = groupUsers.includes(user._id);
              console.log(allUsers);
              
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
                          {user?.userName
                            .split(" ")
                            .map((n) => n[0].toUpperCase())
                            .join("")}
                        </span>
                      )}
                    </div>
                    <span className="text-gray-900 dark:text-primary-light/70">
                      {user?.userName}
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
        </div> */}
        <div className="fixed bottom-8  mt-4 flex justify-center max-w-[350px] w-full">
          <button
            onClick={handleCreateGroup}
            disabled={!groupName && groupUsers.length === 0} // Optional: Disable button if no name and no users selected
            className="bg-primary w-full text-white px-4 py-1 rounded-md hover:bg-primary/70 disabled:opacity-50"
          >
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatedGroup;
