const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Team = require('../models/Team');
const User = require('../models/User');
const CommonType = require('../models/CommonType');
const UserActivity = require('../models/UserActivity');
const TaskDetails = require('../models/TaskDetails');
const Invite = require('../models/Invite');
const Organization = require('../models/Organization');
const Comment = require('../models/Comment');
const { protect } = require('../middleware/auth');

// Get recent comments across the organization's projects
router.get('/:organizationId/recent-comments', async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    // Find all projects in the organization
    const projects = await Project.find({ OrganizationID: organizationId });
    const projectIds = projects.map(p => p.ProjectID);
    
    // Find all tasks in these projects
    const tasks = await TaskDetails.find({ ProjectID_FK: { $in: projectIds } });
    const taskIds = tasks.map(t => t.TaskID);
    
    // Find the latest comments for these tasks
    const comments = await Comment.find({ TaskID: { $in: taskIds } })
      .sort({ CreatedAt: -1 })
      .limit(10);
      
    const authorIds = [...new Set(comments.map(c => c.Author))];
    
    const users = await User.find({
      $or: [
        { _id: { $in: authorIds.filter(id => id && id.match(/^[0-9a-fA-F]{24}$/)) } },
        { username: { $in: authorIds } }
      ]
    }).select('firstName lastName username email');
    
    const userMap = {};
    users.forEach(u => {
      userMap[u._id.toString()] = u;
      userMap[u.username] = u;
    });
    
    const commentsWithDetails = comments.map(c => {
      const authorUser = userMap[c.Author];
      const taskObj = tasks.find(t => t.TaskID === c.TaskID);
      const projectObj = taskObj ? projects.find(p => p.ProjectID === taskObj.ProjectID_FK) : null;
      return {
        CommentID: c.CommentID,
        TaskID: c.TaskID,
        TaskName: taskObj ? taskObj.Name : 'Unknown Task',
        ProjectName: projectObj ? projectObj.Name : 'Unknown Project',
        Author: c.Author,
        AuthorDetails: authorUser ? {
          _id: authorUser._id,
          fullName: `${authorUser.firstName} ${authorUser.lastName}`.trim(),
          username: authorUser.username,
          initials: `${authorUser.firstName[0] || ''}${authorUser.lastName[0] || ''}`.toUpperCase()
        } : null,
        Content: c.Content,
        CreatedAt: c.CreatedAt
      };
    });
    
    res.json(commentsWithDetails);
  } catch (error) {
    console.error('Error fetching recent comments for dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch recent comments' });
  }
});

