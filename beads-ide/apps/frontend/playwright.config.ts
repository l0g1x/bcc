import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E Test Configuration for Beads IDE
 *
 * Tests run against the frontend dev server with mocked CLI responses.
 * All tests must complete in <60s total.
 */
// biome-ignore lint/style/noDefaultExport: Playwright config requires default export
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['html'], ['junit', { outputFile: 'test-results/e2e-junit.xml' }]]
    : 'html',
  // Strict 60s total timeout for all tests
  globalTimeout: 60_000,
  // Per-test timeout (generous for individual tests)
  timeout: 15_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
