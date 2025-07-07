const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const TaskDetails = require('../models/TaskDetails');
const { logActivity } = require('../services/activityService');

// Get all comments for a task
router.get('/tasks/:taskId/comments', async (req, res) => {
  try {
    const { taskId } = req.params;
    const comments = await Comment.find({ TaskID: taskId }).sort({ CreatedAt: 1 });
    res.json(comments);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Add a new comment to a task
router.post('/tasks/:taskId/comments', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { Author, Content } = req.body;

    // Validate input
    if (!Author || !Content) {
      return res.status(400).json({ error: 'Author and Content are required' });
    }

    if (Content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content cannot be empty' });
    }

    // Check if task exists
    const task = await TaskDetails.findOne({ TaskID: taskId });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Create the comment
    const comment = new Comment({ 
      TaskID: taskId, 
      Author, 
      Content: Content.trim() 
    });
    await comment.save();

    // Log the activity
    await logActivity(
      task.CreatedBy,
      'comment_add',
      'success',
      `${Author} added a comment to task "${task.Name}"`,
      req,
      {
        taskId: taskId,
        taskName: task.Name,
        commentId: comment.CommentID,
        author: Author,
        projectId: task.ProjectID_FK
      }
    );

    res.status(201).json(comment);
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Update a comment
router.patch('/comments/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const update = req.body;

    // Validate input
    if (update.Content && update.Content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content cannot be empty' });
    }

    // Find the comment
    const comment = await Comment.findOne({ CommentID: commentId });
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Get task details for activity logging
    const task = await TaskDetails.findOne({ TaskID: comment.TaskID });
    if (!task) {
      return res.status(404).json({ error: 'Associated task not found' });
    }

    // Update the comment
    const updatedComment = await Comment.findOneAndUpdate(
      { CommentID: commentId }, 
      { ...update, Content: update.Content?.trim() }, 
      { new: true }
    );

    // Log the activity
    await logActivity(
      task.CreatedBy,
      'comment_update',
      'success',
      `${comment.Author} updated a comment on task "${task.Name}"`,
      req,
      {
        taskId: comment.TaskID,
        taskName: task.Name,
        commentId: commentId,
        author: comment.Author,
        projectId: task.ProjectID_FK
      }
    );

    res.json(updatedComment);
  } catch (err) {
    console.error('Error updating comment:', err);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// Delete a comment
router.delete('/comments/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;

    // Find the comment
    const comment = await Comment.findOne({ CommentID: commentId });
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Get task details for activity logging
    const task = await TaskDetails.findOne({ TaskID: comment.TaskID });
    if (!task) {
      return res.status(404).json({ error: 'Associated task not found' });
    }

    // Delete the comment
    const result = await Comment.findOneAndDelete({ CommentID: commentId });

    // Log the activity
    await logActivity(
      task.CreatedBy,
      'comment_delete',
      'success',
      `${comment.Author} deleted a comment from task "${task.Name}"`,
      req,
      {
        taskId: comment.TaskID,
        taskName: task.Name,
        commentId: commentId,
        author: comment.Author,
        projectId: task.ProjectID_FK
      }
    );

    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

module.exports = router; 