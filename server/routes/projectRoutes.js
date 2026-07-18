const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const User = require('../models/User');
const TeamDetails = require('../models/TeamDetails');
const ProjectDetails = require('../models/ProjectDetails');
const TaskDetails = require('../models/TaskDetails');
const Team = require('../models/Team');
const { logActivity } = require('../services/activityService');
const { checkProjectLimit, incrementUsage } = require('../middleware/premiumLimits');
const { protect } = require('../middleware/auth');
const { linkRepositoryToProject, unlinkRepositoryFromProject, getProjectRepository, getProjectCommits, getProjectBranches, getProjectPullRequests, getProjectIssues } = require('../controllers/authController');
const { emitDashboardMetrics } = require('../services/dashboardMetricsService');
const { GoogleGenAI } = require('@google/genai');
const { sendReleaseSummaryEmail } = require('../services/emailService');

// GET /api/projects/overview - fetch projects with statistics for projects page
router.get('/overview', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const organizationID = req.user.organizationID;

    let projects = [];
    
    // If user is Admin, show all projects in the organization
    if (userRole === 'Admin') {
      projects = await Project.find({ 
        OrganizationID: organizationID,
        IsActive: true 
      });
    } else {
      // For non-admin users, show only projects they're assigned to
      // 1. Find all TeamIDs where user is a member
      const teamDetails = await TeamDetails.find({ MemberID: userId, IsMemberActive: true });
      let teamIds = teamDetails.map(td => td.TeamID_FK);
      const teamsForOrg = await Team.find({ TeamID: { $in: teamIds }, organizationID: organizationID });
      teamIds = teamsForOrg.map(td => td.TeamID);
      // 2. Find all ProjectIDs from ProjectDetails where TeamID is in that list
      const projectDetails = await ProjectDetails.find({ TeamID: { $in: teamIds }, IsActive: true });
      const projectIds = projectDetails.map(pd => pd.ProjectID);
      // 3. Return only those projects
      projects = await Project.find({ ProjectID: { $in: projectIds } });
    }

    const projectIds = projects.map(p => p.ProjectID);

    // 1. Batch fetch all active tasks for these projects
    const allTasks = await TaskDetails.find({
      ProjectID_FK: { $in: projectIds },
      IsActive: true,
      Type: { $ne: "User Story" } // Exclude user stories from task count
    });

    // 2. Batch fetch all ProjectDetails for these projects
    const allProjectDetails = await ProjectDetails.find({
      ProjectID: { $in: projectIds },
      IsActive: true
    });

    const assignedTeamIds = [...new Set(allProjectDetails.map(pd => pd.TeamID))];

    // 3. Batch fetch TeamDetails for assigned teams
    const allTeamDetails = await TeamDetails.find({
      TeamID_FK: { $in: assignedTeamIds },
      IsMemberActive: true
    });

    const uniqueMemberIds = [...new Set(allTeamDetails.map(td => td.MemberID))];

    // 4. Batch fetch User details
    const allUsers = await User.find({ _id: { $in: uniqueMemberIds } }).select('_id firstName lastName email username');

    // 5. Batch fetch Team details
    const allTeams = await Team.find({ TeamID: { $in: assignedTeamIds } });

    // Map helpers
    const userMap = new Map();
    allUsers.forEach(user => {
      userMap.set(user._id.toString(), {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username
      });
    });

    const teamMap = new Map();
    allTeams.forEach(team => {
      teamMap.set(team.TeamID, {
        TeamID: team.TeamID,
        Name: team.TeamName,
        Description: team.TeamDescription,
        TeamType: team.TeamType,
        IsActive: team.IsActive,
        TeamColor: team.TeamColor
      });
    });

    // Group tasks by project in memory
    const projectTasksMap = new Map();
    allTasks.forEach(task => {
      const pid = task.ProjectID_FK;
      if (!projectTasksMap.has(pid)) {
        projectTasksMap.set(pid, []);
      }
      projectTasksMap.get(pid).push(task);
    });

    // Group ProjectDetails by project in memory
    const projectTeamsMap = new Map();
    allProjectDetails.forEach(pd => {
      const pid = pd.ProjectID;
      if (!projectTeamsMap.has(pid)) {
        projectTeamsMap.set(pid, []);
      }
      projectTeamsMap.get(pid).push(pd.TeamID);
    });

    // Group TeamDetails by team in memory
    const teamMembersMap = new Map();
    allTeamDetails.forEach(td => {
      const tid = td.TeamID_FK;
      if (!teamMembersMap.has(tid)) {
        teamMembersMap.set(tid, []);
      }
      teamMembersMap.get(tid).push(td.MemberID);
    });

    // Construct final list of projects with their statistics
    const projectsWithStats = projects.map(project => {
      const pid = project.ProjectID;

      // Tasks stats
      const tasks = projectTasksMap.get(pid) || [];
      const completedTasks = tasks.filter(task => task.Status === 6).length;
      const totalTasks = tasks.length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Teams stats
      const projectTeamIds = projectTeamsMap.get(pid) || [];
      const projectTeams = projectTeamIds
        .map(tid => teamMap.get(tid))
        .filter(Boolean);

      // Members stats
      const projectMemberIds = new Set();
      projectTeamIds.forEach(tid => {
        const members = teamMembersMap.get(tid) || [];
        members.forEach(mid => projectMemberIds.add(mid.toString()));
      });

      const memberDetails = [...projectMemberIds]
        .map(mid => userMap.get(mid))
        .filter(Boolean);

      return {
        ...project.toObject(),
        tasksCount: totalTasks,
        membersCount: projectMemberIds.size,
        members: memberDetails,
        progress: progress,
        teams: projectTeams,
        tasks: tasks.map(task => ({
          TaskID: task.TaskID,
          Name: task.Name,
          Status: task.Status,
          Type: task.Type,
          Priority: task.Priority
        }))
      };
    });

    res.json(projectsWithStats);
  } catch (err) {
    console.error('Error fetching projects overview:', err);
    res.status(500).json({ error: 'Failed to fetch projects overview' });
  }
});

