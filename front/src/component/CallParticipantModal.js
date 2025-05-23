import React, { memo, useState } from 'react';
import { RxCross2 } from 'react-icons/rx';
import { RiUserAddLine } from 'react-icons/ri';
import { IoIosArrowForward } from 'react-icons/io';
import { AiOutlineAudioMuted } from 'react-icons/ai';
import { FaRegBell } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { IMG_URL } from '../utils/baseUrl';

const CallParticipantModal = memo(({
  participantOpen,
  setParticipantOpen,
  inviteToCall,
}) => {
    const [searchInput, setSearchInput] = useState("");
    const [invitedUsers, setInvitedUsers] = useState([]);
    const [selectedCallUsers, setSelectedCallUsers] = useState(new Set());
    const [showFirstSection, setShowFirstSection] = useState(false);
    const { user,allUsers } = useSelector((state) => state.user);
    const [userId] = useState(sessionStorage.getItem("userId"));
    const {remoteStreams,participants,callParticipantsList,callParticipants} = useSelector(state => state.magageState)
  return (
    <>
      {participantOpen && (
        <div className="fixed inset-0 bg-opacity-50 z-50">
          {/* First Section */}
          {showFirstSection && (
            <div className="absolute right-0 top-0 h-full w-96 bg-primary-light dark:bg-primary-dark/90 dark:text-white shadow-lg transition-transform duration-300 ease-in-out">
              <div className="w-full bg-primary-dark/5 dark:bg-primary-dark/90 dark:text-primary-light h-full" style={{ boxShadow: "inset 0 0 5px 0 rgba(0, 0, 0, 0.1)" }}>
                <div className="flex justify-between items-center p-4 py-6">
                  <h2 className="text-lg font-bold">Add Members</h2>
                  <button
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => {
                      setParticipantOpen(false);
                      setSelectedCallUsers(new Set());
                    }}
                  >
                    <RxCross2 className="w-6 h-6" />
                  </button>
                </div>
                <div className="sm:block flex-1 h-[1px] bg-gradient-to-r from-gray-300/30 via-gray-300 to-gray-300/30 dark:bg-gradient-to-l dark:from-white/5 dark:via-white/30 dark:to-white/5 max-w-[100%] mx-auto" />

                {/* Search bar */}
                <div className="relative p-4">
                  <input
                    type="text"
                    placeholder="Search users"
                    className="w-full py-2 pl-10 pr-4 bg-[#E0E5EB] rounded-md text-gray-600 dark:text-white dark:bg-white/10 focus:outline-none"
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
                  {allUsers?.filter(user => (user?.userName || '').toLowerCase().includes(searchInput.toLowerCase()))
                      .filter(
                        (user) =>
                          !callParticipants.has(user._id) && user._id !== userId
                      )
                      .map((user) => (
                        <div
                          key={user._id}
                          className="flex items-center p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-primary-light/10 rounded-md bg-primary-dark/80 mb-2"
                          onClick={() => {
                            const newSelectedUsers = new Set(selectedCallUsers);
                            if (newSelectedUsers.has(user._id)) {
                              newSelectedUsers.delete(user._id);
                            } else {
                              newSelectedUsers.add(user._id);
                            }
                            setSelectedCallUsers(newSelectedUsers);
                          }}
                        >
                          <div
                            className={`w-5 h-5 rounded border mr-3 ${
                              selectedCallUsers.has(user._id)
                                ? "bg-primary border-primary"
                                : "border-gray-400"
                            }`}
                          >
                            {selectedCallUsers.has(user._id) && (
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
                          <div className="flex-1">
                            <h3 className="text-gray-800 dark:text-primary-light/80 font-semibold">
                              {user.userName}
                            </h3>
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className="mt-4 flex justify-center w-full">
                    {participants.length < 12 && (
                      <button
                        className="cursor-pointer px-4 py-2 w-full bg-primary text-white rounded-md hover:bg-primary/50 transition-colors"
                        onClick={() => {
                          const invited = allUsers.filter(user => selectedCallUsers.has(user._id));
                          setInvitedUsers(invited);
                          selectedCallUsers.forEach(userId => {
                            inviteToCall(userId);
                          });
                          setSelectedCallUsers(new Set());
                          setShowFirstSection(false);
                        }}
                        disabled={selectedCallUsers.size === 0}
                      >
                        Add Members
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Second Section */}
          {!showFirstSection && (
            <div className="absolute right-0 top-0 h-full w-96 bg-primary-light dark:text-white shadow-lg transition-transform duration-300 ease-in-out">
              <div className="w-full bg-primary-dark/5 dark:bg-primary-dark/95 dark:text-primary-light h-full" style={{ boxShadow: "inset 0 0 5px 0 rgba(0, 0, 0, 0.1)" }}>
                <div className="flex justify-between items-center p-4 py-6">
                  <h2 className="text-lg font-bold">Add Members</h2>
                  <button
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => {
                      setParticipantOpen(false);
                      setSelectedCallUsers(new Set());
                    }}
                  >
                    <RxCross2 className="w-6 h-6" />
                  </button>
                </div>
                <div className="sm:block flex-1 h-[1px] bg-gradient-to-r from-gray-300/30 via-gray-300 to-gray-300/30 dark:bg-gradient-to-l dark:from-white/5 dark:via-white/30 dark:to-white/5 max-w-[100%] mx-auto" />

                <div className="relative p-4">
                  <button
                    className="bg-black flex items-center justify-between w-full py-2 text-white rounded-md transition-colors"
                    onClick={() => setShowFirstSection(true)}
                  >
                    <span className="flex items-center">
                      <RiUserAddLine className="mr-2 ml-4" />
                      Add Members
                    </span>
                    <IoIosArrowForward className="mr-4" />
                  </button>
                </div>


                <div className="text-gray-700 font-medium dark:text-primary-light flex items-center gap-2 px-4">
                  joined
                </div>
                <div className="p-4">
                  <div className="flex flex-col overflow-y-auto modal_scroll">
                    {callParticipantsList?.joined?.map((uID)=>{
                        const user = allUsers.find((v)=>v._id == uID)
                        return(
                        <div key={user._id} className="flex items-center p-2 cursor-pointer hover:bg-gray-100 rounded-md dark:bg-primary-dark/80 mb-2">
                            <div className="w-9 h-9 rounded-full mr-3 bg-gray-300 overflow-hidden flex items-center justify-center border-[1px] border-gray-400">
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
                                <div className="flex-1">
                                  <h3 className="text-gray-800 dark:text-primary-light/80 font-semibold">
                                    {user.userName}
                                  </h3>
                                </div>
                              <AiOutlineAudioMuted className="h-6 w-6" />
                        </div>
                            )
                    })}
                  </div>
                </div>

                <div className="text-gray-700 font-medium dark:text-primary-light flex items-center gap-2 px-4">
                  invited
                </div>

                <div className="p-4">
                  <div className="flex flex-col overflow-y-auto modal_scroll">
                    {callParticipantsList?.invited?.map(uId => {
                         const user = allUsers.find((v)=>v._id == uId)
                        return(
                            <div
                            key={user._id}
                            className="flex items-center p-2 cursor-pointer hover:bg-gray-100 rounded-md dark:bg-primary-dark/80 mb-2"
                          >
                            <div className="w-9 h-9 rounded-full mr-3 bg-gray-300 overflow-hidden flex items-center justify-center border-[1px] border-gray-400">
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
                            <div className="flex-1">
                              <h3 className="text-gray-800 dark:text-primary-light/80 font-semibold">
                                {user.userName}
                              </h3>
                            </div>
                            {!callParticipantsList?.ringing.includes(uId) ? (
                              <FaRegBell className="h-6 w-6" />
                            ) : (
                              <div className="flex items-center justify-center gap-1 h-6 w-8 cursor-pointer">
                                {Array.from({ length: 7 }).map((_, i) => (
                                  <div
                                    key={i}
                                    className="w-2 bg-primary rounded-full transform transition-all duration-300 ease-in-out animate-callwaveform"
                                    style={{
                                      animationDelay: `${i * 0.1}s`,
                                    }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )
                    } 
                    
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
});

export default CallParticipantModal;