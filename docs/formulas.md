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

---

## Formula Field Reference

### Fields 1-5: Identity and Metadata

**`formula`** (string, required)

The name of the formula. This is how you reference it everywhere. When you run `bd mol pour my-formula`, it looks for a file called `my-formula.formula.toml` (or `.json`) in the formula search paths. There's a naming convention in the codebase (`mol-` prefix for workflows, `exp-` for expansions) but nothing enforces it.

**`description`** (string, optional)

Plain text explaining what the formula does. When the formula gets compiled into beads, this becomes the description on the root bead (unless overridden by a variable).

**`version`** (int, required)

Schema version number. Must be 1 or higher. Right now only version `1` exists. This is there so the format can evolve without breaking old formulas.

**`type`** (string, recommended)

Tells `bd` what kind of formula this is. Three valid values:

- `"workflow"` — the normal kind. Has `steps` that become beads.
- `"expansion"` — a reusable snippet. Has `template` instead of `steps`. Can't be poured directly — gets inlined into other formulas.
- `"aspect"` — a modifier that injects extra steps into other formulas. Uses `advice` and `pointcuts` fields.

**`phase`** (string, optional)

A suggestion for how the formula should be instantiated:

- `"liquid"` — persistent. Beads get saved to `.beads/`, synced to git, stick around permanently. Use `bd mol pour`.
- `"vapor"` — ephemeral. Beads are temporary and auto-cleaned up. Use `bd mol wisp`.

Not enforced. If you `pour` a `vapor` formula, it just prints a warning. One-off operational things (health checks, release checklists) should be vapor. Real feature work should be liquid.

### Fields 6-10: Inheritance, Variables, Steps, Templates, Composition

**`extends`** ([]string, optional)

Inheritance. List of other formula names whose `vars` and `steps` are inherited. Your formula sees parent steps and can reference their IDs in `needs`/`depends_on`. If you define a variable with the same name as the parent's, yours wins. Steps are additive — parent steps plus your steps.

Multiple parents allowed. Resolved depth-first, left-to-right. Circular inheritance is detected and rejected.

**`vars`** (map of VarDef, optional)

Template variables that users fill in at pour time with `--var key=value`. Each entry is a VarDef:

| Field | Type | What it does |
|-------|------|-------------|
| `description` | string | Human-readable explanation |
| `default` | string | Value used if not provided |
| `required` | bool | Must be provided — pour fails without it |
| `enum` | []string | Value must be one of these choices |
| `pattern` | string | Regex the value must match |
| `type` | string | `"string"` (default), `"int"`, or `"bool"` |

Constraint: `required` and `default` are mutually exclusive.

Variables referenced in steps as `{{variable_name}}` (double curly braces). Substituted at pour time.

**`steps`** ([]Step, optional)

Main payload of a `workflow` formula. Each step becomes one or more beads. See Step schema below.

**`template`** ([]Step, optional)

Same shape as `steps`, but only for `expansion` type formulas. Uses `{target}` and `{target.title}` placeholders instead of `{{handlebars}}`. A workflow uses `steps`. An expansion uses `template`. Don't use both.

**`compose`** (ComposeRules, optional)

Rules for combining this formula with others. Has 6 sub-fields controlling attachment sites, automatic hooks, expansions, fork-join patterns, conditional gates, and aspects. See ComposeRules schema below.

### Step Schema

The Step is the main building block of a formula. Each step becomes one or more beads when compiled and poured. 17 fields total.

```
Step
├── id               string
├── title            string
├── description      string
├── type             string
├── priority         int (nullable)
├── labels           []string
├── assignee         string
├── needs            []string
├── depends_on       []string
├── condition        string
├── children         []Step
├── expand           string
├── expand_vars      map of string
├── gate             Gate
├── loop             LoopSpec
├── on_complete      OnCompleteSpec
└── waits_for        string
```

**`id`** (string, required)

