const UserActivity = require('../models/UserActivity');

const logActivity = async (userId, type, status, details = '', req = null, loginMethod = null) => {
  try {
    const activityData = {
      type,
      status,
      details
    };

    // Only add user ID if it exists
    if (userId) {
      activityData.user = userId;
    }

    // Add login method if provided
    if (loginMethod) {
      activityData.loginMethod = loginMethod;
    }

    // Add request information if available
    if (req) {
      activityData.ipAddress = req.ip || req.connection.remoteAddress;
      activityData.userAgent = req.headers['user-agent'];
    }

    await UserActivity.create(activityData);
  } catch (error) {
    console.error('Error logging user activity:', error);
  }
};

const getUserActivities = async (userId, page = 1, limit = 5) => {
  try {
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const total = await UserActivity.countDocuments({ user: userId });
    
    // Get paginated activities
    const activities = await UserActivity.find({ user: userId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    return {
      activities,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error fetching user activities:', error);
    return {
      activities: [],
      pagination: {
        total: 0,
        page: 1,
        limit,
        totalPages: 0
      }
    };
  }
};

module.exports = {
  logActivity,
  getUserActivities
}; 