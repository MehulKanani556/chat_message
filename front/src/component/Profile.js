import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronDown, FaChevronUp, FaPaperclip } from 'react-icons/fa';
import { CgProfile } from "react-icons/cg";
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { IMG_URL } from '../utils/baseUrl';
import { updateUser } from '../redux/slice/user.slice';

const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const user = useSelector((state) => state.user.user);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [userInfoOpen, setUserInfoOpen] = useState(true);
  const [filesOpen, setFilesOpen] = useState(false);


  const [profileData, setProfileData] = useState({
    name: user?.userName || 'User',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || 'No bio available',
    profileImage: user?.photo ? `${IMG_URL}${user.photo.replace(/\\/g, "/")}` : 'https://via.placeholder.com/150',
  });
  const [tempData, setTempData] = useState({ ...profileData });

  useEffect(() => {
    // Update profile data when user data changes
    if (user) {
      setProfileData({
        name: user.userName || 'User',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || 'No bio available',
        profileImage: user.photo ? `${IMG_URL}${user.photo.replace(/\\/g, "/")}` : 'https://via.placeholder.com/150',
      });
      setTempData({
        name: user.userName || 'User',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || 'No bio available',
        profileImage: user.photo ? `${IMG_URL}${user.photo.replace(/\\/g, "/")}` : 'https://via.placeholder.com/150',
      });
    }
  }, [user]);

  const handleEdit = () => {
    setTempData({ ...profileData });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);

      // Create form data for the update
      const formData = new FormData();
      formData.append('userName', tempData.name);
      formData.append('email', tempData.email);
      formData.append('phone', tempData.phone);
      formData.append('bio', tempData.bio);

      // If there's a new image file, append it
      if (tempData.photoFile) {
        formData.append('photo', tempData.photoFile);
      }

      // Dispatch the update action
      await dispatch(updateUser({ id: user._id, values: formData })).unwrap();

      setProfileData({
        ...tempData,
        profileImage: tempData.photoFile ? URL.createObjectURL(tempData.photoFile) : tempData.profileImage
      });

      setIsEditing(false);
      setIsLoading(false);
    } catch (error) {
      console.error('Error updating profile:', error);
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
          photoFile: file
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="bg-white h-full overflow-y-auto">
      <div className="bg-white overflow-hidden">
        {/* Profile Header */}
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-sm max-w-xs mx-auto">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-pink-100 overflow-hidden mb-3">
              <img src={profileData.profileImage} alt="Profile" />
            </div>
          </div>

          <h2 className="text-lg font-medium text-gray-800 mt-2">{profileData.name}</h2>

          <div className="flex items-center mt-1">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
            <span className="text-sm text-gray-500">Active</span>
          </div>
        </div>

        {/* Profile Content */}
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm">
          {/* Main accordion header */}
          <div
            className="p-4 cursor-pointer flex items-center justify-between"
            onClick={toggleAccordion}
          >
          </div>

          {/* Accordion content */}
          <div className="w-full max-w-md bg-white rounded shadow">
            {/* User Info Section */}
            <div className="border-b">
              <button
                className="w-full px-4 py-3 flex justify-between items-center"
                onClick={() => setUserInfoOpen(!userInfoOpen)}
              >
                <div className="flex items-center space-x-2">
                  <CgProfile />
                  <span className="font-medium">About</span>
                </div>
                {userInfoOpen ? <FaChevronUp size={18} /> : <FaChevronDown size={18} />}
              </button>

              {userInfoOpen && (
                <div className="px-4 pb-4 pt-1">
                  <div className="mb-4">
                    <p className="text-gray-500 text-sm">Name</p>
                    <p className="text-black font-semibold">{profileData.name}</p>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-500 text-sm">E-mail</p>
                    <p className="text-black font-semibold">{profileData.email}</p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-sm">location</p>
                    <p className="text-black font-semibold">India</p>
                  </div>
                </div>
              )}
            </div>

            {/* Files Section */}
            <div>
              <button
                className="w-full px-4 py-3 flex justify-between items-center"
                onClick={() => setFilesOpen(!filesOpen)}
              >
                <div className="flex items-center space-x-2">
                  <FaPaperclip size={18} className="text-gray-500" />
                  <span className="font-medium">Attached Files</span>
                </div>
                {filesOpen ? <FaChevronUp size={18} /> : <FaChevronDown size={18} />}
              </button>

              {filesOpen && (
                <div className="px-4 py-4">
                  <p className="text-gray-500 italic">No files attached</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 