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
    const { includeArchived = false } = req.query;
    
    const query = {
      organizationID: user.organizationID,
      participants: req.user._id
    };
    
    // Only include archived conversations if explicitly requested
    if (!includeArchived) {
      query.archived = { $ne: true };
    }
    
    const conversations = await Conversation.find(query)
      .sort({ updatedAt: -1 })
      .populate('participants', 'firstName lastName email profileImage');
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
});

// Get archived conversations for current user's organization
router.get('/conversations/archived', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const conversations = await Conversation.find({
      organizationID: user.organizationID,
      participants: req.user._id,
      archived: true
    })
      .sort({ archivedAt: -1 })
      .populate('participants', 'firstName lastName email profileImage');
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch archived conversations' });
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

    // Create system messages for all participants added to the group (excluding creator)
    const systemMessages = [];
    for (const user of users) {
      if (String(user._id) !== String(req.user._id)) {
        const systemMessage = await Message.create({
          conversation: conversation._id,
          type: 'system',
          text: `${user.firstName} ${user.lastName} added to the group`
        });
        systemMessages.push(systemMessage);
      }
    }

    // Update conversation with last message info if there are system messages
    if (systemMessages.length > 0) {
      const lastMessage = systemMessages[systemMessages.length - 1];
      conversation.lastMessagePreview = lastMessage.text;
      conversation.lastMessageAt = lastMessage.createdAt;
      await conversation.save();
    }

    const populated = await Conversation.findById(conversation._id).populate('participants', 'firstName lastName email profileImage');
    res.status(201).json(populated);
  } catch (err) {
    console.error('Error creating group:', err);
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
    
    // Track which users are actually new to avoid duplicate system messages
    const existing = new Set(conversation.participants.map(String));
    const actuallyNewUsers = newUsers.filter(u => !existing.has(String(u._id)));
    
    // Add new users to participants
    actuallyNewUsers.forEach(u => existing.add(String(u._id)));
    conversation.participants = Array.from(existing);
    await conversation.save();

    // Create system messages for actually new members
    const systemMessages = [];
    for (const user of actuallyNewUsers) {
      const systemMessage = await Message.create({
        conversation: conversationId,
        type: 'system',
        text: `${user.firstName} ${user.lastName} added to the group`
      });
      systemMessages.push(systemMessage);
    }

    // Update conversation with last message info if there are system messages
    if (systemMessages.length > 0) {
      const lastMessage = systemMessages[systemMessages.length - 1];
      conversation.lastMessagePreview = lastMessage.text;
      conversation.lastMessageAt = lastMessage.createdAt;
      await conversation.save();
    }

    const populated = await Conversation.findById(conversation._id).populate('participants', 'firstName lastName email profileImage').lean();
    res.json(populated);
  } catch (err) {
    console.error('Error adding members:', err);
    res.status(500).json({ message: 'Failed to add members' });
  }
});

// Remove members from a group conversation
router.delete('/conversations/:conversationId/members', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { memberIds } = req.body;
    
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is a participant in the conversation
    if (!conversation.participants.map(String).includes(String(req.user._id))) {
      return res.status(403).json({ message: 'Not authorized to modify this conversation' });
    }

    // Remove the specified members
    conversation.participants = conversation.participants.filter(
      participantId => !memberIds.includes(String(participantId))
    );

    // If removing members would leave the group with less than 2 participants, delete the group
    if (conversation.participants.length < 2) {
      // Delete all messages from the conversation
      await Message.deleteMany({ conversation: conversationId });
      // Delete the conversation itself
      await Conversation.findByIdAndDelete(conversationId);
      return res.json({ message: 'Group deleted due to insufficient members' });
    }

    await conversation.save();
    
    const populated = await Conversation.findById(conversation._id)
      .populate('participants', 'firstName lastName email profileImage')
      .lean();
    
    res.json(populated);
  } catch (err) {
    console.error('Error removing members:', err);
    res.status(500).json({ message: 'Failed to remove members' });
  }
});

// Leave a conversation (for users to leave a group)
router.post('/conversations/:conversationId/leave', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check if user is a participant in the conversation
    if (!conversation.participants.map(String).includes(String(req.user._id))) {
      return res.status(403).json({ message: 'Not a participant in this conversation' });
    }

    // For direct messages, return error (can't leave 1-on-1 chats)
    if (!conversation.isGroup) {
      return res.status(400).json({ message: 'Cannot leave direct message conversations' });
    }

    // Remove the current user from participants
    conversation.participants = conversation.participants.filter(
      participantId => String(participantId) !== String(req.user._id)
    );

    // If leaving would leave the group with less than 2 participants, delete the group
    if (conversation.participants.length < 2) {
      // Delete all messages from the conversation
      await Message.deleteMany({ conversation: conversationId });
      // Delete the conversation itself
      await Conversation.findByIdAndDelete(conversationId);
      return res.json({ message: 'Group deleted due to insufficient members' });
    }

    await conversation.save();
    
    const populated = await Conversation.findById(conversation._id)
      .populate('participants', 'firstName lastName email profileImage')
      .lean();
    
    res.json(populated);
  } catch (err) {
    console.error('Error leaving conversation:', err);
    res.status(500).json({ message: 'Failed to leave conversation' });
  }
});

