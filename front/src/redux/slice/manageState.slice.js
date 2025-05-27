import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

  const initialState = {
    remoteStreams: new Map(),
    participants: [],
    callParticipantsList: {},
    // New states from useSocket
    isConnected: false,
    onlineUsers: [],
    isReceiving: false,
    incomingCall: null,
    isVideoCalling: false,
    isVoiceCalling: false,
    incomingShare: null,
    isSharing: false,
    isCameraOn: false,
    isMicrophoneOn: false,
    voiceCallData: null,
    cameraStatus: {},
    callParticipants: new Set(),
    selectedImage: null,
    participantOpen: false,
    
    isImageModalOpen: false,
    selectedChatModule: true,
    showProfile: false,
    showSettings: false,
    showGroups: false,
    showCallHistory: false,
    isGroupModalOpen: false,
    isModalOpen: false,
    isGroupCreateModalOpen: false,
    isUserProfileModalOpen: false,
    showLeftSidebar: true,
    selectedChat: null,
    uploadProgress: {},
    selectedFiles: [],
    replyingTo: null,
    typingUsers: [],
    searchInputbox: "",
    cameraStream: null,
    openCameraState: false,
    backCameraAvailable: false,
    facingMode: "user",
    isSearchBoxOpen: false,
    messageInput: "",
    editingMessage: null,
  };

  const manageStateSlice = createSlice({
    name: "user",
    initialState,
    reducers: {

      setSelectedChat:(state, action) => {
        state.selectedChat = action.payload;
      },
      setRemoteStreams: (state, action) => {
        state.remoteStreams = action.payload;
      },
      setParticipants: (state, action) => {
        state.participants = action.payload;
      },
      updateParticipant: (state, action) => { 
        const { userId, stream } = action.payload;
        const allStreams = new Map(state.participants);

         console.log(allStreams);
        allStreams.set(userId, stream);
        state.participants = Array.from(allStreams);
      },
      removeParticipant: (state, action) => {
        const userId = action.payload;
        const allStreams = new Map(state.participants);
        allStreams.delete(userId)
        state.participants = Array.from(allStreams);
      },
      setCallParticipantsList: (state, action) => {
        state.callParticipantsList = action.payload;
      },
       // New reducers for socket states
    setIsConnected: (state, action) => {
      state.isConnected =  !state.isConnected;
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
    setIsReceiving: (state, action) => {
      state.isReceiving = action.payload;
    },
    setIncomingCall: (state, action) => {
      state.incomingCall = action.payload;
    },
    setIsVideoCalling: (state, action) => {
      state.isVideoCalling = action.payload;
    },
    setIsVoiceCalling: (state, action) => {
      state.isVoiceCalling =  action.payload;
    },
    setIncomingShare: (state, action) => {
      state.incomingShare = action.payload;
    },
    setIsSharing: (state, action) => {
      state.isSharing = action.payload;
    },
    setIsCameraOn: (state, action) => {
      state.isCameraOn = !state.isCameraOn;
    },
    setIsMicrophoneOn: (state, action) => {
      state.isMicrophoneOn = !state.isMicrophoneOn;
    },
    setVoiceCallData: (state, action) => {
      state.voiceCallData = action.payload;
    },
    setCameraStatus: (state, action) => {
      state.cameraStatus = action.payload;
    },
    setCallParticipants: (state, action) => {
      state.callParticipants = action.payload;
    },
    setSelectedChatModule: (state, action) => {
      state.selectedChatModule = action.payload;
    },
    setShowProfile: (state, action) => {
      state.showProfile = action.payload;
    },
    setShowSettings: (state, action) => {
      state.showSettings = action.payload;
    },
    setShowGroups: (state, action) => {
      state.showGroups = action.payload;
    },
    setShowCallHistory: (state, action) => {
      state.showCallHistory = action.payload;
    },
    setIsGroupModalOpen: (state, action) => {
      state.isGroupModalOpen = action.payload;
    },
    setIsModalOpen: (state, action) => {
      state.isModalOpen = action.payload;
    },
    setIsGroupCreateModalOpen: (state, action) => {
      state.isGroupCreateModalOpen = action.payload;
    },
    setIsUserProfileModalOpen: (state, action) => {
      state.isUserProfileModalOpen = action.payload;
    },
    setShowLeftSidebar: (state, action) => {
      state.showLeftSidebar = action.payload;
    },
    setIsImageModalOpen: (state, action) => {
      state.isImageModalOpen = action.payload;
    },
    setSelectedImage : (state, action)=>{
      state.selectedImage = action.payload;
    },
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
    setSelectedFiles: (state, action) => {
      state.selectedFiles = action.payload;
    },
    setReplyingTo: (state, action) => {
      state.replyingTo = action.payload;
    },
    setTypingUsers: (state, action) => {
      state.typingUsers = action.payload;
    },
    setParticipantOpen: (state, action) => {
      state.participantOpen = action.payload;
    },
    setSearchInputbox: (state, action) => {
      state.searchInputbox = action.payload;
    },
    setCameraStream: (state, action) => {
      state.cameraStream = action.payload;
    },
    setOpenCameraState: (state, action) => {
      state.openCameraState = action.payload;
    },
    setBackCameraAvailable: (state, action) => {
      state.backCameraAvailable = action.payload;
    },
    setFacingMode: (state, action) => {
      state.facingMode = action.payload;
    },
    setIsSearchBoxOpen: (state, action) => {
      state.isSearchBoxOpen = action.payload;
    },
    setMessageInput: (state, action) => {
      state.messageInput = action.payload;
    },
    setEditingMessage: (state, action) => {
      state.editingMessage = action.payload;
    },
    },
  });
  
  export const {
    setSelectedChat,
    setRemoteStreams,
    setParticipants,
    updateParticipant,
    removeParticipant,
    setCallParticipantsList,
    setIsConnected,
    setOnlineUsers,
    setIsReceiving,
    setIncomingCall,
    setIsVideoCalling,
    setIsVoiceCalling,
    setIncomingShare,
    setIsSharing,
    setIsCameraOn,
    setIsMicrophoneOn,
    setVoiceCallData,
    setCameraStatus,
    setCallParticipants,
    setSelectedChatModule,
    setShowProfile,
    setShowSettings,
    setShowGroups,
    setShowCallHistory,
    setIsGroupModalOpen,
    setIsModalOpen,
    setIsGroupCreateModalOpen,
    setIsUserProfileModalOpen,
    setShowLeftSidebar,
    setIsImageModalOpen,
    setSelectedImage,
    setUploadProgress,
    setSelectedFiles,
    setReplyingTo,
    setTypingUsers,
    setParticipantOpen,
    setSearchInputbox,
    setCameraStream,
    setOpenCameraState,
    setBackCameraAvailable,
    setFacingMode,
    setIsSearchBoxOpen,
    setMessageInput,
    setEditingMessage,
  } = manageStateSlice.actions;
  export default manageStateSlice.reducer;