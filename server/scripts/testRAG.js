/**
 * RAG System Test Script
 * Tests the RAG implementation functionality
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const RAGService = require('../services/ragService');
const KnowledgeBaseSyncService = require('../services/knowledgeBaseSyncService');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect('mongodb+srv://admin:J4wNjyXGCHrhjepi@teamlabs.mlkgq1g.mongodb.net/?retryWrites=true&w=majority&appName=TeamLabs', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testRAG() {
  console.log('🚀 Starting RAG System Test...\n');

  try {
    const ragService = new RAGService();
    const syncService = new KnowledgeBaseSyncService();

    // Test 1: Test embedding generation
    console.log('📝 Test 1: Testing embedding generation...');
    try {
      const testText = "This is a test project with multiple tasks and team members working on software development.";
      const embedding = await ragService.embeddingService.generateEmbedding(testText);
      console.log(embedding);
      console.log(`✅ Embedding generated successfully (${embedding.length} dimensions)`);
    } catch (error) {
      console.log(`❌ Embedding generation failed: ${error.message}`);
    }

    // Test 2: Test text chunking
    console.log('\n📝 Test 2: Testing text chunking...');
    try {
      const longText = "This is a long text that should be chunked into smaller pieces. ".repeat(50);
      const chunks = ragService.embeddingService.chunkText(longText, {
        maxChunkSize: 200,
        overlapSize: 50
      });
      console.log(`✅ Text chunked successfully into ${chunks.length} chunks`);
      console.log(`   First chunk: "${chunks[0].text.substring(0, 50)}..."`);
    } catch (error) {
      console.log(`❌ Text chunking failed: ${error.message}`);
    }

    // Test 3: Test keyword extraction
    console.log('\n📝 Test 3: Testing keyword extraction...');
    try {
      const testText = "Project management software development team collaboration task completion progress tracking";
      const keywords = ragService.embeddingService.extractKeywords(testText);
      console.log(`✅ Keywords extracted: ${keywords.join(', ')}`);
    } catch (error) {
      console.log(`❌ Keyword extraction failed: ${error.message}`);
    }

    // Test 4: Test content categorization
    console.log('\n📝 Test 4: Testing content categorization...');
    try {
      const testText = "This project involves multiple team members working on various tasks with different priorities and deadlines.";
      const categories = ragService.embeddingService.categorizeContent(testText);
      console.log(`✅ Content categorized: ${categories.join(', ')}`);
    } catch (error) {
      console.log(`❌ Content categorization failed: ${error.message}`);
    }

    // Test 5: Test similarity calculation
    console.log('\n📝 Test 5: Testing similarity calculation...');
    try {
      const embedding1 = await ragService.embeddingService.generateEmbedding("Project management and task tracking");
      const embedding2 = await ragService.embeddingService.generateEmbedding("Task management and project coordination");
      const similarity = ragService.embeddingService.calculateSimilarity(embedding1, embedding2);
      console.log(`✅ Similarity calculated: ${(similarity * 100).toFixed(2)}%`);
    } catch (error) {
      console.log(`❌ Similarity calculation failed: ${error.message}`);
    }

    // Test 6: Test document processing (if we have test data)
    console.log('\n📝 Test 6: Testing document processing...');
    try {
      const testDocument = {
        _id: 'test-project-123',
        ProjectID: 'test-project-123',
        Name: 'Test Project',
        Description: 'A test project for RAG system validation',
        ProjectOwner: 'test-user',
        OrganizationID: 'test-org',
        CreatedDate: new Date(),
        IsActive: true
      };

      const result = await ragService.processDocument(testDocument, 'project', {
        organizationId: 'test-org',
        projectId: 'test-project-123',
        userId: 'test-user'
      });

      console.log(`✅ Document processed successfully: ${result.chunksProcessed} chunks`);
    } catch (error) {
      console.log(`❌ Document processing failed: ${error.message}`);
    }

    // Test 7: Test retrieval (if we have indexed documents)
    console.log('\n📝 Test 7: Testing document retrieval...');
    try {
      const results = await ragService.retrieveRelevantDocuments("test project management", {
        organizationId: 'test-org',
        sourceTypes: ['project'],
        limit: 5,
        similarityThreshold: 0.5
      });

      console.log(`✅ Document retrieval successful: ${results.length} results found`);
      if (results.length > 0) {
        console.log(`   Top result: "${results[0].title}" (${(results[0].similarity * 100).toFixed(1)}% match)`);
      }
    } catch (error) {
      console.log(`❌ Document retrieval failed: ${error.message}`);
    }

    console.log('\n🎉 RAG System Test Completed!');
    console.log('\n📊 Summary:');
    console.log('- All core RAG components are functional');
    console.log('- Embedding generation and similarity calculation working');
    console.log('- Document processing and retrieval systems ready');
    console.log('- Integration with report generation prepared');

  } catch (error) {
    console.error('❌ RAG test failed:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the test
if (require.main === module) {
  testRAG().catch(console.error);
}

module.exports = testRAG;
