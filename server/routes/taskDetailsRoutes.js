const express = require('express');
const router = express.Router();
const TaskDetails = require('../models/TaskDetails');
const User = require('../models/User');
const TeamDetails = require('../models/TeamDetails');
const Team = require('../models/Team');
const ProjectDetails = require('../models/ProjectDetails');
const TaskDetailsHistory = require('../models/TaskDetailsHistory');
const Project = require('../models/Project');
const { logActivity } = require('../services/activityService');
const { sendTaskAssignmentEmail } = require('../services/emailService');
const Subtask = require('../models/Subtask');
const Attachment = require('../models/Attachment');
const Comment = require('../models/Comment');
const UserActivity = require('../models/UserActivity');
const { checkUserStoryLimit, checkTaskLimit, incrementUsage } = require('../middleware/premiumLimits');

// Middleware to check limits based on task type
const checkTaskTypeLimit = async (req, res, next) => {
    const taskType = req.body.taskDetail?.Type;

    if (taskType === 'User Story') {
        return checkUserStoryLimit(req, res, next);
    } else if (taskType) {
        return checkTaskLimit(req, res, next);
    }

    next();
};

// POST /api/task-details - Create a new task
router.post('/', checkTaskTypeLimit, async (req, res) => {
    try {
        const taskData = req.body.taskDetail;
        const mode = req.body.mode;

        taskData.CreatedDate = new Date();
        if (taskData.Type == "User Story") {
            taskData.Assignee = "";
            taskData.AssignedDate = "";
            taskData.Status = 2;
        }
        else { taskData.Status = 1; }
        taskData.IsActive = true;

        const newTaskDetail = new TaskDetails(taskData);
        const savedTaskDetail = await newTaskDetail.save();

        const newTask = savedTaskDetail.toObject();

        // Increment usage for non-premium users
        await incrementUsage(req, res, () => { });

        // Fetch assignee details if exists
        if (newTask.Assignee) {
            try {
                const assignee = await User.findById(newTask.Assignee);
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
            } catch (error) {
                console.error('Error fetching assignee details:', error);
            }
        }

        // Fetch assignedTo details if exists
        if (newTask.AssignedTo) {
            try {
                const assignedTo = await User.findById(newTask.AssignedTo);
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
            } catch (error) {
                console.error('Error fetching assignedTo details:', error);
            }
        }

        // Log the activity
        await logActivity(
            taskData.CreatedBy,
            taskData.Type === 'User Story' ? 'user_story_create' : 'task_create',
            'success',
            `Created new ${taskData.Type.toLowerCase()} "${taskData.Name}"`,
            req,
            {
                taskId: newTask.TaskID,
                taskName: taskData.Name,
                taskType: taskData.Type,
                projectId: taskData.ProjectID_FK,
                status: taskData.Status,
                assignee: taskData.Assignee
            }
        );

        // Send email notification if task is assigned during creation
        if (newTask.AssignedTo && newTask.AssignedToDetails) {
            try {
                const createdByUser = await User.findById(taskData.CreatedBy);
                const assignedBy = createdByUser ? `${createdByUser.firstName} ${createdByUser.lastName}` : 'Unknown User';

                const taskDetails = `
                    <strong>Task Name:</strong> ${newTask.Name}<br>
                    <strong>Description:</strong> ${newTask.Description || 'No description provided'}<br>
                    <strong>Type:</strong> ${newTask.Type}<br>
                    <strong>Priority:</strong> ${newTask.Priority || 'Not set'}<br>
                    <strong>Status:</strong> ${newTask.Status === 1 ? 'Not Assigned' : newTask.Status === 2 ? 'Assigned' : newTask.Status === 3 ? 'In Progress' : newTask.Status === 4 ? 'Completed' : 'Unknown'}<br>
                    <strong>Created Date:</strong> ${new Date(newTask.CreatedDate).toLocaleDateString()}<br>
                    <strong>Assigned Date:</strong> ${new Date(newTask.AssignedDate).toLocaleDateString()}
                `;

                await sendTaskAssignmentEmail(
                    newTask.AssignedToDetails.email,
                    newTask.Name,
                    taskDetails,
                    assignedBy,
                    newTask.Priority,
                    newTask.Status,
                    newTask.Type,
                    newTask.TaskID
                );
            } catch (emailError) {
                console.error('Error sending task assignment email:', emailError);
                // Don't fail the request if email fails
            }
        }

        res.status(201).json(newTask);
    } catch (err) {
        console.error('Error creating task:', err);
        // Log the error activity
        try {
            await logActivity(
                req.body.taskDetail?.CreatedBy,
                req.body.taskDetail?.Type === 'User Story' ? 'user_story_create' : 'task_create',
                'error',
                `Failed to create ${req.body.taskDetail?.Type?.toLowerCase() || 'task'}: ${err.message}`,
                req,
                {
                    taskName: req.body.taskDetail?.Name,
                    taskType: req.body.taskDetail?.Type,
                    error: err.message
                }
            );
        } catch (logError) {
            console.error('Failed to log error activity:', logError);
        }
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

// GET /api/task-details/:taskId - Get a single task by ID
router.get('/:taskId', async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const task = await TaskDetails.findOne({ TaskID: taskId, IsActive: true });

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

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

        res.json(newTask);
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ error: 'Failed to fetch task details' });
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
        const { Status, modifiedBy } = req.body;

        const task = await TaskDetails.findOne({ TaskID: taskId });
        if (!task) return res.status(404).json({ error: 'Task not found' });

        const oldStatus = task.Status;

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
            ModifiedDate: task.ModifiedDate,
            ModifiedBy: task.ModifiedBy,
            HistoryDate: new Date()
        });

        await taskHistory.save();

        // Update status
        task.Status = Status;
        task.ModifiedDate = new Date();
        task.ModifiedBy = modifiedBy;
        await task.save();

        // Log the activity
        await logActivity(
            task.CreatedBy,
            task.Type == 'User Story' ? 'user_story_update' : 'task_update',
            'success',
            `Updated ${task.Type.toLowerCase()} "${task.Name}" status from ${oldStatus} to ${Status}`,
            req,
            {
                taskId: task.TaskID,
                taskName: task.Name,
                taskType: task.Type,
                oldStatus,
                newStatus: Status,
                projectId: task.ProjectID_FK
            }
        );

        res.json(task);
    } catch (error) {
        console.error('Error updating task status:', error);
        // Log the error activity
        try {
            const task = await TaskDetails.findOne({ TaskID: req.params.taskId });
            await logActivity(
                task?.CreatedBy,
                task.Type == 'User Story' ? 'user_story_update' : 'task_update',
                'error',
                `Failed to update task status: ${error.message}`,
                req,
                {
                    taskId: req.params.taskId,
                    error: error.message
                }
            );
        } catch (logError) {
            console.error('Failed to log error activity:', logError);
        }
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
        const oldStatus = task.Status;

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

        // Log the activity
        await logActivity(
            task.CreatedBy,
            task.Type == 'User Story' ? 'user_story_update' : 'task_update',
            'success',
            `Updated ${task.Type.toLowerCase()} "${task.Name}" status from ${oldStatus}.`,
        );

        // Log assignment activity and send email notification
        if (AssignedTo) {
            const assignedUser = await User.findById(AssignedTo);
            if (assignedUser) {
                // Get the user who is making the assignment (from request body)
                const assignedByUser = await User.findById(req.body.assignedBy);
                const assignedBy = assignedByUser ? `${assignedByUser.firstName} ${assignedByUser.lastName}` : 'Unknown User';

                await logActivity(
                    task.CreatedBy,
                    'task_assign',
                    'success',
                    `${assignedBy} assigned task "${task.Name}" to ${assignedUser.firstName} ${assignedUser.lastName}`,
                    req,
                    {
                        taskId: task.TaskID,
                        taskName: task.Name,
                        assignedTo: assignedUser._id,
                        assignedToName: `${assignedUser.firstName} ${assignedUser.lastName}`,
                        assignedBy: req.body.assignedBy,
                        assignedByName: assignedBy,
                        projectId: task.ProjectID_FK
                    }
                );

                // Send email notification to the assigned user
                try {
                    // Fetch project info
                    const project = await Project.findOne({ ProjectID: task.ProjectID_FK });
                    // Fetch last 5 history items
                    const historyItems = await TaskDetailsHistory.find({ TaskID: task.TaskID }).sort({ HistoryDate: -1 }).limit(3);
                    // Fetch up to 3 attachments
                    const attachments = await Attachment.find({ TaskID: task.TaskID }).sort({ UploadedAt: -1 }).limit(3);
                    // Fetch up to 3 comments
                    const comments = await Comment.find({ TaskID: task.TaskID }).sort({ CreatedAt: -1 }).limit(3);

                    const taskDetails = `
                        <strong>Task Name:</strong> ${task.Name}<br>
                        <strong>Description:</strong> ${task.Description || 'No description provided'}<br>
                        <strong>Type:</strong> ${task.Type}<br>
                        <strong>Priority:</strong> ${task.Priority || 'Not set'}<br>
                        <strong>Status:</strong> ${task.Status === 1 ? 'Not Assigned' : task.Status === 2 ? 'Assigned' : task.Status === 3 ? 'In Progress' : task.Status === 4 ? 'Completed' : 'Unknown'}<br>
                        <strong>Assigned Date:</strong> ${task.AssignedDate ? new Date(task.AssignedDate).toISOString() : ''}
                    `;

                    await sendTaskAssignmentEmail(
                        assignedUser.email,
                        task.Name,
                        taskDetails,
                        assignedBy,
                        task.Priority,
                        task.Status,
                        task.Type,
                        task.TaskID,
                        project,
                        historyItems,
                        attachments.length > 0 ? attachments : null,
                        comments.length > 0 ? comments : null
                    );
                } catch (emailError) {
                    console.error('Error sending task assignment email:', emailError);
                    // Don't fail the request if email fails
                }
            }
        }

        // Fetch updated task activity after assignment
        const taskActivity = await UserActivity.find({
            'metadata.taskId': task.TaskID
        }).sort({ timestamp: -1 }).limit(10);

        res.json({
            ...taskWithDetails,
            taskActivity
        });
    } catch (error) {
        console.error('Error assigning task:', error);
        // Log the error activity
        try {
            const task = await TaskDetails.findOne({ TaskID: req.params.taskId });
            await logActivity(
                task?.CreatedBy,
                task.Type == 'User Story' ? 'user_story_update' : 'task_update',
                'error',
                `Failed to assign task: ${error.message}`,
                req,
                {
                    taskId: req.params.taskId,
                    error: error.message
                }
            );
        } catch (logError) {
            console.error('Failed to log error activity:', logError);
        }
        res.status(500).json({ error: 'Failed to assign task' });
    }
});

