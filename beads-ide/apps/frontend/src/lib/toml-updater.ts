/**
 * TOML updater for variable values.
 * Updates the default value in a vars section when the user edits it in the panel.
 */

/**
 * Updates the default value for a variable in a TOML string.
 * If the variable section exists, updates or adds the default line.
 * If the variable section doesn't exist, adds it.
 *
 * @param toml - The current TOML content
 * @param varName - The variable name to update
 * @param value - The new default value
 * @returns The updated TOML content
 */
export function updateVarDefault(toml: string, varName: string, value: string): string {
  const lines = toml.split('\n')
  const result: string[] = []

  // Escape the variable name for regex
  const escapedVarName = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  // Regex to match [vars.varName] section header
  const sectionRegex = new RegExp(`^\\s*\\[vars\\.${escapedVarName}\\]\\s*$`)

  // Regex to match next section header
  const nextSectionRegex = /^\s*\[/

  // Regex to match default = "value" or default = 'value' or default = value
  const defaultRegex = /^\s*default\s*=/

  let inTargetSection = false
  let foundDefault = false
  let insertedDefault = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (sectionRegex.test(line)) {
      // Entering the target vars section
      inTargetSection = true
      foundDefault = false
      result.push(line)
      continue
    }

    if (inTargetSection && nextSectionRegex.test(line)) {
      // Leaving the target section - insert default if we didn't find it
      if (!foundDefault && !insertedDefault && value !== '') {
        result.push(formatDefaultLine(value))
        insertedDefault = true
      }
      inTargetSection = false
      result.push(line)
      continue
    }

    if (inTargetSection && defaultRegex.test(line)) {
      // Found the default line - replace it
      foundDefault = true
      insertedDefault = true
      if (value !== '') {
        result.push(formatDefaultLine(value))
      }
      // If value is empty, we omit the line (remove the default)
      continue
    }

    result.push(line)
  }

  // If we were in the target section at end of file and didn't find default
  if (inTargetSection && !foundDefault && !insertedDefault && value !== '') {
    result.push(formatDefaultLine(value))
  }

  // If we didn't find the section at all, add it
  if (!insertedDefault && value !== '') {
    // Check if there's a [vars] section
    const varsSection = lines.findIndex(l => /^\s*\[vars\]/.test(l))
    if (varsSection !== -1) {
      // Find the end of the vars section (next top-level section)
      let insertPos = result.length
      for (let i = varsSection + 1; i < result.length; i++) {
        if (/^\s*\[(?!vars\.)/.test(result[i])) {
          insertPos = i
          break
        }
      }
      // Insert the new var section before the next section
      result.splice(insertPos, 0, '', `[vars.${varName}]`, formatDefaultLine(value))
    } else {
      // No [vars] section - add one
      const stepsIndex = result.findIndex(l => /^\s*\[\[steps\]\]/.test(l))
      if (stepsIndex !== -1) {
        // Insert before [[steps]]
        result.splice(stepsIndex, 0, '', `[vars.${varName}]`, formatDefaultLine(value), '')
      } else {
        // Append at the end
        result.push('', `[vars.${varName}]`, formatDefaultLine(value))
      }
    }
  }

  return result.join('\n')
}

/**
 * Formats a default value line with proper TOML quoting.
 */
function formatDefaultLine(value: string): string {
  // Check if value looks like a number or boolean
  if (value === 'true' || value === 'false') {
    return `default = ${value}`
  }
  if (/^-?\d+$/.test(value)) {
    return `default = ${value}`
  }
  // String value - use double quotes
  const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return `default = "${escaped}"`
}

/**
 * Updates multiple variable defaults at once.
 *
 * @param toml - The current TOML content
 * @param values - Record of variable name -> new value
 * @returns The updated TOML content
 */
export function updateVarDefaults(toml: string, values: Record<string, string>): string {
  let result = toml
  for (const [varName, value] of Object.entries(values)) {
    result = updateVarDefault(result, varName, value)
  }
  return result
}
