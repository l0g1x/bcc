/**
 * Test fixtures for wave computation.
 */
import type { Bead } from '../../src/wave.js'

/**
 * Linear chain: A -> B -> C
 * Expected: 3 waves ([A], [B], [C])
 */
export const linearChain: Bead[] = [
  { id: 'A', dependencies: [] },
  {
    id: 'B',
    dependencies: [{ source: 'A', target: 'B', type: 'blocks' }],
  },
  {
    id: 'C',
    dependencies: [{ source: 'B', target: 'C', type: 'blocks' }],
  },
]

/**
 * Diamond pattern:
 *     A
 *    / \
 *   B   C
 *    \ /
 *     D
 * Expected: 3 waves ([A], [B, C], [D])
 */
export const diamondPattern: Bead[] = [
  { id: 'A', dependencies: [] },
  {
    id: 'B',
    dependencies: [{ source: 'A', target: 'B', type: 'blocks' }],
  },
  {
    id: 'C',
    dependencies: [{ source: 'A', target: 'C', type: 'blocks' }],
  },
  {
    id: 'D',
    dependencies: [
      { source: 'B', target: 'D', type: 'blocks' },
      { source: 'C', target: 'D', type: 'blocks' },
    ],
  },
]

/**
 * Simple cycle: A -> B -> C -> A
 * Expected: 0 waves, 1 cycle containing [A, B, C]
 */
export const simpleCycle: Bead[] = [
  {
    id: 'A',
    dependencies: [{ source: 'C', target: 'A', type: 'blocks' }],
  },
  {
    id: 'B',
    dependencies: [{ source: 'A', target: 'B', type: 'blocks' }],
  },
  {
    id: 'C',
    dependencies: [{ source: 'B', target: 'C', type: 'blocks' }],
  },
]

/**
 * Mixed cycle: D depends on A, but A-B-C form a cycle
 *     D
 *     |
 *     v
 *     A -> B -> C -> A (cycle)
 * Expected: 1 wave ([D]), 1 cycle ([A, B, C])
 */
export const mixedCycle: Bead[] = [
  { id: 'D', dependencies: [] },
  {
    id: 'A',
    dependencies: [
      { source: 'D', target: 'A', type: 'blocks' },
      { source: 'C', target: 'A', type: 'blocks' },
    ],
  },
  {
    id: 'B',
    dependencies: [{ source: 'A', target: 'B', type: 'blocks' }],
  },
  {
    id: 'C',
    dependencies: [{ source: 'B', target: 'C', type: 'blocks' }],
  },
]

/**
 * Disconnected components:
 *   A -> B    C -> D
 * Expected: 2 waves ([A, C], [B, D])
 */
export const disconnected: Bead[] = [
  { id: 'A', dependencies: [] },
  {
    id: 'B',
    dependencies: [{ source: 'A', target: 'B', type: 'blocks' }],
  },
  { id: 'C', dependencies: [] },
  {
    id: 'D',
    dependencies: [{ source: 'C', target: 'D', type: 'blocks' }],
  },
]

/**
 * Complex DAG:
 *       A
 *      /|\
 *     B C D
 *     |X|/
 *     E F
 *      \|
 *       G
 */
export const complexDag: Bead[] = [
  { id: 'A', dependencies: [] },
  {
    id: 'B',
    dependencies: [{ source: 'A', target: 'B', type: 'blocks' }],
  },
  {
    id: 'C',
    dependencies: [{ source: 'A', target: 'C', type: 'blocks' }],
  },
  {
    id: 'D',
    dependencies: [{ source: 'A', target: 'D', type: 'blocks' }],
  },
  {
    id: 'E',
    dependencies: [
      { source: 'B', target: 'E', type: 'blocks' },
      { source: 'C', target: 'E', type: 'blocks' },
    ],
  },
  {
    id: 'F',
    dependencies: [
      { source: 'C', target: 'F', type: 'blocks' },
      { source: 'D', target: 'F', type: 'blocks' },
    ],
  },
  {
    id: 'G',
    dependencies: [
      { source: 'E', target: 'G', type: 'blocks' },
      { source: 'F', target: 'G', type: 'blocks' },
    ],
  },
]

/**
 * Mixed dependency types - only workflow types should be considered.
 * A blocks B (workflow), A references C (non-workflow)
 * Expected: 2 waves ([A, C], [B]) - C is independent since 'references' is not workflow
 */
export const mixedDepTypes: Bead[] = [
  { id: 'A', dependencies: [] },
  {
    id: 'B',
    dependencies: [{ source: 'A', target: 'B', type: 'blocks' }],
  },
  {
    id: 'C',
    dependencies: [{ source: 'A', target: 'C', type: 'references' }],
  },
]

/**
 * All workflow dependency types.
 */
export const allWorkflowTypes: Bead[] = [
  { id: 'A', dependencies: [] },
  {
    id: 'B',
    dependencies: [{ source: 'A', target: 'B', type: 'blocks' }],
  },
  {
    id: 'C',
    dependencies: [{ source: 'B', target: 'C', type: 'parent-child' }],
  },
  {
    id: 'D',
    dependencies: [{ source: 'C', target: 'D', type: 'conditional-blocks' }],
  },
  {
    id: 'E',
    dependencies: [{ source: 'D', target: 'E', type: 'waits-for' }],
  },
]

/**
 * Generate a large DAG for performance testing.
 * Creates n beads where each bead (except first) depends on the previous.
 */
export function generateLargeLinearChain(n: number): Bead[] {
  const beads: Bead[] = []
  for (let i = 0; i < n; i++) {
    const id = `bead-${i.toString().padStart(4, '0')}`
    const deps: Bead['dependencies'] =
      i === 0
        ? []
        : [
            {
              source: `bead-${(i - 1).toString().padStart(4, '0')}`,
              target: id,
              type: 'blocks',
            },
          ]
    beads.push({ id, dependencies: deps })
  }
  return beads
}

/**
 * Generate a wide DAG - many parallel chains merging at the end.
 * Creates `width` parallel chains of `depth` length, all merging to a final node.
 */
export function generateWideDag(width: number, depth: number): Bead[] {
  const beads: Bead[] = []

  // Create parallel chains
  for (let w = 0; w < width; w++) {
    for (let d = 0; d < depth; d++) {
      const id = `chain${w}-depth${d}`
      const deps: Bead['dependencies'] =
        d === 0
          ? []
          : [
              {
                source: `chain${w}-depth${d - 1}`,
                target: id,
                type: 'blocks',
              },
            ]
      beads.push({ id, dependencies: deps })
    }
  }

  // Final merge node
  const finalDeps: Bead['dependencies'] = []
  for (let w = 0; w < width; w++) {
    finalDeps.push({
      source: `chain${w}-depth${depth - 1}`,
      target: 'final',
      type: 'blocks',
    })
  }
  beads.push({ id: 'final', dependencies: finalDeps })

  return beads
}
