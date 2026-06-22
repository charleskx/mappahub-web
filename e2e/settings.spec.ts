import { test, expect } from '@playwright/test'
import { loginAs, OWNER, EMPLOYEE, API_URL } from './helpers'

const MOCK_SETTINGS = {
  publicMapEnabled: false,
  brandName: '',
  brandWebsiteUrl: '',
  brandColor: '#4f46e5',
  brandFooterText: '',
  brandLogoUrl: '',
}

test.describe('SettingsPage', () => {
  test.describe('Profile tab', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, OWNER)
      await page.goto('/settings?tab=profile')
    })

    test('renders "Configurações" heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Configurações' })).toBeVisible()
    })

    test('profile tab button is visible', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Perfil', exact: true })).toBeVisible()
    })

    test('profile card shows name and disabled email inputs', async ({ page }) => {
      // The Field component renders sibling label + input (no htmlFor), so we
      // check by input attributes rather than getByLabel.
      await expect(page.locator('input:not([disabled])')).toBeVisible()
      await expect(page.locator('input[disabled]')).toBeVisible()
    })

    test('email field is read-only (disabled)', async ({ page }) => {
      const emailInput = page.locator('input[disabled]')
      await expect(emailInput).toBeVisible()
      await expect(emailInput).toBeDisabled()
    })

    test('"Salvar alterações" button is visible on profile tab', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Salvar alterações' })).toBeVisible()
    })
  })

  test.describe('Security tab', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, OWNER)
      await page.goto('/settings?tab=security')
    })

    test('shows 2FA card with "Ativar 2FA" button when disabled', async ({ page }) => {
      await expect(page.getByText('Autenticação em dois fatores')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Ativar 2FA' })).toBeVisible()
    })
  })

  test.describe('Workspace tab', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, OWNER)
      await page.route(`${API_URL}/tenant/settings**`, r => r.fulfill({ json: MOCK_SETTINGS }))
      await page.goto('/settings?tab=workspace')
    })

    test('owner sees workspace tab button', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Workspace', exact: true })).toBeVisible()
    })

    test('workspace content: Mapa público section is visible', async ({ page }) => {
      await expect(page.locator('.card-title', { hasText: /^Mapa público$/ })).toBeVisible()
    })

    test('logo upload field hint says "JPG, PNG ou WebP — máx. 2 MB"', async ({ page }) => {
      await expect(page.getByText('JPG, PNG ou WebP — máx. 2 MB')).toBeVisible()
    })

    test('logo upload input does NOT accept SVG files', async ({ page }) => {
      const accept = await page.locator('input[type="file"][accept*="image"]').getAttribute('accept')
      expect(accept).not.toContain('svg')
      expect(accept).toContain('image/jpeg')
      expect(accept).toContain('image/png')
      expect(accept).toContain('image/webp')
    })

    test('shows brand name, color and footer text fields', async ({ page }) => {
      await expect(page.getByPlaceholder('Ex: Minha Empresa')).toBeVisible()
      await expect(page.getByPlaceholder('#4f46e5')).toBeVisible()
      await expect(page.getByPlaceholder(/© 2025/i)).toBeVisible()
    })

    test('"Salvar configurações" button is visible', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Salvar configurações' })).toBeVisible()
    })
  })

  test.describe('Employee restrictions', () => {
    test('employee does not see workspace tab button', async ({ page }) => {
      await loginAs(page, EMPLOYEE)
      await page.goto('/settings')
      // Profile and Security tabs are present
      await expect(page.getByRole('button', { name: 'Perfil', exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Segurança', exact: true })).toBeVisible()
      // Workspace tab button is NOT present
      await expect(page.getByRole('button', { name: 'Workspace', exact: true })).not.toBeVisible()
    })
  })

  test.describe('Tab navigation', () => {
    test('clicking Security tab navigates to security view', async ({ page }) => {
      await loginAs(page, OWNER)
      await page.goto('/settings')
      await page.getByRole('button', { name: 'Segurança', exact: true }).click()
      await expect(page).toHaveURL(/tab=security/)
      await expect(page.getByText('Autenticação em dois fatores')).toBeVisible()
    })

    test('clicking Workspace tab navigates to workspace view', async ({ page }) => {
      await loginAs(page, OWNER)
      await page.route(`${API_URL}/tenant/settings**`, r => r.fulfill({ json: MOCK_SETTINGS }))
      await page.goto('/settings')
      await page.getByRole('button', { name: 'Workspace', exact: true }).click()
      await expect(page).toHaveURL(/tab=workspace/)
      await expect(page.locator('.card-title', { hasText: /^Mapa público$/ })).toBeVisible()
    })
  })
})
