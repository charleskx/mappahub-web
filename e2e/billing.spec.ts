import { test, expect } from '@playwright/test'
import { API_URL, loginAs, OWNER, ADMIN, EMPLOYEE, SUB_ACTIVE, SUB_TRIAL } from './helpers'

test.describe('BillingPage', () => {
  test('owner on active subscription sees "Gerenciar assinatura" button', async ({ page }) => {
    await loginAs(page, OWNER, SUB_ACTIVE)
    await page.route('**/billing/subscription', r =>
      r.fulfill({ json: { status: 'active', planType: 'monthly', trialEndsAt: null, currentPeriodEnd: '2027-01-01T00:00:00.000Z' } }),
    )
    await page.goto('/billing')
    await expect(page).toHaveURL(/\/billing/)
    await expect(page.getByRole('heading', { name: 'Faturamento' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Gerenciar assinatura', exact: true })).toBeVisible()
  })

  test('owner on trial sees "Assinar agora" button', async ({ page }) => {
    await loginAs(page, OWNER, SUB_TRIAL)
    await page.route('**/billing/subscription', r =>
      r.fulfill({ json: SUB_TRIAL }),
    )
    await page.goto('/billing')
    await expect(page.getByRole('button', { name: 'Assinar agora' })).toBeVisible()
  })

  test('admin can access /billing but does not see action buttons', async ({ page }) => {
    await loginAs(page, ADMIN, SUB_ACTIVE)
    await page.goto('/billing')
    await expect(page).toHaveURL(/\/billing/)
    await expect(page.getByRole('heading', { name: 'Faturamento' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Gerenciar assinatura', exact: true })).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Assinar agora' })).not.toBeVisible()
  })

  test('employee is redirected from /billing to /dashboard', async ({ page }) => {
    await loginAs(page, EMPLOYEE)
    await page.route('**/dashboard/stats', r => r.fulfill({ json: {
      partners: { total: 0, thisMonth: 0, lastMonth: 0, geocodedDone: 0, geocodedFailed: 0, geocodedPct: 0, public: 0, internal: 0 },
      imports: { total: 0, thisMonth: 0, lastMonth: 0 },
      geo: { byState: [], byCity: [], byPinType: [] },
      recentImports: [],
      partnersByMonth: [],
    } }))
    await page.goto('/billing')
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('plan cards display monthly and annual plans', async ({ page }) => {
    await loginAs(page, OWNER, SUB_ACTIVE)
    await page.goto('/billing')
    await expect(page.getByText('R$ 197,90')).toBeVisible()
    await expect(page.getByText('R$ 177,90')).toBeVisible()
    await expect(page.getByText('Recomendado')).toBeVisible()
  })

  test('trial progress bar shown for trialing subscription', async ({ page }) => {
    await loginAs(page, OWNER, SUB_TRIAL)
    await page.goto('/billing')
    await expect(page.getByText(/trial/i).first()).toBeVisible()
  })

  test('payment history table lists recorded payments', async ({ page }) => {
    await loginAs(page, OWNER, SUB_ACTIVE)
    await page.route(`${API_URL}/billing/payments`, r => r.fulfill({ json: [
      { id: 'pay1', type: 'credit_pack', description: 'Pacote de 5.000 geocodings', amountCents: 11900, currency: 'brl', status: 'paid', createdAt: '2026-06-01T00:00:00.000Z' },
      { id: 'pay2', type: 'subscription', description: 'Assinatura mensal', amountCents: 19790, currency: 'brl', status: 'failed', createdAt: '2026-05-01T00:00:00.000Z' },
    ] }))
    await page.goto('/billing')

    await expect(page.getByText('Histórico de pagamentos')).toBeVisible()
    await expect(page.getByText('Pacote de 5.000 geocodings')).toBeVisible()
    await expect(page.getByText('R$ 119,00')).toBeVisible()
    await expect(page.getByText('Pago')).toBeVisible()
    await expect(page.getByText('Falhou')).toBeVisible()
  })

  test('payment history shows empty state when there are none', async ({ page }) => {
    await loginAs(page, OWNER, SUB_ACTIVE)
    await page.route(`${API_URL}/billing/payments`, r => r.fulfill({ json: [] }))
    await page.goto('/billing')
    await expect(page.getByText('Nenhum pagamento registrado ainda.')).toBeVisible()
  })
})
