#!/usr/bin/env bash
set -euo pipefail

# Mirror beads-ide epic for A/B delivery skill testing
# Creates two copies: beads-ide-ed (epic-delivery) and beads-ide-cv (convoy-delivery)
#
# Usage: ./mirror-beads-ide.sh <suffix>
#   suffix: "ed" or "cv"

SUFFIX="${1:?Usage: $0 <ed|cv>}"
if [[ "$SUFFIX" != "ed" && "$SUFFIX" != "cv" ]]; then
  echo "Error: suffix must be 'ed' or 'cv'" >&2
  exit 1
fi

ORIG="bcc-nxk2o"
LABEL="beads-ide-${SUFFIX}"

echo "=== Creating mirrored epic: ${LABEL} ==="
echo ""

# Helper: extract field from bd show --json
extract() {
  local id="$1" field="$2"
  bd show "$id" --json 2>/dev/null | python3 -c "
import json, sys
data = json.load(sys.stdin)
val = data[0].get('$field', '')
if val is None: val = ''
print(val)
"
}

# Helper: create bead and capture ID
create_bead() {
  local title="$1" type="$2" parent="$3" desc="$4" ac="$5" priority="$6"
  local args=("$title" -t "$type" --parent "$parent" -p "$priority" --silent)
  if [[ -n "$ac" ]]; then
    args+=(--acceptance "$ac")
  fi
  if [[ -n "$desc" ]]; then
    echo "$desc" | bd create "${args[@]}" --body-file -
  else
    bd create "${args[@]}"
  fi
}

# ============================================================================
# Step 1: Create root epic
# ============================================================================
echo "--- Step 1: Creating root epic ---"

ORIG_DESC=$(extract "$ORIG" "description")
# Tag the description with delivery method
if [[ "$SUFFIX" == "ed" ]]; then
  ROOT_DESC="delivery_method: epic-delivery
${ORIG_DESC}"
else
  ROOT_DESC="delivery_method: convoy-delivery
${ORIG_DESC}"
fi

ROOT_ID=$(echo "$ROOT_DESC" | bd create "$LABEL" -t epic -p 1 --silent --body-file -)
echo "Root epic: $ROOT_ID"

# ============================================================================
# Step 2: Create phase sub-epics
# ============================================================================
echo ""
echo "--- Step 2: Creating phase sub-epics ---"

declare -A PHASE_IDS

for p in 1 2 3 4 5; do
  orig_phase="${ORIG}.${p}"
  title=$(extract "$orig_phase" "title")
  desc=$(extract "$orig_phase" "description")
  priority=$(extract "$orig_phase" "priority")

  phase_id=$(echo "$desc" | bd create "$title" -t epic --parent "$ROOT_ID" -p "$priority" --silent --body-file -)
  PHASE_IDS[$p]="$phase_id"
  echo "  Phase $p: $phase_id ($title)"
done

# ============================================================================
# Step 3: Create tasks (all 29)
# ============================================================================
echo ""
echo "--- Step 3: Creating tasks ---"

# Map: original suffix -> new bead ID
declare -A TASK_IDS

# Phase 1: 6 tasks
# Phase 2: 7 tasks
# Phase 3: 6 tasks
# Phase 4: 5 tasks
# Phase 5: 5 tasks

PHASE_TASK_COUNTS=(
  [1]=6
  [2]=7
  [3]=6
  [4]=5
  [5]=5
)

for p in 1 2 3 4 5; do
  count=${PHASE_TASK_COUNTS[$p]}
  parent_id="${PHASE_IDS[$p]}"
  for t in $(seq 1 "$count"); do
    orig_task="${ORIG}.${p}.${t}"
    suffix_key="${p}.${t}"

    title=$(extract "$orig_task" "title")
    desc=$(extract "$orig_task" "description")
    ac=$(extract "$orig_task" "acceptance_criteria")
    priority=$(extract "$orig_task" "priority")

    task_id=$(create_bead "$title" "task" "$parent_id" "$desc" "$ac" "$priority")
    TASK_IDS["$suffix_key"]="$task_id"
    echo "  Task ${suffix_key}: $task_id ($title)"
  done
done

# ============================================================================
# Step 4: Add blocking dependencies
# ============================================================================
echo ""
echo "--- Step 4: Adding blocking dependencies ---"

# Dependency map: task -> deps (space-separated suffix keys)
# Format: add_deps <task-suffix> <dep-suffix1> [dep-suffix2] ...
add_deps() {
  local task_suffix="$1"
  shift
  local task_id="${TASK_IDS[$task_suffix]}"
  for dep_suffix in "$@"; do
    local dep_id="${TASK_IDS[$dep_suffix]}"
    echo "  $task_suffix ($task_id) blocked-by $dep_suffix ($dep_id)"
    bd dep add "$task_id" "$dep_id" 2>/dev/null || {
      echo "    WARNING: failed to add dep $dep_id -> $task_id" >&2
    }
  done
}

# Phase 1
# 1.1 — no deps (Wave 1)
add_deps "1.2" "1.1"
add_deps "1.3" "1.1"
add_deps "1.4" "1.1" "1.2"
add_deps "1.5" "1.1"
add_deps "1.6" "1.1" "1.3"

# Phase 2
add_deps "2.1" "1.2" "1.3" "1.6"
add_deps "2.2" "1.2" "1.3" "1.6"
add_deps "2.3" "1.2" "1.3" "1.6"
add_deps "2.4" "1.5"
add_deps "2.5" "1.5" "2.1"
add_deps "2.6" "1.5"
add_deps "2.7" "1.5"

# Phase 3
add_deps "3.1" "2.1" "2.4"
add_deps "3.2" "3.1"
add_deps "3.3" "2.1" "3.1"
add_deps "3.4" "2.1" "3.1"
add_deps "3.5" "2.2" "2.4"
add_deps "3.6" "3.5"

# Phase 4
add_deps "4.1" "1.4" "3.5"
add_deps "4.2" "2.3" "2.7" "3.5" "3.6"
add_deps "4.3" "4.2"
add_deps "4.4" "2.1" "3.4"
add_deps "4.5" "2.1" "3.1"

# Phase 5
add_deps "5.1" "2.7" "3.1"
add_deps "5.2" "3.1" "3.4" "4.4" "4.5"
add_deps "5.3" "2.5" "2.6" "3.2" "3.3" "3.4" "3.5" "3.6" "4.1" "4.3" "4.4" "4.5"
add_deps "5.4" "4.2"
add_deps "5.5" "3.1" "3.2" "3.3" "3.4" "3.6" "4.1" "4.3" "4.4" "4.5"

# ============================================================================
# Step 5: Verify
# ============================================================================
echo ""
echo "--- Step 5: Verification ---"

CHILD_COUNT=$(bd list --parent "$ROOT_ID" --all --limit 0 --json 2>/dev/null | python3 -c "import json,sys; print(len(json.load(sys.stdin)))")
echo "Total children: $CHILD_COUNT (expected: 34 = 5 sub-epics + 29 tasks)"

echo ""
echo "=== Done: $LABEL ==="
echo "Root epic ID: $ROOT_ID"
echo ""

# Output the root ID for downstream use
echo "$ROOT_ID" > "/tmp/beads-ide-${SUFFIX}-root-id.txt"
