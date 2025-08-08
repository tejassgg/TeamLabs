const express = require('express');
const mongoose = require('mongoose');
const { protect } = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

const router = express.Router();

// Get conversations for current user's organization
router.get('/conversations', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const conversations = await Conversation.find({
      organizationID: user.organizationID,
      participants: req.user._id
    })
      .sort({ updatedAt: -1 })
      .populate('participants', 'firstName lastName email profileImage');
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
});

// Create one-to-one conversation or get existing
router.post('/conversations/with/:userId', protect, async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const currentUser = await User.findById(req.user._id);
    const otherUser = await User.findById(otherUserId);
    if (!otherUser || otherUser.organizationID !== currentUser.organizationID) {
      return res.status(400).json({ message: 'User not in the same organization' });
    }

    let conversation = await Conversation.findOne({
      isGroup: false,
      organizationID: currentUser.organizationID,
      participants: { $all: [req.user._id, otherUserId], $size: 2 }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        isGroup: false,
        organizationID: currentUser.organizationID,
        participants: [req.user._id, otherUserId]
      });
    }

    const populated = await Conversation.findById(conversation._id).populate('participants', 'firstName lastName email profileImage');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create conversation' });
  }
});

// Create group conversation
router.post('/conversations', protect, async (req, res) => {
  try {
    const { name, participantIds, avatarUrl } = req.body;
    const currentUser = await User.findById(req.user._id);
    const users = await User.find({ _id: { $in: participantIds } });
    const allSameOrg = users.every(u => u.organizationID === currentUser.organizationID);
    if (!allSameOrg) {
      return res.status(400).json({ message: 'All participants must be in the same organization' });
    }

    const conversation = await Conversation.create({
      name: name || 'New Group',
      isGroup: true,
      organizationID: currentUser.organizationID,
      participants: [req.user._id, ...participantIds],
      admins: [req.user._id],
      avatarUrl: avatarUrl || '',
      createdBy: req.user._id
    });

    const populated = await Conversation.findById(conversation._id).populate('participants', 'firstName lastName email profileImage');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create group' });
  }
});

// Get conversation details (with members)
router.get('/conversations/:conversationId', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'firstName lastName email profileImage')
      .populate('createdBy', 'firstName lastName email')
      .lean();
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch conversation' });
  }
});

// Add members to a group conversation
router.post('/conversations/:conversationId/members', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { memberIds } = req.body;
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.isGroup) return res.status(404).json({ message: 'Group not found' });
    // Only allow members of same org
    const currentUser = await User.findById(req.user._id);
    const newUsers = await User.find({ _id: { $in: memberIds } });
    const allSameOrg = newUsers.every(u => u.organizationID === currentUser.organizationID);
    if (!allSameOrg) return res.status(400).json({ message: 'Members must be in the same organization' });
    const existing = new Set(conversation.participants.map(String));
    newUsers.forEach(u => existing.add(String(u._id)));
    conversation.participants = Array.from(existing);
    await conversation.save();
    const populated = await Conversation.findById(conversation._id).populate('participants', 'firstName lastName email profileImage').lean();
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add members' });
  }
});

// Get files and links referenced in messages
router.get('/conversations/:conversationId/assets', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversation: conversationId }).lean();
    const files = messages.filter(m => m.mediaUrl).map(m => ({
      _id: m._id,
      url: m.mediaUrl,
      type: m.type,
      createdAt: m.createdAt,
      sender: m.sender,
    }));
    const linkRegex = /(https?:\/\/[^\s]+)/gi;
    const links = [];
    messages.forEach(m => {
      if (m.text) {
        const found = m.text.match(linkRegex);
        if (found) found.forEach(url => links.push({ url, messageId: m._id, createdAt: m.createdAt }));
      }
    });
    res.json({ files, links });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch assets' });
  }
});

// Get messages in a conversation
router.get('/conversations/:conversationId/messages', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 30 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('sender', 'firstName lastName email profileImage')
      .lean();
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// Send a message (text or media)
router.post('/conversations/:conversationId/messages', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { type, text = '', mediaUrl = '' } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    if (!conversation.participants.map(String).includes(String(req.user._id))) {
      return res.status(403).json({ message: 'Not a participant' });
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      type: type || (mediaUrl ? 'image' : 'text'),
      text,
      mediaUrl
    });

    conversation.lastMessageAt = new Date();
    conversation.lastMessagePreview = text || (message.type === 'image' ? 'Image' : message.type === 'video' ? 'Video' : '');
    await conversation.save();

    const populated = await Message.findById(message._id).populate('sender', 'firstName lastName email profileImage');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// React to a message (only one reaction per user)
router.post('/messages/:messageId/reactions', protect, async (req, res) => {
  try {
    const { emoji } = req.body;
    const { messageId } = req.params;
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    // Ensure only one reaction per user:
    // - If the same emoji is already set by the user, remove it (toggle off)
    // - If a different emoji exists by the user, replace it with the new one
    const userIdStr = String(req.user._id);
    const existingByUserIdx = message.reactions.findIndex(r => String(r.user) === userIdStr);
    if (existingByUserIdx >= 0) {
      const existing = message.reactions[existingByUserIdx];
      if (existing.emoji === emoji) {
        // toggle off
        message.reactions.splice(existingByUserIdx, 1);
      } else {
        // replace
        message.reactions[existingByUserIdx].emoji = emoji;
      }
    } else {
      message.reactions.push({ emoji, user: req.user._id });
    }
    await message.save();
    const populated = await Message.findById(message._id).populate('sender', 'firstName lastName email profileImage');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update reaction' });
  }
});

module.exports = router;