/**
 * IDE-specific types for the Beads IDE.
 * These types are used by the frontend and backend for wave computation,
 * graph analysis, API responses, and application state.
 */

import type { Bead, BeadListItem, Formula } from './types.js';

// =============================================================================
// Wave Computation
// =============================================================================

/**
 * A wave is a group of beads that can be executed in parallel.
 * Beads in the same wave have no dependencies on each other.
 */
export interface Wave {
  /** Wave index (0-based, lower waves execute first) */
  index: number;
  /** Bead IDs in this wave */
  beadIds: string[];
}

/**
 * Result of wave computation (topological sort with level assignment).
 */
export interface WaveResult {
  /** Ordered waves from first to last */
  waves: Wave[];
  /** Cycles detected in the dependency graph */
  cycles: string[][];
  /** Whether cycles were detected */
  hasCycles: boolean;
}

// =============================================================================
// Graph Analysis
// =============================================================================

/**
 * Node in the dependency graph.
 */
export interface GraphNode {
  /** Bead ID */
  id: string;
  /** Display label */
  label: string;
  /** Node type (maps to bead issue_type) */
  type: string;
  /** Priority level */
  priority: number;
  /** Current status */
  status: string;
  /** IDs of beads this node depends on */
  dependsOn: string[];
  /** IDs of beads that depend on this node */
  dependents: string[];
}

/**
 * The 9 graph metrics from bv analysis.
 */
export interface GraphMetrics {
  /** PageRank score per node */
  pageRank: Record<string, number>;
  /** Betweenness centrality per node */
  betweenness: Record<string, number>;
  /** HITS authority score per node */
  hitsAuthority: Record<string, number>;
  /** HITS hub score per node */
  hitsHub: Record<string, number>;
  /** Critical path length from each node */
  criticalPath: Record<string, number>;
  /** Eigenvector centrality per node */
  eigenvector: Record<string, number>;
  /** In-degree per node */
  degreeIn: Record<string, number>;
  /** Out-degree per node */
  degreeOut: Record<string, number>;
  /** Graph density (edge count / possible edges) */
  density: number;
  /** Number of cycles in the graph */
  cycleCount: number;
  /** Topological sort order (IDs in execution order) */
  topoSort: string[];
}

/**
 * Summary statistics for the graph.
 */
export interface GraphStats {
  /** Total number of nodes */
  nodeCount: number;
  /** Total number of edges */
  edgeCount: number;
  /** Number of connected components */
  componentCount: number;
  /** Length of the longest path */
  longestPath: number;
  /** Number of root nodes (no incoming edges) */
  rootCount: number;
  /** Number of leaf nodes (no outgoing edges) */
  leafCount: number;
  /** Average degree */
  avgDegree: number;
}

// =============================================================================
// Formula Files
// =============================================================================

/**
 * Formula file metadata from disk scan.
 */
export interface FormulaFile {
  /** Formula name (without .formula.toml extension) */
  name: string;
  /** Full file path */
  path: string;
  /** Directory containing the formula */
  directory: string;
  /** Search path level: project, user, or orchestrator */
  level: 'project' | 'user' | 'orchestrator';
}

/**
 * Result of cooking a formula.
 */
export interface CookResult {
  /** Whether cooking succeeded */
  success: boolean;
  /** Proto beads (if successful) */
  proto?: Bead[];
  /** Error message (if failed) */
  error?: string;
  /** Stderr output */
  stderr?: string;
  /** Parsed formula (for editor display) */
  formula?: Formula;
}

// =============================================================================
// API Responses
// =============================================================================

/**
 * Standard API response wrapper.
 */
export interface ApiResponse<T> {
  /** Whether the request succeeded */
  success: boolean;
  /** Response data (if successful) */
  data?: T;
  /** Error message (if failed) */
  error?: string;
  /** Additional error details */
  details?: string;
}

/**
 * Paginated list response.
 */
export interface PaginatedResponse<T> {
  /** Items in this page */
  items: T[];
  /** Total count across all pages */
  total: number;
  /** Current page (0-based) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Whether there are more pages */
  hasMore: boolean;
}

// =============================================================================
// CLI Invocation
// =============================================================================

/**
 * Record of a CLI invocation for debugging/logging.
 */
export interface CliInvocation {
  /** CLI binary used */
  binary: 'bd' | 'gt' | 'bv';
  /** Arguments passed */
  args: string[];
  /** Working directory */
  cwd: string;
  /** Start timestamp */
  startedAt: string;
  /** End timestamp */
  endedAt?: string;
  /** Duration in milliseconds */
  durationMs?: number;
  /** Exit code */
  exitCode?: number;
  /** Whether it succeeded */
  success?: boolean;
}

// =============================================================================
// Session State
// =============================================================================

/**
 * Current session state for the IDE.
 */
export interface SessionState {
  /** Currently hooked bead ID (if any) */
  hookedBead?: string;
  /** Current agent role (if applicable) */
  role?: string;
  /** Current rig */
  rig?: string;
  /** Working directory */
  workdir: string;
  /** Last activity timestamp */
  lastActivity: string;
}

// =============================================================================
// Configuration
// =============================================================================

/**
 * Beads IDE configuration.
 */
export interface BeadsIDEConfig {
  /** Backend API base URL */
  apiBaseUrl: string;
  /** Auto-refresh interval in milliseconds (0 to disable) */
  autoRefreshInterval: number;
  /** Default formula search paths */
  formulaPaths: string[];
  /** Theme preference */
  theme: 'light' | 'dark' | 'system';
  /** Editor settings */
  editor: EditorConfig;
  /** Graph visualization settings */
  graph: GraphConfig;
}

/**
 * Editor configuration.
 */
export interface EditorConfig {
  /** Font size in pixels */
  fontSize: number;
  /** Tab size */
  tabSize: number;
  /** Word wrap mode */
  wordWrap: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
  /** Auto-save delay in milliseconds (0 to disable) */
  autoSaveDelay: number;
}

/**
 * Graph visualization configuration.
 */
export interface GraphConfig {
  /** Layout algorithm */
  layout: 'dagre' | 'elk' | 'force' | 'tree';
  /** Node spacing */
  nodeSpacing: number;
  /** Rank spacing */
  rankSpacing: number;
  /** Show labels */
  showLabels: boolean;
  /** Show metrics overlay */
  showMetrics: boolean;
  /** Highlight critical path */
  highlightCriticalPath: boolean;
}

// =============================================================================
// UI State
// =============================================================================

/**
 * Filter state for bead list views.
 */
export interface BeadFilters {
  /** Filter by status */
  status?: string[];
  /** Filter by type */
  type?: string[];
  /** Filter by priority */
  priority?: number[];
  /** Filter by assignee */
  assignee?: string;
  /** Filter by labels */
  labels?: string[];
  /** Search text */
  search?: string;
}

/**
 * Sort state for list views.
 */
export interface SortState {
  /** Field to sort by */
  field: string;
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Selection state for multi-select views.
 */
export interface SelectionState {
  /** Selected item IDs */
  selectedIds: Set<string>;
  /** Last selected ID (for shift-click range selection) */
  lastSelectedId?: string;
}

// =============================================================================
// Event Types
// =============================================================================

/**
 * Bead change event (for real-time updates).
 */
export interface BeadChangeEvent {
  type: 'created' | 'updated' | 'deleted';
  bead: BeadListItem;
  timestamp: string;
}

/**
 * Formula change event.
 */
export interface FormulaChangeEvent {
  type: 'created' | 'updated' | 'deleted';
  formula: FormulaFile;
  timestamp: string;
}
