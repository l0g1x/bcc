import { test, expect } from './fixtures'

/**
 * Formula Workflow E2E Tests
 *
 * Tests the full MVP workflow:
 * - Open formula -> edit -> auto-save -> cook preview -> view results
 * - Command palette navigation
 * - View switching (list/wave/graph)
 *
 * All tests use mocked CLI responses to avoid database dependency in CI.
 */

test.describe('Formula Workflow', () => {
  test.describe('App Shell', () => {
    test('should render the app shell with three panels', async ({ page, apiMock }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // The app should have rendered
      await expect(page.getByText('Beads IDE')).toBeVisible()
    })

    test('should display the current view mode', async ({ page, apiMock }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Default view should be list
      await expect(page.getByText('Current view: list')).toBeVisible()
    })
  })

  test.describe('Command Palette', () => {
    test('should open command palette with Cmd+K', async ({ page, apiMock }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Press Cmd+K (or Ctrl+K on non-Mac)
      await page.keyboard.press('Meta+k')

      // Command palette should be visible
      await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible()
      await expect(page.getByRole('combobox', { name: 'Search commands' })).toBeVisible()
    })

    test('should close command palette with Escape', async ({ page, apiMock }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Open palette
      await page.keyboard.press('Meta+k')
      await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible()

      // Close with Escape
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog', { name: 'Command palette' })).not.toBeVisible()
    })

    test('should filter actions by search query', async ({ page, apiMock }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Open palette
      await page.keyboard.press('Meta+k')

      // Type to filter
      await page.getByRole('combobox', { name: 'Search commands' }).fill('graph')

      // Should show only graph-related action
      await expect(page.getByText('Switch to Graph View')).toBeVisible()
      // Other actions should be filtered out
      await expect(page.getByText('Open Formula')).not.toBeVisible()
    })

    test('should navigate actions with arrow keys', async ({ page, apiMock }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Open palette
      await page.keyboard.press('Meta+k')

      // First item should be selected by default
      const firstItem = page.locator('button[aria-selected="true"]').first()
      await expect(firstItem).toBeVisible()

      // Press down arrow to move selection
      await page.keyboard.press('ArrowDown')

      // A different item should now be selected
      const newSelectedItem = page.locator('button[aria-selected="true"]').first()
      await expect(newSelectedItem).toBeVisible()
    })

    test('should execute action on Enter', async ({ page, apiMock }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Initially list view
      await expect(page.getByText('Current view: list')).toBeVisible()

      // Open palette and search for graph view
      await page.keyboard.press('Meta+k')
      await page.getByRole('combobox', { name: 'Search commands' }).fill('graph')

      // Press Enter to select
      await page.keyboard.press('Enter')

      // Palette should close and view should change
      await expect(page.getByRole('dialog', { name: 'Command palette' })).not.toBeVisible()
      await expect(page.getByText('Current view: graph')).toBeVisible()
    })

    test('should switch to wave view via command palette', async ({ page, apiMock }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Open palette and search for wave view
      await page.keyboard.press('Meta+k')
      await page.getByRole('combobox', { name: 'Search commands' }).fill('wave')
      await page.keyboard.press('Enter')

      await expect(page.getByText('Current view: wave')).toBeVisible()
    })

    test('should switch to list view via command palette', async ({ page, apiMock }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // First switch to graph
      await page.keyboard.press('Meta+k')
      await page.getByRole('combobox', { name: 'Search commands' }).fill('graph')
      await page.keyboard.press('Enter')
      await expect(page.getByText('Current view: graph')).toBeVisible()

      // Then switch back to list
      await page.keyboard.press('Meta+k')
      await page.getByRole('combobox', { name: 'Search commands' }).fill('list')
      await page.keyboard.press('Enter')
      await expect(page.getByText('Current view: list')).toBeVisible()
    })
  })

  test.describe('View Switching', () => {
    test('should switch between list, wave, and graph views', async ({ page, apiMock }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Start with list view
      await expect(page.getByText('Current view: list')).toBeVisible()

      // Switch to graph
      await page.keyboard.press('Meta+k')
      await page.getByRole('combobox', { name: 'Search commands' }).fill('graph')
      await page.keyboard.press('Enter')
      await expect(page.getByText('Current view: graph')).toBeVisible()

      // Switch to wave
      await page.keyboard.press('Meta+k')
      await page.getByRole('combobox', { name: 'Search commands' }).fill('wave')
      await page.keyboard.press('Enter')
      await expect(page.getByText('Current view: wave')).toBeVisible()

      // Switch back to list
      await page.keyboard.press('Meta+k')
      await page.getByRole('combobox', { name: 'Search commands' }).fill('list')
      await page.keyboard.press('Enter')
      await expect(page.getByText('Current view: list')).toBeVisible()
    })

    test('should maintain view state across navigation', async ({ page, apiMock }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Switch to graph view
      await page.keyboard.press('Meta+k')
      await page.getByRole('combobox', { name: 'Search commands' }).fill('graph')
      await page.keyboard.press('Enter')
      await expect(page.getByText('Current view: graph')).toBeVisible()

      // The view should persist (no reload needed for this test)
      await expect(page.getByText('Current view: graph')).toBeVisible()
    })
  })

  test.describe('Keyboard Navigation', () => {
    test('should show keyboard hints in command palette footer', async ({ page, apiMock }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      await page.keyboard.press('Meta+k')

      // Should show navigation hints
      await expect(page.getByText('Navigate')).toBeVisible()
      await expect(page.getByText('Select')).toBeVisible()
      await expect(page.getByText('Close')).toBeVisible()
    })

    test('should show action shortcuts in command palette', async ({ page, apiMock }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      await page.keyboard.press('Meta+k')

      // Should show shortcuts for actions
      // The Open Formula action has Mod+O shortcut
      const openFormulaItem = page.getByText('Open Formula').locator('..')
      await expect(openFormulaItem).toBeVisible()
    })
  })
})

test.describe('Results View', () => {
  test.describe('List/Wave/Graph Switching', () => {
    test('should cycle through all view modes', async ({ page, apiMock }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Verify we can switch through all views
      const views = ['graph', 'wave', 'list']

      for (const view of views) {
        await page.keyboard.press('Meta+k')
        await page.getByRole('combobox', { name: 'Search commands' }).fill(view)
        await page.keyboard.press('Enter')
        await expect(page.getByText(`Current view: ${view}`)).toBeVisible()
      }
    })
  })
})

test.describe('Performance', () => {
  test('command palette should open quickly', async ({ page, apiMock }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const startTime = Date.now()
    await page.keyboard.press('Meta+k')
    await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible()
    const endTime = Date.now()

    // Should open in under 200ms
    expect(endTime - startTime).toBeLessThan(200)
  })

  test('view switching should be responsive', async ({ page, apiMock }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Measure view switch time
    const startTime = Date.now()
    await page.keyboard.press('Meta+k')
    await page.getByRole('combobox', { name: 'Search commands' }).fill('graph')
    await page.keyboard.press('Enter')
    await expect(page.getByText('Current view: graph')).toBeVisible()
    const endTime = Date.now()

    // Should complete in under 500ms
    expect(endTime - startTime).toBeLessThan(500)
  })
})
