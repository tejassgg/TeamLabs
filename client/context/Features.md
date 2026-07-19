# 🚀 TeamLabs - Platform Features

This document provides a comprehensive analysis of the system features and user modules implemented in TeamLabs.

---

## 🔐 1. Authentication & Security

TeamLabs implements multi-layer authentication and session security:
*   **Dual Sign-In Routes**: Supports standard username/email and secure Google OAuth integration via `@react-oauth/google` and `google-auth-library`.
*   **Two-Factor Authentication (2FA)**: High-security authentication utilizing Speakeasy. Users can enable 2FA in their settings, which generates a TOTP secret and provides a QR code. Verification requires entering a valid 6-digit verification code.
*   **Session Management**: Configurable JWT cookies containing user IDs, roles, and organization references, allowing automatic browser sign-in refreshes.
*   **Email Verification**: Handles automatic signup verification tokens, triggering email dispatches using `nodemailer` template renderers.

---

## 👥 2. Team Collaboration Hub

A structural space where users manage teams, roles, and communications:
*   **Dynamic Teams**: Creation and structure of workspace teams bounded to specific organizations.
*   **Invitations and Approvals**: Team Owners/Admins can invite members via email or review/approve request queues (`TeamJoinRequest` and `Invite` schemas).
*   **Role-Based Access Control (RBAC)**: Enforces access bounds between Organization Owner (admin), Team Manager, and regular User levels.
*   **Real-time Collaboration Messages**: Custom communication interface (`messages.js`) supporting instant direct messages and channel feeds backed by WebSockets.

---

## 🏗️ 3. Project & Task Management

The core operational system of the application:
*   **Project Lifecycle Tracking**: Projects are tracked from creation to completion, displaying metrics like start dates, deadlines, and milestone configurations.
*   **Intelligent Task Management**: Tasks are modeled with comprehensive properties: priority routing (Low, Medium, High), status updates, assignees, deadlines, and history logs (`TaskDetailsHistory`).
*   **Kanban Board**: Drag-and-drop workspace UI (`KanbanBoard.js` / `kanban.js`) powered by `react-beautiful-dnd`. Drag actions immediately commit updates to the database and sync other active users' browsers.
*   **User Stories & Subtasks**: High-level requirements mapping down to granular subtask hierarchies (`Subtask.js` model).

---

## 💳 4. Billing & Subscription System

TeamLabs features a structured payments layer supporting billing plans and automated refund calculations:
*   **Billing Tiers**:
    *   **Basic Free Account ($0/mo)**: Locked limits (e.g., maximum of 3 active projects, 3 user stories, and 20 tasks per story).
    *   **Premium Monthly Plan ($49/mo)**: Unlimited active projects, unlimited stories, timesheets, and AI report access.
    *   **Premium Annual Plan ($419/yr)**: All premium features at a 29% discounted package rate.
*   **Stripe SDK Integration**: Subscriptions are managed using safe token processing. The server handles raw webhook payloads on `/api/payment/webhook` to capture Stripe notifications.
*   **Downgrade & Refund Rules**:
    *   **Annual-to-Monthly Downgrade**: Emits a pro-rated refund based on the remaining active subscription days.
    *   **Annual-to-Free Downgrade**: Emits a full refund matching the exact remaining duration value.
    *   **Eligibility Check**: A customer must initiate the downgrade with at least **7 days** remaining on the active billing cycle.
    *   **Math Logic**:
        $$\text{Refund Amount} = \text{floor}\left( \frac{\text{Amount Paid}}{\text{Total Cycle Days}} \times \text{Days Remaining} \right)$$
        Calculated refunds are stored as separate negative ledger transactions (`REFUND_...` in database entries).

---

## ⏱️ 5. Timesheets & Productivity Tracking

Provides time tracking utility for remote and agile teams:
*   **Punch-In / Punch-Out System**: Allows developers to record active work sessions.
*   **Automatic Calculation**: Accumulates shift lengths, handles overnight periods, and tracks overall weekly hours.
*   **Timesheet Approvals**: Interactive dashboard components allowing team managers to review, audit, and approve developer timesheets.

---

## 📅 6. Report Scheduling & Delivery

Automation service for generating and distributing project progress summaries:
*   **Automated Runs**: Leverages `node-cron` to automatically schedule daily, weekly, or monthly report generation tasks.
*   **Flexible Configs**: Users can define target projects, email lists, report depths (Brief, Standard, Detailed), and format scopes (Technical, Casual, Standard).
*   **Trigger Methods**: Runs in the background and sends formatted PDF/Excel report attachments to stakeholders automatically.

---

## ⚡ 7. Server Keep-Alive (Self-Ping) Service

To prevent hosting environments from putting the container to sleep (free-tier inactive spin-downs):
*   **Automatic Wakefulness**: [keepAliveService.js](file:///server/services/keepAliveService.js) registers on startup and issues a self-ping GET request to its public endpoint (`process.env.SERVER_URL`) every **5 minutes**.
*   **Preventing Cold Starts**: Simulating consistent traffic signals to the hosting provider that the service is in active use, avoiding typical 50+ second delay cold starts.

---

## 📱 8. Client-Side Data Caching (SWR)

To optimize frontend network requests, query performance, and overall responsiveness:
*   **Stale-While-Revalidate (SWR) Caching**: Utilizes the `swr` caching library to instant-render pages using cached states, while updating data silently in the background.
*   **Query Deduping & Focus Revalidation**: Automatically groups concurrent requests to the same endpoints into a single HTTP payload and revalidates expired resources when tabs regain focus.
*   **Integrated Views**: Integrated across all core pages, including the User Dashboard, Projects List, Teams Workspace, Personal Tasks, Timesheets Log, Dynamic Task Details, and Dynamic Project Boards.

---

## 📢 9. Release Notifications & Versioning Banners

Platform-wide notifications system to keep users informed about platform updates, new features, and bug fixes:
*   **Global Version Banners**: Renders a notification banner at the top of the main container layout (`ReleaseNotificationBanner.jsx`) to notify users of published release details.
*   **Target Audience Filtering**: Support filtering banners by user type, showing specific releases to `all` users, `admin` only, `premium` only, or `beta` group users.
*   **Dismissal State & Caching**: Dismissed releases are saved to browser `localStorage` to prevent showing the banner again. Network calls to fetch updates are optimized using `sessionStorage` caching (`releaseCheckedThisSession`) and prop delegation to prevent duplicate API requests on route changes.
*   **Markdown Import & Live Preview**: Allows system admins to paste Markdown text (`.md` files) to automatically extract titles, versions, and lists of features, improvements, and bug fixes, while visualizing a live simulated banner preview in real-time.
*   **Auto-Versioning**: Automatically calculates standard semantic version numbers (Major, Minor, Patch, Hotfix) relative to the latest release in the database.
*   **Super-Admin Access Control**: Access to draft, publish, delete, and edit release notifications in settings is strictly locked to users with the `Admin` role and the username `tejassgg` at both the frontend and backend levels.
