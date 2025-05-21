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

    selectedChatModule: true,
    showProfile: false,
    showSettings: false,
    showGroups: false,
    showCallHistory: false,
    isGroupModalOpen: false,
    isModalOpen: false,
    isGroupCreateModalOpen: false,
    isUserProfileModalOpen: false,
    showLeftSidebar: true
  };

  const manageStateSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
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
    


    },
  });
  
  export const {
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
  } = manageStateSlice.actions;
  export default manageStateSlice.reducer;