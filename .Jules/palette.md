## 2024-05-22 - [Interactive Color Preview & Accessibility]
**Learning:** Icon-only buttons must have descriptive ARIA labels in the same language as the rest of the UI (French in this case) for screen reader accessibility. When overlaying a hidden interactive element (like a color picker) on a visual preview, it is crucial to use `focus-within` on the parent to provide a visible focus indicator for keyboard users.
**Action:** Always add ARIA labels to icon buttons and ensure focus visibility for overlaid inputs next time.

## 2026-01-25 - [Search Input UX and Global A11y]
**Learning:** Adding a 'Clear' button to a search input is a highly appreciated micro-UX that significantly improves usability on mobile. Additionally, icon-only buttons like favorite toggles are often missed in accessibility audits but are critical for screen reader users.
**Action:** Always include a clear button for search inputs and ensure all icon-only buttons have descriptive aria-labels in the target language.

## 2025-05-15 - [Keyboard Shortcuts & Semantic Navigation]
**Learning:** Adding a global keyboard shortcut (like '/') to focus the primary search or action significantly improves the "pro" feel of a tool-based dashboard. Coupling this with a visual `<kbd>` hint ensures the feature is discoverable. Additionally, using semantic icons (e.g., `ArrowLeft` instead of rotated `ArrowRight`) and `aria-pressed` for toggles are high-impact micro-UX improvements that combine accessibility with cleaner code.
**Action:** Consider search focus shortcuts for dashboards and prioritize semantic icons over CSS transforms for basic navigation.

## 2024-05-23 - [Functional Micro-Interactions & Semantic Icons]
**Learning:** Transforming decorative icons into functional "Swap" buttons (with appropriate `aria-label`) in conversion tools significantly enhances usability by reducing user input steps. Using orientation-aware icons (`ArrowLeftRight` for horizontal, `ArrowUpDown` for vertical) and micro-animations (like `rotate-180` on hover) adds a layer of delight that makes the tool feel responsive and polished.
**Action:** Always look for opportunities to turn static icons between inputs into functional controls in conversion-based utilities.
