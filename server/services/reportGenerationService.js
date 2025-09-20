const { GoogleGenAI } = require('@google/genai');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Import models
const Project = require('../models/Project');
const TaskDetails = require('../models/TaskDetails');
const User = require('../models/User');
const Team = require('../models/Team');
const GeneratedReport = require('../models/GeneratedReport');
const ReportConfig = require('../models/ReportConfig');

/**
 * Report Generation Service
 * Handles LLM-powered report generation using Google Gemini Pro
 */
class ReportGenerationService {
  constructor() {
    // Initialize Google Generative AI with API key
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    this.geminiAI = new GoogleGenAI({});
    this.startTime = null;
  }

  /**
   * Generate a comprehensive report for a project
   * @param {Object} config - Report configuration
   * @returns {Object} Generated report
   */
  async generateReport(config) {
    try {
      this.startTime = Date.now();

      // Validate configuration
      await this.validateConfig(config);

      // Preprocess project data
      const projectData = await this.preprocessProjectData(
        config.projectId,
        config.startDate || this.getDefaultStartDate(),
        config.endDate || new Date()
      );

      // Generate LLM prompt
      const prompt = this.generateReportPrompt(projectData, config.reportType, config.sections, config.advancedOptions);

      // Call LLM for report generation
      const llmResponse = await this.callLLM(prompt);

      // Post-process and structure the report
      const structuredReport = await this.postProcessReport(
        llmResponse,
        projectData,
        config
      );

      // Save the generated report
      const savedReport = await this.saveReport(structuredReport, config);

      return savedReport;
    } catch (error) {
      console.error('Report generation failed:', error);
      throw new Error(`Failed to generate report: ${error.message}`);
    }
  }

  /**
   * Validate report configuration
   * @param {Object} config - Configuration to validate
   */
  async validateConfig(config) {
    if (!config.projectId) {
      throw new Error('Project ID is required');
    }
    if (!config.userId) {
      throw new Error('User ID is required');
    }

    // Check if project exists
    const project = await Project.findOne({ ProjectID: config.projectId });
    if (!project) {
      throw new Error('Project not found');
    }

    // Check if user has access to project
    const user = await User.findById(config.userId);
    if (!user) {
      throw new Error('User not found');
    }
  }

  /**
   * Preprocess project data for LLM consumption
   * @param {String} projectId - Project ID
   * @param {Date} startDate - Start date for data collection
   * @param {Date} endDate - End date for data collection
   * @returns {Object} Processed project data
   */
  async preprocessProjectData(projectId, startDate, endDate) {
    try {
      // Get project details
      const project = await Project.findOne({ ProjectID: projectId });
      if (!project) {
        throw new Error('Project not found');
      }
      new Date(startDate), new Date(endDate);

      // Get tasks within the date range
      const tasks = await TaskDetails.find({
        ProjectID_FK: projectId,
        $or: [
          { CreatedDate: { $gte: new Date(startDate), $lte: new Date(endDate) } },
          { ModifiedDate: { $gte: new Date(startDate), $lte: new Date(endDate) } },
          { FinishDate: { $gte: new Date(startDate), $lte: new Date(endDate) } }
        ]
      }).sort({ CreatedDate: -1 });

      // Get team members
      const teamMembers = await User.find({
        organizationID: project.OrganizationID
      }).select('firstName lastName email role status');

      // Get team details
      const teams = await Team.find({
        OrganizationID: project.OrganizationID
      });

      // Calculate metrics
      const metrics = this.calculateProjectMetrics(project, tasks, teamMembers);

      // Analyze task patterns
      const taskAnalysis = this.analyzeTaskPatterns(tasks);

      // Assess risks
      const riskAssessment = this.assessProjectRisks(project, tasks, teamMembers);
      
      let projectOwnerName = 'Unknown';
      const owner = await User.findById(project.ProjectOwner).select('firstName lastName');
      if (owner) {
        projectOwnerName = `${owner.firstName} ${owner.lastName}`;
      }

      const projectData = {
        project: {
          id: project._id,
          name: project.Name,
          description: project.Description,
          status: project.ProjectStatusID,
          ownerName: projectOwnerName,
          finishDate: project.FinishDate,
          createdAt: project.CreatedDate
        },
        tasks: tasks.map(task => ({
          id: task._id,
          name: task.Name,
          description: task.Description,
          status: task.Status,
          type: task.Type,
          priority: task.Priority,
          assignee: task.Assignee,
          createdDate: task.CreatedDate,
          assignedDate: task.AssignedDate,
          finishDate: task.FinishDate,
          modifiedDate: task.ModifiedDate
        })),
        teamMembers: teamMembers.map(member => ({
          id: member._id,
          name: `${member.firstName} ${member.lastName}`,
          email: member.email,
          role: member.role
        })),
        teams: teams.map(team => ({
          id: team._id,
          name: team.Name,
          description: team.Description,
          members: team.Members
        })),
        metrics,
        taskAnalysis,
        riskAssessment,
        period: {
          startDate,
          endDate
        } 
      };
      return projectData;
    } catch (error) {
      console.error('Error preprocessing project data:', error);
      throw error;
    }
  }

