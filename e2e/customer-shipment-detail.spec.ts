import { expect, test, type Page } from '@playwright/test'

test.use({ colorScheme: 'light' })

async function expectNoHorizontalScroll(page: Page) {
  const hasHorizontalScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )

  expect(hasHorizontalScroll).toBe(false)
}

test.describe('customer shipment detail', () => {
  test('opens SH-1042 from the list with the summary, ETAs, journey and documents', async ({ page }) => {
    await page.goto('/customers/nordwerk/shipments')

    await page.getByRole('main').getByRole('link', { name: /^SH-1042/ }).click()

    await expect(page).toHaveURL('/customers/nordwerk/shipments/SH-1042')
    await expect(page.getByRole('heading', { level: 1, name: 'SH-1042 · Zaragoza → Birmingham' })).toBeVisible()
    await expect(page.getByText('At risk', { exact: true })).toBeVisible()
    await expect(page.getByText('No update for 25 h')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'AI summary' })).toBeVisible()
    await expect(page.getByText(/^Your order left our Zaragoza plant on Oct 14 and reached Southampton port on Oct 19\./)).toBeVisible()
    await expect(page.getByText('Based on 6 carrier events')).toBeVisible()
    await expect(page.getByText('Carrier ETA', { exact: true })).toBeVisible()
    await expect(page.getByText('Our estimate', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Journey' })).toBeVisible()
    await expect(page.getByRole('list', { name: 'Shipment journey' }).getByRole('listitem')).toHaveCount(4)
    await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Download Commercial invoice' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Download Bill of lading' })).toBeVisible()
    await expect(page.getByText('Pending', { exact: true })).toBeVisible()
    await expect(page.getByText('After delivery', { exact: true })).toBeVisible()
  })

  test('confirms a simulated document download with a toast', async ({ page }) => {
    await page.goto('/customers/nordwerk/shipments/SH-1042')

    await page.getByRole('button', { name: 'Download Commercial invoice' }).click()

    await expect(page.getByText('Download started (simulated)')).toBeVisible()
  })

  test('shows no actions, no hint and no source events on the journey and the evidence', async ({ page }) => {
    await page.goto('/customers/nordwerk/shipments/SH-1042')
    await expect(page.getByRole('heading', { name: 'Journey' })).toBeVisible()

    await expect(page.getByText(/Click a step|Tap a step/)).toHaveCount(0)
    await expect(page.getByRole('list', { name: 'Shipment journey' }).getByRole('button')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /events/i })).toHaveCount(0)
  })

  test('shows no internal data to the customer', async ({ page }) => {
    await page.goto('/customers/nordwerk/shipments/SH-1042')
    await expect(page.getByRole('heading', { name: 'AI summary' })).toBeVisible()

    await expect(page.getByText('Document check')).toHaveCount(0)
    await expect(page.getByText('AI diagnosis')).toHaveCount(0)
    await expect(page.getByText(/Exception open/)).toHaveCount(0)
    await expect(page.getByText(/Hello Nordwerk team/)).toHaveCount(0)
    await expect(page.getByText(/HS code/)).toHaveCount(0)
    await expect(page.getByText('Packing list')).toHaveCount(0)
    await expect(page.getByText('Customs declaration')).toHaveCount(0)
    await expect(page.getByRole('region', { name: 'Actions' })).toHaveCount(0)
  })

  test('shows the delivery against the plan and the signed proof of delivery for SH-1009', async ({ page }) => {
    await page.goto('/customers/nordwerk/shipments')
    await page.getByRole('main').getByRole('link', { name: /^SH-1009/ }).click()

    await expect(page.getByRole('heading', { level: 1, name: 'SH-1009 · Zaragoza → Hamburg' })).toBeVisible()
    // The full text is the accessible one; the compact copy is what narrow layouts show.
    await expect(page.getByText('Final status · no further updates')).toBeAttached()
    await expect(page.getByText('Oct 18 · 10:00')).toBeVisible()
    await expect(page.getByText('Source: Transauto API · proof of delivery signed')).toBeVisible()
    await expect(page.getByText('Planned at dispatch')).toBeVisible()
    await expect(page.getByText('1 day early')).toBeVisible()
    await expect(page.getByText('Carrier ETA', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Our estimate', { exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: 'Download Proof of delivery (signed)' }).click()
    await expect(page.getByText('Download started (simulated)')).toBeVisible()
  })

  test('goes back to the list with the tab it was left with', async ({ page }) => {
    await page.goto('/customers/nordwerk/shipments?tab=needsAttention')
    await page.getByRole('main').getByRole('link', { name: /^SH-1042/ }).click()
    await expect(page).toHaveURL('/customers/nordwerk/shipments/SH-1042?tab=needsAttention')

    await page.getByRole('link', { name: 'Back to your shipments' }).click()

    await expect(page).toHaveURL('/customers/nordwerk/shipments?tab=needsAttention')
    await expect(page.getByRole('tab', { name: 'Needs attention · 4' })).toHaveAttribute('aria-selected', 'true')
  })

  test('shows not found for a shipment of another customer', async ({ page }) => {
    await page.goto('/customers/nordwerk/shipments/SH-1037')

    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
    await expect(page.getByText('SH-1037')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'AI summary' })).toHaveCount(0)
  })

  test('shows not found for an unknown shipment', async ({ page }) => {
    await page.goto('/customers/nordwerk/shipments/SH-9999')

    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  })

  test('has no horizontal scroll at 375 px for an in-transit and a delivered shipment', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/customers/nordwerk/shipments/SH-1042')
    await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible()
    await expectNoHorizontalScroll(page)

    await page.goto('/customers/nordwerk/shipments/SH-1009')
    await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible()

    await expectNoHorizontalScroll(page)
  })
})
