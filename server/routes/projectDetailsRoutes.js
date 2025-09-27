const express = require('express');
const router = express.Router();
const ProjectDetails = require('../models/ProjectDetails');
const Project = require('../models/Project');
const Team = require('../models/Team');
const TeamDetails = require('../models/TeamDetails');
const TaskDetails = require('../models/TaskDetails');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Attachment = require('../models/Attachment');
const { logActivity, getProjectActivities } = require('../services/activityService');
const { protect } = require('../middleware/auth');

// GET /api/project-details/:projectId - Get all teams for a project
router.get('/:projectId', async (req, res) => {
  try {
    const projectId = req.params.projectId;
    // Fetch project info
    const project = await Project.findOne({ ProjectID: projectId });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    // Fetch teams assigned to project
    const projectDetails = await ProjectDetails.find({ ProjectID: projectId, IsActive: true });

    const projectDetailsWithMembers = await Promise.all(projectDetails.map(async detail => {
      const newDetail = detail.toObject();
      const members = await TeamDetails.find({ TeamID_FK: detail.TeamID }).select('MemberID');
      const users = await User.find({ _id: { $in: members.map(member => member.MemberID) } }).select('username firstName lastName email profileImage');
      newDetail.teamMembers = users.map(user => ({
        _id: user._id,
        profileImage: user.profileImage,
        firstName: user.firstName,
        lastName: user.lastName
      }));
      const teamDetails = await Team.findOne({ TeamID: detail.TeamID }).select('TeamName TeamColor TeamDescription');
      newDetail.TeamName = teamDetails.TeamName;
      newDetail.TeamColor = teamDetails.TeamColor;
      newDetail.TeamDescription = teamDetails.TeamDescription;
      return newDetail;
    }));

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
    const taskListss = await TaskDetails.find({ ProjectID_FK: projectId, Type: { $ne: "User Story" } }).sort({ AssignedDate: -1 });

    // Process user stories with comment and attachment counts
    const processedUserStories = await Promise.all(userStories.map(async (userStory) => {
      const newUserStory = userStory.toObject();

      // Fetch comment and attachment counts for this user story
      const [commentsCount, attachmentsCount] = await Promise.all([
        Comment.countDocuments({ TaskID: userStory.TaskID }),
        Attachment.countDocuments({ TaskID: userStory.TaskID })
      ]);

      newUserStory.commentsCount = commentsCount;
      newUserStory.attachmentsCount = attachmentsCount;

      // Fetch active subtasks for this user story
      try {
        const Subtask = require('../models/Subtask');
        const rawSubtasks = await Subtask.find({ TaskID_FK: userStory.TaskID, IsActive: true })
          .sort({ IsCompleted: -1, CreatedDate: 1 })
          .lean();

        // Optionally enrich with minimal creator/completer display data
        const populatedSubtasks = await Promise.all(rawSubtasks.map(async (s) => {
          const subtask = { ...s };
          if (s.CreatedBy) {
            const u = await User.findById(s.CreatedBy).select('firstName lastName');
            if (u) {
              subtask.CreatedByDetails = {
                _id: u._id,
                fullName: `${u.firstName} ${u.lastName}`,
              };
            }
          }
          if (s.CompletedBy) {
            const u2 = await User.findById(s.CompletedBy).select('firstName lastName');
            if (u2) {
              subtask.CompletedByDetails = {
                _id: u2._id,
                fullName: `${u2.firstName} ${u2.lastName}`,
              };
            }
          }
          return subtask;
        }));
        newUserStory.subtasks = populatedSubtasks;
      } catch (e) {
        newUserStory.subtasks = [];
      }

      return newUserStory;
    }));

    // Use Promise.all to properly wait for all user details to be fetched
    const newTaskList = await Promise.all(taskListss.map(async (task) => {
      const newTask = task.toObject();

      // Fetch assignee details if exists
      if (newTask.Assignee) {
        const assignee = await User.findById(task.Assignee);
        if (assignee) {
          const teamDetails = await TeamDetails.findOne({ MemberID: assignee._id });
          let teamName = null;
          if (teamDetails) {
            const team = await Team.findOne({ TeamID: teamDetails.TeamID_FK }).select('TeamName');
            teamName = team ? team.TeamName : null;
          }
          newTask.AssigneeDetails = {
            _id: assignee._id,
            username: assignee.username,
            fullName: assignee.firstName + " " + assignee.lastName,
            email: assignee.email,
            teamName: teamName
          };
        }
        // Fetch assignedTo details if exists
        if (newTask.AssignedTo) {
          const assignedTo = await User.findById(task.AssignedTo);
          if (assignedTo) {
            const teamDetails = await TeamDetails.findOne({ MemberID: assignedTo._id });
            let teamName = null;
            if (teamDetails) {
              const team = await Team.findOne({ TeamID: teamDetails.TeamID_FK }).select('TeamName');
              teamName = team ? team.TeamName : null;
            }
            newTask.AssignedToDetails = {
              _id: assignedTo._id,
              username: assignedTo.username,
              fullName: assignedTo.firstName + " " + assignedTo.lastName,
              email: assignedTo.email,
              teamName: teamName
            };
          }
        }
      }

      // Fetch comment and attachment counts for this task
      const [commentsCount, attachmentsCount] = await Promise.all([
        Comment.countDocuments({ TaskID: task.TaskID }),
        Attachment.countDocuments({ TaskID: task.TaskID })
      ]);

      newTask.commentsCount = commentsCount;
      newTask.attachmentsCount = attachmentsCount;

      // Fetch active subtasks for this task (sorted by CreatedDate)
      try {
        const Subtask = require('../models/Subtask');
        const rawSubtasks = await Subtask.find({ TaskID_FK: task.TaskID, IsActive: true })
          .sort({ IsCompleted: -1, CreatedDate: 1 })
          .lean();

        // Optionally enrich with minimal creator/completer display data
        const populatedSubtasks = await Promise.all(rawSubtasks.map(async (s) => {
          const subtask = { ...s };
          if (s.CreatedBy) {
            const u = await User.findById(s.CreatedBy).select('firstName lastName');
            if (u) {
              subtask.CreatedByDetails = {
                _id: u._id,
                fullName: `${u.firstName} ${u.lastName}`,
              };
            }
          }
          if (s.CompletedBy) {
            const u2 = await User.findById(s.CompletedBy).select('firstName lastName');
            if (u2) {
              subtask.CompletedByDetails = {
                _id: u2._id,
                fullName: `${u2.firstName} ${u2.lastName}`,
              };
            }
          }
          return subtask;
        }));
        newTask.subtasks = populatedSubtasks;
      } catch (e) {
        newTask.subtasks = [];
      }

      return newTask;
    }));

    // Fetch all project members (unique users who are members of any assigned team)
    const assignedTeamIds = projectDetails.map(pd => pd.TeamID);
    const allTeamDetails = await TeamDetails.find({ TeamID_FK: { $in: assignedTeamIds }, IsMemberActive: true });
    const memberIds = [...new Set(allTeamDetails.map(td => td.MemberID))];
    const projectMembers = await User.find({ _id: { $in: memberIds } }).select('_id firstName lastName email profileImage');

    // Fetch project activity
    const activity = await getProjectActivities(projectId);

    res.json({
      project,
      teams: projectDetailsWithMembers,
      orgTeams: teamMemberCounts,
      userStories: processedUserStories,
      taskList: newTaskList,
      projectMembers,
      activity
    });
  } catch (err) {
    console.error('Error fetching project details:', err);
    res.status(500).json({ error: 'Failed to fetch project details' });
  }
});

