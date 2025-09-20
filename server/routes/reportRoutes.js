const express = require('express');
const router = express.Router();
const { protect: auth } = require('../middleware/auth');
const ReportGenerationService = require('../services/reportGenerationService');
const reportSchedulingService = require('../services/reportSchedulingService');
const ReportConfig = require('../models/ReportConfig');
const GeneratedReport = require('../models/GeneratedReport');
const Project = require('../models/Project');
const { logActivity } = require('../services/activityService');

/**
 * @swagger
 * components:
 *   schemas:
 *     ReportConfig:
 *       type: object
 *       required:
 *         - userId
 *         - projectId
 *         - reportType
 *         - frequency
 *       properties:
 *         configId:
 *           type: string
 *           description: Unique configuration ID
 *         userId:
 *           type: string
 *           description: User ID who created the configuration
 *         projectId:
 *           type: string
 *           description: Project ID for the report
 *         reportType:
 *           type: string
 *           enum: ["executive", "detailed", "technical", "dashboard"]
 *           description: Type of report to generate
 *         frequency:
 *           type: string
 *           enum: ["daily", "weekly", "monthly", "quarterly"]
 *           description: How often to generate the report
 *         sections:
 *           type: array
 *           description: Custom sections to include in the report
 *         recipients:
 *           type: array
 *           description: List of recipients for the report
 *         isActive:
 *           type: boolean
 *           description: Whether the configuration is active
 *     
 *     GeneratedReport:
 *       type: object
 *       properties:
 *         reportId:
 *           type: string
 *           description: Unique report ID
 *         projectId:
 *           type: string
 *           description: Project ID
 *         reportType:
 *           type: string
 *           description: Type of report
 *         generatedAt:
 *           type: string
 *           format: date-time
 *           description: When the report was generated
 *         content:
 *           type: object
 *           description: Report content and analysis
 *         status:
 *           type: string
 *           enum: ["generating", "completed", "failed", "cancelled"]
 *           description: Current status of the report
 */

/**
 * @swagger
 * /api/reports/generate:
 *   post:
 *     summary: Generate a new progress report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *             properties:
 *               projectId:
 *                 type: string
 *                 description: Project ID to generate report for
 *               reportType:
 *                 type: string
 *                 enum: ["executive", "detailed", "technical", "dashboard"]
 *                 default: "executive"
 *                 description: Type of report to generate
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Start date for data collection
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: End date for data collection
 *               configId:
 *                 type: string
 *                 description: Configuration ID to use
 *     responses:
 *       200:
 *         description: Report generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 report:
 *                   $ref: '#/components/schemas/GeneratedReport'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/generate', auth, async (req, res) => {
  try {
    const { projectId, reportType = 'executive', startDate, endDate, configId } = req.body;

    if (!projectId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Project ID is required' 
      });
    }

    // Check if user has access to the project
    const project = await Project.findOne({ ProjectID: projectId });
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        error: 'Project not found' 
      });
    }

    // Check if user has access to the project's organization
    if (project.OrganizationID !== req.user.organizationID) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied to this project' 
      });
    }

    // Check report limit (5 reports per project)
    const existingReportsCount = await GeneratedReport.countDocuments({ projectId });
    if (existingReportsCount >= 5) {
      return res.status(400).json({
        success: false,
        error: 'Maximum of 5 reports allowed per project. Please delete an existing report to generate a new one.',
        maxReports: 5,
        currentCount: existingReportsCount
      });
    }

    const reportService = new ReportGenerationService();
    
    const config = {
      projectId,
      userId: req.user._id,
      reportType,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      configId
    };

    const report = await reportService.generateReport(config);

    // Log the activity
    await logActivity(
      req.user._id,
      'report_generated',
      'info',
      `Generated ${reportType} report for project: ${project.Name}`,
      req,
      { projectId, reportType, reportId: report.reportId }
    );

    res.json({ 
      success: true, 
      report: report.toObject() 
    });
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate report' 
    });
  }
});

/**
 * @swagger
 * /api/reports/config:
 *   post:
 *     summary: Create a new report configuration
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReportConfig'
 *     responses:
 *       201:
 *         description: Configuration created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/config', auth, async (req, res) => {
  try {
    const {
      projectId,
      reportType = 'executive',
      frequency = 'weekly',
      sections = [],
      recipients = [],
      scheduleSettings = {}
    } = req.body;

    if (!projectId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Project ID is required' 
      });
    }

    // Check if project exists and user has access
    const project = await Project.findOne({ ProjectID: projectId });
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        error: 'Project not found' 
      });
    }

    if (project.OrganizationID !== req.user.organizationID) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied to this project' 
      });
    }

    const config = new ReportConfig({
      userId: req.user._id,
      projectId,
      reportType,
      frequency,
      sections,
      recipients,
      scheduleSettings,
      isActive: true
    });

    const savedConfig = await config.save();

    // Schedule the report generation
    await reportSchedulingService.addScheduledReport(savedConfig);

    // Log the activity
    await logActivity(
      req.user._id,
      'report_config_created',
      'info',
      `Created ${frequency} ${reportType} report configuration for project: ${project.Name}`,
      req,
      { projectId, configId: savedConfig.configId }
    );

    res.status(201).json({ 
      success: true, 
      config: savedConfig.toObject() 
    });
  } catch (error) {
    console.error('Report config creation error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to create report configuration' 
    });
  }
});

/**
 * @swagger
 * /api/reports/config/{configId}:
 *   get:
 *     summary: Get a specific report configuration
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: configId
 *         required: true
 *         schema:
 *           type: string
 *         description: Configuration ID
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
 *       404:
 *         description: Configuration not found
 *       401:
 *         description: Unauthorized
 */
