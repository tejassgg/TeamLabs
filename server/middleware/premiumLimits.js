const User = require('../models/User');

// Middleware to check if user can create more projects
const checkProjectLimit = async (req, res, next) => {
  try {
    const userId = req.body.ProjectOwner || req.user?._id;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.isPremiumMember && user.isSubscriptionActive()) {
      return next(); // Premium users have unlimited access
    }

    if (!user.canCreateProject()) {
      return res.status(403).json({ 
        status: 403,
        error: 'Project limit reached',
        message: 'You have reached the maximum number of projects (3) for free users. Upgrade to premium for unlimited projects.',
        limit: 3,
        current: user.usageLimits.projectsCreated,
        type: 'project'
      });
    }

    next();
  } catch (error) {
    console.error('Error checking project limit:', error);
    res.status(500).json({ error: 'Failed to check project limit' });
  }
};

// Middleware to check if user can create more user stories
const checkUserStoryLimit = async (req, res, next) => {
  try {
    const userId = req.body.taskDetail?.CreatedBy || req.user?._id;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isPremiumMember && user.isSubscriptionActive()) {
      return next(); // Premium users have unlimited access
    }

    if (!user.canCreateUserStory()) {
      return res.status(403).json({ 
        status: 403,
        error: 'User Story limit reached',
        message: 'You have reached the maximum number of user stories (3) for free users. Upgrade to premium for unlimited user stories.',
        limit: 3,
        current: user.usageLimits.userStoriesCreated,
        type: 'userStory'
      });
    }

    next();
  } catch (error) {
    console.error('Error checking user story limit:', error);
    res.status(500).json({ error: 'Failed to check user story limit' });
  }
};

// Middleware to check if user can create more tasks
const checkTaskLimit = async (req, res, next) => {
  try {
    const userId = req.body.taskDetail?.CreatedBy || req.user?._id;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isPremiumMember && user.isSubscriptionActive()) {
      return next(); // Premium users have unlimited access
    }

    if (!user.canCreateTask()) {
      return res.status(403).json({ 
        status: 403,
        error: 'Task limit reached',
        message: 'You have reached the maximum number of tasks (20) per user story for free users. Upgrade to premium for unlimited tasks.',
        limit: 20,
        current: user.usageLimits.tasksCreated,
        type: 'task'
      });
    }

    next();
  } catch (error) {
    console.error('Error checking task limit:', error);
    res.status(500).json({ error: 'Failed to check task limit' });
  }
};

// Middleware to increment usage after successful creation
const incrementUsage = async (req, res, next) => {
  try {
    const userId = req.body.ProjectOwner || req.body.taskDetail?.CreatedBy || req.user?._id;
    if (!userId) {
      return next();
    }

    const user = await User.findById(userId);
    if (!user) {
      return next();
    }

    // Determine the type of creation based on the request
    let type = null;
    if (req.body.Name && req.body.ProjectOwner) {
      type = 'project';
    } else if (req.body.taskDetail?.Type === 'User Story') {
      type = 'userStory';
    } else if (req.body.taskDetail?.Type) {
      type = 'task';
    }

    if (type) {
      await user.incrementUsage(type);
    }

    next();
  } catch (error) {
    console.error('Error incrementing usage:', error);
    next(); // Don't fail the request if usage increment fails
  }
};

module.exports = {
  checkProjectLimit,
  checkUserStoryLimit,
  checkTaskLimit,
  incrementUsage
}; 