## 2025-05-15 - [Keyboard Visibility for Hover-Only Elements]
**Learning:** Elements hidden with `opacity-0` and revealed via `group-hover:opacity-100` are invisible to keyboard users when focused, making critical utilities (like Copy) inaccessible.
**Action:** Always pair `md:group-hover:opacity-100` with `md:focus-visible:opacity-100` and ensure a higher `z-index` (e.g., `z-20`) so the focus ring is not obscured by surrounding container borders.

## 2025-05-15 - [State Communication for Preset Buttons]
**Learning:** Visual-only active states for preset buttons (like tip percentages) do not communicate selection to assistive technologies.
**Action:** Implement `aria-pressed={isActive}` on all mutually exclusive selection buttons to ensure standard-compliant screen reader feedback.
