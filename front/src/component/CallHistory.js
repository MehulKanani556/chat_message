import React, { useState, useEffect, } from 'react';
import { BASE_URL, IMG_URL } from "../utils/baseUrl";
import { BsArrowLeft, BsTelephone, BsTelephoneX, BsTelephoneFill } from 'react-icons/bs';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { getAllCallUsers } from '../redux/slice/user.slice';
import { FaChevronLeft } from 'react-icons/fa';

const CallHistory = ({ setShowLeftSidebar }) => {
  const [callHistory, setCallHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMissedCallsOnly, setShowMissedCallsOnly] = useState(false);
  const userId = sessionStorage.getItem("userId");
  const token = sessionStorage.getItem("token");
  const dispatch = useDispatch();
  const { allUsers, messages, allMessageUsers, groups, user, allCallUsers } =
    useSelector((state) => state.user);

  useEffect(() => {
    dispatch(getAllCallUsers());
  }, []);

  // Filter calls based on the showMissedCallsOnly state
  const filteredCalls = showMissedCallsOnly 
    ? allCallUsers.filter(call => {
        // Check if the call has messages and the last message is a missed call
        if (call.messages && call.messages.length > 0) {
          const lastMessage = call.messages[call.messages.length - 1];
          return lastMessage.content.type === "call" && lastMessage.content.status === "missed";
        }
        return false;
      })
    : allCallUsers;

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      return dateString;
    }
  };

  // Toggle between showing all calls and missed calls only
  const toggleMissedCallsFilter = () => {
    setShowMissedCallsOnly(!showMissedCallsOnly);
  };

  // Determine if a call was returned (has a message after a missed call)
  const isCallReturned = (call) => {
    if (!call.messages || call.messages.length < 2) return false;
    
    // Check if there's a missed call followed by an ended call
    for (let i = 0; i < call.messages.length - 1; i++) {
      const currentMsg = call.messages[i];
      const nextMsg = call.messages[i + 1];
      
      if (currentMsg.content.type === "call" && 
          currentMsg.content.status === "missed" &&
          nextMsg.content.type === "call" &&
          nextMsg.content.status === "ended") {
        return true;
      }
    }
    
    return false;
  };

  return (
    <div className="w-full bg-primary-dark/5 dark:bg-primary-dark/90 h-full  relative"
    style={{
      boxShadow: "inset 0 0 5px 0 rgba(0, 0, 0, 0.1)"
    }}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          {/* <button
            onClick={() =>{
              setShowLeftSidebar(false);
            }}
            className="mr-4 text-gray-600 dark:text-gray-300 md600:hidden"
          >
            <FaChevronLeft  size={16}/>
          </button> */}
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Call History</h2>
        </div>
        <button 
          onClick={toggleMissedCallsFilter}
          className={`px-3 py-1 rounded-full text-sm ${
            showMissedCallsOnly 
              ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200' 
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          {showMissedCallsOnly ? 'Show All Calls' : 'Missed Calls Only'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredCalls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <BsTelephone size={40} className="mb-2" />
            <p>{showMissedCallsOnly ? 'No missed calls' : 'No call history available'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCalls.map((call, index) => {
              // Get the last call message
              const lastCallMessage = call.messages && call.messages.length > 0 
                ? call.messages[call.messages.length - 1] 
                : null;
              
              // Determine call type and status
              let callType = 'unknown';
              let callStatus = 'unknown';
              let isReturned = false;
              
              if (lastCallMessage && lastCallMessage.content.type === "call") {
                callType = lastCallMessage.content.callType;
                callStatus = lastCallMessage.content.status;
                isReturned = isCallReturned(call);
              }
              
              return (
                <div
                  key={index}
                  className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary-light dark:bg-primary-dark flex items-center justify-center mr-3">
                    {call.photo ? (
                      <img
                        src={`${IMG_URL}${call.photo.replace(/\\/g, "/")}`}
                        alt={call.userName}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                        {call?.userName && call?.userName.includes(" ")
                          ? call?.userName.split(" ")[0][0].toUpperCase() +
                          call?.userName.split(" ")[1][0].toUpperCase()
                          : call?.userName[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-medium text-gray-800 dark:text-gray-200">
                        {call.userName || 'Unknown Contact'}
                      </h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {lastCallMessage ? formatDate(lastCallMessage.content.timestamp) : ''}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      {isReturned ? (
                        <BsTelephoneFill className="mr-1 text-green-500" />
                      ) : callStatus === 'missed' ? (
                        <BsTelephoneX className="mr-1 text-red-500" />
                      ) : callType === 'incoming' ? (
                        <BsTelephone className="mr-1 text-green-500" />
                      ) : (
                        <BsTelephone className="mr-1 text-blue-500" />
                      )}
                      <span>
                        {isReturned ? 'Returned call' :
                          callStatus === 'missed' ? 'Missed call' :
                          callType === 'incoming' ? 'Incoming call' : 'Outgoing call'}
                      </span>
                      {lastCallMessage && lastCallMessage.content.duration && (
                        <span className="ml-2">({lastCallMessage.content.duration})</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CallHistory; 