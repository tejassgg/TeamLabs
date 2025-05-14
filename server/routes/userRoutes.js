const express = require('express');
const router = express.Router();
const User = require('../models/User');
const TeamDetails = require('../models/TeamDetails');
const { protect } = require('../middleware/auth');

// PATCH /api/users/:userId/remove-from-org - Remove user from organization and all teams
router.patch('/:userId/remove-from-org', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const { ModifiedBy } = req.body;

    // Find the user to be removed
    const userToRemove = await User.findById(userId);
    if (!userToRemove) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get the organization ID before removing it
    const organizationId = userToRemove.organizationID;

    // Start a session for transaction
    const session = await User.startSession();
    session.startTransaction();

    try {
      // 1. Remove user from all teams in the organization
      const teamDetails = await TeamDetails.find({ 
        MemberID: userId,
        TeamID_FK: { $exists: true }
      }).session(session);

      // Get all team IDs where the user is a member
      const teamIds = teamDetails.map(detail => detail.TeamID_FK);

      // Remove user from all teams
      await TeamDetails.deleteMany({
        MemberID: userId,
        TeamID_FK: { $in: teamIds }
      }).session(session);

      // 2. Update user's organizationID to null
      userToRemove.organizationID = null;
      userToRemove.ModifiedBy = ModifiedBy;
      userToRemove.ModifiedDate = new Date();
      await userToRemove.save({ session });

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      res.json({ 
        message: 'User removed from organization and all teams successfully',
        removedFromTeams: teamIds.length
      });

    } catch (error) {
      // If an error occurs, abort the transaction
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

  } catch (err) {
    console.error('Error removing user from organization:', err);
    res.status(500).json({ error: 'Failed to remove user from organization' });
  }
});

module.exports = router; 