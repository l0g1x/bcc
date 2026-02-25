import { type CSSProperties, useCallback, useEffect, useState } from 'react'
import { useWorkspaceConfig } from '../../hooks'
import { apiFetch, apiPost } from '../../lib'
import { DirectoryBrowser } from './directory-browser'
import { NewProjectModal } from './new-project-modal'

export interface WelcomePanelProps {
  onWorkspaceOpened?: () => void
}

const containerStyle: CSSProperties = {
  display: 'flex',
  height: '100%',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#0f172a',
  color: '#e2e8f0',
}

const innerStyle: CSSProperties = {
  textAlign: 'center',
  maxWidth: '440px',
  width: '100%',
  padding: '24px',
}

const titleStyle: CSSProperties = {
  fontSize: '24px',
  fontWeight: 700,
  color: '#38bdf8',
  margin: 0,
}

const subtitleStyle: CSSProperties = {
  fontSize: '14px',
  color: '#cbd5e1',
  marginTop: '12px',
}

const buttonRowStyle: CSSProperties = {
  display: 'flex',
  gap: '12px',
  justifyContent: 'center',
  marginTop: '24px',
}

const primaryBtnStyle: CSSProperties = {
  padding: '10px 24px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  border: 'none',
  backgroundColor: '#38bdf8',
  color: '#0f172a',
}

const secondaryBtnStyle: CSSProperties = {
  padding: '10px 24px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  border: '1px solid #38bdf8',
  backgroundColor: 'transparent',
  color: '#38bdf8',
}

const recentSectionStyle: CSSProperties = {
  marginTop: '32px',
  textAlign: 'left',
}

const recentTitleStyle: CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '8px',
}

const recentItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '13px',
  color: '#e2e8f0',
  height: '36px',
  border: 'none',
  background: 'none',
  width: '100%',
  textAlign: 'left',
}

const invalidItemStyle: CSSProperties = {
  ...recentItemStyle,
  color: '#94a3b8',
  cursor: 'not-allowed',
}

function FolderIcon({ color = '#e2a52e' }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill={color} aria-hidden="true">
      <path d="M1.5 2A1.5 1.5 0 000 3.5v9A1.5 1.5 0 001.5 14h13a1.5 1.5 0 001.5-1.5V5a1.5 1.5 0 00-1.5-1.5H7.71l-1.5-1.2A1.5 1.5 0 005.26 2H1.5z" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="#ef4444" aria-hidden="true">
      <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a1 1 0 011 1v4a1 1 0 01-2 0V4a1 1 0 011-1zm0 8a1 1 0 100-2 1 1 0 000 2z" />
    </svg>
  )
}

function abbreviatePath(path: string): string {
  const home = '/home/'
  if (path.startsWith(home)) {
    const rest = path.slice(home.length)
    const slashIdx = rest.indexOf('/')
    if (slashIdx !== -1) {
      return `~${rest.slice(slashIdx)}`
    }
    return '~'
  }
  return path
}

interface RecentItemData {
  path: string
  valid: boolean
}

function RecentList({
  recentRoots,
  onSelect,
}: {
  recentRoots: string[]
  onSelect: (path: string) => void
}) {
  const [items, setItems] = useState<RecentItemData[]>(
    recentRoots.map((p) => ({ path: p, valid: true }))
  )

  useEffect(() => {
    async function validate() {
      const results = await Promise.all(
        recentRoots.map(async (path) => {
          const { error } = await apiFetch<{ ok: true }>(
            `/api/browse?path=${encodeURIComponent(path)}`
          )
          return { path, valid: !error }
        })
      )
      setItems(results)
    }
    if (recentRoots.length > 0) validate()
  }, [recentRoots])

  if (recentRoots.length === 0) return null

  return (
    <div style={recentSectionStyle}>
      <div style={recentTitleStyle}>Recent</div>
      {items.map((item) =>
        item.valid ? (
          <button
            key={item.path}
            type="button"
            style={recentItemStyle}
            onClick={() => onSelect(item.path)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2a2d2e'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
            title={item.path}
          >
            <FolderIcon />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {abbreviatePath(item.path)}
            </span>
          </button>
        ) : (
          <div key={item.path} style={invalidItemStyle} title={`${item.path} (not found)`}>
            <WarningIcon />
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textDecoration: 'line-through',
              }}
            >
              {abbreviatePath(item.path)}
            </span>
          </div>
        )
      )}
    </div>
  )
}

export function WelcomePanel({ onWorkspaceOpened }: WelcomePanelProps) {
  const { config, setRootPath, addRecentRoot } = useWorkspaceConfig()
  const [showBrowser, setShowBrowser] = useState(false)
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectPath, setNewProjectPath] = useState('')
  const [browserMode, setBrowserMode] = useState<'open' | 'new'>('open')

  const handleOpenFolder = useCallback(() => {
    setBrowserMode('open')
    setShowBrowser(true)
  }, [])

  const handleNewProject = useCallback(() => {
    setBrowserMode('new')
    setShowBrowser(true)
  }, [])

  const handleFolderSelected = useCallback(
    async (path: string) => {
      setShowBrowser(false)
      if (browserMode === 'new') {
        setNewProjectPath(path)
        setShowNewProject(true)
        return
      }
      const { error } = await apiPost<
        { ok: true; root: string; formulaCount: number },
        { path: string }
      >('/api/workspace/open', { path })
      if (!error) {
        setRootPath(path)
        addRecentRoot(path)
        onWorkspaceOpened?.()
      }
    },
    [browserMode, setRootPath, addRecentRoot, onWorkspaceOpened]
  )

  const handleNewProjectComplete = useCallback(async () => {
    setShowNewProject(false)
    // After init, open the workspace
    const { error } = await apiPost<
      { ok: true; root: string; formulaCount: number },
      { path: string }
    >('/api/workspace/open', { path: newProjectPath })
    if (!error) {
      setRootPath(newProjectPath)
      addRecentRoot(newProjectPath)
      onWorkspaceOpened?.()
    }
  }, [newProjectPath, setRootPath, addRecentRoot, onWorkspaceOpened])

  const handleRecentSelect = useCallback(
    async (path: string) => {
      const { error } = await apiPost<
        { ok: true; root: string; formulaCount: number },
        { path: string }
      >('/api/workspace/open', { path })
      if (!error) {
        setRootPath(path)
        addRecentRoot(path)
        onWorkspaceOpened?.()
      }
    },
    [setRootPath, addRecentRoot, onWorkspaceOpened]
  )

  return (
    <div style={containerStyle}>
      <div style={innerStyle}>
        <h1 style={titleStyle}>Beads IDE</h1>
        <p style={subtitleStyle}>Open a folder to get started.</p>

        <div style={buttonRowStyle}>
          <button type="button" style={primaryBtnStyle} onClick={handleOpenFolder}>
            Open Folder
          </button>
          <button type="button" style={secondaryBtnStyle} onClick={handleNewProject}>
            New Project
          </button>
        </div>

        <RecentList recentRoots={config.recentRoots} onSelect={handleRecentSelect} />
      </div>

      <DirectoryBrowser
        isOpen={showBrowser}
        onSelect={handleFolderSelected}
        onCancel={() => setShowBrowser(false)}
      />

      <NewProjectModal
        isOpen={showNewProject}
        selectedPath={newProjectPath}
        onComplete={handleNewProjectComplete}
        onCancel={() => setShowNewProject(false)}
      />
    </div>
  )
}
