// Shared types for beads-ide
export interface Placeholder {
  id: string
}

// Wave computation
export {
  computeWaves,
  isWorkflowDep,
  WORKFLOW_DEP_TYPES,
  type Bead,
  type Dependency,
  type Wave,
  type WaveResult,
  type WorkflowDepType,
} from './wave.js'

// Bead API types
export type {
  BeadStatus,
  BeadType,
  DependencyType,
  BeadDependency,
  BeadDependent,
  BeadFull,
  BeadApiError,
  BeadsListResponse,
  BeadShowResponse,
} from './types.js'
