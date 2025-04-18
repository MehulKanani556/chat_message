import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaChevronDown, FaChevronUp, FaPaperclip, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';
import { CgProfile } from "react-icons/cg";
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { IMG_URL } from '../utils/baseUrl';
import { updateUser, updateUserGroupToJoin, updateUserProfilePhotoPrivacy } from '../redux/slice/user.slice';
import { MdEdit, MdModeEdit } from 'react-icons/md';
import ColorPicker from "./ColorPicker";
import { initializePrimaryColor } from "../utils/themeUtils";

const Setting = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [urlUserId, setUrlUserId] = useState(sessionStorage.getItem("userId"));
    const [isEditing, setIsEditing] = useState(false);
    const currentUser = useSelector((state) => state.user.user);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [userInfoOpen, setUserInfoOpen] = useState(true);
    const [filesOpen, setFilesOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [editingField, setEditingField] = useState(null);
    const [profilePhotoPrivacy, setProfilePhotoPrivacy] = useState('Everyone');
    const [groupsPrivacy, setGroupsPrivacy] = useState('Everyone');
    const [privacyDropdownOpen, setPrivacyDropdownOpen] = useState(false);
    const [groupsPrivacyDropdownOpen, setGroupsPrivacyDropdownOpen] = useState(false);
    const [lastSeenPrivacy, setLastSeenPrivacy] = useState(true);
    const [editedUserName, setEditedUserName] = useState(user?.userName || "");
    const [isEditingUserName, setIsEditingUserName] = useState(false);

    // Add refs for the dropdowns
    const privacyDropdownRef = useRef(null);
    const groupsDropdownRef = useRef(null);

    const [showColorPicker, setShowColorPicker] = useState(false);

    // Initialize primary color on component mount
    useEffect(() => {
      initializePrimaryColor();
    }, []);

    // Add useEffect for handling clicks outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (privacyDropdownRef.current && !privacyDropdownRef.current.contains(event.target)) {
                setPrivacyDropdownOpen(false);
            }
            if (groupsDropdownRef.current && !groupsDropdownRef.current.contains(event.target)) {
                setGroupsPrivacyDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Determine which user ID to use (from props, URL params, or current user)
    const targetUserId = urlUserId || (currentUser ? currentUser._id : null);

    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        phone: '',
        bio: '',
        profileImage: '',
    });
    const [tempData, setTempData] = useState({ ...profileData });

    useEffect(() => {
        // If we have a targetUserId and it's different from the current user
        if (targetUserId && (!currentUser || targetUserId !== currentUser._id)) {
            // Fetch user data from API
            const fetchUserData = async () => {
                try {
                    setIsLoading(true);
                    console.log('Fetching user data for ID:', targetUserId);
                    const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/${targetUserId}`);
                    const userData = response.data;

                    setUser(userData);
                    setProfileData({
                        name: userData.userName || '',
                        email: userData.email || '',
                        phone: userData.phone || '',
                        bio: userData.bio || '',
                        profileImage: userData.photo ? `${IMG_URL}${userData.photo.replace(/\\/g, "/")}` : '',
                    });
                    setTempData({
                        name: userData.userName || '',
                        email: userData.email || '',
                        phone: userData.phone || '',
                        bio: userData.bio || '',
                        profileImage: userData.photo ? `${IMG_URL}${userData.photo.replace(/\\/g, "/")}` : '',
                    });
                } catch (error) {
                    console.error('Error fetching user data:', error);
                } finally {
                    setIsLoading(false);
                }
            };

            fetchUserData();
        } else if (currentUser) {
            // Use current user data
            console.log('Using current user data:', currentUser._id);
            setUser(currentUser);
            setProfileData({
                name: currentUser.userName || '',
                email: currentUser.email || '',
                phone: currentUser.phone || '',
                bio: currentUser.bio || '',
                profileImage: currentUser.photo ? `${IMG_URL}${currentUser.photo.replace(/\\/g, "/")}` : '',
            });
            setTempData({
                name: currentUser.userName || '',
                email: currentUser.email || '',
                phone: currentUser.phone || '',
                bio: currentUser.bio || '',
                profileImage: currentUser.photo ? `${IMG_URL}${currentUser.photo.replace(/\\/g, "/")}` : '',
            });
        }
    }, [currentUser, targetUserId]);


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setTempData({ ...tempData, [name]: value });
    };

    const handleImageUpload = (e) => {
        console.log('File selected:', e.target.files[0]);
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setTempData({
                    ...tempData,
                    profileImage: reader.result,
                    photoFile: file
                });
                // Also update profileData to show the image immediately
                setProfileData(prev => ({
                    ...prev,
                    profileImage: reader.result
                }));
                // Automatically save the image when uploaded
                handleSaveImage(file);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveImage = async (file) => {
        try {
            setIsLoading(true);

            // Dispatch the update action
            const result = await dispatch(updateUser({ id: user._id, values: { photo: file } })).unwrap();

            // Update local state
            if (result && result.user) {
                setUser(result.user);
                setProfileData(prev => ({
                    ...prev,
                    profileImage: result.user.photo ? `${IMG_URL}${result.user.photo.replace(/\\/g, "/")}` : prev.profileImage
                }));
            }

            setIsLoading(false);
        } catch (error) {
            console.error('Error updating profile image:', error);
            setIsLoading(false);
        }
    };

    const handleEditField = (fieldName) => {
        setEditingField(fieldName);
        setTempData({ ...profileData });
    };

    const handleSaveField = async (fieldName) => {
        try {
            setIsLoading(true);

            // Prepare the update object
            const updateObject = {
                userName: tempData.name,
                email: tempData.email,
                phone: tempData.phone,
                bio: tempData.bio,
            };

            // If there's a new image file, add it to the update object
            if (tempData.photoFile) {
                updateObject.photo = tempData.photoFile;
            }

            // Dispatch the update action
            const result = await dispatch(updateUser({ id: user._id, values: updateObject })).unwrap();

            // Update local state
            setProfileData({
                ...tempData,
                profileImage: tempData.photoFile ? URL.createObjectURL(tempData.photoFile) : tempData.profileImage
            });

            // Update user state in Redux
            if (result && result.user) {
                setUser(result.user);
            }

            setEditingField(null);
            setIsLoading(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            setIsLoading(false);
        }
    };

    // const handleUserNameChange = (e) => {
    //     setEditedUserName(e.target.value);
    // };


    // const handleUserNameBlur = () => {
    //     setIsEditingUserName(false);
    //     // Optionally, dispatch an action to update the username in the store
    //     // dispatch(updateUserName(editedUserName));
    //     dispatch(
    //         updateUser({ id: currentUser, values: { userName: editedUserName } })
    //     );
    // };
    const toggleColorPicker = () => {
        setShowColorPicker(!showColorPicker);
      };

    return (
        <div className="w-full bg-primary-dark/5 dark:bg-primary-dark/90 h-full  relative"
        style={{
          boxShadow: "inset 0 0 5px 0 rgba(0, 0, 0, 0.1)"
        }}>
            <div>
                <div className="p-4 pb-2 flex items-center">
                    <h1 className="text-lg font-semibold text-gray-800 dark:text-primary-light">Settings</h1>
                </div>
            </div>
            <div className="">
                {/* Profile Header */}
                <div className="flex flex-col items-center justify-center p-6  rounded-lg max-w-xs mx-auto">
                    <div className="relative group">
                        <div className="w-24 h-24 relative rounded-full bg-pink-100 overflow-hidden mb-3">
                            <img src={profileData.profileImage} alt="Profile" className='h-full w-full object-cover' />
                            <div
                                className='absolute inset-0 bg-[#C4C8D0]/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-pointer'
                                onClick={() => document.getElementById('profileImageInput').click()}
                            >
                                <MdEdit size={24} className="text-white" />
                            </div>
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="profileImageInput"
                            onChange={handleImageUpload}
                        />
                    </div>

                    <h2 className="text-lg font-medium text-gray-800 dark:text-primary-light mt-2">{profileData.name}</h2>

                    <div className="flex items-center mt-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-sm text-gray-500 dark:text-primary-light">Available</span>
                    </div>
                </div>

                {/* Profile Content */}
                <div className="max-w-md mx-auto  rounded-lg p-8 dark:text-primary-light">
                    {/* Accordion content */}
                    <div className="w-full max-w-md bg-[#F9FAFA] rounded shadow dark:bg-primary-light/15 ">
                        {/* User Info Section */}
                        <div className="border-b border-gray-300">
                            <button
                                className="w-full px-4 py-3 flex justify-between items-center"
                                onClick={() => setUserInfoOpen(!userInfoOpen)}
                            >
                                <div className="flex items-center space-x-2">
                                    {/* <CgProfile /> */}
                                    <span className="text-lg font-medium ">Personal Info</span>
                                </div>
                                {userInfoOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                            </button>

                            {userInfoOpen && (
                                <div className="px-4 pb-4 pt-1">
                                    <div className="mb-4">

                                        <p className="text-gray-400 text-sm">Name</p>
                                        {editingField === 'name' ? (
                                            <input
                                                type="text"
                                                name="name"
                                                value={tempData.name}
                                                onChange={handleInputChange}
                                                onBlur={() => handleSaveField('name')}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleSaveField('name');
                                                    }
                                                }}
                                                className="w-full p-2 ps-0 border-b border-gray-300 focus:outline-none focus:ring-0 focus:ring-transparent dark:bg-transparent dark:text-primary-light"
                                                autoFocus
                                            />
                                        ) : (
                                            <div className='relative'>

                                                <p className="text-black font-semibold dark:text-primary-light">{profileData.name}</p>
                                                <div className="flex justify-between items-center absolute top-1/2 right-0 -translate-y-1/2">
                                                    <button
                                                        onClick={() => handleEditField('name')}
                                                        className="text-black dark:text-white flex items-center gap-2"
                                                    >
                                                        <MdModeEdit size={16} />

                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-gray-400 text-sm">About</p>
                                        {editingField === 'bio' ? (
                                            <input
                                                type="text"
                                                name="bio"
                                                value={tempData.bio}
                                                onChange={handleInputChange}
                                                onBlur={() => handleSaveField('bio')}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleSaveField('bio');
                                                    }
                                                }}
                                                className="w-full p-2 ps-0 border-b border-gray-300 focus:outline-none focus:ring-0 focus:ring-transparent dark:bg-transparent dark:text-primary-light"
                                                autoFocus
                                            />
                                        ) : (
                                            <div className='relative'>

                                                <p className="text-black font-semibold dark:text-primary-light">{profileData.bio || "Add bio"}</p>
                                                <div className="flex justify-between items-center absolute top-1/2 right-0 -translate-y-1/2">
                                                    <button
                                                        onClick={() => handleEditField('bio')}
                                                        className="text-black dark:text-white flex items-center gap-2"
                                                    >
                                                        <MdModeEdit size={16} />

                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-gray-400 text-sm">Email</p>
                                        <p className="text-black font-semibold dark:text-primary-light">{profileData.email}</p>
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
                                    <span className="font-medium">Privacy</span>
                                </div>
                                {filesOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                            </button>

                            {/* profile photo */}
                            {filesOpen && (
                                <div className='px-4 pb-4 pt-1 relative'>
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-gray-400 text-sm">Profile Photo</p>
                                        <div className="relative inline-block text-left" ref={privacyDropdownRef}>
                                            <div>
                                                <button
                                                    type="button"
                                                    className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-1 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
                                                    id="options-menu"
                                                    aria-haspopup="true"
                                                    aria-expanded={privacyDropdownOpen}
                                                    onClick={() => setPrivacyDropdownOpen(!privacyDropdownOpen)}
                                                >
                                                    {profilePhotoPrivacy}
                                                    {privacyDropdownOpen ? <FaChevronUp className="-mr-1 ml-2 h-5 w-5" /> : <FaChevronDown className="-mr-1 ml-2 h-5 w-5" />}
                                                </button>
                                            </div>

                                            {privacyDropdownOpen && (
                                                <div
                                                    className="origin-top-right absolute right-0 mt-2 w-36 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 z-10"
                                                    role="menu"
                                                    aria-orientation="vertical"
                                                    aria-labelledby="options-menu"
                                                >
                                                    <div className="py-1 z-50" role="none">
                                                        {['Everyone', 'Nobody'].map((option) => (
                                                            <button
                                                                key={option}
                                                                onClick={() => {
                                                                    setProfilePhotoPrivacy(option);
                                                                    setPrivacyDropdownOpen(false);
                                                                    dispatch(updateUserProfilePhotoPrivacy({ id: user._id, profilePhoto: option }));
                                                                }}
                                                                  className={`${profilePhotoPrivacy === option ? 'bg-gray-100 dark:bg-gray-700' : ''
                                                                    } block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white`}
                                                                role="menuitem"
                                                            >
                                                                {option}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* groups */}
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-gray-400 text-sm">Groups</p>
                                        <div className="relative inline-block text-left" ref={groupsDropdownRef}>
                                            <div>
                                                <button
                                                    type="button"
                                                    className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-1 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
                                                    id="options-menu"
                                                    aria-haspopup="true"
                                                    aria-expanded={groupsPrivacyDropdownOpen}
                                                    onClick={() => setGroupsPrivacyDropdownOpen(!groupsPrivacyDropdownOpen)}
                                                >
                                                    {groupsPrivacy}
                                                    {groupsPrivacyDropdownOpen ? <FaChevronUp className="-mr-1 ml-2 h-5 w-5" /> : <FaChevronDown className="-mr-1 ml-2 h-5 w-5" />}
                                                </button>
                                            </div>

                                            {groupsPrivacyDropdownOpen && (
                                                <div
                                                    className="origin-top-right absolute right-0 mt-2 w-36 rounded-md shadow-lg bg-white dark:bg-gray-800"
                                                    role="menu"
                                                    aria-orientation="vertical"
                                                    aria-labelledby="options-menu"
                                                >
                                                    <div className="py-1 z-50" role="none">
                                                        {['Everyone', 'Nobody'].map((option) => (
                                                            <button
                                                                key={option}
                                                                onClick={() => {
                                                                    setGroupsPrivacy(option);
                                                                    setGroupsPrivacyDropdownOpen(false);
                                                                    dispatch(updateUserGroupToJoin({ id: user._id, groupToJoin: option }));
                                                                }}
                                                                className={`${groupsPrivacy === option ? 'bg-gray-100 dark:bg-gray-700' : ''
                                                                    } block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white`}
                                                                role="menuitem"
                                                            >
                                                                {option}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
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

                        {/* Notifications Section */}
                        {/* <div className="border-b border-gray-300">
                            <button
                                className="w-full px-4 py-3 flex justify-between items-center"
                                onClick={() => setNotificationsOpen(!notificationsOpen)}
                            >
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium">Security</span>
                                </div>
                                {notificationsOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                            </button>

                            {notificationsOpen && (
                                <div className='px-4 pb-4 pt-1 relative'>
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-gray-400 text-sm">Show security notification</p>
                                        <div className="relative inline-block text-left">
                                            <button
                                                type="button"
                                                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
                                                onClick={() => setLastSeenPrivacy(!lastSeenPrivacy)}
                                            >
                                                {lastSeenPrivacy ? 'On' : 'Off'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div> */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Setting; 