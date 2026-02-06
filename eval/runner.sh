#!/usr/bin/env bash
# BCC Autonomous Experiment Runner
# Runs 100+ experiments across all hypotheses, producing scored results.
# Usage: ./runner.sh [repo_url] [results_dir] [max_parallel]
set -uo pipefail

REPO_URL="${1:-git@github.com:ShipperCRM/shipperCRM.git}"
RESULTS_DIR="${2:-/home/krystian/bcc/eval/results}"
MAX_PARALLEL="${3:-1}"
SCRIPT_DIR="$(cd "$(dirname "$0")" ; pwd)"
STRATEGIES_DIR="$SCRIPT_DIR/strategies"
JQ="${JQ:-jq}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_DIR="$RESULTS_DIR/logs"
SUMMARY_FILE="$RESULTS_DIR/summary_${TIMESTAMP}.jsonl"
BD_VERSION=$(bd version 2>/dev/null | head -1 || echo "unknown")
TOTAL_EXPERIMENTS=0
COMPLETED=0
FAILED=0
BATCH_START=$(date +%s)
CACHE_DIR="/tmp/bcc-repo-cache"

mkdir -p "$RESULTS_DIR" "$LOG_DIR"

# Pre-clone the repo once to use as a cache for all experiments
if [ ! -d "$CACHE_DIR/.git" ]; then
    log "Pre-cloning repo to cache ($CACHE_DIR)..."
    rm -rf "$CACHE_DIR"
    git clone --depth=1 "$REPO_URL" "$CACHE_DIR" 2>&1 | tail -1
    # Clean up beads state from cache so each experiment starts fresh
    rm -rf "$CACHE_DIR/.beads"
    log "Cache ready"
fi

# ── Logging ──────────────────────────────────────────────────────────────────
log()  { echo -e "\033[0;34m[bcc-runner]\033[0m $*" >&2; }
ok()   { echo -e "\033[0;32m[PASS]\033[0m $*" >&2; }
fail() { echo -e "\033[0;31m[FAIL]\033[0m $*" >&2; }
prog() { echo -e "\033[1;33m[$COMPLETED/$TOTAL_EXPERIMENTS]\033[0m $*" >&2; }

# ── Core experiment function ─────────────────────────────────────────────────
run_experiment() {
    local exp_id="$1"
    local hypothesis="$2"
    local description="$3"
    local commands="$4"

    local exp_dir="/tmp/bcc-exp-${exp_id}-$$"
    local result_file="$RESULTS_DIR/${exp_id}.json"
    local log_file="$LOG_DIR/${exp_id}.log"

    # Skip if already completed
    if [ -f "$result_file" ]; then
        COMPLETED=$((COMPLETED + 1))
        prog "SKIP $exp_id (already exists)"
        return 0
    fi

    prog "START $exp_id: $description"
    local exp_start
    exp_start=$(date +%s)

    {
        # Copy from cache (much faster than git clone each time)
        rm -rf "$exp_dir"
        cp -a "$CACHE_DIR" "$exp_dir"
        cd "$exp_dir"

        # Clean any leftover beads state and init fresh
        rm -rf .beads
        bd init --quiet 2>&1 || true

        # Execute the full command chain via a fresh bash shell in the exp dir
        echo "CWD: $(pwd)"
        echo "CMD: $commands"
        bash -c "cd '$exp_dir' && set +e && $commands" 2>&1 || true

        bd sync 2>&1 || true
        bd export -o .beads/issues.jsonl 2>&1 || true
        sleep 1

        # Extract metrics
        local insights_file="$exp_dir/_insights.json"
        bv --robot-insights > "$insights_file" 2>/dev/null || echo '{}' > "$insights_file"

        local triage_file="$exp_dir/_triage.json"
        bv --robot-triage > "$triage_file" 2>/dev/null || echo '{}' > "$triage_file"

        # Compute score
        local score_json
        score_json=$(BCC_SCORE_JSON=1 python3 "$SCRIPT_DIR/score.py" "$insights_file" 2>/dev/null || echo '{"score":0,"tier":"F"}')

        # Get bead count
        local bead_count
        bead_count=$(bd list --json 2>/dev/null | "$JQ" 'length' 2>/dev/null || echo "0")
        local edge_count
        edge_count=$(cat "$insights_file" | "$JQ" '.Stats.EdgeCount // 0' 2>/dev/null || echo "0")

        local exp_end
        exp_end=$(date +%s)

        # Build result JSON
        "$JQ" -n \
            --arg id "$exp_id" \
            --arg hyp "$hypothesis" \
            --arg desc "$description" \
            --argjson score "$score_json" \
            --arg bd_ver "$BD_VERSION" \
            --argjson beads "$bead_count" \
            --argjson edges "$edge_count" \
            --argjson wall "$((exp_end - exp_start))" \
            --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
            '{
                experiment_id: $id,
                hypothesis: $hyp,
                description: $desc,
                score: $score.score,
                tier: $score.tier,
                breakdown: $score.breakdown,
                metrics: $score.metrics,
                bead_count: $beads,
                edge_count: $edges,
                wall_seconds: $wall,
                bd_version: $bd_ver,
                timestamp: $ts,
            }' > "$result_file"

        # Append to summary
        cat "$result_file" >> "$SUMMARY_FILE"
        echo "" >> "$SUMMARY_FILE"

    } > "$log_file" 2>&1

    local exit_code=$?
    rm -rf "$exp_dir"

    if [ $exit_code -eq 0 ] ; [ -f "$result_file" ]; then
        local score tier
        score=$("$JQ" -r '.score' "$result_file" 2>/dev/null || echo "?")
        tier=$("$JQ" -r '.tier' "$result_file" 2>/dev/null || echo "?")
        COMPLETED=$((COMPLETED + 1))
        ok "$exp_id: score=$score tier=$tier"
    else
        FAILED=$((FAILED + 1))
        COMPLETED=$((COMPLETED + 1))
        fail "$exp_id: FAILED (see $log_file)"
    fi
}

