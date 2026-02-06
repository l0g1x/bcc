# BCC Evaluation Specification

## Purpose

This document defines how to measure the quality of a bead graph produced by BCC. The goal is to maximize the analytical utility of bv's 9 graph metrics for agent-driven codebase navigation.

## Quality Score (0-100)

The composite quality score measures how well a bead graph exploits bv's metric engine.

| Component | Max Points | Target | Measures |
|-----------|-----------|--------|----------|
| Density | 15 | 0.03 - 0.12 | Graph is connected enough for signal, not noise |
| PageRank StdDev | 15 | > 0.02 | Clear differentiation between foundational and leaf nodes |
| Betweenness Max | 15 | > 0.10 | At least one meaningful bridge/bottleneck |
| Critical Path Length | 15 | 3 - 15 | Deep enough chain for prioritization |
| Cycles | 15 | 0 | No structural errors |
| HITS Hub/Auth | 10 | Both non-empty | Graph has aggregators AND providers |
| Eigenvector StdDev | 10 | > 0.01 | Influence is concentrated, not uniform |
| Topo Sort Valid | 5 | true | DAG is well-formed |

### Scoring Tiers

| Score | Grade | Interpretation |
|-------|-------|----------------|
| 85-100 | A | Excellent - graph maximizes all bv metric signals |
| 70-84 | B | Good - most metrics are meaningful |
| 55-69 | C | Acceptable - some metrics underutilized |
| 40-54 | D | Poor - graph structure doesn't produce useful analysis |
| 0-39 | F | Failed - fundamental structural problems |

## Hypothesis Testing Protocol

### Setup
1. Clone the target repo to a fresh temp directory
2. Initialize beads: `bd init --quiet`
3. Apply the hypothesis variant
4. Sync: `bd sync`
5. Extract metrics: `bv --robot-insights`
6. Score using the composite function

### Comparison
For each hypothesis, run the control (baseline) and treatment (hypothesis) variants. Compare:
- Composite score delta
- Individual metric deltas
- Qualitative assessment (do the top-N nodes make semantic sense?)

### Statistical Validity
- Run each variant 3 times to account for hash-based ID variation affecting topo sort
- Report mean and range of scores
- A hypothesis is supported if treatment score > control score by >= 5 points consistently

## Hypotheses

### H1: Optimal Granularity
- **Control:** File-level (1 bead per file)
- **Treatment A:** Module-level (1 bead per 5-15 file cluster)
- **Treatment B:** Directory-level (1 bead per top-level dir)
- **Prediction:** Module-level produces highest PageRank StdDev

### H2: Bridge Bead Injection
- **Control:** No synthetic bridge beads
- **Treatment:** Add contract beads at module boundaries
- **Prediction:** Betweenness max increases by > 50%

### H3: Recursive Formula Depth
- **Control:** Depth 1 (flat exploration)
- **Treatment A:** Depth 2
- **Treatment B:** Depth 3
- **Treatment C:** Depth 4
- **Prediction:** Depth 2-3 maximizes critical path signal; depth 4 adds noise

### H4: Related Deps as Eigenvector Amplifiers
- **Control:** Blocking deps only
- **Treatment:** Blocking + related deps from co-change analysis
- **Prediction:** Eigenvector StdDev increases without pathological density

### H5: Label Consistency
- **Control:** Free-form labels
- **Treatment:** Strict taxonomy (<20 labels)
- **Prediction:** Attention view scores have higher variance (more actionable)

### H6: Future Work Integration
- **Control:** Code graph only (existing codebase)
- **Treatment:** Code graph + planned feature beads
- **Prediction:** robot-triage correctly identifies blocking foundation work

## Running the Eval

```bash
# Full eval suite
./eval/eval-harness.sh git@github.com:ShipperCRM/shipperCRM.git all

# Single hypothesis
./eval/eval-harness.sh git@github.com:ShipperCRM/shipperCRM.git H1

# Custom repo
./eval/eval-harness.sh git@github.com:your/repo.git H2
```

## Interpreting Results

The eval harness outputs per-variant scores with breakdowns. Look for:

1. **Score delta > 5:** Hypothesis is strongly supported
2. **Score delta 2-5:** Hypothesis is weakly supported
3. **Score delta < 2:** Hypothesis is not supported
4. **Negative delta:** Hypothesis is harmful

Pay special attention to:
- Cycles introduced (automatic disqualification)
- Density exceeding 0.15 (coupling alarm)
- PageRank/betweenness going to 0 (graph too disconnected)
