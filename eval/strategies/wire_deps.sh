#!/usr/bin/env bash
# Universal dependency wiring strategy
# Infers blocking deps from workspace structure and filesystem hierarchy.
# Usage: ./wire_deps.sh
# Must be run AFTER beads have been created by a granularity strategy.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$SCRIPT_DIR/common.sh"

JQ="${JQ:-jq}"

echo "Wiring dependencies..." >&2

# Get all beads as JSON
BEADS_JSON=$(bd list --json 2>/dev/null || echo '[]')
BEAD_COUNT=$(echo "$BEADS_JSON" | "$JQ" 'length' 2>/dev/null || echo 0)
echo "Found $BEAD_COUNT beads to wire" >&2

if [ "$BEAD_COUNT" -lt 2 ]; then
    echo "Too few beads to wire" >&2
    exit 0
fi

# ── Step 1: Parent-child deps (epics -> features -> tasks) ──────────────────
echo "  Step 1: Parent-child wiring..." >&2

# Epics (workspace-level beads)
EPICS=$(echo "$BEADS_JSON" | "$JQ" -r '.[] | select(.issue_type == "epic") | .id' 2>/dev/null)
# Features/tasks (module-level beads)
FEATURES=$(echo "$BEADS_JSON" | "$JQ" -r '.[] | select(.issue_type == "feature" or .issue_type == "task") | .id' 2>/dev/null)

# Map features to their closest epic by label overlap
for fid in $FEATURES; do
    f_labels=$(echo "$BEADS_JSON" | "$JQ" -r ".[] | select(.id == \"$fid\") | (.labels // []) | join(\",\")" 2>/dev/null)
    f_title=$(echo "$BEADS_JSON" | "$JQ" -r ".[] | select(.id == \"$fid\") | .title" 2>/dev/null | tr '[:upper:]' '[:lower:]')

    best_epic=""
    for eid in $EPICS; do
        e_title=$(echo "$BEADS_JSON" | "$JQ" -r ".[] | select(.id == \"$eid\") | .title" 2>/dev/null | tr '[:upper:]' '[:lower:]')
        # Check if the epic's name substring is in the feature's title or labels
        e_keyword=$(echo "$e_title" | grep -oP '(?:package|workspace|dir): \K\S+' | tr -d '()')
        if [ -n "$e_keyword" ]; then
            if echo "$f_title $f_labels" | grep -qi "$e_keyword"; then
                best_epic="$eid"
                break
            fi
        fi
    done

    # Also check: is the feature's path a child of the epic's path?
    if [ -z "$best_epic" ]; then
        # Try matching by common label
        for eid in $EPICS; do
            e_labels=$(echo "$BEADS_JSON" | "$JQ" -r ".[] | select(.id == \"$eid\") | (.labels // []) | join(\",\")" 2>/dev/null)
            for label in $(echo "$f_labels" | tr ',' '\n'); do
                if echo ",$e_labels," | grep -q ",$label,"; then
                    best_epic="$eid"
                    break 2
                fi
            done
        done
    fi

    if [ -n "$best_epic" ] && [ "$fid" != "$best_epic" ]; then
        _bd_dep "$fid" "$best_epic" --type parent
    fi
done

# ── Step 2: Blocking deps based on workspace dependency structure ────────────
echo "  Step 2: Blocking deps from workspace structure..." >&2

# In a monorepo, packages depend on each other. Common patterns:
# - apps/web depends on packages/* (web imports from db, backend, ui)
# - packages/backend depends on packages/db
# - packages/notifications depends on packages/db
# - packages/ui is standalone or depends on db types

# Find beads by title pattern
find_bead_id() {
    local pattern="$1"
    echo "$BEADS_JSON" | "$JQ" -r ".[] | select(.title | test(\"$pattern\"; \"i\")) | .id" 2>/dev/null | head -1
}

web_bead=$(find_bead_id "web")
db_bead=$(find_bead_id "db")
backend_bead=$(find_bead_id "backend")
ui_bead=$(find_bead_id "ui")
notif_bead=$(find_bead_id "notif")

# Wire the standard monorepo deps
[ -n "$web_bead" ] && [ -n "$backend_bead" ] && _bd_dep "$web_bead" "$backend_bead"
[ -n "$web_bead" ] && [ -n "$db_bead" ] && _bd_dep "$web_bead" "$db_bead"
[ -n "$web_bead" ] && [ -n "$ui_bead" ] && _bd_dep "$web_bead" "$ui_bead"
[ -n "$backend_bead" ] && [ -n "$db_bead" ] && _bd_dep "$backend_bead" "$db_bead"
[ -n "$notif_bead" ] && [ -n "$db_bead" ] && _bd_dep "$notif_bead" "$db_bead"
[ -n "$notif_bead" ] && [ -n "$backend_bead" ] && _bd_dep "$notif_bead" "$backend_bead"

# ── Step 3: Infer deps between modules within same workspace ─────────────────
echo "  Step 3: Intra-workspace module deps..." >&2

# Sort features by priority (P0 first) and create a chain within each label group
# This ensures a dependency flow within each domain
declare -A LABEL_CHAINS
for fid in $FEATURES; do
    f_labels=$(echo "$BEADS_JSON" | "$JQ" -r ".[] | select(.id == \"$fid\") | (.labels // [])[0] // \"\"" 2>/dev/null)
    if [ -n "$f_labels" ]; then
        LABEL_CHAINS["$f_labels"]="${LABEL_CHAINS[$f_labels]:-} $fid"
    fi
done

for label in "${!LABEL_CHAINS[@]}"; do
    chain_ids=(${LABEL_CHAINS[$label]})
    chain_n=${#chain_ids[@]}
    if [ "$chain_n" -ge 2 ]; then
        # Chain them: first blocks second, second blocks third, etc.
        for ((i=1; i<chain_n && i<5; i++)); do
            _bd_dep "${chain_ids[$i]}" "${chain_ids[$((i-1))]}"
        done
    fi
done

# ── Step 4: Cross-label deps (backend modules block frontend modules) ────────
echo "  Step 4: Cross-label structural deps..." >&2

# Get first bead from each important label group
get_first_by_label() {
    local label="$1"
    echo "$BEADS_JSON" | "$JQ" -r ".[] | select(.issue_type != \"epic\") | select(.labels // [] | any(. == \"$label\")) | .id" 2>/dev/null | head -1
}

fe_rep=$(get_first_by_label "frontend")
be_rep=$(get_first_by_label "backend")
db_rep=$(get_first_by_label "database")
auth_rep=$(get_first_by_label "auth")
config_rep=$(get_first_by_label "config")
shared_rep=$(get_first_by_label "shared")

# Standard cross-label flow: config -> db -> auth -> backend -> frontend
[ -n "$db_rep" ] && [ -n "$config_rep" ] && _bd_dep "$db_rep" "$config_rep"
[ -n "$auth_rep" ] && [ -n "$db_rep" ] && _bd_dep "$auth_rep" "$db_rep"
[ -n "$be_rep" ] && [ -n "$auth_rep" ] && _bd_dep "$be_rep" "$auth_rep"
[ -n "$fe_rep" ] && [ -n "$be_rep" ] && _bd_dep "$fe_rep" "$be_rep"
[ -n "$shared_rep" ] && [ -n "$db_rep" ] && _bd_dep "$shared_rep" "$db_rep" --type related

_bd sync
_bd_export
echo "Dependency wiring complete" >&2
