# 🚀 TeamLabs - Modern Project Management Platform

<div align="center">

![TeamLabs Logo](https://img.shields.io/badge/TeamLabs-Project%20Management-blue?style=for-the-badge&logo=react)

**A comprehensive project management platform with real-time collaboration, AI-powered assistance, and advanced task management capabilities.**

[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-13.4.13-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.8.7-47A248?style=flat-square&logo=mongodb)](https://mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.3.3-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [Usage](#-usage) • [API Documentation](#-api-documentation) • [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [✨ Features](#-features)
- [🛠️ Tech Stack](#-tech-stack)
- [🚀 Installation](#-installation)
- [📖 Usage](#-usage)
- [🔧 API Documentation](#-api-documentation)
- [🏗️ Project Structure](#-project-structure)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🎯 Overview

TeamLabs is a modern, full-stack project management platform designed to streamline team collaboration, task management, and project tracking. Built with cutting-edge technologies, it offers a comprehensive solution for organizations of all sizes.

### Key Highlights

- **🎨 Modern UI/UX**: Beautiful, responsive design with dark/light theme support
- **🔐 Secure Authentication**: Multi-factor authentication with Google OAuth integration
- **🤖 AI-Powered Assistant**: Built-in chatbot for user guidance and support
- **📊 Advanced Analytics**: Real-time dashboards with interactive charts
- **💳 Payment Integration**: Stripe-powered subscription management
- **📱 Mobile Responsive**: Optimized for all devices and screen sizes

---

## ✨ Features

### 🔐 Authentication & Security
- **Multi-Factor Authentication (2FA)**: Google Authenticator integration
- **Google OAuth**: One-click login with Google accounts
- **Session Management**: Configurable session timeouts
- **Login Notifications**: Real-time security alerts
- **Role-Based Access Control**: Admin, Owner, and User roles

### 📊 Dashboard & Analytics
- **Real-Time Statistics**: Project, team, and task metrics
- **Interactive Charts**: Visual data representation using Chart.js
- **Activity Tracking**: User activity monitoring and logging
- **Performance Metrics**: Team productivity insights
- **Customizable Widgets**: Personalized dashboard layouts

### 🎯 Project Management
- **Project Creation & Management**: Full project lifecycle support
- **Status Tracking**: Multiple project statuses (Not Assigned, Assigned, In Progress, etc.)
- **Deadline Management**: Project timeline and milestone tracking
- **Team Assignment**: Flexible team allocation and management
- **Project Templates**: Pre-configured project structures

### 📋 Task Management
- **Kanban Board**: Drag-and-drop task management
- **Task Types**: Feature, Bug, User Story, Documentation, Maintenance
- **Priority Levels**: High, Medium, Low priority classification
- **Assignee Management**: Task assignment and reassignment
- **Status Workflow**: Customizable task status progression
- **Bulk Operations**: Multi-task selection and management

### 👥 Team Collaboration
- **Team Creation**: Dynamic team building and management
- **Member Management**: Add, remove, and manage team members
- **Role Assignment**: Team-specific role definitions
- **Activity Feeds**: Real-time team activity updates
- **Communication Tools**: Integrated messaging and notifications

### 🤖 AI Assistant
- **Smart Chatbot**: Context-aware assistance
- **Conversation History**: Persistent chat sessions
- **Feature Guidance**: Help with platform navigation
- **Quick Actions**: Direct links to common tasks
- **Multi-language Support**: Intelligent response processing

### 💳 Subscription Management
- **Stripe Integration**: Secure payment processing
- **Multiple Plans**: Free, Monthly, and Annual subscriptions
- **Payment Methods**: Credit card and bank transfer support
- **Billing History**: Complete payment transaction records
- **Feature Tiers**: Plan-based feature access control

### 🎨 User Experience
- **Dark/Light Themes**: User preference customization
- **Responsive Design**: Mobile-first approach
- **Toast Notifications**: Real-time feedback system
- **Loading States**: Smooth user experience
- **Error Handling**: Graceful error management

---

## 🛠️ Tech Stack

### Frontend
- **React 18.2.0**: Modern UI library
- **Next.js 13.4.13**: Full-stack React framework
- **Tailwind CSS 3.3.3**: Utility-first CSS framework
- **Chart.js 4.5.0**: Interactive data visualization
- **React Hook Form 7.45.4**: Form state management
- **React Icons 4.10.1**: Icon library
- **React Beautiful DnD 13.1.1**: Drag and drop functionality
- **React Toastify 11.0.5**: Toast notifications

### Backend
- **Node.js**: JavaScript runtime
- **Express.js 4.21.2**: Web application framework
- **MongoDB 7.8.7**: NoSQL database
- **Mongoose 7.8.7**: MongoDB object modeling
- **JWT**: JSON Web Token authentication
- **bcryptjs 2.4.3**: Password hashing
- **Multer 1.4.5**: File upload handling
- **CORS**: Cross-origin resource sharing

### Authentication & Security
- **Google OAuth**: Social login integration
- **Speakeasy 2.0.0**: Two-factor authentication
- **QRCode 1.5.4**: QR code generation
- **JWT**: Token-based authentication
- **Session Management**: Secure session handling

### Payment & Integration
- **Stripe 18.2.1**: Payment processing
- **@stripe/stripe-js 7.4.0**: Stripe JavaScript SDK
- **Payment Gateway**: Secure transaction handling

### Development Tools
- **Swagger**: API documentation
- **Nodemon**: Development server
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixing

---

## 🚀 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn package manager

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/teamlabs.git
   cd teamlabs
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Environment Setup**
   
   Create `.env` files in both `server/` and `client/` directories:

   **Server (.env)**
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/teamlabs
   JWT_SECRET=your_jwt_secret_here
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   ```

   **Client (.env.local)**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB (if not running)
   mongod

   # Run database seeds (optional)
   cd server
   npm run seed
   ```

5. **Start the application**
   ```bash
   # Start server (from server directory)
   npm run dev

   # Start client (from client directory, in new terminal)
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api-docs

---

## 📖 Usage

### Getting Started

1. **Registration**: Create a new account or sign in with Google
2. **Profile Setup**: Complete your profile with additional details
3. **Organization**: Join or create an organization
4. **Team Creation**: Set up teams for your projects
5. **Project Management**: Create and manage projects
6. **Task Assignment**: Assign tasks to team members
7. **Kanban Board**: Use the drag-and-drop interface for task management

### Key Features Walkthrough

#### Dashboard
- View real-time project statistics
- Monitor team performance
- Access quick actions and shortcuts
- Customize dashboard layout

#### Kanban Board
- Drag and drop tasks between status columns
- Filter tasks by project, assignee, or type
- Bulk operations for multiple tasks
- Real-time status updates

#### AI Assistant
- Ask questions about platform features
- Get guidance on project management
- Access quick navigation links
- View conversation history

#### Settings
- Configure two-factor authentication
- Customize theme preferences
- Manage subscription plans
- Update security settings

---

## 🔧 API Documentation

The API documentation is available at `http://localhost:5000/api-docs` when the server is running.

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/2fa/verify` - 2FA verification

#### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

#### Tasks
- `GET /api/task-details` - Get all tasks
- `POST /api/task-details` - Create new task
- `PUT /api/task-details/:id` - Update task
- `DELETE /api/task-details/:id` - Delete task

#### Teams
- `GET /api/teams` - Get all teams
- `POST /api/teams` - Create new team
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team

#### Dashboard
- `GET /api/dashboard/:organizationId` - Get dashboard statistics

#### Chatbot
- `POST /api/chatbot` - Send message to AI assistant
- `GET /api/chatbot/history` - Get conversation history

---

## 🏗️ Project Structure

```
teamlabs/
├── client/                 # Frontend application
│   ├── components/         # React components
│   ├── context/           # React context providers
│   ├── pages/             # Next.js pages
│   ├── services/          # API services
│   ├── styles/            # Global styles
│   └── utils/             # Utility functions
├── server/                # Backend application
│   ├── config/            # Configuration files
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Express middleware
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   └── utils/             # Utility functions
└── README.md              # This file
```

### Key Components

#### Frontend Components
- `Layout.js` - Main application layout
- `DashboardCharts.jsx` - Analytics and charts
- `KanbanBoard.js` - Task management interface
- `ChatBot.js` - AI assistant component
- `TwoFactorAuth.js` - 2FA setup and verification

#### Backend Models
- `User.js` - User data model
- `Project.js` - Project data model
- `TaskDetails.js` - Task data model
- `Team.js` - Team data model
- `ChatConversation.js` - Chat history model

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

### Code Style

- Use meaningful variable and function names
- Add comments for complex logic
- Follow ESLint configuration
- Use TypeScript for new components (if applicable)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **React Team** - For the amazing React framework
- **Vercel** - For Next.js and deployment platform
- **Tailwind CSS** - For the utility-first CSS framework
- **MongoDB** - For the flexible NoSQL database
- **Stripe** - For secure payment processing

---

<div align="center">

**Made with ❤️ by the TeamLabs Development Team**

[![GitHub stars](https://img.shields.io/github/stars/yourusername/teamlabs?style=social)](https://github.com/yourusername/teamlabs)
[![GitHub forks](https://img.shields.io/github/forks/yourusername/teamlabs?style=social)](https://github.com/yourusername/teamlabs)
[![GitHub issues](https://img.shields.io/github/issues/yourusername/teamlabs)](https://github.com/yourusername/teamlabs/issues)

</div> 