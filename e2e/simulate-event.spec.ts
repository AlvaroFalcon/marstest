import { expect, test, type Page } from '@playwright/test'

test.use({ colorScheme: 'light' })

const simulateButtonName = /^Simulate (carrier )?event$/

async function simulateCarrierEvent(page: Page) {
  await page.getByRole('button', { name: simulateButtonName }).click()
}

test.describe('simulate carrier event', () => {
  test('shows the toast with a View action and the new marked card in the inbox', async ({ page }) => {
    await page.goto('/ops/exceptions')
    await expect(page.getByRole('link', { name: /SH-1042/ })).toBeVisible()

    await simulateCarrierEvent(page)

    await expect(page.getByText('New carrier event: SH-1060 vessel rolled to next sailing')).toBeVisible()
    await expect(page.getByRole('button', { name: 'View' })).toBeVisible()
    const card = page.getByRole('link', { name: /SH-1060/ })
    await expect(card).toBeVisible()
    await expect(card).toContainText('New')
    await expect(page.getByLabel('Inbox summary')).toContainText(/Need attention\s*6/)
  })

  test('opens the exception from the toast View action', async ({ page }) => {
    await page.goto('/ops/exceptions')
    await simulateCarrierEvent(page)

    await page.getByRole('button', { name: 'View' }).click()

    await expect(page).toHaveURL('/ops/exceptions/SH-1060')
    await expect(page.getByRole('heading', { level: 1, name: /^SH-1060 · Bilbao → Le Havre/ })).toBeVisible()
  })

  test('shows the rolled vessel in the SH-1060 shipment detail', async ({ page }) => {
    await page.goto('/ops/exceptions')
    await simulateCarrierEvent(page)
    await expect(page.getByRole('link', { name: /SH-1060/ })).toBeVisible()

    await page.goto('/ops/shipments/SH-1060')

    await expect(page.getByRole('heading', { level: 1, name: /^SH-1060/ })).toBeVisible()
    await expect(page.getByText('Vessel rolled').first()).toBeVisible()
    await expect(page.getByText('Mareline Poniente').first()).toBeVisible()
    await expect(page.getByText(/^Updated [0-4] min ago$/).first()).toBeVisible()
  })

  test('places SH-1060 between the incident and the predicted delays', async ({ page }) => {
    await page.goto('/ops/exceptions')

    await simulateCarrierEvent(page)

    const cards = page.getByRole('list', { name: 'Open exceptions' }).getByRole('link')
    await expect(cards).toHaveCount(6)
    for (const [index, shipmentId] of ['SH-1042', 'SH-1051', 'SH-1060', 'SH-1037', 'SH-1035', 'SH-1029'].entries()) {
      await expect(cards.nth(index)).toContainText(shipmentId)
    }
  })

  test('says it was already simulated on a repeat click', async ({ page }) => {
    await page.goto('/ops/exceptions')
    await simulateCarrierEvent(page)
    await expect(page.getByRole('link', { name: /SH-1060/ })).toBeVisible()

    await simulateCarrierEvent(page)

    await expect(page.getByText('Already simulated. Reset the demo to run it again.')).toBeVisible()
    await expect(page.getByRole('link', { name: /SH-1060/ })).toHaveCount(1)
  })

  test('keeps the event and the New marker after a reload', async ({ page }) => {
    await page.goto('/ops/exceptions')
    await simulateCarrierEvent(page)
    await expect(page.getByRole('link', { name: /SH-1060/ })).toContainText('New')

    await page.reload()

    const card = page.getByRole('link', { name: /SH-1060/ })
    await expect(card).toBeVisible()
    await expect(card).toContainText('New')
  })

  test('clears the New marker once ops open the exception', async ({ page, isMobile }) => {
    await page.goto('/ops/exceptions')
    await simulateCarrierEvent(page)
    await page.getByRole('link', { name: /SH-1060/ }).click()
    await expect(page).toHaveURL('/ops/exceptions/SH-1060')
    if (isMobile) {
      await page.getByRole('link', { name: 'Back to exceptions' }).click()
    }

    const card = page.getByRole('link', { name: /SH-1060/ })
    await expect(card).toBeVisible()
    await expect(card).not.toContainText('New')
  })

  test('removes SH-1060 from the inbox and allows a new simulation after Reset demo', async ({ page }) => {
    await page.goto('/ops/exceptions')
    await simulateCarrierEvent(page)
    await expect(page.getByRole('link', { name: /SH-1060/ })).toBeVisible()

    await page.getByRole('button', { name: 'Reset demo' }).click()

    await expect(page.getByText('Demo reset')).toBeVisible()
    await expect(page.getByRole('link', { name: /SH-1060/ })).toHaveCount(0)
    await expect(page.getByLabel('Inbox summary')).toContainText(/Need attention\s*5/)
    await simulateCarrierEvent(page)
    await expect(page.getByText('New carrier event: SH-1060 vessel rolled to next sailing')).toBeVisible()
  })

  test('shows customers the toast without a View action', async ({ page }) => {
    await page.goto('/customers/nordwerk/shipments')

    await simulateCarrierEvent(page)

    await expect(page.getByText('New carrier event: SH-1060 vessel rolled to next sailing')).toBeVisible()
    await expect(page.getByRole('button', { name: 'View' })).toHaveCount(0)
  })
})
