# RAG (Retrieval-Augmented Generation) Implementation for TeamLabs

## 🚀 Overview

This document describes the comprehensive RAG implementation for the TeamLabs project management platform. The RAG system enhances AI report generation by retrieving relevant context from your project data, making reports more accurate and contextual.

## 📋 Architecture

### Core Components

1. **Knowledge Base Model** (`server/models/KnowledgeBase.js`)
   - Stores processed documents and their embeddings
   - Supports multiple source types (projects, tasks, reports, etc.)
   - Includes metadata for enhanced search capabilities

2. **Embedding Service** (`server/services/embeddingService.js`)
   - Handles text vectorization using Google's embedding models
   - Implements text chunking for optimal processing
   - Provides similarity calculation and keyword extraction

3. **RAG Service** (`server/services/ragService.js`)
   - Core RAG functionality for document processing and retrieval
   - Builds contextual prompts for enhanced report generation
   - Manages knowledge base operations

4. **Knowledge Base Sync Service** (`server/services/knowledgeBaseSyncService.js`)
   - Automatically syncs data sources with the knowledge base
   - Handles batch processing and rate limiting
   - Provides organization and project-level synchronization

5. **RAG API Routes** (`server/routes/ragRoutes.js`)
   - RESTful API endpoints for RAG operations
   - Search, sync, and management functionality
   - Comprehensive Swagger documentation

6. **RAG Management UI** (`client/components/rag/RAGManagement.jsx`)
   - User-friendly interface for knowledge base management
   - Real-time sync status and search capabilities
   - Advanced configuration options

