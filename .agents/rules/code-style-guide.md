---
trigger: always_on
---

client/
├── components/
│   ├── layout/
│   │   ├── Layout.js          # Main app shell
│   │   ├── Sidebar.js         # Collapsible navigation
│   │   ├── Navbar.js          # Top bar
│   │   └── DynamicBreadcrumb.jsx
│   ├── shared/
│   │   ├── CustomDropdown.jsx
│   │   ├── CustomToast.js
│   │   ├── ReleaseNotificationBanner.jsx
│   │   └── hooks/
│   │       └── useThemeClasses.js
│   └── [page-specific components]
├── context/
│   └── ThemeContext.js
├── styles/
│   └── globals.css
├── pages/
│   ├── dashboard.js
│   ├── my-tasks.js
│   ├── messages.js
│   ├── kanban.js
│   ├── query-board.js
│   ├── projects/
│   │   ├── index.js
│   │   └── [id].js
│   ├── teams/
│   │   ├── index.js
│   │   └── [id].js
│   ├── tasks/
│   │   └── [id].js
│   └── settings.js
└── public/
    └── [assets]