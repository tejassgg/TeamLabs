// Current client version
export const CLIENT_VERSION = '1.0.0';

// Version comparison utilities
export const compareVersions = (version1, version2) => {
  const v1parts = version1.split('.').map(Number);
  const v2parts = version2.split('.').map(Number);
  
  // Ensure both arrays have the same length
  while (v1parts.length < v2parts.length) v1parts.push(0);
  while (v2parts.length < v1parts.length) v2parts.push(0);
  
  for (let i = 0; i < v1parts.length; i++) {
    if (v1parts[i] > v2parts[i]) return 1;
    if (v1parts[i] < v2parts[i]) return -1;
  }
  
  return 0;
};

// Check if a version is newer than current
export const isNewerVersion = (newVersion, currentVersion = CLIENT_VERSION) => {
  return compareVersions(newVersion, currentVersion) > 0;
};

// Get version info from localStorage or default
export const getStoredVersionInfo = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem('versionInfo');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error parsing stored version info:', error);
    return null;
  }
};

// Store version info in localStorage
export const storeVersionInfo = (versionInfo) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('versionInfo', JSON.stringify(versionInfo));
  } catch (error) {
    console.error('Error storing version info:', error);
  }
};

// Update version info
export const updateVersionInfo = (newVersion) => {
  const versionInfo = {
    currentVersion: newVersion,
    lastChecked: new Date().toISOString(),
    updateAvailable: false
  };
  
  storeVersionInfo(versionInfo);
  return versionInfo;
};

// Check if version update is available
export const checkVersionUpdate = (latestReleaseVersion) => {
  const currentVersion = CLIENT_VERSION;
  const isUpdateAvailable = isNewerVersion(latestReleaseVersion, currentVersion);
  
  const versionInfo = {
    currentVersion,
    latestVersion: latestReleaseVersion,
    updateAvailable: isUpdateAvailable,
    lastChecked: new Date().toISOString()
  };
  
  storeVersionInfo(versionInfo);
  return versionInfo;
};

// Version history tracking
export const addVersionToHistory = (version, action = 'viewed') => {
  if (typeof window === 'undefined') return;
  
  try {
    const history = JSON.parse(localStorage.getItem('versionHistory') || '[]');
    const entry = {
      version,
      action,
      timestamp: new Date().toISOString()
    };
    
    // Add to beginning of array
    history.unshift(entry);
    
    // Keep only last 10 entries
    const trimmedHistory = history.slice(0, 10);
    
    localStorage.setItem('versionHistory', JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error('Error adding version to history:', error);
  }
};

// Get version history
export const getVersionHistory = () => {
  if (typeof window === 'undefined') return [];
  
  try {
    return JSON.parse(localStorage.getItem('versionHistory') || '[]');
  } catch (error) {
    console.error('Error getting version history:', error);
    return [];
  }
};

export default {
  CLIENT_VERSION,
  compareVersions,
  isNewerVersion,
  getStoredVersionInfo,
  storeVersionInfo,
  updateVersionInfo,
  checkVersionUpdate,
  addVersionToHistory,
  getVersionHistory
};
