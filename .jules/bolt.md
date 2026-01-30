## 2026-05-21 - [Bundle Size Optimization via Code Splitting]
**Learning:** In a multi-tool application where tools are independent, static imports in the main entry point cause massive bundle bloat. React.lazy and Suspense are highly effective here, reducing the initial JS payload by ~40% (from 386kB to 228kB) without affecting functionality.
**Action:** Always prefer dynamic imports for modular components in dashboard-style applications to keep the critical path lean.

## 2026-01-25 - [Eliminating Redundant Static Imports]
**Learning:** Redundant static imports in files already using React.lazy negate the benefits of code splitting because the components are still included in the main bundle. Removing these static imports and ensuring all modular components use lazy loading is critical for maintaining a small initial bundle size.
**Action:** Regularly audit entry points for static imports that shadow or duplicate lazy-loaded components.

## 2026-01-27 - [Optimizing Dashboard Grid and Lookups]
**Learning:** For dashboard-style applications with many items, combining React.memo for item cards, useDeferredValue for search inputs, and O(1) Map/Set lookups for filtering/retrieval eliminates UI stuttering and redundant computations. Even small lists (~40 items) benefit noticeably from avoiding complete grid re-renders on every keystroke.
**Action:** Always pair expensive list filtering with useDeferredValue and ensure item components are memoized with stable callback references.

## 2026-05-22 - [Search Indexing and Static Data Decoupling]
**Learning:** Even with useDeferredValue, search filtering can be optimized by pre-calculating expensive string transformations (like .toLowerCase()) into a Map or secondary index. In components with high-frequency user input (like UnitConverter), defining large static objects inside the component causes redundant allocations and GC pressure on every keystroke.
**Action:** Always pre-calculate search searchable fields at the module level and move large static configuration objects out of React components.
