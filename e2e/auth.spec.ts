import { test, expect } from '@playwright/test'
import { acceptCookies } from './helpers'

// Suppress Google OAuth iframe and pre-accept cookie consent for all auth tests
test.beforeEach(async ({ page }) => {
  await acceptCookies(page)
  await page.route('https://accounts.google.com/**', r => r.abort())
  await page.route('https://apis.google.com/**', r => r.abort())
  await page.route('**/auth/me', r => r.fulfill({ status: 401, json: { message: 'Unauthorized' } }))
})

// ── LoginPage ──────────────────────────────────────────────────────────────────

test.describe('LoginPage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('renders heading, fields and primary button', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible()
    await expect(page.getByPlaceholder('voce@empresa.com')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
  })

  test('shows links to register and forgot password', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Criar conta grátis' })).toHaveAttribute('href', '/register')
    await expect(page.getByRole('link', { name: 'Esqueci minha senha' })).toHaveAttribute('href', '/forgot')
  })

  test('shows error message on invalid credentials', async ({ page }) => {
    // Use 422 instead of 401 to avoid the axios interceptor redirecting to /
    // when there is no refresh token (unauthenticated user flow).
    await page.route('**/auth/login', r =>
      r.fulfill({ status: 422, json: { message: 'Credenciais inválidas' } }),
    )
    await page.getByPlaceholder('voce@empresa.com').fill('bad@test.com')
    await page.locator('input[type="password"]').fill('wrongpassword')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByText('Credenciais inválidas')).toBeVisible()
  })

  test('redirects to /dashboard on successful login', async ({ page }) => {
    await page.route('**/auth/login', r =>
      r.fulfill({ json: { accessToken: 'tok', refreshToken: 'ref' } }),
    )
    await page.route('**/auth/me', r =>
      r.fulfill({ json: { id: 'u1', name: 'Charles', email: 'c@test.com', role: 'owner', tenantId: 't1', emailVerified: true, twoFactorEnabled: false, subscriptionStatus: 'active' } }),
    )
    await page.route('**/billing/subscription', r =>
      r.fulfill({ json: { status: 'active', planType: 'monthly', trialEndsAt: null, currentPeriodEnd: '2027-01-01T00:00:00.000Z' } }),
    )
    await page.route('**/notifications', r => r.fulfill({ json: [] }))
    await page.route('**/notifications/events', r => r.abort())
    await page.route('**/dashboard/stats', r => r.fulfill({ json: {
      partners: { total: 0, thisMonth: 0, lastMonth: 0, geocodedDone: 0, geocodedFailed: 0, geocodedPct: 0, public: 0, internal: 0 },
      imports: { total: 0, thisMonth: 0, lastMonth: 0 },
      geo: { byState: [], byCity: [], byPinType: [] },
      recentImports: [],
      partnersByMonth: [],
    } }))
    await page.getByPlaceholder('voce@empresa.com').fill('charles@test.com')
    await page.locator('input[type="password"]').fill('correctpassword')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('redirects to /2fa when 2FA is required', async ({ page }) => {
    await page.route('**/auth/login', r =>
      r.fulfill({ json: { requiresTwoFactor: true, tempToken: 'tmp123' } }),
    )
    await page.getByPlaceholder('voce@empresa.com').fill('charles@test.com')
    await page.locator('input[type="password"]').fill('correctpassword')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page).toHaveURL(/\/2fa/)
  })
})

// ── RegisterPage ───────────────────────────────────────────────────────────────

test.describe('RegisterPage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
  })

  test('shows step 1 of 2 with password field requiring 12 characters', async ({ page }) => {
    await expect(page.getByText('Passo 1 de 2')).toBeVisible()
    await expect(page.getByText('Mínimo 12 caracteres')).toBeVisible()
    const passwordInput = page.getByPlaceholder('Mínimo 12 caracteres')
    await expect(passwordInput).toBeVisible()
    await expect(passwordInput).toHaveAttribute('minlength', '12')
  })

  test('advances to step 2 after filling step 1 fields', async ({ page }) => {
    await page.getByPlaceholder('Ana Costa').fill('Charles Silva')
    await page.getByPlaceholder('ana@empresa.com').fill('charles@empresa.com')
    await page.getByPlaceholder('Mínimo 12 caracteres').fill('senha-segura-12')
    await page.getByRole('button', { name: 'Continuar' }).click()
    await expect(page.getByText('Passo 2 de 2')).toBeVisible()
    await expect(page.getByText('Sobre sua empresa')).toBeVisible()
  })

  test('can go back from step 2 to step 1', async ({ page }) => {
    await page.getByPlaceholder('Ana Costa').fill('Charles Silva')
    await page.getByPlaceholder('ana@empresa.com').fill('charles@empresa.com')
    await page.getByPlaceholder('Mínimo 12 caracteres').fill('senha-segura-12')
    await page.getByRole('button', { name: 'Continuar' }).click()
    await page.getByRole('button', { name: 'Voltar' }).click()
    await expect(page.getByText('Passo 1 de 2')).toBeVisible()
  })

  test('has link to login page', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login')
  })
})

