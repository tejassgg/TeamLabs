const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const ContactSupport = require('../models/ContactSupport');

const run = async () => {
  try {
    await connectDB();

    const args = process.argv.slice(2);

    if (args.length >= 2) {
      // Manual ticket update mode: node updateTicketPriority.js <ticketNumber> <priority>
      const ticketNumber = args[0].trim();
      const priority = args[1].trim();

      const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
      if (!validPriorities.includes(priority)) {
        console.error(`Error: Invalid priority "${priority}". Allowed values: ${validPriorities.join(', ')}`);
        process.exit(1);
      }

      console.log(`Searching for support ticket: ${ticketNumber}...`);
      const ticket = await ContactSupport.findOne({ ticketNumber });

      if (!ticket) {
        console.error(`Error: Support ticket with number "${ticketNumber}" not found.`);
        process.exit(1);
      }

      const oldPriority = ticket.priority || 'not set';
      ticket.priority = priority;
      await ticket.save();

      console.log(`Successfully updated ticket #${ticketNumber} priority: "${oldPriority}" -> "${priority}"`);
      process.exit(0);
    } else {
      // Bulk migration mode
      console.log('Running bulk migration to set default priority on existing tickets...');
      
      const tickets = await ContactSupport.find({
        $or: [
          { priority: { $exists: false } },
          { priority: { $nin: ['Low', 'Medium', 'High', 'Critical'] } }
        ]
      });

      console.log(`Found ${tickets.length} tickets needing a priority default.`);

      let updatedCount = 0;
      for (const ticket of tickets) {
        ticket.priority = 'Medium';
        await ticket.save();
        updatedCount++;
      }

      console.log(`Migration complete! Successfully initialized default priority to "Medium" for ${updatedCount} support tickets.`);
      process.exit(0);
    }
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
};

run();
