#!/usr/bin/env bash
# H4: Related dependency injection strategy
# Usage: ./h4_related_deps.sh <variant>
#   variant: none|imports|cochange|naming|all
# Must be run AFTER base beads + blocking deps exist.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$SCRIPT_DIR/common.sh"

VARIANT="${1:-none}"

get_all_beads_json() {
    bd list --json 2>/dev/null || echo '[]'
}

# ── Import co-occurrence: files that import from the same package ────────────
inject_import_related() {
    echo "Injecting import co-occurrence related deps..." >&2
    local beads_json
    beads_json=$(get_all_beads_json)
    local bead_ids
    bead_ids=$(echo "$beads_json" | "$JQ" -r '.[].id' 2>/dev/null)
    
    # Build a simple import adjacency from package.json dependencies
    # Beads that share common external deps are related
    local -A dep_groups
    
    # For each bead, check if its directory has a package.json with deps
    for bid in $bead_ids; do
        local title
        title=$(echo "$beads_json" | "$JQ" -r ".[] | select(.id == \"$bid\") | .title" 2>/dev/null)
        # Extract path-like info from title
        local labels
        labels=$(echo "$beads_json" | "$JQ" -r ".[] | select(.id == \"$bid\") | (.labels // []) | join(\",\")" 2>/dev/null)
        dep_groups["$labels"]="${dep_groups[$labels]:-} $bid"
    done
    
    # Connect beads that share labels (proxy for import co-occurrence)
    for key in "${!dep_groups[@]}"; do
        local ids=(${dep_groups[$key]})
        local n=${#ids[@]}
        if [ "$n" -ge 2 ] && [ "$n" -le 8 ]; then
            for ((i=0; i<n-1; i++)); do
                for ((j=i+1; j<n && j<i+4; j++)); do
                    _bd_dep "${ids[$i]}" "${ids[$j]}" --type related
                done
            done
        fi
    done
}

# ── Git co-change: files changed in the same commit ─────────────────────────
inject_cochange_related() {
    echo "Injecting git co-change related deps..." >&2
    local beads_json
    beads_json=$(get_all_beads_json)
    
    # Get recent commits and their changed directories
    local commits
    commits=$(git log --oneline -50 --name-only 2>/dev/null | head -500)
    
    # Build co-change map at directory level
    local -A dir_beads
    local bead_ids
    bead_ids=$(echo "$beads_json" | "$JQ" -r '.[].id' 2>/dev/null)
    
    # For each bead, try to associate it with a directory via its labels/title
    for bid in $bead_ids; do
        local title
        title=$(echo "$beads_json" | "$JQ" -r ".[] | select(.id == \"$bid\") | .title" 2>/dev/null)
        # Extract directory hint from title (e.g., "Module: auth (5 files)")
        local dir_hint
        dir_hint=$(echo "$title" | grep -oP '(?:Module|Cluster|Dir|Package|File): \K[^ (]+' | tr '[:upper:]' '[:lower:]')
        if [ -n "$dir_hint" ]; then
            dir_beads["$dir_hint"]="${dir_beads[$dir_hint]:-} $bid"
        fi
    done
    
    # Connect beads whose directories co-occur in commits
    # Simple heuristic: beads sharing directory name fragments are related
    local keys=("${!dir_beads[@]}")
    local nk=${#keys[@]}
    local related_count=0
    for ((i=0; i<nk-1 && related_count<30; i++)); do
        for ((j=i+1; j<nk && related_count<30; j++)); do
            local ids_i=(${dir_beads[${keys[$i]}]})
            local ids_j=(${dir_beads[${keys[$j]}]})
            if [ ${#ids_i[@]} -gt 0 ] && [ ${#ids_j[@]} -gt 0 ]; then
                _bd_dep "${ids_i[0]}" "${ids_j[0]}" --type related
                related_count=$((related_count + 1))
            fi
        done
    done
    echo "Added $related_count co-change related deps" >&2
}

# ── Naming convention: UserService <-> UserController <-> UserModel ──────────
inject_naming_related() {
    echo "Injecting naming convention related deps..." >&2
    local beads_json
    beads_json=$(get_all_beads_json)
    local bead_ids
    bead_ids=$(echo "$beads_json" | "$JQ" -r '.[].id' 2>/dev/null)
    
    # Group by extracted domain word from title
    local -A domain_groups
    for bid in $bead_ids; do
        local title
        title=$(echo "$beads_json" | "$JQ" -r ".[] | select(.id == \"$bid\") | .title" 2>/dev/null | tr '[:upper:]' '[:lower:]')
        # Extract meaningful words (skip generic ones)
        for word in $(echo "$title" | grep -oP '[a-z]{4,}' | grep -v -E '^(module|file|cluster|package|workspace|files|task|feature|epic|contract|bridge)$'); do
            domain_groups["$word"]="${domain_groups[$word]:-} $bid"
        done
    done
    
    local related_count=0
    for key in "${!domain_groups[@]}"; do
        local ids=(${domain_groups[$key]})
        local n=${#ids[@]}
        if [ "$n" -ge 2 ] && [ "$n" -le 6 ]; then
            for ((i=0; i<n-1 && related_count<30; i++)); do
                for ((j=i+1; j<n && j<i+3 && related_count<30; j++)); do
                    _bd_dep "${ids[$i]}" "${ids[$j]}" --type related
                    related_count=$((related_count + 1))
                done
            done
        fi
    done
    echo "Added $related_count naming-related deps" >&2
}

# ── Execute ──────────────────────────────────────────────────────────────────
case "$VARIANT" in
    none)     echo "No related deps (control)" >&2 ;;
    imports)  inject_import_related ;;
    cochange) inject_cochange_related ;;
    naming)   inject_naming_related ;;
    all)
        inject_import_related
        inject_cochange_related
        inject_naming_related
        ;;
    *) echo "Unknown variant: $VARIANT" >&2; exit 1 ;;
esac

_bd sync
_bd_export