// POST /api/project-details/:projectId/team/:teamId - Add a team to a project
router.post('/:projectId/team/:teamId', protect, async (req, res) => {
  try {
    if (!req.params.teamId) return res.status(400).json({ error: 'TeamID is required' });
    const projectId = req.params.projectId;

    // Start a session for transaction
    const session = await ProjectDetails.startSession();
    session.startTransaction();

    try {
      // Check if team is already added
      const exists = await ProjectDetails.findOne({ ProjectID: projectId, TeamID: req.params.teamId });
      if (exists) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ error: 'Team already added to project' });
      }

      // Check if this is the first team being added
      const existingTeams = await ProjectDetails.countDocuments({ ProjectID: projectId }, { session });
      const project = await Project.findOne({ ProjectID: projectId });

      if (!project) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ error: 'Project not found' });
      }

      // Create new project detail
      const newProjectDetail = new ProjectDetails({
        ProjectID: projectId,
        TeamID: req.params.teamId,
        IsActive: true,
        CreatedDate: new Date(),
        ModifiedBy: req.user._id
      });
      await newProjectDetail.save({ session });

      // If this is the first team and project status is 1 (Unassigned), update to 2 (Assigned)
      if (existingTeams === 0 && project.ProjectStatusID === 1) {
        await Project.updateOne(
          { ProjectID: projectId },
          {
            $set: {
              ProjectStatusID: 2, // Set to Assigned status
              ModifiedDate: new Date(),
              ModifiedBy: req.user._id
            }
          },
          { session }
        );
      }

      // Log the activity
      await logActivity(
        req.user._id,
        'project_team_add',
        'success',
        `Added team to project "${project.Name}"${existingTeams === 0 ? ' and updated project status to Assigned' : ''}`,
        req,
        {
          projectId: project.ProjectID,
          projectName: project.Name,
          teamId: req.params.teamId,
          isFirstTeam: existingTeams === 0,
          oldStatus: project.ProjectStatusID,
          newStatus: existingTeams === 0 ? 2 : project.ProjectStatusID
        }
      );

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      const newDetail = newProjectDetail.toObject();
      const members = await TeamDetails.find({ TeamID_FK: newDetail.TeamID, IsMemberActive: true }).select('MemberID');
      const users = await User.find({ _id: { $in: members.map(member => member.MemberID) } }).select('username firstName lastName email profileImage');
      newDetail.teamMembers = users.map(user => ({
        _id: user._id,
        profileImage: user.profileImage,
        firstName: user.firstName,
        lastName: user.lastName
      }));
      const teamDetails = await Team.findOne({ TeamID: newDetail.TeamID }).select('TeamName TeamColor TeamDescription');
      newDetail.TeamName = teamDetails.TeamName;
      newDetail.TeamColor = teamDetails.TeamColor;
      newDetail.TeamDescription = teamDetails.TeamDescription;
      // Get all unique project members after adding the new team
      const allAssignedTeamIds = await ProjectDetails.find({ ProjectID: projectId }).select('TeamID');
      const allTeamDetails = await TeamDetails.find({ TeamID_FK: { $in: allAssignedTeamIds.map(t => t.TeamID) }, IsMemberActive: true });
      const allMemberIds = [...new Set(allTeamDetails.map(td => td.MemberID))];
      const allProjectMembers = await User.find({ _id: { $in: allMemberIds } }).select('_id firstName lastName email profileImage');

      res.status(201).json({
        success: true,
        message: `${teamDetails.TeamName} added to the project successfully`,
        ...newDetail,
        projectMembers: allProjectMembers,
        statusUpdated: existingTeams === 0 && project.ProjectStatusID === 1
      });
    } catch (error) {
      // If an error occurs, abort the transaction
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (err) {
    console.error('Error adding team to project:', err);
    // Log the error activity
    try {
      await logActivity(
        req.user._id,
        'project_team_add',
        'error',
        `Failed to add team to project: ${err.message}`,
        req,
        {
          projectId: req.params.projectId,
          teamId: req.params.teamId,
          error: err.message
        }
      );
    } catch (logError) {
      console.error('Failed to log error activity:', logError);
    }
    res.status(500).json({ error: 'Failed to add team to project' });
  }
});

