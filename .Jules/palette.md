## 2024-05-22 - [Interactive Color Preview & Accessibility]
**Learning:** Icon-only buttons must have descriptive ARIA labels in the same language as the rest of the UI (French in this case) for screen reader accessibility. When overlaying a hidden interactive element (like a color picker) on a visual preview, it is crucial to use `focus-within` on the parent to provide a visible focus indicator for keyboard users.
**Action:** Always add ARIA labels to icon buttons and ensure focus visibility for overlaid inputs next time.

## 2026-01-25 - [Search Input UX and Global A11y]
**Learning:** Adding a 'Clear' button to a search input is a highly appreciated micro-UX that significantly improves usability on mobile. Additionally, icon-only buttons like favorite toggles are often missed in accessibility audits but are critical for screen reader users.
**Action:** Always include a clear button for search inputs and ensure all icon-only buttons have descriptive aria-labels in the target language.

## 2025-05-15 - [Keyboard Shortcuts & Semantic Navigation]
**Learning:** Adding a global keyboard shortcut (like '/') to focus the primary search or action significantly improves the "pro" feel of a tool-based dashboard. Coupling this with a visual `<kbd>` hint ensures the feature is discoverable. Additionally, using semantic icons (e.g., `ArrowLeft` instead of rotated `ArrowRight`) and `aria-pressed` for toggles are high-impact micro-UX improvements that combine accessibility with cleaner code.
**Action:** Consider search focus shortcuts for dashboards and prioritize semantic icons over CSS transforms for basic navigation.

## 2025-05-16 - [Semantic Navigation & Valid HTML Structure]
**Learning:** Avoid nesting buttons inside buttons or links as it is invalid HTML and breaks keyboard/screen reader navigation. Instead, use a `div` container with a "stretched link" (absolute button with `z-10`) and place other interactive elements (like favorites) as siblings with higher `z-index`. Additionally, use semantic icons like `ArrowLeft` instead of rotated icons for back navigation to maintain consistency and clarity.
**Action:** Use the `z-index` stacking pattern for complex cards and prioritize semantic icons over CSS transforms.

## 2026-01-26 - [Interactive Feedback & Reset Actions]
**Learning:** For utility tools like calculators, providing immediate interactive feedback (like a "Copy" button with success state) and a clear way to reset the form ("Clear" button) significantly reduces friction. Additionally, ensuring all form inputs are explicitly linked to labels via `id` and `htmlFor` is a fundamental accessibility requirement that also improves the clickable area for users.
**Action:** Always include reset and copy actions for calculator tools, and ensure strict `id`/`htmlFor` associations for all form elements.