# ── Register all experiments ─────────────────────────────────────────────────
declare -a EXPERIMENTS=()

register() {
    EXPERIMENTS+=("$1|$2|$3|$4")
    TOTAL_EXPERIMENTS=$((TOTAL_EXPERIMENTS + 1))
}

# Wire deps is ALWAYS run after granularity to produce a connected graph
WIRE="bash $STRATEGIES_DIR/wire_deps.sh"

# H1: Granularity Sweep (5 levels x 3 runs = 15)
for level in file small-cluster module workspace directory; do
    for run in 1 2 3; do
        register "h1-${level}-r${run}" "H1" "Granularity: ${level} (run ${run})" \
            "bash $STRATEGIES_DIR/h1_granularity.sh $level strict ; $WIRE"
    done
done

# H2: Bridge Bead Sweep (5 variants x 3 runs = 15)
# Each H2 run first applies module-level granularity + wiring, then bridge variant
for variant in none router workspace both full; do
    for run in 1 2 3; do
        register "h2-${variant}-r${run}" "H2" "Bridges: ${variant} (run ${run})" \
            "bash $STRATEGIES_DIR/h1_granularity.sh module strict ; $WIRE ; bash $STRATEGIES_DIR/h2_bridges.sh $variant"
    done
done

# H3: Formula Depth Sweep (5 depths x 3 runs = 15)
# Simulated via granularity levels that approximate recursion depth
for depth in 0 1 2 3 4; do
    for run in 1 2 3; do
        local_cmds="bash $STRATEGIES_DIR/h1_granularity.sh module strict ; $WIRE"
        if [ "$depth" -ge 1 ]; then
            local_cmds="$local_cmds ; bash $STRATEGIES_DIR/h2_bridges.sh workspace"
        fi
        if [ "$depth" -ge 2 ]; then
            local_cmds="$local_cmds ; bash $STRATEGIES_DIR/h4_related_deps.sh imports"
        fi
        if [ "$depth" -ge 3 ]; then
            local_cmds="$local_cmds ; bash $STRATEGIES_DIR/h4_related_deps.sh naming"
        fi
        if [ "$depth" -ge 4 ]; then
            local_cmds="$local_cmds ; bash $STRATEGIES_DIR/h4_related_deps.sh cochange"
        fi
        register "h3-depth${depth}-r${run}" "H3" "Depth: ${depth} layers (run ${run})" \
            "$local_cmds"
    done
done

# H4: Related Deps Sweep (5 variants x 3 runs = 15)
for variant in none imports cochange naming all; do
    for run in 1 2 3; do
        register "h4-${variant}-r${run}" "H4" "Related deps: ${variant} (run ${run})" \
            "bash $STRATEGIES_DIR/h1_granularity.sh module strict ; $WIRE ; bash $STRATEGIES_DIR/h2_bridges.sh workspace ; bash $STRATEGIES_DIR/h4_related_deps.sh $variant"
    done
done

