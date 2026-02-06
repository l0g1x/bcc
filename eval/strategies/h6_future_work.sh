#!/usr/bin/env bash
# H6: Future work bead injection
# Usage: ./h6_future_work.sh <variant>
#   variant: none|features5|features10|features5_debt5
# Must be run AFTER base code graph exists.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$SCRIPT_DIR/common.sh"

VARIANT="${1:-none}"

get_bead_by_label() {
    local label="$1"
    bd list --json 2>/dev/null | "$JQ" -r ".[] | select(.labels // [] | any(. == \"$label\")) | .id" 2>/dev/null | head -1
}

inject_features() {
    local count="${1:-5}"
    echo "Injecting $count planned feature beads..." >&2
    
    local auth_bead db_bead backend_bead frontend_bead api_bead
    auth_bead=$(get_bead_by_label "auth")
    db_bead=$(get_bead_by_label "database")
    backend_bead=$(get_bead_by_label "backend")
    frontend_bead=$(get_bead_by_label "frontend")
    api_bead=$(get_bead_by_label "api-contract")

    # Feature 1: Multi-tenant support
    local f1
    f1=$(_bd_create "Feature: Multi-Tenant Support" -t epic -p 0 --label planned --label multi-tenant | "$JQ" -r '.id // empty' 2>/dev/null)
    [ -n "$f1" ] && [ -n "$db_bead" ] && _bd_dep "$f1" "$db_bead"
    [ -n "$f1" ] && [ -n "$auth_bead" ] && _bd_dep "$f1" "$auth_bead"

    # Feature 2: Webhook system
    local f2
    f2=$(_bd_create "Feature: Webhook Event System" -t feature -p 1 --label planned --label webhooks | "$JQ" -r '.id // empty' 2>/dev/null)
    [ -n "$f2" ] && [ -n "$backend_bead" ] && _bd_dep "$f2" "$backend_bead"
    [ -n "$f2" ] && [ -n "$api_bead" ] && _bd_dep "$f2" "$api_bead"

    # Feature 3: Audit logging
    local f3
    f3=$(_bd_create "Feature: Audit Log & Activity Stream" -t feature -p 1 --label planned --label audit | "$JQ" -r '.id // empty' 2>/dev/null)
    [ -n "$f3" ] && [ -n "$db_bead" ] && _bd_dep "$f3" "$db_bead"
    [ -n "$f3" ] && [ -n "$backend_bead" ] && _bd_dep "$f3" "$backend_bead"

    # Feature 4: SSO / OAuth2
    local f4
    f4=$(_bd_create "Feature: SSO & OAuth2 Integration" -t feature -p 1 --label planned --label auth --label sso | "$JQ" -r '.id // empty' 2>/dev/null)
    [ -n "$f4" ] && [ -n "$auth_bead" ] && _bd_dep "$f4" "$auth_bead"
    [ -n "$f4" ] && [ -n "$frontend_bead" ] && _bd_dep "$f4" "$frontend_bead"

    # Feature 5: Mobile API
    local f5
    f5=$(_bd_create "Feature: Mobile-Optimized REST API" -t feature -p 2 --label planned --label mobile --label api | "$JQ" -r '.id // empty' 2>/dev/null)
    [ -n "$f5" ] && [ -n "$api_bead" ] && _bd_dep "$f5" "$api_bead"
    [ -n "$f5" ] && [ -n "$auth_bead" ] && _bd_dep "$f5" "$auth_bead"

    # Inter-feature deps (features depend on each other)
    [ -n "$f2" ] && [ -n "$f3" ] && _bd_dep "$f2" "$f3" --type related  # webhooks <-> audit
    [ -n "$f4" ] && [ -n "$f1" ] && _bd_dep "$f4" "$f1" --type related  # SSO <-> multi-tenant

    if [ "$count" -ge 10 ]; then
        # Feature 6: Real-time notifications
        local f6
        f6=$(_bd_create "Feature: Real-Time Notifications (WebSocket)" -t feature -p 1 --label planned --label notifications | "$JQ" -r '.id // empty' 2>/dev/null)
        [ -n "$f6" ] && [ -n "$frontend_bead" ] && _bd_dep "$f6" "$frontend_bead"
        [ -n "$f6" ] && [ -n "$backend_bead" ] && _bd_dep "$f6" "$backend_bead"

        # Feature 7: Advanced reporting
        local f7
        f7=$(_bd_create "Feature: Advanced Reporting Dashboard" -t feature -p 2 --label planned --label reporting | "$JQ" -r '.id // empty' 2>/dev/null)
        [ -n "$f7" ] && [ -n "$db_bead" ] && _bd_dep "$f7" "$db_bead"
        [ -n "$f7" ] && [ -n "$frontend_bead" ] && _bd_dep "$f7" "$frontend_bead"

        # Feature 8: Bulk import/export
        local f8
        f8=$(_bd_create "Feature: Bulk Data Import/Export" -t feature -p 2 --label planned --label data-pipeline | "$JQ" -r '.id // empty' 2>/dev/null)
        [ -n "$f8" ] && [ -n "$db_bead" ] && _bd_dep "$f8" "$db_bead"

        # Feature 9: Rate limiting & quotas
        local f9
        f9=$(_bd_create "Feature: Rate Limiting & Usage Quotas" -t task -p 1 --label planned --label api --label infra | "$JQ" -r '.id // empty' 2>/dev/null)
        [ -n "$f9" ] && [ -n "$api_bead" ] && _bd_dep "$f9" "$api_bead"
        [ -n "$f9" ] && [ -n "$f1" ] && _bd_dep "$f9" "$f1"  # quotas need multi-tenant

        # Feature 10: Custom fields
        local f10
        f10=$(_bd_create "Feature: Custom Fields & Dynamic Schema" -t epic -p 1 --label planned --label customization | "$JQ" -r '.id // empty' 2>/dev/null)
        [ -n "$f10" ] && [ -n "$db_bead" ] && _bd_dep "$f10" "$db_bead"
        [ -n "$f10" ] && [ -n "$frontend_bead" ] && _bd_dep "$f10" "$frontend_bead"
        [ -n "$f10" ] && [ -n "$f1" ] && _bd_dep "$f10" "$f1"
    fi
}

