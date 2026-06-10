import { test, expect } from '@playwright/test'
import { loginAs, OWNER, ADMIN, EMPTY_STATS, MOCK_PARTNERS, MOCK_PIN_TYPES, API_URL } from './helpers'

// ── Dashboard ──────────────────────────────────────────────────────────────────

test.describe('DashboardPage', () => {
  test('renders greeting heading and stat cards', async ({ page }) => {
    await loginAs(page, OWNER)
    await page.route(`${API_URL}/dashboard/stats`, r => r.fulfill({ json: EMPTY_STATS }))
    await page.goto('/dashboard')
    await expect(page.getByText(/Bom dia/i)).toBeVisible()
    await expect(page.getByText('42')).toBeVisible() // total partners from EMPTY_STATS
  })

  test('renders "Imports recentes" section', async ({ page }) => {
    await loginAs(page, OWNER)
    await page.route(`${API_URL}/dashboard/stats`, r => r.fulfill({ json: EMPTY_STATS }))
    await page.goto('/dashboard')
    await expect(page.getByText('Imports recentes')).toBeVisible()
  })

  test('shows "Nenhum import realizado ainda" when imports are empty', async ({ page }) => {
    await loginAs(page, OWNER)
    await page.route(`${API_URL}/dashboard/stats`, r => r.fulfill({ json: EMPTY_STATS }))
    await page.goto('/dashboard')
    await expect(page.getByText(/nenhum import realizado ainda/i)).toBeVisible()
  })
})

// ── Partners ───────────────────────────────────────────────────────────────────

test.describe('PartnersPage', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, OWNER)
    // Use explicit API host to avoid intercepting the page navigation itself
    await page.route(`${API_URL}/partners/**`, r => r.fulfill({ json: MOCK_PARTNERS }))
    await page.route(`${API_URL}/pin-types**`, r => r.fulfill({ json: MOCK_PIN_TYPES }))
    await page.route(`${API_URL}/geocoding-logs**`, r => r.fulfill({ json: [] }))
    await page.goto('/partners')
  })

  test('renders heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Parceiros' })).toBeVisible()
  })

  test('shows partner list from API', async ({ page }) => {
    await expect(page.getByText('Distribuidora Norte')).toBeVisible()
  })

  test('"Novo parceiro" button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Novo parceiro' })).toBeVisible()
  })

  test('search input is present', async ({ page }) => {
    await expect(page.getByPlaceholder(/buscar/i)).toBeVisible()
  })
})

// ── Export ─────────────────────────────────────────────────────────────────────

test.describe('ExportPage', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, OWNER)
    await page.route('**/export/columns*', r =>
      r.fulfill({
        json: [
          { key: 'name', label: 'Nome' },
          { key: 'address', label: 'Endereço' },
          { key: 'city', label: 'Cidade' },
        ],
      }),
    )
    await page.goto('/export')
  })

  test('renders heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Exportar dados' })).toBeVisible()
  })

  test('shows column checkboxes after loading', async ({ page }) => {
    await expect(page.getByText('Nome', { exact: true })).toBeVisible()
    await expect(page.getByText('Endereço', { exact: true })).toBeVisible()
  })

  test('format selector is present', async ({ page }) => {
    await expect(page.locator('select')).toBeVisible()
  })

  test('"Exportar" button is present', async ({ page }) => {
    await expect(page.getByRole('button', { name: /exportar/i })).toBeVisible()
  })
})

// ── Team ───────────────────────────────────────────────────────────────────────

test.describe('TeamPage', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ADMIN)
    await page.route(`${API_URL}/users/**`, r =>
      r.fulfill({
        json: [
          { id: 'u1', name: 'Charles Silva', email: 'charles@example.com', role: 'owner', emailVerified: true, createdAt: new Date().toISOString() },
          { id: 'u2', name: 'Admin User', email: 'admin@example.com', role: 'admin', emailVerified: true, createdAt: new Date().toISOString() },
        ],
      }),
    )
    await page.goto('/team')
  })

  test('renders heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Equipe' })).toBeVisible()
  })

  test('shows member list', async ({ page }) => {
    await expect(page.getByText('Charles Silva', { exact: true })).toBeVisible()
    await expect(page.getByText('Admin User', { exact: true }).first()).toBeVisible()
  })

  test('"Convidar colaborador" button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /convidar/i })).toBeVisible()
  })
})

// ── Pin Types ──────────────────────────────────────────────────────────────────

test.describe('PinTypesPage', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, OWNER)
    // Use explicit API host + wildcard to avoid intercepting the /pin-types page navigation
    await page.route(`${API_URL}/pin-types**`, r => r.fulfill({ json: MOCK_PIN_TYPES }))
    await page.goto('/pin-types')
  })

  test('renders heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /tipos de pin/i })).toBeVisible()
  })

  test('shows existing pin types', async ({ page }) => {
    await expect(page.getByText('Distribuidor')).toBeVisible()
  })

  test('"Novo tipo" button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /novo tipo/i })).toBeVisible()
  })

  test('opens create modal when clicking "Novo tipo"', async ({ page }) => {
    await page.getByRole('button', { name: /novo tipo/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })
})

// ── Geocoding Logs ─────────────────────────────────────────────────────────────

test.describe('GeocodingLogsPage', () => {
  test('renders heading', async ({ page }) => {
    await loginAs(page, OWNER)
    await page.route(`${API_URL}/geocoding-logs**`, r => r.fulfill({ json: [] }))
    await page.goto('/geocoding-logs')
    await expect(page.getByRole('heading', { name: /logs de geocodificação/i })).toBeVisible()
  })
})

// ── Tickets / Support ──────────────────────────────────────────────────────────

test.describe('TicketsPage', () => {
  test('renders support page heading', async ({ page }) => {
    await loginAs(page, OWNER)
    await page.route(`${API_URL}/tickets**`, r => r.fulfill({ json: [] }))
    await page.goto('/support')
    await expect(page.getByRole('heading', { name: /suporte/i })).toBeVisible()
  })
})

// ── Map ────────────────────────────────────────────────────────────────────────

test.describe('MapPage', () => {
  test('renders internal map heading', async ({ page }) => {
    await loginAs(page, OWNER)
    await page.route(`${API_URL}/partners/pins**`, r => r.fulfill({ json: [] }))
    await page.route(`${API_URL}/pin-types**`, r => r.fulfill({ json: MOCK_PIN_TYPES }))
    await page.route(`${API_URL}/maps/**`, r => r.fulfill({ json: [] }))
    await page.goto('/map')
    await expect(page.getByRole('heading', { name: /mapa interno/i })).toBeVisible()
  })
})
