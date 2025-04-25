import React from 'react';
import { IoPersonCircleOutline } from "react-icons/io5";
import { MdCallEnd } from "react-icons/md";
import { IMG_URL } from '../utils/baseUrl';

const IncomingCall = ({ incomingCall, allUsers, groups, rejectVideoCall, acceptVideoCall, acceptVoiceCall }) => {
  
   let user;
    if(incomingCall.groupId){
        user =  groups?.find((user) => user._id === incomingCall.groupId)
    }else{
        user =  allUsers?.find((user) => user._id === incomingCall.fromEmail)
    }
 
    return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-white/15 flex items-center justify-center z-[9999]">
      <div className="bg-black rounded-lg p-6 w-96 text-center">
        <h3 className="text-2xl text-white">
          {
           user?.userName
          }
        </h3>
        <p className="text-gray-400 mb-4 animate-pulse">
          is Calling You.
        </p>
        <div className="w-20 h-20 mx-auto mb-10 rounded-full overflow-hidden">
          {(user?.photo)  &&
            ( user?.photo !== "null") ? (
            <img
              src={`${IMG_URL}${(user?.photo)?.replace(/\\/g, "/")}`}
              alt="Caller"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-gray-300 grid place-content-center">
              <IoPersonCircleOutline className="text-4xl" />
            </div>
          )}
        </div>
        <div className="flex justify-center gap-8">
          <button
            onClick={() => rejectVideoCall(incomingCall.type)}
            className="w-[40%] h-10 bg-[#FF0000] text-white rounded-md flex items-center justify-center hover:bg-red-600"
          >
            <MdCallEnd className="text-xl" />
            Decline
          </button>
          <button
            onClick={
              incomingCall.type === "video"
                ? acceptVideoCall
                : acceptVoiceCall
            }
            className="w-[40%] h-10 bg-[#22C55E] text-white rounded-md flex items-center justify-center hover:bg-[#22C55E85] animate-bounce"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCall;