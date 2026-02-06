# Bead Data Schema

> Source: `~/beads/internal/types/types.go` (Go structs, validated against SQLite schema)

---

## Issue Types

| Type | Source | Notes |
|------|--------|-------|
| `bug` | built-in | Defect |
| `feature` | built-in | New capability (aliases: `enhancement`, `feat`) |
| `task` | built-in | Unit of work **(DEFAULT)** |
| `epic` | built-in | Large initiative spanning multiple issues |
| `chore` | built-in | Maintenance / housekeeping |
| `event` | built-in | System-internal audit trail bead |
| `molecule` | custom | Spawned workflow instance |
| `gate` | custom | Fanout / sync point in a workflow |
| `convoy` | custom | Group of coordinated agents |
| `merge-request` | custom | Code review unit |
| `slot` | custom | Exclusive access lock |
| `agent` | custom | Represents an AI agent |
| `role` | custom | Agent role definition |
| `rig` | custom | Agent rig/environment |
| `message` | custom | Messaging between agents |

- **Built-in** = hardcoded in `types.go` (6 types)
- **Custom** = configured via `bd config set types.custom "..."` (not intrinsic)

---

## Statuses

| Status | Meaning |
|--------|---------|
| `open` | **DEFAULT**. Available work. |
| `in_progress` | Actively being worked on |
| `blocked` | Cannot proceed |
| `deferred` | Deliberately put on ice |
| `closed` | Completed (requires `closed_at` timestamp) |
| `tombstone` | Soft-deleted (requires `deleted_at` timestamp) |
| `pinned` | Persistent context marker, stays open indefinitely |
| `hooked` | Attached to an agent's hook (GUPP system) |

Custom statuses also supported via `bd config set status.custom "..."`

---

## Dependency Types (18 well-known)

| Type | Category | Semantics |
|------|----------|-----------|
| `blocks` | workflow | A cannot proceed until B done |
| `parent-child` | workflow | Hierarchical containment |
| `conditional-blocks` | workflow | B runs only if A FAILS |
| `waits-for` | workflow | Fanout gate: wait for dynamic children |
| `related` | association | Generic non-blocking association |
| `discovered-from` | association | Origin tracking |
| `relates-to` | graph | Loose knowledge-graph edge |
| `replies-to` | graph | Conversation threading |
| `duplicates` | graph | Deduplication link |
| `supersedes` | graph | Version chain |
| `authored-by` | entity/HOP | Creator relationship |
| `assigned-to` | entity/HOP | Assignment relationship |
| `approved-by` | entity/HOP | Approval relationship |
| `attests` | entity/HOP | Skill attestation |
| `tracks` | convoy | Non-blocking convoy tracking |
| `until` | reference | Active until target closes |
| `caused-by` | reference | Triggered by target (audit trail) |
| `validates` | reference | Approval/validation relationship |
| `delegated-from` | delegation | Work delegated from parent; cascades up |

> **Note:** Any non-empty string up to 50 chars is accepted as a dep type. Custom types are valid -- only these 18 are "well-known." Only workflow types (`blocks`, `parent-child`, `conditional-blocks`, `waits-for`) affect the `bd ready` calculation.

---

## Core Fields (Full Issue Struct)

### Identification

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `id` | string | auto | Prefixed (e.g., `bcc-xxx`). Can set explicitly with `--id` |
| `content_hash` | string | auto | `json:"-"` -- internal only, not exported to JSONL |

### Content

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `title` | string | **REQUIRED** | Max 500 chars |
| `description` | string | `""` | Body / details |
| `design` | string | `""` | Architecture notes |
| `acceptance_criteria` | string | `""` | Acceptance criteria |
| `notes` | string | `""` | Freeform notes (supports `--append-notes`) |

### Status & Workflow

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `status` | string | `"open"` | 8 built-in values (see Statuses above) |
| `priority` | int | `2` | Range 0-4. P0 = highest, P4 = lowest. Input: `0-4` or `P0-P4` |
| `issue_type` | string | `"task"` | 6 built-in + custom (see Issue Types above) |

