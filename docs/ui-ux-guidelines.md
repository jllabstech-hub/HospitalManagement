# UI/UX & Accessibility Guidelines (Phase 7D)

This document outlines the visual design system, accessibility standards, responsive layout conventions, and component patterns for the **Hospital Appointment Management System**.

---

## 1. Healthcare Design Aesthetics
- **Clean Clinical Palette:** Light neutral backgrounds (`bg-slate-50`, `bg-white`), slate typography (`text-slate-900`, `text-slate-700`), and healthcare blue primary accents (`bg-blue-600`, `hover:bg-blue-700`).
- **Restrained Motion:** Subtle transition feedback (`transition duration-200`) on interactive buttons and modal overlays. No flashy, distracting animations or dark/neon aesthetics.
- **High Contrast & Trust:** All text elements meet WCAG 2.1 AA minimum contrast standards against light backgrounds.

---

## 2. Typography & Hierarchy
| Hierarchy Level | Tailwind Classes | Semantic Element | Use Case |
| :--- | :--- | :--- | :--- |
| **Page Header** | `text-2xl font-bold text-slate-800` | `<h1>` | Main portal page headers |
| **Section Title** | `text-lg font-bold text-slate-800` | `<h2>` | Sub-sections, card grid headers |
| **Card Title** | `text-base font-semibold text-slate-900` | `<h3>` | Doctor names, appointment details |
| **Body Text** | `text-sm text-slate-700` | `<p>`, `<span>` | Primary content, form inputs |
| **Secondary Text**| `text-xs text-slate-500` | `<p>`, `<span>` | Metadata, timestamps, helper notes |

---

## 3. Status Badges & Semantic Colors
Status communicates state via **Text Label + Distinct Background & Border Styling**:

| Status | Color Palette | Badge Styling |
| :--- | :--- | :--- |
| `BOOKED` | **Blue** | `bg-blue-50 text-blue-700 border-blue-200` |
| `CONFIRMED` | **Indigo** | `bg-indigo-50 text-indigo-700 border-indigo-200` |
| `COMPLETED` | **Emerald** | `bg-emerald-50 text-emerald-800 border-emerald-200` |
| `CANCELLED` | **Rose** | `bg-rose-50 text-rose-700 border-rose-200` |
| `NO_SHOW` | **Amber** | `bg-amber-50 text-amber-800 border-amber-200` |

---

## 4. Accessibility & Keyboard Navigation (WCAG 2.1 AA)
1. **Modal Dialogs ([`ConfirmDialog.tsx`](file:///e:/HopsitalAppointmentSystem/src/components/shared/ConfirmDialog.tsx)):**
   - Implements `role="dialog"` and `aria-modal="true"`.
   - `aria-labelledby` points to modal title header.
   - Listens for `Escape` keypress to close dialog naturally.
2. **Focus Management:**
   - Interactive controls (buttons, links, inputs, selects) preserve visible focus rings (`focus:ring-2 focus:ring-blue-500 focus:outline-none`).
3. **Form Fields:**
   - Explicit `<label htmlFor="field-id">` relationships bound to all `<input>` and `<select>` controls.
   - Field errors displayed directly below corresponding inputs in high-contrast red (`text-xs text-red-600`).

---

## 5. Responsive Breakpoint Conventions
- **Mobile Viewports (320px – 768px):** Single-column stacked cards, responsive table horizontal scrolling wrappers (`overflow-x-auto`), touch-friendly 44px minimum target sizes.
- **Tablet / Small Desktop (768px – 1024px):** 2-column doctor discovery grids and compact data tables.
- **Large Desktop (1024px+):** Sidebar navigation layout with full multi-column admin data tables and doctor queues.
