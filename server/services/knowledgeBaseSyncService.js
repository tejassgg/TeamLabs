const Project = require('../models/Project');
const KnowledgeBase = require('../models/KnowledgeBase');
const EmbeddingService = require('./embeddingService');
const TaskDetails = require('../models/TaskDetails');
const UserActivity = require('../models/UserActivity');
const GeneratedReport = require('../models/GeneratedReport');
const Team = require('../models/Team');
const Comment = require('../models/Comment');
const Attachment = require('../models/Attachment');

/**
 * Knowledge Base Sync Service
 * Handles automatic synchronization of data sources with the knowledge base
 */
class KnowledgeBaseSyncService {
  constructor() {
    this.embeddingService = new EmbeddingService();
    this.batchSize = 10; // Process documents in batches
    this.delayBetweenBatches = 1000; // 1 second delay between batches
  }

  /**
   * Sync all data sources for an organization
   * @param {string} organizationId - Organization ID
   * @param {Object} options - Sync options
   * @returns {Object} Sync results
   */
  async syncOrganization(organizationID, options = {}) {
    const {
      sourceTypes = ['project', 'task', 'user_activity', 'report', 'team', 'comment', 'attachment'],
      forceUpdate = false,
      projectId = null
    } = options;

    console.log(`Starting knowledge base sync for organization: ${organizationID}`);

    const results = {
      organizationID,
      totalProcessed: 0,
      totalErrors: 0,
      results: {},
      startTime: new Date(),
      endTime: null
    };

    try {
      // Sync each source type
      for (const sourceType of sourceTypes) {
        console.log(`Syncing ${sourceType} documents...`);
        
        try {
          const sourceResults = await this.syncSourceType(organizationID, sourceType, {
            forceUpdate,
            projectId
          });
          
          results.results[sourceType] = sourceResults;
          results.totalProcessed += sourceResults.processed;
          results.totalErrors += sourceResults.errors;
          
        } catch (error) {
          console.error(`Error syncing ${sourceType}:`, error);
          results.results[sourceType] = {
            processed: 0,
            errors: 1,
            error: error.message
          };
          results.totalErrors++;
        }
      }

      results.endTime = new Date();
      results.duration = results.endTime - results.startTime;

      console.log(`Knowledge base sync completed for organization: ${organizationID}`);
      console.log(`Total processed: ${results.totalProcessed}, Errors: ${results.totalErrors}`);

      return results;

    } catch (error) {
      console.error('Error during organization sync:', error);
      results.endTime = new Date();
      results.error = error.message;
      throw error;
    }
  }

