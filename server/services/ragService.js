const KnowledgeBase = require('../models/KnowledgeBase');
const EmbeddingService = require('./embeddingService');
const KnowledgeBaseSyncService = require('./knowledgeBaseSyncService');

/**
 * RAG (Retrieval-Augmented Generation) Service
 * Handles document processing, indexing, and retrieval for enhanced report generation
 */
class RAGService {
  constructor() {
    this.embeddingService = new EmbeddingService();
    this.syncService = new KnowledgeBaseSyncService();
    this.maxRetrievalResults = 10;
    this.similarityThreshold = 0.7;
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
      const {
        organizationId,
        projectId = null,
        userId = null,
        forceUpdate = false
      } = options;

      if (!organizationId) {
        throw new Error('Organization ID is required');
      }

      // Check if document already exists
      const existingDoc = await KnowledgeBase.findOne({
        sourceType,
        sourceId: document._id || document.ProjectID || document.TaskID,
        organizationId
      });

      if (existingDoc && !forceUpdate) {
        console.log(`Document ${sourceType}:${document._id} already exists in knowledge base`);
        return { success: true, documentId: existingDoc.documentId, updated: false };
      }

      // Extract and prepare content for processing
      const processedContent = await this.extractDocumentContent(document, sourceType);
      
      if (!processedContent.content || processedContent.content.trim().length === 0) {
        console.log(`No content to process for document ${sourceType}:${document._id}`);
        return { success: true, documentId: null, updated: false };
      }

      // Chunk the content
      const chunks = this.embeddingService.chunkText(processedContent.content, {
        maxChunkSize: 800,
        overlapSize: 100,
        preserveSentences: true
      });

      const results = [];

      // Process each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Generate embedding for the chunk
        const embedding = await this.embeddingService.generateEmbedding(chunk.text);
        
        // Extract keywords and categories
        const keywords = this.embeddingService.extractKeywords(chunk.text);
        const categories = this.embeddingService.categorizeContent(chunk.text);

        // Prepare knowledge base document
        const kbDocument = {
          sourceType,
          sourceId: document._id || document.ProjectID || document.TaskID,
          organizationId,
          projectId,
          userId,
          title: processedContent.title,
          content: chunk.text,
          metadata: {
            originalData: document,
            processedAt: new Date(),
            chunkIndex: i,
            totalChunks: chunks.length,
            keywords,
            categories
          },
          embedding,
          embeddingModel: 'text-embedding-004'
        };

        // Save or update in knowledge base
        if (existingDoc && i === 0) {
          // Update existing document
          Object.assign(existingDoc, kbDocument);
          await existingDoc.save();
          results.push({ chunkIndex: i, documentId: existingDoc.documentId, action: 'updated' });
        } else {
          // Create new document
          const savedDoc = await KnowledgeBase.create(kbDocument);
          results.push({ chunkIndex: i, documentId: savedDoc.documentId, action: 'created' });
        }

        // Small delay to avoid rate limits
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      return {
        success: true,
        documentId: results[0]?.documentId,
        chunksProcessed: chunks.length,
        results
      };

    } catch (error) {
      console.error('Error processing document:', error);
      throw new Error(`Failed to process document: ${error.message}`);
    }
  }

  /**
   * Extract relevant content from different document types
   * @param {Object} document - Source document
   * @param {string} sourceType - Type of document
   * @returns {Object} Extracted content and metadata
   */
  async extractDocumentContent(document, sourceType) {
    let title = '';
    let content = '';

    switch (sourceType) {
      case 'project':
        title = `Project: ${document.Name}`;
        content = `
          Project Name: ${document.Name}
          Description: ${document.Description || 'No description provided'}
          Project Owner: ${document.ProjectOwner}
          Status: ${document.ProjectStatusID}
          Created Date: ${document.CreatedDate}
          Due Date: ${document.DueDate || 'Not set'}
          Organization ID: ${document.OrganizationID}
          ${document.githubRepository?.connected ? `
          GitHub Repository: ${document.githubRepository.repositoryName}
          Repository URL: ${document.githubRepository.repositoryUrl}
          Language: ${document.githubRepository.repositoryLanguage}
          Stars: ${document.githubRepository.repositoryStars}
          Forks: ${document.githubRepository.repositoryForks}
          ` : ''}
        `.trim();
        break;

      case 'task':
        title = `Task: ${document.Name}`;
        content = `
          Task Name: ${document.Name}
          Description: ${document.Description || 'No description provided'}
          Type: ${document.Type}
          Priority: ${document.Priority || 'Medium'}
          Status: ${document.Status}
          Assignee: ${document.AssignedTo || 'Unassigned'}
          Project ID: ${document.ProjectID_FK}
          Created Date: ${document.CreatedDate}
          Assigned Date: ${document.AssignedDate || 'Not assigned'}
          Due Date: ${document.DueDate || 'Not set'}
          Created By: ${document.CreatedBy}
          Modified By: ${document.ModifiedBy || 'Not modified'}
        `.trim();
        break;

      case 'user_activity':
        title = `Activity: ${document.type}`;
        content = `
          Activity Type: ${document.type}
          User: ${document.user}
          Status: ${document.status}
          Timestamp: ${document.timestamp}
          Details: ${document.details || 'No additional details'}
          IP Address: ${document.ipAddress || 'Not available'}
          User Agent: ${document.userAgent || 'Not available'}
        `.trim();
        break;

      case 'report':
        title = `Report: ${document.reportType}`;
        content = `
          Report Type: ${document.reportType}
          Generated At: ${document.generatedAt}
          Project ID: ${document.projectId}
          Period: ${document.period?.startDate} to ${document.period?.endDate}
          Content: ${document.content?.rawContent || 'No content available'}
          Metrics: ${JSON.stringify(document.content?.metrics || {})}
          Risk Assessment: ${JSON.stringify(document.content?.riskAssessment || {})}
          Team Performance: ${JSON.stringify(document.content?.teamPerformance || {})}
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

  /**
   * Retrieve relevant documents for a query
   * @param {string} query - Search query
   * @param {Object} options - Retrieval options
   * @returns {Array} Relevant documents
   */
  async retrieveRelevantDocuments(query, options = {}) {
    try {
      const {
        organizationID,
        projectId = null,
        sourceTypes = ['project', 'task', 'report', 'user_activity', 'team'],
        limit = this.maxRetrievalResults,
        similarityThreshold = this.similarityThreshold,
        categories = null
      } = options;

      // if (!organizationID) {
      //   throw new Error('Organization ID is required');
      // }

      // Generate embedding for the query
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);

      // Build search criteria
      const searchCriteria = {
        organizationId: organizationID,
        isActive: true,
        ...(projectId && { projectId }),
        ...(sourceTypes.length > 0 && { sourceType: { $in: sourceTypes } }),
        ...(categories && { 'metadata.categories': { $in: categories } })
      };

      // Get all relevant documents from knowledge base
      let documents = await KnowledgeBase.find(searchCriteria);

      // If no documents found, try to sync and generate embeddings
      if (documents.length === 0) {        
        try {
          // Trigger sync for the organization
          if (organizationID) {
            const syncResult = await this.syncService.syncOrganization(organizationID, sourceTypes, false);
            // Try to retrieve documents again after sync
            documents = await KnowledgeBase.find(searchCriteria);
          }
        } catch (syncError) {
          console.error('Error during sync:', syncError);
          // Continue with empty results if sync fails
        }

        // If still no documents found, return empty array
        if (documents.length === 0) {
          console.log('No documents available even after sync attempt');
          return [];
        }
      }

      // Calculate similarities and filter out documents with dimension mismatches
      const similarities = documents
        .map(doc => ({
          document: doc,
          similarity: this.embeddingService.calculateSimilarity(queryEmbedding, doc.embedding)
        }))
        .filter(item => item.similarity > 0); // Filter out dimension mismatches (similarity = 0)

      // Filter by similarity threshold and sort by relevance
      const relevantDocs = similarities
        .filter(item => item.similarity >= similarityThreshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(item => ({
          documentId: item.document.documentId,
          sourceType: item.document.sourceType,
          sourceId: item.document.sourceId,
          title: item.document.title,
          content: item.document.content,
          similarity: item.similarity,
          metadata: item.document.metadata,
          createdAt: item.document.createdAt
        }));

      return relevantDocs;

    } catch (error) {
      console.error('Error retrieving relevant documents:', error);
      throw new Error(`Failed to retrieve documents: ${error.message}`);
    }
  }

  /**
   * Build context for report generation from retrieved documents
   * @param {Array} relevantDocs - Retrieved documents
   * @param {string} reportType - Type of report being generated
   * @returns {string} Formatted context string
   */
  buildReportContext(relevantDocs, reportType = 'executive') {
    if (!relevantDocs || relevantDocs.length === 0) {
      return 'No relevant context found for this report.';
    }

    let context = `\n=== RELEVANT CONTEXT FOR ${reportType.toUpperCase()} REPORT ===\n\n`;

    // Group documents by source type
    const groupedDocs = relevantDocs.reduce((acc, doc) => {
      if (!acc[doc.sourceType]) {
        acc[doc.sourceType] = [];
      }
      acc[doc.sourceType].push(doc);
      return acc;
    }, {});

    // Add context from each source type
    Object.entries(groupedDocs).forEach(([sourceType, docs]) => {
      context += `--- ${sourceType.toUpperCase()} INFORMATION ---\n`;
      
      docs.forEach((doc, index) => {
        context += `\n${index + 1}. ${doc.title} (Relevance: ${(doc.similarity * 100).toFixed(1)}%)\n`;
        context += `${doc.content}\n`;
        context += `Source: ${doc.sourceType} (ID: ${doc.sourceId})\n`;
      });
      
      context += '\n';
    });

    context += `\n=== END CONTEXT ===\n\n`;
    context += `Use this relevant context to generate a more accurate and detailed ${reportType} report. `;
    context += `Focus on the most relevant information and provide specific insights based on the project data.\n\n`;

    return context;
  }

  /**
   * Remove documents from knowledge base
   * @param {string} sourceType - Type of source
   * @param {string} sourceId - ID of source document
   * @param {string} organizationId - Organization ID
   * @returns {Object} Deletion result
   */
  async removeDocument(sourceType, sourceId, organizationId) {
    try {
      const result = await KnowledgeBase.deleteMany({
        sourceType,
        sourceId,
        organizationId
      });

      return {
        success: true,
        deletedCount: result.deletedCount
      };
    } catch (error) {
      console.error('Error removing document:', error);
      throw new Error(`Failed to remove document: ${error.message}`);
    }
  }

  /**
   * Get knowledge base statistics
   * @param {string} organizationId - Organization ID
   * @returns {Object} Statistics
   */
  async getKnowledgeBaseStats(organizationId) {
    try {
      const stats = await KnowledgeBase.aggregate([
        { $match: { organizationId, isActive: true } },
        {
          $group: {
            _id: '$sourceType',
            count: { $sum: 1 },
            avgChunks: { $avg: '$metadata.totalChunks' }
          }
        }
      ]);

      const totalDocuments = await KnowledgeBase.countDocuments({
        organizationId,
        isActive: true
      });

      return {
        totalDocuments,
        bySourceType: stats,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error getting knowledge base stats:', error);
      throw new Error(`Failed to get stats: ${error.message}`);
    }
  }

  /**
   * Clear knowledge base and regenerate embeddings with consistent dimensions
   * @param {string} organizationId - Organization ID
   * @returns {Object} Regeneration result
   */
  async regenerateEmbeddings(organizationId) {
    try {
      console.log(`Regenerating embeddings for organization: ${organizationId}`);
      
      // Clear existing embeddings
      const deleteResult = await KnowledgeBase.deleteMany({ organizationId });
      console.log(`Deleted ${deleteResult.deletedCount} existing embeddings`);
      
      // Trigger fresh sync to regenerate embeddings
      const syncResult = await this.syncService.syncOrganization(organizationId, {
        sourceTypes: ['project', 'task', 'report', 'user_activity', 'team'],
        forceUpdate: true
      });
      
      return {
        success: true,
        deletedCount: deleteResult.deletedCount,
        regeneratedCount: syncResult.totalProcessed,
        syncResult
      };
    } catch (error) {
      console.error('Error regenerating embeddings:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = RAGService;
