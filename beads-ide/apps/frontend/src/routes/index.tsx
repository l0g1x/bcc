import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect } from 'react'
import { WelcomePanel } from '../components/layout'
import { useWorkspaceConfig } from '../hooks'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  const { config } = useWorkspaceConfig()

  useEffect(() => {
    document.title = 'Beads IDE'
  }, [])

  const handleWorkspaceOpened = useCallback(() => {
    // Force re-render by dispatching popstate
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, [])

  if (!config.rootPath) {
    return <WelcomePanel onWorkspaceOpened={handleWorkspaceOpened} />
  }

  return (
    <div className="flex h-full items-center justify-center bg-zinc-950 text-zinc-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-brand-400">Beads IDE</h1>
        <p className="mt-4 text-zinc-400">Formula editor and molecule visualizer</p>
        <p className="mt-8 text-sm text-zinc-500">
          Select a formula from the sidebar to get started
        </p>
      </div>
    </div>
  )
}
