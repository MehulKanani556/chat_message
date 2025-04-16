import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaChevronDown, FaChevronUp, FaPaperclip } from "react-icons/fa";
import { CgProfile } from "react-icons/cg";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { IMG_URL } from "../utils/baseUrl";
import { updateUser } from "../redux/slice/user.slice";
import ColorPicker from "./ColorPicker";
import { initializePrimaryColor } from "../utils/themeUtils";

const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [urlUserId, setUrlUserId] = useState(sessionStorage.getItem("userId"));
  const [isEditing, setIsEditing] = useState(false);
  const currentUser = useSelector((state) => state.user.user);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [userInfoOpen, setUserInfoOpen] = useState(true);
  const [filesOpen, setFilesOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Initialize primary color on component mount
  useEffect(() => {
    initializePrimaryColor();
  }, []);

  // Determine which user ID to use (from props, URL params, or current user)
  const targetUserId = urlUserId || (currentUser ? currentUser._id : null);

  const [profileData, setProfileData] = useState({
    name: "User",
    email: "",
    phone: "",
    bio: "No bio available",
    profileImage: "https://via.placeholder.com/150",
  });
  const [tempData, setTempData] = useState({ ...profileData });

  useEffect(() => {
    const handleShowProfile = (event) => {
      const userId = event.detail?.userId;
      if (userId) {
        setUrlUserId(userId);
      }
    };

    window.addEventListener("showProfile", handleShowProfile);
    return () => {
      window.removeEventListener("showProfile", handleShowProfile);
    };
  }, []);

  // Update profile data when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setProfileData({
        name: currentUser.userName || "User",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        bio: currentUser.bio || "No bio available",
        profileImage: currentUser.photo
          ? `${IMG_URL}${currentUser.photo.replace(/\\/g, "/")}`
          : "https://via.placeholder.com/150",
      });
    }
  }, [currentUser]);

  useEffect(() => {
    if (targetUserId && (!currentUser || targetUserId !== currentUser._id)) {
      const fetchUserData = async () => {
        try {
          setIsLoading(true);
          console.log("Fetching user data for ID:", targetUserId);
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/users/${targetUserId}`
          );
          const userData = response.data;

          setUser(userData);
          setProfileData({
            name: userData.userName || "User",
            email: userData.email || "",
            phone: userData.phone || "",
            bio: userData.bio || "No bio available",
            profileImage: userData.photo
              ? `${IMG_URL}${userData.photo.replace(/\\/g, "/")}`
              : "https://via.placeholder.com/150",
          });
          setTempData({
            name: userData.userName || "User",
            email: userData.email || "",
            phone: userData.phone || "",
            bio: userData.bio || "No bio available",
            profileImage: userData.photo
              ? `${IMG_URL}${userData.photo.replace(/\\/g, "/")}`
              : "https://via.placeholder.com/150",
          });
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchUserData();
    } else if (currentUser) {
      // Use current user data
      console.log("Using current user data:", currentUser._id);
      setUser(currentUser);
      setProfileData({
        name: currentUser.userName || "User",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        bio: currentUser.bio || "No bio available",
        profileImage: currentUser.photo
          ? `${IMG_URL}${currentUser.photo.replace(/\\/g, "/")}`
          : "https://via.placeholder.com/150",
      });
      setTempData({
        name: currentUser.userName || "User",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        bio: currentUser.bio || "No bio available",
        profileImage: currentUser.photo
          ? `${IMG_URL}${currentUser.photo.replace(/\\/g, "/")}`
          : "https://via.placeholder.com/150",
      });
    }
  }, [currentUser, targetUserId]);

  const handleEdit = () => {
    setTempData({ ...profileData });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);

      // Create form data for the update
      const formData = new FormData();
      formData.append("userName", tempData.name);
      formData.append("email", tempData.email);
      formData.append("phone", tempData.phone);
      formData.append("bio", tempData.bio);

      // If there's a new image file, append it
      if (tempData.photoFile) {
        formData.append("photo", tempData.photoFile);
      }

      // Dispatch the update action
      await dispatch(updateUser({ id: user._id, values: formData })).unwrap();

      setProfileData({
        ...tempData,
        profileImage: tempData.photoFile
          ? URL.createObjectURL(tempData.photoFile)
          : tempData.profileImage,
      });

      setIsEditing(false);
      setIsLoading(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTempData({ ...tempData, [name]: value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempData({
          ...tempData,
          profileImage: reader.result,
          photoFile: file,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  const toggleColorPicker = () => {
    setShowColorPicker(!showColorPicker);
  };

  return (
    <div className="w-[380px] bg-[#F7F7F7] dark:bg-primary-dark/95 h-full shadow-sm relative">
      <div>
        <div className="p-4 pb-2 flex items-center">
          <h1 className="text-lg font-semibold text-gray-800 dark:text-primary-light">
            Profile
          </h1>
        </div>
      </div>
      <div className=" overflow-hidde">
        <div className="flex flex-col items-center justify-center p-6   border-b border-gray-300 dark:border-primary-light/15">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-pink-100 overflow-hidden mb-3">
              <img src={profileData.profileImage} alt="Profile" />
            </div>
          </div>

          <h2 className="text-lg font-medium text-gray-800 dark:text-primary-light mt-2">
            {profileData.name}
          </h2>

          <div className="flex items-center mt-1">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
            <span className="text-sm text-gray-500 dark:text-primary-light">
              Active
            </span>
          </div>
        </div>

        <div className="max-w-md mx-auto  rounded-lg shadow-sm p-8  dark:text-primary-light">
          <p>
            If several languages coalesce, the grammar of the resulting language
            is more simple and regular than that of the individual.
          </p>
          <div
            className="p-4 cursor-pointer flex items-center justify-between"
            onClick={toggleAccordion}
          ></div>

          <div className="w-full max-w-md bg-[#F9FAFA] rounded shadow dark:bg-primary-light/15 ">
            <div className="border-b border-gray-300">
              <div className="px-4 pb-4 pt-1">
                <div className="mb-4">
                  <p className="text-gray-400 text-sm">Name</p>
                  <p className="text-black font-semibold dark:text-primary-light">
                    {profileData.name}
                  </p>
                </div>

                <div className="max-w-md mx-auto rounded-lg shadow-sm p-8 dark:text-primary-light">
                    <div className="mb-6">
                        <h3 className="text-gray-400 text-sm mb-2">About</h3>
                        <p className="text-black font-semibold dark:text-primary-light">
                            {profileData.bio || "No bio available"}
                        </p>
                    </div>

                    <div className="w-full max-w-md bg-[#F9FAFA] rounded shadow dark:bg-primary-light/15 ">
                        <div className="border-b border-gray-300">
                            <div className="px-4 pb-4 pt-1">
                                <div className="mb-4">
                                    <p className="text-gray-400 text-sm">Name</p>
                                    <p className="text-black font-semibold dark:text-primary-light">{profileData.name}</p>
                                </div>

                                <div className="mb-4">
                                    <p className="text-gray-400 text-sm">Email</p>
                                    <p className="text-black font-semibold dark:text-primary-light">{profileData.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
                <div className="mb-4">
                  <p className="text-gray-400 text-sm">Email</p>
                  <p className="text-black font-semibold dark:text-primary-light">
                    {profileData.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Theme Color Section */}
            <div className="border-b border-gray-300">
              <button
                className="w-full px-4 py-3 flex justify-between items-center"
                onClick={toggleColorPicker}
              >
                <div className="flex items-center space-x-2">
                  <span className="w-4 h-4 rounded-full bg-primary"></span>
                  <span className="font-medium">Theme Color</span>
                </div>
                {showColorPicker ? (
                  <FaChevronUp size={12} />
                ) : (
                  <FaChevronDown size={12} />
                )}
              </button>

              {showColorPicker && (
                <div className="px-4 py-4">
                  <ColorPicker />
                </div>
              )}
            </div>

            {/* <div>
                            <button
                                className="w-full px-4 py-3 flex justify-between items-center"
                                onClick={() => setFilesOpen(!filesOpen)}
                            >
                                <div className="flex items-center space-x-2">
                                    <FaPaperclip size={18} className=" " />
                                    <span className="font-medium">Attached Files</span>
                                </div>
                                {filesOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                            </button>

                            {filesOpen && (
                                <div className="px-4 py-4">
                                    <p className="text-gray-400 italic">No files attached</p>
                                </div>
                            )}
                        </div> */}
          </div>
        </div>
      </div>
  );
};

export default Profile;
