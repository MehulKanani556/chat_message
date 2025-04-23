import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaChevronDown, FaChevronUp, FaPaperclip, FaEdit, FaCheck, FaTimes, FaChevronLeft } from 'react-icons/fa';
import { CgProfile } from "react-icons/cg";
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { IMG_URL } from '../utils/baseUrl';
import { updateUser, updateUserGroupToJoin, updateUserProfilePhotoPrivacy } from '../redux/slice/user.slice';
import { MdEdit, MdModeEdit } from 'react-icons/md';
import ColorPicker from "./ColorPicker";
import { initializePrimaryColor } from "../utils/themeUtils";
import { ImImages } from 'react-icons/im';
import { SlPencil } from "react-icons/sl";
// import styled from 'styled-components';
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
    const [isToggled, setIsToggled] = useState(false);

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
        mobileNumber:''
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
                    console.log(response.data)

                    setUser(userData);
                    setProfileData({
                        name: userData.userName || '',
                        email: userData.email || '',
                        phone: userData.phone || '',
                        mobileNumber: userData.mobileNumber || '',
                        bio: userData.bio || '',

                        profileImage: userData.photo ? `${IMG_URL}${userData.photo.replace(/\\/g, "/")}` : '',
                    });
                    setTempData({
                        name: userData.userName || '',
                        email: userData.email || '',
                        phone: userData.phone || '',
                        bio: userData.bio || '',
                        mobileNumber: userData.mobileNumber || '',

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
                mobileNumber: currentUser.mobileNumber || '',

                profileImage: currentUser.photo ? `${IMG_URL}${currentUser.photo.replace(/\\/g, "/")}` : '',
            });
            setTempData({
                name: currentUser.userName || '',
                email: currentUser.email || '',
                phone: currentUser.phone || '',
                bio: currentUser.bio || '',
                mobileNumber: currentUser.mobileNumber || '',

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


    const handleToggle = (notification) => {
        setIsToggled(!isToggled);
        dispatch(updateUser({ id: user._id, values: { notification: isToggled } }))
    };

    return (
        <div className="w-full bg-primary-dark/5 dark:bg-primary-dark/90 h-full  relative"
            style={{
                boxShadow: "inset 0 0 5px 0 rgba(0, 0, 0, 0.1)"
            }}>
            <div>
                <div className="p-4 pb-2 flex gap-2 items-center text-gray-800 dark:text-primary-light">
                    <FaChevronLeft className='cursor-pointer' onClick={() => {
                        const event = new CustomEvent('showChatList');
                        window.dispatchEvent(event);
                    }} />
                    <h1 className="text-lg font-semibold ">Profile</h1>
                </div>
            </div>
            <div className="">
                {/* Profile Header */}
                <div className="flex flex-col items-center justify-center p-6  rounded-lg max-w-xs mx-auto">
                    <div className="relative group">
                        <div className="relative w-24 h-24 rounded-full bg-gray-300  mt-4">
                            {profileData.profileImage && profileData.profileImage !== "null" ? (
                                <img
                                    src={profileData.profileImage}
                                    alt="Profile"
                                    className="cursor-pointer object-cover w-full h-full rounded-full"
                                />
                            ) : (
                                <div className="text-gray-900 text-lg font-bold flex w-24 h-24 justify-center items-center">
                                    <ImImages />
                                </div>
                            )}

                            <input
                                type="file"
                                id="profileImageInput"
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                            <div
                                onClick={() => document.getElementById("profileImageInput").click()}
                                className="cursor-pointer absolute bottom-0 right-0 z-50 dark:text-white text-white flex items-center justify-center  bg-gray-400 dark:bg-gray-500 hover:dark:bg-gray-400 w-8 h-8 rounded-full transition-opacity duration-200"
                            >
                                <svg
                                    width="17"
                                    height="17"
                                    viewBox="0 0 17 17"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <g clip-path="url(#clip0_62_16)">
                                        <path
                                            fill-rule="evenodd"
                                            clip-rule="evenodd"
                                            d="M12.8511 2.66699V5.33366C12.8511 5.46627 12.9038 5.59344 12.9975 5.68721C13.0913 5.78098 13.2185 5.83366 13.3511 5.83366C13.4837 5.83366 13.6109 5.78098 13.7046 5.68721C13.7984 5.59344 13.8511 5.46627 13.8511 5.33366V2.66699C13.8511 2.53438 13.7984 2.40721 13.7046 2.31344C13.6109 2.21967 13.4837 2.16699 13.3511 2.16699C13.2185 2.16699 13.0913 2.21967 12.9975 2.31344C12.9038 2.40721 12.8511 2.53438 12.8511 2.66699Z"
                                            fill="currentColor"
                                        />
                                        <path
                                            fill-rule="evenodd"
                                            clip-rule="evenodd"
                                            d="M12.0176 4.5H14.6842C14.8169 4.5 14.944 4.44732 15.0378 4.35355C15.1316 4.25979 15.1842 4.13261 15.1842 4C15.1842 3.86739 15.1316 3.74021 15.0378 3.64645C14.944 3.55268 14.8169 3.5 14.6842 3.5H12.0176C11.885 3.5 11.7578 3.55268 11.664 3.64645C11.5703 3.74021 11.5176 3.86739 11.5176 4C11.5176 4.13261 11.5703 4.25979 11.664 4.35355C11.7578 4.44732 11.885 4.5 12.0176 4.5Z"
                                            fill="currentColor"
                                        />
                                        <path
                                            fill-rule="evenodd"
                                            clip-rule="evenodd"
                                            d="M9.35107 2.5H6.09641C5.8798 2.50001 5.66747 2.56032 5.4832 2.67418C5.29893 2.78804 5.14999 2.95095 5.05307 3.14467L4.42174 4.408C4.40774 4.4356 4.38639 4.4588 4.36003 4.47504C4.33368 4.49127 4.30336 4.49991 4.27241 4.5H2.68441C2.19818 4.5 1.73186 4.69315 1.38805 5.03697C1.04423 5.38079 0.851074 5.8471 0.851074 6.33333V13C0.851074 13.486 1.04441 13.9527 1.38774 14.2967C1.73189 14.6401 2.19819 14.8331 2.68441 14.8333H13.3511C13.8371 14.8333 14.3037 14.64 14.6477 14.2967C14.9912 13.9525 15.1842 13.4862 15.1844 13V7.33333C15.1844 7.20073 15.1317 7.07355 15.038 6.97978C14.9442 6.88601 14.817 6.83333 14.6844 6.83333C14.5518 6.83333 14.4246 6.88601 14.3309 6.97978C14.2371 7.07355 14.1844 7.20073 14.1844 7.33333V13C14.1841 13.2209 14.0961 13.4327 13.9399 13.5889C13.7837 13.7451 13.572 13.833 13.3511 13.8333H2.68441C2.4635 13.833 2.25175 13.7451 2.09554 13.5889C1.93934 13.4327 1.85143 13.2209 1.85107 13V6.33333C1.85107 5.87333 2.22441 5.5 2.68441 5.5H4.27241C4.48902 5.49999 4.70135 5.43968 4.88562 5.32582C5.06989 5.21196 5.21882 5.04905 5.31574 4.85533L5.94707 3.592C5.96108 3.5644 5.98243 3.5412 6.00878 3.52496C6.03513 3.50873 6.06546 3.50009 6.09641 3.5H9.35107C9.48368 3.5 9.61086 3.44732 9.70463 3.35355C9.7984 3.25979 9.85107 3.13261 9.85107 3C9.85107 2.86739 9.7984 2.74021 9.70463 2.64645C9.61086 2.55268 9.48368 2.5 9.35107 2.5Z"
                                            fill="currentColor"
                                        />
                                        <path
                                            fill-rule="evenodd"
                                            clip-rule="evenodd"
                                            d="M8.01774 6.16699C6.26974 6.16699 4.85107 7.58566 4.85107 9.33366C4.85107 11.0817 6.26974 12.5003 8.01774 12.5003C9.76574 12.5003 11.1844 11.0817 11.1844 9.33366C11.1844 7.58566 9.76574 6.16699 8.01774 6.16699ZM8.01774 7.16699C8.58307 7.18102 9.12053 7.41545 9.51541 7.82025C9.91029 8.22505 10.1313 8.76815 10.1313 9.33366C10.1313 9.89916 9.91029 10.4423 9.51541 10.8471C9.12053 11.2519 8.58307 11.4863 8.01774 11.5003C7.45241 11.4863 6.91495 11.2519 6.52007 10.8471C6.12519 10.4423 5.90416 9.89916 5.90416 9.33366C5.90416 8.76815 6.12519 8.22505 6.52007 7.82025C6.91495 7.41545 7.45241 7.18102 8.01774 7.16699Z"
                                            fill="currentColor"
                                        />
                                    </g>
                                </svg>
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
                        <span className="text-sm text-gray-500 dark:text-primary-light">Online</span>
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
                                                        <SlPencil size={16} />

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
                                                        <SlPencil size={16} />

                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-gray-400 text-sm">Email</p>
                                        <p className="text-black font-semibold dark:text-primary-light">{profileData.email}</p>
                                    </div>
                                    <div className="mb-4">
                                        <p className="text-gray-400 text-sm">Mobile Number</p>
                                        <p className="text-black font-semibold dark:text-primary-light">{profileData.mobileNumber}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Files Section */}
                        <div className="border-b border-gray-300">
                            <button
                                className="w-full px-4 py-3 flex justify-between items-center"
                                onClick={() => setFilesOpen(!filesOpen)}
                            >
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium text-lg">Privacy</span>
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
                                                    className="inline-flex justify-center w-full items-start rounded-md  shadow-sm px-4 py-1 pr-1  text-sm font-medium  dark:text-gray-200"
                                                    id="options-menu"
                                                    aria-haspopup="true"
                                                    aria-expanded={privacyDropdownOpen}
                                                    onClick={() => setPrivacyDropdownOpen(!privacyDropdownOpen)}
                                                >
                                                    {profilePhotoPrivacy}
                                                    {privacyDropdownOpen ? <FaChevronUp className="-mr-1 ml-2 my-auto " /> : <FaChevronDown className="-mr-1 ml-2  my-auto" />}
                                                </button>
                                            </div>

                                            {privacyDropdownOpen && (
                                                <div
                                                    className="origin-top-right absolute right-0 mt-2 w-36 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-primary-dark z-10"
                                                    role="menu"
                                                    aria-orientation="vertical"
                                                    aria-labelledby="options-menu"
                                                >
                                                    <div className="p-1 z-50" role="none">
                                                        {['Everyone', 'Nobody'].map((option) => (
                                                            <button
                                                                key={option}
                                                                onClick={() => {
                                                                    setProfilePhotoPrivacy(option);
                                                                    setPrivacyDropdownOpen(false);
                                                                    dispatch(updateUserProfilePhotoPrivacy({ id: user._id, profilePhoto: option }));
                                                                }}
                                                                className={`${profilePhotoPrivacy === option ? 'bg-gray-100 dark:bg-gray-700' : ''
                                                                    } block w-full rounded-md mb-1 text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700`}
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
                                                    className="inline-flex justify-center w-full items-start rounded-md  shadow-sm px-4 pr-1 py-1  text-sm font-medium  dark:text-gray-200"
                                                    id="options-menu"
                                                    aria-haspopup="true"
                                                    aria-expanded={groupsPrivacyDropdownOpen}
                                                    onClick={() => setGroupsPrivacyDropdownOpen(!groupsPrivacyDropdownOpen)}
                                                >
                                                    {groupsPrivacy}
                                                    {groupsPrivacyDropdownOpen ? <FaChevronUp className="-mr-1 ml-2 my-auto" /> : <FaChevronDown className="-mr-1 ml-2 my-auto" />}
                                                </button>
                                            </div>

                                            {groupsPrivacyDropdownOpen && (
                                                <div
                                                    className="origin-top-right absolute right-0 mt-2 w-36 rounded-md shadow-lg bg-white dark:bg-primary-dark z-10"
                                                    role="menu"
                                                    aria-orientation="vertical"
                                                    aria-labelledby="options-menu"
                                                >
                                                    <div className="p-1 z-50" role="none">
                                                        {['Everyone', 'Nobody'].map((option) => (
                                                            <button
                                                                key={option}
                                                                onClick={() => {
                                                                    setGroupsPrivacy(option);
                                                                    setGroupsPrivacyDropdownOpen(false);
                                                                    dispatch(updateUserGroupToJoin({ id: user._id, groupToJoin: option }));
                                                                }}
                                                                className={`${groupsPrivacy === option ? 'bg-gray-100 dark:bg-gray-700' : ''
                                                                    } block w-full rounded-md mb-1 text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700`}
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
                                    {/* Notofication */}
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-gray-400 text-sm">Notification</p>
                                        <div>
                                            <label className="inline-flex items-end cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={currentUser?.notification}
                                                    onChange={() => handleToggle(currentUser?.notification)}
                                                    className="sr-only peer"
                                                />
                                                <div
                                                    className={`relative w-[30px] h-[17px] rounded-full transition-colors duration-200 ${currentUser?.notification
                                                        ? "bg-primary"
                                                        : "bg-gray-500"
                                                        }`}
                                                >
                                                    <div
                                                        className={`absolute top-0.5 left-0.5 w-[13px] h-[13px] rounded-full transition-transform duration-200 ${currentUser?.notification
                                                            ? "translate-x-[13px] bg-white"
                                                            : "bg-white"
                                                            }`}
                                                    ></div>
                                                </div>
                                            </label>

                                        </div>
                                    </div>
                                </div>
                            )}


                        </div>
                        {/* Theme Color Section */}
                        <div className="">
                            <button
                                className="w-full px-4 py-3 flex justify-between items-center"
                                onClick={toggleColorPicker}
                            >
                                <div className="flex items-center space-x-2">
                                    <span className="w-4 h-4 rounded-full bg-primary"></span>
                                    <span className=" text-lg font-medium">Theme Color</span>
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