// Get conversation statistics (for admin purposes)
router.get('/conversations/:conversationId/stats', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check if user is a participant in the conversation
    if (!conversation.participants.map(String).includes(String(req.user._id))) {
      return res.status(403).json({ message: 'Not authorized to view this conversation' });
    }

    // Get message count
    const messageCount = await Message.countDocuments({ conversation: conversationId });
    
    // Get participant count
    const participantCount = conversation.participants.length;
    
    // Get last message info
    const lastMessage = await Message.findOne({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .select('createdAt sender')
      .populate('sender', 'firstName lastName');

    res.json({
      conversationId,
      name: conversation.name,
      isGroup: conversation.isGroup,
      participantCount,
      messageCount,
      lastMessage: lastMessage ? {
        createdAt: lastMessage.createdAt,
        sender: lastMessage.sender
      } : null,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt
    });
  } catch (err) {
    console.error('Error fetching conversation stats:', err);
    res.status(500).json({ message: 'Failed to fetch conversation statistics' });
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

    const messageData = {
      conversation: conversationId,
      type: type || (mediaUrl ? 'image' : 'text'),
      text,
      mediaUrl
    };

    // Only add sender for non-system messages
    if (type !== 'system') {
      messageData.sender = req.user._id;
    }

    const message = await Message.create(messageData);

    conversation.lastMessageAt = new Date();
    conversation.lastMessagePreview = text || (message.type === 'image' ? 'Image' : message.type === 'video' ? 'Video' : message.type === 'system' ? text : '');
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

// Delete a conversation (only group conversations)
router.delete('/conversations/:conversationId', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // Find the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Only allow deletion of group conversations
    if (!conversation.isGroup) {
      return res.status(400).json({ message: 'Only group conversations can be deleted' });
    }

    // Check if user is a participant in the conversation
    if (!conversation.participants.map(String).includes(String(req.user._id))) {
      return res.status(403).json({ message: 'Not authorized to delete this conversation' });
    }

    // Delete all messages from the conversation
    await Message.deleteMany({ conversation: conversationId });

    // Delete the conversation itself
    await Conversation.findByIdAndDelete(conversationId);

    res.json({ message: 'Conversation and all messages deleted successfully' });
  } catch (err) {
    console.error('Error deleting conversation:', err);
    res.status(500).json({ message: 'Failed to delete conversation' });
  }
});

// Update conversation details (name, etc.)
router.patch('/conversations/:conversationId', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { name } = req.body;
    
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check if user is a participant in the conversation
    if (!conversation.participants.map(String).includes(String(req.user._id))) {
      return res.status(403).json({ message: 'Not authorized to update this conversation' });
    }

    // Only allow updating group conversations
    if (!conversation.isGroup) {
      return res.status(400).json({ message: 'Cannot update direct message conversations' });
    }

    // Update the conversation name
    if (name !== undefined) {
      conversation.name = name.trim();
      conversation.updatedAt = new Date();
    }
    
    await conversation.save();
    
    const populated = await Conversation.findById(conversation._id)
      .populate('participants', 'firstName lastName email profileImage')
      .populate('createdBy', 'firstName lastName email')
      .lean();
    
    res.json(populated);
  } catch (err) {
    console.error('Error updating conversation:', err);
    res.status(500).json({ message: 'Failed to update conversation' });
  }
});

// Archive a conversation (soft delete - keeps data but hides from active conversations)
router.post('/conversations/:conversationId/archive', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check if user is a participant in the conversation
    if (!conversation.participants.map(String).includes(String(req.user._id))) {
      return res.status(403).json({ message: 'Not authorized to archive this conversation' });
    }

    // Add archived flag and archived by user
    conversation.archived = true;
    conversation.archivedBy = req.user._id;
    conversation.archivedAt = new Date();
    
    await conversation.save();
    
    res.json({ message: 'Conversation archived successfully' });
  } catch (err) {
    console.error('Error archiving conversation:', err);
    res.status(500).json({ message: 'Failed to archive conversation' });
  }
});

module.exports = router;