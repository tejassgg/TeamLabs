const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const User = require('../models/User');
const TeamDetails = require('../models/TeamDetails');
const { logActivity } = require('../services/activityService');

// GET /api/teams - fetch all teams
router.get('/:role/:userId', async (req, res) => {
  try {
    const role = req.params.role;
    const userId = req.params.userId;
    if (role === "Admin") {
      const teams = await Team.find();
      res.json(teams);
    }
    else {
      const teamDetails = await TeamDetails.find({
        MemberID: userId,
        IsMemberActive: true
      });
      const teamIds = teamDetails.map(td => td.TeamID_FK);
      const teams = await Team.find({
        TeamID: { $in: teamIds }
      });
      res.json(teams);
    }

  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// POST /api/teams - add a new team
router.post('/', async (req, res) => {
  try {
    const { TeamName, TeamDescription, TeamType, OwnerID } = req.body;
    if (!TeamName) return res.status(400).json({ error: 'Team Name is required' });
    if (typeof TeamType === 'undefined') return res.status(400).json({ error: 'Team Type is required' });
    if (!OwnerID) return res.status(401).json({ error: 'Unauthorized: OwnerID not found' });

    // Fetch the user to get their organizationID
    const user = await User.findById(OwnerID);
    if (!user) return res.status(401).json({ error: 'Unauthorized: User not found' });

    // Start a session for transaction
    const session = await Team.startSession();
    session.startTransaction();

    try {
      // Create the new team
      const newTeam = new Team({
        TeamName,
        TeamDescription,
        TeamType,
        OwnerID,
        organizationID: user.organizationID || '',
        IsActive: false,
        CreatedDate: new Date()
      });
      await newTeam.save({ session });

      // Add the owner as a member
      const newMember = new TeamDetails({
        TeamID_FK: newTeam.TeamID,
        MemberID: OwnerID,
        IsMemberActive: true,
        CreatedDate: new Date(),
        ModifiedBy: OwnerID
      });
      await newMember.save({ session });

      // Log the activity
      await logActivity(
        OwnerID,
        'team_create',
        'success',
        `Created new team "${TeamName}"`,
        req,
        {
          teamId: newTeam.TeamID,
          teamName: TeamName,
          teamType: TeamType
        }
      );

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      res.status(201).json({
        team: newTeam,
        message: 'Team created successfully with owner as member'
      });
    } catch (error) {
      // If an error occurs, abort the transaction
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (err) {
    console.error('Error creating team:', err);
    // Log the error activity
    try {
      await logActivity(
        req.body.OwnerID,
        'team_create',
        'error',
        `Failed to create team: ${err.message}`,
        req,
        {
          teamName: req.body.TeamName,
          error: err.message
        }
      );
    } catch (logError) {
      console.error('Failed to log error activity:', logError);
    }
    res.status(500).json({ error: 'Failed to create team' });
  }
});

module.exports = router; 