// ── ForgotPasswordPage ─────────────────────────────────────────────────────────

test.describe('ForgotPasswordPage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forgot')
  })

  test('renders heading and email input', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Recuperar senha' })).toBeVisible()
    await expect(page.getByRole('textbox')).toBeVisible()
    await expect(page.getByRole('button', { name: /Enviar/i })).toBeVisible()
  })

  test('shows success state after submitting valid email', async ({ page }) => {
    await page.route('**/auth/forgot-password', r => r.fulfill({ status: 204 }))
    await page.getByRole('textbox').fill('user@empresa.com')
    await page.getByRole('button', { name: /Enviar/i }).click()
    await expect(page.getByRole('heading', { name: 'Verifique seu e-mail' })).toBeVisible()
    await expect(page.getByText(/Enviamos um link/i)).toBeVisible()
  })
})

// ── ResetPasswordPage ──────────────────────────────────────────────────────────

test.describe('ResetPasswordPage', () => {
  test('shows "Link inválido" state when token is absent', async ({ page }) => {
    await page.goto('/reset-password')
    await expect(page.getByRole('heading', { name: 'Link inválido' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Solicitar novo link/i })).toBeVisible()
  })

  test('shows password form with 12-char placeholder when token is present', async ({ page }) => {
    await page.goto('/reset-password?token=abc123token')
    await expect(page.getByRole('heading', { name: 'Nova senha' })).toBeVisible()
    await expect(page.getByPlaceholder('Mínimo 12 caracteres')).toBeVisible()
    await expect(page.getByPlaceholder('Repita a senha')).toBeVisible()
  })

  test('shows validation error when password is shorter than 12 characters', async ({ page }) => {
    await page.goto('/reset-password?token=abc123token')
    await page.getByPlaceholder('Mínimo 12 caracteres').fill('curta')
    await page.getByPlaceholder('Repita a senha').fill('curta')
    await page.getByRole('button', { name: /Redefinir/i }).click()
    await expect(page.getByText(/ao menos 12 caracteres/i)).toBeVisible()
  })

  test('shows mismatch error when passwords do not match', async ({ page }) => {
    await page.goto('/reset-password?token=abc123token')
    await page.getByPlaceholder('Mínimo 12 caracteres').fill('senha-muito-segura')
    await page.getByPlaceholder('Repita a senha').fill('senha-diferente-aqui')
    await page.getByRole('button', { name: /Redefinir/i }).click()
    await expect(page.getByText(/não coincidem/i)).toBeVisible()
  })

  test('navigates to /login after successful reset', async ({ page }) => {
    await page.goto('/reset-password?token=valid-token')
    await page.route('**/auth/reset-password', r => r.fulfill({ status: 204 }))
    await page.getByPlaceholder('Mínimo 12 caracteres').fill('senha-muito-segura')
    await page.getByPlaceholder('Repita a senha').fill('senha-muito-segura')
    await page.getByRole('button', { name: /Redefinir/i }).click()
    await expect(page).toHaveURL(/\/login/)
  })
})

// ── AcceptInvitePage ───────────────────────────────────────────────────────────

test.describe('AcceptInvitePage', () => {
  test('shows "Link inválido" state when token is absent', async ({ page }) => {
    await page.goto('/auth/accept-invite')
    await expect(page.getByRole('heading', { name: 'Link inválido' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Ir para o login/i })).toBeVisible()
  })

  test('shows activation form with 12-char placeholder when token is present', async ({ page }) => {
    await page.goto('/auth/accept-invite?token=invite123')
    await expect(page.getByRole('heading', { name: 'Ativar conta' })).toBeVisible()
    await expect(page.getByPlaceholder('Nome completo')).toBeVisible()
    await expect(page.getByPlaceholder('Mínimo 12 caracteres')).toBeVisible()
  })

  test('shows validation error when password is shorter than 12 characters', async ({ page }) => {
    await page.goto('/auth/accept-invite?token=invite123')
    await page.getByPlaceholder('Nome completo').fill('Charles Silva')
    await page.getByPlaceholder('Mínimo 12 caracteres').fill('curta')
    await page.getByPlaceholder('Repita a senha').fill('curta')
    await page.getByRole('button', { name: /Ativar conta/i }).click()
    await expect(page.getByText(/ao menos 12 caracteres/i)).toBeVisible()
  })

  test('shows mismatch error when passwords do not match', async ({ page }) => {
    await page.goto('/auth/accept-invite?token=invite123')
    await page.getByPlaceholder('Nome completo').fill('Charles Silva')
    await page.getByPlaceholder('Mínimo 12 caracteres').fill('senha-muito-segura')
    await page.getByPlaceholder('Repita a senha').fill('senha-diferente-aqui')
    await page.getByRole('button', { name: /Ativar conta/i }).click()
    await expect(page.getByText(/não coincidem/i)).toBeVisible()
  })
})
