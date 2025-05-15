const express = require('express');
const router = express.Router();
const TaskDetails = require('../models/TaskDetails');

// POST /api/task-details - Create a new task
router.post('/', async (req, res) => {
    try {
        const taskData = req.body.taskDetail;
        const mode = req.body.mode;

        taskData.CreatedDate = new Date();
        if(mode == "fromSideBar"){
            taskData.Assignee = null;
            taskData.AssignedDate = null;
        }
        taskData.Status = 1;
        taskData.IsActive = true;

        console.log(taskData);

        const newTask = new TaskDetails(taskData);
        await newTask.save();
        res.status(201).json(newTask);
    } catch (error) {
        console.log(error);
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

module.exports = router; 