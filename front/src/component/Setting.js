import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaChevronDown, FaChevronUp, FaPaperclip, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';
import { CgProfile } from "react-icons/cg";
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { IMG_URL } from '../utils/baseUrl';
import { updateUser } from '../redux/slice/user.slice';

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
    const [privacyDropdownOpen, setPrivacyDropdownOpen] = useState(false);
    const [lastSeenPrivacy, setLastSeenPrivacy] = useState(true);

    // Determine which user ID to use (from props, URL params, or current user)
    const targetUserId = urlUserId || (currentUser ? currentUser._id : null);

    const [profileData, setProfileData] = useState({
        name: 'User',
        email: '',
        phone: '',
        bio: 'No bio available',
        profileImage: 'https://via.placeholder.com/150',
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
                        name: userData.userName || 'User',
                        email: userData.email || '',
                        phone: userData.phone || '',
                        bio: userData.bio || 'No bio available',
                        profileImage: userData.photo ? `${IMG_URL}${userData.photo.replace(/\\/g, "/")}` : 'https://via.placeholder.com/150',
                    });
                    setTempData({
                        name: userData.userName || 'User',
                        email: userData.email || '',
                        phone: userData.phone || '',
                        bio: userData.bio || 'No bio available',
                        profileImage: userData.photo ? `${IMG_URL}${userData.photo.replace(/\\/g, "/")}` : 'https://via.placeholder.com/150',
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
                name: currentUser.userName || 'User',
                email: currentUser.email || '',
                phone: currentUser.phone || '',
                bio: currentUser.bio || 'No bio available',
                profileImage: currentUser.photo ? `${IMG_URL}${currentUser.photo.replace(/\\/g, "/")}` : 'https://via.placeholder.com/150',
            });
            setTempData({
                name: currentUser.userName || 'User',
                email: currentUser.email || '',
                phone: currentUser.phone || '',
                bio: currentUser.bio || 'No bio available',
                profileImage: currentUser.photo ? `${IMG_URL}${currentUser.photo.replace(/\\/g, "/")}` : 'https://via.placeholder.com/150',
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

            // If onBack is provided, call it after saving
            // if (onBack) {
            //     onBack();
            // }
        } catch (error) {
            console.error('Error updating profile:', error);
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);

        // // If onBack is provided, call it when canceling
        // if (onBack) {
        //     onBack();
        // }
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

    const handleEditField = (fieldName) => {
        setEditingField(fieldName);
        setTempData({ ...profileData });
    };

    const handleSaveField = async (fieldName) => {
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

            setEditingField(null);
            setIsLoading(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            setIsLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingField(null);
    };

    return (
        <div className="w-[380px] bg-[#F7F7F7] dark:bg-primary-dark/95 h-full shadow-sm relative">
            <div>
                <div className="p-4 pb-2 flex items-center">
                    <h1 className="text-lg font-semibold text-gray-800 dark:text-primary-light">Settings</h1>
                </div>
            </div>
            <div className="bg-[#F5F7FB] overflow-hidden dark:bg-primary-dark/95 h-[100vh]">
                {/* Profile Header */}
                <div className="flex flex-col items-center justify-center p-6 bg-[#F5F7FB] rounded-lg shadow-sm max-w-xs mx-auto dark:bg-primary-dark/95">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-pink-100 overflow-hidden mb-3">
                            <img src={profileData.profileImage} alt="Profile" />
                        </div>
                    </div>

                    <h2 className="text-lg font-medium text-gray-800 dark:text-primary-light mt-2">{profileData.name}</h2>

                    <div className="flex items-center mt-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-sm text-gray-500 dark:text-primary-light">Available</span>
                    </div>
                </div>

                {/* Profile Content */}
                <div className="max-w-md mx-auto bg-[#F5F7FB] rounded-lg shadow-sm p-8 dark:bg-primary-dark/95 dark:text-primary-light">
                    {/* Main accordion header */}
                    <div
                        className="p-4 cursor-pointer flex items-center justify-between"
                        onClick={toggleAccordion}
                    >
                    </div>

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
                                    <span className="font-medium ">Personal Info</span>
                                </div>
                                {userInfoOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                            </button>

                            {userInfoOpen && (
                                <div className="px-4 pb-4 pt-1">
                                    <div className="mb-4">
                                        <div className="flex justify-between items-center">
                                            <p className="text-gray-400 text-sm">Name</p>
                                            {editingField === 'name' ? (
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleSaveField('name')}
                                                        className="text-green-500 hover:text-green-600"
                                                        disabled={isLoading}
                                                    >
                                                        <FaCheck size={16} />
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="text-red-500 hover:text-red-600"
                                                    >
                                                        <FaTimes size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleEditField('name')}
                                                    className="text-black dark:text-white flex items-center gap-2"
                                                >
                                                    <FaEdit size={16} />
                                                    Edit
                                                </button>
                                            )}
                                        </div>
                                        {editingField === 'name' ? (
                                            <input
                                                type="text"
                                                name="name"
                                                value={tempData.name}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-primary-dark/80 dark:text-primary-light"
                                                autoFocus
                                            />
                                        ) : (
                                            <p className="text-black font-semibold dark:text-primary-light">{profileData.name}</p>
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

                            {filesOpen && (
                                <div className='px-4 pb-4 pt-1 relative'>
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-gray-400 text-sm">Profile Photo</p>
                                        <div className="relative inline-block text-left">
                                            <div>
                                                <button
                                                    type="button"
                                                    className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-1 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
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
                                                    className="origin-top-right absolute right-0 mt-2 w-36 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800"
                                                    role="menu"
                                                    aria-orientation="vertical"
                                                    aria-labelledby="options-menu"
                                                >
                                                    <div className="py-1 z-50" role="none">
                                                        {['Everyone', 'Selected', 'Nobody'].map((option) => (
                                                            <button
                                                                key={option}
                                                                onClick={() => {
                                                                    setProfilePhotoPrivacy(option);
                                                                    setPrivacyDropdownOpen(false);
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

                                    {/* <div className="flex justify-between items-center mb-2">
                                        <p className="text-gray-400 text-sm">Last Seen</p>
                                        <div className="relative inline-block text-left">
                                            <button
                                                type="button"
                                                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
                                                onClick={() => setLastSeenPrivacy(!lastSeenPrivacy)}
                                            >
                                                {lastSeenPrivacy ? 'On' : 'Off'}
                                            </button>
                                        </div>
                                    </div> */}

                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-gray-400 text-sm">Groups</p>
                                        <div className="relative inline-block text-left">
                                            <div>
                                                <button
                                                    type="button"
                                                    className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-1 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
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
                                                    className="origin-top-right absolute right-0 mt-2 w-36 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800"
                                                    role="menu"
                                                    aria-orientation="vertical"
                                                    aria-labelledby="options-menu"
                                                >
                                                    <div className="py-1 z-50" role="none">
                                                        {['Everyone', 'Selected', 'Nobody'].map((option) => (
                                                            <button
                                                                key={option}
                                                                onClick={() => {
                                                                    setProfilePhotoPrivacy(option);
                                                                    setPrivacyDropdownOpen(false);
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
                                </div>
                            )}
                        </div>

                        {/* Notifications Section */}
                        <div className="border-b border-gray-300">
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Setting; 