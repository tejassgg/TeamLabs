# Phase wise plan for websocket implementation
_Exported on 8/19/2025 at 19:41:58 PDT from Cursor (1.4.5)_

---

**User**

generate a PRD to Implement websocket for the entire applicaton step by step, firstly starting with the Organization  Members table in the /dashboard page, dashbopard graphs, then Kanban board, then task details page, then prioject details page & very last the messaging page.
Make a phase wise plan for the all the pages in the above order

---

**Cursor**

I’ll present this as structured prose with minimal bullets and only essential code blocks, per your report style preference [[memory:6405911]].

## PRD: Real‑Time WebSocket Enablement (Phased Rollout)

### 1. Overview and Objectives
The goal is to introduce reliable, secure, and scalable real‑time updates across the application using WebSockets, implemented progressively to reduce risk and simplify validation. The phases proceed in this order: Organization Members on the dashboard, dashboard graphs, Kanban board, task details page, project details page, and finally the messaging page. Each phase adds specific real‑time events, rooms, and UI behaviors, while sharing a common socket foundation.

### 2. Scope
In scope is the addition of a client WebSocket SDK, a server WebSocket gateway integrated with existing Express/Mongoose flows, standard event contracts, room models (organization, project, task, user), security and auth at the transport layer, observability, backpressure handling, and a phased rollout plan. Not in scope are deep refactors of existing data models, new analytics schemas unrelated to real‑time functionality, or changing current REST endpoints beyond adding event emissions.

### 3. Assumptions and Dependencies
Authentication already exists via JWT and is available to the client. The server runs Node/Express and uses Mongoose with MongoDB; horizontal scaling may be pursued, in which case a Redis adapter will be used for socket pub/sub. The UI is Next.js; pages to update include `client/pages/dashboard.js`, `client/components/DashboardCharts.jsx`, `client/pages/kanban.js`, `client/pages/task/[taskId].js`, `client/pages/project/[projectId].js`, and `client/pages/messages.js`. Messaging is presently REST‑based and will be migrated to real‑time last.

### 4. Architecture Baseline
A Socket.IO server endpoint is added to the Node app. The handshake uses a short‑lived JWT, validated using existing `auth.js` logic adapted for socket handshake contexts. Clients join rooms representing their organization, active project, active task, and user (for direct events like presence and device‑specific signals). The event model uses a single namespace, with versioned event names and consistent payload contracts. An optional Redis adapter is added for scale. Observability is implemented through structured logs, metrics on connection counts, room sizes, event rates, and latency.

### 5. Security, Reliability, and Performance
All connections require an auth token in the handshake, verified and mapped to a userId and organizationId. Authorization checks are applied to room joins and event handling. Rate limits and server‑side backpressure are applied to chat and high‑frequency events; dashboard graph updates may leverage server‑side throttling/batching to keep UI smooth while ensuring timeliness. Reconnect logic uses Socket.IO’s built‑in exponential backoff; the client SDK provides an offline queue for idempotent outbounds when needed, and a silent fallback to REST polling for critical data where appropriate. Event versioning is enforced with `meta.version` and `meta.emittedAt` to enable safe future changes.

### 6. Client SDK and Integration Contracts
A small client SDK is added (e.g., `client/services/socket.js`) that:
1) Handles connect, auth, reconnect, room join/leave, and typed subscriptions.
2) Exposes dedicated subscribe/unsubscribe APIs per domain (organization, project, task, chat).
3) Implements a debounced store update layer to prevent UI thrash.
4) Normalizes event payloads and version checks.

Common event envelope:
```json
{
  "event": "org.member.updated",
  "version": 1,
  "data": { /* domain-specific payload */ },
  "meta": {
    "emittedAt": "2025-08-20T12:34:56.789Z",
    "producer": "server",
    "traceId": "uuid"
  }
}
```

### 7. Server Integration Pattern
For each REST mutation in controllers (create/update/delete), after a successful DB write the server emits the appropriate event to the relevant room(s). For derived updates (e.g., dashboard KPIs), server timers or DB change streams can trigger periodic recalculation and emissions; initially, derive changes aligned to existing write paths to keep complexity low. Authorization is validated for room joins, and event emission uses rooms aligned to organization, project, task, and user.

### 8. Observability and Rollout
Metrics collected include active connections per org, per room size, events per second, and event latency. Logs include connection lifecycle, room joins, and event emissions with trace IDs. Feature flags are used to enable real‑time per phase and per cohort. Rollouts proceed org‑by‑org in each phase, with alerting thresholds and automatic feature flag rollback if SLA is exceeded.

