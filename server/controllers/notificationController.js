const Notification = require('../models/Notification');
const User = require('../models/User');
const webPushService = require('../services/webPushService');

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      RecipientID: req.user.id,
      IsActive: true
    }).sort({ CreatedDate: -1 }).limit(50);

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;

    const filter = { RecipientID: req.user.id };
    if (notificationIds && Array.isArray(notificationIds)) {
      filter.NotificationID = { $in: notificationIds };
    }

    await Notification.updateMany(filter, { IsRead: true });
    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
};

exports.subscribeWebPush = async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Subscription object with endpoint is required' });
    }

    // Add subscription if not already exists in user array
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const exists = user.pushSubscriptions.some(sub => sub.endpoint === subscription.endpoint);
    if (!exists) {
      user.pushSubscriptions.push(subscription);
      await user.save();
    }

    res.json({ message: 'Subscribed to Web Push successfully' });
  } catch (error) {
    console.error('Error subscribing to Web Push:', error);
    res.status(500).json({ error: 'Failed to subscribe to Web Push' });
  }
};

exports.getVapidPublicKey = (req, res) => {
  try {
    const publicKey = webPushService.getPublicKey();
    res.json({ publicKey });
  } catch (error) {
    console.error('Error getting VAPID public key:', error);
    res.status(500).json({ error: 'Failed to get public key' });
  }
};