// GET /api/projects - fetch all projects the user is allocated to
router.get('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    // 1. Find all TeamIDs where user is a member
    const teamDetails = await TeamDetails.find({ MemberID: userId, IsMemberActive: true });
    const teamIds = teamDetails.map(td => td.TeamID_FK);
    // 2. Find all ProjectIDs from ProjectDetails where TeamID is in that list
    const projectDetails = await ProjectDetails.find({ TeamID: { $in: teamIds }, IsActive: true });
    const projectIds = projectDetails.map(pd => pd.ProjectID);
    // 3. Return only those projects
    const projects = await Project.find({ ProjectID: { $in: projectIds } });

    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// POST /api/projects - add a new project
router.post('/', checkProjectLimit, async (req, res) => {
  try {
    const { Name, Description, ProjectOwner, OrganizationID, DueDate, Goals } = req.body;
    if (!Name) return res.status(400).json({ error: 'Project Name is required' });
    if (!OrganizationID) return res.status(400).json({ error: 'OrganisationID is required' });
    if (!ProjectOwner) return res.status(401).json({ error: 'Unauthorized: ProjectOwner not found' });

    const parsedGoals = Array.isArray(Goals)
      ? Goals.map(g => typeof g === 'string' ? { text: g, completed: false } : g)
      : [];

    const newProject = new Project({
      Name,
      Description,
      ProjectOwner,
      OrganizationID,
      DueDate: DueDate ? new Date(DueDate) : null,
      IsActive: true,
      ProjectStatusID: 1,
      Goals: parsedGoals
    });
    await newProject.save();

    // Increment usage for non-premium users
    await incrementUsage(req, res, () => { });

    // Log the activity
    await logActivity(
      ProjectOwner,
      'project_create',
      'success',
      `Created new project "${Name}"`,
      req,
      {
        projectId: newProject.ProjectID,
        projectName: Name,
        organizationId: OrganizationID,
        dueDate: DueDate
      }
    );

    try { await emitDashboardMetrics(OrganizationID); } catch (e) { }
    res.status(201).json(newProject);
  } catch (err) {
    console.error('Error creating project:', err);
    // Log the error activity
    try {
      await logActivity(
        req.body.ProjectOwner,
        'project_create',
        'error',
        `Failed to create project: ${err.message}`,
        req,
        {
          projectName: req.body.Name,
          error: err.message
        }
      );
    } catch (logError) {
      console.error('Failed to log error activity:', logError);
    }
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PATCH /api/projects/:projectId - update project info
router.patch('/:projectId', async (req, res) => {
  try {
    const { Name, Description, DueDate, ProjectStatusID, Goals } = req.body;

    // Try to find project by _id first, then by ProjectID
    let project = await Project.findOne({ ProjectID: req.params.projectId });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const oldValues = {
      name: project.Name,
      description: project.Description,
      dueDate: project.DueDate,
      statusId: project.ProjectStatusID
    };

    if (Name) project.Name = Name;
    if (Description !== undefined) project.Description = Description;
    if (DueDate !== undefined) project.DueDate = DueDate ? new Date(DueDate) : null;
    if (ProjectStatusID !== undefined) project.ProjectStatusID = ProjectStatusID;
    if (Goals !== undefined) project.Goals = Goals;
    project.ModifiedDate = new Date();
    await project.save();

    // Log the activity
    await logActivity(
      project.ProjectOwner,
      'project_update',
      'success',
      `Updated project "${project.Name}"`,
      req,
      {
        projectId: project.ProjectID,
        projectName: project.Name,
        oldValues,
        newValues: {
          name: project.Name,
          description: project.Description,
          dueDate: project.DueDate,
          statusId: project.ProjectStatusID
        }
      }
    );

    try { await emitDashboardMetrics(project.OrganizationID); } catch (e) { }
    res.json(project);
  } catch (err) {
    console.error('Error updating project:', err);
    // Log the error activity
    try {
      let project = null;
      try {
        project = await Project.findById(req.params.projectId);
      } catch (findError) {
        project = await Project.findOne({ ProjectID: req.params.projectId });
      }
      await logActivity(
        project?.ProjectOwner,
        'project_update',
        'error',
        `Failed to update project: ${err.message}`,
        req,
        {
          projectId: req.params.projectId,
          error: err.message
        }
      );
    } catch (logError) {
      console.error('Failed to log error activity:', logError);
    }
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// PATCH /api/projects/:projectId/toggle-status - toggle IsActive
router.patch('/:projectId/toggle-status', async (req, res) => {
  try {
    // Try to find project by _id first, then by ProjectID
    let project = null;
    try {
      project = await Project.findById(req.params.projectId);
    } catch (findError) {
      project = await Project.findOne({ ProjectID: req.params.projectId });
    }

    if (!project) return res.status(404).json({ error: 'Project not found' });
    project.IsActive = !project.IsActive;
    project.ModifiedDate = new Date();
    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project status' });
  }
});

// Project GitHub Repository routes
router.post('/:projectId/github/link', protect, linkRepositoryToProject);
router.post('/:projectId/github/unlink', protect, unlinkRepositoryFromProject);
router.get('/:projectId/github/repository', protect, getProjectRepository);
router.get('/:projectId/github/commits', protect, getProjectCommits);
router.get('/:projectId/github/branches', protect, getProjectBranches);
router.get('/:projectId/github/pullrequests', protect, getProjectPullRequests);
router.get('/:projectId/github/issues', protect, getProjectIssues);

// Generate release summary using Gemini LLM
router.post('/:projectId/releases/generate', protect, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // Find the project
    const project = await Project.findOne({ ProjectID: projectId });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Fetch all completed tasks in the project within the range
    const completedTasks = await TaskDetails.find({
      ProjectID_FK: projectId,
      Status: 6, // Completed status code
      ModifiedDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
      IsActive: true
    });

    // Fetch commits from linked GitHub repository if connected
    let commits = [];
    if (project.githubRepository?.connected) {
      const Integration = require('../models/Integration');
      const linkingIntegration = await Integration.findOne({
        userId: project.githubRepository.connectedBy,
        integrationType: 'github'
      });

      if (linkingIntegration && linkingIntegration.isConnected && linkingIntegration.accessToken) {
        try {
          const axios = require('axios');
          const response = await axios.get(
            `https://api.github.com/repos/${project.githubRepository.repositoryFullName}/commits`,
            {
              headers: {
                'Authorization': `token ${linkingIntegration.accessToken}`,
                'Accept': 'application/vnd.github.v3+json'
              },
              params: {
                since: new Date(startDate).toISOString(),
                until: new Date(endDate).toISOString(),
                per_page: 50
              }
            }
          );
          commits = response.data.map(c => ({
            sha: c.sha,
            message: c.commit.message,
            author: c.commit.author.name,
            date: c.commit.author.date
          }));
        } catch (githubErr) {
          console.error('Error fetching commits during release generation:', githubErr.message);
        }
      }
    }

    if (completedTasks.length === 0 && commits.length === 0) {
      return res.json({
        success: true,
        releaseSummary: "No activity (completed tasks or commits) was found within the specified date range to generate a release summary."
      });
    }

    // Initialize Google Generative AI
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key is not configured' });
    }

    const geminiAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Construct prompt
    const prompt = `You are a professional project release manager. 
Your task is to generate a premium quality, clear, and engaging markdown release summary (changelog) for the project "${project.Name}".

Here is the activity data for the release period from ${startDate} to ${endDate}:

Completed Tasks:
${completedTasks.length > 0 ? completedTasks.map(t => `- [${t.Type}] ${t.Name}: ${t.Description || 'No description'}`).join('\n') : 'No completed tasks.'}

Recent Git Commits:
${commits.length > 0 ? commits.map(c => `- Commit: ${c.message} (by ${c.author})`).join('\n') : 'No recent commits.'}

Instructions:
1. Summarize the major accomplishments, new features, bug fixes, and improvements.
2. Group the items into logical sections (e.g., "New Features", "Bug Fixes", "Improvements", etc.).
3. Format it beautifully using clean Markdown (headers, bullet points, bold text).
4. Keep the tone professional, encouraging, and clear.
5. Avoid technical jargon or raw commit hashes unless relevant.
6. Do NOT include markdown styling wrapper like blockquotes or generic intro text like "Here is your release notes". Just return the markdown changelog body directly starting with section headers.`;

    const response = await geminiAI.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        thinkingConfig: {
          thinkingBudget: 0
        }
      }
    });

    res.json({
      success: true,
      releaseSummary: response.text
    });
  } catch (error) {
    console.error('Error generating release summary:', error);
    res.status(500).json({ error: 'Failed to generate release summary' });
  }
});

// Get latest release version
router.get('/:projectId/releases/latest', protect, async (req, res) => {
  try {
    const { projectId } = req.params;
    const UserActivity = require('../models/UserActivity');

    const latestRelease = await UserActivity.findOne({
      type: 'release_notes_sent',
      'metadata.projectId': projectId,
      status: 'success'
    }).sort({ timestamp: -1 });

    if (!latestRelease) {
      return res.json({ success: true, version: null });
    }

    const metadata = latestRelease.metadata;
    let version = null;
    let title = null;
    if (metadata) {
      if (typeof metadata.get === 'function') {
        version = metadata.get('version');
        title = metadata.get('title');
      } else {
        version = metadata.version;
        title = metadata.title;
      }
    }

    res.json({
      success: true,
      version,
      title
    });
  } catch (error) {
    console.error('Error fetching latest release version:', error);
    res.status(500).json({ error: 'Failed to fetch latest release version' });
  }
});

// Email release summary to team members
router.post('/:projectId/releases/email', protect, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { version, title, description, releaseContent } = req.body;

    if (!version || !releaseContent) {
      return res.status(400).json({ error: 'Version and releaseContent are required' });
    }

    // Find the project
    const project = await Project.findOne({ ProjectID: projectId });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Fetch team members of this project
    const projectDetails = await ProjectDetails.find({ ProjectID: projectId, IsActive: true });
    const teamIds = projectDetails.map(pd => pd.TeamID);

    const teamMembers = await TeamDetails.find({ TeamID_FK: { $in: teamIds }, IsMemberActive: true });
    const memberIds = teamMembers.map(tm => tm.MemberID);

    const users = await User.find({ _id: { $in: memberIds } });

    if (users.length === 0) {
      return res.status(400).json({ error: 'No team members found for this project to email' });
    }

    // Send emails in parallel
    const emailPromises = users.map(user => {
      if (!user.email) return Promise.resolve(false);
      return sendReleaseSummaryEmail(user.email, project.Name, version, title, description, releaseContent, project.ProjectID);
    });

    await Promise.all(emailPromises);

    // Log user activity
    await logActivity(
      req.user._id,
      'release_notes_sent',
      'success',
      `Emailed release notes for version ${version} to the project team`,
      req,
      { projectId, version, title }
    );

    res.json({
      success: true,
      message: `Release notes for version ${version} successfully emailed to ${users.length} team members.`
    });
  } catch (error) {
    console.error('Error emailing release summary:', error);
    res.status(500).json({ error: 'Failed to email release summary' });
  }
});

module.exports = router; 