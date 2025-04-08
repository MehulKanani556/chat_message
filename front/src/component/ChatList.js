import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserProfile from './Profile';

const ChatList = () => {
  const navigate = useNavigate();
  const [selectedProfile, setSelectedProfile] = useState(null);
  
  // Add event listener for the custom event
  useEffect(() => {
    const handleShowProfile = (event) => {
      const { userId } = event.detail;
      console.log('Profile event received:', userId);
      setSelectedProfile(userId);
    };

    window.addEventListener('showProfile', handleShowProfile);
    
    return () => {
      window.removeEventListener('showProfile', handleShowProfile);
    };
  }, []);
  
  // Sample data
  const quickAccessUsers = [
    { id: 1, name: 'Patrick', online: true, avatar: '/avatars/patrick.jpg' },
    { id: 2, name: 'Doris', online: true, avatar: '/avatars/doris.jpg' },
    { id: 3, name: 'Emily', online: true, avatar: '/avatars/emily.jpg' },
    { id: 4, name: 'Steve', online: true, avatar: '/avatars/steve.jpg' },
  ];

  const recentChats = [
    { 
      id: 1, 
      name: 'Patrick Hendricks', 
      message: "hey! there I'm available", 
      time: '02:50 PM', 
      avatar: '/avatars/patrick.jpg',
      online: true,
      unread: 0
    },
    { 
      id: 2, 
      name: 'Mark Messer', 
      message: 'Images', 
      time: '10:30 AM', 
      avatar: '/avatars/mark.jpg',
      online: false,
      unread: 2,
      hasAttachment: true
    },
    { 
      id: 3, 
      name: 'General', 
      message: 'This theme is Awesome!', 
      time: '2:06 min', 
      avatar: null,
      initial: 'G',
      online: false,
      unread: 0
    },
    { 
      id: 4, 
      name: 'Doris Brown', 
      message: 'typing •••', 
      time: '10:05 PM', 
      avatar: '/avatars/doris.jpg',
      online: true,
      typing: true,
      unread: 0
    },
    { 
      id: 5, 
      name: 'Designer', 
      message: 'Next meeting tomorrow 10.00AM', 
      time: '2:10 min', 
      avatar: null,
      initial: 'D',
      online: false,
      unread: 1
    },
    { 
      id: 6, 
      name: 'Steve Walker', 
      message: 'Admin-A-zip', 
      time: '01:16 PM', 
      avatar: '/avatars/steve.jpg',
      online: true,
      unread: 0
    },
    { 
      id: 7, 
      name: 'Albert Rodarte', 
      message: 'typing •••', 
      time: '01:05 PM', 
      avatar: null,
      initial: 'A',
      online: true,
      typing: true,
      unread: 0
    },
    { 
      id: 8, 
      name: 'Mirta George', 
      message: 'Yeah, Everything is fine👍', 
      time: '02:50 min', 
      avatar: null,
      initial: 'M',
      online: true,
      unread: 0
    },
    {
      id: 9,
      name: 'Mirta George',
      message: 'Yeah, Everything is fine👍',
      time: '02:50 min',
      avatar: null,
      initial: 'M',
      online: true,
      unread: 0
    },
    {
      id: 10,
      name: 'Mirta George',
      message: 'Yeah, Everything is fine👍',
      time: '02:50 min',
      avatar: null,
      initial: 'M',
      online: true,
      unread: 0
    },
    {
      id: 11,
      name: 'Mirta George',
      message: 'Yeah, Everything is fine👍',
      time: '02:50 min',
      avatar: null,
      initial: 'M',
      online: true,
      unread: 0
    },
    {
      id: 12,
      name: 'Mirta George',
      message: 'Yeah, Everything is fine👍',
      time: '02:50 min',
      avatar: null,
      initial: 'M',
      online: true,
      unread: 0
    },
    {
      id: 13,
      name: 'Mirta George',
      message: 'Yeah, Everything is fine👍',
      time: '02:50 min',
      avatar: null,
      initial: 'M',
      online: true,
      unread: 0
    },
  ];

  const handleProfileClick = (userId) => {
    setSelectedProfile(userId);
  };

  const handleBackFromProfile = () => {
    console.log('Back from profile clicked');
    setSelectedProfile(null);
  };

  return (
    <div className="w-[380px] bg-[#F5F7FB] rounded-lg shadow-sm">
      {selectedProfile ? (
        <div className="h-full">
          <div className="p-4 pb-2 flex items-center">
            <button 
              onClick={handleBackFromProfile}
              className="mr-4 p-2 rounded-full hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-800">Profile</h1>
          </div>
          <UserProfile userId={selectedProfile} onBack={handleBackFromProfile} />
        </div>
      ) : (
        <>
          <div className="p-4 pb-2">
            <h1 className="text-lg font-semibold text-gray-800 mb-4">Chats</h1>
            
            {/* Search bar */}
            <div className="relative mb-4">
              <input 
                type="text" 
                placeholder="Search messages or users" 
                className="w-full py-2 pl-10 pr-4 bg-gray-100 rounded-lg text-gray-600 focus:outline-none"
              />
              <svg 
                className="absolute left-3 top-2.5 text-gray-400" 
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
            
            {/* Quick access contacts */}
            {/* <div className="flex justify-between mb-6">
              {quickAccessUsers.map(user => (
                <div key={user.id} className="flex flex-col items-center">
                  <div className="relative">
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {user.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <span className="text-xs text-gray-600 mt-1">{user.name}</span>
                </div>
              ))}
            </div> */}
            
            <div className="text-gray-700 font-medium">Recent</div>
          </div>
          
          {/* Chat list - scrollable area */}
          <div className="overflow-y-auto max-h-[calc(100vh-140px)]">
            {recentChats.map(chat => (
              <div key={chat.id} className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center">
                  <div 
                    className="relative mr-3 cursor-pointer"
                    onClick={() => handleProfileClick(chat.id)}
                  >
                    {chat.avatar ? (
                      <img 
                        src={chat.avatar} 
                        alt={chat.name} 
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                        {chat.initial}
                      </div>
                    )}
                    {chat.online && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-800">{chat.name}</span>
                      <span className="text-xs text-gray-500">{chat.time}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500 truncate max-w-[200px]">
                        {chat.hasAttachment && (
                          <span className="mr-1">🖼️</span>
                        )}
                        <span className={chat.typing ? "text-purple-500" : ""}>{chat.message}</span>
                      </div>
                      
                      {chat.unread > 0 && (
                        <div className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                          {chat.unread < 10 ? `0${chat.unread}` : chat.unread}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ChatList;