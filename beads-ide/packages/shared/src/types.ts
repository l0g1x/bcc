/**
 * Core domain types for the Beads IDE.
 * Derived from docs/beads.md (Go Issue struct) and docs/formulas.md (Go Formula struct).
 * These types match the actual JSON output of `bd list --json` and `bd show --json`.
 */

// =============================================================================
// Bead Status & Type Enums
// =============================================================================

/**
 * Built-in bead statuses (8 values).
 * Custom statuses are also supported via `bd config set status.custom`.
 */
export type BeadStatus =
  | 'open'
  | 'in_progress'
  | 'blocked'
  | 'deferred'
  | 'closed'
  | 'tombstone'
  | 'pinned'
  | 'hooked';

/**
 * Built-in bead types (6 core + custom).
 */
export type BeadType =
  | 'bug'
  | 'feature'
  | 'task'
  | 'epic'
  | 'chore'
  | 'event'
  // Custom types
  | 'molecule'
  | 'gate'
  | 'convoy'
  | 'merge-request'
  | 'slot'
  | 'agent'
  | 'role'
  | 'rig'
  | 'message';

/**
 * Well-known dependency types (18 total).
 * Any non-empty string up to 50 chars is valid; these are the standardized ones.
 */
export type DependencyType =
  // Workflow (affects bd ready)
  | 'blocks'
  | 'parent-child'
  | 'conditional-blocks'
  | 'waits-for'
  // Association
  | 'related'
  | 'discovered-from'
  // Graph
  | 'relates-to'
  | 'replies-to'
  | 'duplicates'
  | 'supersedes'
  // Entity/HOP
  | 'authored-by'
  | 'assigned-to'
  | 'approved-by'
  | 'attests'
  // Convoy
  | 'tracks'
  // Reference
  | 'until'
  | 'caused-by'
  | 'validates'
  // Delegation
  | 'delegated-from';

/**
 * Agent states for role/agent beads.
 */
export type AgentState =
  | 'idle'
  | 'spawning'
  | 'running'
  | 'working'
  | 'stuck'
  | 'done'
  | 'stopped'
  | 'dead'
  | 'nuked';

/**
 * Role types in Gas Town.
 */
export type RoleType =
  | 'polecat'
  | 'crew'
  | 'witness'
  | 'refinery'
  | 'mayor'
  | 'deacon';

/**
 * Async wait types for gates.
 */
export type AwaitType =
  | 'gh:run'
  | 'gh:pr'
  | 'timer'
  | 'human'
  | 'mail';

/**
 * Molecule types.
 */
export type MolType = 'swarm' | 'patrol' | 'work';

/**
 * Work distribution types.
 */
export type WorkType = 'mutex' | 'open_competition';

/**
 * Wisp types for TTL-based compaction.
 */
export type WispType =
  | 'heartbeat'
  | 'ping'
  | 'patrol'
  | 'gc_report'
  | 'recovery'
  | 'error'
  | 'escalation';

/**
 * Bond types for compound molecules.
 */
export type BondType = 'sequential' | 'parallel' | 'conditional' | 'root';

// =============================================================================
// Dependency
// =============================================================================

/**
 * Dependency edge between beads.
 */
export interface Dependency {
  /** Source bead ID */
  issue_id: string;
  /** Target bead ID */
  depends_on_id: string;
  /** Dependency type */
  type: DependencyType | string;
  /** Creation timestamp */
  created_at: string;
  /** Creator identifier */
  created_by: string;
  /** Optional JSON metadata for type-specific edge data */
  metadata?: string;
  /** Groups conversation edges for thread queries */
  thread_id?: string;
}

/**
 * Dependent bead with dependency info (from bd show --json output).
 */
export interface DependentBead {
  id: string;
  title: string;
  description?: string;
  acceptance_criteria?: string;
  status: BeadStatus | string;
  priority: number;
  issue_type: BeadType | string;
  assignee?: string;
  owner?: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  dependency_type: DependencyType | string;
}

/**
 * Bond reference for compound molecules.
 */
export interface BondRef {
  formula: string;
  step_id?: string;
  bond_type: BondType;
}

/**
 * Entity reference for HOP.
 */
export interface EntityRef {
  type: string;
  id: string;
  name?: string;
}

/**
 * HOP validation record.
 */
