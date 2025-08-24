import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FaPhone, FaPhoneSlash, FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaTimes, FaVolumeUp, FaVolumeMute, FaSignal } from 'react-icons/fa';
import { useWebRTC } from '../hooks/useWebRTC';
import { useTheme } from '../context/ThemeContext';
import { useVideoCall } from '../context/VideoCallContext';

const VideoCallModal = ({ 
  isOpen, 
  onClose, 
  callType,
  callData,
  onAnswer,
  onDecline,
  onEnd,
  currentUser,
  answerData,
  onOutgoingCallAnswered,
  autoAnswer = false,
  initialAction = null
}) => {
  const { resolvedTheme } = useTheme();
  const { ringDuration } = useVideoCall();
  const isDark = resolvedTheme === 'dark';
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [callStartTs, setCallStartTs] = useState(null);
  const [callStartTime, setCallStartTime] = useState(null);
  const [ringStartTime, setRingStartTime] = useState(null);
  const timerRef = useRef(null);
  const autoActionDoneRef = useRef(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const containerRef = useRef(null);
  const localWrapperRef = useRef(null);
  const [isLocalExpanded, setIsLocalExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const posStartRef = useRef({ left: 0, top: 0 });
  const [localPos, setLocalPos] = useState({ left: 0, top: 0 });

  const {
    connectionState,
    initializeLocalStream,
    handleAnswer,
    handleOutgoingCall,
    handleCallAnswered,
    handleIceCandidate,
    endCall,
    declineCall,
    cleanup,
    monitorConnectionQuality
  } = useWebRTC(callType, callData, currentUser);
 
   // Resolve remote participant display name
   let remoteDisplayName = '';
   if (callData?.callerId === currentUser._id) {
     remoteDisplayName = callData?.recipientName;
   } else {
     remoteDisplayName = callData?.callerName;
   }
   const headerTitle = connectionState.status === 'connected'
     ? remoteDisplayName
     : callType === 'incoming'
       ? `Incoming call from ${remoteDisplayName}`
       : `Calling ${remoteDisplayName}`;

  // Set ring start time for incoming calls
  useEffect(() => {
    if (isOpen && callType === 'incoming' && !ringStartTime) {
      setRingStartTime(Date.now());
    }
  }, [isOpen, callType, ringStartTime]);

  // Automatically perform initial action (answer/decline) when opening
  useEffect(() => {
    if (!isOpen || autoActionDoneRef.current) return;
    if (callType !== 'incoming') return;

    const doAnswer = async () => {
      try {
        await initializeLocalStream();
      } catch (_) {}
      setTimeout(() => {
        handleAnswer();
        onAnswer && onAnswer();
        autoActionDoneRef.current = true;
      }, 150);
    };

    const doDecline = () => {
      // Don't initialize local media when declining
      declineCall();
      onDecline && onDecline();
      autoActionDoneRef.current = true;
    };

    if (initialAction === 'answer' || autoAnswer) {
      doAnswer();
    } else if (initialAction === 'decline') {
      doDecline();
    }
  }, [isOpen, autoAnswer, initialAction, callType, initializeLocalStream, handleAnswer, onAnswer, declineCall, onDecline]);

  // Reset auto action flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      autoActionDoneRef.current = false;
      setRingStartTime(null);
    }
  }, [isOpen]);

  // Call timer: start when connected, stop/reset otherwise
  useEffect(() => {
    if (connectionState.status === 'connected') {
      if (!callStartTs) {
        const start = Date.now();
        const startTime = new Date().toISOString();
        setCallStartTs(start);
        setCallStartTime(startTime);
        setElapsedSeconds(0);
        timerRef.current = setInterval(() => {
          setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
        }, 1000);
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setCallStartTs(null);
      setElapsedSeconds(0);
    }
  }, [connectionState.status, callStartTs]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Compute mic/camera status for local and remote
  const localAudioTrack = connectionState.localStream?.getAudioTracks ? connectionState.localStream.getAudioTracks()[0] : undefined;
  const localVideoTrack = connectionState.localStream?.getVideoTracks ? connectionState.localStream.getVideoTracks()[0] : undefined;
  const localMicMuted = !localAudioTrack || localAudioTrack.enabled === false;
  const localCamOff = !localVideoTrack || localVideoTrack.enabled === false;

  const remoteAudioTrack = connectionState.remoteStream?.getAudioTracks ? connectionState.remoteStream.getAudioTracks()[0] : undefined;
  const remoteVideoTrack = connectionState.remoteStream?.getVideoTracks ? connectionState.remoteStream.getVideoTracks()[0] : undefined;
  const remoteMicMuted = !remoteAudioTrack || remoteAudioTrack.muted || remoteAudioTrack.enabled === false || remoteAudioTrack.readyState !== 'live';
  const remoteCamOff = !remoteVideoTrack || remoteVideoTrack.muted || remoteVideoTrack.enabled === false || remoteVideoTrack.readyState !== 'live';

  // Initialize PiP position (top-right with 12px margin)
  useEffect(() => {
    const init = () => {
      const container = containerRef.current;
      const wrapper = localWrapperRef.current;
      if (!container || !wrapper) return;
      const cRect = container.getBoundingClientRect();
      const wRect = wrapper.getBoundingClientRect();
      const margin = 12;
      setLocalPos({ left: cRect.width - wRect.width - margin, top: margin });
    };
    // defer to next frame to ensure layout is ready
    const id = requestAnimationFrame(init);
    return () => cancelAnimationFrame(id);
  }, [isOpen, isLocalExpanded]);

  // Drag handlers
  const onLocalMouseDown = (e) => {
    if (!localWrapperRef.current || !containerRef.current) return;
    setIsDragging(true);
    const container = containerRef.current.getBoundingClientRect();
    const wrapper = localWrapperRef.current.getBoundingClientRect();
    // store starting points
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    posStartRef.current = { left: localPos.left, top: localPos.top };
    // prevent text selection
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e) => {
      const container = containerRef.current?.getBoundingClientRect();
      const wrapper = localWrapperRef.current?.getBoundingClientRect();
      if (!container || !wrapper) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      let nextLeft = posStartRef.current.left + dx;
      let nextTop = posStartRef.current.top + dy;
      // Clamp within bounds
      const maxLeft = container.width - wrapper.width;
      const maxTop = container.height - wrapper.height;
      nextLeft = Math.max(0, Math.min(maxLeft, nextLeft));
      nextTop = Math.max(0, Math.min(maxTop, nextTop));
      setLocalPos({ left: nextLeft, top: nextTop });
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp, { once: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, localPos.left, localPos.top]);

  // Toggle expand on click (ignore when dragging)
  const onLocalClick = useCallback(() => {
    if (isDragging) return;
    setIsLocalExpanded((p) => !p);
  }, [isDragging]);

  const handleModalOpen = useCallback(async () => {
    if (callType === 'outgoing') {
      await initializeLocalStream();
      handleOutgoingCall();
    } else if (callType === 'incoming') {
      // If we're auto-declining, do not touch local media
      if (initialAction === 'decline') return;
      // If we're auto-answering in the auto-action effect, avoid double-init
      if (initialAction === 'answer' || autoAnswer) return;
      await initializeLocalStream();
    }
  }, [callType, initializeLocalStream, handleOutgoingCall, initialAction, autoAnswer]);

  const handleEndCall = useCallback(() => {
    // Pass call start time and duration to the endCall function
    const callDuration = elapsedSeconds;
    endCall(callStartTime, callDuration);
    onEnd && onEnd();
  }, [endCall, onEnd, elapsedSeconds, callStartTime]);

  const handleModalClose = useCallback(() => {
    // If call is connected, end it properly for both parties
    if (connectionState.status === 'connected') {
      handleEndCall();
    } else {
      // Before connecting: treat as decline so server saves Missed call and remote UI closes
      const calculatedRingDuration = ringStartTime ? Math.floor((Date.now() - ringStartTime) / 1000) : 0;
      const finalRingDuration = ringDuration > 0 ? ringDuration : calculatedRingDuration;
      declineCall(finalRingDuration);
      onDecline && onDecline();
    }
  }, [connectionState.status, handleEndCall, declineCall, onDecline, ringStartTime, ringDuration]);

  const handleAnswerDataChange = useCallback(() => {
    if (answerData && callType === 'outgoing') {
      handleCallAnswered(answerData);
      onOutgoingCallAnswered && onOutgoingCallAnswered();
    }
  }, [answerData, callType, handleCallAnswered, onOutgoingCallAnswered]);

  useEffect(() => {
    if (isOpen) {
      handleModalOpen();
    } else {
      cleanup();
    }
  }, [isOpen, handleModalOpen, cleanup]);

  useEffect(() => {
    handleAnswerDataChange();
  }, [handleAnswerDataChange]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Attach local stream
  useEffect(() => {
    if (localVideoRef.current && connectionState.localStream) {
      localVideoRef.current.srcObject = connectionState.localStream;
    }
  }, [connectionState.localStream]);

  // Attach remote stream
  useEffect(() => {
    if (remoteVideoRef.current && connectionState.remoteStream) {
      const remoteVideo = remoteVideoRef.current;
      remoteVideo.srcObject = null;
      remoteVideo.srcObject = connectionState.remoteStream;
      remoteVideo.load();
      Object.assign(remoteVideo.style, {
        display: 'block',
        visibility: 'visible',
        opacity: '1',
        position: 'relative',
        width: '100%',
        height: '100%',
        objectFit: 'cover'
      });

      const handleLoadedMetadata = () => {
        if (remoteVideo.readyState >= 1) {
          remoteVideo.play().catch(() => {});
        }
      };
      const handleCanPlay = () => {
        remoteVideo.play().catch(() => {});
      };

      remoteVideo.addEventListener('loadedmetadata', handleLoadedMetadata);
      remoteVideo.addEventListener('canplay', handleCanPlay);

      return () => {
        remoteVideo.removeEventListener('loadedmetadata', handleLoadedMetadata);
        remoteVideo.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, [connectionState.remoteStream]);

  // Start connection quality monitoring when connected
  useEffect(() => {
    if (connectionState.status === 'connected') {
      const stopMonitoring = monitorConnectionQuality();
      return stopMonitoring;
    }
  }, [connectionState.status, monitorConnectionQuality]);

  // ICE candidates from socket
  useEffect(() => {
    if (connectionState.status === 'connected' || connectionState.status === 'connecting') {
      const socket = require('../services/socket').getSocket();
      if (socket) {
        const onIceCandidateMessage = (payload) => {
          const { data } = payload || {};
          if (data && data.conversationId === callData?.conversationId) {
            handleIceCandidate(data.candidate);
          }
        };
        socket.on('call.ice-candidate', onIceCandidateMessage);
        return () => socket.off('call.ice-candidate', onIceCandidateMessage);
      }
    }
  }, [connectionState.status, callData, handleIceCandidate]);

  const toggleMute = useCallback(() => {
    if (connectionState.localStream) {
      const audioTrack = connectionState.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, [connectionState.localStream]);

  const toggleCamera = useCallback(() => {
    if (connectionState.localStream) {
      const videoTrack = connectionState.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  }, [connectionState.localStream]);

  const toggleSpeaker = useCallback(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = !isSpeakerOn;
      setIsSpeakerOn(!isSpeakerOn);
    }
  }, [isSpeakerOn]);

  const handleAnswerCall = useCallback(() => {
    handleAnswer();
    onAnswer && onAnswer();
  }, [handleAnswer, onAnswer]);

  const handleDeclineCall = useCallback(() => {
    // Use ring duration from context (set by IncomingCallScreen) or calculate from local timer
    const calculatedRingDuration = ringStartTime ? Math.floor((Date.now() - ringStartTime) / 1000) : 0;
    const finalRingDuration = ringDuration > 0 ? ringDuration : calculatedRingDuration;
    declineCall(finalRingDuration);
    onDecline && onDecline();
  }, [declineCall, onDecline, ringStartTime, ringDuration]);

  const getConnectionQualityIndicator = () => {
    if (connectionState.status !== 'connected') return null;
    const qualityColors = { good: 'text-green-500', poor: 'text-yellow-500', bad: 'text-red-500' };
    const qualityLabels = { good: 'Good', poor: 'Poor', bad: 'Bad' };
    return (
      <div className={`flex items-center gap-2 text-sm ${qualityColors[connectionState.connectionQuality]}`}>
        <FaSignal size={14} />
        <span>{qualityLabels[connectionState.connectionQuality]} Connection</span>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className={`${isDark ? 'bg-gray-900' : 'bg-white'} rounded-lg p-4 w-full max-w-7xl h-full max-h-[95vh] flex flex-col`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-semibold flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <span>{headerTitle}</span>
            {connectionState.status === 'connected' && (
              <span className={`text-sm font-normal rounded px-2 py-0.5 ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>{formatDuration(elapsedSeconds)}</span>
            )}
          </h2>
          <button onClick={handleModalClose} className={`${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
            <FaTimes size={20} />
          </button>
        </div>
        <div ref={containerRef} className={`flex-1 relative rounded-lg overflow-hidden mb-4 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            muted={!isSpeakerOn}
            style={{
              display: connectionState.remoteStream ? 'block' : 'none',
              visibility: connectionState.remoteStream ? 'visible' : 'hidden'
            }}
          />
          {/* Connection status badge */}
          {(
            connectionState.status === 'connecting' ||
            connectionState.status === 'connected' ||
            connectionState.status === 'failed'
          ) && (
            <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded flex items-center gap-2">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  connectionState.status === 'connected'
                    ? 'bg-green-400'
                    : connectionState.status === 'connecting'
                    ? 'bg-yellow-400'
                    : 'bg-red-500'
                }`}
              />
              <span>
                {connectionState.status === 'connecting' && 'Connecting'}
                {connectionState.status === 'connected' && 'Connected'}
                {connectionState.status === 'failed' && 'Connection failed'}
              </span>
            </div>
          )}
          {/* Remote status chips */}

          <div
            ref={localWrapperRef}
            className={`absolute rounded-lg overflow-hidden cursor-move ${isLocalExpanded ? 'w-64 h-48' : 'w-32 h-24'} ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}
            style={{ left: `${localPos.left}px`, top: `${localPos.top}px` }}
            onMouseDown={onLocalMouseDown}
            onClick={onLocalClick}
          >
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {/* Self label */}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-[10px] text-center py-0.5">You</div>
            {/* Local status chips */}
            <div className="absolute top-0 left-0 m-1 bg-black bg-opacity-70 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
              {localMicMuted ? <FaMicrophoneSlash size={10} /> : <FaMicrophone size={10} />}
              {localCamOff ? <FaVideoSlash size={10} /> : <FaVideo size={10} />}
            </div>
          </div>

          {connectionState.isConnecting && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                <p>Connecting...</p>
              </div>
            </div>
          )}

          {!connectionState.remoteStream && connectionState.status === 'connected' && (
            <div className={`absolute inset-0 flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
              <div className={`text-center ${isDark ? 'text-white' : 'text-gray-700'}`}>
                <div className="text-6xl mb-4">📹</div>
                <p className="text-lg font-semibold mb-2">Waiting for video...</p>
                <p className="text-sm opacity-75">The other person's video should appear here</p>
              </div>
            </div>
          )}

          {connectionState.status === 'failed' && connectionState.error && (
            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
              <div className="text-white text-center max-w-md mx-4">
                <div className="text-red-400 mb-4">
                  <FaTimes size={48} />
                </div>
                <p className="text-lg font-semibold mb-2">Connection Failed</p>
                <p className="text-sm opacity-90">{connectionState.error}</p>
                <button onClick={handleModalClose} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors">Close</button>
              </div>
            </div>
          )}

          {/* Call control buttons section - positioned at center bottom */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex justify-center space-x-4 z-10">
            {callType === 'incoming' && (
              <>
                <button onClick={handleAnswerCall} disabled={connectionState.isConnecting} className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full disabled:opacity-50 transition-colors shadow-lg" title="Answer Call">
                  <FaPhone size={20} />
                </button>
                <button onClick={handleDeclineCall} disabled={connectionState.isConnecting} className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full disabled:opacity-50 transition-colors shadow-lg" title="Decline Call">
                  <FaPhoneSlash size={20} />
                </button>
              </>
            )}

            {callType === 'outgoing' && (
              <button onClick={handleEndCall} disabled={connectionState.isConnecting} className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full disabled:opacity-50 transition-colors shadow-lg" title="Cancel Call">
                <FaPhoneSlash size={20} />
              </button>
            )}

            {connectionState.status === 'connected' && (
              <>
                <button onClick={toggleMute} className={`p-4 rounded-full transition-colors shadow-lg ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-500 hover:bg-gray-600'} text-white`} title={isMuted ? 'Unmute' : 'Mute'}>
                  {isMuted ? <FaMicrophoneSlash size={20} /> : <FaMicrophone size={20} />}
                </button>
                <button onClick={toggleCamera} className={`p-4 rounded-full transition-colors shadow-lg ${isCameraOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-500 hover:bg-gray-600'} text-white`} title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}>
                  {isCameraOff ? <FaVideoSlash size={20} /> : <FaVideo size={20} />}
                </button>
                <button onClick={toggleSpeaker} className={`p-4 rounded-full transition-colors shadow-lg ${isSpeakerOn ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-500 hover:bg-gray-600'} text-white`} title={isSpeakerOn ? 'Mute Speaker' : 'Unmute Speaker'}>
                  {isSpeakerOn ? <FaVolumeUp size={20} /> : <FaVolumeMute size={20} />}
                </button>
                <button onClick={handleEndCall} className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full transition-colors shadow-lg" title="End Call">
                  <FaPhoneSlash size={20} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className={`text-center text-xs mt-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>Conversation ID: {callData?.conversationId}</p>
        </div>
      </div>
    </div>
  );
};

export default VideoCallModal;