## 🔧 Setup and Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
# Google API Key for embeddings (already configured)
GOOGLE_API_KEY=your_google_api_key
GEMINI_API_KEY=your_gemini_api_key
```

### Database Setup

The RAG system automatically creates the necessary MongoDB collections:
- `knowledgebases` - Stores processed documents and embeddings

### API Endpoints

The RAG system provides the following endpoints:

#### Search Knowledge Base
```
POST /api/rag/search
```

#### Sync Organization Data
```
POST /api/rag/sync/organization
```

#### Sync Project Data
```
POST /api/rag/sync/project/:projectId
```

#### Get Sync Status
```
GET /api/rag/sync/status
```

#### Get Knowledge Base Stats
```
GET /api/rag/stats
```

## 🎯 Key Features

### 1. Automatic Data Indexing

The system automatically processes and indexes:
- **Projects**: Name, description, owner, status, dates
- **Tasks**: Details, assignments, progress, priorities
- **Reports**: Generated AI reports for context
- **User Activities**: Activity logs and interactions
- **Teams**: Team information and structure
- **Comments**: Project and task discussions
- **Attachments**: File metadata and descriptions

### 2. Semantic Search

- **Vector Similarity**: Uses Google's embedding models for semantic search
- **Contextual Retrieval**: Finds relevant documents based on meaning, not just keywords
- **Relevance Scoring**: Ranks results by similarity scores
- **Multi-source Search**: Searches across all indexed data types

### 3. Enhanced Report Generation

- **Contextual Prompts**: Retrieves relevant information for each report
- **Dynamic Queries**: Builds search queries based on report type and options
- **Relevant Context**: Includes the most pertinent information in reports
- **Improved Accuracy**: More accurate and detailed reports

### 4. Real-time Synchronization

- **Automatic Updates**: Keeps knowledge base current with project data
- **Batch Processing**: Efficient processing of large datasets
- **Rate Limiting**: Respects API limits and prevents overload
- **Error Handling**: Robust error handling and recovery

## 📊 Usage Examples

### 1. Initial Setup

```javascript
// Sync organization data to knowledge base
const response = await fetch('/api/rag/sync/organization', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    sourceTypes: ['project', 'task', 'report', 'team'],
    forceUpdate: false
  })
});
```

### 2. Search Knowledge Base

```javascript
// Search for relevant information
const response = await fetch('/api/rag/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    query: "project timeline and team performance",
    sourceTypes: ['project', 'task', 'report'],
    limit: 10,
    similarityThreshold: 0.7
  })
});
```

### 3. Enhanced Report Generation

The RAG system automatically enhances report generation by:
1. Building contextual queries based on report type and options
2. Retrieving relevant documents from the knowledge base
3. Including retrieved context in the LLM prompt
4. Generating more accurate and detailed reports

## 🔍 Technical Details

### Embedding Model

- **Model**: Google's `text-embedding-004`
- **Dimensions**: 768-dimensional vectors
- **Language Support**: Multiple languages
- **Performance**: Optimized for speed and accuracy

### Text Processing

- **Chunking**: Intelligent text chunking with overlap
- **Keywords**: Automatic keyword extraction
- **Categorization**: Content categorization for better organization
- **Metadata**: Rich metadata for enhanced search

### Search Algorithm

- **Vector Similarity**: Cosine similarity for document matching
- **Threshold Filtering**: Configurable similarity thresholds
- **Ranking**: Results ranked by relevance scores
- **Context Building**: Intelligent context assembly

## 📈 Performance Considerations

### Optimization Features

1. **Batch Processing**: Processes documents in batches to avoid rate limits
2. **Caching**: Efficient caching of embeddings and results
3. **Indexing**: Optimized database indexes for fast queries
4. **Rate Limiting**: Built-in rate limiting for API calls

### Scalability

- **Horizontal Scaling**: Can scale across multiple servers
- **Database Optimization**: Efficient MongoDB queries and indexes
- **Memory Management**: Optimized memory usage for large datasets
- **Async Processing**: Non-blocking operations for better performance

## 🛠️ Maintenance and Monitoring

### Monitoring

- **Sync Status**: Real-time sync status and statistics
- **Performance Metrics**: Search performance and accuracy metrics
- **Error Tracking**: Comprehensive error logging and tracking
- **Usage Analytics**: Knowledge base usage and search analytics

### Maintenance Tasks

1. **Regular Syncs**: Schedule regular knowledge base updates
2. **Data Cleanup**: Remove outdated or irrelevant documents
3. **Performance Tuning**: Optimize search parameters and thresholds
4. **Error Monitoring**: Monitor and resolve sync errors

## 🔒 Security and Privacy

### Data Protection

- **Access Control**: Role-based access to knowledge base features
- **Data Isolation**: Organization-level data isolation
- **Encryption**: Secure handling of sensitive data
- **Audit Logging**: Comprehensive audit trails

### Privacy Considerations

- **Data Minimization**: Only necessary data is indexed
- **User Consent**: Clear consent for data processing
- **Data Retention**: Configurable data retention policies
- **Compliance**: GDPR and other privacy regulation compliance

## 🚀 Future Enhancements

### Planned Features

1. **Advanced Analytics**: Deeper insights into knowledge base usage
2. **Machine Learning**: Improved relevance and ranking algorithms
3. **Multi-language Support**: Enhanced multi-language capabilities
4. **Integration APIs**: Third-party system integrations
5. **Real-time Updates**: Live updates as data changes
6. **Custom Models**: Support for custom embedding models

### Performance Improvements

1. **Vector Database**: Dedicated vector database integration
2. **Caching Layer**: Advanced caching strategies
3. **Load Balancing**: Distributed processing capabilities
4. **Query Optimization**: Advanced query optimization techniques

## 📚 API Documentation

Complete API documentation is available via Swagger at:
```
http://localhost:5000/api-docs
```

## 🧪 Testing

Run the RAG system test:

```bash
cd server
node scripts/testRAG.js
```

## 🤝 Support

For questions or issues with the RAG implementation:

1. Check the API documentation
2. Review the test script for examples
3. Monitor the sync status and logs
4. Contact the development team

## 📝 Changelog

### Version 1.0.0
- Initial RAG implementation
- Knowledge base model and services
- API endpoints and management UI
- Integration with report generation
- Comprehensive documentation

---

**Note**: This RAG implementation significantly enhances the AI report generation capabilities of TeamLabs by providing contextual, relevant information from your project data. The system is designed to be scalable, maintainable, and user-friendly.
