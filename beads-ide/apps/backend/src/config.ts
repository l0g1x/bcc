/**
 * Configuration management for Beads IDE backend.
 * Handles formula search paths, CLI binary locations, and project root detection.
 */
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, resolve } from 'node:path'

export interface BeadsConfig {
  /** Ordered list of formula search paths that exist */
  formulaPaths: string[]
  /** Project root directory */
  projectRoot: string
  /** bd CLI binary location (or 'bd' if in PATH) */
  bdBinary: string
  /** gt CLI binary location (or 'gt' if in PATH) */
  gtBinary: string
  /** bv CLI binary location (or 'bv' if in PATH) */
  bvBinary: string
}

/**
 * Resolves the project root by following .beads/redirect if present.
 * Walks up directory tree looking for .beads directory.
 */
export function resolveProjectRoot(startDir: string = process.cwd()): string {
  let dir = resolve(startDir)
  const maxDepth = 10
  let depth = 0

  while (depth < maxDepth) {
    const beadsDir = resolve(dir, '.beads')
    const redirectFile = resolve(beadsDir, 'redirect')

    if (existsSync(redirectFile)) {
      const redirectTarget = readFileSync(redirectFile, 'utf-8').trim()
      if (redirectTarget) {
        dir = resolve(dirname(redirectFile), redirectTarget)
        depth++
        continue
      }
    }

    if (existsSync(beadsDir)) {
      return dir
    }

    const parent = dirname(dir)
    if (parent === dir) {
      break
    }
    dir = parent
    depth++
  }

  return startDir
}

/**
 * Returns ordered list of formula search paths.
 * Searches in order:
 *   1. formulas/ (relative to project root)
 *   2. .beads/formulas/ (relative to project root)
 *   3. ~/.beads/formulas/
 *   4. $GT_ROOT/.beads/formulas/
 * Skips missing directories gracefully.
 */
export function getFormulaSearchPaths(projectRoot: string): string[] {
  const paths: string[] = []
  const home = homedir()
  const gtRoot = process.env.GT_ROOT

  // Order of search paths per spec
  const candidates = [
    resolve(projectRoot, 'formulas'),
    resolve(projectRoot, '.beads', 'formulas'),
    resolve(home, '.beads', 'formulas'),
  ]

  // Add GT_ROOT path if set
  if (gtRoot) {
    candidates.push(resolve(gtRoot, '.beads', 'formulas'))
  }

  // Only include paths that exist
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      paths.push(candidate)
    }
  }

  return paths
}

/**
 * Resolves CLI binary location.
 * Returns the binary name if it should be found in PATH.
 */
function resolveBinary(name: string): string {
  // Could be extended to check specific paths, but for now assume in PATH
  return name
}

/**
 * Loads the full configuration.
 */
export function loadConfig(cwd: string = process.cwd()): BeadsConfig {
  const projectRoot = resolveProjectRoot(cwd)
  const formulaPaths = getFormulaSearchPaths(projectRoot)

  return {
    formulaPaths,
    projectRoot,
    bdBinary: resolveBinary('bd'),
    gtBinary: resolveBinary('gt'),
    bvBinary: resolveBinary('bv'),
  }
}

// Cached config instance
let cachedConfig: BeadsConfig | null = null

// Workspace root for hot-swapping active directory
let workspaceRoot: string | null = null

/**
 * Gets the configuration, loading it if not already cached.
 * Uses the workspace root if set, otherwise uses current working directory.
 */
export function getConfig(): BeadsConfig {
  if (!cachedConfig) {
    cachedConfig = loadConfig(getWorkspaceRoot())
  }
  return cachedConfig
}

/**
 * Clears the cached configuration (useful for testing or when project changes).
 * Note: Does NOT reset workspaceRoot - that's managed separately.
 */
export function clearConfigCache(): void {
  cachedConfig = null
}

/**
 * Gets the current workspace root directory.
 * Returns the explicitly set workspace root, or process.cwd() if not set.
 */
export function getWorkspaceRoot(): string {
  return workspaceRoot ?? process.cwd()
}

/**
 * Sets the workspace root directory for hot-swapping the active root.
 * Also clears the config cache so getConfig() will reload with the new root.
 */
export function setWorkspaceRoot(path: string): void {
  workspaceRoot = path
  clearConfigCache()
}
