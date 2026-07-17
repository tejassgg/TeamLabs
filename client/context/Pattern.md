# 🛠️ TeamLabs - Coding Patterns & Guidelines

This document outlines the coding standards, software engineering patterns, middleware setups, and system extension guides used across the TeamLabs codebase.

---

## 💻 1. Frontend Development Patterns

The React client implements structured state sharing and dynamic parameters:

### React Context Patterns
Context is declared in [client/context/](file:///client/context/) (e.g. `AuthContext.js`, `SocketContext.js`) to provide global resources.
*   **Encapsulated Custom Hooks**: Instead of importing `useContext` directly, developers use custom hook files:
    ```javascript
    import { useAuth } from '../context/AuthContext';
    const { user, login } = useAuth();
    ```

### Loading & Rendering States
*   **Skeleton Skeletons**: Rather than displaying blank spaces, components use pre-defined skeleton cards styled with shimmer keyframe animations (`animate-shimmer`) to improve loading aesthetics.
*   **Condition Render Blocks**: Component returns are split clean:
    ```javascript
    if (loading) return <DashboardSkeleton />;
    if (error) return <ErrorMessage message={error} />;
    return <MainContentData />;
    ```

### Responsive CSS Utilities
Tailwind classes follow mobile-first standards:
*   Small grids `grid-cols-1` scaling up to multi-column blocks on large screens `md:grid-cols-3`.
*   Clickable hover states (`hover:scale-102 hover:shadow-md`) with smooth transition durations (`transition-all duration-300`).

---

## ⚙️ 2. Backend Security & Controller Patterns

The server decouples request routing from business operations:

### Route-Controller Decoupling
Routes defined in [server/routes/](file:///server/routes/) only direct endpoints, delegating full request handling to controller methods:
*   **Route Setup**:
    ```javascript
    router.post('/downgrade/:organizationID', protect, downgradeSubscription);
    ```
*   **Controller Function**: Returns standard JSON API payloads with HTTP status codes (200 for OK, 400 for input errors, 401 for auth errors, 500 for runtime exceptions).

### Security Middlewares
*   **Authentication Middleware ([protect](file:///server/middleware/auth.js))**:
    1. Looks up the cookie container `req.cookies.token`.
    2. Validates signatures using `jwt.verify()`.
    3. Fetches user data via `User.findById().select('-password')`.
    4. Attaches credentials to `req.user` or clears invalid cookies.
*   **NoSQL Query Injection Prevention**: Enforced globally inside `app.js` using `express-mongo-sanitize`. Strips character sequences containing operator markers like `$` or `.` from client inputs.

---

## ⚡ 3. Real-Time Socket Connection Handlers

WebSocket sync flows inside [server/socket.js](file:///server/socket.js):
*   **Authentication Handshake**: Socket connections verify JWT auth parameters sent in query parameters or session headers, rejecting unauthorized connections before establishing pings.
*   **Room Subscription**: Sockets join room bounds matching their tenant context:
    ```javascript
    socket.join(`org:${user.organizationID}`);
    ```
*   **Connection Lifecycle Map**: User identifiers are stored in map indices alongside action types (e.g. `editing`). Disconnections immediately trigger trash cleanups to prevent memory leak accumulation.

---

## 🚀 4. Step-by-Step Code Extension Guide

Follow this guide to add new features or models to the TeamLabs codebase:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Mongoose    │────>│  Backend     │────>│  API Router  │────>│ Nextjs View  │
│  Schema Mod  │     │  Controller  │     │  (auth/app)  │     │ (page/hooks) │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

### Step 1: Define the Database Model
Create a new file in [server/models/](file:///server/models/) (e.g. `FeatureX.js`):
```javascript
const mongoose = require('mongoose');
const featureXSchema = new mongoose.Schema({
  name: { type: String, required: true },
  organizationID: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
module.exports = mongoose.model('FeatureX', featureXSchema);
```

### Step 2: Implement the Controller Logic
Create a controller module in [server/controllers/](file:///server/controllers/) handling operations:
```javascript
const FeatureX = require('../models/FeatureX');
exports.createFeatureX = async (req, res) => {
  try {
    const item = new FeatureX({ ...req.body, createdBy: req.user._id });
    await item.save();
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
```

### Step 3: Register Web Endpoints & Routes
Create endpoint maps in [server/routes/](file:///server/routes/) and link them inside [server/app.js](file:///server/app.js):
```javascript
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createFeatureX } = require('../controllers/featureXController');

router.post('/', protect, createFeatureX);
module.exports = router;
```

### Step 4: Add Frontend Page & Services
Create client services to query the backend endpoints (e.g., using `axios` configuration defaults in services files), and import the hook directly into Next.js components to display data inside user views.
