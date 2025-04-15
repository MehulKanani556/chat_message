import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { VscCallIncoming, VscCallOutgoing } from 'react-icons/vsc';
import { IoCallOutline } from 'react-icons/io5';
import { format } from 'date-fns';

const CallHistory = ({ setSelectedChat, setShowLeftSidebar, IMG_URL }) => {
  const [callHistory, setCallHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = useSelector((state) => state.user.user);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchCallHistory = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const response = await axios.get('http://localhost:4000/api/call-history', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setCallHistory(response.data);
      } catch (error) {
        console.error('Error fetching call history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCallHistory();
  }, []);

  const handleCallClick = (userId) => {
    setSelectedChat({ _id: userId });
    setShowLeftSidebar(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">Call History</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {callHistory.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No call history
          </div>
        ) : (
          callHistory.map((call) => {
            const isOutgoing = call.senderId === currentUser._id;
            const otherUser = call.user;

            return (
              <div
                key={call._id}
                className="flex items-center p-4 hover:bg-gray-100 cursor-pointer border-b"
                onClick={() => handleCallClick(otherUser._id)}
              >
                <div className="relative">
                  <img
                    src={otherUser.photo ? `${IMG_URL}/${otherUser.photo}` : '/default-avatar.png'}
                    alt={otherUser.userName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1">
                    {isOutgoing ? (
                      <VscCallOutgoing className="text-green-500" />
                    ) : (
                      <VscCallIncoming className={call.status === 'missed' ? 'text-red-500' : 'text-green-500'} />
                    )}
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">{otherUser.userName}</h3>
                    <span className="text-sm text-gray-500">
                      {format(new Date(call.timestamp), 'HH:mm')}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <span>
                      {isOutgoing ? 'Outgoing' : call.status === 'missed' ? 'Missed' : 'Incoming'} call
                    </span>
                    {call.duration && (
                      <span className="ml-2">• {call.duration}</span>
                    )}
                  </div>
                </div>
                <button
                  className="ml-4 p-2 rounded-full hover:bg-gray-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCallClick(otherUser._id);
                  }}
                >
                  <IoCallOutline className="w-5 h-5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CallHistory; 