import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
          Beads IDE
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          Visual formula editor for beads workflows
        </p>
      </div>
    </div>
  )
}
