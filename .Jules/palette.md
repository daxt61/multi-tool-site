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

## 2025-05-23 - [Utility Tool Micro-UX & a11y]
**Learning:** For utility-heavy tools like calculators, "Clear" and "Copy" buttons are high-impact micro-UX features that users expect. Additionally, always ensure that all inputs (including number and range types) are properly linked to labels with `id` and `htmlFor` to maintain baseline accessibility.
**Action:** Prioritize adding reset and copy features to utility tools and audit components for missing input-label associations.

## 2025-02-03 - [Stable Generation & Bento Consistency]
**Learning:** In text generation tools, random output must be stabilized using `useMemo` to prevent frustrating regenerations during unrelated state updates (like "Copied" feedback). Additionally, modernizing legacy components to the Bento design system (slate-50 backgrounds, rounded-3xl corners, indigo accents) significantly improves brand cohesion and trust.
**Action:** Use `useMemo` for random text and prioritize visual alignment with the Bento system for older components.

## 2026-06-10 - [Accent-Insensitive Search & Robust UX]
**Learning:** For a global search feature, especially in a localized application, diacritic normalization (NFD) is essential for a frictionless UX. Additionally, pairing a search focus shortcut (/) with a clear shortcut (Esc) and a visual <kbd> hint creates a "pro" and accessible experience.
**Action:** Implement NFD normalization for all search features and provide clear keyboard navigation hints.

## 2026-06-11 - [Enhanced Utility Micro-UX]
**Learning:** Utility tools like list cleaners or IP tools benefit greatly from "Copy" features and "Tactile" feedback (active:scale-95). Adding temporary visual states (like turning the background emerald on copy) provides immediate, non-intrusive confirmation that improves the tool's perceived quality.
**Action:** Always include copy-to-clipboard buttons and tactile feedback for primary actions in utility tools.
