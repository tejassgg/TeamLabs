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
const { linkRepositoryToProject, unlinkRepositoryFromProject, getProjectRepository, getProjectCommits, getProjectIssues } = require('../controllers/authController');
const { emitDashboardMetrics } = require('../services/dashboardMetricsService');

// GET /api/projects/overview/:userId - fetch projects with statistics for projects page
router.get('/overview/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    let projects = [];
    // 1. Find all TeamIDs where user is a member
    const teamDetails = await TeamDetails.find({ MemberID: userId, IsMemberActive: true });
    const teamIds = teamDetails.map(td => td.TeamID_FK);
    // 2. Find all ProjectIDs from ProjectDetails where TeamID is in that list
    const projectDetails = await ProjectDetails.find({ TeamID: { $in: teamIds }, IsActive: true });
    const projectIds = projectDetails.map(pd => pd.ProjectID);
    // 3. Return only those projects
    projects = await Project.find({ ProjectID: { $in: projectIds } });

    // Enhance each project with statistics
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        try {
          // Get task count and progress for this project
          const tasks = await TaskDetails.find({
            ProjectID_FK: project.ProjectID,
            IsActive: true,
            Type: { $ne: "User Story" } // Exclude user stories from task count
          });

          const completedTasks = tasks.filter(task => task.Status === 6).length;
          const totalTasks = tasks.length;
          const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

          // Get team members count for this project
          const projectTeamDetails = await ProjectDetails.find({
            ProjectID: project.ProjectID,
            IsActive: true
          });

          const assignedTeamIds = projectTeamDetails.map(pd => pd.TeamID);
          const allTeamDetails = await TeamDetails.find({
            TeamID_FK: { $in: assignedTeamIds },
            IsMemberActive: true
          });

          // Get unique member count
          const uniqueMemberIds = [...new Set(allTeamDetails.map(td => td.MemberID))];
          const membersCount = uniqueMemberIds.length;

          // Get teams assigned to this project
          const teams = await Team.find({ TeamID: { $in: assignedTeamIds } });
          const projectTeams = teams.map(team => ({
            TeamID: team.TeamID,
            Name: team.TeamName,
            Description: team.TeamDescription,
            TeamType: team.TeamType,
            IsActive: team.IsActive,
            TeamColor: team.TeamColor
          }));

          return {
            ...project.toObject(),
            tasksCount: totalTasks,
            membersCount: membersCount,
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
        } catch (error) {
          console.error(`Error fetching stats for project ${project.ProjectID}:`, error);
          return {
            ...project.toObject(),
            tasksCount: 0,
            membersCount: 0,
            progress: 0,
            teams: [],
            tasks: []
          };
        }
      })
    );

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
    const { Name, Description, ProjectOwner, OrganizationID, FinishDate } = req.body;
    if (!Name) return res.status(400).json({ error: 'Project Name is required' });
    if (!OrganizationID) return res.status(400).json({ error: 'OrganisationID is required' });
    if (!ProjectOwner) return res.status(401).json({ error: 'Unauthorized: ProjectOwner not found' });

    const newProject = new Project({
      Name,
      Description,
      ProjectOwner,
      OrganizationID,
      FinishDate: new Date(FinishDate),
      IsActive: true,
      ProjectStatusID: 1
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
        finishDate: FinishDate
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
    const { Name, Description, FinishDate, ProjectStatusID } = req.body;

    // Try to find project by _id first, then by ProjectID
    let project = await Project.findOne({ ProjectID: req.params.projectId });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const oldValues = {
      name: project.Name,
      description: project.Description,
      finishDate: project.FinishDate,
      statusId: project.ProjectStatusID
    };

    if (Name) project.Name = Name;
    if (Description !== undefined) project.Description = Description;
    if (FinishDate !== undefined) project.FinishDate = FinishDate ? new Date(FinishDate) : null;
    if (ProjectStatusID !== undefined) project.ProjectStatusID = ProjectStatusID;
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
          finishDate: project.FinishDate,
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
router.get('/:projectId/github/issues', protect, getProjectIssues);
module.exports = router; 