---

## Phase 1: Organization Members on /dashboard
Purpose. Keep the Organization Members table current with presence and role/profile updates without manual refresh.

Rooms. Clients join `org:{organizationId}`. The server authorizes based on membership.

Events (listen).
- org.member.joined
- org.member.updated
- org.member.left
- org.member.presence
- org.member.removed

Sample payloads:
```json
{
  "event": "org.member.updated",
  "version": 1,
  "data": {
    "organizationId": "org_123",
    "member": {
      "userId": "u_1",
      "name": "Jane",
      "role": "Admin",
      "avatarUrl": "/public/static/default-avatar.png",
      "status": "active"
    }
  },
  "meta": { "emittedAt": "..." }
}
```
```json
{
  "event": "org.member.presence",
  "version": 1,
  "data": {
    "organizationId": "org_123",
    "userId": "u_1",
    "online": true,
    "lastActiveAt": "..."
  },
  "meta": { "emittedAt": "..." }
}
```

UI behavior. The table re-renders minimally, updating changed rows and presence indicators. Sorting and filters remain intact. If the user lacks permission for a received update, the client discards it.

Acceptance. Presence changes reflect in under two seconds, role/profile edits appear in under five seconds, no unnecessary re-fetches, and offline users reconnect without data loss. Logging shows joined/left events with correct room membership.

---

## Phase 2: Dashboard Graphs
Purpose. Keep dashboard KPIs and charts current based on organization activity (projects, tasks, messages, payments as applicable).

Rooms. Same `org:{organizationId}`.

Events (listen).
- dashboard.metrics.updated (e.g., counts, trends)
- dashboard.activity.created (optional lightweight feed events)

Payload example:
```json
{
  "event": "dashboard.metrics.updated",
  "version": 1,
  "data": {
    "organizationId": "org_123",
    "metrics": {
      "openTasks": 42,
      "completedTasks": 128,
      "activeProjects": 7,
      "burndownSeries": [{"t": "2025-08-20", "v": 12}]
    }
  }
}
```

Server strategy. Emit metrics updates after underlying mutations that affect counts; if necessary, throttle emissions to at most once per second per org. For heavier graphs, emit deltas rather than full series.

UI behavior. `client/components/DashboardCharts.jsx` consumes updates and refreshes series with animated transitions. If a version mismatch is detected, the client triggers a one-time REST refresh.

Acceptance. Visualizations update smoothly without flicker, emissions are throttled appropriately, and metrics remain consistent with database queries.

---

## Phase 3: Kanban Board
Purpose. Live collaboration on `client/pages/kanban.js`: task creation, inline edits, lane moves, and deletions.

Rooms. Clients join `project:{projectId}` when viewing a board; optionally also `org:{organizationId}` for high-level aggregation.

Events (listen and emit).
- kanban.task.created
- kanban.task.updated
- kanban.task.moved (lane or position change)
- kanban.task.deleted
- kanban.typing (optional, lightweight)
- kanban.lock (optional optimistic lock hints)

Payload examples:
```json
{
  "event": "kanban.task.moved",
  "version": 1,
  "data": {
    "projectId": "p_1",
    "taskId": "t_99",
    "fromColumn": "In Progress",
    "toColumn": "Review",
    "position": 3,
    "movedBy": "u_1"
  }
}
```
```json
{
  "event": "kanban.task.updated",
  "version": 1,
  "data": {
    "projectId": "p_1",
    "taskId": "t_99",
    "changes": { "title": "Fix auth", "priority": "High" },
    "updatedBy": "u_1"
  }
}
```

Conflict handling. Use last‑write‑wins with patch diffs and UI conflict toasts when the same field changes within a short window; optionally add light “focus” or “editing” indicators.

Acceptance. Moves and edits appear to all viewers within two seconds, column counts remain correct, and drag‑drop latency stays within 100ms locally. Undo/redo still functions with server‑ack knowledge.

---

## Phase 4: Task Details Page
Purpose. Real‑time updates for a single task: title/description edits, status/priority, subtasks, attachments, and comments.

Rooms. Users join `task:{taskId}` while on the page, and also remain in `project:{projectId}` for cross‑page coherence.

Events.
- task.updated (fields and metadata)
- task.subtask.created/updated/deleted
- task.comment.created/updated/deleted
- task.attachment.added/removed
- task.typing (optional)
- task.activity.created (optional audit line items)

