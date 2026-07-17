# 🎨 TeamLabs - Design System & UI Documentation

This document describes the design specifications, styling infrastructure, and user interface systems implemented in TeamLabs.

---

## 🛠️ Styling Stack

TeamLabs utilizes a modern, performance-oriented styling stack combining:
1. **Next-Generation Tailwind CSS v4.3.2**: A utility-first CSS framework configured as a CSS-first styling engine.
2. **PostCSS v8.5.16**: Used for processing Tailwind imports and applying style autoprefixer transformations.
3. **Custom Global Stylesheets ([globals.css](file:///client/styles/globals.css))**: Housing custom transitions, scrollbar behaviors, layout overrides, keyframe animations, and custom theme tokens.

---

## 🎨 Theme & Color Palette

The application implements a clean, premium, modern dark/light system controlled via user settings. Custom tokens are integrated into the CSS engine via the Tailwind `@theme` system:

### Theme Tokens
*   **Primary Accent (`--color-primary`)**: `#6B39E7` (Deep Indigo / Violet) – Used for active states, CTA buttons, links, and highlights.
*   **Dark Neutral (`--color-dark`)**: `#1F1F1F` (Charcoal Black) – Serving as the primary dark theme base and light theme text color.
*   **Light Neutral (`--color-light`)**: `#93A8AC` (Slate Gray) – Used for borders, inactive tabs, secondary text, and light mode subtle panels.

```css
@theme {
  --color-primary: #6B39E7;
  --color-dark: #1F1F1F;
  --color-light: #93A8AC;
  --font-sans: 'Source Sans Pro', sans-serif;
}
```

### Body and Dark Mode Overrides
*   **Light Theme**: White background (`bg-white`), dark charcoal text (`text-dark`), browser scale zoom factor at `0.9` for balanced scanning layout density.
*   **Dark Theme**: Rich dark slate background (`bg-[#18181b]`), white text (`text-white`), toggled by applying the `.dark` class to the `<html>` node.

---

## ✍️ Typography & Fonts

Multiple Google Web Fonts are imported at the top of [globals.css](file:///client/styles/globals.css) to support clean typography:
*   **Inter**: Utilized for structural tables, numbers, metrics dashboards, and user metadata grids.
*   **Source Sans Pro**: Declared as the default sans-serif font family (`--font-family`) for high-legibility paragraphs and form labels.
*   **Poppins / Montserrat**: Selected for high-impact landing pages, header titles, and dashboard widget titles.
*   **JetBrains Mono**: Integrated for code segments, API requests, token views, and developer keys.

---

## 📦 Custom Utilities & UI Classes

Several custom CSS utilities are added to handle specific layout behaviors:

### 1. Form Inputs (`.input-field`)
A standardized utility applied across login/register forms and project setup forms to guarantee input field consistency:
```css
.input-field {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent;
}
```

### 2. Smooth Accordion Content (`.accordion-content`)
Calculated transitions to handle expanding/collapsing details sections with smooth transform-scaling:
```css
.accordion-content {
  overflow: hidden;
  transition: max-height 0.3s ease-in-out, opacity 0.25s ease-in-out, transform 0.2s ease-in-out;
  transform-origin: top;
}
```

### 3. Customized Scrollbars (`.scrollbar-thin`)
Responsive styled scrollbar overlays that automatically adapt to light mode and dark mode to provide a cohesive visual experience:
*   Light Mode: Gray thumb (`#9ca3af`) with light-gray track (`#e5e7eb`).
*   Dark Mode: Darker gray thumb (`#4b5563`) with dark track (`#1f2937`).

---

## 📊 Visual Elements & Visual Hierarchy

*   **Glassmorphism Effects**: Translucent panels using Tailwind backdrop blur utilities (`backdrop-blur-md bg-white/70` or `bg-zinc-900/80`) to generate depth.
*   **Shimmer Loading Skeletons**: A custom `@keyframes shimmer` slide translation effect is applied to skeleton components to make data fetching processes feel smooth.
*   **Clickable Cursor Pointer**: Custom global declaration ensuring pointer cursors appear on all interactive components like buttons, checkboxes, custom list items, and dropdown choices.
*   **Chart.js Integration**: Dashboard analytics render using dynamic line, bar, doughnut, and radar chart configurations designed to match active theme colors.
