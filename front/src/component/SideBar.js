import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BsChatDots,
  BsPeople,
  BsPerson,
  BsGear,
  BsGlobe,
  BsMoonStars,
  BsPeopleFill
} from 'react-icons/bs';
import { BASE_URL, IMG_URL } from "../utils/baseUrl";

const Sidebar = ({ user, onProfileClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleProfileClick = () => {
    if (onProfileClick) {
      onProfileClick(user?._id);
    }
  };

  const menuItems = [
    // { icon: <BsChatDots size={20} />, path: "#", label: "Chat" },
    { icon: <BsPerson size={20} />, path: "#", label: "Profile", onClick: handleProfileClick },
    { icon: <BsChatDots size={20} />, path: "/chat", label: "chat" },
    { icon: <BsPeople size={20} />, path: "#", label: "Groups", onClick: () => {
      const event = new CustomEvent('showGroups');
      window.dispatchEvent(event);
    }},
    { icon: <BsGear size={20} />, path: "/chat", label: "Settings" },
    { icon: <BsGlobe size={20} />, path: "/chat", label: "Language" },
    // { icon: <BsMoonStars size={20} />, path: "/chat", label: "Theme" },
  ];

  return (
    <nav className="
      fixed md:left-0 bottom-0 md:bottom-auto
      w-full md:w-16 md:h-screen
      bg-white dark:bg-gray-800
      border-t md:border-t-0 md:border-r
      border-gray-400 dark:border-gray-700
      transition-all duration-300
      z-50 
    ">
      <div className="
        flex md:flex-col
        items-center justify-around md:justify-start
        h-16 md:h-full
        px-2 md:px-3
        py-2 md:py-4
        gap-1 md:gap-6
      ">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className={`
              relative flex items-center justify-center
              w-10 h-10 rounded-full
              hover:bg-gray-100 dark:hover:bg-gray-700
              transition-colors duration-200
              ${location.pathname === "#"
                ? 'bg-primary-light dark:bg-primary-dark text-white'
                : 'text-gray-600 dark:text-primary-dark'}
            `}
            title={item.label}
            onClick={item.onClick}
          >
            {item.icon}
          </Link>
        ))}

        {/* Profile Image at Bottom (only visible on desktop) */}
        <div className=" md:flex mt-auto mb-4  md:flex-col">
          <Link
            // key={index}
            // to={item.path}
            className={`
              relative flex items-center justify-center
              w-10 h-10 rounded-full
              hover:bg-gray-100 dark:hover:bg-gray-700
              transition-colors duration-200
              ${location.pathname === "#"
                ? 'bg-primary-light dark:bg-primary-dark text-white'
                : 'text-gray-600 dark:text-primary-dark'}
            `}
            title="theme"
          >
            <BsMoonStars size={20} />
          </Link>
          <div
            className="w-9 h-9 rounded-full bg-gray-300 ml-1 overflow-hidden flex items-center justify-center border border-gray-500 cursor-pointer"
            onClick={handleProfileClick}
          >
            {user?.photo && user.photo !== "null" ? (
              <img
                src={`${IMG_URL}${user.photo.replace(/\\/g, "/")}`}
                alt="Profile"
                className="object-fill w-full h-full"
                onClick={handleProfileClick}
              />
            ) : (
              <span className="text-black text-lg font-bold capitalize">
                {user?.userName && user?.userName.includes(" ")
                  ? user?.userName.split(" ")[0][0] +
                  user?.userName.split(" ")[1][0]
                  : user?.userName[0]}
              </span>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;