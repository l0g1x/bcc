import { readdirSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import type { Formula, FormulaListError, FormulaListResponse } from '@beads-ide/shared'
/**
 * Formula list routes for Beads IDE backend.
 * Provides API for discovering formulas across all configured search paths.
 */
import { Hono } from 'hono'
import { getConfig } from '../config.js'

const formulas = new Hono()

/**
 * Generate a human-readable label for a search path.
 */
function getSearchPathLabel(searchPath: string, projectRoot: string): string {
  const home = homedir()
  const gtRoot = process.env.GT_ROOT

  // Check known paths and return friendly labels
  if (searchPath === resolve(projectRoot, 'formulas')) {
    return 'Project formulas'
  }
  if (searchPath === resolve(projectRoot, '.beads', 'formulas')) {
    return 'Project .beads'
  }
  if (searchPath === resolve(home, '.beads', 'formulas')) {
    return 'User formulas'
  }
  if (gtRoot && searchPath === resolve(gtRoot, '.beads', 'formulas')) {
    return 'Gas Town formulas'
  }

  // Fallback: use relative path or basename
  if (searchPath.startsWith(projectRoot)) {
    return searchPath.slice(projectRoot.length + 1)
  }
  if (searchPath.startsWith(home)) {
    return `~${searchPath.slice(home.length)}`
  }

  return basename(searchPath)
}

/**
 * Discover formula files in a directory.
 * Returns array of formula names (without .formula.toml extension).
 */
function discoverFormulasInPath(searchPath: string, projectRoot: string): Formula[] {
  const formulaList: Formula[] = []
  const searchPathLabel = getSearchPathLabel(searchPath, projectRoot)

  try {
    const entries = readdirSync(searchPath)

    for (const entry of entries) {
      // Match .formula.toml or .formula.json files
      if (entry.endsWith('.formula.toml') || entry.endsWith('.formula.json')) {
        const fullPath = join(searchPath, entry)
        const stat = statSync(fullPath)

        if (stat.isFile()) {
          // Extract name without extension
          const name = entry.replace(/\.formula\.(toml|json)$/, '')

          formulaList.push({
            name,
            path: fullPath,
            searchPath,
            searchPathLabel,
          })
        }
      }
    }
  } catch {
    // Directory doesn't exist or can't be read - skip silently
  }

  return formulaList
}

/**
 * GET /api/formulas
 * List all formulas discovered across configured search paths.
 */
formulas.get('/formulas', (c) => {
  try {
    const config = getConfig()
    const allFormulas: Formula[] = []

    // Collect formulas from all search paths
    for (const searchPath of config.formulaPaths) {
      const pathFormulas = discoverFormulasInPath(searchPath, config.projectRoot)
      allFormulas.push(...pathFormulas)
    }

    // Sort by name for consistent ordering
    allFormulas.sort((a, b) => a.name.localeCompare(b.name))

    const response: FormulaListResponse = {
      ok: true,
      formulas: allFormulas,
      count: allFormulas.length,
      searchPaths: config.formulaPaths,
    }

    return c.json(response)
  } catch (error) {
    const response: FormulaListError = {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
    return c.json(response, 500)
  }
})

export { formulas }
