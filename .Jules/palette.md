## 2024-05-22 - [Interactive Color Preview & Accessibility]
**Learning:** Icon-only buttons must have descriptive ARIA labels in the same language as the rest of the UI (French in this case) for screen reader accessibility. When overlaying a hidden interactive element (like a color picker) on a visual preview, it is crucial to use `focus-within` on the parent to provide a visible focus indicator for keyboard users.
**Action:** Always add ARIA labels to icon buttons and ensure focus visibility for overlaid inputs next time.

## 2026-01-25 - [Search Input UX and Global A11y]
**Learning:** Adding a 'Clear' button to a search input is a highly appreciated micro-UX that significantly improves usability on mobile. Additionally, icon-only buttons like favorite toggles are often missed in accessibility audits but are critical for screen reader users.
**Action:** Always include a clear button for search inputs and ensure all icon-only buttons have descriptive aria-labels in the target language.

## 2026-02-03 - [Password Generator Accessibility & Focus Indicators]
**Learning:** For interactive tools like the Password Generator, it is essential to provide multiple layers of accessibility: localized ARIA labels for icon-only buttons, proper label-input association for sliders, and 'role="progressbar"' with dynamic 'aria-valuenow' for strength meters. Additionally, when the main interaction element has 'outline-none', using 'focus-within:ring' on its container ensures that keyboard users have a clear visual focus indicator.
**Action:** Always implement full ARIA suites (labels, roles, states) for interactive tools and ensure focus visibility on containers when internal inputs are unstyled.
