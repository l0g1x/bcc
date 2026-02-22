/**
 * Formula tree component for the sidebar.
 * Displays formulas grouped by search path directory.
 */
import { useState, useMemo, type CSSProperties } from 'react';
import type { Formula } from '@beads-ide/shared';
import { useFormulas } from '../../hooks';

// Styles
const treeContainerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const groupStyle: CSSProperties = {
  marginBottom: '8px',
};

const groupHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 8px',
  cursor: 'pointer',
  borderRadius: '3px',
  fontSize: '11px',
  color: '#cccccc',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  userSelect: 'none',
  background: 'none',
  border: 'none',
  width: '100%',
  textAlign: 'left',
};

const groupHeaderHoverStyle: CSSProperties = {
  ...groupHeaderStyle,
  backgroundColor: '#2a2d2e',
};

const groupItemsStyle: CSSProperties = {
  paddingLeft: '12px',
};

const itemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 8px',
  cursor: 'pointer',
  borderRadius: '3px',
  fontSize: '13px',
  color: '#cccccc',
  background: 'none',
  border: 'none',
  width: '100%',
  textAlign: 'left',
};

const itemHoverStyle: CSSProperties = {
  ...itemStyle,
  backgroundColor: '#2a2d2e',
};

const itemActiveStyle: CSSProperties = {
  ...itemStyle,
  backgroundColor: '#094771',
  color: '#ffffff',
};

const iconStyle: CSSProperties = {
  width: '16px',
  height: '16px',
  flexShrink: 0,
};

const skeletonStyle: CSSProperties = {
  height: '24px',
  backgroundColor: '#3c3c3c',
  borderRadius: '3px',
  marginBottom: '4px',
  animation: 'pulse 1.5s ease-in-out infinite',
};

const emptyStateStyle: CSSProperties = {
  padding: '16px',
  textAlign: 'center',
  color: '#858585',
  fontSize: '12px',
};

const emptyStateHeadingStyle: CSSProperties = {
  fontSize: '14px',
  color: '#cccccc',
  marginBottom: '12px',
};

const searchPathListStyle: CSSProperties = {
  textAlign: 'left',
  fontSize: '11px',
  fontFamily: 'monospace',
  backgroundColor: '#1e1e1e',
  padding: '8px',
  borderRadius: '4px',
  marginTop: '12px',
};

const searchPathItemStyle: CSSProperties = {
  padding: '2px 0',
  color: '#569cd6',
};

const errorStyle: CSSProperties = {
  padding: '12px',
  color: '#f48771',
  fontSize: '12px',
  backgroundColor: '#3c1f1e',
  borderRadius: '4px',
  margin: '8px',
};

// SVG Icons (Lucide-style) - marked as decorative with aria-hidden
function FolderIcon({ expanded }: { expanded: boolean }) {
  if (expanded) {
    return (
      <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        <path d="M2 10h20" />
      </svg>
    );
  }
  return (
    <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function FileCodeIcon() {
  return (
    <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="m10 13-2 2 2 2" />
      <path d="m14 17 2-2-2-2" />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      style={{
        ...iconStyle,
        transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
        transition: 'transform 0.15s ease',
      }}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

// Group formulas by search path label
interface FormulaGroup {
  label: string;
  searchPath: string;
  formulas: Formula[];
}

function groupFormulas(formulas: Formula[]): FormulaGroup[] {
  const groups = new Map<string, FormulaGroup>();

  for (const formula of formulas) {
    const key = formula.searchPath;
    let group = groups.get(key);
    if (!group) {
      group = {
        label: formula.searchPathLabel,
        searchPath: formula.searchPath,
        formulas: [],
      };
      groups.set(key, group);
    }
    group.formulas.push(formula);
  }

  // Convert to array and sort groups by label
  return Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label));
}

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div style={treeContainerStyle}>
      <style>
        {`@keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }`}
      </style>
      <div style={{ ...skeletonStyle, width: '60%' }} />
      <div style={{ ...skeletonStyle, width: '80%', marginLeft: '12px' }} />
      <div style={{ ...skeletonStyle, width: '70%', marginLeft: '12px' }} />
      <div style={{ ...skeletonStyle, width: '65%', marginTop: '8px' }} />
      <div style={{ ...skeletonStyle, width: '75%', marginLeft: '12px' }} />
    </div>
  );
}

