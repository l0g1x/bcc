import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { AppShell, FormulaTree } from '../components/layout'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <>
      <AppShell
        sidebarContent={<FormulaTree />}
        mainContent={<Outlet />}
        detailContent={
          <div style={{ padding: '16px', color: '#858585' }}>
            Bead detail will appear here
          </div>
        }
      />
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </>
  )
}
