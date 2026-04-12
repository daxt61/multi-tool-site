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

## 2025-05-24 - [Global Navigation & Tool Metadata Polish]
**Learning:** For tool-based applications, the "Copy link" feature is a vital micro-UX that users expect for sharing specific configurations. Additionally, ensuring that metadata badges (like categories) use consistent icons and localized names from a central configuration, rather than tool-specific icons, improves the application's taxonomic clarity. Coupling this with global accessibility landmarks like "Skip to content" links and semantic `<main>` tags ensures a professional and inclusive user experience.
**Action:** Prioritize "Copy link" utilities in tool views and audit metadata badges for taxonomic consistency. Always implement "Skip to content" for keyboard accessibility.

## 2025-05-25 - [BPM Counter Modernization & Semantic Buttons]
**Learning:** Using semantic `<button>` elements for primary interactions (like tapping) instead of non-semantic `divs` is essential for keyboard accessibility (Tab focus) and screen reader support. Additionally, unifying legacy `gray` color palettes to the modern `slate` system significantly improves visual cohesion in a Bento-styled application. Adding a "Copy" utility with immediate visual feedback (success color state) is a high-value micro-UX that users expect in output-driven tools.
**Action:** Always prefer semantic buttons over interactive divs and ensure color palette consistency across all tool components.

## 2025-05-26 - [Bento Card Grid & UI De-cluttering]
**Learning:** For tools with multiple output formats (like case conversion), a responsive grid of standardized cards provides the best scannability. Each card should have its own localized "Copy" utility with immediate success feedback. Additionally, removing legacy UI clutter (like old ad placeholders) during modernization significantly improves the focus and "delight" of the tool.
**Action:** Use a card grid for multi-output tools and prioritize removing non-essential legacy components to achieve a "blank slate" professional feel during modernization.

## 2025-05-27 - [Contextual Reference & Educational UX]
**Learning:** For specialized utility tools (like Morse code), providing a contextual reference card and educational sections significantly increases the "perceived value" and usability of the tool. It transforms a simple converter into a learning resource. Additionally, ensuring that both inputs (source and target) have independent utility buttons (Copy/Clear) creates a more flexible and "professional" interaction model.
**Action:** Include reference data and educational context for specialized tools next time to improve user retention and delight.

## 2025-05-28 - [Multi-Input Converter UX & State Syncing]
**Learning:** For multi-input converters (like base conversion), users expect all fields to stay perfectly synchronized, including clearing all outputs when a source input is emptied. Adding a global "Clear All" (Effacer tout) button provides a high-value escape hatch for resetting complex states. Standardizing the "Copy" success state to a subtle emerald background (instead of solid) maintains visual hierarchy while providing clear feedback.
**Action:** Implement "Clear All" and state synchronization for any tool with interdependent inputs.

## 2025-05-29 - [Bento Standardized Reset & Global A11y]
**Learning:** In a multi-panel tool layout, placing a global "Effacer tout" (Clear all) button at the top-right of the main container provides a clear and expected reset mechanism that reduces cognitive load. Additionally, ensuring that all interactive elements (like textareas) have explicit `id` and `label` associations is a critical baseline for accessibility that often gets overlooked in "fast" development.
**Action:** Always prioritize a global reset button for multi-input tools and audit for missing input-label associations to ensure baseline a11y.

## 2026-04-05 - [Formatted Output Copy & Semantic Labels]
**Learning:** For calculation tools with multi-part results (like age in years, months, days), providing a "Copy" utility that formats the raw data into a natural language sentence (e.g., using "et" for the last item) significantly reduces user effort for sharing. Additionally, transforming generic headers into semantic `<label>` elements with `cursor-pointer` and `htmlFor` associations is a low-effort, high-impact accessibility win that improves both screen reader support and hit area for all users.
**Action:** Implement natural language formatting for multi-part copies and prioritize semantic label associations for all primary inputs.

## 2026-04-05 - [Section-wise Reset & Download Utilities]
**Learning:** For complex calculators with multiple distinct sections (like percentage variations), adding localized "Effacer" buttons to each section provides a more granular and efficient UX than a single global reset. Furthermore, adding a "Télécharger" utility to conversion tools allows users to persist their work as a physical file (.txt), which is a high-value utility that transforms the site from a simple viewer into a productivity workbench.
**Action:** Prioritize section-wise reset buttons for complex calculators and implement download utilities for conversion-heavy tools.

## 2026-04-06 - [Dark Mode Success States & Consistent Focus]
**Learning:** Standardizing success/active states with dark mode specific variants (e.g., `dark:bg-emerald-500/10` and `dark:text-emerald-400`) ensures UI feedback remains legible and visually pleasing across themes. Additionally, applying a consistent `focus-visible:ring-2` pattern to all global navigation elements (search utilities, back links, toggles) is a high-impact accessibility win that provides a professional feel for keyboard-driven navigation.
**Action:** Always implement theme-aware success states and audit for consistent focus indicators on all high-level interactive elements.

## 2026-04-07 - [Informative Tool Utilities & Actionable UX]
**Learning:** Purely informative or detection-based tools (like IP Address detection) are often overlooked when it comes to standard utility buttons like "Copy". However, the primary user intent for these tools is often to capture and use the detected data. Adding a "Copy" utility transforms these tools from passive displays into active, actionable utilities.
**Action:** Always audit informative tools for "Copy" utilities to ensure they meet the user's ultimate goal of data portability.

## 2026-04-10 - [Keyboard Accessibility & Feedback Standardization]
**Learning:** Global navigation elements like logo links and theme toggles are often overlooked for keyboard focus states, but adding consistent `focus-visible` rings is a high-impact accessibility win. Additionally, standardizing "Copy" feedback to use a subtle emerald background (instead of just icon color changes) provides much clearer visual confirmation of success, especially in complex utility tools.
**Action:** Always audit global navigation for focus indicators and prioritize the standardized emerald success state for all "Copy" utilities.

## 2026-04-15 - [Safe Global Keyboard Shortcuts & Memoized State]
**Learning:** Implementing global keyboard shortcuts (like Space for regeneration) can regress accessibility if they hijack native browser behaviors like scrolling or button activation. Restricting such shortcuts to when `document.activeElement` is the `body` ensures they only trigger when no other interactive element is focused. Additionally, for tools with frequent regeneration, memoizing the generation logic with `useCallback` prevents unnecessary effect re-runs when state (like a "Copied" toast) changes.
**Action:** Always check `activeElement` before preventing default on common keys and prioritize `useCallback` for generation handlers that are dependencies of keyboard listeners.
