# 🎨 TeamLabs - Complete Design System & UI Specification

> **Version**: 2.0 | **Last Updated**: 2026-07-19
> **Purpose**: AI-IDE-ready design specification for pixel-perfect recreation of the TeamLabs project management platform.

---

## 📋 Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Tech Stack & Configuration](#2-tech-stack--configuration)
3. [Color System](#3-color-system)
4. [Typography](#4-typography)
5. [Layout Architecture](#5-layout-architecture)
6. [Component Library](#6-component-library)
7. [Page Specifications](#7-page-specifications)
8. [Animation & Micro-interactions](#8-animation--micro-interactions)
9. [Dark Mode Specification](#9-dark-mode-specification)
10. [Asset Guidelines](#10-asset-guidelines)

---

## 1. Design Philosophy

**TeamLabs** is a premium project management SaaS platform with a clean, modern, developer-friendly aesthetic. The design language emphasizes:

- **Clarity**: High information density without visual clutter
- **Hierarchy**: Clear visual weight through color, typography, and spacing
- **Efficiency**: `zoom: 0.9` desktop density for maximum screen real estate
- **Professionalism**: Subtle shadows, rounded corners, and consistent spacing
- **Accessibility**: WCAG-compliant contrast ratios, keyboard navigation support

---

## 2. Tech Stack & Configuration

### 2.1 Core Dependencies

```json
{
  "tailwindcss": "^4.3.2",
  "postcss": "^8.5.16",
  "react": "^18.x",
  "next": "^14.x",
  "chart.js": "^4.x",
  "react-chartjs-2": "^5.x"
}
```

### 2.2 Tailwind Configuration (`tailwind.config.js`)

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Uses class-based dark mode
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6B39E7',
        dark: '#1F1F1F',
        light: '#93A8AC',
        // Status colors
        'status-assigned': '#3B82F6',
        'status-progress': '#F59E0B',
        'status-qa': '#8B5CF6',
        'status-deployment': '#EC4899',
        'status-completed': '#10B981',
        'status-not-assigned': '#6B7280',
      },
      fontFamily: {
        sans: ['JetBrains Mono', 'monospace'],
        body: ['Source Sans Pro', 'sans-serif'],
        table: ['Inter', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
        display: ['Montserrat', 'sans-serif'],
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
```

### 2.3 Global CSS (`globals.css`)

```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Source+Sans+Pro:wght@300;400;600;700&family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700;800&family=Montserrat:wght@400;500;600;700;800&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    zoom: 0.9;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    font-family: 'JetBrains Mono', monospace;
    @apply bg-gray-50 text-gray-900;
  }

  /* Dark mode base */
  .dark body {
    @apply bg-[#18181B] text-white;
  }

  /* Interactive cursor */
  button, a, [role="button"], select, 
  input[type="submit"], input[type="button"], 
  input[type="checkbox"], input[type="radio"] {
    cursor: pointer;
  }
}

@layer components {
  /* Standard input field */
  .input-field {
    @apply w-full px-3 py-2 border border-gray-300 rounded-md 
           focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
           transition-all duration-200;
  }

  .dark .input-field {
    @apply bg-[#232323] border-gray-700 text-white;
  }

  /* Card base */
  .card {
    @apply bg-white rounded-xl border border-gray-200 shadow-sm
           transition-all duration-300 ease-in-out;
  }

  .dark .card {
    @apply bg-[#232323] border-[#2A2A2A];
  }

  /* Card hover */
  .card-hover {
    @apply hover:shadow-md hover:scale-[1.01] hover:border-gray-300;
  }

  .dark .card-hover {
    @apply hover:border-gray-600 hover:bg-[#2A2A2A];
  }

  /* Button primary */
  .btn-primary {
    @apply px-4 py-2 bg-primary text-white rounded-lg font-medium
           hover:bg-[#5a2fd4] hover:shadow-lg
           active:scale-[0.98]
           transition-all duration-200;
  }

  /* Button secondary */
  .btn-secondary {
    @apply px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium
           hover:bg-gray-200
           active:scale-[0.98]
           transition-all duration-200;
  }

  .dark .btn-secondary {
    @apply bg-[#2A2A2A] text-gray-300 hover:bg-[#333333];
  }

  /* Button danger */
  .btn-danger {
    @apply px-4 py-2 bg-red-500 text-white rounded-lg font-medium
           hover:bg-red-600 hover:shadow-lg
           active:scale-[0.98]
           transition-all duration-200;
  }

  /* Button ghost */
  .btn-ghost {
    @apply px-3 py-1.5 text-gray-600 rounded-lg
           hover:bg-gray-100
           transition-all duration-200;
  }

  .dark .btn-ghost {
    @apply text-gray-400 hover:bg-[#2A2A2A];
  }

  /* Status badge base */
  .badge {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
  }

  /* Shimmer skeleton */
  .skeleton {
    @apply relative overflow-hidden bg-gray-200 rounded;
  }

  .skeleton::after {
    content: '';
    @apply absolute inset-0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    animation: shimmer 2s infinite;
  }

  .dark .skeleton {
    @apply bg-[#2A2A2A];
  }

  .dark .skeleton::after {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
  }

  /* Accordion */
  .accordion-content {
    overflow: hidden;
    transition: max-height 0.3s ease-in-out, opacity 0.25s ease-in-out, transform 0.2s ease-in-out;
    transform-origin: top;
  }

  .accordion-content.closed {
    max-height: 0;
    opacity: 0;
    transform: translateY(-8px) scaleY(0.95);
  }

  .accordion-content.open {
    max-height: 1000px;
    opacity: 1;
    transform: translateY(0) scaleY(1);
  }
}

@layer utilities {
  /* Scrollbar styling */
  .scrollbar-thin {
    scrollbar-width: thin;
    scrollbar-color: #CBD5E1 transparent;
  }

  .scrollbar-thin::-webkit-scrollbar {
    width: 6px;
  }

  .scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
  }

  .scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: #CBD5E1;
    border-radius: 3px;
  }

  .dark .scrollbar-thin {
    scrollbar-color: #4B5563 transparent;
  }

  .dark .scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: #4B5563;
  }
}
```

---

## 3. Color System

### 3.1 Primary Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#6B39E7` | Brand accent, active states, CTAs, links, active sidebar borders |
| `dark` | `#1F1F1F` | High-contrast text (light mode), secondary elements (dark mode) |
| `light` | `#93A8AC` | Borders, dividers, secondary text, inactive states |

### 3.2 Status Color Mapping

| Status | Light Mode | Dark Mode | Icon |
|--------|-----------|-----------|------|
| **Not Assigned** | `bg-gray-100 text-gray-600` | `bg-gray-800 text-gray-400` | Gray circle |
| **Assigned** | `bg-blue-50 text-blue-700 border-blue-200` | `bg-blue-900/30 text-blue-300` | Blue checkmark |
| **In Progress** | `bg-amber-50 text-amber-700 border-amber-200` | `bg-amber-900/30 text-amber-300` | Yellow clock |
| **QA** | `bg-purple-50 text-purple-700 border-purple-200` | `bg-purple-900/30 text-purple-300` | Purple shield |
| **Deployment** | `bg-pink-50 text-pink-700 border-pink-200` | `bg-pink-900/30 text-pink-300` | Pink rocket |
| **Completed** | `bg-green-50 text-green-700 border-green-200` | `bg-green-900/30 text-green-300` | Green checkmark |

### 3.3 Priority Color Mapping

| Priority | Light Mode | Dark Mode | Icon |
|----------|-----------|-----------|------|
| **Low** | `bg-green-100 text-green-800` | `bg-green-900/30 text-green-300` | Green down arrow |
| **Medium** | `bg-yellow-100 text-yellow-800` | `bg-yellow-900/30 text-yellow-300` | Yellow horizontal arrow |
| **High** | `bg-red-100 text-red-800` | `bg-red-900/30 text-red-300` | Red up arrow |

### 3.4 Task Type Color Mapping

| Type | Background | Text | Border |
|------|-----------|------|--------|
| **Bug** | `bg-red-50` | `text-red-700` | `border-red-200` |
| **Feature** | `bg-blue-50` | `text-blue-700` | `border-blue-200` |
| **Improvement** | `bg-green-50` | `text-green-700` | `border-green-200` |
| **Task** | `bg-amber-50` | `text-amber-700` | `border-amber-200` |
| **Documentation** | `bg-teal-50` | `text-teal-700` | `border-teal-200` |
| **Support** | `bg-gray-50` | `text-gray-700` | `border-gray-200` |
| **User Story** | `bg-cyan-50` | `text-cyan-700` | `border-cyan-200` |
| **Maintenance** | `bg-orange-50` | `text-orange-700` | `border-orange-200` |

### 3.5 Team Role Color Mapping

| Role | Background | Text |
|------|-----------|------|
| **Development** | `bg-blue-100` | `text-blue-700` |
| **Service Integration** | `bg-cyan-100` | `text-cyan-700` |
| **Support** | `bg-red-100` | `text-red-700` |
| **QA** | `bg-purple-100` | `text-purple-700` |
| **Design** | `bg-pink-100` | `text-pink-700` |

### 3.6 Gradient Definitions

```css
/* Auth page gradient */
.auth-gradient {
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%);
}

/* Premium card highlight */
.premium-gradient {
  background: linear-gradient(135deg, #6B39E7 0%, #8B5CF6 100%);
}

/* Progress bar gradient */
.progress-gradient {
  background: linear-gradient(90deg, #6B39E7 0%, #8B5CF6 50%, #10B981 100%);
}

/* Header title gradient */
.title-gradient {
  background: linear-gradient(135deg, #6B39E7 0%, #3B82F6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## 4. Typography

### 4.1 Font Stack

| Purpose | Font | Weights | Usage |
|---------|------|---------|-------|
| **Primary (UI)** | JetBrains Mono | 300, 400, 500, 600, 700 | Body text, navigation, labels, code |
| **Body Content** | Source Sans Pro | 300, 400, 600, 700 | Long-form text, descriptions |
| **Tables/Data** | Inter | 300, 400, 500, 600, 700 | Tables, metrics, Kanban columns |
| **Headings** | Poppins | 400, 500, 600, 700, 800 | Page titles, section headers |
| **Display** | Montserrat | 400, 500, 600, 700, 800 | Hero sections, dashboard widgets |

### 4.2 Type Scale

| Token | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| `display-xl` | 36px | 700 | 1.1 | -0.02em | Page titles (Dashboard, Kanban Board) |
| `display-lg` | 28px | 700 | 1.2 | -0.01em | Section headers |
| `display-md` | 24px | 600 | 1.3 | 0 | Card titles, project names |
| `heading-lg` | 20px | 600 | 1.4 | 0 | Sub-section headers |
| `heading-md` | 18px | 600 | 1.4 | 0 | Widget titles |
| `heading-sm` | 16px | 600 | 1.5 | 0 | Card subtitles |
| `body-lg` | 16px | 400 | 1.6 | 0 | Primary body text |
| `body-md` | 14px | 400 | 1.5 | 0 | Secondary body text |
| `body-sm` | 13px | 400 | 1.5 | 0 | Descriptions, metadata |
| `caption` | 12px | 500 | 1.4 | 0.01em | Labels, badges, timestamps |
| `overline` | 11px | 600 | 1.2 | 0.05em | Uppercase labels (e.g., "PROJECTS", "TEAMS") |

### 4.3 Text Color Mapping

| Context | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Primary text | `text-gray-900` | `text-white` |
| Secondary text | `text-gray-500` | `text-gray-400` |
| Tertiary text | `text-gray-400` | `text-gray-500` |
| Muted text | `text-gray-300` | `text-gray-600` |
| Link text | `text-primary hover:text-[#5a2fd4]` | `text-primary hover:text-[#8B5CF6]` |
| Error text | `text-red-600` | `text-red-400` |
| Success text | `text-green-600` | `text-green-400` |

---

## 5. Layout Architecture

### 5.1 Application Shell

```
┌─────────────────────────────────────────────────────────────┐
│  Sidebar (w-64 collapsed:w-16)  │  Main Content Area       │
│                                   │  ┌──────────────────┐  │
│  ┌─────────┐                      │  │  Navbar (h-16)   │  │
│  │ Logo    │                      │  ├──────────────────┤  │
│  ├─────────┤                      │  │                  │  │
│  │ Nav     │                      │  │  Page Content    │  │
│  │ Items   │                      │  │  (scrollable)    │  │
│  │         │                      │  │                  │  │
│  │ Teams   │                      │  │                  │  │
│  │ (accordion)                     │  │                  │  │
│  │ Projects│                      │  │                  │  │
│  │ (accordion)                     │  │                  │  │
│  ├─────────┤                      │  │                  │  │
│  │ Bottom  │                      │  │                  │  │
│  │ Actions │                      │  │                  │  │
│  └─────────┘                      │  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Sidebar (`Sidebar.js`)

**Dimensions:**
- Expanded: `w-64` (256px)
- Collapsed: `w-16` (64px)
- Height: `h-screen`
- Background: `bg-white` / dark: `bg-[#18181B]`
- Border: `border-r border-gray-200` / dark: `border-r border-[#232323]`

**Structure:**
```
Sidebar
├── Logo Section (h-16, px-4)
│   ├── Logo Icon (w-8 h-8, rounded-lg, bg-primary, text-white)
│   └── Brand Name "Olanthroxx" (text-lg font-semibold, only when expanded)
├── Navigation Items (flex-1, py-4, space-y-1)
│   ├── Dashboard (active: bg-blue-50 text-primary border-l-4 border-primary)
│   ├── My Tasks
│   ├── TimeSheet
│   ├── Messages
│   ├── Kanban Board
│   ├── Query Board
│   ├── Teams (accordion with chevron)
│   │   ├── Dev Team
│   │   ├── API Team
│   │   ├── Integration Teams
│   │   └── Support Team
│   └── Projects (accordion with chevron)
│       ├── Add User Stories Functionality
│       ├── Add Task Functionality
│       ├── TP Project
│       ├── Premium Project
│       └── TeamLabs Support
└── Bottom Actions (px-4 py-4, border-t)
    ├── AI Assistant
    ├── Settings
    └── Dark Mode Toggle
```

**Nav Item Styling:**
```css
.nav-item {
  @apply flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-600
         rounded-lg mx-2
         hover:bg-gray-50 hover:text-gray-900
         transition-all duration-200;
}

.nav-item.active {
  @apply bg-blue-50 text-primary border-l-4 border-primary;
}

.dark .nav-item {
  @apply text-gray-400 hover:bg-[#232323] hover:text-white;
}

.dark .nav-item.active {
  @apply bg-[#232323] text-primary;
}
```

**Collapsed State Tooltips:**
- Use `TooltipPortal` for positioning
- Show on hover after 300ms delay
- Position: `right` of the icon
- Background: `bg-gray-900 text-white text-xs px-2 py-1 rounded`

### 5.3 Navbar (`Navbar.js`)

**Dimensions:**
- Height: `h-16` (64px)
- Background: `bg-white/80 backdrop-blur-sm` / dark: `bg-[#18181B]/80`
- Border: `border-b border-gray-200` / dark: `border-b border-[#232323]`
- Padding: `px-6`

**Structure:**
```
Navbar
├── Left Section
│   ├── Breadcrumb (DynamicBreadcrumb)
│   │   └── Home > Projects > TeamLabs Application
│   └── Page Title (if applicable)
├── Right Section (flex items-center gap-4)
│   ├── Search Bar
│   │   ├── Input: w-64, rounded-full, bg-gray-100, placeholder "What are you looking for?"
│   │   └── Keyboard shortcut hint: "⌘ /"
│   ├── Status Badge (green dot + "Active" + dropdown chevron)
│   ├── Notification Bell (relative, with red dot indicator)
│   └── User Profile
│       ├── Avatar (w-8 h-8 rounded-full)
│       ├── Name "tejassgg" 
│       └── Dropdown chevron
```

**Search Bar:**
```css
.search-bar {
  @apply flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full
         border border-transparent
         focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20
         transition-all duration-200;
}

.dark .search-bar {
  @apply bg-[#232323] border-[#2A2A2A];
}
```

### 5.4 Content Area

```css
.content-area {
  @apply flex-1 overflow-y-auto p-6;
  min-height: calc(100vh - 64px);
}
```

---

## 6. Component Library

### 6.1 Metric Card

**Used on:** Dashboard

```jsx
<MetricCard 
  icon={<Icon />}           // Colored icon in rounded square
  value={number}            // Large bold number
  label={string}            // Small uppercase label
  trend={optional}          // Optional trend indicator
/>
```

**Styling:**
```css
.metric-card {
  @apply card p-5 flex items-center gap-4;
}

.metric-card .icon-wrapper {
  @apply w-12 h-12 rounded-xl flex items-center justify-center;
  /* Icon colors vary: blue, green, amber, purple */
}

.metric-card .value {
  @apply text-3xl font-bold text-gray-900;
}

.metric-card .label {
  @apply text-xs font-semibold uppercase tracking-wider text-gray-500;
}
```

### 6.2 Task Card (Kanban)

**Used on:** Kanban Board

```jsx
<TaskCard
  id={number}               // #2549
  title={string}
  description={string}
  type={'bug' | 'feature' | 'improvement' | 'task' | 'documentation'}
  priority={'low' | 'medium' | 'high'}
  progress={number}           // 0-100
  dueDate={date}
  assignee={user}
  subtasks={array}
  comments={number}
  attachments={number}
/>
```

**Styling:**
```css
.task-card {
  @apply card p-4 mb-3 cursor-grab active:cursor-grabbing;
}

.task-card .type-badge {
  @apply badge text-xs;
  /* Color from task type mapping */
}

.task-card .priority-badge {
  @apply badge text-xs;
  /* Color from priority mapping */
}

.task-card .progress-bar {
  @apply h-2 bg-gray-200 rounded-full overflow-hidden;
}

.task-card .progress-fill {
  @apply h-full rounded-full transition-all duration-500;
  /* Gradient: from-primary to-green-500 */
}
```

**Task Card Structure:**
```
┌─────────────────────────────────────┐
│ [Type Badge]              [Priority]│
│ Task Title                          │
│ Short description...                │
│ #2549                               │
│ ┌─────────────────────────────┐     │
│ │████████████░░░░░░░░░░░░░░░░░│ 20% │
│ └─────────────────────────────┘     │
│ 👤 Due Oct 05  💬 2  📎 1           │
└─────────────────────────────────────┘
```

### 6.3 Project Card

**Used on:** Projects page

```jsx
<ProjectCard
  name={string}
  description={string}
  status={'assigned' | 'qa' | 'deployment'}
  progress={number}
  teams={array}
  createdDate={date}
/>
```

**Styling:**
```css
.project-card {
  @apply card p-6 card-hover;
}

.project-card .status-badge {
  @apply badge;
}

.project-card .progress-bar {
  @apply h-2 bg-gray-200 rounded-full overflow-hidden mt-4;
}

.project-card .team-avatars {
  @apply flex -space-x-2;
}

.project-card .team-avatar {
  @apply w-8 h-8 rounded-full border-2 border-white;
}
```

### 6.4 Team Card

**Used on:** Teams page

```jsx
<TeamCard
  name={string}
  description={string}
  status={'active'}
  role={'development' | 'service-integration' | 'support'}
  activeProjects={array}
  members={array}
  createdDate={date}
/>
```

**Styling:**
```css
.team-card {
  @apply card p-6 card-hover;
}

.team-card .role-badge {
  @apply badge;
  /* Color from role mapping */
}
```

### 6.5 Data Table

**Used on:** My Tasks, Query Board, Team Tasks, Project Tasks

```jsx
<DataTable
  columns={array}
  data={array}
  pagination={boolean}
  filters={boolean}
  actions={boolean}
  selectable={boolean}
/>
```

**Table Styling:**
```css
.data-table {
  @apply w-full border-collapse;
}

.data-table thead {
  @apply bg-gray-50/80;
}

.dark .data-table thead {
  @apply bg-[#232323]/80;
}

.data-table th {
  @apply px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500;
}

.data-table td {
  @apply px-4 py-3 text-sm border-t border-gray-100;
}

.dark .data-table td {
  @apply border-t border-[#2A2A2A];
}

.data-table tr:hover {
  @apply bg-gray-50/50;
}

.dark .data-table tr:hover {
  @apply bg-[#232323]/50;
}
```

**Table Row Structure:**
```
┌────┬──────────────────────────┬─────────────┬──────────┬────────────┬──────────┬────────┬─────────┐
│ ☐  │ Task Name                │ Assigned To │ Assignee │ Assigned On│ Priority │ Status │ Actions │
│    │ #2556 • Type Badge       │ Avatar Name │ Avatar   │ Jul 19, 2026│ Badge   │ Badge  │ ✏️ 🗑️  │
│    │ Description snippet...   │ Team Name   │ Name     │ 3:58 PM    │         │        │         │
└────┴──────────────────────────┴─────────────┴──────────┴────────────┴──────────┴────────┴─────────┘
```

### 6.6 Progress Ring

**Used on:** Project Details

```jsx
<ProgressRing
  progress={number}     // 0-100
  size={number}         // 120px default
  strokeWidth={number}  // 8px default
/>
```

**Styling:**
```css
.progress-ring {
  @apply relative inline-flex items-center justify-center;
}

.progress-ring .track {
  @apply text-gray-200;
}

.dark .progress-ring .track {
  @apply text-[#2A2A2A];
}

.progress-ring .fill {
  @apply text-primary;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.5s ease;
}

.progress-ring .value {
  @apply absolute text-2xl font-bold;
}

.progress-ring .label {
  @apply absolute text-xs text-gray-500 uppercase mt-8;
}
```

### 6.7 Chat Message Bubble

**Used on:** Messages page

```jsx
<MessageBubble
  sender={user}
  content={string}
  timestamp={date}
  isOwn={boolean}
  mentions={array}
/>
```

**Styling:**
```css
.message-bubble.own {
  @apply bg-primary text-white rounded-2xl rounded-tr-sm;
}

.message-bubble.other {
  @apply bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm;
}

.dark .message-bubble.other {
  @apply bg-[#232323] text-gray-200;
}

.message-bubble .mention {
  @apply bg-white/20 px-1.5 py-0.5 rounded font-semibold;
}
```

### 6.8 Pricing Card

**Used on:** Subscription/Settings

```jsx
<PricingCard
  name={string}
  price={number}
  period={string}
  originalPrice={number}
  features={array}
  isCurrentPlan={boolean}
  isRecommended={boolean}
/>
```

**Styling:**
```css
.pricing-card {
  @apply card p-8 relative;
}

.pricing-card.recommended {
  @apply border-2 border-primary ring-4 ring-primary/10;
}

.pricing-card .price {
  @apply text-4xl font-bold;
}

.pricing-card .feature-list {
  @apply space-y-3 mt-6;
}

.pricing-card .feature-item {
  @apply flex items-center gap-3 text-sm;
}

.pricing-card .feature-icon {
  @apply w-5 h-5 text-primary;
}
```

### 6.9 Timeline / Progress Steps

**Used on:** Task Details

```jsx
<ProgressTimeline
  steps={[
    { label: 'Not Assigned', completed: true },
    { label: 'Assigned', completed: true },
    { label: 'In Progress', completed: true },
    { label: 'QA', completed: true },
    { label: 'Deployment', completed: true },
    { label: 'Completed', completed: true },
  ]}
/>
```

**Styling:**
```css
.progress-timeline {
  @apply flex items-center justify-between relative;
}

.progress-timeline .line {
  @apply absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -z-10;
}

.progress-timeline .line-fill {
  @apply h-full bg-green-500 transition-all duration-500;
}

.progress-timeline .step {
  @apply flex flex-col items-center gap-2;
}

.progress-timeline .step-dot {
  @apply w-8 h-8 rounded-full flex items-center justify-center
         bg-green-500 text-white text-sm font-bold;
}

.progress-timeline .step-dot.pending {
  @apply bg-gray-200 text-gray-400;
}

.progress-timeline .step-label {
  @apply text-xs font-medium text-gray-600;
}
```

### 6.10 Custom Dropdown

```jsx
<CustomDropdown
  options={array}
  value={any}
  onChange={function}
  searchable={boolean}
  size={'sm' | 'md' | 'lg'}
  variant={'default' | 'outlined' | 'filled'}
/>
```

**Behavior:**
- `Enter` / `Space`: Open dropdown
- `Escape`: Close dropdown
- Click outside: Close dropdown
- Arrow keys: Navigate options
- `Enter`: Select highlighted option

### 6.11 Toast Notification

```jsx
<CustomToast
  type={'success' | 'error' | 'info' | 'warning'}
  message={string}
  duration={number}     // 3000ms default
/>
```

**Position:** Fixed top-right, `top-4 right-4`
**Animation:** Fade in + slide down, auto-dismiss with fade out

### 6.12 Release Banner

```jsx
<ReleaseNotificationBanner
  releaseId={string}
  title={string}
  description={string}
/>
```

**Behavior:**
- Dismiss stores `releaseId` in `localStorage` key `dismissedReleases`
- Prevents re-displaying dismissed releases
- Fixed at top of layout, above navbar

---

## 7. Page Specifications

### 7.1 Dashboard Page

**Route:** `/dashboard`
**Layout:** Full width, no sidebar sub-sections

**Structure:**
```
Dashboard Page
├── Header Section
│   ├── Date "Wednesday, July 15th"
│   ├── Greeting "Good Morning! Tejas,"
│   └── Tabs: "Metrics & Analytics" | "Manage Organization"
├── Metric Cards Row (grid grid-cols-4 gap-4)
│   ├── Projects: 5 (blue icon)
│   ├── Teams: 5 (green icon)
│   ├── Deadlines: 2 (amber icon)
│   └── People: 10 (purple icon)
├── Task Completion Summary (card, full width)
│   ├── Title + Description
│   ├── Stats Row (3 columns)
│   │   ├── Total Tasks: 41
│   │   ├── Completed: 21
│   │   └── Active: 20
│   └── Progress Velocity Bar
│       └── 51% Completed (gradient bar)
├── Charts Row (grid grid-cols-2 gap-4)
│   ├── Project Status Distribution
│   │   ├── Title + Description
│   │   └── Donut Chart (Deployment, QA, In Progress, Assigned)
│   └── Task Type Distribution
│       ├── Title + Description
│       └── Bar Chart (Bug, Documentation, Feature, Improvement, Task, User Story, Support)
└── Monthly Activity Timeline (card, full width)
    ├── Title + Description
    └── Line Chart (project creations vs task completions)
```

**Charts Configuration:**

*Donut Chart:*
```javascript
{
  type: 'doughnut',
  data: {
    labels: ['Deployment', 'QA', 'In Progress', 'Assigned'],
    datasets: [{
      data: [values],
      backgroundColor: ['#6B7280', '#8B5CF6', '#F59E0B', '#6B39E7'],
      borderWidth: 0,
    }]
  },
  options: {
    cutout: '60%',
    plugins: { legend: { position: 'right' } }
  }
}
```

*Bar Chart:*
```javascript
{
  type: 'bar',
  data: {
    labels: ['Bug', 'Documentation', 'Feature', 'Improvement', 'Task', 'User Story', 'Support'],
    datasets: [{
      label: 'Number of Tasks',
      data: [values],
      backgroundColor: ['#6366F1', '#10B981', '#F43F5E', '#A855F7', '#F59E0B', '#06B6D4', '#6B7280'],
      borderRadius: 4,
    }]
  },
  options: {
    scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } } },
    plugins: { legend: { display: false } }
  }
}
```

*Line Chart:*
```javascript
{
  type: 'line',
  data: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [{
      label: 'Tasks Completed',
      data: [values],
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.4,
    }]
  }
}
```

---

### 7.2 Kanban Board Page

**Route:** `/kanban`
**Layout:** Full width, horizontal scroll

**Structure:**
```
Kanban Board Page
├── Header
│   ├── Title "Kanban Board" (title-gradient)
│   ├── Info Badge: "Currently viewing: TeamLabs Application"
│   └── Project Selector Dropdown
└── Kanban Columns (flex, overflow-x-auto, gap-4)
    ├── Not Assigned (w-72, gray header)
    │   ├── Column Header: icon + "Not Assigned" + count badge
    │   └── "+ Add New Task" button
    ├── Assigned (w-72, blue header)
    │   ├── Column Header: icon + "Assigned" + count badge
    │   └── Task Cards (draggable)
    ├── In Progress (w-72, amber header)
    │   ├── Column Header: icon + "In Progress" + count badge
    │   └── Task Cards
    ├── QA (w-72, purple header)
    │   ├── Column Header: icon + "QA" + count badge
    │   └── Task Cards
    ├── Deployment (w-72, pink header)
    │   ├── Column Header: icon + "Deployment" + count badge
    │   └── Task Cards
    └── Completed (w-72, green header)
        ├── Column Header: icon + "Completed" + count badge
        └── Task Cards (collapsed/completed state)
```

**Column Header Styling:**
```css
.kanban-column {
  @apply w-72 flex-shrink-0;
}

.kanban-column-header {
  @apply flex items-center gap-2 px-3 py-2 rounded-t-lg font-semibold text-sm;
}

/* Column-specific colors */
.kanban-column.not-assigned .header { @apply bg-gray-100 text-gray-700; }
.kanban-column.assigned .header { @apply bg-blue-50 text-blue-700; }
.kanban-column.in-progress .header { @apply bg-amber-50 text-amber-700; }
.kanban-column.qa .header { @apply bg-purple-50 text-purple-700; }
.kanban-column.deployment .header { @apply bg-pink-50 text-pink-700; }
.kanban-column.completed .header { @apply bg-green-50 text-green-700; }
```

**Drag & Drop Behavior:**
- Cards are draggable between columns
- Drop target highlights with dashed border
- On drop: Update task status, show toast confirmation
- Smooth animation on card move

---

### 7.3 Messages Page

**Route:** `/messages`
**Layout:** Split pane (sidebar + chat area)

**Structure:**
```
Messages Page
├── Left Sidebar (w-80, border-r)
│   ├── Search Bar ("Search conversations...")
│   ├── "+" New Chat Button
│   ├── Group Chats Section
│   │   ├── The Integratorss (active, "Just now")
│   │   └── The Devs ("1d ago")
│   └── Direct Messages Section
│       ├── Jahnavi Sharma ("Just now", "Heyy")
│       └── Guppy Bhai ("22h ago", "Yooo")
└── Chat Area (flex-1, flex flex-col)
    ├── Chat Header
    │   ├── Avatar + Group Name + Member Avatars
    │   └── Options Menu (⋮)
    ├── Messages List (flex-1, overflow-y-auto, p-4)
    │   ├── Date Separator "Wednesday, August 20, 2025"
    │   ├── System Messages (centered, gray, small)
    │   ├── Received Messages (left-aligned)
    │   └── Sent Messages (right-aligned, primary bg)
    └── Message Input (border-t, p-4)
        ├── Attachment Button (📎)
        ├── Voice Button (🎤)
        ├── Input Field ("Type a message or @ to mention someone")
        ├── Send Button (paper plane icon)
        └── Mention Hint ("Type @ to mention a group member")
```

**Chat Area Styling:**
```css
.chat-container {
  @apply flex flex-col h-full bg-white;
}

.dark .chat-container {
  @apply bg-[#18181B];
}

.message-list {
  @apply flex-1 overflow-y-auto p-4 space-y-4;
}

.message-input-area {
  @apply border-t border-gray-200 p-4;
}

.dark .message-input-area {
  @apply border-t border-[#232323];
}
```

---

### 7.4 My Tasks Page

**Route:** `/my-tasks`
**Layout:** Full width table

**Structure:**
```
My Tasks Page
├── Page Header
│   ├── Title "My Tasks" (title-gradient)
│   └── Search + Filter Controls
├── Summary Cards (grid grid-cols-5 gap-4)
│   ├── Total Tasks: 48
│   ├── Completed: 29
│   ├── Overdue: 0
│   ├── Due Today: 0
│   └── High Priority: 14
├── Table Section
│   ├── Table Header with sortable columns
│   │   ├── Checkbox (select all)
│   │   ├── Name ↕
│   │   ├── Assigned To ↕
│   │   ├── Assignee ↕
│   │   ├── Assigned On ↕
│   │   ├── Priority ↕
│   │   ├── Status ↕
│   │   └── Actions
│   ├── Table Rows (10 per page)
│   └── Pagination (1 2 ... 5 >)
└── Per Page Selector (10, 25, 50, 100)
```

**Summary Card Styling:**
```css
.summary-card {
  @apply card p-4 flex items-center gap-3;
}

.summary-card .icon {
  @apply w-10 h-10 rounded-lg flex items-center justify-center;
}

.summary-card.total .icon { @apply bg-blue-100 text-blue-600; }
.summary-card.completed .icon { @apply bg-green-100 text-green-600; }
.summary-card.overdue .icon { @apply bg-red-100 text-red-600; }
.summary-card.due-today .icon { @apply bg-amber-100 text-amber-600; }
.summary-card.high-priority .icon { @apply bg-red-100 text-red-600; }
```

---

### 7.5 Project Details Page

**Route:** `/projects/[id]`
**Layout:** Tabbed interface

**Structure:**
```
Project Details Page
├── Breadcrumb: Projects > TeamLabs Application
├── Page Header
│   ├── Status Badge "DEPLOYMENT"
│   ├── Title "TeamLabs Application"
│   ├── Description
│   └── Days Left Badge (green) "103 Days Left"
├── Tabs Navigation
│   ├── Manage Project (active)
│   ├── Board
│   ├── Timeline
│   ├── List
│   ├── Files
│   ├── Knowledge Base
│   ├── Generate Report
│   └── Releases
├── Overview Section (Manage Project tab)
│   ├── Left: Project Info Card
│   │   ├── Progress Ring (71%)
│   │   ├── "On Track" badge
│   │   ├── "17 of 24 tasks completed"
│   │   ├── In Progress: 1
│   │   └── User Stories: 1
│   ├── Right: Project Goals
│   │   ├── Phase 1: Documentation ✓
│   │   ├── Phase 2: Core Engineering ✓
│   │   ├── Phase 3: Planning ✓
│   │   ├── Phase 3: QA & Bug Hunt (empty)
│   │   ├── Phase 4: Release & Handover (empty)
│   │   └── "Add new goal..." input
│   ├── Teams Section
│   │   ├── API Team (Active, Service Integration)
│   │   ├── Dev Team (Active, Development)
│   │   └── TP Team (Active, Testing)
│   │   └── Search + Add team button
│   └── User Stories Section
│       ├── Table: Name, Due Date, Status, Actions
│       └── "+ Create" button
│   └── Tasks Section
│       ├── Table with columns
│       └── "+ Create" button
```

**Progress Ring:**
- Size: 120px
- Stroke: 8px
- Track: `text-gray-200` / dark: `text-[#2A2A2A]`
- Fill: `text-primary` (green variant for "On Track")
- Center text: "71%" large, "PROGRESS" small caps below

---

### 7.6 Projects Page

**Route:** `/projects`
**Layout:** Card grid

**Structure:**
```
Projects Page
├── Header
│   ├── Search Bar ("Search projects...")
│   └── "+ New" Button (primary)
└── Project Grid (grid grid-cols-4 gap-6)
    ├── TeamLabs Application
    │   ├── Status: Deployment (pink badge)
    │   ├── Description
    │   ├── Assigned Teams (3): API Team, Dev Team, +1 more
    │   ├── Progress: 71%
    │   └── Team Avatars + Created Date
    ├── Add Task Functionality
    │   ├── Status: QA (purple badge)
    │   └── Progress: 0%
    ├── TP Project
    │   ├── Status: QA (purple badge)
    │   └── Progress: 60%
    ├── Premium Project
    │   ├── Status: Assigned (blue badge)
    │   └── Progress: 53%
    └── TeamLabs Support
        ├── Status: Assigned (blue badge)
        └── Progress: 0%
```

---

### 7.7 Query Board Page

**Route:** `/query-board`
**Layout:** Full width table with advanced filters

**Structure:**
```
Query Board Page
├── Header
│   ├── Title "Query Board" (title-gradient)
│   ├── Search Bar
│   ├── Filter Button
│   └── Export CSV Button (green)
├── Stats: "Showing 35 of 35 tasks"
└── Data Table (same structure as My Tasks)
    └── All tasks across all projects
```

---

### 7.8 Task Details Page

**Route:** `/tasks/[id]`
**Layout:** Three-column on desktop

**Structure:**
```
Task Details Page
├── Breadcrumb: Projects > TeamLabs Application > #2555
├── Page Title: "2555 - Show Link commit, branch or pull request option"
├── Three Column Layout
│   ├── Left Column (w-2/3)
│   │   ├── Progress Timeline
│   │   │   └── Steps: Not Assigned ✓ → Assigned ✓ → In Progress ✓ → QA ✓ → Deployment ✓ → Completed ✓
│   │   ├── Task Description Card
│   │   │   ├── Description text
│   │   │   ├── Type Badge (Feature)
│   │   │   ├── Priority Badge (Medium)
│   │   │   ├── Status Dropdown (Completed)
│   │   │   └── Delete Button
│   │   ├── Assigned To Dropdown
│   │   ├── Attachments Section
│   │   │   ├── Upload Zone (drag & drop)
│   │   │   └── File List (GeoBlue ID Card.pdf)
│   │   ├── Subtasks Section
│   │   │   └── "No subtasks yet" + "+ Add subtask"
│   │   └── Comments Section
│   │       └── "No comments yet"
│   ├── Middle Column (w-1/6)
│   │   ├── Task Dates
│   │   │   ├── Created: Jul 15, 2026
│   │   │   ├── Assigned: Jul 15, 2026
│   │   │   └── Due Date: Oct 4, 2026
│   │   └── (Other metadata)
│   └── Right Column (w-1/6)
│       ├── Project Info
│       │   ├── Project Name (link)
│       │   ├── Description
│       │   └── Deadline: 10/30/2026
│       ├── Development Section
│       │   ├── GitHub Integration Card
│       │   ├── Commit: #deec4d1
│       │   ├── Branch: #main
│       │   └── PR: #2
│       └── History Section
│           └── Timeline of status changes
│               └── "Updated feature status from Deployment to Completed"
│               └── Pagination: Prev | Page 1 of 3 | Next
```

---

### 7.9 Team Details Page

**Route:** `/teams/[id]`
**Layout:** Multi-section page

**Structure:**
```
Team Details Page
├── Breadcrumb: Teams > Support Team
├── Header
│   ├── Title "Support Team" (title-gradient)
│   └── Status: Active + Role Badge (Support) + Actions
├── Team Description Card
│   └── "Support Team Only"
├── Team Meetings Section
│   ├── Header with "+ Meeting" button
│   └── "No meetings yet"
├── Two Column Layout
│   ├── Left: Members Table
│   │   ├── Search: "Search member to add..."
│   │   ├── Columns: Checkbox, Member, Date Added, Status, Actions
│   │   └── Rows with avatar, name, email, date, active toggle, edit/delete
│   └── Right: Projects Assigned
│       ├── Columns: Checkbox, Project Name, Assigned On, Deadline, Status
│       └── Rows with status badges
└── Team Tasks Section
    └── Data Table with all team tasks
```

---

### 7.10 Teams Page

**Route:** `/teams`
**Layout:** Card grid

**Structure:**
```
Teams Page
├── Header
│   ├── Title "Teams" (title-gradient)
│   ├── Search Bar ("Search teams...")
│   └── "+ New" Button (primary)
└── Team Grid (grid grid-cols-4 gap-6)
    ├── Support Team
    │   ├── Status: Active + Role: Support
    │   ├── Description
    │   ├── Active Projects (2)
    │   │   ├── TeamLabs Support (Assigned)
    │   │   └── TP Project (QA)
    │   └── Members + Created Date
    ├── TP Team
    │   ├── Status: Active + Role: Development
    │   ├── Active Projects (2)
    │   └── "Request Pending" banner (yellow)
    ├── Integration Teams
    │   ├── Status: Active + Role: Service Integration
    │   └── Active Projects (2)
    ├── API Team
    │   ├── Status: Active + Role: Service Integration
    │   └── Active Projects (2)
    └── Dev Team
        ├── Status: Active + Role: Development
        └── Active Projects (4)
```

---

### 7.11 Settings / Subscription Page

**Route:** `/settings`
**Layout:** Tabbed interface

**Structure:**
```
Settings Page
├── Tabs: General | Billings | Integrations | Release Notifications
├── Billings Tab (active)
│   ├── Current Plan Card
│   │   ├── "Current Plan: Premium (Annual)"
│   │   ├── "Active until 7/3/2027"
│   │   ├── "10 members have premium access"
│   │   ├── Cancel Subscription Button (red)
│   │   └── Premium Plan Badge
│   ├── Pricing Cards (3 columns)
│   │   ├── Basic Free Account ($0/mo)
│   │   │   ├── 3 Projects, 1 Story, 10 Tasks, Basic Support
│   │   │   └── Cancel Subscription Button (red)
│   │   ├── Premium Monthly ($49/mo)
│   │   │   ├── Unlimited Projects, Stories, Tasks, Analytics, Priority Support
│   │   │   └── Downgrade Button (purple)
│   │   └── Premium Annual ($419/yr, ~~$588~~)
│   │       ├── "BEST VALUE (SAVE 29%)" badge
│   │       ├── All Monthly features + 29% Annual Discount
│   │       └── "Current Plan" Button (disabled)
│   └── Transaction History
│       ├── "Manage payment methods, invoices, and subscription in Stripe"
│       └── Recent Stripe Transactions Table
```

---

## 8. Animation & Micro-interactions

### 8.1 Standard Transitions

```css
/* Button press */
.btn-press {
  @apply active:scale-[0.98] transition-transform duration-100;
}

/* Card hover lift */
.card-lift {
  @apply hover:shadow-md hover:-translate-y-0.5 transition-all duration-300;
}

/* Link underline */
.link-underline {
  @apply relative;
}
.link-underline::after {
  content: '';
  @apply absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300;
}
.link-underline:hover::after {
  @apply w-full;
}

/* Fade in page */
.page-enter {
  @apply animate-fade-in;
}

/* Slide up content */
.content-slide-up {
  @apply animate-slide-up;
}
```

### 8.2 Loading States

**Skeleton Layouts:**
- Dashboard: 4 metric skeletons + 2 chart skeletons + 1 timeline skeleton
- Table: 5 row skeletons with checkbox + 6 column skeletons
- Cards: 4 card skeletons with title, text, and progress bar

**Skeleton Colors:**
```css
.skeleton-bg {
  @apply bg-gray-200;
}
.dark .skeleton-bg {
  @apply bg-[#2A2A2A];
}
```

### 8.3 Toast Animations

```css
.toast-enter {
  @apply animate-[slideIn_0.3s_ease-out];
}

.toast-exit {
  @apply animate-[fadeOut_0.3s_ease-in_forwards];
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
```

### 8.4 Modal/Dialog

```css
.modal-overlay {
  @apply fixed inset-0 bg-black/50 backdrop-blur-sm z-50
         animate-[fadeIn_0.2s_ease-out];
}

.modal-content {
  @apply bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-auto mt-20 p-6
         animate-[slideUp_0.3s_ease-out];
}

.dark .modal-content {
  @apply bg-[#232323];
}
```

---

## 9. Dark Mode Specification

### 9.1 Toggle Mechanism

```javascript
// ThemeContext.js
const [theme, setTheme] = useState('light');

const toggleTheme = () => {
  const newTheme = theme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
  document.documentElement.className = newTheme;
  localStorage.setItem('theme', newTheme);
};
```

### 9.2 Theme Class Hook

```javascript
// useThemeClasses.js
const useThemeClasses = () => {
  const { theme } = useContext(ThemeContext);

  return (lightClasses, darkClasses) => {
    return theme === 'dark' 
      ? `${lightClasses} ${darkClasses}` 
      : lightClasses;
  };
};

// Usage
const getThemeClasses = useThemeClasses();
const borderClass = getThemeClasses('border-gray-200', 'border-gray-700');
```

### 9.3 Chart.js Dark Mode

```javascript
const chartOptions = {
  scales: {
    x: {
      grid: { color: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
      ticks: { color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }
    },
    y: {
      grid: { color: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
      ticks: { color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }
    }
  },
  plugins: {
    legend: {
      labels: { color: theme === 'dark' ? '#E5E7EB' : '#374151' }
    },
    tooltip: {
      backgroundColor: theme === 'dark' ? '#232323' : '#FFFFFF',
      titleColor: theme === 'dark' ? '#FFFFFF' : '#1F1F1F',
      bodyColor: theme === 'dark' ? '#D1D5DB' : '#6B7280',
      borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
      borderWidth: 1,
    }
  }
};
```

### 9.4 Complete Dark Mode Color Map

| Element | Light | Dark |
|---------|-------|------|
| Body bg | `bg-gray-50` | `bg-[#18181B]` |
| Card bg | `bg-white` | `bg-[#232323]` |
| Card border | `border-gray-200` | `border-[#2A2A2A]` |
| Input bg | `bg-white` | `bg-[#232323]` |
| Input border | `border-gray-300` | `border-gray-700` |
| Table header | `bg-gray-50` | `bg-[#232323]` |
| Table row hover | `bg-gray-50` | `bg-[#2A2A2A]` |
| Primary text | `text-gray-900` | `text-white` |
| Secondary text | `text-gray-500` | `text-gray-400` |
| Muted text | `text-gray-400` | `text-gray-500` |
| Sidebar bg | `bg-white` | `bg-[#18181B]` |
| Sidebar border | `border-gray-200` | `border-[#232323]` |
| Nav item hover | `hover:bg-gray-50` | `hover:bg-[#232323]` |
| Nav active | `bg-blue-50` | `bg-[#232323]` |
| Chat own msg | `bg-primary text-white` | `bg-primary text-white` |
| Chat other msg | `bg-gray-100` | `bg-[#232323]` |
| Scrollbar | `#CBD5E1` | `#4B5563` |

---

## 10. Asset Guidelines

### 10.1 Icons

**Icon Library:** Use `lucide-react` or `heroicons-react`

**Required Icons:**
| Icon | Usage |
|------|-------|
| LayoutDashboard | Dashboard nav |
| ListTodo | My Tasks nav |
| Clock | TimeSheet nav |
| MessageSquare | Messages nav |
| Kanban | Kanban Board nav |
| Search | Query Board nav |
| Users | Teams nav |
| Folder | Projects nav |
| Sparkles | AI Assistant nav |
| Settings | Settings nav |
| Moon/Sun | Dark mode toggle |
| Bell | Notifications |
| ChevronDown | Dropdowns, accordions |
| ChevronRight | Breadcrumbs, navigation |
| Plus | Add buttons |
| Edit | Edit actions |
| Trash2 | Delete actions |
| Check | Completed status |
| Clock | In Progress status |
| Shield | QA status |
| Rocket | Deployment status |
| AlertCircle | Not Assigned status |
| ArrowUp | High priority |
| ArrowDown | Low priority |
| ArrowRight | Medium priority |
| Bug | Bug task type |
| Lightbulb | Feature task type |
| TrendingUp | Improvement task type |
| FileText | Documentation task type |
| Wrench | Task type |
| BookOpen | User Story type |
| Headphones | Support type |
| Paperclip | Attachments |
| Mic | Voice message |
| Send | Send message |
| Search | Search bars |
| Filter | Filter buttons |
| Download | Export CSV |
| MoreVertical | Options menu |
| X | Close, dismiss |
| CheckCircle | Success states |
| AlertTriangle | Warning states |
| Info | Info states |
| GitBranch | Git integration |
| GitCommit | Commit reference |
| GitPullRequest | PR reference |
| Calendar | Date displays |
| Link | Link references |

### 10.2 Avatars

```css
.avatar {
  @apply w-8 h-8 rounded-full object-cover border-2 border-white;
}

.avatar-sm { @apply w-6 h-6; }
.avatar-md { @apply w-8 h-8; }
.avatar-lg { @apply w-10 h-10; }
.avatar-xl { @apply w-12 h-12; }

.avatar-group {
  @apply flex -space-x-2;
}

.avatar-initials {
  @apply w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white;
}
```

**Avatar Colors (for initials):**
- Blue: `#3B82F6`
- Green: `#10B981`
- Purple: `#8B5CF6`
- Pink: `#EC4899`
- Amber: `#F59E0B`
- Red: `#EF4444`
- Cyan: `#06B6D4`

### 10.3 Logo

```css
.logo {
  @apply w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold;
}
```

---

## 11. Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| `sm` | 640px | Stack metric cards 2x2 |
| `md` | 768px | Sidebar collapses to icon-only |
| `lg` | 1024px | Full sidebar, 2-col charts |
| `xl` | 1280px | 4-col project grid, full tables |
| `2xl` | 1536px | Maximum content width |

### 11.1 Mobile Adaptations

- Sidebar: Slide-in drawer from left
- Kanban: Horizontal scroll with snap points
- Tables: Horizontal scroll with sticky first column
- Charts: Simplified legends, larger touch targets
- Chat: Full-screen chat area

---

## 12. Accessibility Requirements

- **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Focus States**: Visible focus rings (`ring-2 ring-primary ring-offset-2`)
- **Keyboard Navigation**: All interactive elements accessible via Tab
- **ARIA Labels**: All icon buttons have aria-labels
- **Screen Readers**: Status changes announced via live regions
- **Reduced Motion**: Respect `prefers-reduced-motion` media query

---

## 13. File Structure Reference

```
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
```

---

*End of Design System Specification*
