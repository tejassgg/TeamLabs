const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const TaskDetails = require('../models/TaskDetails');

const migrate = async () => {
  try {
    await connectDB();

    console.log('Fetching tasks that have a ParentID...');
    // Find all tasks with a ParentID and are not User Stories
    const tasks = await TaskDetails.find({
      ParentID: { $exists: true, $nin: ['', null] },
      Type: { $ne: 'User Story' }
    });

    console.log(`Found ${tasks.length} tasks to check.`);

    let updatedCount = 0;

    for (const task of tasks) {
      // Find parent User Story
      const parent = await TaskDetails.findOne({
        TaskID: task.ParentID,
        Type: 'User Story'
      });

      if (parent && parent.DueDate) {
        // Update task due date to match parent's due date
        task.DueDate = parent.DueDate;
        await task.save();
        console.log(`Updated Task #${task.TicketNumber || task.TaskID} ("${task.Name}") due date to match Parent #${parent.TaskID} (${new Date(parent.DueDate).toLocaleDateString()})`);
        updatedCount++;
      }
    }

    console.log(`Migration complete! Successfully updated due dates for ${updatedCount} tasks.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
