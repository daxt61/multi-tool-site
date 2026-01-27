## 2026-05-21 - [Bundle Size Optimization via Code Splitting]
**Learning:** In a multi-tool application where tools are independent, static imports in the main entry point cause massive bundle bloat. React.lazy and Suspense are highly effective here, reducing the initial JS payload by ~40% (from 386kB to 228kB) without affecting functionality.
**Action:** Always prefer dynamic imports for modular components in dashboard-style applications to keep the critical path lean.

## 2026-01-25 - [Eliminating Redundant Static Imports]
**Learning:** Redundant static imports in files already using React.lazy negate the benefits of code splitting because the components are still included in the main bundle. Removing these static imports and ensuring all modular components use lazy loading is critical for maintaining a small initial bundle size.
**Action:** Regularly audit entry points for static imports that shadow or duplicate lazy-loaded components.

## 2026-05-22 - [Optimizing Large List Re-renders and Search Responsiveness]
**Learning:** In applications with 50+ items in a grid, typing in a search bar can feel sluggish due to the synchronous re-rendering of all list items on every keystroke. Using `useDeferredValue` for the search query allows the input field to remain responsive while the expensive list filtering and re-rendering happen at a lower priority. Combining this with `React.memo` for list items and `useCallback` for stable event handlers drastically reduces the reconciliation work per keystroke.
**Action:** Use `useDeferredValue` for real-time search inputs in heavy UI lists, and ensure list items are memoized to skip unnecessary re-renders.
