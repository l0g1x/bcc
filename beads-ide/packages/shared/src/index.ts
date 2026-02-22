/**
 * @beads-ide/shared
 * Shared types for the Beads IDE frontend and backend.
 */

// Core domain types
export type {
  // Status & Type Enums
  BeadStatus,
  BeadType,
  DependencyType,
  AgentState,
  RoleType,
  AwaitType,
  MolType,
  WorkType,
  WispType,
  BondType,
  // Dependency & Relations
  Dependency,
  DependentBead,
  BondRef,
  EntityRef,
  Validation,
  Comment,
  // Bead (Issue)
  Bead,
  BeadListItem,
  // Formula Types
  FormulaType,
  FormulaPhase,
  VarDef,
  Gate,
  LoopSpec,
  OnCompleteSpec,
  Step,
  BondPoint,
  Hook,
  ExpandRule,
  MapRule,
  BranchRule,
  GateRule,
  ComposeRules,
  AdviceStep,
  AroundAdvice,
  AdviceRule,
  Pointcut,
  Formula,
} from './types.js';

// IDE-specific types
export type {
  // Wave Computation
  Wave,
  WaveResult,
  // Graph Analysis
  GraphNode,
  GraphMetrics,
  GraphStats,
  // Formula Files
  FormulaFile,
  CookResult,
  // API Responses
  ApiResponse,
  PaginatedResponse,
  // CLI Invocation
  CliInvocation,
  // Session State
  SessionState,
  // Configuration
  BeadsIDEConfig,
  EditorConfig,
  GraphConfig,
  // UI State
  BeadFilters,
  SortState,
  SelectionState,
  // Events
  BeadChangeEvent,
  FormulaChangeEvent,
} from './ide-types.js';
