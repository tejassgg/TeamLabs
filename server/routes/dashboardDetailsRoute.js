const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Team = require('../models/Team');
const User = require('../models/User');
const CommonType = require('../models/CommonType');

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

    // Calculate upcoming deadlines (projects due in next 7 days)
    const today = new Date();
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const upcomingDeadlines = projects.filter(project => {
      if (!project.FinishDate) return false;
      const deadline = new Date(project.FinishDate);
      return deadline >= today && deadline <= nextMonth;
    });

    // Get organization details
    const organization = await CommonType.findOne({MasterType: 'Organization', Code: organizationId});

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
        status: project.IsActive ? 'Active' : 'Inactive'
      })),
      recentTeams: teams.slice(0, 5).map(team => ({
        id: team._id,
        name: team.TeamName,
        memberCount: team.members?.length || 0
      })),
      deadlineDetails: upcomingDeadlines.map(project => ({
        id: project._id,
        name: project.Name,
        deadline: project.FinishDate,
        daysRemaining: Math.ceil((new Date(project.FinishDate) - today) / (1000 * 60 * 60 * 24))
      }))
    };

    res.json(dashboardStats);
  } catch (error) {
    console.error('Error fetching dashboard details:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard details' });
  }
});

module.exports = router; 