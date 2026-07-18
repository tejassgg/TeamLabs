import { useState, useEffect } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { releaseNotificationService } from '../services/api';
import { checkVersionUpdate, addVersionToHistory, isNewerVersion, CLIENT_VERSION } from '../config/version';

const useReleaseNotifications = () => {
  const { userDetails } = useGlobal();
  const [latestRelease, setLatestRelease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasNewRelease, setHasNewRelease] = useState(false);
  const [versionUpdateAvailable, setVersionUpdateAvailable] = useState(false);

  useEffect(() => {
    if (userDetails?.organizationID) {
      fetchLatestRelease();
    }
  }, [userDetails?.organizationID]);

  const fetchLatestRelease = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we have checked for updates this session to allow caching,
      // but bypass it on new session/login so we always check the server once.
      const sessionChecked = typeof window !== 'undefined' && sessionStorage.getItem('releaseCheckedThisSession');
      const dismissedReleases = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('dismissedReleases') || '[]') : [];
      const cachedReleaseStr = typeof window !== 'undefined' ? localStorage.getItem('latestRelease') : null;

      if (sessionChecked && cachedReleaseStr) {
        try {
          const cachedRelease = JSON.parse(cachedReleaseStr);
          const isDismissed = dismissedReleases.includes(cachedRelease._id);
          const isExpired = cachedRelease.expiresAt && new Date(cachedRelease.expiresAt) < new Date();

          if (isDismissed || isExpired) {
            // Already dismissed or expired, do not make network call
            setLatestRelease(null);
            setHasNewRelease(false);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('Error parsing cached release:', e);
        }
      }

      const response = await releaseNotificationService.getLatestReleaseNotification('all');

      if (response.success && response.data) {
        const release = response.data;

        // Cache the release and the session check
        if (typeof window !== 'undefined') {
          localStorage.setItem('latestRelease', JSON.stringify(release));
          sessionStorage.setItem('releaseCheckedThisSession', 'true');
        }

        // Check if release has expired
        const isExpired = release.expiresAt && new Date(release.expiresAt) < new Date();

        // Check if user has dismissed this release
        const isDismissed = dismissedReleases.includes(release._id);

        // Check if this is a new release (not seen before)
        const lastSeenRelease = typeof window !== 'undefined' ? localStorage.getItem('lastSeenReleaseId') : null;
        const isNewRelease = lastSeenRelease !== release._id;

        // Check for version update
        const isUpdateAvailable = isNewerVersion(release.version, CLIENT_VERSION);
        setVersionUpdateAvailable(isUpdateAvailable);

        // Update version info
        checkVersionUpdate(release.version);

        if (!isExpired && !isDismissed) {
          setLatestRelease(release);
          setHasNewRelease(isNewRelease);

          // Add to version history if this is a new release
          if (isNewRelease) {
            addVersionToHistory(release.version, 'released');
          }
        } else {
          setLatestRelease(null);
          setHasNewRelease(false);
        }
      } else {
        setLatestRelease(null);
        setHasNewRelease(false);
        setVersionUpdateAvailable(false);
      }
    } catch (err) {
      console.error('Error fetching latest release:', err);
      setError(err.message || 'Failed to fetch release notification');
    } finally {
      setLoading(false);
    }
  };

  const markAsSeen = (releaseId) => {
    localStorage.setItem('lastSeenReleaseId', releaseId);
    setHasNewRelease(false);

    // Add to version history
    if (latestRelease) {
      addVersionToHistory(latestRelease.version, 'viewed');
    }
  };

  const dismissRelease = (releaseId) => {
    const dismissedReleases = JSON.parse(localStorage.getItem('dismissedReleases') || '[]');
    if (!dismissedReleases.includes(releaseId)) {
      dismissedReleases.push(releaseId);
      localStorage.setItem('dismissedReleases', JSON.stringify(dismissedReleases));
    }
    setLatestRelease(null);
    setHasNewRelease(false);
  };

  const refreshRelease = () => {
    fetchLatestRelease();
  };

  return {
    latestRelease,
    loading,
    error,
    hasNewRelease,
    versionUpdateAvailable,
    markAsSeen,
    dismissRelease,
    refreshRelease
  };
};

export default useReleaseNotifications;
