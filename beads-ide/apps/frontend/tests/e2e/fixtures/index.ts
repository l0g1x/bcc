/**
 * Test Fixtures for Beads IDE E2E Tests
 *
 * This module provides reusable test fixtures for mocking backend API responses.
 *
 * Usage:
 * ```ts
 * // Import the extended test instead of @playwright/test
 * import { test, expect } from './fixtures'
 *
 * // Use fixtures in your tests
 * test('should display formula list', async ({ page, apiMock }) => {
 *   // apiMock is already set up with default mocks
 *   await page.goto('/')
 *   await expect(page.getByText('test-simple.formula.toml')).toBeVisible()
 * })
 *
 * // Or customize the mocks
 * test('should handle empty formula list', async ({ page, apiMock }) => {
 *   apiMock.setFormulas([])
 *   await page.goto('/')
 *   await expect(page.getByText('No formulas found')).toBeVisible()
 * })
 * ```
 */

export {
  test,
  expect,
  ApiMock,
  TEST_FORMULAS,
  TEST_BEADS,
  type MockBead,
  type MockCookResult,
  type MockProtoStep,
  type MockVarDef,
  type MockFormula,
  type MockFormulaListResponse,
} from './test-fixtures'