export interface Validation {
  validator: EntityRef;
  validated_at: string;
  result: 'approved' | 'rejected' | 'pending';
  notes?: string;
}

/**
 * Comment on a bead.
 */
export interface Comment {
  id: string;
  author: string;
  body: string;
  created_at: string;
}

// =============================================================================
// Bead (Issue)
// =============================================================================

/**
 * Full Bead type matching the Go Issue struct.
 * This is the shape returned by `bd show <id> --json`.
 */
export interface Bead {
  // Identification
  id: string;

  // Content
  title: string;
  description?: string;
  design?: string;
  acceptance_criteria?: string;
  notes?: string;

  // Status & Workflow
  status: BeadStatus | string;
  priority: number;
  issue_type: BeadType | string;

  // Assignment
  assignee?: string;
  owner?: string;
  estimated_minutes?: number;

  // Timestamps
  created_at: string;
  created_by: string;
  updated_at: string;
  closed_at?: string;
  close_reason?: string;
  closed_by_session?: string;

  // Scheduling
  due_at?: string;
  defer_until?: string;

  // External Integration
  external_ref?: string;
  source_system?: string;
  metadata?: Record<string, unknown>;

  // Labels & Relations
  labels?: string[];
  dependencies?: Dependency[];
  dependents?: DependentBead[];
  comments?: Comment[];

  // Agent / Role
  agent_state?: AgentState;
  hook_bead?: string;
  role_bead?: string;
  role_type?: RoleType;
  rig?: string;
  last_activity?: string;

  // Gate / Async Coordination
  await_type?: AwaitType;
  await_id?: string;
  timeout?: number;
  waiters?: string[];

  // Event
  event_kind?: string;
  actor?: string;
  target?: string;
  payload?: string;

  // Molecule
  mol_type?: MolType;
  work_type?: WorkType;
  is_template?: boolean;

  // Compaction
  compaction_level?: number;
  compacted_at?: string;
  compacted_at_commit?: string;
  original_size?: number;

  // Tombstone
  deleted_at?: string;
  deleted_by?: string;
  delete_reason?: string;
  original_type?: string;

  // Messaging
  sender?: string;
  ephemeral?: boolean;
  wisp_type?: WispType;
  pinned?: boolean;

  // HOP (Quality)
  quality_score?: number;
  crystallizes?: boolean;

  // JSONL-Only Fields
  holder?: string;
  bonded_from?: BondRef[];
  source_formula?: string;
  source_location?: string;
  creator?: EntityRef;
  validations?: Validation[];
}

/**
 * Bead list item - minimal fields from `bd list --json` output.
 */
export interface BeadListItem {
  id: string;
  title: string;
  description?: string;
  acceptance_criteria?: string;
  status: BeadStatus | string;
  priority: number;
  issue_type: BeadType | string;
  assignee?: string;
  owner?: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  labels?: string[];
  dependents?: DependentBead[];
}

// =============================================================================
// Formula Types (from docs/formulas.md)
// =============================================================================

/**
 * Formula types.
 */
export type FormulaType = 'workflow' | 'expansion' | 'aspect';

/**
 * Formula phase.
 */
export type FormulaPhase = 'liquid' | 'vapor';

/**
 * Variable definition in a formula.
 */
export interface VarDef {
  /** What this variable is for */
  description?: string;
  /** Default value if not provided */
  default?: string;
  /** Must be provided (cannot have default) */
  required?: boolean;
  /** Allowed values */
  enum?: string[];
  /** Regex the value must match */
  pattern?: string;
  /** Expected type */
  type?: 'string' | 'int' | 'bool';
}

/**
 * Gate definition for async waits.
 */
export interface Gate {
  /** Gate type */
  type: 'gh:run' | 'gh:pr' | 'timer' | 'human' | 'mail';
  /** Condition identifier */
  id?: string;
  /** Duration before escalation */
  timeout?: string;
}

/**
 * Loop specification for iteration.
 */
export interface LoopSpec {
  /** Fixed iteration count */
  count?: number;
  /** Condition that ends the loop */
  until?: string;
  /** Max iterations for conditional loops */
  max?: number;
  /** Computed range expression */
  range?: string;
  /** Variable name exposed to body steps */
  var?: string;
  /** Steps to repeat */
  body?: Step[];
}