router.get('/config/:configId', auth, async (req, res) => {
  try {
    const { configId } = req.params;

    const config = await ReportConfig.findOne({ 
      configId,
      userId: req.user._id 
    });

    if (!config) {
      return res.status(404).json({ 
        success: false, 
        error: 'Configuration not found' 
      });
    }

    res.json({ 
      success: true, 
      config: config.toObject() 
    });
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to retrieve configuration' 
    });
  }
});

/**
 * @swagger
 * /api/reports/config/{configId}:
 *   put:
 *     summary: Update a report configuration
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: configId
 *         required: true
 *         schema:
 *           type: string
 *         description: Configuration ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reportType:
 *                 type: string
 *               frequency:
 *                 type: string
 *               sections:
 *                 type: array
 *               recipients:
 *                 type: array
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 *       404:
 *         description: Configuration not found
 *       401:
 *         description: Unauthorized
 */
router.put('/config/:configId', auth, async (req, res) => {
  try {
    const { configId } = req.params;
    const updates = req.body;

    const config = await ReportConfig.findOneAndUpdate(
      { configId, userId: req.user._id },
      { ...updates, updatedAt: new Date() },
      { new: true }
    );

    if (!config) {
      return res.status(404).json({ 
        success: false, 
        error: 'Configuration not found' 
      });
    }

    // Update the scheduled report
    await reportSchedulingService.updateScheduledReport(config);

    // Log the activity
    await logActivity(
      req.user._id,
      'report_config_updated',
      'info',
      `Updated report configuration: ${configId}`,
      req,
      { configId, updates }
    );

    res.json({ 
      success: true, 
      config: config.toObject() 
    });
  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update configuration' 
    });
  }
});

