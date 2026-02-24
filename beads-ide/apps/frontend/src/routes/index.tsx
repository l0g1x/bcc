import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  useEffect(() => {
    document.title = 'Beads IDE'
  }, [])

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
