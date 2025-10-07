import React, { useState, useEffect, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllGroups } from '../redux/slice/user.slice';
import { IMG_URL } from '../utils/baseUrl';
import { FaUserPlus } from 'react-icons/fa';
import { setIsGroupCreateModalOpen, setIsGroupModalOpen, setSelectedChat, setShowLeftSidebar } from '../redux/slice/manageState.slice';

const Groups = memo(() => {

  const dispatch = useDispatch();
  const [searchInput, setSearchInput] = useState('');
  const { groups, loading } = useSelector((state) => state.user);
  const currentUser = useSelector((state) => state.user.user?._id);

  useEffect(() => {
    dispatch(getAllGroups());
  }, [dispatch]);

  const filteredGroups = groups.filter(group =>
    group.userName.toLowerCase().includes(searchInput.toLowerCase()) &&
    group.members?.includes(currentUser)
  );

  const handleGroupClick = (group) => {
    if (group.members?.includes(currentUser)) {
      const event = new CustomEvent('showChatList', {
      });
      window.dispatchEvent(event);
      dispatch(setSelectedChat(group));
      dispatch(setShowLeftSidebar(false));
    } else {
      alert("You are not a member of this group");
    }
  };
  return (
    <div className="w-full bg-primary-dark/5 dark:bg-primary-dark/90 h-full relative"
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
            onClick={() => {
              dispatch(setIsGroupModalOpen(false));
              dispatch(setIsGroupCreateModalOpen(true));
              dispatch(setShowLeftSidebar(false));
            }}
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
});

export default Groups; 