## 2025-05-15 - [Keyboard Visibility for Hover-Only Elements]
**Learning:** Elements hidden with `opacity-0` and revealed via `group-hover:opacity-100` are invisible to keyboard users when focused, making critical utilities (like Copy) inaccessible.
**Action:** Always pair `md:group-hover:opacity-100` with `md:focus-visible:opacity-100` and ensure a higher `z-index` (e.g., `z-20`) so the focus ring is not obscured by surrounding container borders.

## 2025-05-15 - [State Communication for Preset Buttons]
**Learning:** Visual-only active states for preset buttons (like tip percentages) do not communicate selection to assistive technologies.
**Action:** Implement `aria-pressed={isActive}` on all mutually exclusive selection buttons to ensure standard-compliant screen reader feedback.

## 2025-05-30 - [Search Keyboard Shortcuts & Navigation]
**Learning:** Adding standard keyboard shortcuts (Escape to clear, Enter to select first result) to a global search input significantly improves the speed and accessibility for power users. It reduces reliance on mouse interaction for the primary navigation entry point.
**Action:** Prioritize standard keyboard interaction patterns (Escape/Enter) for search and filter inputs in future tools.

## 2025-06-12 - [Consistency in Utility Patterns]
**Learning:** Providing a "Reset" utility button using the `RotateCcw` icon and `rose-500` styling is a well-established pattern in this repository that users expect for clearing complex states. Additionally, enabling URL state sharing via `initialData` and `onStateChange` props allows users to share their specific configurations, which is a major UX win for utility tools.
**Action:** Always check if a tool can benefit from a Reset button or state sharing to maintain repository-wide UX consistency.

## 2025-07-20 - [Dashboard Information Density & Contrast]
**Learning:** Adding tool counts to category filters provides immediate value by informing users about tool distribution at a glance. Additionally, auditing secondary text contrast (e.g., changing text-slate-400 to text-slate-500) is a critical micro-UX step to ensure WCAG AA compliance for section headers and labels.
**Action:** For collection-based dashboards, display item counts in filter badges and ensure all informational labels meet a minimum 4.5:1 contrast ratio.
