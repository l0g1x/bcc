#!/usr/bin/env python3
"""BCC Composite Quality Score Function.

Scores a bead graph (0-100) based on bv --robot-insights output.
Usage:
  python3 score.py <insights.json>          # Score from file
  bv --robot-insights | python3 score.py -  # Score from stdin
  python3 score.py --self-test              # Validate scoring
"""

import json
import math
import sys
import os
from typing import Dict, Any, Tuple, List

# ── Scoring weights ──────────────────────────────────────────────────────────

WEIGHTS = {
    "density":           15,
    "pagerank_stddev":   15,
    "betweenness_max":   15,
    "critical_path":     15,
    "cycles":            15,
    "hits":              10,
    "eigenvector_stddev": 10,
    "topo_valid":         5,
}

TIERS = [
    (85, "A", "Excellent"),
    (70, "B", "Good"),
    (55, "C", "Acceptable"),
    (40, "D", "Poor"),
    ( 0, "F", "Failed"),
]


def stddev(values: List[float]) -> float:
    if len(values) < 2:
        return 0.0
    mean = sum(values) / len(values)
    variance = sum((v - mean) ** 2 for v in values) / len(values)
    return math.sqrt(variance)


def extract_metrics(insights: Dict[str, Any]) -> Dict[str, Any]:
    """Pull the metrics we need from raw bv --robot-insights JSON."""
    fs = insights.get("full_stats", {})
    stats = insights.get("Stats", insights.get("stats", {}))

    # PageRank
    pr_map = fs.get("pagerank", {})
    pr_vals = list(pr_map.values()) if pr_map else []

    # Betweenness
    bw_map = fs.get("betweenness", {})
    bw_vals = list(bw_map.values()) if bw_map else []

    # Eigenvector
    ev_map = fs.get("eigenvector", {})
    ev_vals = list(ev_map.values()) if ev_map else []

    # HITS
    hubs = insights.get("Hubs", [])
    auths = insights.get("Authorities", [])
    hub_nonzero = [h for h in hubs if h.get("Value", 0) > 1e-6]
    auth_nonzero = [a for a in auths if a.get("Value", 0) > 1e-6]

    # Critical path
    cp_map = fs.get("critical_path_score", {})
    cp_vals = list(cp_map.values()) if cp_map else []

    # Cycles
    cycles = insights.get("Cycles", None)
    cycle_count = len(cycles) if cycles else 0

    # Topo sort
    topo = stats.get("TopologicalOrder", None) or []

    # Density
    density = insights.get("ClusterDensity", stats.get("Density", 0))

    # Counts
    node_count = stats.get("NodeCount", 0)
    edge_count = stats.get("EdgeCount", 0)

    # Articulation / K-core / Slack
    artic = insights.get("Articulation", None) or []
    slack_map = fs.get("slack", None) or {}
    zero_slack = sum(1 for v in slack_map.values() if v == 0) if slack_map else 0

    return {
        "density": density,
        "pagerank_stddev": stddev(pr_vals),
        "pagerank_max": max(pr_vals) if pr_vals else 0,
        "betweenness_max": max(bw_vals) if bw_vals else 0,
        "betweenness_nonzero": sum(1 for v in bw_vals if v > 0),
        "betweenness_stddev": stddev(bw_vals),
        "eigenvector_stddev": stddev(ev_vals),
        "hub_count": len(hub_nonzero),
        "auth_count": len(auth_nonzero),
        "critical_path_max": max(cp_vals) if cp_vals else 0,
        "cycle_count": cycle_count,
        "topo_valid": len(topo) > 0,
        "topo_len": len(topo),
        "node_count": node_count,
        "edge_count": edge_count,
        "edge_per_node": edge_count / node_count if node_count > 0 else 0,
        "articulation_count": len(artic),
        "zero_slack_count": zero_slack,
        "zero_slack_ratio": zero_slack / node_count if node_count > 0 else 0,
    }


