#!/usr/bin/env bash
# H2: Bridge bead injection strategy
# Usage: ./h2_bridges.sh <variant> [base_granularity]
#   variant: none|router|workspace|both|full
#   base_granularity: module (default)
# Must be run AFTER a granularity strategy has created the base beads.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$SCRIPT_DIR/common.sh"

VARIANT="${1:-none}"

# Get all existing bead IDs
get_bead_ids() {
    _bv --robot-insights | "$JQ" -r '.full_stats.pagerank | keys[]' 2>/dev/null
}

get_bead_by_title_substr() {
    local substr="$1"
    bd list --json 2>/dev/null | "$JQ" -r ".[] | select(.title | test(\"$substr\"; \"i\")) | .id" 2>/dev/null | head -1
}

get_beads_by_label() {
    local label="$1"
    bd list --json 2>/dev/null | "$JQ" -r ".[] | select(.labels // [] | any(. == \"$label\")) | .id" 2>/dev/null
}

# ── Variant: router bridges ─────────────────────────────────────────────────
inject_router_bridges() {
    echo "Injecting router boundary bridges..." >&2
    # Create a single tRPC API contract bridge (not one per router file)
    local bridge_id
    bridge_id=$(_bd_create "Contract: tRPC API Layer" -t task -p 1 --label api-contract --label bridge | "$JQ" -r '.id // empty' 2>/dev/null)
    
    if [ -n "$bridge_id" ]; then
        # Wire: frontend beads -> bridge -> backend beads
        local fe_bead be_bead
        fe_bead=$(get_beads_by_label "frontend" | head -1)
        be_bead=$(get_beads_by_label "backend" | head -1)
        [ -n "$fe_bead" ] && _bd_dep "$fe_bead" "$bridge_id"
        [ -n "$be_bead" ] && _bd_dep "$bridge_id" "$be_bead"
        
        # Also wire any core beads through the bridge
        local core_bead
        core_bead=$(get_beads_by_label "core" | head -1)
        [ -n "$core_bead" ] && _bd_dep "$bridge_id" "$core_bead"
    fi
}

# ── Variant: workspace bridges ───────────────────────────────────────────────
inject_workspace_bridges() {
    echo "Injecting workspace boundary bridges..." >&2
    
    # Get workspace-level beads (epics)
    local ws_beads
    ws_beads=$(bd list --json 2>/dev/null | "$JQ" -r '.[] | select(.issue_type == "epic") | .id' 2>/dev/null)
    
    # Create a shared-types bridge
    local shared_id
    shared_id=$(_bd_create "Contract: Shared Types (@shippercrm/db exports)" -t task -p 0 --label bridge --label shared-types | "$JQ" -r '.id // empty' 2>/dev/null)
    
    if [ -n "$shared_id" ]; then
        # Everything depends on the DB package types
        local db_bead
        db_bead=$(get_bead_by_title_substr "db")
        [ -n "$db_bead" ] && _bd_dep "$shared_id" "$db_bead"
        
        # All non-db workspaces depend on shared types
        for ws in $ws_beads; do
            [ "$ws" != "$db_bead" ] && [ -n "$ws" ] && _bd_dep "$ws" "$shared_id"
        done
    fi

    # Create a UI bridge
    local ui_bridge
    ui_bridge=$(_bd_create "Contract: UI Component Library (@shippercrm/ui)" -t task -p 1 --label bridge --label ui-contract | "$JQ" -r '.id // empty' 2>/dev/null)
    
    if [ -n "$ui_bridge" ]; then
        local ui_bead
        ui_bead=$(get_bead_by_title_substr "ui")
        [ -n "$ui_bead" ] && _bd_dep "$ui_bridge" "$ui_bead"
        
        local web_bead
        web_bead=$(get_bead_by_title_substr "web")
        [ -n "$web_bead" ] && _bd_dep "$web_bead" "$ui_bridge"
    fi
}

# ── Variant: prisma schema bridge ───────────────────────────────────────────
inject_schema_bridge() {
    echo "Injecting Prisma schema bridge..." >&2
    
    local schema_id
    schema_id=$(_bd_create "Contract: Prisma Schema (data model)" -t task -p 0 --label bridge --label database --label schema | "$JQ" -r '.id // empty' 2>/dev/null)
    
    if [ -n "$schema_id" ]; then
        # Schema blocks everything that touches the database
        for bid in $(get_beads_by_label "database" | head -5); do
            [ -n "$bid" ] && [ "$bid" != "$schema_id" ] && _bd_dep "$bid" "$schema_id"
        done
        for bid in $(get_beads_by_label "backend" | head -5); do
            [ -n "$bid" ] && _bd_dep "$bid" "$schema_id"
        done
    fi
}

# ── Execute variant ──────────────────────────────────────────────────────────
case "$VARIANT" in
    none)
        echo "No bridges (control)" >&2
        ;;
    router)
        inject_router_bridges
        ;;
    workspace)
        inject_workspace_bridges
        ;;
    both)
        inject_router_bridges
        inject_workspace_bridges
        ;;
    full)
        inject_router_bridges
        inject_workspace_bridges
        inject_schema_bridge
        ;;
    *) echo "Unknown variant: $VARIANT" >&2; exit 1 ;;
esac

_bd sync
_bd_export