/**
 * On-complete specification for runtime expansion.
 */
export interface OnCompleteSpec {
  /** Path to iterable in step output */
  for_each?: string;
  /** Formula to instantiate for each item */
  bond?: string;
  /** Variable bindings */
  vars?: Record<string, string>;
  /** Run all bonded molecules concurrently */
  parallel?: boolean;
  /** Run one at a time */
  sequential?: boolean;
}

/**
 * Step definition in a formula.
 */
export interface Step {
  /** Unique within the formula */
  id: string;
  /** Supports variable substitution */
  title: string;
  /** Supports substitution */
  description?: string;
  /** Step type */
  type?: 'task' | 'bug' | 'feature' | 'epic' | 'chore';
  /** Priority 0-4 */
  priority?: number;
  /** Labels applied to created issue */
  labels?: string[];
  /** Step IDs this blocks on */
  depends_on?: string[];
  /** Simpler alias for depends_on */
  needs?: string[];
  /** Supports substitution */
  assignee?: string;
  /** Conditional inclusion */
  condition?: string;
  /** References an expansion formula */
  expand?: string;
  /** Variable overrides for expansion */
  expand_vars?: Record<string, string>;
  /** Async wait condition */
  gate?: Gate;
  /** Iteration specification */
  loop?: LoopSpec;
  /** Runtime for-each expansion */
  on_complete?: OnCompleteSpec;
  /** Fanout gate type */
  waits_for?: 'all-children' | 'any-children' | string;
  /** Nested hierarchy */
  children?: Step[];
}

/**
 * Bond point for composition.
 */
export interface BondPoint {
  name: string;
  after_step?: string;
  before_step?: string;
  parallel?: boolean;
}

/**
 * Hook definition for auto-attach.
 */
export interface Hook {
  trigger_label?: string;
  condition?: string;
  formula: string;
  bond_point?: string;
}

/**
 * Expand rule for applying expansion to a step.
 */
export interface ExpandRule {
  target: string;
  formula: string;
  vars?: Record<string, string>;
}

/**
 * Map rule for applying expansion to multiple steps.
 */
export interface MapRule {
  glob: string;
  formula: string;
  vars?: Record<string, string>;
}

/**
 * Branch rule for fork-join patterns.
 */
export interface BranchRule {
  from: string;
  steps: string[];
  join: string;
}

/**
 * Gate rule for conditional waits.
 */
export interface GateRule {
  before: string;
  gate: Gate;
}

/**
 * Compose rules for formula bonding.
 */
export interface ComposeRules {
  bond_points?: BondPoint[];
  hooks?: Hook[];
  expand?: ExpandRule[];
  map?: MapRule[];
  branch?: BranchRule[];
  gate?: GateRule[];
  aspects?: string[];
}

/**
 * Advice step for aspect weaving.
 */
export interface AdviceStep {
  id?: string;
  title: string;
  description?: string;
  type?: string;
}

/**
 * Around advice for wrapping steps.
 */
export interface AroundAdvice {
  before: AdviceStep;
  after: AdviceStep;
}

/**
 * Advice rule for aspect formulas.
 */
export interface AdviceRule {
  target: string;
  before?: AdviceStep;
  after?: AdviceStep;
  around?: AroundAdvice;
}

/**
 * Pointcut for aspect targeting.
 */
export interface Pointcut {
  glob?: string;
  type?: string;
  label?: string;
}

/**
 * Full Formula type matching the Go Formula struct.
 */
export interface Formula {
  /** Unique name identifier */
  formula: string;
  /** Formula description */
  description?: string;
  /** Schema version (currently 1) */
  version?: number;
  /** Formula type */
  type?: FormulaType;
  /** Recommended instantiation mode */
  phase?: FormulaPhase;
  /** Source file path (set by parser) */
  source?: string;
  /** Parent formulas to inherit from */
  extends?: string[];
  /** Typed variables with defaults, enums, regex patterns */
  vars?: Record<string, VarDef>;
  /** Work item steps */
  steps?: Step[];
  /** Expansion template steps (for TypeExpansion) */
  template?: Step[];
  /** Composition/bonding rules */
  compose?: ComposeRules;
  /** Before/after/around step transformations */
  advice?: AdviceRule[];
  /** Target patterns for aspect formulas */
  pointcuts?: Pointcut[];
}
