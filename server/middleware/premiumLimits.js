const User = require('../models/User');
const Organization = require('../models/Organization');

// Middleware to check if organization can create more projects
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
    const org = await Organization.findOne({ OrganizationID: user.organizationID });
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    if (user.isPremiumMember && user.isSubscriptionActive()) {
      return next(); // Premium users have unlimited access
    }
    if (org.usageLimits.projectsCreated >= 3) {
      return res.status(403).json({ 
        status: 403,
        error: 'Project limit reached',
        message: 'Your organization has reached the maximum number of projects (3) for free users. Upgrade to premium for unlimited projects.',
        limit: 3,
        current: org.usageLimits.projectsCreated,
        type: 'project'
      });
    }
    next();
  } catch (error) {
    console.error('Error checking project limit:', error);
    res.status(500).json({ error: 'Failed to check project limit' });
  }
};

// Middleware to check if organization can create more user stories
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
    const org = await Organization.findOne({ OrganizationID: user.organizationID });
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    if (user.isPremiumMember && user.isSubscriptionActive()) {
      return next(); // Premium users have unlimited access
    }

    const TaskDetails = require('../models/TaskDetails');
    const projectId = req.body.taskDetail?.ProjectID_FK;
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const existingStoriesCount = await TaskDetails.countDocuments({
      ProjectID_FK: projectId,
      Type: 'User Story',
      IsActive: true
    });

    if (existingStoriesCount >= 1) {
      return res.status(403).json({ 
        status: 403,
        error: 'User Story limit reached',
        message: 'Your organization is limited to 1 user story per project for free users. Upgrade to premium for unlimited user stories.',
        limit: 1,
        current: existingStoriesCount,
        type: 'userStory'
      });
    }
    next();
  } catch (error) {
    console.error('Error checking user story limit:', error);
    res.status(500).json({ error: 'Failed to check user story limit' });
  }
};

// Middleware to check if organization can create more tasks
const checkTaskLimit = async (req, res, next) => {
  try {
    const userId = req.body.taskDetail?.Assignee || req.user?._id;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const org = await Organization.findOne({ OrganizationID: user.organizationID });
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    if (user.isPremiumMember && user.isSubscriptionActive()) {
      return next(); // Premium users have unlimited access
    }
    const TaskDetails = require('../models/TaskDetails');
    const parentId = req.body.taskDetail?.ParentID;
    if (!parentId) {
      return res.status(400).json({ error: 'Parent User Story ID is required' });
    }

    const existingTasksCount = await TaskDetails.countDocuments({
      ParentID: parentId,
      Type: { $ne: 'User Story' },
      IsActive: true
    });

    if (existingTasksCount >= 10) {
      return res.status(403).json({ 
        status: 403,
        error: 'Task limit reached',
        message: 'Your organization has reached the maximum number of tasks (10) per user story for free users. Upgrade to premium for unlimited tasks.',
        limit: 10,
        current: existingTasksCount,
        type: 'task'
      });
    }
    next();
  } catch (error) {
    console.error('Error checking task limit:', error);
    res.status(500).json({ error: 'Failed to check task limit' });
  }
};

// Middleware to check if organization can create more teams
const checkTeamLimit = async (req, res, next) => {
  try {
    const userId = req.body.OwnerID || req.user?._id;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const org = await Organization.findOne({ OrganizationID: user.organizationID });
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    if (user.isPremiumMember && user.isSubscriptionActive()) {
      return next(); // Premium users have unlimited access
    }
    if (org.usageLimits.teamsCreated >= 3) {
      return res.status(403).json({ 
        status: 403,
        error: 'Team limit reached',
        message: 'Your organization has reached the maximum number of teams (3) for free users. Upgrade to premium for unlimited teams.',
        limit: 3,
        current: org.usageLimits.teamsCreated,
        type: 'team'
      });
    }
    next();
  } catch (error) {
    console.error('Error checking team limit:', error);
    res.status(500).json({ error: 'Failed to check team limit' });
  }
};

// Middleware to increment usage after successful creation
const incrementUsage = async (req, res, next) => {
  try {
    const userId = req.body.ProjectOwner || req.body.taskDetail?.CreatedBy || req.body.OwnerID || req.user?._id;
    if (!userId) {
      return next();
    }
    const user = await User.findById(userId);
    if (!user) {
      return next();
    }
    const org = await Organization.findOne({ OrganizationID: user.organizationID });
    if (!org) {
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
    } else if (req.body.TeamName && req.body.OwnerID) {
      type = 'team';
    }
    if (type) {
      await org.incrementUsage(type);
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
  checkTeamLimit,
  incrementUsage
}; 