const { GoogleGenAI } = require('@google/genai');

/**
 * Embedding Service
 * Handles text vectorization using Gemini's embedding models
 */
class EmbeddingService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key is required for embedding service');
    }

    this.geminiAI = new GoogleGenAI({});
    this.model = 'text-embedding-004'; // Gemini's latest embedding model
    this.maxChunkSize = 1000; // Maximum characters per chunk
    this.overlapSize = 100; // Overlap between chunks for context preservation
  }

  /**
   * Generate embedding for a text
   * @param {string} text - Text to embed
   * @returns {Array<number>} Embedding vector
   */
  async generateEmbedding(text) {
    try {
      if (!text || text.trim().length === 0) {
        throw new Error('Text cannot be empty');
      }
      const result = await this.geminiAI.models.embedContent({
        model: this.model,
        contents: text
      });
      return result.embeddings[0].values;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Chunk text into smaller pieces for embedding
   * @param {string} text - Text to chunk
   * @param {Object} options - Chunking options
   * @returns {Array<Object>} Array of text chunks with metadata
   */
  chunkText(text, options = {}) {
    const {
      maxChunkSize = this.maxChunkSize,
      overlapSize = this.overlapSize,
      preserveSentences = true
    } = options;

    if (!text || text.length <= maxChunkSize) {
      return [{
        text: text,
        chunkIndex: 0,
        startIndex: 0,
        endIndex: text.length,
        metadata: {
          isComplete: true,
          wordCount: text.split(/\s+/).length
        }
      }];
    }

    const chunks = [];
    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < text.length) {
      let endIndex = Math.min(startIndex + maxChunkSize, text.length);

      // If preserving sentences, try to end at sentence boundary
      if (preserveSentences && endIndex < text.length) {
        const lastSentenceEnd = text.lastIndexOf('.', endIndex);
        const lastExclamationEnd = text.lastIndexOf('!', endIndex);
        const lastQuestionEnd = text.lastIndexOf('?', endIndex);

        const lastPunctuation = Math.max(lastSentenceEnd, lastExclamationEnd, lastQuestionEnd);

        if (lastPunctuation > startIndex + maxChunkSize * 0.5) {
          endIndex = lastPunctuation + 1;
        }
      }

      const chunkText = text.slice(startIndex, endIndex).trim();

      if (chunkText.length > 0) {
        chunks.push({
          text: chunkText,
          chunkIndex: chunkIndex,
          startIndex: startIndex,
          endIndex: endIndex,
          metadata: {
            isComplete: endIndex >= text.length,
            wordCount: chunkText.split(/\s+/).length,
            hasOverlap: chunkIndex > 0
          }
        });
      }

      // Move start index with overlap
      startIndex = Math.max(endIndex - overlapSize, startIndex + 1);
      chunkIndex++;
    }

    return chunks;
  }

  /**
   * Generate embeddings for multiple texts
   * @param {Array<string>} texts - Array of texts to embed
   * @returns {Array<Array<number>>} Array of embedding vectors
   */
  async generateEmbeddings(texts) {
    try {
      const embeddings = [];

      // Process in batches to avoid rate limits
      const batchSize = 5;
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchPromises = batch.map(text => this.generateEmbedding(text));

        const batchEmbeddings = await Promise.all(batchPromises);
        embeddings.push(...batchEmbeddings);

        // Small delay between batches
        if (i + batchSize < texts.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return embeddings;
    } catch (error) {
      console.error('Error generating embeddings batch:', error);
      throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   * @param {Array<number>} embedding1 - First embedding vector
   * @param {Array<number>} embedding2 - Second embedding vector
   * @returns {number} Cosine similarity score (-1 to 1)
   */
  calculateSimilarity(embedding1, embedding2) {
    if (!embedding1 || !embedding2) {
      return 0;
    }

    // if (embedding1.length !== embedding2.length) {
    //   console.warn(`Embedding dimension mismatch: ${embedding1.length} vs ${embedding2.length}. Using 0 similarity.`);
    // }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    try {
      for (let i = 0; i < embedding2.length; i++) {
        dotProduct += embedding1[i] * embedding2[i];
        norm1 += embedding1[i] * embedding1[i];
        norm2 += embedding2[i] * embedding2[i];
      }
    } catch (error) {
      console.error('Error calculating similarity:', error);
      return 0;
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (norm1 * norm2);
  }

  /**
   * Extract keywords from text for better indexing
   * @param {string} text - Text to extract keywords from
   * @returns {Array<string>} Array of keywords
   */
  extractKeywords(text) {
    // Simple keyword extraction - can be enhanced with NLP libraries
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
    ]);

    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));

    // Count word frequency
    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // Return top keywords
    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Categorize content based on text analysis
   * @param {string} text - Text to categorize
   * @returns {Array<string>} Array of categories
   */
  categorizeContent(text) {
    const categories = [];
    const lowerText = text.toLowerCase();

    // Define category keywords
    const categoryKeywords = {
      'project_management': ['project', 'planning', 'milestone', 'deadline', 'scope', 'budget'],
      'task_management': ['task', 'assignment', 'completion', 'progress', 'status', 'priority'],
      'team_collaboration': ['team', 'collaboration', 'meeting', 'communication', 'discussion'],
      'performance': ['performance', 'productivity', 'efficiency', 'metrics', 'kpi', 'results'],
      'risk_assessment': ['risk', 'issue', 'problem', 'challenge', 'mitigation', 'concern'],
      'timeline': ['schedule', 'timeline', 'duration', 'deadline', 'delivery', 'timeline'],
      'resource_allocation': ['resource', 'allocation', 'capacity', 'utilization', 'workload']
    };

    // Check for category matches
    Object.entries(categoryKeywords).forEach(([category, keywords]) => {
      const matchCount = keywords.filter(keyword => lowerText.includes(keyword)).length;
      if (matchCount >= 2) { // Require at least 2 keyword matches
        categories.push(category);
      }
    });

    return categories;
  }
}

module.exports = EmbeddingService;
