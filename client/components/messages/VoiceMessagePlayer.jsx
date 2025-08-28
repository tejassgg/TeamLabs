import React, { useState, useRef, useCallback } from 'react';
import { FaPlay, FaPause, FaVolumeUp, FaDownload } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';

const VoiceMessagePlayer = ({ audioUrl, duration, senderName, timestamp, onDownload }) => {
  const { theme } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const audioRef = useRef(null);
  const progressRef = useRef(null);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const handleSeek = useCallback((e) => {
    if (audioRef.current && progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const seekTime = (clickX / width) * duration;
      
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  }, [duration]);

  const handleDownload = useCallback(() => {
    if (onDownload) {
      onDownload(audioUrl);
    } else {
      // Default download behavior
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `voice-message-${Date.now()}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [audioUrl, onDownload]);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`max-w-sm rounded-lg p-3 ${
      theme === 'dark' 
        ? 'bg-gray-700 border border-gray-600' 
        : 'bg-gray-100 border border-gray-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FaVolumeUp className={`text-sm ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
          <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Voice Message
          </span>
        </div>
        <button
          onClick={handleDownload}
          className={`p-1 rounded transition-colors ${
            theme === 'dark' 
              ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-600' 
              : 'text-gray-500 hover:text-blue-600 hover:bg-gray-200'
          }`}
          title="Download voice message"
        >
          <FaDownload size={12} />
        </button>
      </div>

      {/* Audio Controls */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={togglePlayPause}
          disabled={isLoading}
          className={`p-2 rounded-full transition-colors ${
            isLoading
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : theme === 'dark'
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : isPlaying ? (
            <FaPause size={14} />
          ) : (
            <FaPlay size={14} />
          )}
        </button>

        <div className="flex-1">
          {/* Progress Bar */}
          <div
            ref={progressRef}
            onClick={handleSeek}
            className={`w-full h-2 bg-gray-300 rounded-full cursor-pointer ${
              theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
            }`}
          >
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-100"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          {senderName}
        </span>
        <span className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
          {timestamp}
        </span>
      </div>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        preload="metadata"
      />
    </div>
  );
};

export default VoiceMessagePlayer;