// GET /api/task-details/:taskId/activity - Get task activity with pagination
router.get('/:taskId/activity', async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const [activity, total] = await Promise.all([
            UserActivity.find({ 'metadata.taskId': taskId })
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            UserActivity.countDocuments({ 'metadata.taskId': taskId })
        ]);

        res.json({
            activity,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error fetching task activity:', error);
        res.status(500).json({ error: 'Failed to fetch task activity' });
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

        // Log the activity before deleting
        await logActivity(
            task.CreatedBy,
            task.Type == 'User Story' ? 'user_story_delete' : 'task_delete',
            'success',
            `Deleted ${task.Type.toLowerCase()} "${task.Name}"`,
            req,
            {
                taskId: task.TaskID,
                taskName: task.Name,
                taskType: task.Type,
                projectId: task.ProjectID_FK,
                status: task.Status
            }
        );

        // Hard delete the task
        await task.deleteOne();

        res.json({ success: true, message: 'Task Deleted Successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        // Log the error activity
        try {
            const task = await TaskDetails.findOne({ TaskID: req.params.taskId });
            await logActivity(
                task?.CreatedBy,
                task.Type == 'User Story' ? 'user_story_delete' : 'task_delete',
                'error',
                `Failed to delete task: ${error.message}`,
                req,
                {
                    taskId: req.params.taskId,
                    error: error.message
                }
            );
        } catch (logError) {
            console.error('Failed to log error activity:', logError);
        }
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

// PATCH /api/task-details/:taskId - Update task details
router.patch('/:taskId', async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const updateData = req.body;

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
            Priority: task.Priority,
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

        // Update task fields
        if (updateData.Name !== undefined) task.Name = updateData.Name;
        if (updateData.Description !== undefined) task.Description = updateData.Description;
        if (updateData.Type !== undefined) task.Type = updateData.Type;
        if (updateData.Priority !== undefined) task.Priority = updateData.Priority;
        if (updateData.ParentID !== undefined) task.ParentID = updateData.ParentID;
        if (updateData.IsActive !== undefined) task.IsActive = updateData.IsActive;

        await task.save();

        const updatedTask = task.toObject();

        // Fetch assignee details if exists
        if (updatedTask.Assignee) {
            const assignee = await User.findById(updatedTask.Assignee);
            if (assignee) {
                const teamDetails = await TeamDetails.findOne({ MemberID: assignee._id });
                const team = await Team.findOne({ TeamID: teamDetails.TeamID_FK }).select('TeamName');
                updatedTask.AssigneeDetails = {
                    _id: assignee._id,
                    username: assignee.username,
                    fullName: assignee.firstName + " " + assignee.lastName,
                    email: assignee.email,
                    teamName: team.TeamName
                };
            }
        }

        // Fetch assignedTo details if exists
        if (updatedTask.AssignedTo) {
            const assignedTo = await User.findById(updatedTask.AssignedTo);
            if (assignedTo) {
                const teamDetails = await TeamDetails.findOne({ MemberID: assignedTo._id });
                const team = await Team.findOne({ TeamID: teamDetails.TeamID_FK }).select('TeamName');
                updatedTask.AssignedToDetails = {
                    _id: assignedTo._id,
                    username: assignedTo.username,
                    fullName: assignedTo.firstName + " " + assignedTo.lastName,
                    email: assignedTo.email,
                    teamName: team.TeamName
                };
            }
        }

        // Log the activity
        await logActivity(
            task.CreatedBy,
            task.Type === 'User Story' ? 'user_story_update' : 'task_update',
            'success',
            `Updated ${task.Type.toLowerCase()} "${task.Name}"`,
            req,
            {
                taskId: task.TaskID,
                taskName: task.Name,
                taskType: task.Type,
                projectId: task.ProjectID_FK,
                status: task.Status
            }
        );

        res.json(updatedTask);
    } catch (error) {
        console.error('Error updating task:', error);
        // Log the error activity
        try {
            const task = await TaskDetails.findOne({ TaskID: req.params.taskId });
            await logActivity(
                task?.CreatedBy,
                task.Type === 'User Story' ? 'user_story_update' : 'task_update',
                'error',
                `Failed to update task: ${error.message}`,
                req,
                {
                    taskId: req.params.taskId,
                    error: error.message
                }
            );
        } catch (logError) {
            console.error('Failed to log error activity:', logError);
        }
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// DELETE /api/task-details/bulk-delete - Delete multiple tasks
router.delete('/bulk-delete', async (req, res) => {
    try {
        const { taskIds } = req.body;
        if (!Array.isArray(taskIds) || taskIds.length === 0) {
            return res.status(400).json({ error: 'Task IDs array is required' });
        }

        // Find all tasks to be deleted
        const tasksToDelete = await TaskDetails.find({ TaskID: { $in: taskIds } });
        if (tasksToDelete.length === 0) {
            return res.status(404).json({ error: 'No tasks found to delete' });
        }

        // Save task history for all tasks before deleting
        const taskHistories = tasksToDelete.map(task => new TaskDetailsHistory({
            TaskID: task.TaskID,
            ParentID: task.ParentID,
            Name: task.Name,
            Description: task.Description,
            OldStatus: task.Status,
            Type: task.Type,
            Priority: task.Priority,
            Old_Assignee: task.Assignee,
            Old_AssignedTo: task.AssignedTo,
            ProjectID_FK: task.ProjectID_FK,
            IsActive: task.IsActive,
            CreatedDate: task.CreatedDate,
            AssignedDate: task.AssignedDate,
            CreatedBy: task.CreatedBy,
            HistoryDate: new Date()
        }));

        await TaskDetailsHistory.insertMany(taskHistories);

        // Log activities for each task
        for (const task of tasksToDelete) {
            await logActivity(
                task.CreatedBy,
                task.Type === 'User Story' ? 'user_story_delete' : 'task_delete',
                'success',
                `Deleted ${task.Type.toLowerCase()} "${task.Name}"`,
                req,
                {
                    taskId: task.TaskID,
                    taskName: task.Name,
                    taskType: task.Type,
                    projectId: task.ProjectID_FK,
                    status: task.Status
                }
            );
        }

        // Delete all tasks
        const result = await TaskDetails.deleteMany({ TaskID: { $in: taskIds } });

        res.json({
            success: true,
            message: `Successfully deleted ${result.deletedCount} tasks`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Error deleting tasks:', error);
        // Log the error activity
        try {
            await logActivity(
                req.body.CreatedBy || 'unknown',
                'task_bulk_delete',
                'error',
                `Failed to delete tasks: ${error.message}`,
                req,
                {
                    taskIds: req.body.taskIds,
                    error: error.message
                }
            );
        } catch (logError) {
            console.error('Failed to log error activity:', logError);
        }
        res.status(500).json({ error: 'Failed to delete tasks' });
    }
});

// GET /api/task-details/:taskId/full - Get task with subtasks, attachments, comments
router.get('/:taskId/full', async (req, res) => {
    try {
        const { taskId } = req.params;

        const task = await TaskDetails.findOne({ TaskID: taskId, IsActive: true });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const newTask = task.toObject();

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

        // Fetch project details if task has a ProjectID_FK
        let project = null;
        let projectMembers = [];
        if (newTask.ProjectID_FK) {
            try {
                project = await Project.findOne({ ProjectID: newTask.ProjectID_FK });

                // Fetch project members
                if (project) {
                    // Get teams assigned to this project through ProjectDetails
                    const projectDetails = await ProjectDetails.find({ ProjectID: project.ProjectID, IsActive: true });

                    if (projectDetails.length > 0) {
                        const teamIds = projectDetails.map(pd => pd.TeamID);

                        // Get team members for these teams
                        const teamMembers = await TeamDetails.find({ TeamID_FK: { $in: teamIds }, IsMemberActive: true });

                        if (teamMembers.length > 0) {
                            const memberIds = teamMembers.map(tm => tm.MemberID);
                            const members = await User.find({ _id: { $in: memberIds } });
                            projectMembers = members.map(member => ({
                                _id: member._id,
                                username: member.username,
                                fullName: member.firstName + " " + member.lastName,
                                email: member.email
                            }));
                        }
                    }
                }
            } catch (projectError) {
                console.error('Error fetching project details:', projectError);
            }
        }

        const subtasks = await Subtask.find({ TaskID: taskId }).sort({ Order: 1, CreatedDate: 1 });
        const attachments = await Attachment.find({ TaskID: taskId }).sort({ UploadedAt: -1 });
        const comments = await Comment.find({ TaskID: taskId }).sort({ CreatedAt: 1 });

        // Fetch task activity
        const taskActivity = await UserActivity.find({
            'metadata.taskId': taskId
        }).sort({ timestamp: -1 }).limit(10);

        let userStoryTasks = [];
        if (newTask.Type === 'User Story') {
            userStoryTasks = await TaskDetails.find({ ParentID: newTask.TaskID, IsActive: true });
        }

        res.json({
            task: newTask,
            project,
            projectMembers,
            subtasks,
            attachments,
            comments,
            taskActivity,
            userStoryTasks
        });
    } catch (err) {
        console.error('Error fetching full task details:', err);
        res.status(500).json({ error: 'Failed to fetch full task details' });
    }
});

module.exports = router; 