/**
 * @swagger
 * /api/reports/config/{configId}:
 *   delete:
 *     summary: Delete a report configuration
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: configId
 *         required: true
 *         schema:
 *           type: string
 *         description: Configuration ID
 *     responses:
 *       200:
 *         description: Configuration deleted successfully
 *       404:
 *         description: Configuration not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/config/:configId', auth, async (req, res) => {
  try {
    const { configId } = req.params;

    const config = await ReportConfig.findOneAndDelete({ 
      configId,
      userId: req.user._id 
    });

    if (!config) {
      return res.status(404).json({ 
        success: false, 
        error: 'Configuration not found' 
      });
    }

    // Remove the scheduled report
    await reportSchedulingService.removeScheduledReport(configId);

    // Log the activity
    await logActivity(
      req.user._id,
      'report_config_deleted',
      'info',
      `Deleted report configuration: ${configId}`,
      req,
      { configId }
    );

    res.json({ 
      success: true, 
      message: 'Configuration deleted successfully' 
    });
  } catch (error) {
    console.error('Delete config error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to delete configuration' 
    });
  }
});

/**
 * @swagger
 * /api/reports/{reportId}:
 *   delete:
 *     summary: Delete a generated report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report deleted successfully
 *       404:
 *         description: Report not found
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.delete('/:reportId', auth, async (req, res) => {
  try {
    const { reportId } = req.params;

    // Find the report
    const report = await GeneratedReport.findOne({ reportId });
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        error: 'Report not found' 
      });
    }

    // Check if user has access to the project
    const project = await Project.findOne({ ProjectID: report.projectId });
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        error: 'Project not found' 
      });
    }

    // Check if user has access to the project's organization
    if (project.OrganizationID !== req.user.organizationID) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied to this project' 
      });
    }

    // Delete the report
    await GeneratedReport.findOneAndDelete({ reportId });

    // Log the activity
    await logActivity(
      req.user._id,
      'report_deleted',
      'info',
      `Deleted report: ${reportId} for project: ${project.Name}`,
      req,
      { reportId, projectId: report.projectId }
    );

    res.json({ 
      success: true, 
      message: 'Report deleted successfully' 
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to delete report' 
    });
  }
});

/**
 * @swagger
 * /api/reports/configs:
 *   get:
 *     summary: Get all report configurations for a user
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Filter by project ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Configurations retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/configs', auth, async (req, res) => {
  try {
    const { projectId, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const query = { userId: req.user._id };
    if (projectId) {
      query.projectId = projectId;
    }

    const configs = await ReportConfig.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ReportConfig.countDocuments(query);

    res.json({
      success: true,
      configs: configs.map(config => config.toObject()),
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get configs error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to retrieve configurations' 
    });
  }
});

/**
 * @swagger
 * /api/reports/{reportId}:
 *   get:
 *     summary: Get a specific generated report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report retrieved successfully
 *       404:
 *         description: Report not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:reportId', auth, async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await GeneratedReport.findOne({ 
      reportId,
      userId: req.user._id 
    });

    if (!report) {
      return res.status(404).json({ 
        success: false, 
        error: 'Report not found' 
      });
    }

    // Track view
    await report.addView(req.user._id);

    res.json({ 
      success: true, 
      report: report.toObject() 
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to retrieve report' 
    });
  }
});

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Get all generated reports for a user
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Filter by project ID
 *       - in: query
 *         name: reportType
 *         schema:
 *           type: string
 *         description: Filter by report type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Reports retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', auth, async (req, res) => {
  try {
    const { projectId, reportType, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const query = { userId: req.user._id };
    if (projectId) {
      query.projectId = projectId;
    }
    if (reportType) {
      query.reportType = reportType;
    }

    const reports = await GeneratedReport.find(query)
      .sort({ generatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await GeneratedReport.countDocuments(query);

    res.json({
      success: true,
      reports: reports.map(report => report.toObject()),
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to retrieve reports' 
    });
  }
});

/**
 * @swagger
 * /api/reports/{reportId}/feedback:
 *   post:
 *     summary: Submit feedback for a report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5
 *               comments:
 *                 type: string
 *                 description: Optional comments
 *     responses:
 *       200:
 *         description: Feedback submitted successfully
 *       404:
 *         description: Report not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:reportId/feedback', auth, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { rating, comments } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        error: 'Rating must be between 1 and 5' 
      });
    }

    const report = await GeneratedReport.findOne({ 
      reportId,
      userId: req.user._id 
    });

    if (!report) {
      return res.status(404).json({ 
        success: false, 
        error: 'Report not found' 
      });
    }

    await report.addFeedback(rating, comments, req.user._id);

    // Log the activity
    await logActivity(
      req.user._id,
      'report_feedback_submitted',
      'info',
      `Submitted feedback for report: ${reportId}`,
      req,
      { reportId, rating, comments }
    );

    res.json({ 
      success: true, 
      message: 'Feedback submitted successfully' 
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to submit feedback' 
    });
  }
});

/**
 * @swagger
 * /api/reports/trigger/{configId}:
 *   post:
 *     summary: Manually trigger report generation for a configuration
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: configId
 *         required: true
 *         schema:
 *           type: string
 *         description: Configuration ID
 *     responses:
 *       200:
 *         description: Report generation triggered successfully
 *       404:
 *         description: Configuration not found
 *       401:
 *         description: Unauthorized
 */
router.post('/trigger/:configId', auth, async (req, res) => {
  try {
    const { configId } = req.params;

    // Check if user has access to the configuration
    const config = await ReportConfig.findOne({ 
      configId,
      userId: req.user._id 
    });

    if (!config) {
      return res.status(404).json({ 
        success: false, 
        error: 'Configuration not found' 
      });
    }

    // Trigger report generation
    await reportSchedulingService.triggerReportGeneration(configId);

    // Log the activity
    await logActivity(
      req.user._id,
      'report_manually_triggered',
      'info',
      `Manually triggered report generation for config: ${configId}`,
      req,
      { configId }
    );

    res.json({ 
      success: true, 
      message: 'Report generation triggered successfully' 
    });
  } catch (error) {
    console.error('Trigger report error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to trigger report generation' 
    });
  }
});

module.exports = router;
