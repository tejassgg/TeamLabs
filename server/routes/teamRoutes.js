const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const User = require('../models/User');

// GET /api/teams - fetch all teams
router.get('/', async (req, res) => {
  try {
    const teams = await Team.find();
    res.json(teams);
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

    const newTeam = new Team({
      TeamName,
      TeamDescription,
      TeamType,
      OwnerID,
      organizationID: user.organizationID || '',
      IsActive: true,
      CreatedDate: new Date()
    });
    await newTeam.save();
    res.status(201).json(newTeam);
  } catch (err) {
    console.error('Error creating team:', err);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

module.exports = router; 