  /**
   * Sync a specific source type
   * @param {string} organizationId - Organization ID
   * @param {string} sourceType - Type of source to sync
   * @param {Object} options - Sync options
   * @returns {Object} Sync results
   */
  async syncSourceType(organizationID, sourceType, options = {}) {
    const { forceUpdate = false, projectId = null } = options;

    let documents = [];
    let query = {};

    // Build query based on source type
    switch (sourceType) {
      case 'project':
        query = { OrganizationID: organizationID };
        if (projectId) query.ProjectID = projectId;
        documents = await Project.find(query);
        break;

      case 'task':
        if (projectId) {
          documents = await TaskDetails.find({ ProjectID_FK: projectId });
        } else {
          // Get all tasks for projects in the organization
          const projects = await Project.find({ OrganizationID: organizationID }).select('ProjectID');
          const projectIds = projects.map(p => p.ProjectID);
          documents = await TaskDetails.find({ ProjectID_FK: { $in: projectIds } });
        }
        break;

      case 'user_activity':
        query = { organizationID: organizationID };
        if (projectId) query.projectId = projectId;
        documents = await UserActivity.find(query).limit(1000); // Limit to recent activities
        break;

      case 'report':
        if (projectId) {
          documents = await GeneratedReport.find({ projectId });
        } else {
          // Get reports for all projects in organization
          const projects = await Project.find({ OrganizationID: organizationID }).select('ProjectID');
          const projectIds = projects.map(p => p.ProjectID);
          documents = await GeneratedReport.find({ projectId: { $in: projectIds } });
        }
        break;

      case 'team':
        query = { OrganizationID: organizationID };
        documents = await Team.find(query);
        break;

      case 'comment':
        if (projectId) {
          documents = await Comment.find({ ParentID: projectId });
        } else {
          // Get comments for all projects in organization
          const projects = await Project.find({ OrganizationID: organizationID }).select('ProjectID');
          const projectIds = projects.map(p => p.ProjectID);
          documents = await Comment.find({ ParentID: { $in: projectIds } });
        }
        break;

      case 'attachment':
        if (projectId) {
          documents = await Attachment.find({ parentId: projectId });
        } else {
          // Get attachments for all projects in organization
          const projects = await Project.find({ OrganizationID: organizationID }).select('ProjectID');
          const projectIds = projects.map(p => p.ProjectID);
          documents = await Attachment.find({ parentId: { $in: projectIds } });
        }
        break;

      default:
        throw new Error(`Unknown source type: ${sourceType}`);
    }

    console.log(`Found ${documents.length} ${sourceType} documents to process`);

    const results = {
      sourceType,
      totalDocuments: documents.length,
      processed: 0,
      errors: 0,
      errorDetails: []
    };

    // Process documents in batches
    for (let i = 0; i < documents.length; i += this.batchSize) {
      const batch = documents.slice(i, i + this.batchSize);
      
      console.log(`Processing batch ${Math.floor(i / this.batchSize) + 1} of ${Math.ceil(documents.length / this.batchSize)} for ${sourceType}`);

      for (const document of batch) {
        try {
          const result = await this.processDocument(document, sourceType, {
            organizationID,
            projectId: document.ProjectID || document.ProjectID_FK || document.projectId,
            userId: document.CreatedBy || document.userId,
            forceUpdate
          });

          if (result.success) {
            results.processed++;
          }

        } catch (error) {
          console.error(`Error processing ${sourceType} document ${document._id}:`, error);
          results.errors++;
          results.errorDetails.push({
            documentId: document._id,
            error: error.message
          });
        }
      }

      // Delay between batches to avoid rate limits
      if (i + this.batchSize < documents.length) {
        await new Promise(resolve => setTimeout(resolve, this.delayBetweenBatches));
      }
    }

    return results;
  }

  /**
   * Sync a specific project's data
   * @param {string} projectId - Project ID
   * @param {Object} options - Sync options
   * @returns {Object} Sync results
   */
  async syncProject(projectId, options = {}) {
    const { forceUpdate = false } = options;

    // Get project details
    const project = await Project.findOne({ ProjectID: projectId });
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    console.log(`Starting knowledge base sync for project: ${project.Name} (${projectId})`);

    const results = {
      projectId,
      projectName: project.Name,
      organizationId: project.OrganizationID,
      totalProcessed: 0,
      totalErrors: 0,
      results: {},
      startTime: new Date(),
      endTime: null
    };

    const sourceTypes = ['project', 'task', 'report', 'comment', 'attachment'];

    try {
      for (const sourceType of sourceTypes) {
        try {
          const sourceResults = await this.syncSourceType(project.OrganizationID, sourceType, {
            forceUpdate,
            projectId
          });
          
          results.results[sourceType] = sourceResults;
          results.totalProcessed += sourceResults.processed;
          results.totalErrors += sourceResults.errors;
          
        } catch (error) {
          console.error(`Error syncing ${sourceType} for project ${projectId}:`, error);
          results.results[sourceType] = {
            processed: 0,
            errors: 1,
            error: error.message
          };
          results.totalErrors++;
        }
      }

      results.endTime = new Date();
      results.duration = results.endTime - results.startTime;

      console.log(`Project knowledge base sync completed: ${project.Name}`);
      console.log(`Total processed: ${results.totalProcessed}, Errors: ${results.totalErrors}`);

      return results;

    } catch (error) {
      console.error('Error during project sync:', error);
      results.endTime = new Date();
      results.error = error.message;
      throw error;
    }
  }