// Get recent GitHub commits across all organization projects
router.get('/:organizationId/github-commits', async (req, res) => {
  try {
    const { organizationId } = req.params;
    const axios = require('axios');
    const Integration = require('../models/Integration');
    
    // Find all projects in the organization with connected repos
    const projects = await Project.find({
      OrganizationID: organizationId,
      'githubRepository.connected': true
    });
    
    if (projects.length === 0) {
      return res.json([]);
    }
    
    let allCommits = [];
    
    // Fetch commits for each project in parallel
    const promises = projects.map(async (project) => {
      try {
        const linkingIntegration = await Integration.findOne({
          userId: project.githubRepository.connectedBy,
          integrationType: 'github'
        });
        
        if (!linkingIntegration || !linkingIntegration.isConnected || !linkingIntegration.accessToken) {
          return;
        }
        
        const response = await axios.get(
          `https://api.github.com/repos/${project.githubRepository.repositoryFullName}/commits`,
          {
            headers: {
              'Authorization': `token ${linkingIntegration.accessToken}`,
              'Accept': 'application/vnd.github.v3+json'
            },
            params: {
              per_page: 5
            }
          }
        );
        
        const projectCommits = response.data.map(commit => ({
          sha: commit.sha,
          message: commit.commit.message,
          authorName: commit.commit.author.name,
          authorEmail: commit.commit.author.email,
          date: commit.commit.author.date,
          htmlUrl: commit.html_url,
          projectName: project.Name,
          projectId: project.ProjectID
        }));
        
        allCommits.push(...projectCommits);
      } catch (err) {
        console.error(`Error fetching commits for project ${project.Name}:`, err.message);
      }
    });
    
    await Promise.all(promises);
    
    // Sort all commits by date desc
    allCommits.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Return latest 10 commits
    res.json(allCommits.slice(0, 10));
  } catch (error) {
    console.error('Error fetching dashboard GitHub commits:', error);
    res.status(500).json({ error: 'Failed to fetch GitHub commits' });
  }
});

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

    // Get all invites for the organization
    const invites = await Invite.find({ organizationID: organizationId })
      .populate('inviter', 'firstName lastName email')
      .sort({ createdAt: -1 });

    // Update expired invites
    const updatedInvites = invites.map(invite => {
      if (invite.status === 'Pending' && invite.isExpired()) {
        invite.status = 'Expired';
        invite.save();
      }
      return invite;
    });

    // Get all tasks in the organization
    const tasks = await TaskDetails.find({ 
      ProjectID_FK: { $in: projects.map(p => p.ProjectID) }
    });

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
      if (!project.DueDate) return false;
      const due = new Date(project.DueDate);
      const diff = due - now;
      return diff > 0; // Only include projects that haven't passed their deadline
    });

    // Get organization details
    const organization = await Organization.findOne({OrganizationID: organizationId});
    const projStatus = await CommonType.find({MasterType: 'ProjectStatus'});

    // Calculate project status distribution
    const projectStatusDistribution = {};
    projects.forEach(project => {
      const status = projStatus.find(item => item.Code === project.ProjectStatusID)?.Value || 'Unknown Status';
      projectStatusDistribution[status] = (projectStatusDistribution[status] || 0) + 1;
    });

    // Calculate task type distribution
    const taskTypeDistribution = {};
    tasks.forEach(task => {
      taskTypeDistribution[task.Type] = (taskTypeDistribution[task.Type] || 0) + 1;
    });

    // Calculate monthly activity (last 12 months)
    const monthlyActivity = {
      projectsCreated: Array(12).fill(0),
      tasksCompleted: Array(12).fill(0)
    };

    const currentYear = new Date().getFullYear();
    projects.forEach(project => {
      const createdDate = new Date(project.CreatedDate);
      if (createdDate.getFullYear() === currentYear) {
        const month = createdDate.getMonth();
        monthlyActivity.projectsCreated[month]++;
      }
    });

    // Get completed tasks (assuming status 5 or higher means completed)
    const completedTasks = tasks.filter(task => task.Status >= 5);
    completedTasks.forEach(task => {
      const createdDate = new Date(task.CreatedDate);
      if (createdDate.getFullYear() === currentYear) {
        const month = createdDate.getMonth();
        monthlyActivity.tasksCompleted[month]++;
      }
    });

    // Calculate team performance metrics
    const teamPerformance = teams.map(team => {
      const teamProjects = projects.filter(project => 
        project.ProjectOwner === team.OwnerID || 
        project.OrganizationID === team.organizationID
      );
      
      return {
        teamId: team.TeamID,
        teamName: team.TeamName,
        memberCount: team.members?.length || 0,
        activeProjects: teamProjects.filter(p => p.IsActive).length,
        totalProjects: teamProjects.length
      };
    });

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentActivity = await UserActivity.find({
      user: { $in: users.map(u => u._id) },
      timestamp: { $gte: thirtyDaysAgo }
    }).sort({ timestamp: -1 }).limit(50);

    // Calculate activity by type
    const activityByType = {};
    recentActivity.forEach(activity => {
      activityByType[activity.type] = (activityByType[activity.type] || 0) + 1;
    });

    // Prepare dashboard statistics
    const dashboardStats = {
      totalProjects: projects.length,
      totalTeams: teams.length,
      totalUsers: users.length,
      upcomingDeadlines: upcomingDeadlines.length,
      organizationName: organization?.Name || 'Unknown Organization',
      recentProjects: projects.slice(0, 5).map(project => ({
        id: project.ProjectID,
        name: project.Name,
        deadline: project.DueDate,
        isActive: project.IsActive,
        projectStatusId: project.ProjectStatusID,
        projectStatus: projStatus.find(item => item.Code === project.ProjectStatusID)?.Value || 'Unknown Status',
        description: project.Description
      })),
      recentTeams: teams.slice(0, 5).map(team => ({
        id: team._id,
        name: team.TeamName,
        memberCount: team.members?.length || 0
      })),
      deadlineDetails: upcomingDeadlines.map(project => {
        const due = new Date(project.DueDate);
        const diff = due - now;
        const daysRemaining = Math.floor(diff / (1000 * 60 * 60 * 24));
        return {
          id: project._id,
          name: project.Name,
          deadline: project.DueDate,
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
          status: user.status || (user.isActive ? 'Active' : 'Offline'),
          username: user.username || 'No username'
        };
      }),
      invites: updatedInvites.map(invite => ({
        _id: invite._id,
        email: invite.email,
        status: invite.status,
        invitedAt: invite.invitedAt,
        expiredAt: invite.expiredAt,
        acceptedAt: invite.acceptedAt,
        inviter: invite.inviter ? {
          firstName: invite.inviter.firstName,
          lastName: invite.inviter.lastName,
          email: invite.inviter.email
        } : null
      })),
      // Chart data
      charts: {
        projectStatusDistribution,
        taskTypeDistribution,
        monthlyActivity,
        teamPerformance,
        activityByType,
        totalTasks: tasks.length,
        completedTasks: completedTasks.length,
        activeTasks: tasks.filter(task => task.Status < 5).length
      }
    };

    res.json(dashboardStats);
  } catch (error) {
    console.error('Error fetching dashboard details:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard details' });
  }
});

