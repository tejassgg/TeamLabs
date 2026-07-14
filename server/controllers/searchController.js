const User = require('../models/User');
const Project = require('../models/Project');
const Team = require('../models/Team');
const TaskDetails = require('../models/TaskDetails');
const Attachment = require('../models/Attachment');
const Comment = require('../models/Comment');
const Meeting = require('../models/Meeting');
const Subtask = require('../models/Subtask');

const getLiveSearchData = async (req, res) => {
  try {
    const orgId = req.user.organizationID;
    const query = req.query.q;
    if (!orgId || !query) {
      return res.status(200).json({
        projects: [],
        teams: [],
        users: [],
        tasks: [],
        attachments: [],
        comments: [],
        meetings: [],
        subtasks: []
      });
    }

    const regex = new RegExp(escapeRegExpForDb(query), 'i');

    // 1. Fetch organization scope IDs
    const orgProjects = await Project.find({ OrganizationID: orgId, IsActive: true }).select('ProjectID');
    const projectIds = orgProjects.map(p => p.ProjectID);

    const orgTeams = await Team.find({ organizationID: orgId, IsActive: true }).select('TeamID');
    const teamIds = orgTeams.map(t => t.TeamID);

    const orgTasks = await TaskDetails.find({ ProjectID_FK: { $in: projectIds }, IsActive: true }).select('TaskID');
    const allTaskIds = orgTasks.map(t => t.TaskID);

    // 2. Perform matches on each model restricted to org boundaries
    const projects = await Project.find({
      OrganizationID: orgId,
      IsActive: true,
      $or: [
        { Name: regex },
        { Description: regex }
      ]
    });

    const teams = await Team.find({
      organizationID: orgId,
      IsActive: true,
      $or: [
        { TeamName: regex },
        { TeamDescription: regex }
      ]
    });

    const users = await User.find({
      organizationID: orgId,
      isActive: true,
      $or: [
        { username: regex },
        { email: regex },
        { firstName: regex },
        { lastName: regex }
      ]
    }).select('firstName lastName username email profileImage role createdDate status');

    const tasks = await TaskDetails.find({
      ProjectID_FK: { $in: projectIds },
      IsActive: true,
      $or: [
        { Name: regex },
        { Description: regex },
        { TicketNumber: regex }
      ]
    });

    const attachments = await Attachment.find({
      Filename: regex,
      $or: [
        { ProjectID: { $in: projectIds } },
        { TaskID: { $in: allTaskIds } }
      ]
    });

    const comments = await Comment.find({
      TaskID: { $in: allTaskIds },
      $or: [
        { Content: regex },
        { Author: regex }
      ]
    }).sort({ CreatedAt: -1 });

    const meetings = await Meeting.find({
      TeamID_FK: { $in: teamIds },
      IsActive: true,
      $or: [
        { Title: regex },
        { Description: regex }
      ]
    });

    const subtasks = await Subtask.find({
      TaskID_FK: { $in: allTaskIds },
      IsActive: true,
      Name: regex
    });

    return res.status(200).json({
      projects,
      teams,
      users,
      tasks,
      attachments,
      comments,
      meetings,
      subtasks,
      recentUpdates: [] // Activities are usually not searched by text query, keep empty or skip
    });
  } catch (error) {
    console.error('Error in live search:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Helper function to escape special characters for mongodb regex
function escapeRegExpForDb(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  getLiveSearchData
};
