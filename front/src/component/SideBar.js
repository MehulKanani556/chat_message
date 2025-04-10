import React, { useState, useEffect } from 'react';
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
import { MdOutlineWbSunny } from 'react-icons/md';

const Sidebar = ({ user, onProfileClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check saved theme on first load
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    }
  }, []);

  // Toggle dark class
  const toggleTheme = () => {
    const isDark = !isDarkMode;
    setIsDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  };

  const handleProfileClick = () => {
    if (onProfileClick) {
      onProfileClick(user?._id);
    }
  };

  const [activeItem, setActiveItem] = useState("chat");

  useEffect(() => {
    const event = new CustomEvent('showChatList');
    window.dispatchEvent(event);
    setActiveItem("chat");
  }, []);

  const menuItems = [
    // { icon: <BsChatDots size={20} />, path: "#", label: "Chat" },
    {
      icon: <BsPerson size={20} />, path: "#", label: "Profile", onClick: () => {
        const event = new CustomEvent('showProfile');
        window.dispatchEvent(event);
        setActiveItem("Profile");
      }
    },
    {
      icon: <BsChatDots size={20} />, path: "#", label: "chat", onClick: () => {
        const event = new CustomEvent('showChatList');
        window.dispatchEvent(event);
        setActiveItem("chat");
      }
    },
    {
      icon: <BsPeople size={20} />, path: "#", label: "Groups", onClick: () => {
        const event = new CustomEvent('showGroups');
        window.dispatchEvent(event);
        setActiveItem("Groups");
      }
    },
    {
      icon: <BsGear size={20} />, path: "#", label: "Settings", onClick: () => {
        const event = new CustomEvent('showSettings');
        window.dispatchEvent(event);
        setActiveItem("Settings");
      }
    },
    {
      icon: <BsGlobe size={20} />, path: "#", label: "Language", onClick: () => {
        const event = new CustomEvent('showLanguage');
        window.dispatchEvent(event);
        setActiveItem("Language");
      }
    },
    // { icon: <BsMoonStars size={20} />, path: "/chat", label: "Theme" },
  ];

  return (
    <nav className="
      fixed md:left-0 bottom-0 md:bottom-auto
      w-full md:w-16 md:h-screen
      bg-white dark:bg-primary-dark
      border-t md:border-t-0 
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
          <div
            key={index}
            to={item.path}
            className={`
              relative flex items-center justify-center
              w-10 h-10 font-bold rounded-full
              transition-colors duration-200
              cursor-pointer
              ${activeItem === item.label
                ? 'bg-primary-light dark:bg-primary-dark/10 text-primary'
                : 'text-gray-800 dark:text-primary-light'}
            `}
            title={item.label}
            onClick={item.onClick}
          >
            {item.icon}
          </div>
        ))}

        {/* Profile Image at Bottom (only visible on desktop) */}
        <div className=" md:flex mt-auto mb-4  md:flex-col items-center">
          <button
            onClick={toggleTheme}
            className={`
              relative flex items-center justify-center
              mb-3
              w-10 h-10 rounded-full
              transition-colors duration-200
              ${isDarkMode
                ? 'bg-primary-light dark:bg-primary-dark text-white'
                : 'text-gray-600 dark:text-primary-dark'}
            `}
            title="theme"
          >
            {isDarkMode ? <MdOutlineWbSunny size={20} /> : <BsMoonStars size={20} />}
          </button>
          <div className="w-10 h-10 rounded-full bg-gray-300  overflow-hidden flex items-center justify-center border border-gray-500">
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