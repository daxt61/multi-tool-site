## 2024-05-22 - [Interactive Color Preview & Accessibility]
**Learning:** Icon-only buttons must have descriptive ARIA labels in the same language as the rest of the UI (French in this case) for screen reader accessibility. When overlaying a hidden interactive element (like a color picker) on a visual preview, it is crucial to use `focus-within` on the parent to provide a visible focus indicator for keyboard users.
**Action:** Always add ARIA labels to icon buttons and ensure focus visibility for overlaid inputs next time.

## 2026-01-25 - [Search Input UX and Global A11y]
**Learning:** Adding a 'Clear' button to a search input is a highly appreciated micro-UX that significantly improves usability on mobile. Additionally, icon-only buttons like favorite toggles are often missed in accessibility audits but are critical for screen reader users.
**Action:** Always include a clear button for search inputs and ensure all icon-only buttons have descriptive aria-labels in the target language.