A unique name for this step within the formula. Other steps reference it in `needs` and `depends_on`. When the formula gets compiled into beads, the bead ID is built from this: `{formulaName}.{stepId}`.

**`title`** (string, required unless `expand` is set)

Becomes the bead's title. Supports `{{variable}}` substitution — so if your formula has a var called `name`, you can write `"Implement {{name}}"` and it gets filled in at pour time.

**`description`** (string, optional)

Becomes the bead's description field. Also supports `{{variable}}` substitution.

**`type`** (string, optional)

Controls what `issue_type` the resulting bead gets. The mapping is:

- `"task"` → bead type `task`
- `"bug"` → `bug`
- `"feature"` → `feature`
- `"epic"` → `epic`
- `"chore"` → `chore`
- anything else or empty → defaults to `task`

One override: if the step has `children`, it gets forced to `epic` regardless of what you put here.

**`priority`** (int, optional, nullable)

0 through 4. Maps directly to the bead's priority field. If you don't set it, the bead defaults to priority 2.

**`labels`** ([]string, optional)

These get applied as labels on the created bead. Free-form — any strings you want.

**`assignee`** (string, optional)

Who this bead gets assigned to. Supports `{{variable}}` substitution, so you could have a var like `developer` and write `assignee = "{{developer}}"`.

**`needs`** ([]string, optional)

The core ordering mechanism. You list step IDs that must complete before this step can start. When compiled, these become `blocks` type dependency edges between the beads.

Example: if step B has `needs = ["A"]`, then bead A blocks bead B — B can't start until A is done.

**`depends_on`** ([]string, optional)

Identical to `needs`. They get merged together during compilation. Two names for the same thing — `needs` was added later as a simpler alias. Use whichever reads better to you.

**`condition`** (string, optional)

Makes this step conditional. If the condition evaluates to false, the step is skipped entirely — no bead gets created for it.

Four formats:

- `"{{var}}"` — true if the variable is non-empty, not `"false"`, and not `"0"`
- `"!{{var}}"` — true if the variable IS empty, `"false"`, or `"0"`
- `"{{var}} == value"` — true if the variable equals that exact value
- `"{{var}} != value"` — true if the variable doesn't equal that value

The condition is evaluated at compile/pour time, not at runtime.

**`children`** ([]Step, optional)

Nested steps. Same schema recursively — each child is a full Step with all 17 fields available. This creates a hierarchy: the parent step becomes an `epic` bead (forced, regardless of `type`), and children become beads with `parent-child` dependency edges pointing up to the parent.

Children can reference sibling step IDs in their own `needs`/`depends_on`.

**`expand`** (string, optional)

The name of an `expansion` type formula to inline here. When set, this step gets **replaced** by the expansion's `template` steps. That's why `title` isn't required when `expand` is set — the expansion provides its own titles.

**`expand_vars`** (map of strings, optional)

Variable overrides to pass to the expansion formula referenced by `expand`. If the expansion defines vars with defaults, these override those defaults.

**`gate`** (Gate object, optional)

Attaches an external wait condition to this step. When compiled, this creates a **separate bead** with `issue_type: "gate"` that blocks this step's bead. The step can't proceed until someone closes the gate bead. See Gate sub-schema below.

**`loop`** (LoopSpec object, optional)

Repeats a set of sub-steps multiple times. When compiled, the loop gets **unrolled** — if you say `count = 3`, you get 3 copies of each body step as concrete beads, with IDs like `{stepId}.iter1.{bodyStepId}`, `{stepId}.iter2.{bodyStepId}`, etc. See LoopSpec sub-schema below.

**`on_complete`** (OnCompleteSpec object, optional)

A runtime hook. After this step's bead gets completed, it can automatically spawn new molecules based on the step's output. Unlike everything else in the formula which gets resolved at compile time, this happens at runtime. See OnCompleteSpec sub-schema below.

**`waits_for`** (string, optional)

