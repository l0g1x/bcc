#!/usr/bin/env bash
# Common functions for BCC experiment strategies
# Source this file: . "$(dirname "$0")/common.sh"

set -uo pipefail

JQ="${JQ:-jq}"
BD_CALLS=0
BV_CALLS=0
DEP_CALLS=0
BEADS_CREATED=0
START_TIME=$(date +%s)

_bd() {
    BD_CALLS=$((BD_CALLS + 1))
    bd "$@" 2>/dev/null || true
}

_bd_export() {
    # Export to local issues.jsonl so bv can read it
    bd export -o .beads/issues.jsonl 2>/dev/null || true
}

_bd_create() {
    BD_CALLS=$((BD_CALLS + 1))
    BEADS_CREATED=$((BEADS_CREATED + 1))
    bd create "$@" --json 2>/dev/null | tail -1
}

_bd_dep() {
    DEP_CALLS=$((DEP_CALLS + 1))
    bd dep add "$@" 2>/dev/null || true
}

_bv() {
    BV_CALLS=$((BV_CALLS + 1))
    bv "$@" 2>/dev/null
}

write_token_stats() {
    local out="${1:-/dev/stdout}"
    local end_time
    end_time=$(date +%s)
    cat <<EOF > "$out"
{
  "bd_calls": $BD_CALLS,
  "bv_calls": $BV_CALLS,
  "dep_calls": $DEP_CALLS,
  "beads_created": $BEADS_CREATED,
  "wall_seconds": $((end_time - START_TIME)),
  "total_operations": $((BD_CALLS + BV_CALLS + DEP_CALLS))
}
EOF
}

# Find source files, excluding junk directories
find_source_files() {
    local dir="${1:-.}"
    find "$dir" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \
        -o -name "*.py" -o -name "*.go" -o -name "*.rs" -o -name "*.rb" \
        -o -name "*.prisma" -o -name "*.sql" -o -name "*.graphql" \) \
        ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/vendor/*" \
        ! -path "*/.next/*" ! -path "*/dist/*" ! -path "*/build/*" \
        ! -path "*/.turbo/*" ! -path "*/.sst/*" 2>/dev/null
}

# Count files in a directory
count_files() {
    find_source_files "${1:-.}" | wc -l
}

# Get module-level directories (depth 2-3, with significant file counts)
find_modules() {
    local dir="${1:-.}"
    local min_files="${2:-2}"
    find "$dir" -mindepth 2 -maxdepth 3 -type d \
        ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/vendor/*" \
        ! -path "*/.next/*" ! -path "*/dist/*" ! -path "*/.turbo/*" ! -path "*/.sst/*" \
        2>/dev/null | while read -r d; do
        local c
        c=$(find_source_files "$d" | head -50 | wc -l)
        if [ "$c" -ge "$min_files" ]; then
            echo "$c $d"
        fi
    done | sort -rn
}

# Get workspace packages (for monorepos)
find_workspaces() {
    local dir="${1:-.}"
    # Look for package.json in subdirectories
    find "$dir" -mindepth 2 -maxdepth 3 -name "package.json" \
        ! -path "*/node_modules/*" ! -path "*/.git/*" 2>/dev/null | while read -r pj; do
        local ws_dir
        ws_dir=$(dirname "$pj")
        local name
        name=$("$JQ" -r '.name // empty' "$pj" 2>/dev/null || basename "$ws_dir")
        echo "$name $ws_dir"
    done
}

# Extract import targets from TS/JS files
extract_imports() {
    local file="$1"
    grep -oP "(?:from|require\()[\s]*['\"]([^'\"]+)['\"]" "$file" 2>/dev/null | \
        grep -oP "(?<=[\'\"])[^'\"]+(?=['\"])" | \
        grep -v "^\." | grep -v "^@types" || true
}

# Map a file to its containing module
file_to_module() {
    local file="$1"
    # Strip to depth 3 relative path
    echo "$file" | sed 's|^\./||' | cut -d'/' -f1-3
}
