import type { FormulaVariable } from '@beads-ide/shared'
/**
 * Variables panel for formula editing.
 * Renders each formula variable (VarDef) as a structured form field.
 * Changes to variable values in the form update the TOML source.
 */
import { type CSSProperties, type ChangeEvent, useCallback } from 'react'

/** Props for the vars panel component */
export interface VarsPanelProps {
  /** Variable definitions from the formula */
  vars: Record<string, FormulaVariable>
  /** Current variable values */
  values: Record<string, string>
  /** Callback when a variable value changes */
  onValueChange: (key: string, value: string) => void
  /** List of unbound required variables (for highlighting) */
  unboundVars?: string[]
}

/** Props for individual variable field */
interface VarFieldProps {
  /** Variable name/key */
  name: string
  /** Variable definition */
  def: FormulaVariable
  /** Current value */
  value: string
  /** Callback when value changes */
  onChange: (value: string) => void
  /** Whether this variable is unbound (required but not provided) */
  isUnbound: boolean
}

const panelStyle: CSSProperties = {
  backgroundColor: '#1e293b',
  borderRadius: '6px',
  border: '1px solid #334155',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
}

const headerStyle: CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#94a3b8',
  marginBottom: '4px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
}

const fieldContainerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
}

const labelRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '8px',
}

const labelStyle: CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '13px',
  color: '#a5b4fc',
  fontWeight: 500,
}

const requiredAsteriskStyle: CSSProperties = {
  color: '#f87171',
  fontSize: '14px',
  fontWeight: 700,
}

const descriptionStyle: CSSProperties = {
  fontSize: '12px',
  color: '#9ca3af',
  marginTop: '2px',
}

const defaultHintStyle: CSSProperties = {
  fontSize: '11px',
  color: '#6b7280',
  fontFamily: 'monospace',
  marginTop: '2px',
}

const baseInputStyle: CSSProperties = {
  backgroundColor: '#111827',
  border: '1px solid #374151',
  borderRadius: '4px',
  padding: '8px 10px',
  color: '#e5e7eb',
  fontSize: '13px',
  fontFamily: 'monospace',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const unboundInputStyle: CSSProperties = {
  ...baseInputStyle,
  border: '1px solid #dc2626',
  backgroundColor: '#1f1315',
}

const selectStyle: CSSProperties = {
  ...baseInputStyle,
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
  paddingRight: '32px',
}

const checkboxContainerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '8px 0',
}

const checkboxStyle: CSSProperties = {
  width: '18px',
  height: '18px',
  accentColor: '#6366f1',
  cursor: 'pointer',
}

const emptyStateStyle: CSSProperties = {
  fontSize: '13px',
  color: '#6b7280',
  fontStyle: 'italic',
}

/**
 * Renders a single variable field with appropriate input type.
 */
function VarField({ name, def, value, onChange, isUnbound }: VarFieldProps) {
  const handleTextChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      onChange(e.target.value)
    },
    [onChange]
  )

  const handleCheckboxChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.checked ? 'true' : 'false')
    },
    [onChange]
  )

  const inputStyle = isUnbound ? unboundInputStyle : baseInputStyle
  const unboundSelectStyle = isUnbound
    ? { ...selectStyle, border: '1px solid #dc2626', backgroundColor: '#1f1315' }
    : selectStyle

  let inputElement: React.ReactNode

  if (def.enum && def.enum.length > 0) {
    inputElement = (
      <select
        value={value}
        onChange={handleTextChange}
        style={unboundSelectStyle}
        aria-label={name}
      >
        <option value="">-- Select --</option>
        {def.enum.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    )
  } else if (def.type === 'bool') {
    const isChecked = value === 'true'
    inputElement = (
      <div style={checkboxContainerStyle}>
        <input
          type="checkbox"
          checked={isChecked}
          onChange={handleCheckboxChange}
          style={checkboxStyle}
          aria-label={name}
          id={`var-${name}`}
        />
        <label
          htmlFor={`var-${name}`}
          style={{ color: '#9ca3af', fontSize: '13px', cursor: 'pointer' }}
        >
          {isChecked ? 'true' : 'false'}
        </label>
      </div>
    )
  } else {
    const inputType = def.type === 'int' ? 'number' : 'text'
    inputElement = (
      <input
        type={inputType}
        value={value}
        onChange={handleTextChange}
        placeholder={def.default || `Enter ${name}...`}
        style={inputStyle}
        aria-label={name}
      />
    )
  }

  return (
    <div style={fieldContainerStyle}>
      <div style={labelRowStyle}>
        <span style={{ ...labelStyle, color: isUnbound ? '#fca5a5' : '#a5b4fc' }}>{name}</span>
        {def.required && <span style={requiredAsteriskStyle}>*</span>}
      </div>
      {def.description && <div style={descriptionStyle}>{def.description}</div>}
      {inputElement}
      {def.default !== undefined && !def.enum && def.type !== 'bool' && (
        <div style={defaultHintStyle}>Default: {def.default}</div>
      )}
    </div>
  )
}

/**
 * Variables panel that renders form fields for each formula variable.
 * Supports text inputs, dropdowns (for enum), and checkboxes (for bool).
 */
export function VarsPanel({ vars, values, onValueChange, unboundVars = [] }: VarsPanelProps) {
  const entries = Object.entries(vars)

  if (entries.length === 0) {
    return (
      <div style={panelStyle}>
        <div style={headerStyle}>
          <span>Variables</span>
        </div>
        <div style={emptyStateStyle}>No variables defined</div>
      </div>
    )
  }

  const unboundSet = new Set(unboundVars)

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span>Variables</span>
        <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 400 }}>
          ({entries.length})
        </span>
      </div>
      {entries.map(([key, def]) => (
        <VarField
          key={key}
          name={key}
          def={def}
          value={values[key] ?? ''}
          onChange={(newValue) => onValueChange(key, newValue)}
          isUnbound={unboundSet.has(key)}
        />
      ))}
    </div>
  )
}