// Empty state component
function EmptyState({ searchPaths }: { searchPaths: string[] }) {
  return (
    <div style={emptyStateStyle}>
      <div style={emptyStateHeadingStyle}>Create your first formula</div>
      <p>
        No formulas found. Place a <code>.formula.toml</code> file in one of these directories:
      </p>
      <div style={searchPathListStyle}>
        {searchPaths.length > 0 ? (
          searchPaths.map((path) => (
            <div key={path} style={searchPathItemStyle}>
              {path}
            </div>
          ))
        ) : (
          <>
            <div style={searchPathItemStyle}>formulas/</div>
            <div style={searchPathItemStyle}>.beads/formulas/</div>
            <div style={searchPathItemStyle}>~/.beads/formulas/</div>
            <div style={searchPathItemStyle}>$GT_ROOT/.beads/formulas/</div>
          </>
        )}
      </div>
    </div>
  );
}

// Formula group component
interface FormulaGroupProps {
  group: FormulaGroup;
  selectedFormula: string | null;
  onSelectFormula: (name: string) => void;
}

function FormulaGroupSection({ group, selectedFormula, onSelectFormula }: FormulaGroupProps) {
  const [expanded, setExpanded] = useState(true);
  const [headerHovered, setHeaderHovered] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <div style={groupStyle}>
      <button
        type="button"
        style={headerHovered ? groupHeaderHoverStyle : groupHeaderStyle}
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={() => setHeaderHovered(true)}
        onMouseLeave={() => setHeaderHovered(false)}
        aria-expanded={expanded}
        aria-label={`${group.label}, ${group.formulas.length} formulas`}
      >
        <ChevronIcon expanded={expanded} />
        <FolderIcon expanded={expanded} />
        <span>{group.label}</span>
        <span style={{ color: '#858585', marginLeft: 'auto' }}>{group.formulas.length}</span>
      </button>

      {expanded && (
        <div style={groupItemsStyle}>
          {group.formulas.map((formula) => {
            const isSelected = selectedFormula === formula.name;
            const isHovered = hoveredItem === formula.name;

            let style = itemStyle;
            if (isSelected) {
              style = itemActiveStyle;
            } else if (isHovered) {
              style = itemHoverStyle;
            }

            return (
              <button
                type="button"
                key={formula.path}
                style={style}
                onClick={() => onSelectFormula(formula.name)}
                onMouseEnter={() => setHoveredItem(formula.name)}
                onMouseLeave={() => setHoveredItem(null)}
                aria-pressed={isSelected}
                aria-label={`Formula: ${formula.name}`}
              >
                <FileCodeIcon />
                <span>{formula.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Main component
export interface FormulaTreeProps {
  /** Currently selected formula name */
  selectedFormula?: string | null;
  /** Callback when a formula is selected */
  onSelectFormula?: (name: string) => void;
}

export function FormulaTree({ selectedFormula = null, onSelectFormula }: FormulaTreeProps) {
  const { formulas, isLoading, error, searchPaths } = useFormulas();

  const groups = useMemo(() => groupFormulas(formulas), [formulas]);

  const handleSelectFormula = (name: string) => {
    if (onSelectFormula) {
      onSelectFormula(name);
    }
    // Navigation to /formula/:name will be wired when router is fully integrated
    // For now, update URL directly for deep linking
    window.history.pushState({}, '', `/formula/${encodeURIComponent(name)}`);
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div style={errorStyle}>
        <strong>Failed to load formulas</strong>
        <br />
        {error.message}
      </div>
    );
  }

  if (formulas.length === 0) {
    return <EmptyState searchPaths={searchPaths} />;
  }

  return (
    <div style={treeContainerStyle}>
      {groups.map((group) => (
        <FormulaGroupSection
          key={group.searchPath}
          group={group}
          selectedFormula={selectedFormula}
          onSelectFormula={handleSelectFormula}
        />
      ))}
    </div>
  );
}