A special kind of gate for dynamic children. Three valid values:

- `"all-children"` — this step waits for ALL dynamically-attached child beads to complete
- `"any-children"` — this step waits for the FIRST child to complete
- `"children-of(step-id)"` — this step waits for children of a specific other step

During compilation, this adds a `gate:` label to the bead. This is used in workflows where you don't know ahead of time how many child beads will be created (for example, when `on_complete` spawns a variable number of molecules).

### Gate Sub-Schema (3 fields)

This is the sub-object on `step.gate`. When a step has a gate, the compiler creates a **second bead** — a gate bead with `issue_type: "gate"` — that blocks the step's bead. The step can't proceed until someone (or something) closes the gate bead.

Think of it as an external checkpoint. "Don't continue past this point until X happens."

**`type`** (string)

What kind of external condition to wait for:

- `"gh:run"` — wait for a GitHub Actions workflow run to complete
- `"gh:pr"` — wait for a pull request event
- `"timer"` — wait for a duration to elapse
- `"human"` — wait for a person to manually approve (close the gate bead)
- `"mail"` — wait for an email/notification response

**`id`** (string, optional)

An identifier for the specific condition. For `"gh:run"` this would be the workflow name (e.g., `"ci-tests"`). For `"gh:pr"` it might be a PR number. For `"human"` you might leave it empty. Supports `{{variable}}` substitution.

**`timeout`** (string, optional)

How long to wait before escalation. Uses Go duration format: `"30m"`, `"1h"`, `"24h"`. Gets stored on the gate bead as a nanosecond value.

### LoopSpec Sub-Schema (6 fields)

This is the sub-object on `step.loop`. It repeats a set of steps. The key thing: loops are **unrolled at compile time**. If you say count 3, you literally get 3 copies of each body step as separate beads. There's no runtime loop — it's a compile-time macro.

**`count`** (int)

Fixed number of iterations. Set this to 3 and you get 3 copies.

**`until`** (string)

A condition that would end the loop. Format: `"step.status == 'complete'"`. When using `until`, you must also set `max` to prevent unbounded expansion.

**`max`** (int)

Maximum iterations. Required when `until` is set. Safety valve.

**`range`** (string)

A computed range to iterate over. Can be:

- Simple: `"1..10"` (iterate 1 through 10)
- With variables: `"{start}..{count}"` (substituted from formula vars)
- With arithmetic: `"1..2^{disks}-1"` (supports `+`, `-`, `*`, `/`, `^` and parentheses)

**`var`** (string)

The variable name that gets exposed to body steps for each iteration. If you set `var = "i"` with `range = "1..3"`, then body steps can use `{i}` in their titles to get `1`, `2`, `3`.

Note: this uses single curly braces `{i}`, not the double `{{i}}` used for formula-level vars.

**`body`** ([]Step)

The steps to repeat each iteration. Same Step schema recursively. Each iteration produces beads with IDs like `{stepId}.iter1.{bodyStepId}`, `{stepId}.iter2.{bodyStepId}`, etc.

Only one of `count`, `until`, or `range` should be set.

### OnCompleteSpec Sub-Schema (5 fields)

This is the sub-object on `step.on_complete`. Unlike everything else in a formula, this operates at **runtime**, not compile time. After the step's bead gets closed/completed, it can automatically create new molecules based on what the step produced.

The use case: a step discovers a list of things (say, a list of workers or modules), and you want to spawn a separate workflow for each one.

**`for_each`** (string)

Path to a list in the step's output. Must start with `"output."`. For example, `"output.polecats"` means "look at the step's output, find the `polecats` field, iterate over it."

**`bond`** (string)

The formula name to instantiate for each item in the list. Each item spawns a separate molecule from this formula.

`for_each` and `bond` must both be present or both absent. You can't have one without the other.

**`vars`** (map of strings, optional)

Variable bindings for each spawned molecule. Special placeholders:

- `{item}` — the current item from the list (for simple values)
- `{item.field}` — a field from the current item (for objects)
- `{index}` — the zero-based iteration index

**`parallel`** (bool, optional)

If true, all spawned molecules run concurrently.

**`sequential`** (bool, optional)

If true, spawned molecules run one at a time, each waiting for the previous to finish. Mutually exclusive with `parallel`.

### ComposeRules Sub-Schema (7 sub-fields)

The `compose` field on a formula is about controlling how things get combined — both within the formula itself (rearranging steps, applying macros) and across formulas (defining where other formulas can plug in).

```
ComposeRules
├── bond_points      []BondPoint
├── hooks            []Hook
├── expand           []ExpandRule
├── map              []MapRule
├── branch           []BranchRule
├── gate             []GateRule
└── aspects          []string
```

**`bond_points`** ([]BondPoint)

These define named spots in your formula where other formulas can attach. Think of them as labeled sockets. When someone bonds another formula to yours, they specify which bond point to attach at.

Each BondPoint has:

- `id` — a unique name for this attachment site
- `description` — explains what should be attached here
- `after_step` — the step ID this bond point sits after. Anything attached here runs after that step.
- `before_step` — the step ID this bond point sits before. Anything attached here runs before that step.
- `parallel` — if true, attached steps run in parallel with the anchor step instead of sequentially

`after_step` and `before_step` are mutually exclusive — you pick one or the other to say where in the sequence this attachment site lives.

**`hooks`** ([]Hook)

Automatic attachments. Instead of someone manually bonding a formula, a hook says "if this condition is true, automatically attach this formula." It's like a trigger.

Each Hook has:

- `trigger` — the condition. Format is `"label:security"` (if the bead has this label), `"type:bug"` (if the bead is this type), or `"priority:0-1"` (if priority is in this range)
- `attach` — the formula name to attach when triggered
- `at` — which bond point to attach at. Defaults to the end if not specified.
- `vars` — variable overrides passed to the attached formula

**`expand`** ([]ExpandRule)

Another way to apply an expansion formula to a step, separate from putting `expand` directly on the step itself. You do it here at the compose level instead. The result is the same — the target step gets replaced by the expansion's template steps.

Each ExpandRule has:

- `target` — the step ID to expand
- `with` — the expansion formula name to apply
- `vars` — variable overrides for the expansion

The difference from using `step.expand` directly: doing it in `compose.expand` keeps the step definition clean and puts all the composition logic in one place.

**`map`** ([]MapRule)

Like `expand` but with a glob pattern instead of a single target. It applies an expansion formula to every step whose ID matches the pattern.

Each MapRule has:

- `select` — a glob pattern matching step IDs. Examples: `"*.implement"` matches any step ending in `.implement`, `"shiny.*"` matches any step starting with `shiny.`
- `with` — the expansion formula name to apply
- `vars` — variable overrides

So if you have steps `auth.implement`, `payments.implement`, and `users.implement`, a map rule with `select = "*.implement"` and `with = "qa-check"` would apply the `qa-check` expansion to all three at once.

**`branch`** ([]BranchRule)

A shorthand for creating fork-join parallel patterns. Instead of manually wiring up `needs` on multiple steps, you declare the pattern and the compiler creates all the dependency edges for you.

Each BranchRule has:

- `from` — the step ID where the fork starts. All parallel steps depend on this one.
- `steps` — list of step IDs that run in parallel. They all start after `from` finishes.
- `join` — the step ID where the paths rejoin. This step depends on ALL the parallel steps completing.

So `from = "setup"`, `steps = ["test", "lint", "build"]`, `join = "deploy"` creates:

```
setup → test  ─┐
     → lint  ─┤→ deploy
     → build ─┘
```

You still define the actual steps in the `steps` array at the top level. The branch rule just wires up the dependencies between them.

**`gate`** ([]GateRule)

