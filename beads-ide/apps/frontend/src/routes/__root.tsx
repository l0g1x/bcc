import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Toaster } from 'sonner'
import { AppShell, FormulaTree } from '../components/layout'
import { GenericErrorPage, OfflineBanner } from '../components/ui'

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

function RootLayout() {
  return (
    <ErrorBoundary>
      <OfflineBanner />
      <AppShell
        sidebarContent={<FormulaTree />}
        mainContent={<Outlet />}
        detailContent={
          <div style={{ padding: '16px', color: '#858585' }}>Bead detail will appear here</div>
        }
      />
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
    </ErrorBoundary>
  )
}
