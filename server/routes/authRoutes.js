const express = require('express');
const router = express.Router();
const {
  registerUser, loginUser, googleLogin, getUserProfile, completeUserProfile, getUserActivities, logoutUser,
  getUserOrganizations, generate2FA, verify2FA, disable2FA, verifyLogin2FA, getSecuritySettings, updateOnboardingStatus,
  updateSecuritySettings, updateUserSettings, updateUserStatus, forgotPassword, resetPassword, verifyResetPassword
} = require('../controllers/authController');
const { initiateGitHubAuth, handleGitHubCallback, disconnectGitHub, getGitHubStatus, getIntegrationsStatus, getUserRepositories} = require('../controllers/integrationController');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Project = require('../models/Project');
const TaskDetails = require('../models/TaskDetails');
const Team = require('../models/Team');
const TeamDetails = require('../models/TeamDetails');
const ProjectDetails = require('../models/ProjectDetails');
const CommonType = require('../models/CommonType');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               middleName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Email or Username or phone number already exists
 */
router.post('/register', registerUser);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', loginUser);

/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Login with Google
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - credential
 *             properties:
 *               credential:
 *                 type: string
 *     responses:
 *       200:
 *         description: Google login successful
 *       400:
 *         description: Email not verified by Google
 */
router.post('/google', googleLogin);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Not authorized
 *       404:
 *         description: User not found
 */
router.get('/profile', protect, getUserProfile);

/**
 * @swagger
 * /auth/complete-profile:
 *   put:
 *     summary: Complete user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *               middleName:
 *                 type: string
 *               address:
 *                 type: string
 *               aptNumber:
 *                 type: string
 *               zipCode:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               country:
 *                 type: string
 *               organizationID:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Not authorized
 *       404:
 *         description: User not found
 */
router.put('/complete-profile', protect, completeUserProfile);

