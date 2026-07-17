# ⚡ TeamLabs - Performance & API Optimization Plan

This document outlines structural optimizations, network request reductions, and database enhancements to improve scalability, reduce API usage fees, and speed up client loading times in TeamLabs.

---

## 🤖 1. Gemini AI & API Call Reductions

Currently, AI operations perform standard, synchronous API calls. We can optimize these calls:

### A. Batch Embedding Vectorization
*   **Issue**: During data synchronization, the backend loops over document chunks and calls `generateEmbedding` sequentially. For 100 text chunks, this executes 100 individual network round-trips.
*   **Optimization**: The `@google/genai` SDK supports batch inputs in a single HTTP request. We can modify `generateEmbeddings` in [embeddingService.js](file:///server/services/embeddingService.js) to pass an array of strings:
    ```javascript
    // Optimize from individual calls to a single batch payload
    const result = await this.geminiAI.models.embedContent({
      model: this.model,
      contents: ArrayOfTexts, // Array of chunks to vectorize in one call
      config: {
        outputDimensionality: this.outputDimensionality
      }
    });
    return result.embeddings.map(e => e.values);
    ```
*   **Impact**: Reduces network requests during synchronization by **90% - 95%** and respects API rate limits.

### B. Report Caching & Dirty Flags
*   **Issue**: Report generation in [reportGenerationService.js](file:///server/services/reportGenerationService.js) invokes `gemini-3.5-flash` to rebuild project progress reviews. If users request the same report repeatedly, or if cron runs generate weekly/monthly reports, it makes redundant LLM calls.
*   **Optimization**: Implement **Dirty Flag Caching**:
    1. Add a `lastDataModifiedDate` timestamp to the `Project` model.
    2. Whenever a task, user story, comment, or attachment is added/changed, update `lastDataModifiedDate` for the project.
    3. Before calling `generateReport()`, check if there is an existing `GeneratedReport` where `generatedAt > project.lastDataModifiedDate`.
    4. If true, instantly return the cached report instead of calling Gemini.
*   **Impact**: Saves high-token generation fees and reduces report endpoint load times to milliseconds for unchanged projects.

---

## 📚 2. Retrieval-Augmented Generation (RAG) Architecture

The current RAG flow has memory and indexing bottleneck challenges:

### A. Eradicate Javascript-Level Cosine Loops
*   **Issue**: In [ragService.js](file:///server/services/ragService.js#L283-L318), the server fetches *all* active knowledge chunks for an organization into Node memory using `KnowledgeBase.find()` and loops over them to calculate Cosine Similarity. If an organization has 50,000 chunks, this blocks Node's single-threaded event loop and exhausts server memory.
*   **Optimization**:
    *   **Vector Search Engine**: Migrate nearest-neighbor lookups to a dedicated vector database (e.g. Pinecone, Milvus, ChromaDB, or pgvector in PostgreSQL).
    *   **MongoDB Atlas Vector Search**: If using Atlas MongoDB, configure a true `vectorSearch` index and leverage MongoDB's `$vectorSearch` pipeline stage to execute cosine retrieval on the database cluster:
        ```javascript
        const results = await KnowledgeBase.aggregate([
          {
            $vectorSearch: {
              index: "vector_index",
              path: "embedding",
              queryVector: queryEmbedding,
              numCandidates: 100,
              limit: 10
            }
          }
        ]);
        ```
*   **Impact**: Offloads mathematical calculations to database instances, avoiding Node.js memory crashes and reducing search times from seconds to milliseconds.

### B. Fix Incorrect Database Indices
*   **Issue**: In [KnowledgeBase.js](file:///server/models/KnowledgeBase.js#L95), the schema declares:
    ```javascript
    KnowledgeBaseSchema.index({ embedding: '2dsphere' });
    ```
    `2dsphere` indexes are strictly for geographic coordinates (latitude/longitude pairs). Placing a `2dsphere` index on a 768-dimensional float array is incorrect and slows down document creation.
*   **Optimization**: Remove the `2dsphere` index declaration from the schema.
*   **Impact**: Prevents MongoDB indexing errors and accelerates workspace syncing times.

---

## 💻 3. Client-Side Data Fetching & Caching

The frontend fetches REST data inside raw `useEffect` hooks on every page component mount.

### A. Implement React Query (TanStack Query) or SWR [IMPLEMENTED]
*   **Issue**: Navigating between Kanban boards, project details, and messages triggers fresh API calls every time. This increases database query load and causes visual shimmers.
*   **Optimization**:
    *   **Stale-While-Revalidate**: Instant page renders using cached data while checking for changes in the background.
    *   **Automatic Query Deduping**: Grouping multiple components requesting similar project details concurrently into a single aggregated network payload.
    *   **Implementation**: Fully integrated the `swr` package, configured defaults globally inside `_app.js`, and migrated all 7 main data-fetching client pages (`projects.js`, `dashboard.js`, `teams.js`, `my-tasks.js`, `timesheet.js`, `task/[taskId].js`, and `project/[projectId].js`).
*   **Impact**: Reduces total client HTTP request counts by **30% - 50%** and creates a smoother user experience.

### B. Pagination and Field Selection
*   **Issue**: Endpoints querying tasks list and dashboard details return whole datasets and all model fields.
*   **Optimization**:
    *   Enforce cursor or offset pagination (e.g., `limit=50&page=1`) on the tasks routes.
    *   Use projection `.select('firstName lastName email')` in Mongoose queries to exclude heavy data strings like passwords, 2FA keys, or attachment binaries unless explicitly needed.
*   **Impact**: Decreases network response sizes and database lookup latency.

---

## ⚡ 4. Real-Time Socket.IO Synchronization

WebSockets can be used to coordinate data invalidations and save API traffic:

### A. WebSocket-Driven Cache Invalidation
*   **Issue**: When a task is updated in the Kanban board, the backend updates the database. The client must either refresh the whole project view or poll for updates.
*   **Optimization**: Use Socket.IO to broadcast simple invalidation messages:
    *   Instead of sending the entire updated task body or forcing full refetches, the server broadcasts: `socket.to(projectRoom).emit('invalidate:task', { taskId })`.
    *   The receiving clients catch this event and invalidate only that specific task index in their local React Query cache, requesting just that single item from the database.
*   **Impact**: Minimizes update payloads and preserves client data bandwidth.

### B. Typing & Editing Event Throttling
*   **Issue**: Real-time presence indicators broadcast cursor moves and keystrokes instantly, which can flood network buffers when multiple users are active on the same card.
*   **Optimization**: Throttle presence events (e.g., broadcast typing states at most once every **1.5 seconds** per user).
*   **Impact**: Reduces Socket.IO server network traffic and prevents CPU spikes on client browsers.
