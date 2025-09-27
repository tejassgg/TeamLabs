const ReleaseNotification = require('../models/ReleaseNotification');
const User = require('../models/User');
const Organization = require('../models/Organization');
const mongoose = require('mongoose');

// Helper function to check if user is admin of organization
const isOrgAdmin = async (organizationID, userId) => {
  try {
    const org = await Organization.findOne({ OrganizationID: organizationID });
    if (!org) return false;
    return org.OwnerID.toString() === userId.toString();
  } catch (error) {
    console.error('Error checking org admin:', error);
    return false;
  }
};

// Helper function to check if user is admin of organizationID=1 (special permission for release notifications)
const isReleaseNotificationAdmin = async (userId) => {
  try {
    const org = await Organization.findOne({ OrganizationID: 1 });
    if (!org) return false;
    return org.OwnerID.toString() === userId.toString();
  } catch (error) {
    console.error('Error checking release notification admin:', error);
    return false;
  }
};

// @desc    Create a new release notification
// @route   POST /api/release-notifications
// @access  Admin only
const createReleaseNotification = async (req, res) => {
  try {
    const {
      version,
      title,
      description,
      features = [],
      improvements = [],
      bugFixes = [],
      priority = 'medium',
      targetAudience = 'all',
      releaseNotes,
      compatibility = {},
      metadata = {}
    } = req.body;

    const userId = req.user._id;
    const organizationID = req.user.organizationID;

    // Validate required fields
    if (!version || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Version, title, and description are required'
      });
    }

    // Validate releaseNotes structure if provided
    if (releaseNotes && Array.isArray(releaseNotes)) {
      for (const note of releaseNotes) {
        if (!note.title || !note.description) {
          return res.status(400).json({
            success: false,
            message: 'Release notes must have both title and description'
          });
        }
      }
    }

    // Check if user is admin of organizationID=1 (only org 1 admin can create release notifications)
    const isReleaseAdmin = await isReleaseNotificationAdmin(userId);
    if (!isReleaseAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only organization 1 admin can create release notifications.'
      });
    }

    // Check if version already exists for this organization
    const existingRelease = await ReleaseNotification.findOne({
      version,
      isActive: true
    });

    if (existingRelease) {
      return res.status(400).json({
        success: false,
        message: 'A release notification with this version already exists'
      });
    }

    // Get user details for createdByName
    const user = await User.findById(userId);
    const createdByName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Unknown User';

    // Filter out empty array items
    const filterEmptyArrayItems = (array) => {
      return array.filter(item => item.title?.trim() || item.description?.trim());
    };

    // Create release notification
    const releaseNotification = new ReleaseNotification({
      version,
      title,
      description,
      features: filterEmptyArrayItems(features),
      improvements: filterEmptyArrayItems(improvements),
      bugFixes: filterEmptyArrayItems(bugFixes),
      organizationID: (organizationID),
      createdBy: userId,
      createdByName,
      priority,
      targetAudience,
      releaseNotes: filterEmptyArrayItems(releaseNotes),
      compatibility,
      metadata
    });

    await releaseNotification.save();

    res.status(201).json({
      success: true,
      message: 'Release notification created successfully',
      data: releaseNotification
    });

  } catch (error) {
    console.error('Error creating release notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create release notification',
      error: error.message
    });
  }
};

// @desc    Get all release notifications for organization
// @route   GET /api/release-notifications
// @access  Authenticated users
const getReleaseNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const organizationID = req.user.organizationID;
    const { 
      page = 1, 
      limit = 10, 
      status = 'published', // published, draft, all
      priority,
      targetAudience 
    } = req.query;

    // Build query
    const query = {
      organizationID,
      isActive: true
    };

    // Add status filter and check permissions for drafts
    if (status === 'published') {
      query.isPublished = true;
    } else if (status === 'draft') {
      // Only organizationID=1 admin can view drafts
      const isReleaseAdmin = await isReleaseNotificationAdmin(userId);
      if (!isReleaseAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only organization 1 admin can view draft releases.'
        });
      }
      query.isPublished = false;
    }

    // Add priority filter
    if (priority) {
      query.priority = priority;
    }

    // Add target audience filter
    if (targetAudience) {
      query.targetAudience = targetAudience;
    }


    // Get paginated results
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const releaseNotifications = await ReleaseNotification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'firstName lastName email')
      .lean();

    const total = await ReleaseNotification.countDocuments(query);

    res.json({
      success: true,
      data: releaseNotifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching release notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch release notifications',
      error: error.message
    });
  }
};

// @desc    Get latest release notification
// @route   GET /api/release-notifications/latest
// @access  Authenticated users
const getLatestReleaseNotification = async (req, res) => {
  try {
    const organizationID = req.user.organizationID;
    const { targetAudience = 'all' } = req.query;

    const query = {
      organizationID,
      isActive: true,
      isPublished: true,
      $or: [
        { targetAudience: 'all' },
        { targetAudience: targetAudience }
      ]
    };

    const latestRelease = await ReleaseNotification.findOne(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'firstName lastName email')
      .lean();

    res.json({
      success: true,
      data: latestRelease
    });

  } catch (error) {
    console.error('Error fetching latest release notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch latest release notification',
      error: error.message
    });
  }
};