// PATCH /api/project-details/:projectId/team/:teamId/toggle - Toggle team active/inactive in project
router.patch('/:projectId/team/:teamId/toggle', protect, async (req, res) => {
  let projectDetailz = null;
  try {
    const projectDetail = await ProjectDetails.findOne({ ProjectID: req.params.projectId, TeamID: teamId });
    if (!projectDetail) return res.status(404).json({ error: 'Team not found in project' });
    projectDetailz = projectDetail.toObject();
    projectDetail.IsActive = !projectDetail.IsActive;
    projectDetail.ModifiedDate = new Date();
    projectDetail.ModifiedBy = req.user._id;
    await projectDetail.save();

    // Get all unique project members after adding the new team
    const allAssignedTeamIds = await ProjectDetails.find({ ProjectID: req.params.projectId }).select('TeamID');
    const allTeamDetails = await TeamDetails.find({ TeamID_FK: { $in: allAssignedTeamIds.map(t => t.TeamID) }, IsMemberActive: true });
    const allMemberIds = [...new Set(allTeamDetails.map(td => td.MemberID))];
    const allProjectMembers = await User.find({ _id: { $in: allMemberIds } }).select('_id firstName lastName email profileImage');

    res.status(200).json({ success: true, message: `${projectDetail.TeamName} access updated successfully`, projectMembers: allProjectMembers });
  } catch (err) {
    await logActivity(
      ModifiedBy,
      'project_team_toggle',
      'error',
      `Failed to remove team from project: ${err.message}`,
      req,
      {
        projectId: req.params.projectId,
        teamId: req.params.teamId,
        teamName: projectDetailz.TeamName,
        projectId: req.params.projectId,
        error: err.message
      }
    );
    res.status(500).json({ error: 'Failed to update team status in project' });
  }
});