/**
 * @swagger
 * /auth/my-tasks-data:
 *   get:
 *     summary: Get all user's tasks, projects, and teams data
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's complete task data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     tasks:
 *                       type: array
 *                       items:
 *                         type: object
 *                     projects:
 *                       type: array
 *                       items:
 *                         type: object
 *                     teams:
 *                       type: array
 *                       items:
 *                         type: object
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalTasks:
 *                           type: number
 *                         completedTasks:
 *                           type: number
 *                         overdueTasks:
 *                           type: number
 *                         dueTodayTasks:
 *                           type: number
 *                         highPriorityTasks:
 *                           type: number
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.get('/my-tasks-data', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    // 1. Get user's teams
    const teamDetails = await TeamDetails.find({ MemberID: userId, IsMemberActive: true });
    const teamIds = teamDetails.map(td => td.TeamID_FK);
    const teams = await Team.find({ TeamID: { $in: teamIds }, organizationID: req.user.organizationID });

    // 2. Get user's projects (through teams)
    const projectDetails = await ProjectDetails.find({ TeamID: { $in: teamIds }, IsActive: true });
    const projectIds = projectDetails.map(pd => pd.ProjectID);
    const projects = await Project.find({ ProjectID: { $in: projectIds } }).select('ProjectID Name');

    // 3. Get all tasks from user's projects
    const allTasks = await TaskDetails.find({
      ProjectID_FK: { $in: projectIds },
      IsActive: true,
      Type: { $ne: "User Story" }
    });

    // 4. Filter tasks assigned to current user or created by current user
    const userTasks = allTasks.filter(task => 
      task.Assignee == userId || 
      task.AssignedTo == userId || 
      task.CreatedBy == userId
    );

    // 5. Enhance tasks with project information and user details
    const enhancedTasks = await Promise.all(userTasks.map(async (task) => {
      const project = projects.find(p => p.ProjectID === task.ProjectID_FK);
      const enhancedTask = {
        ...task.toObject(),
        ProjectName: project ? project.Name : 'Unknown Project',
        ProjectID: task.ProjectID_FK
      };

      // Fetch Assignee details if exists
      if (task.Assignee) {
        try {
          const assignee = await User.findById(task.Assignee);
          if (assignee) {
            const teamDetails = await TeamDetails.findOne({ MemberID: assignee._id });
            let teamName = null;
            if (teamDetails) {
              const team = await Team.findOne({ TeamID: teamDetails.TeamID_FK }).select('TeamName');
              teamName = team ? team.TeamName : null;
            }
            enhancedTask.AssigneeDetails = {
              _id: assignee._id,
              username: assignee.username,
              fullName: assignee.firstName + " " + assignee.lastName,
              email: assignee.email,
              teamName: teamName
            };
          }
        } catch (error) {
          console.error('Error fetching assignee details:', error);
        }
      }

      // Fetch AssignedTo details if exists
      if (task.AssignedTo) {
        try {
          const assignedTo = await User.findById(task.AssignedTo);
          if (assignedTo) {
            const teamDetails = await TeamDetails.findOne({ MemberID: assignedTo._id });
            let teamName = null;
            if (teamDetails) {
              const team = await Team.findOne({ TeamID: teamDetails.TeamID_FK }).select('TeamName');
              teamName = team ? team.TeamName : null;
            }
            enhancedTask.AssignedToDetails = {
              _id: assignedTo._id,
              username: assignedTo.username,
              fullName: assignedTo.firstName + " " + assignedTo.lastName,
              email: assignedTo.email,
              teamName: teamName
            };
          }
        } catch (error) {
          console.error('Error fetching assignedTo details:', error);
        }
      }

      return enhancedTask;
    }));

    // 6. Fetch status options from CommonType
    const statusOptions = await CommonType.find({ MasterType: 'ProjectStatus' }).select('Value Code Description');
    
    // 7. Calculate statistics
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const stats = {
      totalTasks: enhancedTasks.length,
      completedTasks: enhancedTasks.filter(task => task.Status === 'Completed' || task.Status === 6).length,
      overdueTasks: enhancedTasks.filter(task => {
        if (!task.Deadline || task.Status === 'Completed' || task.Status === 6) return false;
        const deadline = new Date(task.Deadline);
        return deadline < today;
      }).length,
      dueTodayTasks: enhancedTasks.filter(task => {
        if (!task.Deadline || task.Status === 'Completed' || task.Status === 6) return false;
        const deadline = new Date(task.Deadline);
        const taskDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
        return taskDate.getTime() === today.getTime();
      }).length,
      highPriorityTasks: enhancedTasks.filter(task => task.Priority === 'High').length
    };

    res.json({
      success: true,
      data: {
        tasks: enhancedTasks,
        projects: projects.map(p => p.toObject()),
        teams: teams.map(t => t.toObject()),
        stats,
        statusOptions: statusOptions.map(option => ({
          Value: option.Value,
          Code: option.Code,
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching user tasks data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user tasks data'
    });
  }
});

/**
 * @swagger
 * /auth/activities:
 *   get:
 *     summary: Get user activities
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User activities retrieved successfully
 *       401:
 *         description: Not authorized
 *       404:
 *         description: User not found
 */
router.get('/activities', protect, getUserActivities);

/**
 * @swagger
 * /auth/organizations:
 *   get:
 *     summary: Get user organizations
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User organizations retrieved successfully
 *       401:
 *         description: Not authorized
 *       404:
 *         description: User not found
 */
router.get('/organizations', protect, getUserOrganizations);

// PUT /api/auth/onboarding - Update onboarding status
router.put('/onboarding', protect, updateOnboardingStatus);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Not authorized
 */
router.post('/logout', protect, logoutUser);

//Update user status route
router.put('/status', protect, updateUserStatus);

// 2FA routes
router.post('/2fa/generate', protect, generate2FA);
router.post('/2fa/verify', protect, verify2FA);
router.post('/2fa/disable', protect, disable2FA);
router.post('/2fa/verify-login', verifyLogin2FA);

// Security settings routes
router.get('/security-settings', protect, getSecuritySettings);
router.put('/security-settings', protect, updateSecuritySettings);

// User settings routes
router.put('/user-settings', protect, updateUserSettings);

// User status route
router.put('/status', protect, updateUserStatus);

//Password routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-reset-password', verifyResetPassword);

// GitHub OAuth routes
router.post('/github/initiate', initiateGitHubAuth);
router.post('/github/callback', handleGitHubCallback);
router.post('/github/disconnect', protect, disconnectGitHub);
router.get('/github/status/:userId', protect, getGitHubStatus);
router.get('/github/repositories/:userId', protect, getUserRepositories);

// Integrations routes
router.get('/integrations/:userId', protect, getIntegrationsStatus);

module.exports = router; 