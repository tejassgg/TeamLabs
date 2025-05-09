const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const TeamDetails = require('../models/TeamDetails');
const User = require('../models/User');

// Middleware to check if requester is the team owner
async function checkOwner(req, res, next) {
  const team = await Team.findOne({ TeamID: req.params.teamId });
  if (!team) return res.status(404).json({ error: 'Team not found' });
  if (req.body.OwnerID !== team.OwnerID) return res.status(403).json({ error: 'Only the team owner can perform this action' });
  req.team = team;
  next();
}

// GET /api/team-details/:teamId - Get team details with members
router.get('/:teamId', async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const team = await Team.findOne({ TeamID: teamId });
    if (!team) return res.status(404).json({ error: 'Team not found' });

    // Fetch team members with their details
    const teamDetails = await TeamDetails.find({ TeamID_FK: teamId });
    const memberIds = teamDetails.map(detail => detail.MemberID);
    const users = await User.find({ _id: { $in: memberIds } });

    // Combine team details with user information
    const members = teamDetails.map(detail => {
      const user = users.find(u => u._id.toString() === detail.MemberID);
      return {
        MemberID: detail.MemberID,
        TeamDetailsID: detail.TeamDetailsID,
        IsMemberActive: detail.IsMemberActive,
        name: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
        email: user ? user.email : '',
        CreatedDate: detail.CreatedDate,
        ModifiedDate: detail.ModifiedDate
      };
    });

    // Fetch users from the same organization as the team owner
    const owner = await User.findById(team.OwnerID);
    if (!owner) return res.status(404).json({ error: 'Team owner not found' });

    const orgUsers = await User.find({ organizationID: owner.organizationID });

    res.json({
      team,
      members,
      orgUsers
    });
  } catch (err) {
    console.error('Error fetching team details:', err);
    res.status(500).json({ error: 'Failed to fetch team details' });
  }
});

// POST /api/team-details/:teamId/add-member - Add member by UserID or email (owner only)
router.post('/:teamId/add-member', checkOwner, async (req, res) => {
  try {
    let { UserID, email, OwnerID } = req.body;
    if (!UserID && !email) return res.status(400).json({ error: 'UserID or email required' });
    if (!UserID && email) {
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ error: 'User not found' });
      UserID = user._id.toString();
    }
    // Prevent duplicate
    const exists = await TeamDetails.findOne({ TeamID_FK: req.params.teamId, MemberID: UserID });
    if (exists) return res.status(400).json({ error: 'User already a member' });
    const newMember = new TeamDetails({
      TeamID_FK: req.params.teamId,
      MemberID: UserID,
      IsMemberActive: true,
      CreatedDate: new Date(),
      ModifiedBy: req.body.OwnerID
    });
    await newMember.save();
    res.status(201).json(newMember);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// PATCH /api/team-details/:teamId/member/:memberId/toggle - Toggle member active/inactive (owner only)
router.patch('/:teamId/member/:memberId/toggle', checkOwner, async (req, res) => {
  try {
    const member = await TeamDetails.findOne({ TeamID_FK: req.params.teamId, MemberID: req.params.memberId });
    if (!member) return res.status(404).json({ error: 'Member not found' });
    member.IsMemberActive = !member.IsMemberActive;
    member.ModifiedDate = new Date();
    member.ModifiedBy = req.body.OwnerID;
    await member.save();
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update member status' });
  }
});

// PATCH /api/team-details/:teamId - Update team name
router.patch('/:teamId', checkOwner, async (req, res) => {
  try {
    const { TeamName, OwnerID } = req.body;
    if (!TeamName) return res.status(400).json({ error: 'Team name is required' });
    if (!OwnerID) return res.status(400).json({ error: 'Owner ID is required' });

    const team = await Team.findOne({ TeamID: req.params.teamId });
    if (!team) return res.status(404).json({ error: 'Team not found' });

    // Verify the requester is the owner
    if (team.OwnerID !== OwnerID) {
      return res.status(403).json({ error: 'Only the team owner can update the team name' });
    }

    team.TeamName = TeamName;
    team.ModifiedDate = new Date();
    team.ModifiedBy = OwnerID;
    await team.save();

    res.json(team);
  } catch (err) {
    console.error('Error updating team name:', err);
    res.status(500).json({ error: 'Failed to update team name' });
  }
});

module.exports = router; 