inject_debt() {
    echo "Injecting 5 tech debt beads..." >&2
    
    local db_bead backend_bead frontend_bead
    db_bead=$(get_bead_by_label "database")
    backend_bead=$(get_bead_by_label "backend")
    frontend_bead=$(get_bead_by_label "frontend")

    local d1 d2 d3 d4 d5
    d1=$(_bd_create "Debt: Migrate from NextAuth v4 to v5" -t bug -p 1 --label tech-debt --label auth | "$JQ" -r '.id // empty' 2>/dev/null)
    d2=$(_bd_create "Debt: Replace any-typed tRPC handlers" -t bug -p 2 --label tech-debt --label backend | "$JQ" -r '.id // empty' 2>/dev/null)
    d3=$(_bd_create "Debt: Consolidate duplicate Prisma queries" -t bug -p 2 --label tech-debt --label database | "$JQ" -r '.id // empty' 2>/dev/null)
    d4=$(_bd_create "Debt: Extract shared validation schemas" -t bug -p 1 --label tech-debt --label shared | "$JQ" -r '.id // empty' 2>/dev/null)
    d5=$(_bd_create "Debt: Remove unused UI components" -t bug -p 3 --label tech-debt --label frontend | "$JQ" -r '.id // empty' 2>/dev/null)
    
    [ -n "$d1" ] && [ -n "$(get_bead_by_label auth)" ] && _bd_dep "$d1" "$(get_bead_by_label auth)"
    [ -n "$d2" ] && [ -n "$backend_bead" ] && _bd_dep "$d2" "$backend_bead"
    [ -n "$d3" ] && [ -n "$db_bead" ] && _bd_dep "$d3" "$db_bead"
    [ -n "$d5" ] && [ -n "$frontend_bead" ] && _bd_dep "$d5" "$frontend_bead"
    
    # Debt items can be related to features (fixing debt enables features)
    [ -n "$d4" ] && [ -n "$d2" ] && _bd_dep "$d4" "$d2" --type related
}

# ── Execute ──────────────────────────────────────────────────────────────────
case "$VARIANT" in
    none)             echo "No future work (control)" >&2 ;;
    features5)        inject_features 5 ;;
    features10)       inject_features 10 ;;
    features5_debt5)  inject_features 5; inject_debt ;;
    *) echo "Unknown variant: $VARIANT" >&2; exit 1 ;;
esac

_bd sync
_bd_export