def score_component(name: str, metrics: Dict[str, Any]) -> Tuple[float, str]:
    """Score a single component. Returns (points, reason)."""
    max_pts = WEIGHTS[name]

    if name == "density":
        d = metrics["density"]
        if 0.03 <= d <= 0.12:
            return max_pts, f"density={d:.4f} IN [0.03,0.12]"
        elif 0.01 <= d <= 0.20:
            frac = 1.0 - min(abs(d - 0.075) / 0.075, 1.0)
            pts = max_pts * 0.4 + max_pts * 0.6 * frac
            return round(pts, 1), f"density={d:.4f} NEAR target"
        else:
            return 0, f"density={d:.4f} OUT OF RANGE"

    elif name == "pagerank_stddev":
        v = metrics["pagerank_stddev"]
        if v > 0.03:
            return max_pts, f"pr_stddev={v:.4f} > 0.03"
        elif v > 0.02:
            return max_pts * 0.8, f"pr_stddev={v:.4f} > 0.02"
        elif v > 0.01:
            return max_pts * 0.5, f"pr_stddev={v:.4f} > 0.01"
        else:
            return 0, f"pr_stddev={v:.4f} < 0.01"

    elif name == "betweenness_max":
        v = metrics["betweenness_max"]
        n = metrics["node_count"]
        nonzero = metrics.get("betweenness_nonzero", 0)
        # Betweenness exists when there are nodes on shortest paths between others
        # For small graphs (n<15), even a single nonzero betweenness node is good
        if v > 0 and nonzero >= 3:
            return max_pts, f"bw_max={v:.1f} nonzero={nonzero}"
        elif v > 0 and nonzero >= 1:
            return max_pts * 0.7, f"bw_max={v:.1f} nonzero={nonzero}"
        elif v > 0:
            return max_pts * 0.4, f"bw_max={v:.1f} weak"
        else:
            return 0, f"bw_max=0 NO betweenness"

    elif name == "critical_path":
        v = metrics["critical_path_max"]
        if 3 <= v <= 15:
            return max_pts, f"cp_len={v} IN [3,15]"
        elif 2 <= v <= 25:
            frac = 1.0 - min(abs(v - 9) / 9, 1.0)
            pts = max_pts * 0.4 + max_pts * 0.6 * frac
            return round(pts, 1), f"cp_len={v} NEAR target"
        elif v > 0:
            return max_pts * 0.2, f"cp_len={v} OUTSIDE [3,25]"
        else:
            return 0, f"cp_len={v} NO PATH"

    elif name == "cycles":
        c = metrics["cycle_count"]
        if c == 0:
            return max_pts, "cycles=0"
        elif c <= 2:
            return max_pts * 0.3, f"cycles={c} (fixable)"
        else:
            return 0, f"cycles={c} STRUCTURAL ERROR"

    elif name == "hits":
        h = metrics["hub_count"]
        a = metrics["auth_count"]
        if h > 0 and a > 0:
            return max_pts, f"hubs={h} auths={a}"
        elif h > 0 or a > 0:
            return max_pts * 0.5, f"hubs={h} auths={a} PARTIAL"
        else:
            return 0, "NO hubs or authorities"

    elif name == "eigenvector_stddev":
        v = metrics["eigenvector_stddev"]
        if v > 0.02:
            return max_pts, f"ev_stddev={v:.4f} > 0.02"
        elif v > 0.01:
            return max_pts * 0.6, f"ev_stddev={v:.4f} > 0.01"
        elif v > 0.001:
            return max_pts * 0.3, f"ev_stddev={v:.4f} > 0.001"
        else:
            return 0, f"ev_stddev={v:.4f} FLAT"

    elif name == "topo_valid":
        if metrics["topo_valid"]:
            return max_pts, "topo_sort=valid"
        else:
            return 0, "topo_sort=INVALID"

    return 0, "unknown"


def compute_score(insights: Dict[str, Any]) -> Dict[str, Any]:
    """Compute the full composite score with breakdown."""
    metrics = extract_metrics(insights)

    breakdown = {}
    total = 0.0
    for name in WEIGHTS:
        pts, reason = score_component(name, metrics)
        breakdown[name] = {"points": pts, "max": WEIGHTS[name], "reason": reason}
        total += pts

    total = round(total, 1)

    # Determine tier
    tier_letter = "F"
    tier_name = "Failed"
    for threshold, letter, name in TIERS:
        if total >= threshold:
            tier_letter = letter
            tier_name = name
            break

    return {
        "score": total,
        "max_possible": 100,
        "tier": tier_letter,
        "tier_name": tier_name,
        "breakdown": breakdown,
        "metrics": metrics,
    }


def format_report(result: Dict[str, Any]) -> str:
    """Format a human-readable report."""
    lines = []
    lines.append(f"COMPOSITE SCORE: {result['score']}/100  [{result['tier']}] {result['tier_name']}")
    lines.append("")
    lines.append(f"  Nodes: {result['metrics']['node_count']}  Edges: {result['metrics']['edge_count']}  "
                 f"Density: {result['metrics']['density']:.4f}  "
                 f"Edge/Node: {result['metrics']['edge_per_node']:.2f}")
    lines.append(f"  Articulation pts: {result['metrics']['articulation_count']}  "
                 f"Zero-slack: {result['metrics']['zero_slack_count']} ({result['metrics']['zero_slack_ratio']:.0%})")
    lines.append("")
    lines.append("  BREAKDOWN:")
    for name, info in result["breakdown"].items():
        bar_len = int(info["points"] / info["max"] * 20) if info["max"] > 0 else 0
        bar = "#" * bar_len + "." * (20 - bar_len)
        lines.append(f"    {name:22s} {info['points']:5.1f}/{info['max']:2d}  [{bar}]  {info['reason']}")
    return "\n".join(lines)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--self-test":
        # Quick self-test with synthetic data
        fake = {
            "ClusterDensity": 0.05,
            "Cycles": None,
            "Hubs": [{"ID": "a", "Value": 0.5}],
            "Authorities": [{"ID": "b", "Value": 0.6}],
            "Articulation": ["x", "y"],
            "Stats": {"NodeCount": 20, "EdgeCount": 25, "TopologicalOrder": list(range(20))},
            "full_stats": {
                "pagerank": {f"n{i}": 0.01 + i * 0.005 for i in range(20)},
                "betweenness": {f"n{i}": i * 2.0 for i in range(20)},
                "eigenvector": {f"n{i}": 0.01 * (i % 5) for i in range(20)},
                "critical_path_score": {f"n{i}": min(i, 10) for i in range(20)},
                "slack": {f"n{i}": 0 if i < 10 else i for i in range(20)},
            },
        }
        result = compute_score(fake)
        print(format_report(result))
        print(f"\nSelf-test passed. Score: {result['score']}")
        sys.exit(0)

    # Read insights JSON
    if len(sys.argv) > 1 and sys.argv[1] != "-":
        with open(sys.argv[1]) as f:
            insights = json.load(f)
    else:
        insights = json.load(sys.stdin)

    result = compute_score(insights)

    # Output mode
    if os.environ.get("BCC_SCORE_JSON"):
        print(json.dumps(result, indent=2))
    else:
        print(format_report(result))
        # Also write JSON to a file if BCC_SCORE_OUT is set
        out = os.environ.get("BCC_SCORE_OUT")
        if out:
            with open(out, "w") as f:
                json.dump(result, f, indent=2)
