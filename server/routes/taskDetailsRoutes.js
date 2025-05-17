const express = require('express');
const router = express.Router();
const TaskDetails = require('../models/TaskDetails');
const User = require('../models/User');
const TeamDetails = require('../models/TeamDetails');
const Team = require('../models/Team');
const ProjectDetails = require('../models/ProjectDetails');
const TaskDetailsHistory = require('../models/TaskDetailsHistory');


// POST /api/task-details - Create a new task
router.post('/', async (req, res) => {
    try {
        const taskData = req.body.taskDetail;
        const mode = req.body.mode;

        taskData.CreatedDate = new Date();
        if (mode == "fromSideBar") {
            taskData.Assignee = "";
            taskData.AssignedDate = "";
            taskData.Status = 2;
        }
        else { taskData.Status = 1; }
        taskData.IsActive = true;

        const newTaskDetail = new TaskDetails(taskData);
        const savedTaskDetail = await newTaskDetail.save();

        const newTask = savedTaskDetail.toObject();

        // Fetch assignee details if exists
        if (newTask.Assignee) {
            const assignee = await User.findById(newTask.Assignee);
            if (assignee) {
                const teamDetails = await TeamDetails.findOne({ MemberID: assignee._id });
                const team = await Team.findOne({ TeamID: teamDetails.TeamID_FK }).select('TeamName');
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
            const assignedTo = await User.findById(newTask.AssignedTo);
            if (assignedTo) {
                const teamDetails = await TeamDetails.findOne({ MemberID: assignedTo._id });
                const team = await Team.findOne({ TeamID: teamDetails.TeamID_FK }).select('TeamName');
                newTask.AssignedToDetails = {
                    _id: assignedTo._id,
                    username: assignedTo.username,
                    fullName: assignedTo.firstName + " " + assignedTo.lastName,
                    email: assignedTo.email,
                    teamName: team.TeamName
                };
            }
        }

        res.status(201).json(newTask);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// GET /api/task-details - Get all tasks
router.get('/', async (req, res) => {
    try {
        const tasks = await TaskDetails.find().sort({ CreatedDate: 1 });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// GET /api/task-details/project/:projectId - Get all tasks for a specific project
router.get('/project/:projectId', async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const tasks = await TaskDetails.find({ ProjectID_FK: projectId, IsActive: true, Type: { $ne: "User Story" } }).sort({ CreatedDate: 1 });

        // Use Promise.all to properly wait for all user details to be fetched
        const newTaskList = await Promise.all(tasks.map(async (task) => {
            const newTask = task.toObject();

            // Fetch assignee details if exists
            if (newTask.Assignee) {
                const assignee = await User.findById(task.Assignee);
                if (assignee) {
                    const teamDetails = await TeamDetails.findOne({ MemberID: assignee._id });
                    const team = await Team.findOne({ TeamID: teamDetails.TeamID_FK }).select('TeamName');
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
                    const team = await Team.findOne({ TeamID: teamDetails.TeamID_FK }).select('TeamName');
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

        res.json(newTaskList);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to fetch project tasks' });
    }
});

// GET /api/task-details/project/:projectId/team-members - Get all team members for a project
router.get('/project/:projectId/team-members', async (req, res) => {
    try {
        const projectId = req.params.projectId;

        // Find teams assigned to this project
        const projectDetails = await ProjectDetails.find({ ProjectID: projectId, IsActive: true });
        const teamIds = projectDetails.map(pd => pd.TeamID);

        // Find team members for these teams
        const teamMembers = await TeamDetails.find({ TeamID_FK: { $in: teamIds }, IsMemberActive: true });
        const memberIds = teamMembers.map(tm => tm.MemberID);

        // Fetch user details
        const users = await User.find({ _id: { $in: memberIds } });

        // Map users with their team info
        const membersWithTeamInfo = await Promise.all(users.map(async (user) => {
            const teamDetail = teamMembers.find(tm => tm.MemberID === user._id.toString());
            let teamInfo = null;

            if (teamDetail) {
                const team = await Team.findOne({ TeamID: teamDetail.TeamID_FK }).select('TeamName');
                teamInfo = team ? { teamId: team.TeamID, teamName: team.TeamName } : null;
            }

            return {
                _id: user._id,
                fullName: `${user.firstName} ${user.lastName}`,
                email: user.email,
                team: teamInfo
            };
        }));

        res.json(membersWithTeamInfo);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to fetch team members' });
    }
});

// PATCH /api/task-details/:taskId/status - Update task status
router.patch('/:taskId/status', async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const { Status } = req.body;

        const task = await TaskDetails.findOne({ TaskID: taskId });
        if (!task) return res.status(404).json({ error: 'Task not found' });

        // Save task history before updating
        const taskHistory = new TaskDetailsHistory({
            TaskID: task.TaskID,
            ParentID: task.ParentID,
            Name: task.Name,
            Description: task.Description,
            OldStatus: task.Status,
            Type: task.Type,
            Old_Assignee: task.Assignee,
            Old_AssignedTo: task.AssignedTo,
            ProjectID_FK: task.ProjectID_FK,
            IsActive: task.IsActive,
            CreatedDate: task.CreatedDate,
            AssignedDate: task.AssignedDate,
            CreatedBy: task.CreatedBy,
            HistoryDate: new Date()
        });

        await taskHistory.save();

        // Update status
        task.Status = Status;
        await task.save();

        res.json(task);
    } catch (error) {
        console.error('Error updating task status:', error);
        res.status(500).json({ error: 'Failed to update task status' });
    }
});

// PATCH /api/task-details/:taskId/assign - Assign a task to a user
router.patch('/:taskId/assign', async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const { AssignedTo, AssignedDate } = req.body;

        const task = await TaskDetails.findOne({ TaskID: taskId });
        if (!task) return res.status(404).json({ error: 'Task not found' });

        // Save task history before updating
        const taskHistory = new TaskDetailsHistory({
            TaskID: task.TaskID,
            ParentID: task.ParentID,
            Name: task.Name,
            Description: task.Description,
            OldStatus: task.Status,
            Type: task.Type,
            Old_Assignee: task.Assignee,
            Old_AssignedTo: task.AssignedTo,
            ProjectID_FK: task.ProjectID_FK,
            IsActive: task.IsActive,
            CreatedDate: task.CreatedDate,
            AssignedDate: task.AssignedDate,
            CreatedBy: task.CreatedBy,
            HistoryDate: new Date()
        });

        await taskHistory.save();

        // Update assignment
        task.AssignedTo = AssignedTo;
        task.AssignedDate = AssignedDate || new Date();

        // If the task is being assigned and was in Not Assigned status, change to Assigned status
        if (AssignedTo && task.Status === 1) {
            task.Status = 2; // Assigned status
        }

        await task.save();

        // Get assignee details to return with response
        let assignedToDetails = null;
        if (task.AssignedTo) {
            const assignedTo = await User.findById(task.AssignedTo);
            if (assignedTo) {
                const teamDetails = await TeamDetails.findOne({ MemberID: assignedTo._id });
                const team = await Team.findOne({ TeamID: teamDetails.TeamID_FK }).select('TeamName');
                assignedToDetails = {
                    _id: assignedTo._id,
                    username: assignedTo.username,
                    fullName: assignedTo.firstName + " " + assignedTo.lastName,
                    email: assignedTo.email,
                    teamName: team.TeamName
                };
            }
        }

        const taskWithDetails = task.toObject();
        taskWithDetails.AssignedToDetails = assignedToDetails;

        res.json(taskWithDetails);
    } catch (error) {
        console.error('Error assigning task:', error);
        res.status(500).json({ error: 'Failed to assign task' });
    }
});

// DELETE /api/task-details/:taskId/delete - Delete a task
router.delete('/:taskId/delete', async (req, res) => {
    try {
        const taskId = req.params.taskId;
        
        const task = await TaskDetails.findOne({ TaskID: taskId });
        if (!task) return res.status(404).json({ error: 'Task not found' });

        // Save task history before deleting
        const taskHistory = new TaskDetailsHistory({
            TaskID: task.TaskID,
            ParentID: task.ParentID,
            Name: task.Name,
            Description: task.Description,
            OldStatus: task.Status,
            Type: task.Type,
            Old_Assignee: task.Assignee,
            Old_AssignedTo: task.AssignedTo,
            ProjectID_FK: task.ProjectID_FK,
            IsActive: task.IsActive,
            CreatedDate: task.CreatedDate,
            AssignedDate: task.AssignedDate,
            CreatedBy: task.CreatedBy,
            HistoryDate: new Date()
        });
        
        await taskHistory.save();

        // Hard delete the task
        await task.deleteOne();

        res.json({ success: true, message: 'Task Deleted Successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

module.exports = router; 