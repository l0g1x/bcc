# Formulas vs Protos

> Source: `~/beads/internal/formula/types.go` and `~/beads/cmd/bd/cook.go`

---

## Overview

A **formula** and a **proto** are different representations of the same thing at different stages of compilation. The formula is source code. The proto is the compiled output. They have completely different schemas.

```
.formula.toml    -->  bd cook  -->  Proto (IsTemplate=true beads)  -->  bd mol pour  -->  Real work beads
  (file on disk)                      (Issue rows in DB)                                   (IsTemplate=false)
```

---

## Formula (the source code)

A formula is a **file on disk** (`.formula.toml` or `.formula.json`) living in `.beads/formulas/`. It is NOT a bead. It has its own schema defined as a `Formula` struct in `internal/formula/types.go`.

### Formula Types

| Type | Purpose |
|------|---------|
| `workflow` | Standard workflow template (sequence of steps) |
| `expansion` | Macro that expands into multiple steps (e.g., "test + lint + build") |
| `aspect` | Cross-cutting concern applied to other formulas (e.g., add logging, add approval gates) |

### Formula Struct

```
Formula
  formula: string           # unique name identifier
  description: string
  version: int              # schema version (currently 1)
  type: workflow | expansion | aspect
  phase: "liquid" | "vapor" # recommended instantiation mode
  source: string            # where loaded from (set by parser)
  extends: []string         # inheritance -- parent formulas to inherit from
  vars: map[string]VarDef   # typed variables with defaults, enums, regex patterns
  steps: []Step             # work items (with nested children)
  template: []Step          # expansion template steps (for TypeExpansion)
  compose: ComposeRules     # composition/bonding rules
  advice: []AdviceRule      # before/after/around step transformations
  pointcuts: []Pointcut     # target patterns for aspect formulas
```

### Variable Definitions (VarDef)

Variables are more than simple string substitution. Each variable can have:

| Field | Type | Notes |
|-------|------|-------|
| `description` | string | What this variable is for |
| `default` | string | Value if not provided |
| `required` | bool | Must be provided (cannot have default) |
| `enum` | []string | Allowed values |
| `pattern` | string | Regex the value must match |
| `type` | string | Expected type: `string` (default), `int`, `bool` |

### Step Definition

Each step becomes an issue when cooked. Steps have formula-specific features that don't exist on beads:

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Unique within the formula |
| `title` | string | Supports `{{variable}}` substitution |
| `description` | string | Supports substitution |
| `type` | string | `task`, `bug`, `feature`, `epic`, `chore` |
| `priority` | *int | 0-4 |
| `labels` | []string | Applied to created issue |
| `depends_on` | []string | Step IDs this blocks on (intra-formula) |
| `needs` | []string | Simpler alias for `depends_on` |
| `assignee` | string | Supports substitution |
| `condition` | string | Conditional inclusion: `"{{var}}"`, `"!{{var}}"`, `"{{var}} == value"` |
| `expand` | string | References an expansion formula to inline here |
| `expand_vars` | map | Variable overrides for the expansion |
| `gate` | Gate | Async wait condition (gh:run, timer, human) |
| `loop` | LoopSpec | Iteration (count, until, range) |
| `on_complete` | OnCompleteSpec | Runtime for-each expansion over step output |
| `waits_for` | string | Fanout gate: `all-children`, `any-children`, `children-of(step-id)` |
| `children` | []Step | Nested hierarchy |

### Gate (async wait)

| Field | Type | Notes |
|-------|------|-------|
| `type` | string | `gh:run`, `gh:pr`, `timer`, `human`, `mail` |
| `id` | string | Condition identifier (workflow name, PR number) |
| `timeout` | string | Duration before escalation (`"1h"`, `"24h"`) |

### LoopSpec (iteration)

| Field | Type | Notes |
|-------|------|-------|
| `count` | int | Fixed iteration count |
| `until` | string | Condition that ends the loop |
| `max` | int | Max iterations for conditional loops |
| `range` | string | Computed range: `"1..10"`, `"1..2^{disks}"`, `"{start}..{count}"` |
| `var` | string | Variable name exposed to body steps |
| `body` | []Step | Steps to repeat |

### OnCompleteSpec (runtime expansion)

| Field | Type | Notes |
|-------|------|-------|
| `for_each` | string | Path to iterable in step output: `"output.<field>"` |
| `bond` | string | Formula to instantiate for each item |
| `vars` | map | Bindings: `{item}`, `{item.field}`, `{index}` |
| `parallel` | bool | Run all bonded molecules concurrently |
| `sequential` | bool | Run one at a time (mutually exclusive with parallel) |

### ComposeRules (bonding)

| Field | Type | Notes |
|-------|------|-------|
| `bond_points` | []BondPoint | Named attachment sites (`after_step`, `before_step`, `parallel`) |
| `hooks` | []Hook | Auto-attach triggered by labels/conditions |
| `expand` | []ExpandRule | Apply expansion template to single target step |
| `map` | []MapRule | Apply expansion to all steps matching a glob pattern |
| `branch` | []BranchRule | Fork-join parallel patterns (`from` -> `[steps]` -> `join`) |
| `gate` | []GateRule | Conditional waits before steps |
| `aspects` | []string | Aspect formula names to apply |

