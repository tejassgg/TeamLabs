const webpush = require('web-push');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');

let _vapidKeys = null;

function getVapidKeys() {
  if (_vapidKeys) return _vapidKeys;

  _vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY
  };

  if (!_vapidKeys.publicKey || !_vapidKeys.privateKey) {
    _vapidKeys = webpush.generateVAPIDKeys();
    console.warn('VAPID keys not found in environment. Generated new temporary keys.');
  }

  webpush.setVapidDetails(
    'mailto:support@team-labs.app',
    _vapidKeys.publicKey,
    _vapidKeys.privateKey
  );

  return _vapidKeys;
}

exports.getPublicKey = () => {
  return getVapidKeys().publicKey;
};

/**
 * Sends a push notification to all active subscriptions of a given user.
 * @param {string} userId - ID of the user to send notifications to
 * @param {Object} payload - Notification payload { title, body, url }
 */
exports.sendPushNotification = async (userId, payload) => {
  try {
    // Ensure keys are initialized before sending
    getVapidKeys();

    const user = await User.findById(userId);
    if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      return;
    }

    const notificationPayload = JSON.stringify({
      notification: {
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/static/logo.png',
        badge: '/static/logo.png',
        data: {
          url: payload.url || '/'
        }
      }
    });

    console.log("user push subscription", user.pushSubscriptions);
    const sendPromises = user.pushSubscriptions.map(async (subscription) => {
      try {
        const sub = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth
          }
        };
        console.log("I am here - sendPushNotification - Inside");
        await webpush.sendNotification(sub, notificationPayload);
      } catch (err) {
        // If subscription has expired or is invalid (410 Gone / 404 Not Found), remove it
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`Push subscription expired (Status: ${err.statusCode}). Removing subscription.`);
          await User.findByIdAndUpdate(userId, {
            $pull: { pushSubscriptions: { endpoint: subscription.endpoint } }
          });
        } else {
          console.error('Push notification delivery failed for endpoint:', subscription.endpoint, err.message);
        }
      }
    });

    await Promise.all(sendPromises);
  } catch (error) {
    console.error('Error sending push notifications for user:', userId, error);
  }
};