  /**
   * Remove project data from knowledge base
   * @param {string} projectId - Project ID
   * @returns {Object} Removal results
   */
  async removeProject(projectId) {
    try {
      const project = await Project.findOne({ ProjectID: projectId });
      if (!project) {
        throw new Error(`Project not found: ${projectId}`);
      }

      console.log(`Removing project ${project.Name} from knowledge base`);

      const sourceTypes = ['project', 'task', 'report', 'comment', 'attachment'];
      const results = {
        projectId,
        projectName: project.Name,
        organizationID: project.OrganizationID,
        removedCount: 0,
        errors: 0,
        errorDetails: []
      };

      for (const sourceType of sourceTypes) {
        try {
          const result = await this.removeDocument(sourceType, projectId, project.OrganizationID);
          results.removedCount += result.deletedCount;
        } catch (error) {
          console.error(`Error removing ${sourceType} for project ${projectId}:`, error);
          results.errors++;
          results.errorDetails.push({
            sourceType,
            error: error.message
          });
        }
      }

      console.log(`Removed ${results.removedCount} documents for project ${project.Name}`);

      return results;

    } catch (error) {
      console.error('Error removing project from knowledge base:', error);
      throw error;
    }
  }

  /**
   * Get sync status for an organization
   * @param {string} organizationID - Organization ID
   * @returns {Object} Sync status
   */
  async getSyncStatus(organizationID) {
    try {
      const stats = await this.getKnowledgeBaseStats(organizationID);
      
      // Get counts of source documents
      const sourceCounts = {
        projects: await Project.countDocuments({ OrganizationID: organizationID }),
        tasks: 0,
        reports: 0,
        teams: await Team.countDocuments({ OrganizationID: organizationID }),
        activities: await UserActivity.countDocuments({ organizationID: organizationID })
      };

      // Get task and report counts
      const projects = await Project.find({ OrganizationID: organizationID }).select('ProjectID');
      const projectIds = projects.map(p => p.ProjectID);
      
      sourceCounts.tasks = await TaskDetails.countDocuments({ ProjectID_FK: { $in: projectIds } });
      sourceCounts.reports = await GeneratedReport.countDocuments({ projectId: { $in: projectIds } });

      return {
        organizationID,
        knowledgeBaseStats: stats,
        sourceDocumentCounts: sourceCounts,
        lastChecked: new Date()
      };

    } catch (error) {
      console.error('Error getting sync status:', error);
      throw error;
    }
  }