Payload examples:
```json
{
  "event": "task.comment.created",
  "version": 1,
  "data": {
    "taskId": "t_99",
    "comment": {
      "commentId": "c_1",
      "authorId": "u_2",
      "text": "Pushed a fix",
      "createdAt": "..."
    }
  }
}
```
```json
{
  "event": "task.updated",
  "version": 1,
  "data": {
    "taskId": "t_99",
    "changes": { "status": "In Review", "assigneeId": "u_3" },
    "updatedBy": "u_1"
  }
}
```

Acceptance. Comments and subtasks appear instantly to all viewers. Attachment progress indicators (client‑side) reconcile with server confirmation via an event, handling failure gracefully with a retry CTAs.

---

## Phase 5: Project Details Page
Purpose. Real‑time project metadata and aggregates: description, members, status, timeline, and counters.

Rooms. `project:{projectId}`.

Events.
- project.updated (metadata/fields)
- project.member.added/removed
- project.files.updated (if applicable)
- project.metrics.updated (task counts, completion percentage)

Payload example:
```json
{
  "event": "project.member.added",
  "version": 1,
  "data": {
    "projectId": "p_1",
    "member": { "userId": "u_9", "role": "Contributor" }
  }
}
```

Acceptance. Member changes and metadata propagate in under five seconds; counters stay consistent with Kanban counts.

---

## Phase 6: Messaging Page (Final)
Purpose. Convert `client/pages/messages.js` to true real‑time chat with delivery and read receipts, typing indicators, and presence.

Rooms. Conversations map to rooms `chat:{conversationId}`; users also join `user:{userId}` for direct notifications. Presence is tied to `org:{organizationId}` when appropriate.

Events (listen and emit).
- chat.message.created (server acknowledges with messageId, sentAt)
- chat.message.delivered (per recipient)
- chat.message.read (read receipts)
- chat.typing
- chat.presence (optional specialized presence)

Payload examples:
```json
{
  "event": "chat.message.created",
  "version": 1,
  "data": {
    "conversationId": "conv_7",
    "message": {
      "messageId": "m_123",
      "authorId": "u_1",
      "text": "Hello!",
      "sentAt": "..."
    }
  }
}
```
```json
{
  "event": "chat.message.read",
  "version": 1,
  "data": {
    "conversationId": "conv_7",
    "messageId": "m_123",
    "readerId": "u_2",
    "readAt": "..."
  }
}
```

Delivery semantics. Client sends optimistic message with a temporary ID; the server returns the authoritative ID via the created event, allowing the client to reconcile. Delivery and read receipts are per recipient and deduplicated by messageId and readerId. Offline clients receive backfilled receipts on reconnect.

Acceptance. End‑to‑end from send to visible on recipient is under one second on LAN and three seconds on WAN. Receipts converge correctly with no ghost unread counts. The REST fallback remains available behind a feature flag.

---

## Cross‑Phase Technical Details

Event naming and versioning. Use a flat dot‑notation with `version` at the envelope level; additive changes bump minor version, breaking changes bump major and require client gating. All payloads include IDs, actor IDs, and timestamps. Use ISO timestamps.

Authorization. Room joins validate the user’s authorization for the entity. Events containing restricted fields are filtered by the server before emission.

Error handling. The client SDK emits a global error event for UI toasts, and quietly retries transient errors. The server applies per‑IP and per‑org rate limits for chat and typing to prevent abuse.

Scaling. If multiple Node instances are used, a Redis adapter is configured to broadcast across instances; trace IDs propagate in the event envelope to correlate logs.

Testing. Unit test the SDK, controller emission paths, and room join auth. Add integration tests for connect‑join‑emit‑receive flows. For the Kanban page and chat, add synthetic load tests to validate UI performance under event bursts.

Telemetry. Track connection counts by org, average events per user per minute, client‑observed latency (emittedAt to receivedAt), and error rates. Add dashboards and alerts for connection failures and spikes in event drops.

Rollout. Each phase ships behind a feature flag default‑off. Enable for internal QA, then a few orgs, then progressively to 100%. Prepare a rollback plan that reverts the flag and disables emissions for the phase.

---

## Implementation Milestones and Estimates

Phase 1 (Org Members). SDK baseline, server handshake, org room, five events, presence ping/timeout. Estimate: 3–5 days including QA.

Phase 2 (Dashboard Graphs). Metrics emission with throttling, client chart updates, fallback refresh. Estimate: 2–4 days including QA.

Phase 3 (Kanban). Project room, task CRUD/move events, conflict handling, UI reconciliation. Estimate: 5–8 days including QA and load test.

Phase 4 (Task Details). Task/subtask/comment/attachment events, attachment reconciliation. Estimate: 4–6 days including QA.

