/**
 * Performance Benchmark Suite
 *
 * This module exports utilities and runs performance benchmarks for the Beads IDE.
 *
 * ## Performance Targets (from spec)
 *
 * | Metric                   | Target     | Benchmark File            |
 * |--------------------------|------------|---------------------------|
 * | Graph render (50 beads)  | <1s        | graph-render.bench.ts     |
 * | Graph render (100 beads) | <1s        | graph-render.bench.ts     |
 * | Graph render (200 beads) | <1s        | graph-render.bench.ts     |
 * | Pan latency              | <100ms     | interactions.bench.ts     |
 * | Zoom latency             | <100ms     | interactions.bench.ts     |
 * | Drag latency             | <100ms     | interactions.bench.ts     |
 * | Search/filter (200 beads)| <100ms     | filters.bench.ts          |
 * | Cook debounce            | 500ms      | cook-debounce.test.ts     |
 * | Mode switch latency      | <100ms     | visual-builder.bench.ts   |
 * | Node selection latency   | <50ms      | visual-builder.bench.ts   |
 * | Initial render (50 steps)| <500ms     | visual-builder.bench.ts   |
 *
 * ## Running Benchmarks
 *
 * ```bash
 * # Run all benchmarks
 * pnpm run bench:perf
 *
 * # Run specific benchmark file
 * npx vitest bench tests/performance/graph-render.bench.ts
 *
 * # Run visual builder benchmarks
 * npx vitest bench tests/performance/visual-builder.bench.ts
 *
 * # Run debounce tests
 * npx vitest run tests/performance/cook-debounce.test.ts
 * ```
 *
 * ## Measurement Methodology
 *
 * - Graph render: Measured via Performance API (performance.now())
 * - Interactions: Data transformation time (viewport not included)
 * - Filters: Client-side array operations
 * - Cook debounce: Timing validation with fake timers
 * - Mode switch: Data transformation + layout computation
 * - Node selection: State updates + adjacency computation
 * - Initial render: Full formula processing pipeline
 *
 * For full browser rendering benchmarks (including React Flow overhead),
 * use Playwright with Chrome DevTools Performance panel.
 */

export const PERFORMANCE_TARGETS = {
  /** Graph rendering must complete in <1000ms (1 second) */
  RENDER_THRESHOLD_MS: 1000,

  /** Interactions (pan/zoom/drag) must complete in <100ms */
  INTERACTION_THRESHOLD_MS: 100,

  /** Filters must complete in <100ms */
  FILTER_THRESHOLD_MS: 100,

  /** Cook debounce delay */
  DEBOUNCE_MS: 500,

  /** Mode switch (text/outline/flow/visual) must complete in <100ms */
  MODE_SWITCH_THRESHOLD_MS: 100,

  /** Node selection must complete in <50ms */
  NODE_SELECTION_THRESHOLD_MS: 50,

  /** Initial render for 50-step formula must complete in <500ms */
  INITIAL_RENDER_THRESHOLD_MS: 500,

  /** Standard test graph sizes */
  TEST_SIZES: {
    SMALL: 50,
    MEDIUM: 100,
    LARGE: 200,
  },
} as const

export type PerformanceTargets = typeof PERFORMANCE_TARGETS