This is different from the `gate` field on a step. Step-level gates create a separate gate bead. Compose-level gates add a runtime condition check — the step can't start until the condition expression is true.

Each GateRule has:

- `before` — the step ID that this condition guards
- `condition` — an expression to evaluate, like `"tests.status == 'complete'"`

**`aspects`** ([]string)

A list of aspect formula names to apply to this formula. Aspects are formulas with `type = "aspect"` that use `advice` rules to inject steps before, after, or around matching steps.

This is the consumer side — you're saying "apply these aspects to me." The aspect formula itself defines what it does via `advice` and `pointcuts`.

Aspects are applied after expansions are resolved.

### Fields 11-12: `advice` and `pointcuts`

These two fields are used by `aspect` type formulas. An aspect is a formula that doesn't create beads on its own — instead it modifies other formulas by injecting extra steps into them.

The mental model: you have a workflow formula that does the actual work. You have an aspect formula that adds a cross-cutting concern (like "add a security scan before every deploy step"). The workflow opts in by listing the aspect in its `compose.aspects`, and the aspect uses `advice` to say what it injects and `pointcuts` to say where.

**`advice`** ([]AdviceRule)

This is where an aspect formula defines what it actually does. Each advice rule says "find steps matching this pattern, and inject extra steps before, after, or around them."

```
AdviceRule
├── target        string
├── before        AdviceStep
├── after         AdviceStep
└── around        AroundAdvice
```

**`target`** — a glob pattern that matches step IDs in the formula being modified. Examples: `"*.deploy"` matches any step ending in `.deploy`. `"review"` matches a step with that exact ID. `"shiny.*"` matches any step starting with `shiny.`.

**`before`** — an AdviceStep to insert before the matched step. The injected step gets wired so it runs right before the target.

**`after`** — an AdviceStep to insert after the matched step. The injected step gets wired so it runs right after the target.

**`around`** — an AroundAdvice that wraps the target with steps on both sides. It has its own `before` (list of AdviceSteps) and `after` (list of AdviceSteps).

You'd use one of the three: `before`, `after`, or `around`. They're not mutually exclusive in the schema but logically you'd pick the pattern that fits.

#### AdviceStep (6 fields)

This is the step that gets injected. Simpler than a full Step — no loops, gates, children, etc.

```
AdviceStep
├── id             string
├── title          string
├── description    string
├── type           string
├── args           map of string
└── output         map of string
```

**`id`** — the step identifier. Supports `{step.id}` substitution, where `{step.id}` gets replaced with the ID of the step being matched. So if the target is `"*.deploy"` and it matches a step called `auth.deploy`, then `id = "scan-{step.id}"` becomes `"scan-auth.deploy"`.

**`title`** — the step title. Also supports `{step.id}` and `{step.title}` substitution.

**`description`** — step description.

**`type`** — issue type for the created bead (`task`, `bug`, etc.).

**`args`** — additional context passed to the step as key-value pairs.

**`output`** — defines expected outputs from this step as key-value pairs.

Note: the substitution syntax here is single curly braces `{step.id}`, not double `{{}}`. This is because it's referencing the matched step, not a formula variable.

#### AroundAdvice (2 fields)

```
AroundAdvice
├── before         []AdviceStep
└── after          []AdviceStep
```

