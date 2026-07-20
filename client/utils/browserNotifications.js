/**
 * Utility function to send browser desktop notifications.
 * It tries to use Service Worker if available, otherwise falls back to the native Notification API.
 * 
 * @param {string} title - The title of the notification
 * @param {Object} options - Notification options (body, icon, data, etc.)
 */
export const sendBrowserNotification = async (title, options = {}) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      const mergedOptions = {
        icon: '/static/logo.png', // Correct logo icon path
        badge: '/static/logo.png',
        tag: options.tag || 'teamlabs-notification', // Deduplication tag
        ...options,
      };

      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.showNotification(title, mergedOptions);
          return;
        }
      }

      // Fallback to standard Notification API
      const notif = new Notification(title, mergedOptions);

      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (err) {
      console.error('Error sending browser notification:', err);
    }
  }
};
