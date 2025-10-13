import React, { useState, useEffect } from "react";
import { ImCross } from "react-icons/im";
import { FaSearch, FaCheck, FaPaperPlane, FaUsers } from "react-icons/fa";
import { IMG_URL } from "../utils/baseUrl";
import { useSocket } from "../context/SocketContext";
import { useDispatch, useSelector } from "react-redux";
import { setForwardingMessage, setShowForwardModal } from "../redux/slice/manageState.slice";

const ForwardModal = () => {
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  const { allUsers, groups, currentUser } = useSelector((state) => state.user);
  const { forwardingMessage } = useSelector(state => state.magageState);
  const { forwardMessage } = useSocket();

  // Filter out current user from allUsers
  const availableUsers = (allUsers || []).filter((user) =>
    user._id !== currentUser?._id
  );

  // Filter users and groups based on search query
  const filteredUsers = availableUsers.filter((user) =>
    user.userName && user.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = (groups || []).filter((group) =>
    group.userName && group.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Combine filtered results
  const allFilteredResults = [
    ...filteredUsers.map(user => ({ ...user, type: 'user' })),
    ...filteredGroups.map(group => ({ ...group, type: 'group' }))
  ];

  const handleForwardSubmit = async (selectedRecipients) => {
    if (selectedRecipients.length === 0 || !forwardingMessage) return;

    setIsLoading(true);
    try {
      for (const recipient of selectedRecipients) {
        if (recipient.type === 'group') {
          await forwardMessage({
            groupId: recipient._id,
            message: forwardingMessage,
            isGroup: true
          });
        } else {
          await forwardMessage({
            receiverId: recipient._id,
            message: forwardingMessage
          });
        }
      }
      dispatch(setShowForwardModal(false));
      dispatch(setForwardingMessage(null));
    } catch (error) {
      console.error("Error forwarding message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onClose = () => {
    dispatch(setShowForwardModal(false));
    dispatch(setForwardingMessage(null));
  };

  const handleRecipientToggle = (recipient) => {
    setSelectedRecipients(prev => {
      const isSelected = prev.some(p => p._id === recipient._id && p.type === recipient.type);
      if (isSelected) {
        return prev.filter(p => !(p._id === recipient._id && p.type === recipient.type));
      } else {
        return [...prev, recipient];
      }
    });
  };

  const isRecipientSelected = (recipient) => {
    return selectedRecipients.some(p => p._id === recipient._id && p.type === recipient.type);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="p-3 md:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl items-center justify-center hidden sm:flex">
                <FaPaperPlane className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Forward Message
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Select contacts or groups to forward this message
                </p>
              </div>
            </div>
            <button
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              onClick={onClose}
              aria-label="Close modal"
            >
              <ImCross className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FaSearch className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search contacts and groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400
                         transition-all duration-200"
            />
          </div>
        </div>

        {/* Selected Recipients Preview */}
        {selectedRecipients.length > 0 && (
          <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {selectedRecipients.length} selected
              </span>
              <div className="flex -space-x-2">
                {selectedRecipients.slice(0, 3).map((recipient) => (
                  <div key={`${recipient.type}-${recipient._id}`} className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white dark:border-gray-900 flex items-center justify-center">
                    {recipient.type === 'user' ? (
                      recipient.photo ? (
                        <img
                          src={`${IMG_URL}${recipient.photo.replace(/\\/g, "/")}`}
                          alt={recipient.userName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-white font-medium">
                          {recipient.userName?.[0]}
                        </span>
                      )
                    ) : (
                      <FaUsers className="w-3 h-3 text-white" />
                    )}
                  </div>
                ))}
                {selectedRecipients.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-gray-400 border-2 border-white dark:border-gray-900 flex items-center justify-center">
                    <span className="text-xs text-white font-medium">
                      +{selectedRecipients.length - 3}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recipients List */}
        <div className="max-h-[400px] overflow-y-auto modal_scroll">
          {allFilteredResults.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaSearch className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery ? "No contacts or groups found" : "No contacts or groups available"}
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-1">
              {allFilteredResults.map((recipient) => {
                const isSelected = isRecipientSelected(recipient);
                return (
                  <div
                    key={`${recipient.type}-${recipient._id}`}
                    className={`flex items-center p-3 rounded-xl transition-all duration-200 cursor-pointer group
                      ${isSelected
                        ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    onClick={() => handleRecipientToggle(recipient)}
                  >
                    {/* Avatar */}
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 shadow-sm ${recipient.type === 'group'
                        ? 'bg-gradient-to-br from-green-400 to-blue-500'
                        : 'bg-gradient-to-br from-blue-400 to-purple-500'
                        }`}>
                        {recipient.type === 'user' ? (
                          recipient.photo ? (
                            <img
                              src={`${IMG_URL}${recipient.photo.replace(/\\/g, "/")}`}
                              alt={recipient.userName}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-semibold text-lg">
                              {recipient.userName && recipient.userName.includes(" ")
                                ? recipient.userName.split(" ")[0][0] + recipient.userName.split(" ")[1][0]
                                : recipient.userName[0]}
                            </span>
                          )
                        ) : (
                          recipient.photo ? (
                            <img
                              src={`${IMG_URL}${recipient.photo.replace(/\\/g, "/")}`}
                              alt={recipient.userName}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <FaUsers className="w-6 h-6 text-white" />
                            // <span className="text-white font-semibold text-lg">
                            //   {recipient.userName && recipient.userName.includes(" ")
                            //     ? recipient.userName.split(" ")[0][0] + recipient.userName.split(" ")[1][0]
                            //     : recipient.userName[0]}
                            // </span>
                          )
                        )}
                      </div>
                      {isSelected && (
                        <div className="absolute bottom-0 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <FaCheck className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {recipient.userName}
                        </h3>
                        {recipient.type === 'group' && (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
                            Group
                          </span>
                        )}
                      </div>
                      {recipient.type === 'user' && recipient.bio && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {recipient.bio}
                        </p>
                      )}
                      {recipient.type === 'group' && recipient.bio && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {recipient.bio}
                        </p>
                      )}
                    </div>

                    {/* Selection Indicator */}
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200
                      ${isSelected
                        ? "bg-blue-500 border-blue-500"
                        : "border-gray-300 dark:border-gray-600 group-hover:border-blue-300"
                      }`}>
                      {isSelected && (
                        <FaCheck className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 md:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex flex-col md600:gap-0 gap-2 md600:flex-row justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {selectedRecipients.length > 0 && (
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {selectedRecipients.length} recipient{selectedRecipients.length !== 1 ? "s" : ""} selected
                </span>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleForwardSubmit(selectedRecipients)}
                disabled={selectedRecipients.length === 0 || isLoading}
                className={`px-6 py-2.5 rounded-xl transition-all duration-200 font-medium flex items-center space-x-2
                  ${selectedRecipients.length === 0 || isLoading
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl"
                  }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="w-4 h-4" />
                    <span>Forward</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForwardModal;