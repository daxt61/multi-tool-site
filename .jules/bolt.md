## 2026-05-21 - [Bundle Size Optimization via Code Splitting]
**Learning:** In a multi-tool application where tools are independent, static imports in the main entry point cause massive bundle bloat. React.lazy and Suspense are highly effective here, reducing the initial JS payload by ~40% (from 386kB to 228kB) without affecting functionality.
**Action:** Always prefer dynamic imports for modular components in dashboard-style applications to keep the critical path lean.
