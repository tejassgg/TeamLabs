const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const User = require('../models/User');
const TeamDetails = require('../models/TeamDetails');
const ProjectDetails = require('../models/ProjectDetails');

// GET /api/projects - fetch all projects the user is allocated to
router.get('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    // // 1. Find all TeamIDs where user is a member
    // const teamDetails = await TeamDetails.find({ MemberID: userId, IsMemberActive: true });
    // const teamIds = teamDetails.map(td => td.TeamID_FK);
    // // 2. Find all ProjectIDs from ProjectDetails where TeamID is in that list
    // const projectDetails = await ProjectDetails.find({ TeamID: { $in: teamIds }, IsActive: true });
    // const projectIds = projectDetails.map(pd => pd.ProjectID);
    // 3. Return only those projects
    const projects = await Project.find({ ProjectOwner: userId});
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// POST /api/projects - add a new project
router.post('/', async (req, res) => {
  try {
    const { Name, Description, ProjectOwner, OrganizationID, FinishDate } = req.body;
    console.log(req.body);
    if (!Name) return res.status(400).json({ error: 'Project Name is required' });
    if (!OrganizationID) return res.status(400).json({ error: 'OrganisationID is required' });
    if (!ProjectOwner) return res.status(401).json({ error: 'Unauthorized: ProjectOwner not found' });

    const newProject = new Project({
      Name,
      Description,
      ProjectOwner,
      OrganizationID,
      FinishDate: new Date(FinishDate),
      IsActive: true
    });
    await newProject.save();
    res.status(201).json(newProject);
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PATCH /api/projects/:projectId - update project info
router.patch('/:projectId', async (req, res) => {
  try {
    const { Name, Description, FinishDate } = req.body;
    const project = await Project.findOne({ ProjectID: req.params.projectId });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (Name) project.Name = Name;
    if (Description !== undefined) project.Description = Description;
    if (FinishDate !== undefined) project.FinishDate = FinishDate ? new Date(FinishDate) : null;
    project.ModifiedDate = new Date();
    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// PATCH /api/projects/:projectId/toggle-status - toggle IsActive
router.patch('/:projectId/toggle-status', async (req, res) => {
  try {
    const project = await Project.findOne({ ProjectID: req.params.projectId });
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