### Assignment

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `assignee` | string | `""` | Who's working on it |
| `owner` | string | `""` | Git author email (human owner for CV attribution) |
| `estimated_minutes` | *int | null | Cannot be negative |

### Timestamps

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `created_at` | datetime | auto | |
| `created_by` | string | auto | |
| `updated_at` | datetime | auto | |
| `closed_at` | *datetime | null | **Required** if `status=closed`; forbidden otherwise (except tombstone) |
| `close_reason` | string | `""` | Reason provided when closing |
| `closed_by_session` | string | `""` | Claude Code session ID that closed |

### Scheduling

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `due_at` | *datetime | null | Supports relative: `+6h`, `+2w`, `tomorrow`, `2025-01-15` |
| `defer_until` | *datetime | null | Hidden from `bd ready` until this date |

### External Integration

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `external_ref` | *string | null | e.g., `gh-9`, `jira-ABC` |
| `source_system` | string | `""` | Federation source system |
| `metadata` | json | `{}` | Must be valid JSON. Arbitrary key-value store. |

### Labels & Relations

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `labels` | []string | `[]` | Free-form strings. No limit. Separate DB table. Reserved namespace: `provides:*` |
| `dependencies` | []Dependency | `[]` | Separate DB table (see Dependency Struct below) |
| `comments` | []Comment | `[]` | Separate DB table |

### Agent / Role

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `agent_state` | string | `""` | `idle` / `spawning` / `running` / `working` / `stuck` / `done` / `stopped` / `dead` |
| `hook_bead` | string | `""` | Current work on agent's hook (0..1 cardinality) |
| `role_bead` | string | `""` | Role definition bead ref |
| `role_type` | string | `""` | `polecat` / `crew` / `witness` / `refinery` / `mayor` / `deacon` |
| `rig` | string | `""` | Rig name (empty for town-level agents) |
| `last_activity` | *datetime | null | Timeout detection |

### Gate / Async Coordination

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `await_type` | string | `""` | `gh:run` / `gh:pr` / `timer` / `human` / `mail` |
| `await_id` | string | `""` | Run ID, PR number, etc. |
| `timeout` | duration | `0` | Stored as nanoseconds in DB |
| `waiters` | []string | `[]` | JSON string array in DB |

### Event

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `event_kind` | string | `""` | Namespaced: `patrol.muted`, `agent.started`, etc. |
| `actor` | string | `""` | Entity URI who caused this event |
| `target` | string | `""` | Entity URI or bead ID affected |
| `payload` | string | `""` | Event-specific JSON data |

### Molecule

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `mol_type` | string | `""` | `swarm` / `patrol` / `work` (empty treated as `work`) |
| `work_type` | string | `"mutex"` | `mutex` (one worker, exclusive) / `open_competition` (many submit, buyer picks) |
| `is_template` | bool | `false` | Read-only proto template flag |

### Compaction

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `compaction_level` | int | `0` | |
| `compacted_at` | *datetime | null | |
| `compacted_at_commit` | *string | null | Git commit hash when compacted |
| `original_size` | int | `0` | |

### Tombstone (Soft Delete)

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `deleted_at` | *datetime | null | **Required** if `status=tombstone` |
| `deleted_by` | string | `""` | |
| `delete_reason` | string | `""` | |
| `original_type` | string | `""` | Issue type before deletion |

### Messaging

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `sender` | string | `""` | Who sent (for messages) |
| `ephemeral` | bool | `false` | If true, not exported to JSONL (wisp) |
| `wisp_type` | string | `""` | TTL-based compaction classification (see Wisp Types below) |
| `pinned` | bool | `false` | Persistent context marker |

### HOP (Quality)

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `quality_score` | *float32 | null | 0.0-1.0, set by Refineries on merge |
| `crystallizes` | bool | `false` | Work that compounds (true) vs evaporates (false) |

