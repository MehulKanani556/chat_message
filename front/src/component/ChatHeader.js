import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// import { IoMdSearch, IoVideocamOutline, IoCallOutline, IoArchiveOutline, IoVolumeOffOutline } from "react-icons/io5";
import { BsThreeDotsVertical } from "react-icons/bs";
import { LuScreenShare, LuScreenShareOff } from "react-icons/lu";
import { SlPin } from "react-icons/sl";
import { RiUserAddLine, RiDeleteBinLine } from "react-icons/ri";
import { MdOutlineCancel, MdOutlineBlock, MdOutlineDeleteSweep, MdGroupAdd } from "react-icons/md";
import { GoDeviceCameraVideo } from "react-icons/go";
import { useSocket } from '../context/SocketContext';
import { 
  setShowLeftSidebar, 
  setIsGroupModalOpen, 
  setIsUserProfileModalOpen,
  setIsSearchBoxOpen,
  setIsModalOpen
} from '../redux/slice/manageState.slice';
import { pinChat, muteChat, archiveUser, blockUser, getUser, getAllMessageUsers } from '../redux/slice/user.slice';
import { IMG_URL } from '../utils/baseUrl';
import { IoMdSearch } from 'react-icons/io';
import { IoArchiveOutline, IoCallOutline, IoVideocamOutline, IoVolumeOffOutline } from 'react-icons/io5';

