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

## 2025-07-25 - [Isolated Keyboard Shortcuts vs. Global Listeners]
**Learning:** Component-specific keyboard shortcuts (like Escape to clear) must be implemented locally on the relevant input elements (e.g., via `onKeyDown`) rather than as global window listeners. Global listeners can cause unintended side effects, such as clearing a tool's state when a user tries to close a global search modal or clear a header input.
**Action:** Always prefer local `onKeyDown` handlers for tool-specific shortcuts to ensure behavior isolation and avoid collisions with global UI elements.

## 2025-08-10 - [Hybrid Keyboard Shortcut Implementation]
**Learning:** Combining local `onKeyDown` handlers (for inputs) with global window listeners (for blurred states) provides the most robust power-user experience. This ensures that 'Escape' can clear a field while typing, but also reset the tool's state even when the user is just navigating the page, provided that global listeners are gated by `isInputFocused` and modifier key checks.
**Action:** Use a hybrid listener pattern for standard tool shortcuts (Escape/Clear, C/Copy) to ensure responsiveness regardless of the current focus target.

## 2026-06-24 - [Search Accessibility & Focus Management]
**Learning:** Dynamic search results are invisible to screen readers without a live region, and clicking "Clear" in empty states often leaves focus on a now-hidden element or resets it to the body, breaking the user's flow.
**Action:** Always implement an `aria-live="polite"` region to announce item counts in filterable lists, and use `useRef` to programmatically restore focus to the search input when clear/reset actions are triggered in empty states.

## 2025-05-14 - [Search Input UX Standard]
**Learning:** Tool and category search inputs often suffer from browser/mobile UI interference (autofill, spellcheck) and broken keyboard flow when cleared.
**Action:** Always include `autoComplete="off"` and `spellCheck={false}` on search inputs, and ensure focus is programmatically returned to the input field after a "clear" interaction to maintain a seamless UX.

## 2025-08-16 - [Standardized Keyboard Shortcut Component]
**Learning:** Hardcoded 'Ctrl' shortcut hints are inaccurate for Mac users and lead to inconsistent UI styling. A dedicated component that detects the OS ensures accurate instructions and visual uniformity across the application.
**Action:** Use the `Kbd` component for all keyboard shortcut hints. It handles the ⌘ vs Ctrl logic automatically and provides a standard accessible `<kbd>` element with consistent styling.

## 2025-09-02 - [Standardized UX Feedback for List Actions]
**Learning:** Individual row-level copy actions in tools (e.g., list views) should update a local `copiedRowIndex` state to briefly change the specific row's icon to a `Check` and apply a success-themed background (e.g., `bg-emerald-500`), paired with a global `sonner` success toast. This provides both local (precise) and global (action confirmed) feedback.
**Action:** Implement the `copiedRowIndex` pattern for all list-based tool actions to ensure high-clarity interaction feedback.

## 2026-07-02 - [Standardized UX Feedback for Output Actions]
**Learning:** Global tool output copy actions (e.g., in `Calculator.tsx`, `UnitConverter.tsx`, `BPMCounter.tsx`) often rely only on local visual feedback (like icon changes) which can be missed. A global `sonner` success toast provides consistent, high-visibility confirmation across different tool types.
**Action:** Always pair tool output copy actions with a global success toast using the `common.copied` key to ensure unambiguous user feedback.

## 2026-07-03 - [Safe Global Keyboard Listener Isolation]
**Learning:** Global keyboard listeners (e.g. Escape to clear) can cause unintended side effects (clearing the wrong input or stealing focus) when the user is interacting with global UI elements like Search bars or Command Menus.
**Action:** Global keyboard listeners must explicitly verify that the focus is either on the relevant component's input/textarea or that no other editable element has focus (`if (isEditable && activeElement !== targetRef.current) return;`) before executing actions.

## 2026-07-09 - Standardized UI and Shortcut Pattern
**Learning:** Tools should implement a unified 'Reset' or 'Clear' pattern paired with an 'Escape' shortcut, and copy actions should trigger global toast notifications via 'sonner' for consistent user feedback. The 'handlersRef' pattern is essential for stable keyboard listeners in React components.
**Action:** Implemented these patterns across FractionCalculator, UnitConverter, CaseConverter, NumberStatistics, JSONToSQL, RandomGenerator, and BMICalculator.

## 2025-08-20 - [Shortcut Hints and Test Assertions]
**Learning:** When improving accessibility by appending keyboard shortcut hints to `aria-label` or `title` attributes (e.g., changing "Copy" to "Copy (C)"), existing functional tests (like Playwright) that assert on these specific labels will break.
**Action:** Always audit and update associated end-to-end tests when modifying user-facing labels for accessibility to ensure they account for the appended shortcut hints.

## 2025-08-25 - [Inclusive Search Announcements]
**Learning:** Standard search result announcements using `aria-live` often only trigger on text input changes. Users filtering by category or other non-textual UI controls are left without confirmation of the resulting list update.
**Action:** Configure `aria-live` regions to announce result counts whenever *any* filter state (search query, category selection, etc.) changes, ensuring a consistent experience for assistive technology users.

## 2026-07-20 - [Auto-Extracting Relational Prisma Schemas]
**Learning:** When generating schema structures (like Prisma Schema) from nested JSON, parsing child records recursively and auto-configuring relations with back-references and foreign key mappings drastically reduces database design complexity for developer users.
**Action:** Implement automatic relation mapping and foreign key references when converting JSON schemas to database-compatible schemas.

## 2026-07-21 - [Focus Management on Resetting Interactive Components]
**Learning:** Clearing or resetting complex interactive components (such as grids of selection buttons) without programmatically returning focus can leave keyboard and screen reader users with lost focus or a disrupted flow.
**Action:** Use a `useRef` hook to target the first active or primary interactive element in the component and invoke `.focus()` programmatically upon resetting the state.

## 2026-07-22 - [Refining Form Associations and Event Isolation for Strength Tools]
**Learning:** Generic labels (like "Length" on a password input) degrade screen-reader experiences and confuse search indexing. Additionally, keyboard shortcut mechanisms (like Escape to clear or C to copy) on inputs should prioritize focus checks and keep handlers clean via React's standard `handlersRef` within `useEffect` to prevent collisions.
**Action:** Always ensure the target form control uses a context-appropriate label (e.g. "Password") and isolate the event listeners to ensure they don't intercept typing when editable fields are focused.
