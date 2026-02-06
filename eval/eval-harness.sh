#!/usr/bin/env bash
# BCC Eval Harness - Tests bead graph construction hypotheses
# Usage: ./eval-harness.sh <repo-url> [hypothesis-id]
# Example: ./eval-harness.sh git@github.com:ShipperCRM/shipperCRM.git H1

set -euo pipefail

REPO_URL="${1:-git@github.com:ShipperCRM/shipperCRM.git}"
HYPOTHESIS="${2:-all}"
EVAL_DIR="/tmp/bcc-eval"
RESULTS_DIR="/tmp/bcc-eval-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[bcc-eval]${NC} $*"; }
ok() { echo -e "${GREEN}[PASS]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
fail() { echo -e "${RED}[FAIL]${NC} $*"; }

mkdir -p "$RESULTS_DIR"

# --- Utility Functions ---

clone_fresh() {
    local target="$1"
    log "Cloning fresh copy to $target..."
    rm -rf "$target"
    git clone --depth=1 "$REPO_URL" "$target" 2>/dev/null
    cd "$target"
    bd init --quiet 2>/dev/null || true
}

extract_metrics() {
    # Extract key metrics from bv --robot-insights, output as JSON
    local metrics
    metrics=$(bv --robot-insights 2>/dev/null || echo '{}')
    
    local density cycles_count pagerank_stddev betweenness_max
    local hub_count auth_count critical_path_len topo_valid
    local node_count edge_count eigenvector_stddev
    
    density=$(echo "$metrics" | jq -r '.clusterDensity // 0' 2>/dev/null || echo "0")
    cycles_count=$(echo "$metrics" | jq -r '.cycles | length // 0' 2>/dev/null || echo "0")
    
    # PageRank standard deviation
    pagerank_stddev=$(echo "$metrics" | jq -r '
      [.stats.pageRank // {} | to_entries[].value] |
      if length == 0 then 0
      else (. | add / length) as $mean |
        (map(. - $mean | . * .) | add / length | sqrt)
      end
    ' 2>/dev/null || echo "0")
    
    # Betweenness max
    betweenness_max=$(echo "$metrics" | jq -r '
      [.stats.betweenness // {} | to_entries[].value] | max // 0
    ' 2>/dev/null || echo "0")
    
    # HITS counts
    hub_count=$(echo "$metrics" | jq -r '.hubs | length // 0' 2>/dev/null || echo "0")
    auth_count=$(echo "$metrics" | jq -r '.authorities | length // 0' 2>/dev/null || echo "0")
    
    # Critical path length
    critical_path_len=$(echo "$metrics" | jq -r '
      [.stats.criticalPathScore // {} | to_entries[].value] | max // 0
    ' 2>/dev/null || echo "0")
    
    # Topo sort validity
    topo_valid=$(echo "$metrics" | jq -r '
      (.stats.topologicalOrder | length) > 0
    ' 2>/dev/null || echo "false")
    
    # Node and edge counts from triage
    local triage
    triage=$(bv --robot-triage 2>/dev/null || echo '{}')
    node_count=$(echo "$triage" | jq -r '.project_health.total // 0' 2>/dev/null || echo "0")
    
    # Eigenvector stddev
    eigenvector_stddev=$(echo "$metrics" | jq -r '
      [.stats.eigenvector // {} | to_entries[].value] |
      if length == 0 then 0
      else (. | add / length) as $mean |
        (map(. - $mean | . * .) | add / length | sqrt)
      end
    ' 2>/dev/null || echo "0")
    
    cat <<EOF
{
  "density": $density,
  "cycles_count": $cycles_count,
  "pagerank_stddev": $pagerank_stddev,
  "betweenness_max": $betweenness_max,
  "hub_count": $hub_count,
  "auth_count": $auth_count,
  "critical_path_len": $critical_path_len,
  "topo_valid": $topo_valid,
  "node_count": $node_count,
  "eigenvector_stddev": $eigenvector_stddev
}
EOF
}

score_graph_quality() {
    # Compute a composite quality score (0-100) from metrics
    local metrics_json="$1"
    
    python3 -c "
import json, sys, math

m = json.loads('''$metrics_json''')

score = 0.0
reasons = []

# Density (target: 0.03-0.12) - 15 points
d = m['density']
if 0.03 <= d <= 0.12:
    score += 15
    reasons.append(f'density={d:.4f} [GOOD]')
elif 0.01 <= d <= 0.20:
    score += 8
    reasons.append(f'density={d:.4f} [OK]')
else:
    reasons.append(f'density={d:.4f} [BAD]')

# PageRank StdDev (target: > 0.02) - 15 points
pr = m['pagerank_stddev']
if pr > 0.03:
    score += 15
    reasons.append(f'pagerank_stddev={pr:.4f} [GOOD]')
elif pr > 0.01:
    score += 8
    reasons.append(f'pagerank_stddev={pr:.4f} [OK]')
else:
    reasons.append(f'pagerank_stddev={pr:.4f} [BAD]')

# Betweenness max (target: > 0.10) - 15 points
bw = m['betweenness_max']
if bw > 0.15:
    score += 15
    reasons.append(f'betweenness_max={bw:.4f} [GOOD]')
elif bw > 0.05:
    score += 8
    reasons.append(f'betweenness_max={bw:.4f} [OK]')
else:
    reasons.append(f'betweenness_max={bw:.4f} [BAD]')

# HITS (both hubs and authorities non-empty) - 10 points
if m['hub_count'] > 0 and m['auth_count'] > 0:
    score += 10
    reasons.append(f'HITS hubs={m[\"hub_count\"]} auths={m[\"auth_count\"]} [GOOD]')
elif m['hub_count'] > 0 or m['auth_count'] > 0:
    score += 5
    reasons.append(f'HITS hubs={m[\"hub_count\"]} auths={m[\"auth_count\"]} [PARTIAL]')
else:
    reasons.append('HITS: no hubs or authorities [BAD]')

# Critical path (target: 3-15) - 15 points
cp = m['critical_path_len']
if 3 <= cp <= 15:
    score += 15
    reasons.append(f'critical_path={cp:.0f} [GOOD]')
elif 1 <= cp <= 25:
    score += 8
    reasons.append(f'critical_path={cp:.0f} [OK]')
else:
    reasons.append(f'critical_path={cp:.0f} [BAD]')

# Cycles (target: 0) - 15 points
if m['cycles_count'] == 0:
    score += 15
    reasons.append('cycles=0 [GOOD]')
else:
    reasons.append(f'cycles={m[\"cycles_count\"]} [BAD - MUST FIX]')

# Topo sort valid - 5 points
if m['topo_valid']:
    score += 5
    reasons.append('topo_sort=valid [GOOD]')
else:
    reasons.append('topo_sort=invalid [BAD]')

# Eigenvector variance (target: > 0.01) - 10 points
ev = m['eigenvector_stddev']
if ev > 0.02:
    score += 10
    reasons.append(f'eigenvector_stddev={ev:.4f} [GOOD]')
elif ev > 0.005:
    score += 5
    reasons.append(f'eigenvector_stddev={ev:.4f} [OK]')
else:
    reasons.append(f'eigenvector_stddev={ev:.4f} [BAD]')

print(f'SCORE: {score}/100')
for r in reasons:
    print(f'  {r}')
" 2>/dev/null || echo "SCORE: error (python3 or jq issue)"
}

# --- Hypothesis Tests ---

test_H1_granularity() {
    log "=== H1: Optimal Granularity ==="
    log "Testing 3 granularity levels..."
    
    local results_file="$RESULTS_DIR/H1_${TIMESTAMP}.json"
    
    for level in "file" "module" "directory"; do
        log "--- Granularity: $level ---"
        clone_fresh "$EVAL_DIR/H1_$level"
        
        case $level in
            file)
                # 1:1 file-to-bead mapping (first 50 files)
                find . -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.go" -o -name "*.rb" -o -name "*.rs" | \
                    head -50 | while read -r f; do
                    bd create "File: $(basename "$f")" -t task -p 2 --json 2>/dev/null || true
                done
                ;;
            module)
                # Module-level: group by parent directory
                find . -mindepth 2 -maxdepth 3 -type d | \
                    grep -v node_modules | grep -v .git | grep -v vendor | head -30 | while read -r d; do
                    local count
                    count=$(find "$d" -maxdepth 1 -type f | wc -l)
                    if [ "$count" -gt 0 ]; then
                        bd create "Module: $(basename "$d") ($count files)" -t feature -p 2 --json 2>/dev/null || true
                    fi
                done
                ;;
            directory)
                # Top-level only
                find . -mindepth 1 -maxdepth 1 -type d | \
                    grep -v node_modules | grep -v .git | grep -v vendor | while read -r d; do
                    bd create "Dir: $(basename "$d")" -t epic -p 1 --json 2>/dev/null || true
                done
                ;;
        esac
        
        bd sync 2>/dev/null || true
        sleep 1
        
        local metrics
        metrics=$(extract_metrics)
        log "Metrics for $level:"
        echo "$metrics" | jq .
        log "Quality score for $level:"
        score_graph_quality "$metrics"
        echo ""
    done
}

test_H2_bridge_beads() {
    log "=== H2: Bridge Bead Injection ==="
    
    for variant in "no-bridges" "with-bridges"; do
        log "--- Variant: $variant ---"
        clone_fresh "$EVAL_DIR/H2_$variant"
        
        # Create base structure: 2 clusters
        local cluster_a cluster_b
        cluster_a=$(bd create "Cluster: Frontend" -t epic -p 1 --label frontend --json 2>/dev/null | jq -r '.id // empty')
        cluster_b=$(bd create "Cluster: Backend" -t epic -p 1 --label backend --json 2>/dev/null | jq -r '.id // empty')
        
        # Add nodes to each cluster
        local a_nodes=() b_nodes=()
        for i in $(seq 1 5); do
            local aid bid
            aid=$(bd create "Frontend Module $i" -t feature -p 2 --label frontend --json 2>/dev/null | jq -r '.id // empty')
            bid=$(bd create "Backend Service $i" -t feature -p 2 --label backend --json 2>/dev/null | jq -r '.id // empty')
            a_nodes+=("$aid")
            b_nodes+=("$bid")
        done
        
        # Intra-cluster deps
        for i in $(seq 1 4); do
            bd dep add "${a_nodes[$i]}" "${a_nodes[$((i-1))]}" 2>/dev/null || true
            bd dep add "${b_nodes[$i]}" "${b_nodes[$((i-1))]}" 2>/dev/null || true
        done
        
        if [ "$variant" = "with-bridges" ]; then
            # Create synthetic bridge beads
            local bridge
            bridge=$(bd create "Contract: API Gateway" -t task -p 0 --label api --label bridge --json 2>/dev/null | jq -r '.id // empty')
            
            # Wire bridge: frontend depends on bridge, bridge depends on backend
            for aid in "${a_nodes[@]}"; do
                [ -n "$aid" ] && bd dep add "$aid" "$bridge" 2>/dev/null || true
            done
            for bid in "${b_nodes[@]}"; do
                [ -n "$bid" ] && bd dep add "$bridge" "$bid" 2>/dev/null || true
            done
        fi
        
        bd sync 2>/dev/null || true
        sleep 1
        
        local metrics
        metrics=$(extract_metrics)
        log "Metrics for $variant:"
        echo "$metrics" | jq .
        log "Quality score for $variant:"
        score_graph_quality "$metrics"
        echo ""
    done
}

test_H6_future_work() {
    log "=== H6: Future Work Integration ==="
    
    for variant in "code-only" "code-plus-features"; do
        log "--- Variant: $variant ---"
        clone_fresh "$EVAL_DIR/H6_$variant"
        
        # Create base code graph
        local core_id
        core_id=$(bd create "Core: Database Layer" -t feature -p 0 --label core --label database --json 2>/dev/null | jq -r '.id // empty')
        
        local auth_id
        auth_id=$(bd create "Module: Authentication" -t feature -p 1 --label auth --json 2>/dev/null | jq -r '.id // empty')
        [ -n "$auth_id" ] && [ -n "$core_id" ] && bd dep add "$auth_id" "$core_id" 2>/dev/null || true
        
        local api_id
        api_id=$(bd create "Module: API Routes" -t feature -p 1 --label api --json 2>/dev/null | jq -r '.id // empty')
        [ -n "$api_id" ] && [ -n "$auth_id" ] && bd dep add "$api_id" "$auth_id" 2>/dev/null || true
        [ -n "$api_id" ] && [ -n "$core_id" ] && bd dep add "$api_id" "$core_id" 2>/dev/null || true
        
        local ui_id
        ui_id=$(bd create "Module: Frontend UI" -t feature -p 2 --label frontend --json 2>/dev/null | jq -r '.id // empty')
        [ -n "$ui_id" ] && [ -n "$api_id" ] && bd dep add "$ui_id" "$api_id" 2>/dev/null || true
        
        if [ "$variant" = "code-plus-features" ]; then
            # Add future work beads
            local feat1
            feat1=$(bd create "Feature: OAuth2 Integration" -t feature -p 1 --label auth --label planned --json 2>/dev/null | jq -r '.id // empty')
            [ -n "$feat1" ] && [ -n "$auth_id" ] && bd dep add "$feat1" "$auth_id" 2>/dev/null || true
            
            local feat2
            feat2=$(bd create "Feature: Real-time Notifications" -t feature -p 1 --label api --label planned --json 2>/dev/null | jq -r '.id // empty')
            [ -n "$feat2" ] && [ -n "$api_id" ] && bd dep add "$feat2" "$api_id" 2>/dev/null || true
            [ -n "$feat2" ] && [ -n "$ui_id" ] && bd dep add "$feat2" "$ui_id" 2>/dev/null || true
            
            local feat3
            feat3=$(bd create "Feature: Multi-tenant Support" -t epic -p 0 --label core --label planned --json 2>/dev/null | jq -r '.id // empty')
            [ -n "$feat3" ] && [ -n "$core_id" ] && bd dep add "$feat3" "$core_id" 2>/dev/null || true
            [ -n "$feat3" ] && [ -n "$auth_id" ] && bd dep add "$feat3" "$auth_id" 2>/dev/null || true
        fi
        
        bd sync 2>/dev/null || true
        sleep 1
        
        local metrics
        metrics=$(extract_metrics)
        log "Metrics for $variant:"
        echo "$metrics" | jq .
        log "Quality score for $variant:"
        score_graph_quality "$metrics"
        
        if [ "$variant" = "code-plus-features" ]; then
            log "Triage recommendations:"
            bv --robot-triage 2>/dev/null | jq '.recommendations[:3]' 2>/dev/null || echo "(no triage available)"
        fi
        echo ""
    done
}

# --- Main ---

log "BCC Eval Harness v0.1"
log "Repo: $REPO_URL"
log "Hypothesis: $HYPOTHESIS"
log "Results dir: $RESULTS_DIR"
echo ""

case "$HYPOTHESIS" in
    H1) test_H1_granularity ;;
    H2) test_H2_bridge_beads ;;
    H6) test_H6_future_work ;;
    all)
        test_H1_granularity
        test_H2_bridge_beads
        test_H6_future_work
        ;;
    *)
        echo "Unknown hypothesis: $HYPOTHESIS"
        echo "Available: H1, H2, H6, all"
        exit 1
        ;;
esac

log "Eval complete. Results in $RESULTS_DIR"
