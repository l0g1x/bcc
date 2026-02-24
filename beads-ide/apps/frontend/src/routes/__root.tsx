import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Component, type ErrorInfo, type ReactNode, useCallback, useState } from 'react'
import { Toaster } from 'sonner'
import { BeadDetail } from '../components/beads/bead-detail'
import { AppShell, FormulaTree } from '../components/layout'
import { CommandPalette, useDefaultActions } from '../components/layout/command-palette'
import { GenericErrorPage, OfflineBanner } from '../components/ui'
import { BeadSelectionProvider, useBeadSelection } from '../contexts'
import { useBead, useKeyboardTip } from '../hooks'

type ViewMode = 'list' | 'wave' | 'graph'

/** Props for ErrorBoundary component */
interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

/** State for ErrorBoundary component */
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error boundary to catch React rendering errors.
 * Prevents the app from showing a blank screen on unhandled errors.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details for debugging
    console.error('React Error Boundary caught an error:', error, errorInfo)
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return <GenericErrorPage error={this.state.error} resetErrorBoundary={this.handleReset} />
    }

    return this.props.children
  }
}

export const Route = createRootRoute({
  component: RootLayout,
})

/**
 * Inner layout component that uses bead selection context.
 */
function RootLayoutInner() {
  const { selectedBeadId, clearSelection } = useBeadSelection()
  const { bead, isLoading, error } = useBead(selectedBeadId)
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  // Show one-time keyboard shortcut tip
  useKeyboardTip()

  const handleOpenFormula = useCallback(() => {
    // Navigate to first formula or show formula picker
    console.log('Open Formula triggered')
  }, [])

  const handleCookPreview = useCallback(() => {
    console.log('Cook Preview triggered')
  }, [])

  const handleSling = useCallback(() => {
    console.log('Sling triggered')
  }, [])

  const actions = useDefaultActions({
    onOpenFormula: handleOpenFormula,
    onCookPreview: handleCookPreview,
    onSling: handleSling,
    onSwitchToGraph: () => setViewMode('graph'),
    onSwitchToList: () => setViewMode('list'),
    onSwitchToWave: () => setViewMode('wave'),
  })

  return (
    <>
      <a
        href="#main-content"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 'auto',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          zIndex: 9999,
        }}
        onFocus={(e) => {
          e.currentTarget.style.left = '8px'
          e.currentTarget.style.top = '8px'
          e.currentTarget.style.width = 'auto'
          e.currentTarget.style.height = 'auto'
          e.currentTarget.style.overflow = 'visible'
          e.currentTarget.style.padding = '8px 16px'
          e.currentTarget.style.backgroundColor = '#1e1e1e'
          e.currentTarget.style.color = '#fff'
          e.currentTarget.style.border = '2px solid #007acc'
          e.currentTarget.style.borderRadius = '4px'
          e.currentTarget.style.textDecoration = 'none'
          e.currentTarget.style.fontWeight = '500'
        }}
        onBlur={(e) => {
          e.currentTarget.style.left = '-9999px'
          e.currentTarget.style.top = 'auto'
          e.currentTarget.style.width = '1px'
          e.currentTarget.style.height = '1px'
          e.currentTarget.style.overflow = 'hidden'
        }}
      >
        Skip to main content
      </a>
      <OfflineBanner />
      <AppShell
        sidebarContent={<FormulaTree />}
        mainContent={
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px 16px', borderBottom: '1px solid #333', fontSize: '12px', color: '#888' }}>
              Current view: {viewMode}
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <Outlet />
            </div>
          </div>
        }
        detailContent={
          selectedBeadId ? (
            <div style={{ padding: '16px', color: '#858585' }}>
              {error ? (
                <div style={{ color: '#f87171' }}>Error: {error.message}</div>
              ) : isLoading ? (
                'Loading bead details...'
              ) : (
                'Bead details'
              )}
            </div>
          ) : null
        }
      />
      {/* Bead detail overlay panel */}
      {selectedBeadId && <BeadDetail bead={bead} onClose={clearSelection} isLoading={isLoading} />}
      {/* Global command palette */}
      <CommandPalette actions={actions} placeholder="Search actions..." />
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: '#1f2937',
            border: '1px solid #374151',
            color: '#e5e7eb',
          },
        }}
      />
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </>
  )
}

function RootLayout() {
  return (
    <ErrorBoundary>
      <BeadSelectionProvider>
        <RootLayoutInner />
      </BeadSelectionProvider>
    </ErrorBoundary>
  )
}