Two lists of AdviceSteps — ones to inject before the target, and ones to inject after. The difference from using `before`/`after` directly on the AdviceRule is that `around` lets you inject **multiple** steps on each side (it's a list), while the top-level `before`/`after` is a single step each.

**`pointcuts`** ([]Pointcut)

Pointcuts define targeting patterns for aspect formulas. They're an alternative to the `target` glob on each advice rule — a more structured way to say "which steps does this aspect apply to."

```
Pointcut
├── glob           string
├── type           string
└── label          string
```

**`glob`** — a glob pattern matching step IDs. Same syntax as `advice.target`: `"*.implement"`, `"review"`, etc.

**`type`** — matches steps by their `type` field. For example, `"task"` would match all steps that create task beads.

**`label`** — matches steps that have a specific label.

These three fields are filters. You can combine them — a step must match all specified fields.

### Complete Formula Schema Tree

```
Formula
├── formula              string
├── description          string
├── version              int
├── type                 string
├── phase                string
├── extends              []string
├── vars                 map of VarDef
│   └── VarDef
│       ├── description      string
│       ├── default          string
│       ├── required         bool
│       ├── enum             []string
│       ├── pattern          string
│       └── type             string
├── steps                []Step
│   └── Step
│       ├── id               string
│       ├── title            string
│       ├── description      string
│       ├── type             string
│       ├── priority         int
│       ├── labels           []string
│       ├── assignee         string
│       ├── needs            []string
│       ├── depends_on       []string
│       ├── condition        string
│       ├── children         []Step (recursive)
│       ├── expand           string
│       ├── expand_vars      map of string
│       ├── gate             Gate
│       │   ├── type             string
│       │   ├── id               string
│       │   └── timeout          string
│       ├── loop             LoopSpec
│       │   ├── count            int
│       │   ├── until            string
│       │   ├── max              int
│       │   ├── range            string
│       │   ├── var              string
│       │   └── body             []Step
│       ├── on_complete      OnCompleteSpec
│       │   ├── for_each         string
│       │   ├── bond             string
│       │   ├── vars             map of string
│       │   ├── parallel         bool
│       │   └── sequential       bool
│       └── waits_for        string
├── template             []Step (same as above)
├── compose              ComposeRules
│   ├── bond_points      []BondPoint
│   │   ├── id               string
│   │   ├── description      string
│   │   ├── after_step       string
│   │   ├── before_step      string
│   │   └── parallel         bool
│   ├── hooks            []Hook
│   │   ├── trigger          string
│   │   ├── attach           string
│   │   ├── at               string
│   │   └── vars             map of string
│   ├── expand           []ExpandRule
│   │   ├── target           string
│   │   ├── with             string
│   │   └── vars             map of string
│   ├── map              []MapRule
│   │   ├── select           string
│   │   ├── with             string
│   │   └── vars             map of string
│   ├── branch           []BranchRule
│   │   ├── from             string
│   │   ├── steps            []string
│   │   └── join             string
│   ├── gate             []GateRule
│   │   ├── before           string
│   │   └── condition        string
│   └── aspects          []string
├── advice               []AdviceRule
│   ├── target           string
│   ├── before           AdviceStep
│   ├── after            AdviceStep
│   └── around           AroundAdvice
│       ├── before           []AdviceStep
│       └── after            []AdviceStep
│   where AdviceStep is:
│       ├── id               string
│       ├── title            string
│       ├── description      string
│       ├── type             string
│       ├── args             map of string
│       └── output           map of string
└── pointcuts            []Pointcut
    ├── glob             string
    ├── type             string
    └── label            string
```

---

## Practical Example: prd-to-beads Formula

This formula lives at `.beads/formulas/prd-to-beads.formula.toml` and solves a real problem: turning a PRD spec into a structured set of beads where each work agent has the context it needs to succeed — setup instructions, branching, acceptance criteria, and proper dependency ordering.

### The Problem It Solves

When agents pick up beads and do work, they commonly fail because:

- They don't know the install command and waste time guessing
- There are no instructions about which branch to start from or create
- There's no mention of what quality gates to run before finishing
- The beads lack enough context for the agent to work autonomously

### The Formula

```toml
formula = "prd-to-beads"
description = "Scaffold an epic from a PRD spec: setup, story parent, and QA pass with full agent context"
version = 1
type = "workflow"
phase = "liquid"

# --- Variables ---

[vars.epic_name]
description = "Short name for the epic (used in titles and branch names, e.g. 'dark-mode')"
required = true

[vars.epic_description]
description = "One-line summary of what this epic delivers"
required = true

[vars.prd_path]
description = "Path to the PRD markdown file relative to repo root"
required = true

[vars.install_cmd]
description = "Command to install dependencies"
default = "bun install"

[vars.typecheck_cmd]
description = "Command to run type checking"
default = "bun run typecheck"

[vars.lint_cmd]
description = "Command to run linting"
default = "bun run lint"

[vars.test_cmd]
description = "Command to run tests"
default = "bun run test"

[vars.base_branch]
description = "Branch to create the epic branch from"
default = "main"
```

Steps section:

```toml
[[steps]]
id = "setup"
title = "Setup: {{epic_name}}"
type = "task"
priority = 0
description = """Read the PRD at {{prd_path}} and prepare the workspace.

## Instructions

1. Run `git checkout {{base_branch}} && git pull`
2. Run `git checkout -b epic/{{epic_name}}`
3. Run `{{install_cmd}}`
4. Read the PRD file at `{{prd_path}}` end to end
5. Verify the project builds: `{{typecheck_cmd}} && {{lint_cmd}}`

## Acceptance Criteria

- [ ] Epic branch `epic/{{epic_name}}` exists and is checked out
- [ ] Dependencies installed successfully
- [ ] Project builds cleanly (typecheck + lint pass)
- [ ] You have read and understood the full PRD"""

[[steps]]
id = "stories"
title = "Stories: {{epic_name}}"
type = "epic"
priority = 1
needs = ["setup"]
description = """Parent for all user stories in {{epic_name}}.

Each story bead should be created as a child of this bead. When creating story beads, include the following context in every story description:

## Agent Setup Instructions (include in every story)

1. `git checkout epic/{{epic_name}} && git pull`
2. `git checkout -b story/{{epic_name}}-<story-number>`
3. `{{install_cmd}}`

## Agent Quality Gates (include in every story)

Before considering the story done, ALL must pass:
- `{{typecheck_cmd}}`
- `{{lint_cmd}}`
- `{{test_cmd}}`

## Agent Finish Instructions (include in every story)

1. Commit changes with a descriptive message
2. `git checkout epic/{{epic_name}} && git merge story/{{epic_name}}-<story-number>`
3. Verify quality gates still pass after merge

## Story Creation

Read the PRD at `{{prd_path}}` and create one child bead per user story using:

  bd create "<story-title>" -t task --parent <this-bead-id> -d "<story-description-with-setup-and-gates>"

Wire dependencies between stories using:

  bd dep add <story-id> --depends-on <prerequisite-story-id>"""

[[steps]]
id = "qa"
title = "QA: {{epic_name}} integration check"
type = "task"
priority = 1
needs = ["stories"]
description = """Final integration check for the {{epic_name}} epic.

## Setup

1. `git checkout epic/{{epic_name}} && git pull`
2. `{{install_cmd}}`

## Checks

1. Read the full PRD at `{{prd_path}}`
2. Verify every user story's acceptance criteria is met
3. Run the full quality gate suite:
   - [ ] `{{typecheck_cmd}}`
   - [ ] `{{lint_cmd}}`
   - [ ] `{{test_cmd}}`
4. Check for regressions - does existing functionality still work?
5. Verify no leftover TODOs, debug code, or temporary workarounds

## Acceptance Criteria

- [ ] All user stories from the PRD are implemented
- [ ] All quality gates pass
- [ ] No regressions detected
- [ ] Epic branch is clean and ready for review"""
```

### Structure

```
setup  →  stories  →  qa
```

**`setup`** — Priority 0 (highest). Tells the agent exactly how to prepare: checkout a branch, install deps, read the PRD, verify the build works.

**`stories`** — An `epic` type bead acting as a parent container. Depends on `setup`. Its description contains the template text that should be included in every story bead — setup instructions, quality gates, finish instructions. An agent reads this bead and creates individual story beads as children.

**`qa`** — Depends on `stories`. Final integration check. Can't start until all stories are done.

### What Was Used From the Schema, and Why

**`vars` with `required` and `default`** — Things that truly vary per project (`epic_name`, `epic_description`, `prd_path`) are required. Things usually the same but might differ (`install_cmd`, `typecheck_cmd`, `lint_cmd`, `test_cmd`, `base_branch`) have sensible defaults. Override any of them at pour time.

**`needs`** — Creates the sequential dependency chain. Stories can't start before setup. QA can't start before stories.

**`type`** — `setup` and `qa` are `task` (single units of work). `stories` is `epic` (a container for children).

**`priority`** — `setup` gets P0 because it must happen first and triage should surface it. `stories` and `qa` get P1.

**`description` with `{{variable}}` substitution** — Every bead's description is a complete instruction manual. Variables get substituted in, so the install command, branch name, quality gate commands are all baked into the bead text. An agent reading the bead has everything it needs.

**`phase = "liquid"`** — This is real feature work that should persist and sync to git, not ephemeral operational stuff.

### What Was NOT Used, and Why

**No `loop`** — Range expressions are evaluated at cook time, before formula vars are substituted, so `range = "1..{story_count}"` fails. But even if it worked, it would be wrong — every story has different content from the PRD. A loop would create N identical beads with generic titles. Instead, the `stories` bead instructs the agent to read the PRD and create properly-detailed child beads.

**No `gate`** — No external async wait in this workflow. Dependencies between steps (`needs`) handle ordering.

**No `condition`** — All three steps always apply. No "skip QA if X" scenario.

**No `children`** — The stories step is typed as `epic`, but children aren't pre-defined because the number and content of stories varies per PRD. Children are created dynamically by the agent.

**No `expand` or `compose`** — Formula stands alone. No reusable macro to apply, no need for other formulas to plug in.

**No `advice`/`pointcuts`** — This is a workflow, not an aspect.

**No `extends`** — Nothing to inherit from yet. Could extend a `base-project-setup` formula in the future.

### Key Design Decision

The formula creates **scaffolding** (setup, parent container, QA) but not individual stories. Stories are created by an agent that reads the PRD and uses `bd create` with `--parent`. This is intentional because:

1. Story count varies per PRD
2. Story content comes from the PRD, not from a template
3. Story dependencies are specific to each PRD
4. The formula can't know any of this ahead of time

### Trying It

```bash
# Preview what it creates
bd cook prd-to-beads \
  --var epic_name=dark-mode \
  --var epic_description="Add dark mode support" \
  --var prd_path=docs/prd/dark-mode.md \
  --dry-run

# Pour it for real (creates beads)
bd --no-daemon mol pour prd-to-beads \
  --var epic_name=dark-mode \
  --var epic_description="Add dark mode support" \
  --var prd_path=docs/prd/dark-mode.md

# See what was created
bd list

# Override defaults for a different project setup
bd --no-daemon mol pour prd-to-beads \
  --var epic_name=auth-revamp \
  --var epic_description="Overhaul authentication system" \
  --var prd_path=docs/prd/auth.md \
  --var install_cmd="pnpm install" \
  --var typecheck_cmd="pnpm typecheck" \
  --var lint_cmd="pnpm lint" \
  --var test_cmd="pnpm test" \
  --var base_branch=develop
```

### Limitation Discovered: Loop Range and Formula Vars

Loop `range` expressions are evaluated at cook time by `ApplyControlFlow`, which runs before formula variable substitution happens at pour time. This means `range = "1..{story_count}"` fails — the variable isn't available yet. Range can only use literal numbers or variables from an outer loop's `var` field. This is a fundamental ordering constraint in the cook pipeline:

1. `ApplyControlFlow` (loops unrolled) — no access to `--var` values
2. `cookFormulaToSubgraph` (proto created with `{{placeholders}}`)
3. `substituteVariables` at pour time — `{{vars}}` finally filled in
