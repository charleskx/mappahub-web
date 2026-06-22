import { test, expect } from '@playwright/test'
import { loginAs, OWNER, API_URL } from './helpers'

test.describe('ImportPage', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, OWNER)
    await page.route(`${API_URL}/import/`, r => r.fulfill({ json: [] }))
    await page.goto('/import')
  })

  test('renders heading and dropzone', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Importar planilha' })).toBeVisible()
    await expect(page.getByText('Arraste o arquivo aqui ou clique para selecionar')).toBeVisible()
  })

  test('dropzone shows max 50 MB limit', async ({ page }) => {
    await expect(page.getByText(/Máx\. 50 MB/)).toBeVisible()
  })

  test('dropzone shows supported formats', async ({ page }) => {
    await expect(page.getByText(/\.xlsx.*\.xls.*\.csv/)).toBeVisible()
  })

  test('hidden file input only accepts .xlsx, .xls and .csv', async ({ page }) => {
    const accept = await page.locator('input[type="file"]').getAttribute('accept')
    expect(accept).toBe('.xlsx,.xls,.csv')
  })

  test('mode selector defaults to "Substituição total"', async ({ page }) => {
    const select = page.locator('select')
    await expect(select).toHaveValue('full')
    await expect(select.locator('option[value="full"]')).toHaveText('Substituição total')
    await expect(select.locator('option[value="incremental"]')).toHaveText('Incremental')
  })

  test('can switch import mode to incremental', async ({ page }) => {
    await page.locator('select').selectOption('incremental')
    await expect(page.locator('select')).toHaveValue('incremental')
  })

  test('shows empty state in history section when no jobs exist', async ({ page }) => {
    await expect(page.getByText('Nenhuma importação ainda')).toBeVisible()
  })

  test('shows import history table when jobs exist', async ({ page }) => {
    // Override the empty-jobs route registered in beforeEach with real data,
    // then reload to trigger a fresh fetch.
    await page.route(`${API_URL}/import/`, r =>
      r.fulfill({
        json: [
          {
            id: 'j1',
            fileName: 'parceiros.xlsx',
            fileSize: 24576,
            mode: 'full',
            status: 'done',
            created: 42,
            updated: 3,
            failed: 0,
            createdAt: new Date().toISOString(),
          },
        ],
      }),
    )
    await page.reload()
    await expect(page.getByText('parceiros.xlsx')).toBeVisible()
    await expect(page.getByText('done')).toBeVisible()
  })

  test('"Baixar modelo" button is present', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Baixar modelo' })).toBeVisible()
  })

  test('column reference card is visible', async ({ page }) => {
    await expect(page.getByText('Colunas da planilha')).toBeVisible()
    await expect(page.getByText('nome', { exact: true })).toBeVisible()
    await expect(page.getByText('endereço', { exact: true })).toBeVisible()
  })

  test('confirmation modal appears when a valid file is selected', async ({ page }) => {
    // Simulate file selection via the hidden input
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'test.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('fake-xlsx'),
    })
    // Confirmation modal should open
    await expect(page.getByText('Atenção: substituição total')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sim, substituir tudo' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cancelar' })).toBeVisible()
  })

  test('confirmation modal shows file name and size', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'importacao.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('nome,endereço\nTest,Rua A'),
    })
    await expect(page.getByText('importacao.csv')).toBeVisible()
  })

  test('closing confirmation modal cancels the upload', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'test.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('fake'),
    })
    await page.getByRole('button', { name: 'Cancelar' }).click()
    await expect(page.getByText('Atenção: substituição total')).not.toBeVisible()
  })
})