// @desc    Get release notification by ID
// @route   GET /api/release-notifications/:id
// @access  Authenticated users
const getReleaseNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationID = req.user.organizationID;

    const releaseNotification = await ReleaseNotification.findOne({
      _id: id,
      organizationID,
      isActive: true
    }).populate('createdBy', 'firstName lastName email');

    if (!releaseNotification) {
      return res.status(404).json({
        success: false,
        message: 'Release notification not found'
      });
    }

    res.json({
      success: true,
      data: releaseNotification
    });

  } catch (error) {
    console.error('Error fetching release notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch release notification',
      error: error.message
    });
  }
};

// @desc    Update release notification
// @route   PUT /api/release-notifications/:id
// @access  Admin only
const updateReleaseNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const organizationID = req.user.organizationID;

    // Check if user is admin of organizationID=1 (only org 1 admin can update release notifications)
    const isReleaseAdmin = await isReleaseNotificationAdmin(userId);
    if (!isReleaseAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only organization 1 admin can update release notifications.'
      });
    }

    const releaseNotification = await ReleaseNotification.findOne({
      _id: id,
      organizationID,
      isActive: true
    });

    if (!releaseNotification) {
      return res.status(404).json({
        success: false,
        message: 'Release notification not found'
      });
    }

    // Update fields
    const updateFields = req.body;
    delete updateFields.organizationID; // Prevent changing organization
    delete updateFields.createdBy; // Prevent changing creator
    delete updateFields.createdByName; // Prevent changing creator name

    Object.assign(releaseNotification, updateFields);
    await releaseNotification.save();

    res.json({
      success: true,
      message: 'Release notification updated successfully',
      data: releaseNotification
    });

  } catch (error) {
    console.error('Error updating release notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update release notification',
      error: error.message
    });
  }
};

// @desc    Publish/unpublish release notification
// @route   PATCH /api/release-notifications/:id/publish
// @access  Admin only
const togglePublishStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;
    const userId = req.user._id;
    const organizationID = req.user.organizationID;

    // Check if user is admin of organizationID=1 (only org 1 admin can publish/unpublish release notifications)
    const isReleaseAdmin = await isReleaseNotificationAdmin(userId);
    if (!isReleaseAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only organization 1 admin can publish/unpublish release notifications.'
      });
    }

    const releaseNotification = await ReleaseNotification.findOne({
      _id: id,
      organizationID,
      isActive: true
    });

    if (!releaseNotification) {
      return res.status(404).json({
        success: false,
        message: 'Release notification not found'
      });
    }

    releaseNotification.isPublished = isPublished;
    if (isPublished && !releaseNotification.publishDate) {
      releaseNotification.publishDate = new Date();
    }
    
    await releaseNotification.save();

    res.json({
      success: true,
      message: `Release notification ${isPublished ? 'published' : 'unpublished'} successfully`,
      data: releaseNotification
    });

  } catch (error) {
    console.error('Error toggling publish status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update publish status',
      error: error.message
    });
  }
};

// @desc    Delete release notification
// @route   DELETE /api/release-notifications/:id
// @access  Admin only
const deleteReleaseNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const organizationID = req.user.organizationID;

    // Check if user is admin of organizationID=1 (only org 1 admin can delete release notifications)
    const isReleaseAdmin = await isReleaseNotificationAdmin(userId);
    if (!isReleaseAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only organization 1 admin can delete release notifications.'
      });
    }

    const releaseNotification = await ReleaseNotification.findOne({
      _id: id,
      organizationID,
      isActive: true
    });

    if (!releaseNotification) {
      return res.status(404).json({
        success: false,
        message: 'Release notification not found'
      });
    }

    // Soft delete
    releaseNotification.isActive = false;
    await releaseNotification.save();

    res.json({
      success: true,
      message: 'Release notification deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting release notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete release notification',
      error: error.message
    });
  }
};

// @desc    Get release statistics for admin
// @route   GET /api/release-notifications/stats
// @access  Admin only
const getReleaseStats = async (req, res) => {
  try {
    const organizationID = req.user.organizationID;
    const userId = req.user._id;

    // Check if user is admin of organizationID=1 (only org 1 admin can view release stats)
    const isReleaseAdmin = await isReleaseNotificationAdmin(userId);
    if (!isReleaseAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only organization 1 admin can view release statistics.'
      });
    }

    const stats = await ReleaseNotification.aggregate([
      {
        $match: {
          organizationID,
          isActive: true
        }
      },
      {
        $group: {
          _id: null,
          totalReleases: { $sum: 1 },
          publishedReleases: {
            $sum: { $cond: [{ $eq: ['$isPublished', true] }, 1, 0] }
          },
          draftReleases: {
            $sum: { $cond: [{ $eq: ['$isPublished', false] }, 1, 0] }
          },
          criticalReleases: {
            $sum: { $cond: [{ $eq: ['$priority', 'critical'] }, 1, 0] }
          },
          highPriorityReleases: {
            $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
          }
        }
      }
    ]);

    const releaseStats = stats[0] || {
      totalReleases: 0,
      publishedReleases: 0,
      draftReleases: 0,
      criticalReleases: 0,
      highPriorityReleases: 0
    };

    res.json({
      success: true,
      data: releaseStats
    });

  } catch (error) {
    console.error('Error fetching release stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch release statistics',
      error: error.message
    });
  }
};

module.exports = {
  createReleaseNotification,
  getReleaseNotifications,
  getLatestReleaseNotification,
  getReleaseNotificationById,
  updateReleaseNotification,
  togglePublishStatus,
  deleteReleaseNotification,
  getReleaseStats
};
