import React from 'react';
import { useVideoCall } from '../context/VideoCallContext';
import VideoCallModal from './VideoCallModal';
import IncomingCallScreen from './IncomingCallScreen';

const VideoCallWrapper = ({ currentUser, onOutgoingCallAnswered }) => {
  const {
    showModal,
    showIncomingCallScreen,
    callType,
    callData,
    answerData,
    showVideoCallModal,
    hideIncomingCallScreen,
    closeModal,
    handleCallAnswered,
    handleCallDeclined,
    handleCallEnded,
    handleCallAnsweredFromSmallScreen
  } = useVideoCall();

  const handleAnswer = () => {
    // Show the full video call modal
    handleCallAnsweredFromSmallScreen();
  };

  const handleDecline = () => {
    // Hide the incoming call screen and clear the call
    hideIncomingCallScreen();
    if (handleCallDeclined) {
      handleCallDeclined();
    }
  };

  const handleClose = () => {
    // Hide the incoming call screen
    hideIncomingCallScreen();
  };

  return (
    <>
      {/* Small incoming call screen */}
      <IncomingCallScreen
        isVisible={showIncomingCallScreen && callType === 'incoming'}
        callData={callData}
        onAnswer={handleAnswer}
        onDecline={handleDecline}
        onClose={handleClose}
      />

      {/* Full video call modal */}
      <VideoCallModal
        isOpen={showModal}
        onClose={closeModal}
        callType={callType}
        callData={callData}
        onAnswer={handleCallAnswered}
        onDecline={handleCallDeclined}
        onEnd={handleCallEnded}
        currentUser={currentUser}
        answerData={answerData}
        onOutgoingCallAnswered={onOutgoingCallAnswered}
      />
    </>
  );
};

export default VideoCallWrapper;
