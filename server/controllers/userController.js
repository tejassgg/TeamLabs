const User = require('../models/User');
const Team = require('../models/Team');
const TeamDetails = require('../models/TeamDetails');
const Project = require('../models/Project');
const TaskDetails = require('../models/TaskDetails');
const CommonType = require('../models/CommonType');

exports.updateUser = async (req, res) => {
  try {
    const { firstName, lastName, phone, phoneExtension, address, city, state, zipCode, country } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user fields
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phone = phone || user.phone;
    user.phoneExtension = phoneExtension || user.phoneExtension;
    user.address = address || user.address;
    user.city = city || user.city;
    user.state = state || user.state;
    user.zipCode = zipCode || user.zipCode;
    user.country = country || user.country;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        phoneExtension: user.phoneExtension,
        address: user.address,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        country: user.country,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user profile' });
  }
};

// New: Get all user overview data in one API
exports.getUserOverview = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean().select('-password -googleId');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Teams: user is owner or member
    const memberTeamDetails = await TeamDetails.find({ MemberID: user._id, IsMemberActive: true });
    const memberTeamIds = memberTeamDetails.map(td => td.TeamID_FK);
    const teams = await Team.find({
      $or: [
        { OwnerID: user._id },
        { TeamID: { $in: memberTeamIds } }
      ],
      IsActive: true
    }).lean();

    // Projects: user is owner or in user's org
    const projects = await Project.find({
      $or: [
        { ProjectOwner: user._id },
        { OrganizationID: user.organizationID }
      ],
      IsActive: true
    }).lean();

    // User's specific organization (from CommonType)
    const userOrganization = await CommonType.findOne({ 
      MasterType: 'Organization', 
      Code: parseInt(user.organizationID) 
    }).lean();
        
    const organization = userOrganization;
    // Tasks: assigned to user or created by user
    const tasks = await TaskDetails.find({
      $or: [
        { AssignedTo: user._id },
        { CreatedBy: user._id }
      ],
      IsActive: true
    }).lean();

    // Project Statuses (from CommonType)
    const projectStatuses = await CommonType.find({ MasterType: 'ProjectStatus' }).lean();

    res.json({
      user,
      teams,
      projects,
      organization,
      tasks,
      projectStatuses
    });
  } catch (error) {
    console.error('Error fetching user overview:', error);
    res.status(500).json({ message: 'Error fetching user overview' });
  }
}; 