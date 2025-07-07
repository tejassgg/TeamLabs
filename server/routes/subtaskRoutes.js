const express = require('express');
const router = express.Router();
const Subtask = require('../models/Subtask');

// Get all subtasks for a task
router.get('/tasks/:taskId/subtasks', async (req, res) => {
  try {
    const { taskId } = req.params;
    const subtasks = await Subtask.find({ TaskID: taskId }).sort({ Order: 1, CreatedDate: 1 });
    res.json(subtasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subtasks' });
  }
});

// Create a new subtask for a task
router.post('/tasks/:taskId/subtasks', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { Title, Order } = req.body;
    const subtask = new Subtask({ TaskID: taskId, Title, Order });
    await subtask.save();
    res.status(201).json(subtask);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create subtask' });
  }
});

// Update a subtask
router.patch('/subtasks/:subtaskId', async (req, res) => {
  try {
    const { subtaskId } = req.params;
    const update = req.body;
    const subtask = await Subtask.findOneAndUpdate({ SubtaskID: subtaskId }, update, { new: true });
    if (!subtask) return res.status(404).json({ error: 'Subtask not found' });
    res.json(subtask);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update subtask' });
  }
});

// Delete a subtask
router.delete('/subtasks/:subtaskId', async (req, res) => {
  try {
    const { subtaskId } = req.params;
    const result = await Subtask.findOneAndDelete({ SubtaskID: subtaskId });
    if (!result) return res.status(404).json({ error: 'Subtask not found' });
    res.json({ message: 'Subtask deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete subtask' });
  }
});

module.exports = router; 