// GET /api/dashboard/:organizationId/whats-up - Personalized "What's Up" statistics for the logged-in user
router.get('/:organizationId/whats-up', protect, async (req, res) => {
  try {
    const { organizationId } = req.params;
    const userId = req.user._id.toString();
    const username = req.user.username;

    // 1. Get all projects in the organization
    const projects = await Project.find({ OrganizationID: organizationId });
    const projectMap = {};
    projects.forEach(p => {
      projectMap[p.ProjectID] = p.Name;
    });
    const projectIds = projects.map(p => p.ProjectID);

    // 2. Query active, uncompleted tasks assigned to the user
    const userTasks = await TaskDetails.find({
      ProjectID_FK: { $in: projectIds },
      AssignedTo: userId,
      IsActive: true,
      Status: { $lt: 5 }
    });

    const todos = userTasks.map(t => ({
      TaskID: t.TaskID,
      Name: t.Name,
      Description: t.Description || '',
      Status: t.Status,
      Priority: t.Priority,
      Type: t.Type,
      DueDate: t.DueDate,
      ProjectName: projectMap[t.ProjectID_FK] || 'Unknown Project'
    }));

    // 3. Timeline / What's Ahead (tasks sorted by DueDate)
    const timeline = todos
      .filter(t => t.DueDate)
      .sort((a, b) => new Date(a.DueDate) - new Date(b.DueDate));

    // 4. Query recent comments tagging the user (@username)
    const allTasks = await TaskDetails.find({ ProjectID_FK: { $in: projectIds } });
    const taskMap = {};
    allTasks.forEach(t => {
      taskMap[t.TaskID] = { name: t.Name, projectId: t.ProjectID_FK };
    });
    const allTaskIds = allTasks.map(t => t.TaskID);

    const taggedComments = await Comment.find({
      TaskID: { $in: allTaskIds },
      Content: { $regex: `@${username}\\b`, $options: 'i' }
    }).sort({ CreatedAt: -1 }).limit(10);

    const authorIds = [...new Set(taggedComments.map(c => c.Author))];
    const commentUsers = await User.find({
      $or: [
        { _id: { $in: authorIds.filter(id => id && id.match(/^[0-9a-fA-F]{24}$/)) } },
        { username: { $in: authorIds } }
      ]
    }).select('firstName lastName username email');

    const userMap = {};
    commentUsers.forEach(u => {
      userMap[u._id.toString()] = u;
      userMap[u.username] = u;
    });

    const commentsWithDetails = taggedComments.map(c => {
      const authorUser = userMap[c.Author];
      const t = taskMap[c.TaskID];
      return {
        CommentID: c.CommentID,
        TaskID: c.TaskID,
        TaskName: t ? t.name : 'Unknown Task',
        ProjectName: t ? (projectMap[t.projectId] || 'Unknown Project') : 'Unknown Project',
        Author: c.Author,
        AuthorDetails: authorUser ? {
          fullName: `${authorUser.firstName} ${authorUser.lastName}`.trim(),
          username: authorUser.username,
          initials: `${authorUser.firstName[0] || ''}${authorUser.lastName[0] || ''}`.toUpperCase()
        } : null,
        Content: c.Content,
        CreatedAt: c.CreatedAt
      };
    });

    // 5. Recent updates/activities on user's assigned tasks
    const userTaskIds = userTasks.map(t => t.TaskID);
    const taskUpdates = await UserActivity.find({
      'metadata.taskId': { $in: userTaskIds }
    }).sort({ timestamp: -1 }).limit(15);

    const actorIds = [...new Set(taskUpdates.map(a => a.user))];
    const actors = await User.find({ _id: { $in: actorIds } }).select('firstName lastName username');
    const actorMap = {};
    actors.forEach(u => {
      actorMap[u._id.toString()] = u;
    });

    const updatesWithDetails = taskUpdates.map(a => {
      const actor = actorMap[a.user?.toString()];
      const taskId = a.metadata instanceof Map ? a.metadata.get('taskId') : a.metadata?.taskId;
      const taskObj = userTasks.find(t => t.TaskID === taskId);
      return {
        id: a._id,
        type: a.type,
        status: a.status,
        details: a.details,
        timestamp: a.timestamp,
        taskName: taskObj ? taskObj.Name : 'Assigned Task',
        actor: actor ? `${actor.firstName} ${actor.lastName}`.trim() : 'System'
      };
    });

    res.json({
      success: true,
      todosCount: todos.length,
      topicsCount: commentsWithDetails.length,
      todos,
      timeline,
      taggedComments: commentsWithDetails,
      taskUpdates: updatesWithDetails
    });
  } catch (error) {
    console.error('Error fetching dashboard whats-up details:', error);
    res.status(500).json({ error: 'Failed to fetch whats-up details' });
  }
});

module.exports = router; 