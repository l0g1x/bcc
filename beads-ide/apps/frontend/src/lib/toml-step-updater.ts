/**
 * TOML updater for step fields.
 * Updates fields in [[steps]] sections when the user edits them in the StepEditorPanel.
 */

/**
 * Updates a field for a specific step in a TOML string.
 * Handles string, number, and array values.
 *
 * @param toml - The current TOML content
 * @param stepId - The step ID to update
 * @param field - The field name to update (e.g., 'title', 'description', 'priority', 'needs')
 * @param value - The new value (string, number, or string array)
 * @returns The updated TOML content
 */
export function updateStepField(
  toml: string,
  stepId: string,
  field: string,
  value: string | number | string[]
): string {
  const lines = toml.split('\n')
  const result: string[] = []

  // State for tracking which [[steps]] section we're in
  let inStepsSection = false
  let inTargetStep = false
  let foundField = false
  let insertedField = false
  let currentStepId: string | null = null

  // Regex patterns
  const stepsHeaderRegex = /^\s*\[\[steps\]\]\s*$/
  const nextSectionRegex = /^\s*\[/
  const idRegex = /^\s*id\s*=\s*["']([^"']+)["']/
  const fieldRegex = new RegExp(`^\\s*${field}\\s*=`)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Check for [[steps]] header
    if (stepsHeaderRegex.test(line)) {
      // If we were in the target step and didn't find/insert the field, do it now
      if (inTargetStep && !foundField && !insertedField) {
        result.push(formatFieldLine(field, value))
        insertedField = true
      }

      inStepsSection = true
      inTargetStep = false
      currentStepId = null
      foundField = false
      result.push(line)
      continue
    }

    // Check for next section (non-steps)
    if (nextSectionRegex.test(line) && !stepsHeaderRegex.test(line)) {
      // If we were in the target step and didn't find/insert the field, do it now
      if (inTargetStep && !foundField && !insertedField) {
        result.push(formatFieldLine(field, value))
        insertedField = true
      }

      inStepsSection = false
      inTargetStep = false
      currentStepId = null
      result.push(line)
      continue
    }

    // If in a steps section, check for id line
    if (inStepsSection) {
      const idMatch = line.match(idRegex)
      if (idMatch) {
        currentStepId = idMatch[1]
        inTargetStep = currentStepId === stepId
        foundField = false
        result.push(line)
        continue
      }
    }

    // If in the target step, check for the field we want to update
    if (inTargetStep && fieldRegex.test(line)) {
      foundField = true
      insertedField = true
      // Replace the field with new value (or omit if empty array)
      if (Array.isArray(value) && value.length === 0) {
        // Skip this line to remove empty arrays
        continue
      }
      result.push(formatFieldLine(field, value))
      continue
    }

    result.push(line)
  }

  // If we ended while in the target step and didn't find/insert the field
  if (inTargetStep && !foundField && !insertedField) {
    // Don't add empty arrays
    if (!(Array.isArray(value) && value.length === 0)) {
      result.push(formatFieldLine(field, value))
    }
  }

  return result.join('\n')
}

/**
 * Formats a field line with proper TOML syntax.
 */
function formatFieldLine(field: string, value: string | number | string[]): string {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return `${field} = []`
    }
    const quotedItems = value.map((v) => `"${escapeString(v)}"`)
    return `${field} = [${quotedItems.join(', ')}]`
  }

  if (typeof value === 'number') {
    return `${field} = ${value}`
  }

  // String value - handle multiline
  if (value.includes('\n')) {
    return `${field} = """\n${value}\n"""`
  }

  return `${field} = "${escapeString(value)}"`
}

/**
 * Escapes special characters in a string for TOML.
 */
function escapeString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

/**
 * Extracts all step IDs from a TOML string.
 * Used to populate the dependency dropdown.
 *
 * @param toml - The TOML content
 * @returns Array of step IDs
 */
export function extractStepIds(toml: string): string[] {
  const stepIds: string[] = []
  const lines = toml.split('\n')

  const idRegex = /^\s*id\s*=\s*["']([^"']+)["']/

  let inStepsSection = false
  const stepsHeaderRegex = /^\s*\[\[steps\]\]\s*$/
  const nextSectionRegex = /^\s*\[/

  for (const line of lines) {
    if (stepsHeaderRegex.test(line)) {
      inStepsSection = true
      continue
    }

    if (nextSectionRegex.test(line) && !stepsHeaderRegex.test(line)) {
      inStepsSection = false
      continue
    }

    if (inStepsSection) {
      const match = line.match(idRegex)
      if (match) {
        stepIds.push(match[1])
      }
    }
  }

  return stepIds
}
