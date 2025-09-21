const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const RAGService = require('../services/ragService');
const KnowledgeBaseSyncService = require('../services/knowledgeBaseSyncService');

/**
 * @swagger
 * tags:
 *   name: RAG
 *   description: Retrieval-Augmented Generation API endpoints
 */

/**
 * @swagger
 * /api/rag/search:
 *   post:
 *     summary: Search knowledge base for relevant documents
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: Search query
 *               projectId:
 *                 type: string
 *                 description: Filter by project ID
 *               sourceTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [project, task, report, user_activity, team, comment, attachment]
 *                 description: Types of documents to search
 *               limit:
 *                 type: integer
 *                 default: 10
 *                 description: Maximum number of results
 *               similarityThreshold:
 *                 type: number
 *                 default: 0.7
 *                 description: Minimum similarity score
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/search', protect, async (req, res) => {
  try {
    const { query, projectId, sourceTypes, limit, similarityThreshold } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const ragService = new RAGService();
    const results = await ragService.retrieveRelevantDocuments(query, {
      organizationId: req.user.organizationID,
      projectId,
      sourceTypes: sourceTypes || ['project', 'task', 'report', 'user_activity', 'team'],
      limit: limit || 10,
      similarityThreshold: similarityThreshold || 0.7
    });

    res.json({
      success: true,
      results,
      total: results.length,
      query
    });

  } catch (error) {
    console.error('RAG search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search knowledge base'
    });
  }
});

/**
 * @swagger
 * /api/rag/sync/organization:
 *   post:
 *     summary: Sync organization data to knowledge base
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sourceTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [project, task, report, user_activity, team, comment, attachment]
 *                 description: Types of documents to sync
 *               forceUpdate:
 *                 type: boolean
 *                 default: false
 *                 description: Force update existing documents
 *               projectId:
 *                 type: string
 *                 description: Sync specific project only
 *     responses:
 *       200:
 *         description: Sync completed
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/sync/organization', protect, async (req, res) => {
  try {
    const { sourceTypes, forceUpdate, projectId } = req.body;

    const syncService = new KnowledgeBaseSyncService();
    const results = await syncService.syncOrganization(req.user.organizationID, {
      sourceTypes,
      forceUpdate: forceUpdate || false,
      projectId
    });

    res.json({
      success: true,
      message: 'Organization sync completed',
      results
    });

  } catch (error) {
    console.error('Organization sync error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync organization data'
    });
  }
});

/**
 * @swagger
 * /api/rag/sync/project/{projectId}:
 *   post:
 *     summary: Sync specific project data to knowledge base
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               forceUpdate:
 *                 type: boolean
 *                 default: false
 *                 description: Force update existing documents
 *     responses:
 *       200:
 *         description: Project sync completed
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Project not found
 */
router.post('/sync/project/:projectId', protect, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { forceUpdate } = req.body;

    const syncService = new KnowledgeBaseSyncService();
    const results = await syncService.syncProject(projectId, {
      forceUpdate: forceUpdate || false
    });

    res.json({
      success: true,
      message: 'Project sync completed',
      results
    });

  } catch (error) {
    console.error('Project sync error:', error);
    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to sync project data'
      });
    }
  }
});

/**
 * @swagger
 * /api/rag/sync/status:
 *   get:
 *     summary: Get knowledge base sync status
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sync status
 *       401:
 *         description: Unauthorized
 */
router.get('/sync/status', protect, async (req, res) => {
  try {
    const syncService = new KnowledgeBaseSyncService();
    const status = await syncService.getSyncStatus(req.user.organizationID);

    res.json({
      success: true,
      status
    });

  } catch (error) {
    console.error('Sync status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sync status'
    });
  }
});

/**
 * @swagger
 * /api/rag/remove/project/{projectId}:
 *   delete:
 *     summary: Remove project data from knowledge base
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project data removed
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Project not found
 */
router.delete('/remove/project/:projectId', protect, async (req, res) => {
  try {
    const { projectId } = req.params;

    const syncService = new KnowledgeBaseSyncService();
    const results = await syncService.removeProject(projectId);

    res.json({
      success: true,
      message: 'Project data removed from knowledge base',
      results
    });

  } catch (error) {
    console.error('Project removal error:', error);
    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to remove project data'
      });
    }
  }
});

/**
 * @swagger
 * /api/rag/stats:
 *   get:
 *     summary: Get knowledge base statistics
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Knowledge base statistics
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', protect, async (req, res) => {
  try {
    const ragService = new RAGService();
    const stats = await ragService.getKnowledgeBaseStats(req.user.organizationID);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('RAG stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get knowledge base statistics'
    });
  }
});

/**
 * @swagger
 * /api/rag/regenerate-embeddings/{organizationId}:
 *   post:
 *     summary: Regenerate embeddings for an organization
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Embeddings regenerated successfully
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.post('/regenerate-embeddings/:organizationId', protect, async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { user } = req;

    // Check if user has access to organization and is admin
    if (user.organizationID !== organizationId && !user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to organization'
      });
    }

    if (!user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin privileges required to regenerate embeddings'
      });
    }

    const ragService = new RAGService();
    const result = await ragService.regenerateEmbeddings(organizationId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Embeddings regenerated successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to regenerate embeddings'
      });
    }
  } catch (error) {
    console.error('Error regenerating embeddings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to regenerate embeddings'
    });
  }
});

module.exports = router;