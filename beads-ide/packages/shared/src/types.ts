/**
 * Bead types matching bd CLI JSON output.
 * These types represent the full bead data structure as returned by `bd list --json` and `bd show --json`.
 */

/** Bead status values */
export type BeadStatus = 'open' | 'in_progress' | 'hooked' | 'closed' | 'blocked'

/** Bead issue type values */
export type BeadType = 'task' | 'bug' | 'epic' | 'agent' | 'convoy' | 'molecule'

/** Dependency relationship type */
export type DependencyType =
  | 'blocks'
  | 'parent-child'
  | 'conditional-blocks'
  | 'waits-for'
  | 'tracks'

/**
 * Dependency reference in bead list.
 */
export interface BeadDependency {
  issue_id: string
  depends_on_id: string
  type: DependencyType | string
  created_at: string
  created_by: string
  metadata?: string
}

/**
 * Dependent reference in bead show (with inline bead data).
 */
export interface BeadDependent {
  id: string
  title: string
  description: string
  acceptance_criteria?: string
  status: BeadStatus | string
  priority: number
  issue_type: BeadType | string
  owner: string
  assignee?: string
  created_at: string
  created_by: string
  updated_at: string
  dependency_type: DependencyType | string
}

/**
 * Full bead structure as returned by bd CLI.
 */
export interface BeadFull {
  id: string
  title: string
  description: string
  acceptance_criteria?: string
  status: BeadStatus | string
  priority: number
  issue_type: BeadType | string
  owner: string
  assignee?: string
  created_at: string
  created_by: string
  updated_at: string

  /** Labels attached to the bead */
  labels?: string[]

  /** Dependencies (beads this one depends on) - present in list output */
  dependencies?: BeadDependency[]

  /** Dependents (beads that depend on this one) - present in show output */
  dependents?: BeadDependent[]

  /** Number of dependencies */
  dependency_count: number

  /** Number of dependents */
  dependent_count: number

  /** Number of comments */
  comment_count: number

  // Agent-specific fields
  /** Hooked bead ID (for agent type) */
  hook_bead?: string
  /** Agent state (for agent type) */
  agent_state?: string
  /** Last activity timestamp (for agent type) */
  last_activity?: string
}

/**
 * API error response structure.
 */
export interface BeadApiError {
  error: string
  code: string
  details?: string
}

/**
 * Successful beads list response.
 */
export interface BeadsListResponse {
  beads: BeadFull[]
  count: number
}

/**
 * Successful single bead response.
 */
export interface BeadShowResponse {
  bead: BeadFull
}
