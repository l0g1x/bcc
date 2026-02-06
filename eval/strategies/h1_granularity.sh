#!/usr/bin/env bash
# H1: Granularity strategy - creates beads at different file:bead ratios
# Usage: ./h1_granularity.sh <level> [label_mode]
#   level: file|small-cluster|module|workspace|directory
#   label_mode: none|strict|free (default: strict)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$SCRIPT_DIR/common.sh"

LEVEL="${1:-module}"
LABEL_MODE="${2:-strict}"
MAX_BEADS="${3:-200}"

declare -A BEAD_IDS  # module_path -> bead_id

apply_label() {
    local path="$1"
    case "$LABEL_MODE" in
        none) echo "" ;;
        strict)
            # Map path to domain label
            case "$path" in
                *frontend*|*web*|*ui*|*component*) echo "--label frontend" ;;
                *backend*|*server*|*api*|*trpc*|*router*) echo "--label backend" ;;
                *database*|*db*|*prisma*|*migration*|*schema*) echo "--label database" ;;
                *auth*|*session*|*login*) echo "--label auth" ;;
                *test*|*spec*|*__test*) echo "--label test" ;;
                *config*|*env*|*.config*) echo "--label config" ;;
                *shared*|*common*|*lib*|*util*) echo "--label shared" ;;
                *infra*|*deploy*|*docker*|*ci*) echo "--label infra" ;;
                *notification*|*email*|*sms*) echo "--label notifications" ;;
                *docs*|*README*) echo "--label docs" ;;
                *) echo "--label core" ;;
            esac
            ;;
        free)
            # Use the directory name as label
            local lbl
            lbl=$(basename "$(dirname "$path")" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9-' '-')
            echo "--label $lbl"
            ;;
    esac
}

create_bead_for_path() {
    local title="$1"
    local btype="$2"
    local priority="$3"
    local path="$4"
    local label_args
    label_args=$(apply_label "$path")

    local result
    result=$(_bd_create "$title" -t "$btype" -p "$priority" $label_args)
    local id
    id=$(echo "$result" | "$JQ" -r '.id // empty' 2>/dev/null)
    if [ -n "$id" ]; then
        BEAD_IDS["$path"]="$id"
        echo "$id"
    fi
}

# ── Level: file ──────────────────────────────────────────────────────────────
strategy_file() {
    echo "Strategy: file-level (1:1)" >&2
    find_source_files . | head -"$MAX_BEADS" | while read -r f; do
        local name
        name=$(basename "$f")
        create_bead_for_path "File: $name" "task" "2" "$f" > /dev/null
    done
}

# ── Level: small-cluster (3-5 files per bead) ───────────────────────────────
strategy_small_cluster() {
    echo "Strategy: small-cluster (3-5 files per bead)" >&2
    find_modules . 2 | head -"$MAX_BEADS" | while read -r line; do
        local count dir
        count=$(echo "$line" | awk '{print $1}')
        dir=$(echo "$line" | awk '{$1=""; print $0}' | sed 's/^ //')
        local name
        name=$(basename "$dir")
        if [ "$count" -le 5 ]; then
            create_bead_for_path "Cluster: $name ($count files)" "task" "2" "$dir" > /dev/null
        else
            # Split into sub-clusters
            create_bead_for_path "Module: $name ($count files)" "feature" "2" "$dir" > /dev/null
        fi
    done
}

# ── Level: module (5-15 files per bead) ──────────────────────────────────────
strategy_module() {
    echo "Strategy: module-level (5-15 files per bead)" >&2

    # First create workspace-level epics
    find_workspaces . | while read -r line; do
        local ws_name ws_dir
        ws_name=$(echo "$line" | awk '{print $1}')
        ws_dir=$(echo "$line" | awk '{$1=""; print $0}' | sed 's/^ //')
        create_bead_for_path "Package: $ws_name" "epic" "1" "$ws_dir" > /dev/null
    done

    # Then create module-level features
    find_modules . 3 | head -"$MAX_BEADS" | while read -r line; do
        local count dir
        count=$(echo "$line" | awk '{print $1}')
        dir=$(echo "$line" | awk '{$1=""; print $0}' | sed 's/^ //')
        local name
        name=$(basename "$dir")
        local parent_dir
        parent_dir=$(dirname "$dir")

        local btype="feature"
        local pri="2"
        if [ "$count" -ge 15 ]; then
            btype="feature"
            pri="1"
        fi

        create_bead_for_path "Module: $name ($count files)" "$btype" "$pri" "$dir" > /dev/null
    done
}

# ── Level: workspace ─────────────────────────────────────────────────────────
strategy_workspace() {
    echo "Strategy: workspace-level" >&2
    find_workspaces . | while read -r line; do
        local ws_name ws_dir
        ws_name=$(echo "$line" | awk '{print $1}')
        ws_dir=$(echo "$line" | awk '{$1=""; print $0}' | sed 's/^ //')
        local count
        count=$(find_source_files "$ws_dir" | wc -l)
        create_bead_for_path "Workspace: $ws_name ($count files)" "epic" "1" "$ws_dir" > /dev/null
    done
}

# ── Level: directory (top-level only) ────────────────────────────────────────
strategy_directory() {
    echo "Strategy: directory-level (top dirs only)" >&2
    find . -mindepth 1 -maxdepth 1 -type d \
        ! -name "node_modules" ! -name ".git" ! -name ".next" \
        ! -name "dist" ! -name ".turbo" ! -name ".sst" | while read -r d; do
        local name
        name=$(basename "$d")
        local count
        count=$(find_source_files "$d" | wc -l)
        if [ "$count" -gt 0 ]; then
            create_bead_for_path "Dir: $name ($count files)" "epic" "1" "$d" > /dev/null
        fi
    done
}

# ── Execute ──────────────────────────────────────────────────────────────────
case "$LEVEL" in
    file)           strategy_file ;;
    small-cluster)  strategy_small_cluster ;;
    module)         strategy_module ;;
    workspace)      strategy_workspace ;;
    directory)      strategy_directory ;;
    *) echo "Unknown level: $LEVEL" >&2; exit 1 ;;
esac

_bd sync
_bd_export
echo "Created $BEADS_CREATED beads at granularity=$LEVEL" >&2