### AdviceRule (aspect weaving)

| Field | Type | Notes |
|-------|------|-------|
| `target` | string | Glob pattern matching step IDs |
| `before` | AdviceStep | Insert step before target |
| `after` | AdviceStep | Insert step after target |
| `around` | AroundAdvice | Wrap target with before and after steps |

### Pointcut (aspect targeting)

| Field | Type | Notes |
|-------|------|-------|
| `glob` | string | Glob pattern to match step IDs |
| `type` | string | Match steps by type |
| `label` | string | Match steps that have a specific label |

---

## Proto (the compiled output)

A proto is a **set of regular bead `Issue` structs** stored in the database with `IsTemplate: true`. It is the output of `bd cook`. All formula-specific features have been resolved:

- **Inheritance** (`extends`) -- resolved. Single flat hierarchy.
- **Variables** -- left as `{{placeholder}}` strings (compile mode) or substituted (runtime mode).
- **Loops** -- unrolled into N concrete step beads.
- **Expansions** -- inlined. Referenced formula's steps replace the `expand` step.
- **Aspects** -- woven. Advice `before`/`after` steps inserted around targets.
- **Conditions** -- evaluated. Steps that don't match are dropped.
- **Bond points** -- become dependency edges between beads.

### What cook creates

The root becomes:
```go
&types.Issue{
    IssueType:  types.TypeEpic,  // always "epic"
    IsTemplate: true,             // marks it as a proto
    Status:     types.StatusOpen,
    Priority:   2,
}
```

Each step becomes:
```go
&types.Issue{
    ID:             "{protoID}.{stepID}",
    IssueType:      stepTypeToIssueType(step.Type), // task, bug, feature, epic, chore
    IsTemplate:     true,
    SourceFormula:  step.SourceFormula,   // tracing back to source
    SourceLocation: step.SourceLocation,
}
```

Gate steps additionally get `IssueType: "gate"` with `AwaitType` and `AwaitID` fields populated.

Steps with children get promoted to `IssueType: types.TypeEpic`.

### Proto storage

- **Default (ephemeral):** `bd cook` outputs JSON to stdout. Not persisted.
- **Persisted (legacy):** `bd cook --persist` writes proto beads to the database.
- **Inline cooking:** `bd mol pour <formula-name>` cooks the formula inline without persisting the proto, then immediately clones it into real work.

---

## Pour / Wisp (instantiation)

`bd mol pour` takes a proto (or cooks one inline from a formula) and creates real work beads:

```go
newIssue := &types.Issue{
    IssueType: oldIssue.IssueType,  // preserved from proto
    Ephemeral: false,                // pour = persistent
    Status:    types.StatusOpen,     // always start fresh
    // Title, Description, Design, AcceptanceCriteria, Notes
    // all get {{variable}} substitution applied
}
```

| Command | Creates | IsTemplate | Ephemeral | Storage |
|---------|---------|------------|-----------|---------|
| `bd cook` | Proto (to stdout) | true | n/a | stdout JSON |
| `bd cook --persist` | Proto (in DB) | true | false | .beads/ DB |
| `bd mol pour` | Real work beads | false | false | .beads/ + JSONL + git |
| `bd mol wisp` | Ephemeral work beads | false | true | .beads/ DB only (not JSONL) |

### Important: `bd mol pour` does NOT set `issue_type: "molecule"`

The root bead stays `epic`. Children stay `task` or `gate`. The molecule identity comes from the spawning structure, not the type field. The `molecule` issue type exists as a custom type but `pour` doesn't use it.

---

## Formula search paths

Formulas are loaded from these paths (in order):

1. `.beads/formulas/` (project-level)
2. `~/.beads/formulas/` (user-level)
3. `$GT_ROOT/.beads/formulas/` (orchestrator, if GT_ROOT set)

Supported formats: `.formula.json`, `.formula.toml`

---

## Key differences at a glance

| Aspect | Formula | Proto |
|--------|---------|-------|
| **What it is** | File on disk (.toml/.json) | Set of Issue rows in DB |
| **Is a bead?** | No | Yes (with `IsTemplate: true`) |
| **Has variables** | Yes (typed, validated, with defaults/enums/patterns) | Placeholder strings only |
| **Has loops** | Yes (`count`, `until`, `range`) | No (unrolled during cook) |
| **Has conditions** | Yes (`"{{var}} == value"`) | No (evaluated during cook) |
| **Has inheritance** | Yes (`extends: [parent-formula]`) | No (resolved during cook) |
| **Has expansions** | Yes (`expand: other-formula`) | No (inlined during cook) |
| **Has aspects** | Yes (advice before/after/around) | No (woven during cook) |
| **Has composition** | Yes (bond_points, hooks, branch, gate) | Only dependency edges |
| **Has on_complete** | Yes (runtime for-each expansion) | Preserved as metadata |
| **Storage** | `.beads/formulas/*.formula.toml` | SQLite DB rows |
| **Versioned in git** | As files | Via JSONL export + `bd sync` |
