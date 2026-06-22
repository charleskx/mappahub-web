import type { Page } from '@playwright/test'

// ── API base URL ───────────────────────────────────────────────────────────────
// Must match VITE_API_URL (defaults to http://localhost:3000 when unset).
// Using the full origin prevents route globs from accidentally intercepting
// same-path page navigations on localhost:5173.
export const API_URL = 'http://localhost:3000'

// ── Mock users ─────────────────────────────────────────────────────────────────

export const OWNER = {
  id: 'u1',
  name: 'Charles Silva',
  email: 'charles@example.com',
  role: 'owner',
  tenantId: 't1',
  emailVerified: true,
  twoFactorEnabled: false,
  subscriptionStatus: 'active',
}

export const ADMIN = { ...OWNER, id: 'u2', role: 'admin', name: 'Admin User', email: 'admin@example.com' }
export const EMPLOYEE = { ...OWNER, id: 'u3', role: 'employee', name: 'Employee User', email: 'employee@example.com' }
export const SUPER_ADMIN = { ...OWNER, id: 'u4', role: 'super_admin', name: 'Super Admin', email: 'super@example.com' }

// ── Mock subscriptions ─────────────────────────────────────────────────────────

export const SUB_ACTIVE = {
  status: 'active',
  planType: 'monthly',
  trialEndsAt: null,
  currentPeriodEnd: '2027-01-01T00:00:00.000Z',
}

export const SUB_TRIAL = {
  status: 'trialing',
  planType: 'trial',
  trialEndsAt: '2027-01-15T00:00:00.000Z',
  currentPeriodEnd: null,
}

// ── Mock data ──────────────────────────────────────────────────────────────────

export const EMPTY_STATS = {
  partners: { total: 42, thisMonth: 5, lastMonth: 3, geocodedDone: 38, geocodedFailed: 2, geocodedPct: 90, public: 30, internal: 12 },
  imports: { total: 3, thisMonth: 1, lastMonth: 1 },
  geo: { byState: [{ state: 'SP', count: 20 }], byCity: [], byPinType: [] },
  recentImports: [],
  partnersByMonth: [{ month: '2026-01', count: 10 }],
}

export const MOCK_PARTNERS = {
  data: [
    { id: 'p1', name: 'Distribuidora Norte', address: 'Av. Paulista, 1000', city: 'São Paulo', state: 'SP', visibility: 'public', geocodeStatus: 'done', source: 'manual', lat: -23.56, lng: -46.65, pinTypeId: null, dynamicValues: {}, createdAt: new Date().toISOString() },
  ],
  total: 1,
  page: 1,
  totalPages: 1,
}

export const MOCK_PIN_TYPES = [
  { id: 'pt1', name: 'Distribuidor', color: '#ff0000', tenantId: 't1', createdAt: new Date().toISOString() },
]

// ── Auth helper ────────────────────────────────────────────────────────────────

/**
 * Injects auth tokens into localStorage and mocks the /auth/me + common endpoints
 * before the page loads. Must be called BEFORE page.goto().
 */
/**
 * Pre-accepts the LGPD cookie consent banner so it never covers interactive
 * elements during tests. Call this (via addInitScript) before page.goto().
 */
export async function acceptCookies(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'lgpd_consent',
      JSON.stringify({ necessary: true, analytics: true, performance: true }),
    )
  })
}

export async function loginAs(page: Page, user = OWNER, subscription = SUB_ACTIVE) {
  // Inject tokens before any page script runs
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'mock-access-token')
    localStorage.setItem('refreshToken', 'mock-refresh-token')
    // Accept LGPD cookie banner so it doesn't cover interactive elements
    localStorage.setItem(
      'lgpd_consent',
      JSON.stringify({ necessary: true, analytics: true, performance: true }),
    )
  })

  // Core auth + shell endpoints
  await page.route('**/auth/me', route => route.fulfill({ json: user }))
  await page.route('**/billing/subscription', route => route.fulfill({ json: subscription }))
  await page.route('**/notifications', route => route.fulfill({ json: [] }))
  await page.route('**/notifications/events', route => route.abort())

  // Suppress external OAuth requests
  await page.route('https://accounts.google.com/**', route => route.abort())
  await page.route('https://apis.google.com/**', route => route.abort())
}
