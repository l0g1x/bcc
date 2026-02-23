/**
 * TOML parser for .formula.toml files.
 * Uses smol-toml for parsing and validates against the Formula type.
 */
import { parse } from 'smol-toml'
import type { FormulaVariable, ProtoBead } from './ide-types.js'

/**
 * Parsed formula structure matching the TOML schema.
 */
export interface ParsedFormula {
  /** Formula name */
  name: string
  /** Formula version */
  version?: number
  /** Formula type (e.g., "workflow") */
  type?: string
  /** Formula phase (e.g., "liquid") */
  phase?: string
  /** Description */
  description?: string
  /** Variable definitions */
  vars: Record<string, FormulaVariable>
  /** Steps/proto-beads */
  steps: ProtoBead[]
}

/**
 * Validation error with line/column information for inline display.
 */
export interface FormulaParseError {
  /** Error message */
  message: string
  /** Line number (1-indexed) */
  line?: number
  /** Column number (1-indexed) */
  column?: number
  /** Error type */
  type: 'syntax' | 'validation'
}

/**
 * Result of parsing a formula TOML string.
 */
export type FormulaParseResult =
  | { ok: true; formula: ParsedFormula }
  | { ok: false; errors: FormulaParseError[] }

/**
 * Validates a variable definition object.
 */
function validateVariable(key: string, value: unknown): FormulaVariable | FormulaParseError {
  if (typeof value === 'object' && value !== null) {
    const v = value as Record<string, unknown>
    return {
      description: typeof v.description === 'string' ? v.description : '',
      default: typeof v.default === 'string' ? v.default : undefined,
      required: typeof v.required === 'boolean' ? v.required : undefined,
      enum: Array.isArray(v.enum) ? v.enum.filter((e) => typeof e === 'string') : undefined,
      type:
        v.type === 'string' || v.type === 'int' || v.type === 'bool'
          ? (v.type as FormulaVariable['type'])
          : undefined,
      pattern: typeof v.pattern === 'string' ? v.pattern : undefined,
    }
  }
  return {
    message: `Variable "${key}" must be an object with at least a description`,
    type: 'validation',
  }
}

/**
 * Validates a step definition object.
 */
function validateStep(step: unknown, index: number): ProtoBead | FormulaParseError {
  if (typeof step !== 'object' || step === null) {
    return {
      message: `Step ${index + 1} must be an object`,
      type: 'validation',
    }
  }

  const s = step as Record<string, unknown>

  // Required fields
  if (typeof s.id !== 'string' || s.id.trim() === '') {
    return {
      message: `Step ${index + 1} is missing required field "id"`,
      type: 'validation',
    }
  }

  if (typeof s.title !== 'string' || s.title.trim() === '') {
    return {
      message: `Step ${index + 1} is missing required field "title"`,
      type: 'validation',
    }
  }

  // Build the proto bead
  const protoBead: ProtoBead = {
    id: s.id.trim(),
    title: s.title.trim(),
    description: typeof s.description === 'string' ? s.description : '',
    priority: typeof s.priority === 'number' ? s.priority : 0,
  }

  // Optional needs array
  if (Array.isArray(s.needs)) {
    protoBead.needs = s.needs.filter((n) => typeof n === 'string')
  }

  return protoBead
}

/**
 * Parses a TOML string and validates it against the Formula schema.
 * Returns detailed errors for inline display in the editor.
 */
export function parseFormula(toml: string): FormulaParseResult {
  // Handle empty input
  if (!toml.trim()) {
    return {
      ok: false,
      errors: [{ message: 'Empty formula', type: 'validation' }],
    }
  }

  // Parse TOML
  let parsed: Record<string, unknown>
  try {
    parsed = parse(toml) as Record<string, unknown>
  } catch (e) {
    const error = e as Error & { line?: number; column?: number }
    return {
      ok: false,
      errors: [
        {
          message: error.message || 'Invalid TOML syntax',
          line: error.line,
          column: error.column,
          type: 'syntax',
        },
      ],
    }
  }

  const errors: FormulaParseError[] = []

  // Extract formula name - supports both flat and nested formats
  let name = ''
  let version: number | undefined
  let type: string | undefined
  let phase: string | undefined
  let description: string | undefined

  // Check for [formula] section (nested format)
  if (typeof parsed.formula === 'object' && parsed.formula !== null) {
    const f = parsed.formula as Record<string, unknown>
    if (typeof f.name === 'string') name = f.name
    if (typeof f.version === 'number') version = f.version
    if (typeof f.type === 'string') type = f.type
    if (typeof f.phase === 'string') phase = f.phase
    if (typeof f.description === 'string') description = f.description
  }

  // Check for flat format (formula = "name" at top level)
  if (typeof parsed.formula === 'string') {
    name = parsed.formula
  }

  // Flat format fields
  if (typeof parsed.version === 'number') version = parsed.version
  if (typeof parsed.type === 'string') type = parsed.type
  if (typeof parsed.phase === 'string') phase = parsed.phase
  if (typeof parsed.description === 'string') description = parsed.description

  // Validate required name
  if (!name) {
    errors.push({
      message: 'Missing required field: formula name (either "formula" = "name" or [formula].name)',
      type: 'validation',
    })
  }

  // Parse variables
  const vars: Record<string, FormulaVariable> = {}
  if (typeof parsed.vars === 'object' && parsed.vars !== null) {
    for (const [key, value] of Object.entries(parsed.vars as Record<string, unknown>)) {
      const result = validateVariable(key, value)
      if ('message' in result) {
        errors.push(result)
      } else {
        vars[key] = result
      }
    }
  }

  // Parse steps
  const steps: ProtoBead[] = []
  if (Array.isArray(parsed.steps)) {
    for (let i = 0; i < parsed.steps.length; i++) {
      const result = validateStep(parsed.steps[i], i)
      if ('message' in result) {
        errors.push(result)
      } else {
        steps.push(result)
      }
    }
  }

  // If there are validation errors, return them
  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    formula: {
      name,
      version,
      type,
      phase,
      description,
      vars,
      steps,
    },
  }
}

/**
 * Validates step dependency references (needs fields).
 * Call after parseFormula to check that all needs references are valid.
 */
export function validateDependencies(formula: ParsedFormula): FormulaParseError[] {
  const errors: FormulaParseError[] = []
  const stepIds = new Set(formula.steps.map((s) => s.id))

  for (const step of formula.steps) {
    if (step.needs) {
      for (const need of step.needs) {
        if (!stepIds.has(need)) {
          errors.push({
            message: `Step "${step.id}" references unknown dependency "${need}"`,
            type: 'validation',
          })
        }
      }
    }
  }

  return errors
}

/**
 * Convenience function that parses and validates dependencies in one call.
 */
export function parseAndValidateFormula(toml: string): FormulaParseResult {
  const result = parseFormula(toml)

  if (!result.ok) {
    return result
  }

  const depErrors = validateDependencies(result.formula)
  if (depErrors.length > 0) {
    return { ok: false, errors: depErrors }
  }

  return result
}
