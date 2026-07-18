# 🎨 TeamLabs - Design System & UI Documentation

This document serves as the comprehensive guide to the design system, styling infrastructure, and user interface design patterns implemented across the TeamLabs client application.

---

## 🛠️ Styling Stack

TeamLabs utilizes a modern, performance-oriented styling stack combining:
1. **Next-Generation Tailwind CSS v4.3.2**: A utility-first CSS framework configured as a CSS-first styling engine using standard CSS inputs and theme mappings.
2. **PostCSS v8.5.16**: Used for processing Tailwind `@import` statements, parsing custom CSS rules, and applying autoprefixer transformations for cross-browser compatibility.
3. **Custom Global Stylesheets ([globals.css](file:///client/styles/globals.css))**: Housing keyframe animations, scrollbar behaviors, layout overrides, accordion classes, and custom theme tokens.

---

## 🎨 Theme & Color Palette

The application implements a clean, premium, modern dark/light mode system controlled via user settings. Custom tokens are integrated into the CSS engine via the Tailwind `@theme` system in [globals.css](file:///client/styles/globals.css):

### Core Theme Tokens
```css
@theme {
  --color-primary: #6B39E7;
  --color-dark: #1F1F1F;
  --color-light: #93A8AC;
  --font-sans: 'JetBrains Mono', monospace;
}
```

*   **Primary Accent (`--color-primary` / `#6B39E7`)**: A rich indigo/violet serving as the central active brand color. Used for interactive states, call-to-action (CTA) buttons, link text, active menu borders, and highlight states.
*   **Dark Neutral (`--color-dark` / `#1F1F1F`)**: A charcoal black. In light mode, it serves as the high-contrast text color; in dark mode, it acts as a secondary element base.
*   **Light Neutral (`--color-light` / `#93A8AC`)**: A muted slate gray. Used for structural dividers, borders, secondary text, inactive states, and subtler panels.

### Mode-Specific Color Schemes

| Element / State | Light Mode | Dark Mode |
| :--- | :--- | :--- |
| **Main Canvas Background** | White (`#FFFFFF`) or light-gray (`bg-gray-100`) | Rich Dark Slate (`#18181B`) |
| **Primary Typography** | Charcoal (`text-gray-900` / `text-dark`) | White (`text-white`) or light-slate (`text-gray-100`) |
| **Secondary Typography** | Slate Gray (`text-gray-500` / `text-gray-600`) | Muted Gray (`text-gray-400` / `text-zinc-400`) |
| **Borders & Dividers** | Light Gray (`border-gray-200`) | Dark Gray (`border-[#232323]` / `border-gray-700`) |
| **Card & Panel Backgrounds**| White (`bg-white`) with subtle shadow | Charcoal/Zinc (`bg-gray-800` / `bg-[#232323]` / `bg-[#1E1E24]`) |
| **Hover Transitions** | Subtle gray (`hover:bg-gray-50`) | Dark charcoal (`hover:bg-[#2A2A2A]`) |

### Custom Brand Gradients
*   **Authentication & High-Impact Components**: Integrates vibrant gradients to elevate the premium aesthetic:
    *   Dark Mode Gradient: `bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900`
    *   Accent Gradients: `bg-gradient-to-r from-blue-600 to-purple-600` (hovering to `from-blue-700 to-purple-700`) or standard `bg-gradient-to-r from-blue-500 to-purple-500`.

---

## ✍️ Typography & Fonts

Multiple Google Web Fonts are imported at the top of [globals.css](file:///client/styles/globals.css) to support rich typography constraints:
*   **JetBrains Mono**: Declared as the default sans-serif font family (`--font-family`) for the application, structural layouts, coding segments, API responses, and high-readability developer controls.
*   **Source Sans Pro**: Declared as an optional clean-sans choice, available for body content adjustments in settings.
*   **Inter**: Utilized for structural tables, tabular numbers, metrics dashboards, Kanban status columns, and user metadata grids due to its high scanning readability.
*   **Poppins & Montserrat**: Selected for high-impact landing pages, header titles, hero sections, and dashboard widget headings.

### Layout Scaling & Density
*   **Desktop Scan Density**: The body style specifies `zoom: 0.9` on browser layout rendering to increase visual density. This allows project managers to view comprehensive analytics, timelines, and Kanban boards with minimal scrolling.

---

## 🏗️ Layout & Shell Architecture

The user interface wraps all authenticated routes in a unified workspace shell defined in [Layout.js](file:///client/components/layout/Layout.js):

### 1. Collapsible Sidebar Navigation ([Sidebar.js](file:///client/components/layout/Sidebar.js))
*   **Collapsed State**: Toggles between a full `w-64` text-labeled drawer and a compact `w-16` icon-only bar. The collapsed state is saved to `localStorage` (`sidebarCollapsed`) so it persists across page reloads.
*   **Dynamic Tooltips**: When collapsed, hovering over menu items dynamically computes positions and reveals a tooltip using `TooltipPortal` to avoid layout truncation.
*   **Sub-Sections**: Features collapsing sub-drawers for active Teams and Projects using chevron toggles.

### 2. Header Navigation Bar ([Navbar.js](file:///client/components/layout/Navbar.js))
*   **Layout Placement**: Sits at the top of the content area, displaying breadcrumbs, search toggles, notifications, theme toggles, and user profile menus.
*   **Dynamic Breadcrumbs**: Breadcrumbs (`DynamicBreadcrumb.jsx`) automatically parse active router paths (e.g. `/project/[id]`) and map them to friendly labels with chevron separation.

---

## 📦 Core UI Components & Styling Patterns

### 1. Standard Form Fields (`.input-field`)
A standardized styling utility applied across sign-in/register forms, profile editors, and project setups:
```css
.input-field {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent;
}
```
*   In Dark Mode, fields transition to dark backgrounds (`bg-[#232323]`), gray borders, and white text.

### 2. Reusable Searchable Dropdowns ([CustomDropdown.jsx](file:///client/components/shared/CustomDropdown.jsx))
*   **Features**: Includes options for simple selection, full inline searching, sizing (`sm`, `md`, `lg`), and variants (`default`, `outlined`, `filled`).
*   **Keyboard Navigation**: Handles accessibility requirements by mapping `Enter` / `Space` to open, `Escape` to close, and trapping click-outside events to dismiss the popup list.

### 3. Badge & Urgency Pill Mappings
Standardized pills for visual prioritization:
*   **Low Priority**: Light gray/green base (`bg-green-100 text-green-800` / `dark:bg-green-900/30 dark:text-green-300`).
*   **Medium Priority**: Yellow base (`bg-yellow-100 text-yellow-800` / `dark:bg-yellow-900/30 dark:text-yellow-300`).
*   **High Priority**: Red base (`bg-red-100 text-red-800` / `dark:bg-red-900/30 dark:text-red-300`).
*   **Status Badges**: Managed dynamically mapping statuses like `To Do`, `In Progress`, `Under Review`, and `Completed` to matching theme-aware badge pills.

### 4. Banners & Notifications
*   **System Release Banner ([ReleaseNotificationBanner.jsx](file:///client/components/shared/ReleaseNotificationBanner.jsx))**: A premium announcement bar fixed to the top layout. Dismissing the banner records the release ID in the browser's `localStorage` (`dismissedReleases`) to prevent duplicate displays.
*   **Custom Toasts ([CustomToast.js](file:///client/components/shared/CustomToast.js))**: Renders floating temporary alerts (Success, Error, Info, Warning) with smooth fade-in/fade-out transitions, positioned at the top-right corner.

---

## ⚡ Micro-Interactions, States & Animations

### 1. Interactive Element Hovers
All buttons, anchors, and clickable grid cards integrate hover animations to feel responsive:
*   **Scale Effect**: `hover:scale-[1.02]` or `hover:scale-105` for buttons.
*   **Shadow Transition**: Elevates shadows using `hover:shadow-md` or `hover:shadow-xl` combined with smooth transitions `transition-all duration-300 ease-in-out`.
*   **Interactive Hand Cursor**: Global rules in [globals.css](file:///client/styles/globals.css) guarantee pointer cursors on all interactive tags:
    ```css
    button, a, [role="button"], select, input[type="submit"], input[type="button"], input[type="checkbox"], input[type="radio"] {
      cursor: pointer;
    }
    ```

### 2. Shimmer Loading Skeletons
Asynchronous data loading states render visual blocks mapping to actual layouts, animated with a custom shifting gradient:
```css
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.animate-shimmer {
  animation: shimmer 2s infinite;
}
```
*   **Skeleton Variants**: Pre-designed skeletons are available for the Dashboard, Projects, Teams, Tasks, and Messages views.

### 3. Accordion Expand/Collapse Transitions
Used in details panels and settings lists to ensure expanding elements transition smoothly:
```css
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
```

---

## 🔌 Theme Integration & Developer APIs

Developers must utilize the following hooks and contexts to maintain design consistency:

### 1. The Theme Context Provider ([ThemeContext.js](file:///client/context/ThemeContext.js))
*   **Usage**: Exposes active `theme` (`light` | `dark`), `setTheme`, and a helper `toggleTheme()` trigger.
*   **Under the Hood**: Updates the standard document class (`document.documentElement.className = theme`) to allow Tailwind's class-based dark mode selector (`.dark`) to cascade down.

### 2. Theme Class Resolver Hook ([useThemeClasses.js](file:///client/components/shared/hooks/useThemeClasses.js))
Provides a programmatically clean pattern for applying theme classes in inline JSX:
```javascript
import { useThemeClasses } from '../shared/hooks/useThemeClasses';

const getThemeClasses = useThemeClasses();
const borderClass = getThemeClasses('border-gray-200', 'border-gray-700');
```
*   *Note*: In dark mode, `useThemeClasses` returns both sets of classes to apply override behaviors (`theme === 'dark' ? '${lightClasses} ${darkClasses}' : lightClasses`).

### 3. Chart.js Theme Synchronization
All analytics charts (Burndown, Git Stream, Timesheet summaries) read the active `theme` state and apply corresponding grid and tooltip styles:
*   **Grid Color**: Swaps grid borders dynamically (e.g. `rgba(255, 255, 255, 0.1)` in dark mode vs. `rgba(0, 0, 0, 0.05)` in light mode).
*   **Font Color**: Re-renders metrics labels and titles in white/slate under dark mode to ensure high readability.