Phase 5 (Project Details). Project metadata and member events, counters cohere with Kanban. Estimate: 3–4 days including QA.

Phase 6 (Messaging). Conversation rooms, message lifecycle, receipts, typing, offline reconciliation, migration plan. Estimate: 7–10 days including QA and soak.

These estimates assume a single engineer familiar with the codebase and access to staging. Parallel work is possible once the SDK and server gateway are stable.

---

## Acceptance Criteria Summary (Per Phase)

Phase 1. Members table updates role/profile/presence in near real‑time with correct auth and no page reloads.

Phase 2. Graphs and KPIs reflect server‑side changes smoothly with throttled updates and correct values.

Phase 3. Kanban reflects task create/update/move/delete to all viewers with low latency and correct column counts.

Phase 4. Task details reflect comments/subtasks/attachments and field changes live, handling conflicts sensibly.

Phase 5. Project details reflect metadata, members, and counters consistently with other pages.

Phase 6. Messaging supports real‑time send, delivery, read receipts, typing, and presence with reliable reconciliation.

---

## Cutover and Migration Notes
Introduce the real‑time code behind flags; keep existing REST flows in place. When a phase’s flag is on, the client relies on socket updates while still performing periodic background verification fetches during the soak period. After stability is proven, reduce or remove polling to minimize server load. Document the event contracts and keep them stable.

Brief summary: I laid out a phased PRD for introducing WebSockets starting with the Organization Members table on `dashboard`, then dashboard graphs, Kanban, task details, project details, and finally messaging. It defines rooms, events, payloads, client/server architecture, security, observability, rollout, and crisp acceptance criteria for each phase.

```json
{
  "event": "org.member.updated",
  "version": 1,
  "data": { /* domain-specific payload */ },
  "meta": {
    "emittedAt": "2025-08-20T12:34:56.789Z",
    "producer": "server",
    "traceId": "uuid"
  }
}
```

```json
{
  "event": "org.member.updated",
  "version": 1,
  "data": {
    "organizationId": "org_123",
    "member": {
      "userId": "u_1",
      "name": "Jane",
      "role": "Admin",
      "avatarUrl": "/public/static/default-avatar.png",
      "status": "active"
    }
  },
  "meta": { "emittedAt": "..." }
}
```

```json
{
  "event": "org.member.presence",
  "version": 1,
  "data": {
    "organizationId": "org_123",
    "userId": "u_1",
    "online": true,
    "lastActiveAt": "..."
  },
  "meta": { "emittedAt": "..." }
}
```

```json
{
  "event": "dashboard.metrics.updated",
  "version": 1,
  "data": {
    "organizationId": "org_123",
    "metrics": {
      "openTasks": 42,
      "completedTasks": 128,
      "activeProjects": 7,
      "burndownSeries": [{"t": "2025-08-20", "v": 12}]
    }
  }
}
```

```json
{
  "event": "kanban.task.moved",
  "version": 1,
  "data": {
    "projectId": "p_1",
    "taskId": "t_99",
    "fromColumn": "In Progress",
    "toColumn": "Review",
    "position": 3,
    "movedBy": "u_1"
  }
}
```

```json
{
  "event": "kanban.task.updated",
  "version": 1,
  "data": {
    "projectId": "p_1",
    "taskId": "t_99",
    "changes": { "title": "Fix auth", "priority": "High" },
    "updatedBy": "u_1"
  }
}
```

```json
{
  "event": "task.comment.created",
  "version": 1,
  "data": {
    "taskId": "t_99",
    "comment": {
      "commentId": "c_1",
      "authorId": "u_2",
      "text": "Pushed a fix",
      "createdAt": "..."
    }
  }
}
```

```json
{
  "event": "task.updated",
  "version": 1,
  "data": {
    "taskId": "t_99",
    "changes": { "status": "In Review", "assigneeId": "u_3" },
    "updatedBy": "u_1"
  }
}
```

```json
{
  "event": "project.member.added",
  "version": 1,
  "data": {
    "projectId": "p_1",
    "member": { "userId": "u_9", "role": "Contributor" }
  }
}
```

```json
{
  "event": "chat.message.created",
  "version": 1,
  "data": {
    "conversationId": "conv_7",
    "message": {
      "messageId": "m_123",
      "authorId": "u_1",
      "text": "Hello!",
      "sentAt": "..."
    }
  }
}
```

```json
{
  "event": "chat.message.read",
  "version": 1,
  "data": {
    "conversationId": "conv_7",
    "messageId": "m_123",
    "readerId": "u_2",
    "readAt": "..."
  }
}
```