const ChatHeader = memo(({
    handleProfileImageClick,
    setIsClearChatModalOpen,
    setIsDeleteChatModalOpen,
    setGroupUsers,
}) => {

  console.log("header");
  const dispatch = useDispatch();
  const { cleanupConnection, startCall,startSharing } = useSocket();
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);

  const selectedChat = useSelector(state => state.magageState.selectedChat);
  const isSharing = useSelector(state => state.magageState.isSharing);
  const isSearchBoxOpen = useSelector(state => state.magageState.isSearchBoxOpen);
  const onlineUsers = useSelector(state => state.magageState.onlineUsers);

  const user = useSelector(state => state.user.user);
  const currentUser = useMemo(() => sessionStorage.getItem("userId"), []);

  let loginUser = selectedChat._id === currentUser


   //================screen sharing================

   const handleStartScreenShare = async () => {
    // console.log(selectedChat);
    if (selectedChat) {
      const success = await startSharing(selectedChat);
      // console.log(success);
      if (!success) {
        console.error("Failed to start screen sharing");
      }
    }
  };

  // =========================== video call=============================

  const handleMakeCall = async (type) => {
    if (!selectedChat) return;
    if (selectedChat?.members) {
      const success = await startCall(selectedChat._id, true, selectedChat, type);
      // const success = await startCall(selectedChat, type);
      if (!success) {
        console.error("Failed to start screen sharing");
      }
    } else {
      const success = await startCall(selectedChat._id, false, selectedChat, type);
      // const success = await startCall(selectedChat._id,type);
      if (!success) {
        console.error("Failed to start screen sharing");
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if ((menuOpen) && !event.target.closest(".optionMenu")) {
        setMenuOpen(false);
        // setDocModel(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  
  return (
    <div className="flex items-center justify-between p-4 relative dark:bg-[#1A1A1A] bg:primary-light border-b border-gray-200 dark:border-transparent">
      <div className="flex items-center">
        {/* Mobile back button */}
        {window.innerWidth <= 600 && (
          <button
            className="text-gray-600 hover:text-gray-800 mr-2"
            onClick={() => dispatch(setShowLeftSidebar(true))}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}

        {/* Profile Image */}
        <div
          className="w-10 h-10 rounded-full bg-primary overflow-hidden flex items-center justify-center cursor-pointer"
          onClick={() => {
            if (selectedChat?.photo && selectedChat?.photo !== "null") {
              handleProfileImageClick(`${IMG_URL}${selectedChat?.photo.replace(/\\/g,"/")}`);
            }
          }}
        >
          {selectedChat?.photo && selectedChat.photo !== "null" && (selectedChat?.profilePhoto == "Everyone" || selectedChat.isGroup) ? (
            <img
              src={`${IMG_URL}${selectedChat.photo.replace(/\\/g,"/")}`}
              alt="Profile"
              className="object-cover h-full"
            />
          ) : (
            <span className="text-white text-xl font-bold">
              {selectedChat?.userName?.includes(" ")
                ? selectedChat?.userName.split(" ")?.[0][0] + selectedChat?.userName.split(" ")?.[1][0]
                : selectedChat?.userName?.[0]}
            </span>
          )}
        </div>

        {/* User Info */}
        <div
          className="ml-3 cursor-pointer"
          onClick={() => {
            if(!loginUser){
              if (selectedChat?.members) {
                dispatch(setIsGroupModalOpen(true));
              } else {
                dispatch(setIsUserProfileModalOpen(true));
              }
            }
          }}
        >
          <div className="font-medium dark:text-primary-light">
            {selectedChat?.userName || "Select a chat"}
          </div>
          {selectedChat?.members ? (
            <div className="text-sm text-gray-500">
              {selectedChat?.members?.length} participants
            </div>
          ) : (
            <div className={`text-sm ${onlineUsers.includes(selectedChat?._id) ? "text-green-500" : "text-gray-500"}`}>
              {onlineUsers.includes(selectedChat?._id) ? "Online" : "Offline"}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-4">
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-4 dark:text-white">
          <IoMdSearch
            className="w-6 h-6 cursor-pointer"
            onClick={() => dispatch(setIsSearchBoxOpen(!isSearchBoxOpen))}
            title="Find"
          />
          

          {!loginUser ? (

          <>
         { isSharing ? (
            <LuScreenShareOff
              className="w-6 h-6 cursor-pointer text-red-500 hover:text-red-600 animate-bounce"
              onClick={() => cleanupConnection()}
              title="Stop sharing"
            />
          ) : (
            <div className="w-6 h-6 cursor-pointer" onClick={() => handleStartScreenShare()}>
              <LuScreenShare className="w-full h-full" />
            </div>
          )}

          <IoVideocamOutline
            className="w-6 h-6 cursor-pointer"
            onClick={() => handleMakeCall("video")}
            title="Video Call"
          />
          
          <IoCallOutline
            className="w-6 h-6 cursor-pointer"
            onClick={() => handleMakeCall("voice")}
            title="Voice Call"
          />

          <BsThreeDotsVertical
            className="text-2xl cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
            title="More options"
          />
          </>
        ): (     
          <RiDeleteBinLine
          className="w-6 h-6 cursor-pointer"
          onClick={() => { setIsClearChatModalOpen(true)}}
          title="Clear chat"
        />   
        )}

          {/* Desktop Dropdown Menu */}
          {menuOpen && (
           <div className="optionMenu absolute right-5 top-14 bg-white dark:bg-gray-800 shadow-lg rounded-md p-2 z-10 min-w-36">
           <ul>
             <li
               className="py-2 px-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2"
               onClick={async () => {
                 await dispatch(pinChat({ selectedUserId: selectedChat?._id, }));
                 await dispatch(getUser(currentUser));
                 await dispatch(getAllMessageUsers());
               }}
             >
               {console.log(user)}

               <SlPin className="text-lg" />{" "}
               {user.pinChatFor?.includes(selectedChat?._id)
                 ? "UnPin Chat"
                 : "Pin Chat"}
             </li>

             <li className="py-2 px-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2"
               onClick={async () => {
                 await dispatch(muteChat({ selectedUserId: selectedChat?._id, }));
                 await dispatch(getUser(currentUser));
                 await dispatch(getAllMessageUsers());
               }}>
               {/* <GoMute className="text-lg" />  */}
               {user.muteUsers?.includes(selectedChat?._id) ?
                 <>
                   <IoVolumeOffOutline className="text-2xl w-5" />
                   UnMute
                 </>
                 :
                 <>
                   <svg width="19" height="16" viewBox="0 0 19 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <path d="M9.20285 4.59811L13.4544 1.40611C13.5041 1.36989 13.5626 1.34782 13.6239 1.34226C13.6851 1.33669 13.7467 1.34784 13.8021 1.37451C13.8575 1.40118 13.9046 1.44237 13.9384 1.4937C13.9722 1.54504 13.9915 1.60458 13.9942 1.666V8.99627C13.9942 9.173 14.0644 9.3425 14.1894 9.46747C14.3143 9.59245 14.4838 9.66265 14.6606 9.66265C14.8373 9.66265 15.0068 9.59245 15.1318 9.46747C15.2567 9.3425 15.3269 9.173 15.3269 8.99627V1.666C15.3269 1.35661 15.2408 1.05334 15.0781 0.790152C14.9155 0.526969 14.6827 0.31428 14.406 0.175916C14.1293 0.0375526 13.8195 -0.0210183 13.5114 0.00676668C13.2032 0.0345517 12.9089 0.147595 12.6614 0.333229L8.40318 3.53189C8.33317 3.5844 8.27419 3.65018 8.2296 3.72548C8.18502 3.80078 8.1557 3.88413 8.14332 3.97076C8.13095 4.05739 8.13576 4.14561 8.15748 4.23038C8.17919 4.31516 8.2174 4.39482 8.2699 4.46483C8.32241 4.53484 8.38819 4.59382 8.46349 4.63841C8.53879 4.68299 8.62214 4.71231 8.70877 4.72469C8.7954 4.73706 8.88363 4.73226 8.9684 4.71054C9.05317 4.68882 9.13284 4.65062 9.20285 4.59811ZM18.4256 14.8205L1.09957 0.159968C0.965254 0.0450888 0.7908 -0.0117266 0.61459 0.00202033C0.438379 0.0157672 0.274847 0.0989504 0.159968 0.233271C0.0450888 0.367591 -0.0117266 0.542045 0.00202033 0.718255C0.0157672 0.894466 0.0989503 1.058 0.23327 1.17288L4.09165 4.43818C3.85605 4.62435 3.6654 4.86121 3.53389 5.13117C3.40237 5.40112 3.33336 5.69724 3.33197 5.99752V9.99585C3.33197 10.5261 3.5426 11.0346 3.91751 11.4095C4.29243 11.7844 4.80092 11.995 5.33113 11.995H7.77678L12.6614 15.6668C12.9089 15.8524 13.2032 15.9655 13.5114 15.9933C13.8195 16.0211 14.1293 15.9625 14.406 15.8241C14.6827 15.6858 14.9155 15.4731 15.0781 15.2099C15.2408 14.9467 15.3269 14.6434 15.3269 14.334V13.9542L17.5593 15.8401C17.681 15.9409 17.8345 15.9952 17.9925 15.9933C18.1287 15.9933 18.2617 15.9516 18.3735 15.8737C18.4852 15.7959 18.5705 15.6856 18.6177 15.5578C18.6649 15.43 18.6718 15.2908 18.6374 15.159C18.6031 15.0272 18.5292 14.909 18.4256 14.8205ZM13.9942 14.3274C13.9899 14.3873 13.97 14.4452 13.9366 14.4951C13.9032 14.5451 13.8573 14.5855 13.8035 14.6124C13.7497 14.6393 13.6899 14.6518 13.6298 14.6485C13.5698 14.6453 13.5116 14.6265 13.4611 14.5939L8.39652 10.7955C8.28117 10.709 8.14087 10.6622 7.99669 10.6622H5.33113C5.1544 10.6622 4.9849 10.592 4.85993 10.4671C4.73496 10.3421 4.66475 10.1726 4.66475 9.99585V5.99752C4.66098 5.84348 4.71072 5.69289 4.80549 5.57139C4.90026 5.44989 5.0342 5.36499 5.18453 5.33113L13.9942 12.8147V14.3274Z" fill="currentColor" />
                   </svg>
                   Mute
                 </>}
             </li>
             {selectedChat?.members && (
               <li
                 className="py-2 px-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2"
                 onClick={() => {
                   dispatch(setIsModalOpen(true));
                 }}>
                 <RiUserAddLine
                   title="Add to group"
                   data-tooltip="Add to group"
                   data-tooltip-delay="0"
                   data-tooltip-duration="0"
                   className=" cursor-pointer text-lg" />
                 Add Members
               </li>
             )}
             <li
               className="py-2 px-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2"
               onClick={async () => {
                 await dispatch(archiveUser({selectedUserId: selectedChat?._id,}));
                 await dispatch(getUser(currentUser));
               }}
             >
               <IoArchiveOutline className="text-lg" />
               {user.archiveUsers.includes(selectedChat?._id)
                 ? "UnArchive Chat"
                 : "Archive Chat"}
             </li>
             <li
               onClick={() => { setIsClearChatModalOpen(true)}}
               className="py-2 px-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2"
             >
               <MdOutlineCancel className="text-lg" />{" "}
               Clear Chat
             </li>

             <li
               onClick={() => {
                 setIsDeleteChatModalOpen(true);
               }}
               className="py-2 px-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2"
             >
               <RiDeleteBinLine className="text-lg" />{" "}
               Delete Chat
             </li>
             <li
               className="py-2 px-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2 text-red-500"
               onClick={async () => {
                 await dispatch(blockUser({selectedUserId: selectedChat?._id,}));
                 await dispatch(getUser(currentUser));
                 await dispatch(getAllMessageUsers());
               }}
             >
               <MdOutlineBlock className="text-lg text-red-500" />
               {user.blockedUsers?.includes(
                 selectedChat?._id
               )
                 ? "Unblock"
                 : "Block"}
             </li>
           </ul>
         </div>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden relative mobile-menu flex items-center gap-2 dark:text-white">
          <IoMdSearch
            className="w-6 h-6 cursor-pointer"
            onClick={() => dispatch(setIsSearchBoxOpen(!isSearchBoxOpen))}
          />
          
          <BsThreeDotsVertical
            className="w-6 h-6 cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          />

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div
            className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg z-50 dark:bg-gray-800"
            ref={mobileMenuRef}
          >
            <div className="p-2 ">
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-nowrap"
                onClick={() => {
                  setIsClearChatModalOpen(true);
                  setMobileMenuOpen(false);
                }}
              >
                <MdOutlineDeleteSweep className="w-5 h-5 mr-2" />
                <span>Clear Chat</span>
              </button>

              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-nowrap"
                onClick={() => {
                  setIsDeleteChatModalOpen(true);
                  setMobileMenuOpen(false);
                }}
              >
                <RiDeleteBinLine className="w-5 h-5 mr-2" />
                <span>Delete Chat</span>
              </button>

              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-nowrap"
                onClick={() => {
                  handleStartScreenShare();
                  setMobileMenuOpen(false);
                }}
              >
                <LuScreenShare className="w-5 h-5 mr-2" />
                <span>Screen Share</span>
              </button>

              {selectedChat?.members && (
                <button
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-nowrap"
                  onClick={() => {
                    if (selectedChat?.members) {
                      setGroupUsers(
                        selectedChat?.members
                      );
                    } else {
                      setGroupUsers([selectedChat?._id]);
                    }
                    dispatch(setIsModalOpen(true));
                    setMobileMenuOpen(false);
                  }}
                >
                  <MdGroupAdd className="w-5 h-5 mr-2" />
                  <span>Add to Group</span>
                </button>
              )}

              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-nowrap"
                onClick={() => {
                  handleMakeCall("video");
                  setMobileMenuOpen(false);
                }}
              >
                <GoDeviceCameraVideo className="w-5 h-5 mr-2" />
                <span>Video Call</span>
              </button>

              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                onClick={() => {
                  handleMakeCall("voice");
                  setMobileMenuOpen(false);
                }}
              >
                <IoCallOutline className="w-5 h-5 mr-2" />
                <span>Voice Call</span>
              </button>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.handleProfileImageClick === nextProps.handleProfileImageClick &&
    prevProps.setIsClearChatModalOpen === nextProps.setIsClearChatModalOpen &&
    prevProps.setIsDeleteChatModalOpen === nextProps.setIsDeleteChatModalOpen &&
    prevProps.setGroupUsers === nextProps.setGroupUsers
  );
});

export default ChatHeader;