  /**
   * Calculate project metrics
   * @param {Object} project - Project data
   * @param {Array} tasks - Task data
   * @param {Array} teamMembers - Team member data
   * @returns {Object} Calculated metrics
   */
  calculateProjectMetrics(project, tasks, teamMembers) {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.Status === 6).length;
    const overdueTasks = tasks.filter(task =>
      task.FinishDate &&
      new Date(task.FinishDate) < new Date() &&
      task.Status !== 6
    ).length;

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate average completion time
    const completedTaskTimes = tasks
      .filter(task => task.Status === 6 && task.AssignedDate && task.FinishDate)
      .map(task => new Date(task.FinishDate) - new Date(task.AssignedDate));

    const averageCompletionTime = completedTaskTimes.length > 0
      ? completedTaskTimes.reduce((sum, time) => sum + time, 0) / completedTaskTimes.length
      : 0;

    // Calculate team utilization (based on task assignments instead of status)
    const membersWithTasks = new Set(tasks.map(task => task.AssignedTo).filter(Boolean)).size;
    const totalMembers = teamMembers.length;
    const teamUtilization = totalMembers > 0 ? (membersWithTasks / totalMembers) * 100 : 0;

    // Calculate project health score
    const healthScore = this.calculateProjectHealth(project, tasks, teamMembers);