// DELETE /api/project-details/:projectId/team/:teamId - Remove team from project
router.delete('/:projectId/team/:teamId', protect, async (req, res) => {
  const teamDetails = await Team.findOne({ TeamID: req.params.teamId }).select('TeamName');
  try {

    const projectDetail = await ProjectDetails.findOne({
      ProjectID: req.params.projectId,
      TeamID: req.params.teamId
    });

    if (!projectDetail) {
      return res.status(404).json({ error: 'Team not found in project' });
    }

    // Remove the team from project
    await projectDetail.deleteOne();

    // Determine members of the removed team
    const removedTeamMemberIds = await TeamDetails.find({ TeamID_FK: req.params.teamId, IsMemberActive: true }).distinct('MemberID');

    // Remaining teams on this project (after removal)
    const remainingTeamIds = await ProjectDetails.find({ ProjectID: req.params.projectId }).distinct('TeamID');

    // Users from removed team who are still members of any remaining team for this project
    const stillAssignedMemberIds = remainingTeamIds.length > 0
      ? await TeamDetails.find({ TeamID_FK: { $in: remainingTeamIds }, IsMemberActive: true, MemberID: { $in: removedTeamMemberIds } }).distinct('MemberID')
      : [];

    // Members to unassign (part of removed team and not present in any other project team)
    const stillAssignedSet = new Set(stillAssignedMemberIds.map(id => String(id)));
    const toUnassignIds = removedTeamMemberIds.filter(id => !stillAssignedSet.has(String(id)));

    // Unassign all non-completed tasks of those members in this project
    let updatedTasks = [];
    if (toUnassignIds.length > 0) {
      // Fetch tasks we are going to modify to persist history per-task
      const tasksToUnassign = await TaskDetails.find({
        ProjectID_FK: req.params.projectId,
        AssignedTo: { $in: toUnassignIds },
        Status: { $nin: [6] }
      });

      const TaskDetailsHistory = require('../models/TaskDetailsHistory');

      // Insert history records
      if (tasksToUnassign.length > 0) {
        const histories = tasksToUnassign.map(t => ({
          TaskID: t.TaskID,
          ParentID: t.ParentID,
          Name: t.Name,
          Description: t.Description,
          OldStatus: t.Status,
          Type: t.Type,
          Priority: t.Priority,
          Old_Assignee: t.Assignee,
          Old_AssignedTo: t.AssignedTo,
          ProjectID_FK: t.ProjectID_FK,
          IsActive: t.IsActive,
          CreatedDate: t.CreatedDate,
          AssignedDate: t.AssignedDate,
          CreatedBy: t.CreatedBy,
          ModifiedDate: new Date(),
          ModifiedBy: req.user._id
        }));
        await TaskDetailsHistory.insertMany(histories);
      }

      // Now unassign in bulk
      await TaskDetails.updateMany(
        {
          ProjectID_FK: req.params.projectId,
          AssignedTo: { $in: toUnassignIds },
          Status: { $nin: [6] }
        },
        {
          $set: {
            AssignedTo: null,
            AssignedDate: null,
            Status: 1,
            ModifiedDate: new Date(),
            ModifiedBy: req.user._id
          }
        }
      );

      // Prepare updated task payload for UI
      updatedTasks = tasksToUnassign.map(t => ({
        TaskID: t.TaskID,
        ProjectID_FK: t.ProjectID_FK,
        Status: 1,
        AssignedTo: null,
        AssignedDate: null
      }));
    }

    // Recompute current project members after removal
    const allAssignedTeamIds = await ProjectDetails.find({ ProjectID: req.params.projectId }).select('TeamID');
    const allTeamDetails = await TeamDetails.find({ TeamID_FK: { $in: allAssignedTeamIds.map(t => t.TeamID) }, IsMemberActive: true });
    const allMemberIds = [...new Set(allTeamDetails.map(td => td.MemberID))];
    const allProjectMembers = await User.find({ _id: { $in: allMemberIds } }).select('_id firstName lastName email profileImage');

    await logActivity(
      req.user._id,
      'project_team_remove',
      'success',
      `Removed team from project "${teamDetails.TeamName}"`,
      req,
      {
        projectId: req.params.projectId,
        teamId: req.params.teamId,
        teamName: teamDetails.TeamName,
        projectId: req.params.projectId,
        unassignedTaskMembers: toUnassignIds.length
      }
    );
    res.status(200).json({ success: true, message: `${teamDetails.TeamName} removed from the project successfully`, projectMembers: allProjectMembers, updatedTasks });
  } catch (err) {
    console.error('Error removing team from project:', err);
    await logActivity(
      req.user._id,
      'project_team_remove',
      'error',
      `Failed to remove team from project: ${err.message}`,
      req,
      {
        projectId: req.params.projectId,
        teamId: req.params.teamId,
        teamName: teamDetails.TeamName,
        projectId: req.params.projectId,
        error: err.message
      }
    );
    res.status(500).json({ error: 'Failed to remove team from project' });
  }
});

module.exports = router; 