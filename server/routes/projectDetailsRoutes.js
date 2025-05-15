const express = require('express');
const router = express.Router();
const ProjectDetails = require('../models/ProjectDetails');
const Project = require('../models/Project');
const Team = require('../models/Team');
const TeamDetails = require('../models/TeamDetails');
const TaskDetails = require('../models/TaskDetails');
const User = require('../models/User');

// GET /api/project-details/:projectId - Get all teams for a project
router.get('/:projectId', async (req, res) => {
  try {
    const projectId = req.params.projectId;
    // Fetch project info
    const project = await Project.findOne({ ProjectID: projectId });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    // Fetch teams assigned to project
    const projectDetails = await ProjectDetails.find({ ProjectID: projectId });
    // Fetch all teams in the same organization
    const orgTeams = await Team.find({ organizationID: project.OrganizationID });

    // Get member counts for each team
    const teamMemberCounts = await Promise.all(orgTeams.map(async (team) => {
      const count = await TeamDetails.countDocuments({ TeamID_FK: team.TeamID });
      return {
        ...team.toObject(),
        memberCount: count
      };
    }));

    const userStories = await TaskDetails.find({ ProjectID_FK: projectId, Type: "User Story" });
    const taskListss = await TaskDetails.find({ ProjectID_FK: projectId, Type: { $ne: "User Story" } });
    
    // Use Promise.all to properly wait for all user details to be fetched
    const newTaskList = await Promise.all(taskListss.map(async (task) => {
      const newTask = task.toObject();
      
      // Fetch assignee details if exists
      if (newTask.Assignee) {
        const assignee = await User.findById(task.Assignee);
        if (assignee) {
          const teamDetails = await TeamDetails.findOne({ MemberID: assignee._id });
          const team = await Team.findOne({TeamID: teamDetails.TeamID_FK}).select('TeamName');
          newTask.AssigneeDetails = {
            _id: assignee._id,
            username: assignee.username,
            fullName: assignee.firstName + " " + assignee.lastName,
            email: assignee.email,
            teamName: team.TeamName
          };
        }
      }

      // Fetch assignedTo details if exists
      if (newTask.AssignedTo) {
        const assignedTo = await User.findById(task.AssignedTo);
        if (assignedTo) {
          const teamDetails = await TeamDetails.findOne({ MemberID: assignedTo._id });
          const team = await Team.findOne({TeamID: teamDetails.TeamID_FK}).select('TeamName');
          newTask.AssignedToDetails = {
            _id: assignedTo._id,
            username: assignedTo.username,
            fullName: assignedTo.firstName + " " + assignedTo.lastName,
            email: assignedTo.email,
            teamName: team.TeamName
          };
        }
      }

      return newTask;
    }));

    res.json({
      project,
      teams: projectDetails,
      orgTeams: teamMemberCounts,
      userStories: userStories,
      taskList: newTaskList
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch project details' });
  }
});

// POST /api/project-details/:projectId/add-team - Add a team to a project
router.post('/:projectId/add-team', async (req, res) => {
  try {
    const { TeamID, ModifiedBy } = req.body;
    if (!TeamID) return res.status(400).json({ error: 'TeamID is required' });
    const projectId = req.params.projectId;
    // Prevent duplicate
    const exists = await ProjectDetails.findOne({ ProjectID: projectId, TeamID });
    if (exists) return res.status(400).json({ error: 'Team already added to project' });
    const newProjectDetail = new ProjectDetails({
      ProjectID: projectId,
      TeamID,
      IsActive: true,
      CreatedDate: new Date(),
      ModifiedBy
    });
    await newProjectDetail.save();
    res.status(201).json(newProjectDetail);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add team to project' });
  }
});

// PATCH /api/project-details/:projectId/team/:teamId/toggle - Toggle team active/inactive in project
router.patch('/:projectId/team/:teamId/toggle', async (req, res) => {
  try {
    const { ModifiedBy } = req.body;
    const projectDetail = await ProjectDetails.findOne({ ProjectID: req.params.projectId, TeamID: req.params.teamId });
    if (!projectDetail) return res.status(404).json({ error: 'Team not found in project' });
    projectDetail.IsActive = !projectDetail.IsActive;
    projectDetail.ModifiedDate = new Date();
    projectDetail.ModifiedBy = ModifiedBy;
    await projectDetail.save();
    res.json(projectDetail);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update team status in project' });
  }
});

// DELETE /api/project-details/:projectId/team/:teamId - Remove team from project
router.delete('/:projectId/team/:teamId', async (req, res) => {
  try {
    const { ModifiedBy } = req.body;
    const projectDetail = await ProjectDetails.findOne({
      ProjectID: req.params.projectId,
      TeamID: req.params.teamId
    });

    if (!projectDetail) {
      return res.status(404).json({ error: 'Team not found in project' });
    }

    await projectDetail.deleteOne();
    res.json({ message: 'Team removed from project successfully' });
  } catch (err) {
    console.error('Error removing team from project:', err);
    res.status(500).json({ error: 'Failed to remove team from project' });
  }
});

module.exports = router; 