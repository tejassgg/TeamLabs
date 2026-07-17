# 🏗️ TeamLabs - System Architecture

This document describes the architectural layout, stack layers, communication mechanisms, and developer integrations implemented within the TeamLabs platform.

---

## 🗺️ Architectural Overview

TeamLabs is designed as a secure, real-time multi-tenant project management SaaS. It is split into two primary folders: `client` (Frontend Application) and `server` (Backend Services).

```
 ┌──────────────────────────────────────────────┐
 │               Next.js Client                 │
 │       (React 19, Tailwind v4, Contexts)       │
 └──────────────────────────────────────────────┘
           │                        ▲
     HTTP REST APIs            WebSockets
     (JWT + Cookies)          (Socket.IO)
           ▼                        ▼
 ┌──────────────────────────────────────────────┐
 │             Express.js Server                │
 │       (REST Routers, Services, Webhooks)     │
 └──────────────────────────────────────────────┘
           │                        ▲
      Mongoose IO              Stdio Pipe
           ▼                        ▼
 ┌──────────────────────────────────────────────┐
 │                MongoDB Store                 │
 │        (30 Schemas, Vector Indexes)          │
 └──────────────────────────────────────────────┘
                                    ▲
                                    │
                                Tool Calls
                                    │
 ┌──────────────────────────────────────────────┐
 │              Custom MCP Server               │
 │           (server/mcp-server.js)             │
 └──────────────────────────────────────────────┘
```

---

## 💻 Frontend Layer (`client`)

Built on the **React 19.2.7** and **Next.js 16.2.10** frameworks. Key configurations:
*   **Routing Architecture**: Next.js Page-based routing inside [client/pages/](file:///client/pages/).
*   **Dynamic Routes**: Dynamic entity views are managed via parameter routes:
    *   [client/pages/project/[projectId].js](file:///client/pages/project/[projectId].js): Houses full project kanban, analytics charts, and documents list.
    *   [client/pages/task/[taskId].js](file:///client/pages/task/[taskId].js): Manages individual tasks, subtasks list, comments feed, and attachment uploads.
    *   [client/pages/team/[teamId].js](file:///client/pages/team/[teamId].js): Manages team assignments, invite flows, and performance graphs.
*   **State Management**: React Context APIs handle global states:
    *   `AuthContext`: Stores user login profile, organization membership, and premium level.
    *   `SocketContext`: Establishes the real-time Socket.IO browser instance, exposing events handlers.
*   **UI Components**: Divided into domain folders in [client/components/](file:///client/components/) (e.g. `auth`, `dashboard`, `kanban`, `rag`, `reports`, `shared`).

---

## ⚙️ Backend Layer (`server`)

Built as an **Express.js 5.2.1** REST and WebSocket server running on Node.js.
*   **Modular Routing**: [server/app.js](file:///server/app.js) maps API groups to separate routes (e.g. `/api/auth`, `/api/projects`, `/api/task-details`, `/api/rag`, `/api/payment`).
*   **Database Interface**: Interacts with MongoDB using **Mongoose 9.7.3**. Schema models are organized in [server/models/](file:///server/models/).
*   **RAG Syncing**: Interacts with Gemini models via the `@google/genai` client, storing vector data directly into MongoDB.
*   **Keep-Alive Daemon**: Utilizes [keepAliveService.js](file:///server/services/keepAliveService.js) to execute self-ping requests against `SERVER_URL` on startup and every 5 minutes to prevent hosting containers from sleeping.

---

## ⚡ Real-Time WebSocket Layer (`socket.io`)

Real-time collaboration is powered by **Socket.IO (v4.8.3)**. Configured inside [server/socket.js](file:///server/socket.js):
*   **Rooms**: When a user connects, they are automatically placed in room pools:
    *   Organization Room: `org:<organizationID>` for workspace-wide messaging.
    *   Project Room: `project:<projectID>` for kanban board state changes.
*   **Presence Indicators**: An in-memory maps cache (`taskPresence`) stores active tasks view states:
    *   Maintains a map of `taskId -> Map(userId -> { name, action })`.
    *   Allows other team members to see who is viewing or typing updates in real-time.
*   **Event Syncing**: Broadcasts changes instantly (e.g. dragging a task card from *To Do* to *In Progress* prompts updates on all other team screens without manual page refreshes).

---

## 💳 Payments & Webhook Integration (`Stripe`)

The platform integrates Stripe payment checkouts and billing management:
*   **Raw Body Middleware**: The webhook route `/api/payment/webhook` uses raw body parsing to allow signature construct validation:
    ```javascript
    app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), stripeWebhook.handle);
    ```
*   **Stripe Event constructs**: Handles `checkout.session.completed` events inside [stripeWebhook.js](file:///server/webhooks/stripeWebhook.js):
    1. Reconstructs Stripe checkout metadata payload.
    2. Updates `Organization` records to `isPremium: true` and subscription periods.
    3. Runs parallel activation logic (`User.activatePremium`) on all organization members.

---

## 🛠️ Model Context Protocol (MCP) Server

To ease integration with external coding tools and LLMs, TeamLabs contains a built-in stdio-based MCP Server in [server/mcp-server.js](file:///server/mcp-server.js):
*   **Input Handling**: Listens on standard input (`process.stdin`) using Node's `readline` library.
*   **Database Bridge**: Exposes backend tools directly over standard JSON-RPC communications, allowing external LLM agents to query the database, find users, fetch tasks, edit entities, and generate reports.
*   **Entity Resolvers**: Functions like `resolveUser` and `resolveOrganization` allow querying databases by fuzzy inputs (e.g. searching email, username, or name parts).
