import React, { useState } from "react";
import { ImCross } from "react-icons/im";
import { FaSearch } from "react-icons/fa";
import { IMG_URL } from "../utils/baseUrl";

const ForwardModal = ({ show, onClose, onSubmit, users }) => {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = users.filter((user) =>
    user.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    show && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl w-full max-w-md transform transition-all modal_background border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                Forward Message
              </h2>
              <button
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                onClick={onClose}
              >
                <ImCross className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Search Box */}
            <div className="mt-4 relative">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                         text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
              <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            </div>
          </div>

          {/* User List */}
          <div className="max-h-[300px] overflow-y-auto p-4 space-y-2 modal_scroll flex flex-col">
            {filteredUsers.map((user) => (
              <div
                key={user._id}
                className={`flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer ${
                  selectedUsers.includes(user._id)
                    ? "order-first bg-indigo-50 dark:bg-indigo-900/30"
                    : ""
                }`}
                onClick={() => {
                  if (selectedUsers.includes(user._id)) {
                    setSelectedUsers(
                      selectedUsers.filter((id) => id !== user._id)
                    );
                  } else {
                    setSelectedUsers([...selectedUsers, user._id]);
                  }
                }}
              >
                {/* User Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center mr-3 shadow-md">
                  {user.photo ? (
                    <img
                      src={`${IMG_URL}${user.photo.replace(/\\/g, "/")}`}
                      alt={user.userName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-medium">
                      {user.userName && user.userName.includes(" ")
                        ? user.userName.split(" ")[0][0] +
                          user.userName.split(" ")[1][0]
                        : user.userName[0]}
                    </span>
                  )}
                </div>

                {/* User Details */}
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800 dark:text-white">
                    {user.userName}
                  </h3>
                  {user.status && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user.status}
                    </p>
                  )}
                </div>

                {/* Checkbox */}
                <div className="flex items-center justify-center w-6 h-6">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user._id)}
                    onChange={() => {}} // Handled by parent div click
                    className="w-5 h-5 rounded-full border-2 border-indigo-500 text-indigo-500 
                           focus:ring-indigo-500 focus:ring-offset-0 checked:bg-indigo-500"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl modal_background">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {selectedUsers.length} user
                {selectedUsers.length !== 1 ? "s" : ""} selected
              </span>
              <div className="space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onSubmit(selectedUsers)}
                  disabled={selectedUsers.length === 0}
                  className={`px-4 py-2 rounded-lg transition-colors
                  ${
                    selectedUsers.length === 0
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  Forward
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default ForwardModal;
