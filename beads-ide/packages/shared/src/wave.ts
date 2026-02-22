/**
 * Wave computation for beads dependency frontiers.
 *
 * Groups beads into "waves" - sets of beads that can execute in parallel
 * because all their dependencies have been satisfied in previous waves.
 */

/** Workflow dependency types that affect execution ordering */
export const WORKFLOW_DEP_TYPES = [
  'blocks',
  'parent-child',
  'conditional-blocks',
  'waits-for',
] as const

export type WorkflowDepType = (typeof WORKFLOW_DEP_TYPES)[number]

/** Dependency relationship between beads */
export interface Dependency {
  /** Source bead ID (the bead that this dependency comes from) */
  source: string
  /** Target bead ID (the bead that depends on source) */
  target: string
  /** Type of dependency relationship */
  type: string
}

/** Minimal bead structure needed for wave computation */
export interface Bead {
  id: string
  /** Dependencies where this bead is the target (things this bead depends on) */
  dependencies?: Dependency[]
}

/** A wave of beads that can execute in parallel */
export interface Wave {
  /** Zero-indexed wave level */
  level: number
  /** Bead IDs in this wave */
  beadIds: string[]
}

/** Result of wave computation */
export interface WaveResult {
  /** Waves in execution order (wave 0 first) */
  waves: Wave[]
  /** Groups of bead IDs that form cycles (if any) */
  cycles: string[][]
  /** Whether any cycles were detected */
  hasCycles: boolean
}

/**
 * Check if a dependency type affects workflow execution ordering.
 */
export function isWorkflowDep(type: string): type is WorkflowDepType {
  return WORKFLOW_DEP_TYPES.includes(type as WorkflowDepType)
}

/**
 * Compute dependency waves using Kahn's algorithm (BFS topological sort).
 *
 * Algorithm:
 * 1. Build adjacency list and in-degree map from workflow dependencies
 * 2. Start with all zero-in-degree nodes (no dependencies) as wave 0
 * 3. Process each wave: for each bead, decrement in-degree of its dependents
 * 4. Nodes that reach zero in-degree form the next wave
 * 5. Remaining nodes after BFS completes are part of cycles
 *
 * @param beads - Array of beads with their dependencies
 * @returns WaveResult with waves, detected cycles, and hasCycles flag
 */
export function computeWaves(beads: Bead[]): WaveResult {
  if (beads.length === 0) {
    return { waves: [], cycles: [], hasCycles: false }
  }

  // Build bead lookup and validate IDs exist
  const beadIds = new Set(beads.map((b) => b.id))

  // Build adjacency list: source -> targets (beads that depend on source)
  // And in-degree map: bead -> number of dependencies it has
  const dependents = new Map<string, string[]>()
  const inDegree = new Map<string, number>()

  // Initialize all beads with zero in-degree
  for (const bead of beads) {
    dependents.set(bead.id, [])
    inDegree.set(bead.id, 0)
  }

  // Track processed edges to handle duplicates
  const processedEdges = new Set<string>()

  // Process dependencies to build the graph
  for (const bead of beads) {
    if (!bead.dependencies) continue

    for (const dep of bead.dependencies) {
      // Only consider workflow dependency types
      if (!isWorkflowDep(dep.type)) continue

      // Skip dependencies to beads not in our set
      if (!beadIds.has(dep.source)) continue

      // dep.source blocks dep.target, so target depends on source
      // When processing from bead's perspective: bead is target, dep.source is the blocker
      const blocker = dep.source
      const dependent = bead.id

      // Skip duplicate edges
      const edgeKey = `${blocker}->${dependent}`
      if (processedEdges.has(edgeKey)) continue
      processedEdges.add(edgeKey)

      // Add to adjacency list: blocker -> dependent
      const deps = dependents.get(blocker)
      if (deps) {
        deps.push(dependent)
      }

      // Increment in-degree for the dependent
      inDegree.set(dependent, (inDegree.get(dependent) ?? 0) + 1)
    }
  }

  // BFS to compute waves
  const waves: Wave[] = []
  const processed = new Set<string>()

  // Start with zero-in-degree nodes
  let currentWave: string[] = []
  for (const [id, degree] of inDegree) {
    if (degree === 0) {
      currentWave.push(id)
    }
  }

  while (currentWave.length > 0) {
    // Sort for deterministic output
    currentWave.sort()

    waves.push({
      level: waves.length,
      beadIds: currentWave,
    })

    // Mark as processed
    for (const id of currentWave) {
      processed.add(id)
    }

    // Find next wave: decrement in-degree for dependents
    const nextWave: string[] = []
    for (const id of currentWave) {
      const deps = dependents.get(id) ?? []
      for (const depId of deps) {
        if (processed.has(depId)) continue

        const newDegree = (inDegree.get(depId) ?? 1) - 1
        inDegree.set(depId, newDegree)

        if (newDegree === 0 && !nextWave.includes(depId)) {
          nextWave.push(depId)
        }
      }
    }

    currentWave = nextWave
  }

  // Detect cycles: any unprocessed beads are in cycles
  const cycleNodes: string[] = []
  for (const bead of beads) {
    if (!processed.has(bead.id)) {
      cycleNodes.push(bead.id)
    }
  }

  // Find strongly connected components (cycles) using simple DFS
  const cycles = findCycles(cycleNodes, dependents, beadIds)

  return {
    waves,
    cycles,
    hasCycles: cycles.length > 0,
  }
}

/**
 * Find cycle groups among unprocessed nodes.
 *
 * Uses a simple approach: for each unvisited node, do DFS to find
 * all nodes reachable from it that are also in the unprocessed set.
 */
function findCycles(
  cycleNodes: string[],
  dependents: Map<string, string[]>,
  allBeadIds: Set<string>
): string[][] {
  if (cycleNodes.length === 0) return []

  const cycleSet = new Set(cycleNodes)
  const visited = new Set<string>()
  const cycles: string[][] = []

  for (const start of cycleNodes) {
    if (visited.has(start)) continue

    // DFS to find all connected nodes in the cycle set
    const component: string[] = []
    const stack = [start]

    while (stack.length > 0) {
      const node = stack.pop()
      if (node === undefined) continue
      if (visited.has(node)) continue
      if (!cycleSet.has(node)) continue

      visited.add(node)
      component.push(node)

      // Add dependents that are in cycle set
      const deps = dependents.get(node) ?? []
      for (const dep of deps) {
        if (!visited.has(dep) && cycleSet.has(dep)) {
          stack.push(dep)
        }
      }
    }

    if (component.length > 0) {
      component.sort()
      cycles.push(component)
    }
  }

  return cycles
}
