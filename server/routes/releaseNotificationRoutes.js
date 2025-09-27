const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createReleaseNotification,
  getReleaseNotifications,
  getLatestReleaseNotification,
  getReleaseNotificationById,
  updateReleaseNotification,
  togglePublishStatus,
  deleteReleaseNotification,
  getReleaseStats
} = require('../controllers/releaseNotificationController');

// @desc    Create a new release notification
// @route   POST /api/release-notifications
// @access  Admin only
router.post('/', protect, createReleaseNotification);

// @desc    Get all release notifications for organization
// @route   GET /api/release-notifications
// @access  Authenticated users
router.get('/', protect, getReleaseNotifications);

// @desc    Get latest release notification
// @route   GET /api/release-notifications/latest
// @access  Authenticated users
router.get('/latest', protect, getLatestReleaseNotification);

// @desc    Get release statistics for admin
// @route   GET /api/release-notifications/stats
// @access  Admin only
router.get('/stats', protect, getReleaseStats);

// @desc    Get release notification by ID
// @route   GET /api/release-notifications/:id
// @access  Authenticated users
router.get('/:id', protect, getReleaseNotificationById);

// @desc    Update release notification
// @route   PUT /api/release-notifications/:id
// @access  Admin only
router.put('/:id', protect, updateReleaseNotification);

// @desc    Publish/unpublish release notification
// @route   PATCH /api/release-notifications/:id/publish
// @access  Admin only
router.patch('/:id/publish', protect, togglePublishStatus);

// @desc    Delete release notification
// @route   DELETE /api/release-notifications/:id
// @access  Admin only
router.delete('/:id', protect, deleteReleaseNotification);

module.exports = router;
