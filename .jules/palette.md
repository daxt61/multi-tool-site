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

## 2026-06-01 - [Interactive Groups & Focus Visibility]
**Learning:** For utility buttons inside a `group` (like Copy/Download on a result card), using `group-hover:opacity-100` only covers mouse users. `focus-within:opacity-100` on the group container ensures the buttons become and stay visible when any button inside the group receives keyboard focus.
**Action:** Always use `group-hover:opacity-100 focus-within:opacity-100` for toolbars that should be revealed on interaction.

## 2025-06-30 - [Tab Roles & Live Regions for Password Security]
**Learning:** Mode selectors that switch between different generation logic (like Random vs. Passphrase) should follow ARIA tab patterns (`role="tablist"`, `role="tab"`) for clear navigation. Dynamic security indicators (strength bars) benefit from `aria-live="polite"` to provide immediate feedback to screen reader users as they modify settings.
**Action:** Use standard ARIA tab roles for mutually exclusive configuration modes. Implement live regions for real-time status indicators in security-sensitive tools.

## 2025-08-15 - [OS-Aware Keyboard Shortcut Hints]
**Learning:** Hardcoding platform-specific shortcuts (like 'Ctrl+K') in translation files creates a confusing experience for Mac users who expect '⌘K'. Dynamic label construction improves both clarity and perceived polish.
**Action:** Use a centralized platform detection logic to dynamically append the correct modifier (⌘ or Ctrl) to localized accessibility labels and visual hints.

## 2025-07-30 - [Modern Feature Toggles in Code Generators]
**Learning:** For language-specific code generators (like JSON to C#), providing toggles for modern syntax (e.g., Records, init-only properties) significantly improves the utility for developers using newer framework versions.
**Action:** When creating or upgrading code generators, research the latest stable language features and provide opt-in toggles for them.

## 2025-07-30 - [Custom Character Overrides in Visual Tools]
**Learning:** In tools that generate visual output using characters (like ASCII Art), allowing the user to override the "ink" character provides more creative control and accessibility for different display environments.
**Action:** Implement "Custom Character" inputs for char-based generation tools, defaulting to standard symbols (e.g., █).

## 2026-03-20 - [Multi-Column Text and Line Formatting UX]
**Learning:** Utilities that parse space-delimited text into columns can collapse adjacent spaces by default to handle arbitrary spaces from terminal outputs (e.g., ps/docker outputs), but should preserve exact values if desired. Also, storing intermediate tabular row grids as `string[][]` arrays instead of plain objects avoids any Prototype Pollution natively.
**Action:** Always prefer array grids `string[][]` over plain object properties when parsing raw multi-column tables. Provide a checkbox to toggle collapsing of adjacent delimiters.

## 2026-07-18 - [Interactive Handle Accessibility in Graphical Editors]
**Learning:** Purely mouse-driven click-and-drag markers (such as handles in a visual CSS clip-path editor) can exclude keyboard or assistive technology users if alternative inputs (such as input forms or slider controls) are missing or not explicitly labeled.
**Action:** Always pair interactive graphical handles with explicit numeric/slider inputs to allow multiple redundant methods of control.
