/**
 * Date and Time Utility Functions
 * Common utilities for formatting dates and times across the client application
 */

/**
 * Format time in 12-hour format (e.g., "02:30 PM")
 * @param {Date} date - The date object to format (defaults to current time)
 * @returns {string} - Formatted time string
 */
export const formatTime12Hour = (date = new Date()) => {
  const timeOptions = { 
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  return date.toLocaleTimeString('en-US', timeOptions);
};

/**
 * Format time in 24-hour format (e.g., "14:30")
 * @param {Date} date - The date object to format (defaults to current time)
 * @returns {string} - Formatted time string
 */
export const formatTime24Hour = (date = new Date()) => {
  const timeOptions = { 
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };
  return date.toLocaleTimeString('en-US', timeOptions);
};

/**
 * Format full date and time (e.g., "Monday, January 15, 2024 at 02:30:45 PM")
 * @param {Date} date - The date object to format (defaults to current time)
 * @returns {string} - Formatted date and time string
 */
export const formatFullDateTime = (date = new Date()) => {
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  };
  return date.toLocaleDateString('en-US', options);
};

/**
 * Format date only (e.g., "January 15, 2024")
 * @param {Date} date - The date object to format (defaults to current date)
 * @returns {string} - Formatted date string
 */
export const formatDateOnly = (date = new Date()) => {
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  };
  return date.toLocaleDateString('en-US', options);
};

/**
 * Format short date (e.g., "Jan 15, 2024")
 * @param {Date} date - The date object to format (defaults to current date)
 * @returns {string} - Formatted short date string
 */
export const formatShortDate = (date = new Date()) => {
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  };
  return date.toLocaleDateString('en-US', options);
};

/**
 * Format date with time (e.g., "Jan 15, 2024 02:30 PM")
 * @param {Date|string} dateInput - The date object or string to format
 * @returns {string} - Formatted date and time string
 */
export const formatDateWithTime = (dateInput) => {
  if (!dateInput) return 'N/A';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return dateInput;
  
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Format detailed date with time (e.g., "January 15, 2024 02:30 PM")
 * @param {Date|string} dateInput - The date object or string to format
 * @returns {string} - Formatted detailed date and time string
 */
export const formatDetailedDateTime = (dateInput) => {
  if (!dateInput) return 'Not available';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Not available';
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Format relative time (e.g., "2 minutes ago", "Just now")
 * @param {Date|string} dateInput - The date to compare against current time
 * @returns {string} - Relative time string
 */
export const formatRelativeTime = (dateInput) => {
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

/**
 * Format commit date with relative time logic
 * @param {Date|string} dateInput - The date to format
 * @returns {string} - Formatted relative time string for commits
 */
export const formatCommitTime = (dateInput) => {
  const date = new Date(dateInput);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));

  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Group commits by date with friendly labels
 * @param {Array} commits - Array of commit objects with author.date
 * @returns {Object} - Grouped commits by display date
 */
export const groupCommitsByDate = (commits) => {
  const groups = {};
  commits.forEach(commit => {
    const date = new Date(commit.author.date);
    const dateKey = date.toDateString();
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

    let displayDate;
    if (dateKey === today) {
      displayDate = 'Today';
    } else if (dateKey === yesterday) {
      displayDate = 'Yesterday';
    } else {
      displayDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    if (!groups[displayDate]) {
      groups[displayDate] = [];
    }
    groups[displayDate].push(commit);
  });
  return groups;
};
