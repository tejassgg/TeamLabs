import { notificationInboxService } from '../services/api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerPushNotifications() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications are not supported in this browser.');
    return;
  }

  try {
    // 1. Register Service Worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered successfully:', registration.scope);

    // 2. Request Notification Permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied.');
      return;
    }

    // 3. Fetch VAPID Public Key from Backend
    const { publicKey } = await notificationInboxService.getVapidPublicKey();
    if (!publicKey) {
      console.error('VAPID public key not found on backend.');
      return;
    }

    // 4. Subscribe the User
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    // 5. Send Subscription details to Backend
    await notificationInboxService.subscribeWebPush(subscription);
    console.log('Web Push subscription stored on backend successfully.');
  } catch (error) {
    console.error('Failed to register push notifications:', error);
  }
}