# H5: Label Taxonomy Sweep (4 variants x 3 runs = 12)
for label_mode in none free strict; do
    for run in 1 2 3; do
        register "h5-${label_mode}-r${run}" "H5" "Labels: ${label_mode} (run ${run})" \
            "bash $STRATEGIES_DIR/h1_granularity.sh module $label_mode ; $WIRE"
    done
done
# Also test coarse labels (6 labels vs 12)
for run in 1 2 3; do
    register "h5-coarse-r${run}" "H5" "Labels: coarse-6 (run ${run})" \
        "bash $STRATEGIES_DIR/h1_granularity.sh workspace strict ; $WIRE"
done

# H6: Future Work (4 variants x 3 runs = 12)
for variant in none features5 features10 features5_debt5; do
    for run in 1 2 3; do
        register "h6-${variant}-r${run}" "H6" "Future work: ${variant} (run ${run})" \
            "bash $STRATEGIES_DIR/h1_granularity.sh module strict ; $WIRE ; bash $STRATEGIES_DIR/h2_bridges.sh workspace ; bash $STRATEGIES_DIR/h6_future_work.sh $variant"
    done
done

# Combined winners (4 variants x 3 runs = 12)
for run in 1 2 3; do
    register "combo-minimal-r${run}" "COMBO" "Best granularity only (run ${run})" \
        "bash $STRATEGIES_DIR/h1_granularity.sh module strict ; $WIRE"

    register "combo-bridges-r${run}" "COMBO" "Granularity + bridges + labels (run ${run})" \
        "bash $STRATEGIES_DIR/h1_granularity.sh module strict ; $WIRE ; bash $STRATEGIES_DIR/h2_bridges.sh both"

    register "combo-full-r${run}" "COMBO" "All strategies combined (run ${run})" \
        "bash $STRATEGIES_DIR/h1_granularity.sh module strict ; $WIRE ; bash $STRATEGIES_DIR/h2_bridges.sh full ; bash $STRATEGIES_DIR/h4_related_deps.sh all ; bash $STRATEGIES_DIR/h6_future_work.sh features5_debt5"

    register "combo-kitchen-sink-r${run}" "COMBO" "Everything maxed (run ${run})" \
        "bash $STRATEGIES_DIR/h1_granularity.sh module strict ; $WIRE ; bash $STRATEGIES_DIR/h2_bridges.sh full ; bash $STRATEGIES_DIR/h4_related_deps.sh all ; bash $STRATEGIES_DIR/h6_future_work.sh features10"
done

log "Registered $TOTAL_EXPERIMENTS experiments"
log "Results dir: $RESULTS_DIR"
log "Repo: $REPO_URL"
log ""

# ── Execute all experiments ──────────────────────────────────────────────────
for entry in "${EXPERIMENTS[@]}"; do
    IFS='|' read -r exp_id hypothesis description commands <<< "$entry"
    run_experiment "$exp_id" "$hypothesis" "$description" "$commands" || true
done

# ── Final report ─────────────────────────────────────────────────────────────
BATCH_END=$(date +%s)
BATCH_DURATION=$((BATCH_END - BATCH_START))

log ""
log "════════════════════════════════════════════════════"
log "BATCH COMPLETE"
log "  Total experiments: $TOTAL_EXPERIMENTS"
log "  Completed: $COMPLETED"
log "  Failed: $FAILED"
log "  Wall time: ${BATCH_DURATION}s ($(( BATCH_DURATION / 60 ))m $(( BATCH_DURATION % 60 ))s)"
log ""

# Generate leaderboard
if [ -f "$SUMMARY_FILE" ]; then
    log "TOP 10 EXPERIMENTS BY SCORE:"
    "$JQ" -s 'sort_by(-.score)[:10] | .[] | "\(.score)/100 [\(.tier)] \(.experiment_id): \(.description)"' "$SUMMARY_FILE" 2>/dev/null | while read -r line; do
        log "  $line"
    done

    log ""
    log "PER-HYPOTHESIS AVERAGES:"
    "$JQ" -s '
        group_by(.hypothesis) | .[] |
        {
            hypothesis: .[0].hypothesis,
            avg_score: (([.[].score] | add) / ([.[].score] | length) | . * 10 | round / 10),
            min_score: ([.[].score] | min),
            max_score: ([.[].score] | max),
            count: length
        } | "\(.hypothesis): avg=\(.avg_score) min=\(.min_score) max=\(.max_score) (n=\(.count))"
    ' "$SUMMARY_FILE" 2>/dev/null | while read -r line; do
        log "  $line"
    done
fi

log ""
log "Full results: $RESULTS_DIR"
log "Summary: $SUMMARY_FILE"
