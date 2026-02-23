import { RouterProvider, createRouter } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import { ConnectionGate } from './components/ui'
import { AnnouncementProvider } from './contexts'
import { routeTree } from './routeTree.gen'
import './app.css'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

createRoot(rootElement).render(
  <StrictMode>
    <AnnouncementProvider>
      <ConnectionGate>
        <RouterProvider router={router} />
        <Toaster position="bottom-right" theme="dark" richColors />
      </ConnectionGate>
    </AnnouncementProvider>
  </StrictMode>
)
