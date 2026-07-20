const Notification = require('../models/Notification');
const { emitToUser } = require('../socket');

/**
 * Creates and dispatches a notification to a specific user.
 * @param {Object} params
 * @param {string} params.recipientId - Target user ID
 * @param {string} params.senderId - Action trigger user ID
 * @param {string} params.type - Enum ('mention', 'assignment', 'status_change', 'comment', 'message')
 * @param {string} params.title - Notification title
 * @param {string} params.body - Detailed content
 * @param {string} params.link - Target route path to navigate on click
 */
exports.createNotification = async ({ recipientId, senderId, type, title, body, link = '' }) => {
  try {
    const notification = new Notification({
      RecipientID: recipientId,
      SenderID: senderId,
      Type: type,
      Title: title,
      Body: body,
      Link: link
    });

    await notification.save();

    // Emit real-time socket event
    try {
      emitToUser(recipientId, 'notification:new', {
        event: 'notification:new',
        version: 1,
        data: notification,
        meta: { emittedAt: new Date().toISOString() }
      });
    } catch (socketError) {
      console.error('Socket notification emit failed:', socketError.message);
    }

    // Call Web Push helper
    try {
      const { sendPushNotification } = require('./webPushService');
      console.log("I am here -  createNotification");
      await sendPushNotification(recipientId, {
        title,
        body,
        icon: '/static/logo.png',
        url: link
      });
    } catch (pushError) {
      // webPushService might not be fully configured yet or missing client registration, ignore
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Extracts usernames mentioned using @username syntax.
 * Avoids email addresses and handles special character boundaries.
 * @param {string} text
 * @returns {string[]} List of unique matched usernames
 */
exports.parseMentions = (text) => {
  if (!text) return [];
  const mentionRegex = /(?:^|\s)@([a-zA-Z0-9_.-]+)/g;
  const matches = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    // Strip trailing punctuation like comma, dot, exclamation if matched at boundary
    let username = match[1];
    username = username.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]+$/, '');
    if (username && !matches.includes(username)) {
      matches.push(username);
    }
  }
  return matches;
};

/**
 * Parses a text block for mentions and triggers notifications for valid target users.
 */
exports.parseAndTriggerMentions = async ({ text, senderId, title, link }) => {
  try {
    const usernames = exports.parseMentions(text);
    if (usernames.length === 0) return [];

    const User = require('../models/User');
    const sender = await User.findById(senderId);
    const senderName = sender ? `${sender.firstName} ${sender.lastName}`.trim() || sender.username : 'Someone';

    const notifiedUserIds = [];
    for (const username of usernames) {
      // Case-insensitive query to find user by username
      const targetUser = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
      if (targetUser && targetUser._id.toString() !== String(senderId)) {
        await exports.createNotification({
          recipientId: targetUser._id.toString(),
          senderId,
          type: 'mention',
          title: title || 'New Mention',
          body: `${senderName} mentioned you: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`,
          link
        });
        notifiedUserIds.push(targetUser._id.toString());
      }
    }
    return notifiedUserIds;
  } catch (error) {
    console.error('Error parsing or triggering mentions:', error);
    return [];
  }
};
