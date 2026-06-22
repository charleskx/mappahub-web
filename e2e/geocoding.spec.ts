import { test, expect } from '@playwright/test'
import { API_URL, loginAs, OWNER, EMPLOYEE, SUPER_ADMIN } from './helpers'

const USAGE = {
  freeUsed: 1800,
  freeLimit: 2000,
  resetsAt: '2027-02-01T00:00:00.000Z',
  limitExpiresAt: null,
  creditsTotal: 5000,
  creditLots: [{ remaining: 5000, expiresAt: '2027-04-01T00:00:00.000Z' }],
}

const PACKS = [
  { id: '1k', credits: 1000, validityDays: 30, priceCents: 2900 },
  { id: '5k', credits: 5000, validityDays: 90, priceCents: 11900 },
  { id: '10k', credits: 10000, validityDays: 180, priceCents: 19900 },
  { id: '25k', credits: 25000, validityDays: 365, priceCents: 39900 },
]

test.describe('Geocoding usage panel (client)', () => {
  test('owner sees franquia, créditos and the buy button', async ({ page }) => {
    await loginAs(page, OWNER)
    await page.route(`${API_URL}/geocoding-logs**`, r => r.fulfill({ json: [] }))
    await page.route(`${API_URL}/geocoding-usage`, r => r.fulfill({ json: USAGE }))
    await page.goto('/geocoding-logs')

    await expect(page.getByText('Uso de geocoding')).toBeVisible()
    await expect(page.getByText('1.800 / 2.000')).toBeVisible()
    await expect(page.getByText('5.000', { exact: false }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Comprar geocodings extras/ })).toBeVisible()
  })

  test('buy modal lists the credit packs with prices', async ({ page }) => {
    await loginAs(page, OWNER)
    await page.route(`${API_URL}/geocoding-logs**`, r => r.fulfill({ json: [] }))
    await page.route(`${API_URL}/geocoding-usage`, r => r.fulfill({ json: USAGE }))
    await page.route(`${API_URL}/billing/credit-packs`, r => r.fulfill({ json: PACKS }))
    await page.goto('/geocoding-logs')

    await page.getByRole('button', { name: /Comprar geocodings extras/ }).click()
    await expect(page.getByText('+5.000 geocodings')).toBeVisible()
    await expect(page.getByText('R$ 119,00')).toBeVisible()
    await expect(page.getByText('Validade de 90 dias')).toBeVisible()
  })

  test('employee does not see the buy button', async ({ page }) => {
    await loginAs(page, EMPLOYEE)
    await page.route(`${API_URL}/geocoding-logs**`, r => r.fulfill({ json: [] }))
    await page.route(`${API_URL}/geocoding-usage`, r => r.fulfill({ json: USAGE }))
    await page.goto('/geocoding-logs')

    await expect(page.getByText('Uso de geocoding')).toBeVisible()
    await expect(page.getByRole('button', { name: /Comprar geocodings extras/ })).not.toBeVisible()
  })
})

test.describe('Geocoding limit modal (super admin)', () => {
  const TENANT = {
    id: 't1', name: 'Empresa Teste', slug: 'empresa', email: 'empresa@example.com',
    active: true, createdAt: new Date().toISOString(), subscriptionStatus: 'active', planType: 'monthly',
  }

  test('super admin opens the geocoding limit modal for a tenant', async ({ page }) => {
    await loginAs(page, SUPER_ADMIN)
    await page.route(`${API_URL}/admin/tenants`, r => r.fulfill({ json: [TENANT] }))
    await page.route(`${API_URL}/admin/tenants/t1/geocoding`, r => r.fulfill({ json: {
      used: 1800, defaultLimit: 2000, monthlyLimit: null, limitExpiresAt: null, effectiveLimit: 2000, creditsTotal: 5000,
    } }))
    await page.goto('/admin')

    await expect(page.getByRole('heading', { name: 'Super Admin' })).toBeVisible()
    await page.getByTitle('Limite de geocoding').click()

    await expect(page.getByText(/Limite de geocoding — Empresa Teste/)).toBeVisible()
    await expect(page.getByText('1.800 / 2.000')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Restaurar padrão' })).toBeVisible()
  })
})
