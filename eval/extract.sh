#!/usr/bin/env bash
# BCC Metric Extraction Pipeline
# Extracts all bv metrics from a beads-initialized repo into a JSON file.
# Usage: ./extract.sh [output.json]
# Must be run from within a beads-initialized repo.
set -euo pipefail

JQ="${JQ:-jq}"
OUT="${1:-/dev/stdout}"

insights=$(bv --robot-insights 2>/dev/null || echo '{}')
triage=$(bv --robot-triage 2>/dev/null || echo '{}')

# Build the combined extraction
echo "$insights" | "$JQ" --argjson triage "$triage" '{
  timestamp: now | todate,
  bd_version: (env.BD_VERSION // "unknown"),
  bv_version: (env.BV_VERSION // "unknown"),

  graph: {
    node_count: .Stats.NodeCount,
    edge_count: .Stats.EdgeCount,
    density: .ClusterDensity,
    edge_per_node: ((.Stats.EdgeCount // 0) / ((.Stats.NodeCount // 1) | if . == 0 then 1 else . end)),
    has_cycles: ((.Cycles // []) | length > 0),
    cycle_count: ((.Cycles // []) | length),
    topo_valid: ((.Stats.TopologicalOrder // []) | length > 0),
    topo_length: ((.Stats.TopologicalOrder // []) | length),
  },

  pagerank: {
    values: (.full_stats.pagerank // {}),
    top5: [.full_stats.pagerank // {} | to_entries | sort_by(-.value)[:5] | .[] | {id: .key, v: .value}],
    stddev: (
      [(.full_stats.pagerank // {}) | to_entries[].value] |
      if length < 2 then 0
      else (. | add / length) as $m | (map(pow(. - $m; 2)) | add / length | sqrt)
      end
    ),
    max: ([(.full_stats.pagerank // {}) | to_entries[].value] | if length == 0 then 0 else max end),
    min: ([(.full_stats.pagerank // {}) | to_entries[].value] | if length == 0 then 0 else min end),
  },

  betweenness: {
    values: (.full_stats.betweenness // {}),
    top5: [.Bottlenecks[:5][] | {id: .ID, v: .Value}],
    max: ([(.full_stats.betweenness // {}) | to_entries[].value] | if length == 0 then 0 else max end),
    nonzero_count: ([(.full_stats.betweenness // {}) | to_entries[] | select(.value > 0)] | length),
  },

  eigenvector: {
    top5: [.full_stats.eigenvector // {} | to_entries | sort_by(-.value)[:5] | .[] | {id: .key, v: .value}],
    stddev: (
      [(.full_stats.eigenvector // {}) | to_entries[].value] |
      if length < 2 then 0
      else (. | add / length) as $m | (map(pow(. - $m; 2)) | add / length | sqrt)
      end
    ),
  },

  hits: {
    top3_hubs: [(.Hubs // [])[:3][] | {id: .ID, v: .Value}],
    top3_auths: [(.Authorities // [])[:3][] | {id: .ID, v: .Value}],
    hub_nonzero: ([(.Hubs // [])[] | select(.Value > 1e-6)] | length),
    auth_nonzero: ([(.Authorities // [])[] | select(.Value > 1e-6)] | length),
  },

  critical_path: {
    max_depth: ([(.full_stats.critical_path_score // {}) | to_entries[].value] | if length == 0 then 0 else max end),
    keystone: ((.Keystones // [])[0] // null),
    k_path: ((.advanced_insights.k_paths.paths // [])[0] // null),
  },

  structural: {
    articulation_points: ((.Articulation // []) | length),
    articulation_ids: (.Articulation // []),
    k_core_max: ([(.full_stats.core_number // {}) | to_entries[].value] | if length == 0 then 0 else max end),
    zero_slack_count: ([(.full_stats.slack // {}) | to_entries[] | select(.value == 0)] | length),
    orphan_count: ((.Orphans // []) | length),
  },

  triage: {
    total: ($triage.triage.project_health.counts.total // 0),
    open: ($triage.triage.project_health.counts.open // 0),
    blocked: ($triage.triage.project_health.counts.blocked // 0),
    actionable: ($triage.triage.project_health.counts.actionable // 0),
    top3_recs: [($triage.triage.recommendations // [])[:3][] | {id: .id, title: .title, score: .score}],
  },

  analysis_status: .status,
}' > "$OUT"
