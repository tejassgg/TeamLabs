const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Team = require('../models/Team');
const User = require('../models/User');
const CommonType = require('../models/CommonType');
const UserActivity = require('../models/UserActivity');

// Get dashboard statistics
router.get('/:organizationId', async (req, res) => {
  try {
    const { organizationId } = req.params;

    // Get all projects in the organization
    const projects = await Project.find({ OrganizationID: organizationId });
    
    // Get all teams in the organization
    const teams = await Team.find({ organizationID: organizationId });
    
    // Get all users in the organization
    const users = await User.find({ organizationID: organizationId });

    // Get last login timestamps for all users
    const lastLogins = await UserActivity.find({
      user: { $in: users.map(u => u._id) },
      type: 'login',
      status: 'success'
    }).sort({ timestamp: -1 });

    // Create a map of user's last login
    const lastLoginMap = {};
    lastLogins.forEach(login => {
      if (!lastLoginMap[login.user.toString()] || 
          new Date(login.timestamp) > new Date(lastLoginMap[login.user.toString()])) {
        lastLoginMap[login.user.toString()] = login.timestamp;
      }
    });

    // Calculate upcoming deadlines (projects due today or in the future)
    const now = new Date();
    
    const upcomingDeadlines = projects.filter(project => {
      if (!project.FinishDate) return false;
      const finish = new Date(project.FinishDate);
      const diff = finish - now;
      return diff > 0; // Only include projects that haven't passed their deadline
    });

    // Get organization details
    const organization = await CommonType.findOne({MasterType: 'Organization', Code: organizationId});
    const projStatus = await CommonType.find({MasterType: 'ProjectStatus'});

    // Prepare dashboard statistics
    const dashboardStats = {
      totalProjects: projects.length,
      totalTeams: teams.length,
      totalUsers: users.length,
      upcomingDeadlines: upcomingDeadlines.length,
      organizationName: organization?.Value || 'Unknown Organization',
      recentProjects: projects.slice(0, 5).map(project => ({
        id: project._id,
        name: project.Name,
        deadline: project.FinishDate,
        isActive: project.IsActive,
        projectStatus: projStatus.find(item => item.Code === project.ProjectStatusID)?.Value || 'Unknown Status'
      })),
      recentTeams: teams.slice(0, 5).map(team => ({
        id: team._id,
        name: team.TeamName,
        memberCount: team.members?.length || 0
      })),
      deadlineDetails: upcomingDeadlines.map(project => {
        const finish = new Date(project.FinishDate);
        const diff = finish - now;
        const daysRemaining = Math.floor(diff / (1000 * 60 * 60 * 24));
        return {
          id: project._id,
          name: project.Name,
          deadline: project.FinishDate,
          daysRemaining: daysRemaining
        };
      }),
      members: users.map(user => {
        return {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email || 'No email',
          isActive: user.isActive || false,
          role: user.role || 'User',
          initials: `${user.firstName[0] || ''}${user.lastName[0] || ''}`.toUpperCase() || 'U',
          lastLogin: lastLoginMap[user._id.toString()] || null,
          status: user.status || 'Offline',
          username: user.username || 'No username'
        };
      })
    };

    res.json(dashboardStats);
  } catch (error) {
    console.error('Error fetching dashboard details:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard details' });
  }
});

module.exports = router; 