const cron = require('node-cron');
const ReportGenerationService = require('./reportGenerationService');
const ReportConfig = require('../models/ReportConfig');
const GeneratedReport = require('../models/GeneratedReport');
const { logActivity } = require('./activityService');

/**
 * Report Scheduling Service
 * Handles automated report generation based on configured schedules
 */
class ReportSchedulingService {
  constructor() {
    this.reportService = new ReportGenerationService();
    this.scheduledJobs = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize the scheduling service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Load all active configurations
      const activeConfigs = await ReportConfig.find({ isActive: true });
      
      // Schedule jobs for each configuration
      for (const config of activeConfigs) {
        await this.scheduleReport(config);
      }

      this.isInitialized = true;
      console.log(`Report scheduling service initialized with ${activeConfigs.length} active configurations`);
    } catch (error) {
      console.error('Error initializing report scheduling service:', error);
    }
  }

  /**
   * Schedule a report generation job
   * @param {Object} config - Report configuration
   */
  async scheduleReport(config) {
    try {
      const cronExpression = this.getCronExpression(config.frequency, config.scheduleSettings);
      
      if (!cronExpression) {
        console.error(`Invalid cron expression for config ${config.configId}`);
        return;
      }

      // Cancel existing job if it exists
      if (this.scheduledJobs.has(config.configId)) {
        this.scheduledJobs.get(config.configId).destroy();
      }

      // Create new scheduled job
      const job = cron.schedule(cronExpression, async () => {
        await this.generateScheduledReport(config);
      }, {
        scheduled: true,
        timezone: config.scheduleSettings.timezone || 'UTC'
      });

      this.scheduledJobs.set(config.configId, job);
      
      console.log(`Scheduled report generation for config ${config.configId} with frequency ${config.frequency}`);
    } catch (error) {
      console.error(`Error scheduling report for config ${config.configId}:`, error);
    }
  }

  /**
   * Generate a scheduled report
   * @param {Object} config - Report configuration
   */
  async generateScheduledReport(config) {
    try {
      console.log(`Generating scheduled report for config ${config.configId}`);

      // Calculate date range based on frequency
      const { startDate, endDate } = this.calculateDateRange(config.frequency);

      const reportConfig = {
        projectId: config.projectId,
        userId: config.userId,
        reportType: config.reportType,
        startDate,
        endDate,
        configId: config.configId
      };

      // Generate the report
      const report = await this.reportService.generateReport(reportConfig);

      // Update delivery status
      await this.updateDeliveryStatus(report.reportId, config.recipients);

      // Log the activity
      await logActivity(
        config.userId,
        'scheduled_report_generated',
        'info',
        `Scheduled ${config.frequency} ${config.reportType} report generated for project`,
        null,
        { configId: config.configId, reportId: report.reportId }
      );

      console.log(`Successfully generated scheduled report ${report.reportId}`);
    } catch (error) {
      console.error(`Error generating scheduled report for config ${config.configId}:`, error);
      
      // Update report status to failed
      await GeneratedReport.findOneAndUpdate(
        { configId: config.configId },
        { 
          status: 'failed',
          errorMessage: error.message
        }
      );
    }
  }

  /**
   * Update delivery status for report recipients
   * @param {String} reportId - Report ID
   * @param {Array} recipients - List of recipients
   */
  async updateDeliveryStatus(reportId, recipients) {
    try {
      const deliveryStatus = recipients.map(recipient => ({
        email: recipient.email,
        sentAt: new Date(),
        status: 'sent' // In a real implementation, this would depend on actual delivery
      }));

      await GeneratedReport.findOneAndUpdate(
        { reportId },
        { 
          'deliveryStatus.emailSent': true,
          'deliveryStatus.emailSentAt': new Date(),
          'deliveryStatus.recipientsNotified': deliveryStatus
        }
      );
    } catch (error) {
      console.error(`Error updating delivery status for report ${reportId}:`, error);
    }
  }

  /**
   * Get cron expression based on frequency and schedule settings
   * @param {String} frequency - Report frequency
   * @param {Object} scheduleSettings - Schedule settings
   * @returns {String} Cron expression
   */
  getCronExpression(frequency, scheduleSettings) {
    const time = scheduleSettings.timeOfDay || '09:00';
    const [hours, minutes] = time.split(':');
    const dayOfWeek = scheduleSettings.dayOfWeek || 1; // Monday

    switch (frequency) {
      case 'daily':
        return `${minutes} ${hours} * * *`; // Every day at specified time
      
      case 'weekly':
        return `${minutes} ${hours} * * ${dayOfWeek}`; // Weekly on specified day
      
      case 'monthly':
        return `${minutes} ${hours} 1 * *`; // First day of every month
      
      case 'quarterly':
        return `${minutes} ${hours} 1 1,4,7,10 *`; // First day of every quarter
      
      default:
        return null;
    }
  }

  /**
   * Calculate date range for report generation
   * @param {String} frequency - Report frequency
   * @returns {Object} Date range
   */
  calculateDateRange(frequency) {
    const endDate = new Date();
    const startDate = new Date();

    switch (frequency) {
      case 'daily':
        startDate.setDate(startDate.getDate() - 1);
        break;
      
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7);
        break;
      
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      
      case 'quarterly':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      
      default:
        startDate.setDate(startDate.getDate() - 30); // Default to 30 days
    }

    return { startDate, endDate };
  }

  /**
   * Add a new report configuration and schedule it
   * @param {Object} config - Report configuration
   */
  async addScheduledReport(config) {
    try {
      await this.scheduleReport(config);
      console.log(`Added scheduled report for config ${config.configId}`);
    } catch (error) {
      console.error(`Error adding scheduled report for config ${config.configId}:`, error);
    }
  }

  /**
   * Update an existing report configuration and reschedule it
   * @param {Object} config - Updated report configuration
   */
  async updateScheduledReport(config) {
    try {
      // Cancel existing job
      if (this.scheduledJobs.has(config.configId)) {
        this.scheduledJobs.get(config.configId).destroy();
        this.scheduledJobs.delete(config.configId);
      }

      // Schedule new job if active
      if (config.isActive) {
        await this.scheduleReport(config);
      }

      console.log(`Updated scheduled report for config ${config.configId}`);
    } catch (error) {
      console.error(`Error updating scheduled report for config ${config.configId}:`, error);
    }
  }

  /**
   * Remove a scheduled report configuration
   * @param {String} configId - Configuration ID
   */
  async removeScheduledReport(configId) {
    try {
      if (this.scheduledJobs.has(configId)) {
        this.scheduledJobs.get(configId).destroy();
        this.scheduledJobs.delete(configId);
        console.log(`Removed scheduled report for config ${configId}`);
      }
    } catch (error) {
      console.error(`Error removing scheduled report for config ${configId}:`, error);
    }
  }

  /**
   * Get all scheduled jobs status
   * @returns {Object} Status of all scheduled jobs
   */
  getScheduledJobsStatus() {
    const status = {};
    
    for (const [configId, job] of this.scheduledJobs) {
      status[configId] = {
        running: job.running,
        nextExecution: job.nextDate(),
        lastExecution: job.lastDate()
      };
    }

    return status;
  }

  /**
   * Manually trigger a report generation for a configuration
   * @param {String} configId - Configuration ID
   */
  async triggerReportGeneration(configId) {
    try {
      const config = await ReportConfig.findOne({ configId });
      if (!config) {
        throw new Error('Configuration not found');
      }

      await this.generateScheduledReport(config);
      console.log(`Manually triggered report generation for config ${configId}`);
    } catch (error) {
      console.error(`Error manually triggering report for config ${configId}:`, error);
      throw error;
    }
  }

  /**
   * Shutdown the scheduling service
   */
  shutdown() {
    for (const [configId, job] of this.scheduledJobs) {
      job.destroy();
    }
    this.scheduledJobs.clear();
    this.isInitialized = false;
    console.log('Report scheduling service shutdown');
  }
}

// Create singleton instance
const reportSchedulingService = new ReportSchedulingService();

module.exports = reportSchedulingService;
