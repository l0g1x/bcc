import type { CSSProperties, ReactNode } from 'react'

interface SidebarProps {
  children?: ReactNode
  collapsed?: boolean
  onToggleCollapse?: () => void
}

const sidebarStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: '#252526',
  borderRight: '1px solid #3c3c3c',
}

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 12px',
  borderBottom: '1px solid #3c3c3c',
  minHeight: '36px',
}

const toggleButtonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#cccccc',
  cursor: 'pointer',
  padding: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '3px',
}

const contentStyle: CSSProperties = {
  flex: 1,
  overflow: 'auto',
  padding: '8px',
}

const collapsedContentStyle: CSSProperties = {
  ...contentStyle,
  padding: '8px 4px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}

export function Sidebar({ children, collapsed = false, onToggleCollapse }: SidebarProps) {
  return (
    <div style={sidebarStyle}>
      <div style={headerStyle}>
        {!collapsed && (
          <span style={{ color: '#cccccc', fontSize: '11px', textTransform: 'uppercase' }}>
            Explorer
          </span>
        )}
        <button
          type="button"
          style={toggleButtonStyle}
          onClick={onToggleCollapse}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3c3c3c'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
          }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M6 3l5 5-5 5"
                stroke="#cccccc"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M10 3l-5 5 5 5"
                stroke="#cccccc"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>
      <div style={collapsed ? collapsedContentStyle : contentStyle}>{children}</div>
    </div>
  )
}
