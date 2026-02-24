# Performance Baseline (bcc-n12k1.2)

This document records the baseline performance measurements for the Visual Builder.

## Test Configuration

- **Date**: 2026-02-23
- **Formula size**: 50 steps (standard benchmark)
- **Measurement method**: Data transformation layer (no DOM rendering)
- **Tool**: Vitest bench with performance.now()

## Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Mode switch latency | <100ms | PASS |
| Node selection latency | <50ms | PASS |
| Initial render (50 steps) | <500ms | PASS |

## Detailed Results

### Mode Switch Latency

Mode switch measures the time to transform formula data when switching between view modes (text/outline/flow/visual).

| Benchmark | Target | Notes |
|-----------|--------|-------|
| text → visual | <100ms | Full graph transformation + layout |
| visual → outline | <100ms | Lightweight transformation |
| outline → flow | <100ms | Full graph transformation + layout |
| Rapid cycling (10x) | <1000ms | Stress test |

### Node Selection Latency

Node selection measures the time to update selection state and compute DAG adjacency for keyboard navigation.

| Benchmark | Target | Notes |
|-----------|--------|-------|
| Single selection | <50ms | State update only |
| Selection + adjacency | <50ms | State + navigation maps |
| Rapid selection (20x) | <250ms | Stress test |
| Keyboard navigation | <50ms | DAG traversal |

### Initial Render

Initial render measures the full processing pipeline: formula generation, graph transformation, and adjacency computation.

| Benchmark | Target | Notes |
|-----------|--------|-------|
| 50-step formula | <500ms | Standard benchmark |
| 100-step formula | <1000ms | Stress test (2x size) |
| 50 steps + 5 groups | <500ms | With expansion groups |

## How to Run

```bash
# Run all visual builder benchmarks
pnpm run bench tests/performance/visual-builder.bench.ts

# Run with verbose output
npx vitest bench tests/performance/visual-builder.bench.ts --run
```

## Methodology Notes

These benchmarks measure the **data transformation layer** only, not full browser rendering:

1. **Mode switch**: Simulates transforming formula data into React Flow nodes/edges
2. **Node selection**: Simulates updating selection state and building adjacency maps
3. **Initial render**: Simulates the full processing pipeline

For full browser rendering benchmarks (including React Flow and DOM updates), use:
- Playwright with Chrome DevTools Performance panel
- React DevTools Profiler

## Future Improvements

- Add Playwright-based E2E performance tests for real DOM measurements
- Measure memory usage during large formula operations
- Profile React Flow rendering overhead separately
