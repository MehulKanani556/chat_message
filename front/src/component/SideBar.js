import React, { useState, useEffect, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {BsChatDots,BsPeople, BsMoonStars} from 'react-icons/bs';
import { MdOutlineWbSunny } from 'react-icons/md';
import { LuPhoneCall } from 'react-icons/lu';
import { useSelector } from 'react-redux';

const Sidebar = memo(() => {

  console.log("sidebar");

  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("chat");

  const {user } = useSelector((state) => state.user);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfileClick = () => {
    setShowDropdown(!showDropdown);
  };



  const menuItems = [
    // { icon: <BsChatDots size={20} />, path: "#", label: "Chat" },
    // {
    //   icon: <BsPerson size={20} />, path: "#", label: "Profile", onClick: () => {
    //     const event = new CustomEvent('showProfile');
    //     window.dispatchEvent(event);
    //     setActiveItem("Profile");
    //   }
    // },
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
      icon: <LuPhoneCall size={20} />, path: "#", label: "Call", onClick: () => {
        const event = new CustomEvent('showCall');
        window.dispatchEvent(event);
        setActiveItem("Call");
      }
    },
    // {
    // icon: <BsGlobe size={20} />, path: "#", label: "Language", onClick: () => {
    //     const event = new CustomEvent('showLanguage');
    //     window.dispatchEvent(event);
    //     setActiveItem("Language");
    //   }
    // },
  ];

  // Logout
  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userId");
    navigate("/");
  };

  return (
    <nav className="
      fixed md:left-0 bottom-0 md:bottom-auto
      w-full md:w-16 md:h-screen
      bg-white dark:bg-primary-dark
      border-t md:border-t-0 
      border-gray-400/30 dark:border-gray-700z
      transition-all duration-300
      z-50"
    // style={{
    //   boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.1)"
    // }}
    >
      <div className="
        flex md:flex-col
        items-center justify-around md:justify-start
        h-10 md:h-full
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
        <div className="flex md:mt-auto md:mb-4 md:flex-col items-center relative gap-2" ref={dropdownRef}>
          <button
            onClick={toggleTheme}
            className={`
              relative md:flex items-center justify-center
              hidden 
              md:mb-3
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
          <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-primary overflow-hidden flex items-center justify-center border border-gray-800">
            {user?.photo && user.photo !== "null" ? (
              <img
                src={`${user.photo.replace(/\\/g, "/")}`}
                alt="Profile"
                className="object-fill w-full h-full cursor-pointer"
                onClick={handleProfileClick}
              />
            ) : (
              <span
                className="text-black dark:text-primary-light text-lg font-bold capitalize cursor-pointer"
                onClick={handleProfileClick}
              >
                {user?.userName && user?.userName.includes(" ")
                  ? user?.userName.split(" ")[0][0] +
                  user?.userName.split(" ")[1][0]
                  : user?.userName[0]}
              </span>
            )}
          </div>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute bottom-[50px] md:bottom-0 right-0 md:right-auto md:left-[55px] mt-2 w-48 bg-white dark:bg-primary-dark rounded-md shadow-lg py-1 z-50">
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    const event = new CustomEvent('showSettings');
                    window.dispatchEvent(event);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Profile
                </button>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    setIsLogoutModalOpen(true);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-500 dark:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Logout
                </button>
              </div>
            </div>
          )}

          {/* Logout Modal */}
          {isLogoutModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 dark:bg-primary-light/15">
              <div className="bg-white rounded-lg p-8  dark:bg-primary-dark">
                <h3 className="text-lg text-center font-semibold mb-6 dark:text-gray-200">
                  Logout
                </h3>

                <h3 className="w-2/3 text-center mx-auto font-semibold mb-8 text-black/50 dark:text-gray-200/50">
                  Are you sure to Logout
                  from your account?
                </h3>

                <div className="flex justify-center space-x-4 font-medium">
                  <button
                    onClick={() => setIsLogoutModalOpen(false)}
                    className="px-4 py-2 w-full rounded dark:text-white border border-black dark:border-white "
                    // style={{ backgroundColor: "transparent", color: "white", border: "1px solid black" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setIsLogoutModalOpen(false);
                      handleLogout();
                    }}
                    className="px-4 py-2 w-full text-white rounded"
                    style={{ backgroundColor: "#7269FF", color: "white", border: "1px solid #7269FF" }}
                  >
                    Yes, Sign out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
});

export default Sidebar;