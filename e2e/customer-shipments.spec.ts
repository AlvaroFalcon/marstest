import { expect, test, type Page } from '@playwright/test'

test.use({ colorScheme: 'light' })

const nordwerkIds = ['SH-1058', 'SH-1035', 'SH-1042', 'SH-1051', 'SH-1053', 'SH-1009']

async function expectShipmentsInOrder(page: Page, shipmentIds: string[]) {
  // The table link is named by the id and the card link starts with it, so one locator serves both layouts.
  const links = page.getByRole('main').getByRole('link', { name: /^SH-\d+/ })
  await expect(links).toHaveCount(shipmentIds.length)
  for (const [index, shipmentId] of shipmentIds.entries()) {
    await expect(links.nth(index)).toContainText(shipmentId)
  }
}

test.describe('customer shipments list', () => {
  test('lists only the shipments of the customer with the footer count', async ({ page }) => {
    await page.goto('/customers/nordwerk/shipments')

    await expect(page.getByRole('heading', { level: 1, name: 'Your shipments' })).toBeVisible()
    await expectShipmentsInOrder(page, nordwerkIds)
    await expect(page.getByText('Showing 6 of 6')).toBeVisible()
    await expect(page.getByRole('main')).not.toContainText('SH-1037')
  })

  test('shows not found for the shipment URL of another customer', async ({ page }) => {
    await page.goto('/customers/nordwerk/shipments/SH-1037')

    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Your shipments' })).toHaveCount(0)
  })

  test('shows the list for the shipment URL of the customer', async ({ page }) => {
    await page.goto('/customers/nordwerk/shipments/SH-1042')

    await expect(page.getByRole('heading', { level: 1, name: 'Your shipments' })).toBeVisible()
    await expect(page.getByText('Showing 6 of 6')).toBeVisible()
  })

  test('shows the alert for the most urgent shipment and selects Needs attention from +2 more', async ({ page }) => {
    await page.goto('/customers/nordwerk/shipments')

    const banner = page.getByRole('region', { name: 'Shipment alert' })
    await expect(banner).toContainText('SH-1042')
    await expect(banner.getByRole('link', { name: 'View shipment SH-1042' })).toBeVisible()
    await banner.getByRole('button', { name: 'Show 2 more shipments that need attention' }).click()

    await expect(page).toHaveURL('/customers/nordwerk/shipments?tab=needsAttention')
    await expect(page.getByRole('tab', { name: 'Needs attention · 4' })).toHaveAttribute('aria-selected', 'true')
    await expectShipmentsInOrder(page, ['SH-1058', 'SH-1035', 'SH-1042', 'SH-1051'])
  })

  test('shows the alert without a more button for Alpen', async ({ page }) => {
    await page.goto('/customers/alpen-werkzeug/shipments')

    const banner = page.getByRole('region', { name: 'Shipment alert' })

    await expect(banner).toContainText('SH-1037')
    await expect(banner.getByRole('button')).toHaveCount(0)
  })

  test('shows no alert for Brenner', async ({ page }) => {
    await page.goto('/customers/brenner-iberia/shipments')

    await expect(page.getByText('Showing 5 of 5')).toBeVisible()
    await expect(page.getByRole('region', { name: 'Shipment alert' })).toHaveCount(0)
  })

  test('filters by the Delivered tab and writes it to the URL', async ({ page }) => {
    await page.goto('/customers/nordwerk/shipments')

    await page.getByRole('tab', { name: 'Delivered · 1' }).click()

    await expect(page).toHaveURL('/customers/nordwerk/shipments?tab=delivered')
    await expectShipmentsInOrder(page, ['SH-1009'])
    await expect(page.getByText('Showing 1 of 1')).toBeVisible()
  })

  test('searches by purchase order and keeps the tab counts', async ({ page }) => {
    await page.goto('/customers/nordwerk/shipments')

    await page.getByRole('searchbox', { name: 'Search your shipments' }).fill('4500-1189')

    await expectShipmentsInOrder(page, ['SH-1035'])
    await expect(page).toHaveURL('/customers/nordwerk/shipments?q=4500-1189')
    await expect(page.getByRole('tab', { name: 'All · 6' })).toBeVisible()
  })

  test('shows the empty state of an empty tab and of a search, and clears the search', async ({ page }) => {
    await page.goto('/customers/alpen-werkzeug/shipments?tab=delivered')

    await expect(page.getByText('No shipments to show')).toBeVisible()

    await page.goto('/customers/nordwerk/shipments')
    await page.getByRole('searchbox', { name: 'Search your shipments' }).fill('zzzz-no-match')
    await expect(page.getByText('No shipments to show')).toBeVisible()
    await page.getByRole('button', { name: 'Clear search' }).click()

    await expect(page.getByText('Showing 6 of 6')).toBeVisible()
    await expect(page).toHaveURL('/customers/nordwerk/shipments')
  })

  test('changes tab with the keyboard and opens a shipment with Enter', async ({ page }) => {
    await page.goto('/customers/nordwerk/shipments')
    await expect(page.getByText('Showing 6 of 6')).toBeVisible()

    await page.getByRole('tab', { name: 'All · 6' }).focus()
    await page.keyboard.press('ArrowRight')

    await expect(page).toHaveURL('/customers/nordwerk/shipments?tab=needsAttention')

    await page.getByRole('main').getByRole('link', { name: /^SH-1058/ }).focus()
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL('/customers/nordwerk/shipments/SH-1058?tab=needsAttention')
    await expect(page.getByRole('heading', { level: 1, name: 'Your shipments' })).toBeVisible()
  })

  test('has no horizontal scroll at 375 px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/customers/nordwerk/shipments')
    await expectShipmentsInOrder(page, nordwerkIds)

    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )

    expect(hasHorizontalScroll).toBe(false)
  })
})
