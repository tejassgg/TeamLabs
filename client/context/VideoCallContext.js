import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import { getSocket } from '../services/socket';

// Video call state reducer
const videoCallReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CALL_STATE':
      return {
        ...state,
        ...action.payload
      };
    
    case 'SET_CALL_DATA':
      return {
        ...state,
        callData: action.payload,
        showModal: true
      };
    
    case 'SET_CALL_TYPE':
      return {
        ...state,
        callType: action.payload
      };
    
    case 'SET_ANSWER_DATA':
      return {
        ...state,
        answerData: action.payload
      };
    
    case 'CLEAR_CALL':
      return {
        ...state,
        showModal: false,
        callType: null,
        callData: null,
        answerData: null,
        activeCall: null
      };
    
    case 'SET_ACTIVE_CALL':
      return {
        ...state,
        activeCall: action.payload
      };
    
    case 'UPDATE_CALL_STATUS':
      return {
        ...state,
        callStatus: action.payload
      };
    
    default:
      return state;
  }
};

// Initial state
const initialState = {
  showModal: false,
  callType: null, // 'incoming', 'outgoing', 'active'
  callData: null,
  answerData: null,
  activeCall: null,
  callStatus: 'idle'
};

// Create context
const VideoCallContext = createContext();

// Provider component
export const VideoCallProvider = ({ children }) => {
  const [state, dispatch] = useReducer(videoCallReducer, initialState);
  const socketRef = useRef(null);

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    if (!socketRef.current) {
      socketRef.current = getSocket();
    }
    return socketRef.current;
  }, []);

  // Handle incoming call
  const handleIncomingCall = useCallback((callData) => {
    dispatch({
      type: 'SET_CALL_STATE',
      payload: {
        showModal: true,
        callType: 'incoming',
        callData,
        callStatus: 'incoming'
      }
    });
  }, []);

  // Handle outgoing call
  const handleOutgoingCall = useCallback((recipientId, conversationId, currentUser) => {
    const callData = {
      recipientId,
      conversationId,
      callerId: currentUser._id,
      callerName: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
      type: 'video'
    };

    dispatch({
      type: 'SET_CALL_STATE',
      payload: {
        showModal: true,
        callType: 'outgoing',
        callData,
        callStatus: 'initiating'
      }
    });
  }, []);

  // Handle call answered
  const handleCallAnswered = useCallback((answerData) => {
    dispatch({
      type: 'SET_ANSWER_DATA',
      payload: answerData
    });
  }, []);

  // Handle call declined
  const handleCallDeclined = useCallback(() => {
    dispatch({
      type: 'CLEAR_CALL'
    });
  }, []);

  // Handle call ended
  const handleCallEnded = useCallback(() => {
    dispatch({
      type: 'CLEAR_CALL'
    });
  }, []);

  // Handle call initiated
  const handleCallInitiated = useCallback((callData) => {
    dispatch({
      type: 'SET_CALL_STATE',
      payload: {
        callStatus: 'initiated'
      }
    });
  }, []);

  // Handle ICE candidate
  const handleIceCandidate = useCallback((candidateData) => {
    // This will be handled by the WebRTC hook
    // console.log('ICE candidate received:', candidateData);
  }, []);

  // Close modal
  const closeModal = useCallback(() => {
    dispatch({
      type: 'CLEAR_CALL'
    });
  }, []);

  // Set active call
  const setActiveCall = useCallback((call) => {
    dispatch({
      type: 'SET_ACTIVE_CALL',
      payload: call
    });
  }, []);

  // Update call status
  const updateCallStatus = useCallback((status) => {
    dispatch({
      type: 'UPDATE_CALL_STATUS',
      payload: status
    });
  }, []);

  // Context value
  const contextValue = {
    // State
    ...state,
    
    // Actions
    handleIncomingCall,
    handleOutgoingCall,
    handleCallAnswered,
    handleCallDeclined,
    handleCallEnded,
    handleCallInitiated,
    handleIceCandidate,
    closeModal,
    setActiveCall,
    updateCallStatus,
    
    // Utilities
    initializeSocket
  };

  return (
    <VideoCallContext.Provider value={contextValue}>
      {children}
    </VideoCallContext.Provider>
  );
};

// Custom hook to use video call context
export const useVideoCall = () => {
  const context = useContext(VideoCallContext);
  if (!context) {
    throw new Error('useVideoCall must be used within a VideoCallProvider');
  }
  return context;
};

// Hook for managing call subscriptions
export const useCallSubscriptions = (conversationId) => {
  const {
    handleIncomingCall,
    handleCallAnswered,
    handleCallDeclined,
    handleCallEnded,
    handleCallInitiated,
    handleIceCandidate
  } = useVideoCall();

  const socketRef = useRef(null);

  // Subscribe to call events
  const subscribeToCallEvents = useCallback(() => {
    if (!conversationId) return;

    const socket = getSocket();
    if (!socket) return;

    socketRef.current = socket;

    // Incoming call
    const offCallIncoming = socket.on('call.incoming', (payload) => {
      const { data } = payload || {};
      if (data && data.conversationId === conversationId) {
        handleIncomingCall(data);
      }
    });

    // Call answered
    const offCallAnswered = socket.on('call.answered', (payload) => {
      const { data } = payload || {};
      if (data && data.conversationId === conversationId) {
        handleCallAnswered(data.answer);
      }
    });

    // Call declined
    const offCallDeclined = socket.on('call.declined', (payload) => {
      const { data } = payload || {};
      if (data && data.conversationId === conversationId) {
        handleCallDeclined();
      }
    });

    // Call ended
    const offCallEnded = socket.on('call.ended', (payload) => {
      const { data } = payload || {};
      if (data && data.conversationId === conversationId) {
        handleCallEnded();
      }
    });

    // Call initiated
    const offCallInitiated = socket.on('call.initiated', (payload) => {
      const { data } = payload || {};
      if (data && data.conversationId === conversationId) {
        handleCallInitiated(data);
      }
    });

    // ICE candidate
    const offCallIceCandidate = socket.on('call.ice-candidate', (payload) => {
      const { data } = payload || {};
      if (data && data.conversationId === conversationId) {
        handleIceCandidate(data);
      }
    });

    // Return cleanup function
    return () => {
      if (offCallIncoming) offCallIncoming();
      if (offCallAnswered) offCallAnswered();
      if (offCallDeclined) offCallDeclined();
      if (offCallEnded) offCallEnded();
      if (offCallInitiated) offCallInitiated();
      if (offCallIceCandidate) offCallIceCandidate();
    };
  }, [conversationId, handleIncomingCall, handleCallAnswered, handleCallDeclined, handleCallEnded, handleCallInitiated, handleIceCandidate]);

  return {
    subscribeToCallEvents
  };
};
