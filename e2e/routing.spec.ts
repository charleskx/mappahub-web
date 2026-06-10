import { test, expect } from '@playwright/test'
import { loginAs, OWNER, ADMIN, EMPLOYEE, SUB_ACTIVE, EMPTY_STATS } from './helpers'

// ── Unauthenticated redirects ──────────────────────────────────────────────────

test.describe('Unauthenticated route protection', () => {
  test.beforeEach(async ({ page }) => {
    // No token in localStorage and /auth/me returns 401
    await page.route('**/auth/me', r => r.fulfill({ status: 401, json: {} }))
  })

  const protectedPaths = ['/dashboard', '/partners', '/import', '/export', '/settings', '/team', '/billing', '/pin-types']

  for (const path of protectedPaths) {
    test(`redirects ${path} to /login when unauthenticated`, async ({ page }) => {
      await page.goto(path)
      await expect(page).toHaveURL(/\/login/)
    })
  }
})

// ── Authenticated redirects ────────────────────────────────────────────────────

test.describe('Authenticated route redirects', () => {
  test('redirects /login to /dashboard when already logged in', async ({ page }) => {
    await loginAs(page)
    await page.route('**/dashboard/stats', r => r.fulfill({ json: EMPTY_STATS }))
    await page.goto('/login')
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('redirects /register to /dashboard when already logged in', async ({ page }) => {
    await loginAs(page)
    await page.route('**/dashboard/stats', r => r.fulfill({ json: EMPTY_STATS }))
    await page.goto('/register')
    await expect(page).toHaveURL(/\/dashboard/)
  })
})

// ── Admin-only routes ──────────────────────────────────────────────────────────

test.describe('AdminRoute guard', () => {
  test('employee is redirected from /team to /dashboard', async ({ page }) => {
    await loginAs(page, EMPLOYEE)
    await page.route('**/dashboard/stats', r => r.fulfill({ json: EMPTY_STATS }))
    await page.goto('/team')
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('employee is redirected from /billing to /dashboard', async ({ page }) => {
    await loginAs(page, EMPLOYEE)
    await page.route('**/dashboard/stats', r => r.fulfill({ json: EMPTY_STATS }))
    await page.goto('/billing')
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('admin can access /team', async ({ page }) => {
    await loginAs(page, ADMIN, SUB_ACTIVE)
    await page.route('**/users/', r => r.fulfill({ json: [] }))
    await page.goto('/team')
    await expect(page).toHaveURL(/\/team/)
  })

  test('owner can access /billing', async ({ page }) => {
    await loginAs(page, OWNER, SUB_ACTIVE)
    await page.goto('/billing')
    await expect(page).toHaveURL(/\/billing/)
    await expect(page.getByRole('heading', { name: 'Faturamento' })).toBeVisible()
  })
})
