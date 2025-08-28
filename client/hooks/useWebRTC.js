import { useState, useRef, useCallback, useMemo } from 'react';
import { getSocket } from '../services/socket';

export const useWebRTC = (callType, callData, currentUser) => {
  const [connectionState, setConnectionState] = useState({
    status: 'idle',
    localStream: null,
    remoteStream: null,
    isConnecting: false,
    error: null,
    connectionQuality: 'unknown'
  });

  const [screenShareState, setScreenShareState] = useState({
    isScreenSharing: false,
    screenStream: null,
    screenTrack: null
  });

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const callTimeoutRef = useRef(null);
  const iceConnectionStateRef = useRef('new');
  const remoteStreamRef = useRef(null);

  const rtcConfig = useMemo(() => ({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ],
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    iceTransportPolicy: 'all'
  }), []);

  const updateConnectionState = useCallback((updates) => {
    setConnectionState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateScreenShareState = useCallback((updates) => {
    setScreenShareState(prev => ({ ...prev, ...updates }));
  }, []);

  const initializeLocalStream = useCallback(async () => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      localStreamRef.current = stream;
      updateConnectionState({
        localStream: stream,
        error: null,
        status: 'idle'
      });
      
      return stream;
    } catch (error) {
      console.log(error);
      let errorMessage = 'Failed to access camera and microphone.';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera and microphone access denied. Please allow access to use video calling.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera or microphone found. Please check your devices.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera or microphone is already in use by another application.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera or microphone does not meet the required constraints.';
      }
      
      updateConnectionState({ status: 'failed', error: errorMessage });
      return null;
    }
  }, [updateConnectionState]);

  const startScreenShare = useCallback(async () => {
    try {
      if (screenShareState.isScreenSharing) {
        return null;
      }

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor'
        },
        audio: false
      });

      // Get the video track from screen stream
      const screenTrack = screenStream.getVideoTracks()[0];
      
      if (!screenTrack) {
        throw new Error('No video track found in screen stream');
      }

      // Handle screen share stop
      screenTrack.onended = () => {
        stopScreenShare();
      };

      // Replace video track in peer connection
      if (peerConnectionRef.current) {
        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find(sender => 
          sender.track && sender.track.kind === 'video'
        );
        
        if (videoSender) {
          await videoSender.replaceTrack(screenTrack);
        }
      }

      updateScreenShareState({
        isScreenSharing: true,
        screenStream,
        screenTrack
      });

      // Notify remote peer about screen sharing
      if (getSocket()) {
        const targetId = callType === 'incoming' ? callData.callerId : callData.recipientId;
        getSocket().emit('call.screen-share.started', {
          to: targetId,
          conversationId: callData.conversationId
        });
      }

      return screenStream;
    } catch (error) {
      console.error('Failed to start screen sharing:', error);
      let errorMessage = 'Failed to start screen sharing.';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Screen sharing access denied.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Screen sharing is not supported in this browser.';
      }
      return null;
    }
  }, [screenShareState.isScreenSharing, callType, callData, updateScreenShareState]);

  const stopScreenShare = useCallback(async () => {
    try {
      if (!screenShareState.isScreenSharing) {
        return;
      }

      // Stop screen track
      if (screenShareState.screenTrack) {
        screenShareState.screenTrack.stop();
      }

      // Stop screen stream
      if (screenShareState.screenStream) {
        screenShareState.screenStream.getTracks().forEach(track => track.stop());
      }

      // Restore original video track if available
      if (peerConnectionRef.current && localStreamRef.current) {
        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find(sender => 
          sender.track && sender.track.kind === 'video'
        );
        
        if (videoSender && localStreamRef.current.getVideoTracks()[0]) {
          await videoSender.replaceTrack(localStreamRef.current.getVideoTracks()[0]);
        }
      }

      updateScreenShareState({
        isScreenSharing: false,
        screenStream: null,
        screenTrack: null
      });

      // Notify remote peer about screen sharing stop
      if (getSocket()) {
        const targetId = callType === 'incoming' ? callData.callerId : callData.recipientId;
        getSocket().emit('call.screen-share.stopped', {
          to: targetId,
          conversationId: callData.conversationId
        });
      }
    } catch (error) {
      console.error('Failed to stop screen sharing:', error);
    }
  }, [screenShareState, callType, callData, updateScreenShareState]);

  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(rtcConfig);
    
    pc.onicecandidate = (event) => {
      if (event.candidate && getSocket()) {
        const targetId = callType === 'incoming' ? callData.callerId : callData.recipientId;
        getSocket().emit('call.ice-candidate', {
          candidate: event.candidate,
          to: targetId,
          conversationId: callData.conversationId
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams.length > 0) {
        const remoteStream = event.streams[0];
        remoteStreamRef.current = remoteStream;
        updateConnectionState({
          remoteStream: remoteStream,
          status: 'connected',
          isConnecting: false,
          error: null
        });
      } else if (event.track) {
        const remoteStream = new MediaStream([event.track]);
        remoteStreamRef.current = remoteStream;
        updateConnectionState({
          remoteStream: remoteStream,
          status: 'connected',
          isConnecting: false,
          error: null
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      iceConnectionStateRef.current = state;
      if (state === 'connected' || state === 'completed') {
        updateConnectionState({ status: 'connected', isConnecting: false, connectionQuality: 'good' });
      } else if (state === 'failed' || state === 'disconnected') {
        updateConnectionState({ status: 'failed', isConnecting: false, connectionQuality: 'bad' });
      } else if (state === 'checking' || state === 'gathering') {
        updateConnectionState({ status: 'connecting', isConnecting: true });
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === 'connected') {
        updateConnectionState({ status: 'connected', isConnecting: false });
      } else if (state === 'failed') {
        updateConnectionState({ status: 'failed', isConnecting: false });
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [rtcConfig, callType, callData, updateConnectionState]);

  const handleAnswer = useCallback(async () => {
    if (!localStreamRef.current) {
      await initializeLocalStream();
    }
    if (!localStreamRef.current) return;

    updateConnectionState({ isConnecting: true });
    const pc = createPeerConnection();

    localStreamRef.current.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current);
    });

    try {
      if (callData.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        if (getSocket()) {
          getSocket().emit('call.answer', {
            callerId: callData.callerId,
            conversationId: callData.conversationId,
            answer: answer
          });
        }
      }
    } catch (error) {
      updateConnectionState({ status: 'failed', isConnecting: false, error: 'Failed to establish call connection. Please try again.' });
    }
  }, [callData, createPeerConnection, initializeLocalStream, updateConnectionState]);

  const handleOutgoingCall = useCallback(async () => {
    if (!localStreamRef.current) {
      await initializeLocalStream();
    }
    if (!localStreamRef.current) return;

    updateConnectionState({ isConnecting: true });
    const pc = createPeerConnection();

    localStreamRef.current.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current);
    });

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      if (getSocket()) {
        getSocket().emit('call.initiate', {
          recipientId: callData.recipientId,
          callerId: currentUser._id,
          conversationId: callData.conversationId,
          type: 'video',
          callerName: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
          offer: offer
        });
      }

      callTimeoutRef.current = setTimeout(() => {
        if (connectionState.status === 'connecting') {
          updateConnectionState({ status: 'failed', isConnecting: false, error: 'Call timed out. The user is not responding.' });
          // Emit missed call event for timeout
          if (getSocket()) {
            getSocket().emit('call.missed', { 
              conversationId: callData.conversationId,
              callerId: currentUser._id,
              ringDuration: 30
            });
          }
        }
      }, 30000);
    } catch (error) {
      updateConnectionState({ status: 'failed', isConnecting: false });
    }
  }, [callData, currentUser, createPeerConnection, initializeLocalStream, connectionState.status, updateConnectionState]);

  const handleCallAnswered = useCallback((answer) => {
    if (!peerConnectionRef.current) {
      return;
    }
    peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer))
      .then(() => {
        updateConnectionState({ status: 'connected', isConnecting: false });
      })
      .catch(() => {
        updateConnectionState({ status: 'failed', isConnecting: false });
      });
  }, [updateConnectionState]);

  const handleIceCandidate = useCallback((candidate) => {
    if (!peerConnectionRef.current) {
      return;
    }
    if (!candidate || !candidate.candidate) {
      return;
    }
    if (peerConnectionRef.current.remoteDescription === null) {
      return;
    }
    peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
      .then(() => {
        if (peerConnectionRef.current.iceConnectionState === 'connected' || peerConnectionRef.current.iceConnectionState === 'completed') {
          updateConnectionState({ status: 'connected', isConnecting: false, connectionQuality: 'good' });
        }
      })
      .catch(() => {});
  }, [updateConnectionState]);

  const cleanup = useCallback(() => {
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (screenShareState.screenStream) {
      screenShareState.screenStream.getTracks().forEach(track => track.stop());
    }
    remoteStreamRef.current = null;
    updateConnectionState({
      status: 'idle',
      localStream: null,
      remoteStream: null,
      isConnecting: false,
      error: null,
      connectionQuality: 'unknown'
    });
    updateScreenShareState({
      isScreenSharing: false,
      screenStream: null,
      screenTrack: null
    });
    iceConnectionStateRef.current = 'new';
  }, [updateConnectionState, updateScreenShareState, screenShareState.screenStream]);

  const endCall = useCallback((callStartTime, callDuration) => {
    if (getSocket()) {
      getSocket().emit('call.end', { 
        conversationId: callData.conversationId,
        callStartTime,
        callDuration
      });
    }
    cleanup();
  }, [callData, cleanup]);

  const declineCall = useCallback((ringDuration = 0) => {
    if (getSocket()) {
      getSocket().emit('call.decline', { 
        callerId: callData.callerId, 
        conversationId: callData.conversationId,
        ringDuration
      });
    }
    cleanup();
  }, [callData, cleanup]);

  const getConnectionStats = useCallback(async () => {
    if (!peerConnectionRef.current) return null;
    try {
      const stats = await peerConnectionRef.current.getStats();
      const connectionStats = {};
      stats.forEach((report) => {
        if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
          connectionStats.video = {
            packetsLost: report.packetsLost,
            jitter: report.jitter,
            framesDecoded: report.framesDecoded,
            frameRate: report.framesPerSecond
          };
        }
        if (report.type === 'inbound-rtp' && report.mediaType === 'audio') {
          connectionStats.audio = {
            packetsLost: report.packetsLost,
            jitter: report.jitter
          };
        }
      });
      return connectionStats;
    } catch {
      return null;
    }
  }, []);

  const monitorConnectionQuality = useCallback(() => {
    if (!peerConnectionRef.current || connectionState.status !== 'connected') return;
    const interval = setInterval(async () => {
      const stats = await getConnectionStats();
      if (stats) {
        let quality = 'good';
        if (stats.video?.packetsLost > 10 || stats.audio?.packetsLost > 5) quality = 'poor';
        if (stats.video?.packetsLost > 20 || stats.audio?.packetsLost > 10) quality = 'bad';
        updateConnectionState({ connectionQuality: quality });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [connectionState.status, getConnectionStats, updateConnectionState]);

  return {
    connectionState,
    screenShareState,
    initializeLocalStream,
    startScreenShare,
    stopScreenShare,
    handleAnswer,
    handleOutgoingCall,
    handleCallAnswered,
    handleIceCandidate,
    endCall,
    declineCall,
    cleanup,
    getConnectionStats,
    monitorConnectionQuality,
    peerConnection: peerConnectionRef.current,
    localStream: localStreamRef.current,
    remoteStream: remoteStreamRef.current
  };
};
