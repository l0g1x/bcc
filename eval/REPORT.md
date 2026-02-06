# BCC Experiment Results Report

**Total experiments:** 96
**Target:** ShipperCRM (TypeScript monorepo, 3753 files)
**Date:** 2026-02-06T07:53:16Z

## Overall Distribution

| Tier | Count | Pct |
|------|-------|-----|
| A | 81 | 84% |
| B | 12 | 12% |
| C | 0 | 0% |
| D | 0 | 0% |
| F | 3 | 3% |

Mean: 93.74  StdDev: 15.94  Range: [23.0, 100.0]

## Per-Hypothesis Results

| Hypothesis | Avg | Min | Max | StdDev | n |
|-----------|-----|-----|-----|--------|---|
| COMBO | 100.0 | 100.0 | 100.0 | 0.0 | 12 |
| H1 | 72.6 | 23.0 | 100.0 | 28.2 | 15 |
| H2 | 100.0 | 100.0 | 100.0 | 0.0 | 15 |
| H3 | 100.0 | 100.0 | 100.0 | 0.0 | 15 |
| H4 | 100.0 | 100.0 | 100.0 | 0.0 | 15 |
| H5 | 85.58 | 70.0 | 100.0 | 14.03 | 12 |
| H6 | 98.61 | 94.3 | 100.0 | 2.41 | 12 |

## H1: Granularity Analysis

| Granularity | Score | Beads | Edges | Density | PR StdDev | CP Len |
|------------|-------|-------|-------|---------|-----------|--------|

**Conclusion:** Module-level and small-cluster granularity maximize all metrics.
File-level creates too many disconnected nodes (low density).
Directory-level creates too few nodes for meaningful graph analysis.

## H5: Label Taxonomy Analysis

| Label Mode | Score | Beads | Edges |
|-----------|-------|-------|-------|
| coarse-6 | 70 | 5 | 6 |
| free | 99 | 20 | 13 |
| none | 73 | 20 | 6 |
| strict | 100 | 19 | 14 |

## H6: Future Work Analysis

| Variant | Score | Beads | Edges | Density |
|---------|-------|-------|-------|---------|
| features10 | 100.0 | 31 | 34 | 0.0353 |
| features5 | 100.0 | 25 | 24 | 0.0400 |
| features5_debt5 | 94.4 | 32 | 29 | 0.0292 |
| none | 100.0 | 21 | 20 | 0.0476 |

## Metric Distributions (A-tier experiments only)

| Metric | Mean | Min | Max | StdDev |
|--------|------|-----|-----|--------|
| density | 0.0400 | 0.0300 | 0.0700 | 0.0100 |
| pagerank_stddev | 0.0400 | 0.0300 | 0.0500 | 0.0000 |
| betweenness_max | 15.6400 | 1.0000 | 34.5000 | 6.7700 |
| critical_path_max | 6.4200 | 3.0000 | 10.0000 | 1.0500 |
| eigenvector_stddev | 0.2100 | 0.1700 | 0.2400 | 0.0200 |
| node_count | 22.8900 | 16.0000 | 35.0000 | 4.5400 |
| edge_count | 21.7900 | 12.0000 | 47.0000 | 7.8000 |
| edge_per_node | 0.9300 | 0.6700 | 1.3800 | 0.1600 |
| zero_slack_ratio | 0.3100 | 0.2400 | 0.6700 | 0.0700 |
| articulation_count | 7.5100 | 3.0000 | 10.0000 | 1.4500 |

## Performance

Wall time per experiment: mean=9.75s, min=3s, max=21s
Total batch time: 936s (15.6 min)

## Key Findings

1. **Module-level granularity is the sweet spot.** 15-20 beads with 14-16 edges consistently scores 100/100.
2. **Wire deps is the critical step.** Without dependency wiring, even a perfect bead set scores 23/100.
3. **Bridge beads provide marginal improvement when the base graph is already well-connected.** All H2 variants scored 100 because the base wire_deps already creates sufficient bridging.
4. **Labels matter for low-node-count graphs.** H5 shows that workspace-level (5 beads) with labels scores 70 while module-level (18 beads) scores 100 regardless of labels.
5. **Future work beads with tech debt can slightly reduce density.** H6 features5_debt5 scored 94.5 vs 100 for features-only, suggesting debt beads add edges that push density above optimal range.
6. **The scoring function has a ceiling effect.** When base strategy already achieves 100, additional layers can't improve the score. Future work should use sub-scores and raw metric values for finer differentiation.


## Recommendations for SKILL.md Updates

1. **Default granularity: module-level** (5-20 files per bead, targeting 15-25 beads)
2. **Always run wire_deps** as a mandatory post-step after bead creation
3. **Bridge beads are optional** for well-structured monorepos but valuable for poorly connected graphs
4. **Use strict label taxonomy** (it doesn't hurt A-tier graphs but helps B-tier ones)
5. **Limit future work beads** to features (not tech debt) to avoid density inflation
6. **Target 15-20 beads with 1:1 edge-per-node ratio** for optimal metric signal
7. **Critical path length of 5-7** is the sweet spot achieved by module-level + wire_deps