    return {
      totalTasks,
      completedTasks,
      overdueTasks,
      completionRate: Math.round(completionRate * 100) / 100,
      averageCompletionTime: Math.round(averageCompletionTime / (1000 * 60 * 60 * 24)), // Convert to days
      teamUtilization: Math.round(teamUtilization * 100) / 100,
      projectHealth: Math.round(healthScore * 100) / 100,
      activeMembers: membersWithTasks,
      totalMembers
    };
  }

  /**
   * Calculate project health score
   * @param {Object} project - Project data
   * @param {Array} tasks - Task data
   * @param {Array} teamMembers - Team member data
   * @returns {Number} Health score (0-100)
   */
  calculateProjectHealth(project, tasks, teamMembers) {
    let score = 100;

    // Deduct points for overdue tasks
    const overdueTasks = tasks.filter(task =>
      task.FinishDate &&
      new Date(task.FinishDate) < new Date() &&
      task.Status !== 6
    ).length;

    score -= overdueTasks * 5; // 5 points per overdue task

    // Deduct points for low completion rate
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.Status === 6).length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    if (completionRate < 50) {
      score -= (50 - completionRate) * 0.5;
    }

    // Deduct points for approaching deadline
    if (project.FinishDate) {
      const daysUntilDeadline = (new Date(project.FinishDate) - new Date()) / (1000 * 60 * 60 * 24);
      if (daysUntilDeadline < 7) {
        score -= 20;
      } else if (daysUntilDeadline < 30) {
        score -= 10;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Analyze task patterns
   * @param {Array} tasks - Task data
   * @returns {Object} Task analysis
   */
  analyzeTaskPatterns(tasks) {
    const taskTypes = {};
    const priorities = {};
    const statuses = {};

    tasks.forEach(task => {
      // Count by type
      taskTypes[task.Type] = (taskTypes[task.Type] || 0) + 1;

      // Count by priority
      if (task.Priority) {
        priorities[task.Priority] = (priorities[task.Priority] || 0) + 1;
      }

      // Count by status
      statuses[task.Status] = (statuses[task.Status] || 0) + 1;
    });

    return {
      taskTypes,
      priorities,
      statuses,
      totalTasks: tasks.length
    };
  }

  /**
   * Assess project risks
   * @param {Object} project - Project data
   * @param {Array} tasks - Task data
   * @param {Array} teamMembers - Team member data
   * @returns {Object} Risk assessment
   */
  assessProjectRisks(project, tasks, teamMembers) {
    const risks = {
      high: [],
      medium: [],
      low: []
    };

    // High risk: Many overdue tasks
    const overdueTasks = tasks.filter(task =>
      task.FinishDate &&
      new Date(task.FinishDate) < new Date() &&
      task.Status !== 6
    );

    if (overdueTasks.length > 5) {
      risks.high.push(`High number of overdue tasks (${overdueTasks.length})`);
    }

    // High risk: Approaching deadline with low completion
    if (project.FinishDate) {
      const daysUntilDeadline = (new Date(project.FinishDate) - new Date()) / (1000 * 60 * 60 * 24);
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.Status === 6).length;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      if (daysUntilDeadline < 7 && completionRate < 80) {
        risks.high.push('Project deadline approaching with low completion rate');
      }
    }

    // Medium risk: Low team utilization (based on task assignments)
    const membersWithTasks = new Set(tasks.map(task => task.AssignedTo).filter(Boolean)).size;
    const totalMembers = teamMembers.length;
    const teamUtilization = totalMembers > 0 ? (membersWithTasks / totalMembers) * 100 : 0;
    if (teamUtilization < 60) {
      risks.medium.push('Low team utilization');
    }

    // Medium risk: Many high priority tasks
    const highPriorityTasks = tasks.filter(task => task.Priority === 'High').length;
    if (highPriorityTasks > 10) {
      risks.medium.push('High number of high-priority tasks');
    }

    // Low risk: No recent activity
    const recentTasks = tasks.filter(task =>
      new Date(task.ModifiedDate || task.CreatedDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    if (recentTasks.length === 0) {
      risks.low.push('No recent task activity');
    }

    return risks;
  }

  /**
   * Generate LLM prompt for report generation
   * @param {Object} projectData - Processed project data
   * @param {String} reportType - Type of report to generate
   * @param {Array} sections - Custom sections to include
   * @param {Object} advancedOptions - Advanced configuration options
   * @returns {String} Generated prompt
   */
  generateReportPrompt(projectData, reportType, sections = [], advancedOptions = {}) {
    // Extract advanced options with defaults
    const {
      includeMetrics = true,
      includeRiskAssessment = true,
      includeTeamPerformance = true,
      reportDepth = 'standard',
      format = 'professional',
      customPrompt = '',
      language = 'en'
    } = advancedOptions;

    // Build dynamic prompt based on options
    let basePrompt = `You are an expert project management analyst. Generate a ${reportDepth} ${reportType} progress report based on the following project data:

PROJECT INFORMATION:
- Name: ${projectData.project.name}
- Description: ${projectData.project.description}
- Status: ${projectData.project.status}
- Owner: ${projectData.project.owner}
- Finish Date: ${projectData.project.finishDate || 'Not set'}
- Created: ${projectData.project.createdAt}

PERIOD: ${projectData.period.startDate.toDateString()} to ${projectData.period.endDate.toDateString()}`;

    // Add metrics section if enabled
    if (includeMetrics) {
      basePrompt += `

PROJECT METRICS:
- Total Tasks: ${projectData.metrics.totalTasks}
- Completed Tasks: ${projectData.metrics.completedTasks}
- Overdue Tasks: ${projectData.metrics.overdueTasks}
- Completion Rate: ${projectData.metrics.completionRate}%
- Average Completion Time: ${projectData.metrics.averageCompletionTime} days
- Team Utilization: ${projectData.metrics.teamUtilization}%
- Project Health Score: ${projectData.metrics.projectHealth}/100

TASK BREAKDOWN:
${projectData.taskAnalysis.totalTasks} total tasks
Task Types: ${JSON.stringify(projectData.taskAnalysis.taskTypes)}
Priorities: ${JSON.stringify(projectData.taskAnalysis.priorities)}
Statuses: ${JSON.stringify(projectData.taskAnalysis.statuses)}`;
    }

    // Add team information if enabled
    if (includeTeamPerformance) {
      basePrompt += `

TEAM INFORMATION:
- Active Members: ${projectData.metrics.activeMembers}/${projectData.metrics.totalMembers}
- Team Members: ${projectData.teamMembers.map(m => m.name).join(', ')}`;
    }

    // Add risk assessment if enabled
    if (includeRiskAssessment) {
      basePrompt += `

RISK ASSESSMENT:
- High Risk: ${projectData.riskAssessment.high.join(', ') || 'None'}
- Medium Risk: ${projectData.riskAssessment.medium.join(', ') || 'None'}
- Low Risk: ${projectData.riskAssessment.low.join(', ') || 'None'}`;
    }

    // Add report requirements based on depth
    let reportRequirements = '';
    if (reportDepth === 'brief') {
      reportRequirements = `
REPORT REQUIREMENTS (BRIEF):
1. Provide a concise executive summary (1-2 paragraphs, under 100 words)
2. Highlight key metrics and progress
3. Identify top 2-3 risks or bottlenecks
4. Provide 2-3 actionable recommendations
5. Suggest immediate next steps

FORMAT: Concise, bullet-point style, easy to scan`;
    } else if (reportDepth === 'detailed') {
      reportRequirements = `
REPORT REQUIREMENTS (DETAILED):
1. Provide a comprehensive executive summary (3-4 paragraphs, 200-300 words)
2. Analyze project progress with detailed metrics and trends
3. Identify and analyze all risks and bottlenecks with specific data points
4. Provide 5-7 actionable recommendations with implementation details
5. Include detailed team performance analysis and individual insights
6. Suggest next steps, priorities, and long-term strategies
7. Include budget analysis, timeline tracking, and resource utilization insights
8. Provide detailed quality metrics and stakeholder communication analysis

FORMAT: Comprehensive, analytical, with detailed explanations`;
    } else {
      reportRequirements = `
REPORT REQUIREMENTS (STANDARD):
1. Provide an executive summary (2-3 paragraphs, under 200 words)
2. Analyze project progress and identify key metrics
3. Highlight risks and bottlenecks with specific data points
4. Provide 3-5 actionable recommendations
5. Include team performance insights
6. Suggest next steps and priorities
7. Use specific percentages and numbers from the data

FORMAT: Balanced detail, professional business report style`;
    }

    // Add format-specific instructions
    let formatInstructions = '';
    if (format === 'casual') {
      formatInstructions = `
TONE: Friendly, conversational, and approachable
STYLE: Casual business communication, easy to understand
LANGUAGE: Use "we" and "our team" instead of formal third person`;
    } else if (format === 'technical') {
      formatInstructions = `
TONE: Technical, data-driven, and analytical
STYLE: Detailed technical analysis with specific metrics
LANGUAGE: Use technical terminology and precise data references`;
    } else {
      formatInstructions = `
TONE: Professional, analytical, and actionable
STYLE: Formal business report format`;
    }

    // Add language instruction
    const languageInstruction = language !== 'en' ? `
LANGUAGE: Generate the report in ${this.getLanguageName(language)}` : '';

    // Add custom prompt if provided
    const customInstructions = customPrompt ? `
CUSTOM INSTRUCTIONS: ${customPrompt}` : '';

    // Add print-friendly formatting
    const printFormatting = `

FORMAT REQUIREMENTS FOR PRINT-FRIENDLY PDF STYLE:
- Use plain text formatting without special characters or symbols
- Structure with clear, simple headings using ALL CAPS or numbered sections
- Use standard bullet points (-) instead of special characters
- Avoid emojis, special symbols, or decorative elements
- Use simple line breaks and spacing for readability
- Format numbers and percentages clearly (e.g., "75%" not "75 percent")
- Use consistent paragraph spacing
- Keep line lengths reasonable for printing
- Use standard business report terminology
- Ensure content flows logically from section to section
- Make it easy to print on standard 8.5" x 11" paper

STYLE: Plain text business report format optimized for printing`;

    // Add custom sections if any
    const customSections = sections.length > 0 ? `
CUSTOM SECTIONS TO INCLUDE: ${sections.map(s => s.name).join(', ')}` : '';

    // Combine all parts
    basePrompt += reportRequirements + formatInstructions + languageInstruction + customInstructions + printFormatting + customSections + `

Generate the report now:
`;

    return basePrompt;
  }

  /**
   * Get language name from language code
   * @param {String} languageCode - Language code (e.g., 'es', 'fr')
   * @returns {String} Language name
   */
  getLanguageName(languageCode) {
    const languages = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'zh': 'Chinese',
      'ja': 'Japanese'
    };
    return languages[languageCode] || 'English';
  }

  /**
   * Call the LLM API
   * @param {String} prompt - The prompt to send
   * @returns {Object} LLM response
   */
  async callLLM(prompt) {
    try {
      const response = await this.geminiAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          thinkingConfig: {
            thinkingBudget: 0, // Disables thinking for faster response
          },
        }
      });

      return {
        text: response.text,
        usageMetadata: response.usageMetadata || {}
      };
    } catch (error) {
      console.error('LLM API call failed:', error);
      throw new Error(`LLM API call failed: ${error.message}`);
    }
  }

  /**
   * Post-process LLM response and structure the report
   * @param {Object} llmResponse - Raw LLM response
   * @param {Object} projectData - Project data
   * @param {Object} config - Report configuration
   * @returns {Object} Structured report
   */
  async postProcessReport(llmResponse, projectData, config) {
    const content = llmResponse.text;

    return {
      reportId: uuidv4(),
      projectId: config.projectId,
      configId: config.configId || 'manual-generation',
      userId: config.userId,
      reportType: config.reportType,
      generatedAt: new Date(),
      period: {
        startDate: config.startDate || this.getDefaultStartDate(),
        endDate: config.endDate || new Date()
      },
      content: {
        // Save only the raw LLM response
        rawContent: content,
        metrics: projectData.metrics || {},
        riskAssessment: {
          high: Array.isArray(projectData.riskAssessment?.high) ? projectData.riskAssessment.high : [],
          medium: Array.isArray(projectData.riskAssessment?.medium) ? projectData.riskAssessment.medium : [],
          low: Array.isArray(projectData.riskAssessment?.low) ? projectData.riskAssessment.low : []
        },
        teamPerformance: this.generateTeamPerformance(projectData)
      },
      metadata: {
        generationTime: Date.now() - this.startTime,
        dataPoints: projectData.tasks.length,
        accuracy: this.calculateAccuracy(projectData),
        llmModel: 'gemini-2.5-flash',
        promptTokens: llmResponse.usageMetadata?.promptTokenCount || 0,
        responseTokens: llmResponse.usageMetadata?.candidatesTokenCount || 0,
        advancedOptions: config.advancedOptions || {}
      },
      status: 'completed'
    };
  }


  /**
   * Generate team performance data
   * @param {Object} projectData - Project data
   * @returns {Object} Team performance analysis
   */
  generateTeamPerformance(projectData) {
    // This would be enhanced with actual performance calculations
    return {
      topPerformers: [],
      underPerformers: [],
      averagePerformance: 'Good'
    };
  }

  /**
   * Calculate report accuracy score
   * @param {Object} projectData - Project data
   * @returns {Number} Accuracy score
   */
  calculateAccuracy(projectData) {
    // Simple accuracy calculation based on data completeness
    const dataCompleteness = projectData.tasks.length > 0 ? 100 : 0;
    return dataCompleteness;
  }

  /**
   * Save the generated report to database
   * @param {Object} report - Structured report data
   * @param {Object} config - Report configuration
   * @returns {Object} Saved report
   */
  async saveReport(report, config) {
    try {
      const generatedReport = new GeneratedReport(report);
      const savedReport = await generatedReport.save();

      // Update config last generated time
      if (config.configId && config.configId !== 'manual-generation') {
        await ReportConfig.findOneAndUpdate({ configId: config.configId }, {
          lastGenerated: new Date()
        });
      }

      return savedReport;
    } catch (error) {
      console.error('Error saving report:', error);
      throw new Error(`Failed to save report: ${error.message}`);
    }
  }

  /**
   * Get default start date (30 days ago)
   * @returns {Date} Default start date
   */
  getDefaultStartDate() {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  }
}

module.exports = ReportGenerationService;