  /**
   * Process and index a document in the knowledge base
   * @param {Object} document - Document to process
   * @param {string} sourceType - Type of source document
   * @param {Object} options - Processing options
   * @returns {Object} Processing result
   */
  async processDocument(document, sourceType, options = {}) {
    try {
      const { organizationID, projectId, userId, forceUpdate = false } = options;

      // Generate document content
      const { title, content } = this.generateDocumentContent(document, sourceType);

      // Check if document already exists
      const existingDoc = await KnowledgeBase.findOne({
        organizationId: organizationID,
        projectId: projectId || null,
        sourceType,
        sourceId: document._id.toString()
      });

      if (existingDoc && !forceUpdate) {
        return { success: true, action: 'skipped', reason: 'already_exists' };
      }

      // Generate embedding
      const embedding = await this.embeddingService.generateEmbedding(content);

      // Extract keywords and categories
      const keywords = this.embeddingService.extractKeywords(content);
      const categories = this.embeddingService.categorizeContent(content);

      // Prepare document data
      const docData = {
        organizationId: organizationID,
        projectId: projectId || null,
        sourceType,
        sourceId: document._id.toString(),
        title,
        content,
        embedding,
        metadata: {
          originalData: document,
          processedAt: new Date(),
          chunkIndex: 0,
          totalChunks: 1,
          keywords,
          categories
        },
        isActive: true
      };

      // Upsert document
      await KnowledgeBase.findOneAndUpdate(
        {
          organizationId: organizationID,
          projectId: projectId || null,
          sourceType,
          sourceId: document._id.toString()
        },
        docData,
        { upsert: true, new: true }
      );

      return { success: true, action: forceUpdate ? 'updated' : 'created' };

    } catch (error) {
      console.error('Error processing document:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove documents from knowledge base for a project
   * @param {string} sourceType - Type of documents to remove
   * @param {string} projectId - Project ID
   * @param {string} organizationId - Organization ID
   * @returns {Object} Removal result
   */
  async removeDocument(sourceType, projectId, organizationId) {
    try {
      const result = await KnowledgeBase.deleteMany({
        organizationId: organizationId,
        projectId,
        sourceType
      });

      return { deletedCount: result.deletedCount, success: true };
    } catch (error) {
      console.error('Error removing documents:', error);
      return { deletedCount: 0, success: false, error: error.message };
    }
  }

  /**
   * Get knowledge base statistics
   * @param {string} organizationId - Organization ID
   * @returns {Object} Statistics
   */
  async getKnowledgeBaseStats(organizationId) {
    try {
      const totalDocs = await KnowledgeBase.countDocuments({ organizationId: organizationId });
      const docsByType = await KnowledgeBase.aggregate([
        { $match: { organizationId: organizationId } },
        { $group: { _id: "$sourceType", count: { $sum: 1 } } }
      ]);

      return {
        totalDocuments: totalDocs,
        documentsByType: docsByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error getting knowledge base stats:', error);
      throw error;
    }
  }

  /**
   * Generate document content for different source types
   * @param {Object} document - Document to process
   * @param {string} sourceType - Type of source document
   * @returns {Object} Document title and content
   */
  generateDocumentContent(document, sourceType) {
    let title = '';
    let content = '';

    switch (sourceType) {
      case 'project':
        title = `Project: ${document.Name}`;
        content = `
          Project Name: ${document.Name}
          Description: ${document.Description || 'No description provided'}
          Status: ${document.ProjectStatusID || 'Unknown'}
          Owner: ${document.ProjectOwner || 'Unknown'}
          Organization ID: ${document.OrganizationID}
          Created Date: ${document.CreatedDate}
          Finish Date: ${document.FinishDate || 'Not set'}
          GitHub Repository: ${document.githubRepository?.repositoryFullName || 'Not connected'}
        `.trim();
        break;

      case 'task':
        title = `Task: ${document.Name}`;
        content = `
          Task Name: ${document.Name}
          Description: ${document.Description || 'No description provided'}
          Status: ${document.Status || 'Unknown'}
          Type: ${document.Type || 'Unknown'}
          Priority: ${document.Priority || 'Unknown'}
          Assigned To: ${document.AssignedTo || 'Unassigned'}
          Project ID: ${document.ProjectID_FK || 'Unknown'}
          Created Date: ${document.CreatedDate}
          Due Date: ${document.DueDate || 'Not set'}
        `.trim();
        break;

      case 'report':
        title = `Report: ${document.reportType}`;
        content = `
          Report Type: ${document.reportType}
          Generated At: ${document.generatedAt}
          Period: ${document.period?.startDate} to ${document.period?.endDate}
          Content: ${document.content?.rawContent?.substring(0, 1000) || 'No content available'}...
        `.trim();
        break;

      case 'team':
        title = `Team: ${document.Name}`;
        content = `
          Team Name: ${document.Name}
          Description: ${document.Description || 'No description provided'}
          Organization ID: ${document.OrganizationID}
          Created Date: ${document.CreatedDate}
          Team Members: ${document.Members?.map(member => member.Name).join(', ') || 'No members'}
        `.trim();
        break;

      case 'comment':
        title = `Comment on ${document.ParentType}`;
        content = `
          Comment: ${document.Content}
          Author: ${document.Author}
          Parent Type: ${document.ParentType}
          Parent ID: ${document.ParentID}
          Created Date: ${document.CreatedDate}
          Modified Date: ${document.ModifiedDate || 'Not modified'}
        `.trim();
        break;

      case 'attachment':
        title = `Attachment: ${document.originalName}`;
        content = `
          File Name: ${document.originalName}
          File Type: ${document.mimetype}
          File Size: ${document.size} bytes
          Uploaded By: ${document.uploadedBy}
          Parent Type: ${document.parentType}
          Parent ID: ${document.parentId}
          Upload Date: ${document.uploadDate}
          Description: ${document.description || 'No description provided'}
        `.trim();
        break;

      default:
        title = `Document: ${sourceType}`;
        content = JSON.stringify(document, null, 2);
    }

    return {
      title: title.substring(0, 200), // Limit title length
      content: content.substring(0, 5000) // Limit content length
    };
  }
}

module.exports = KnowledgeBaseSyncService;
