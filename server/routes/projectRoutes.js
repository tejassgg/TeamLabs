const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const User = require('../models/User');
const TeamDetails = require('../models/TeamDetails');
const ProjectDetails = require('../models/ProjectDetails');
const { logActivity } = require('../services/activityService');
const { checkProjectLimit, incrementUsage } = require('../middleware/premiumLimits');

// GET /api/projects - fetch all projects the user is allocated to
router.get('/:userId/:type', async (req, res) => {
  try {
    const userId = req.params.userId;
    const type = req.params.type;

    let projects = [];
    if (type === "Admin") {
      projects = await Project.find({ ProjectOwner: userId });
    }
    else {
      // 1. Find all TeamIDs where user is a member
      const teamDetails = await TeamDetails.find({ MemberID: userId, IsMemberActive: true });
      const teamIds = teamDetails.map(td => td.TeamID_FK);
      // 2. Find all ProjectIDs from ProjectDetails where TeamID is in that list
      const projectDetails = await ProjectDetails.find({ TeamID: { $in: teamIds }, IsActive: true });
      const projectIds = projectDetails.map(pd => pd.ProjectID);
      // 3. Return only those projects
      projects = await Project.find({ ProjectID: { $in: projectIds } });
    }

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
    await incrementUsage(req, res, () => {});

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

module.exports = router; 