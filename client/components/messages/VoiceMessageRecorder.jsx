import React, { useState, useRef, useCallback } from 'react';
import { FaMicrophone, FaStop, FaPlay, FaPause, FaTrash, FaPaperPlane } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';

const VoiceMessageRecorder = ({ onSendVoiceMessage, disabled = false }) => {
  const { theme } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const audioRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        chunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  }, [isRecording]);

  const playRecording = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [isPlaying]);

  const deleteRecording = useCallback(() => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  }, [audioUrl]);

  const sendVoiceMessage = useCallback(() => {
    if (audioBlob && onSendVoiceMessage) {
      onSendVoiceMessage(audioBlob);
      deleteRecording();
    }
  }, [audioBlob, onSendVoiceMessage, deleteRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  return (
    <div className="flex items-center gap-2">
      {!audioBlob ? (
        // Recording controls
        <>
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={disabled}
              className={`p-2 rounded-lg transition-colors ${
                disabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : theme === 'dark'
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
              title="Record voice message"
            >
              <FaMicrophone size={16} />
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors animate-pulse"
              title="Stop recording"
            >
              <FaStop size={16} />
            </button>
          )}
          
          {isRecording && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>{formatTime(recordingTime)}</span>
            </div>
          )}
        </>
      ) : (
        // Playback controls
        <>
          <button
            onClick={playRecording}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <FaPause size={16} /> : <FaPlay size={16} />}
          </button>
          
          <span className="text-sm text-gray-500">
            {formatTime(recordingTime)}
          </span>
          
          <button
            onClick={deleteRecording}
            className="p-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white transition-colors"
            title="Delete recording"
          >
            <FaTrash size={16} />
          </button>
          
          <button
            onClick={sendVoiceMessage}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
            title="Send voice message"
          >
            <FaPaperPlane size={16} />
          </button>
        </>
      )}

      {/* Hidden audio element for playback */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
        />
      )}
    </div>
  );
};

export default VoiceMessageRecorder;