### JSONL-Only Fields (no DB column)

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `holder` | string | `""` | Who holds an exclusive slot |
| `bonded_from` | []BondRef | `[]` | Compound molecule lineage |
| `source_formula` | string | `""` | Formula cooking origin |
| `source_location` | string | `""` | Formula step path |
| `creator` | *EntityRef | null | HOP creator entity |
| `validations` | []Validation | `[]` | HOP validation records |

### Internal-Only Fields (`json:"-"`, never exported)

| Field | Type | Notes |
|-------|------|-------|
| `source_repo` | string | Which repo owns this (multi-repo routing, Dolt only) |
| `id_prefix` | string | Override prefix for ID generation (transient) |
| `prefix_override` | string | Complete prefix replacement for cross-rig creation (transient) |

---

## Dependency Struct

| Field | Type | Notes |
|-------|------|-------|
| `issue_id` | string | Source bead |
| `depends_on_id` | string | Target bead |
| `type` | string | 18 well-known + any custom (max 50 chars) |
| `created_at` | datetime | |
| `created_by` | string | |
| `metadata` | string | JSON blob for type-specific edge data |
| `thread_id` | string | Groups conversation edges for thread queries |

---

## Wisp Types (TTL-based compaction)

| Category | Type | TTL |
|----------|------|-----|
| High-churn | `heartbeat` | 6h |
| High-churn | `ping` | 6h |
| Operational state | `patrol` | 24h |
| Operational state | `gc_report` | 24h |
| Significant events | `recovery` | 7d |
| Significant events | `error` | 7d |
| Significant events | `escalation` | 7d |

---

## Agent States

| State | Description |
|-------|-------------|
| `idle` | Waiting for work |
| `spawning` | Starting up |
| `running` | Executing (general) |
| `working` | Actively working on a task |
| `stuck` | Blocked, needs help |
| `done` | Completed current work |
| `stopped` | Cleanly shut down |
| `dead` | Died without clean shutdown (timeout detection) |

---

## Bond Types (compound molecules)

| Type | Description |
|------|-------------|
| `sequential` | Execute in order |
| `parallel` | Execute concurrently |
| `conditional` | Execute based on condition |
| `root` | Root of compound |

---

## Gate Types (waits-for)

| Type | Description |
|------|-------------|
| `all-children` | Wait for all dynamic children to complete |
| `any-children` | Wait for first child to complete |

---

## Failure Close Keywords

Used by `conditional-blocks` dependencies to detect failure:

`failed`, `rejected`, `wontfix`, `won't fix`, `canceled`, `cancelled`, `abandoned`, `blocked`, `error`, `timeout`, `aborted`

---

## Validation Outcomes (HOP)

| Outcome | Description |
|---------|-------------|
| `accepted` | Validation passed |
| `rejected` | Validation failed |
| `revision_requested` | Needs revision |

---

## Audit Trail Event Types

| Event | Trigger |
|-------|---------|
| `created` | Issue created |
| `updated` | Issue updated |
| `status_changed` | Status transition |
| `commented` | Comment added |
| `closed` | Issue closed |
| `reopened` | Issue reopened |
| `dependency_added` | Dep edge added |
| `dependency_removed` | Dep edge removed |
| `label_added` | Label added |
| `label_removed` | Label removed |
| `compacted` | Issue compacted |

---

## Label Constraints

- **Free-form strings** -- no regex validation, no length limit, no taxonomy enforced
- Stored in separate table: `(issue_id, label)` composite PK
- **Reserved namespace:** `provides:*` labels -- only addable via `bd ship` command
- **Convention:** `dimension:value` format for labels-as-state (e.g., `risk:high`) but not structurally enforced
- Config-driven auto-labeling available via `directory.labels` config

---

## Priority Constraints

- **Range:** `0` to `4` inclusive (enforced: DB `CHECK`, Go validation)
- **Input formats:** numeric `0-4` or P-prefix `P0-P4`
- **Semantics:** P0 = critical (highest), P4 = lowest
- **Default:** `2` for new issues
- Words like `high`, `medium`, `low` are explicitly rejected
