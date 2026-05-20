## 2025-05-15 - [Keyboard Visibility for Hover-Only Elements]
**Learning:** Elements hidden with `opacity-0` and revealed via `group-hover:opacity-100` are invisible to keyboard users when focused, making critical utilities (like Copy) inaccessible.
**Action:** Always pair `md:group-hover:opacity-100` with `md:focus-visible:opacity-100` and ensure a higher `z-index` (e.g., `z-20`) so the focus ring is not obscured by surrounding container borders.

## 2025-05-15 - [State Communication for Preset Buttons]
**Learning:** Visual-only active states for preset buttons (like tip percentages) do not communicate selection to assistive technologies.
**Action:** Implement `aria-pressed={isActive}` on all mutually exclusive selection buttons to ensure standard-compliant screen reader feedback.

## 2025-05-30 - [Search Keyboard Shortcuts & Navigation]
**Learning:** Adding standard keyboard shortcuts (Escape to clear, Enter to select first result) to a global search input significantly improves the speed and accessibility for power users. It reduces reliance on mouse interaction for the primary navigation entry point.
**Action:** Prioritize standard keyboard interaction patterns (Escape/Enter) for search and filter inputs in future tools.

## 2025-05-31 - [Recent Tools in Command Menu & Global Localization]
**Learning:** Integrating a 'Recent Tools' section into the global command menu (Ctrl+K) provides a significant usability boost for returning users, mirroring the dashboard experience in a modal context. Additionally, global UI elements like 'Skip to Content' links and theme/language toggles require explicit ARIA labeling and localization to be fully accessible.
**Action:** Always consider including a 'Recently Used' or 'Favorites' section in searchable command palettes. Ensure all top-level UI components use `useTranslation` for localized `aria-label` and `title` attributes.

## 2025-06-15 - [ARIA Live Regions for Real-Time Results]
**Learning:** Tools that perform real-time calculations (like Percentage or BMI calculators) require `aria-live="polite"` on the result containers. Using `aria-atomic="true"` ensures the entire result (including labels or units) is re-announced, providing necessary context that would be lost if only a single changing digit was announced.
**Action:** Always implement `aria-live="polite"` and `aria-atomic="true"` on dynamic result displays to ensure screen reader users receive automatic and contextual updates as they type.

## 2025-06-20 - [ARIA Live Regions & Localized Keyboard Hints]
**Learning:** Interactive results that change based on user input (e.g., contrast ratios) require `aria-live="polite"` to be announced by screen readers. Furthermore, keyboard shortcuts (like 'S' for swapping colors) are hidden features unless explicitly documented in localized ARIA labels and titles.
**Action:** Always wrap dynamic calculation results in an ARIA live region (`aria-live="polite"`, `aria-atomic="true"`) and ensure that interactive elements with keyboard shortcuts include the shortcut key (e.g., `(S)`) in their localized labels.

## 2025-06-25 - [Dynamic Feedback & Contextual ARIA Results]
**Learning:** In tools like the BMI Calculator, providing visual highlighting in reference grids (like WHO classifications) based on user input significantly reduces cognitive load. Furthermore, consolidating the numerical result and its textual label (e.g., "Normal") into a single ARIA live region ensures screen reader users receive the full context of their status in one announcement.
**Action:** Use dynamic state-based highlighting for classification grids. Always wrap complex multi-part results in a single container with `aria-live="polite"` and `aria-atomic="true"`.
