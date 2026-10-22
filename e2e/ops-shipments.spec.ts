import { expect, test, type Page } from '@playwright/test'

test.use({ colorScheme: 'light' })

const firstPageIds = ['SH-1029', 'SH-1037', 'SH-1035', 'SH-1042', 'SH-1039', 'SH-1048', 'SH-1051', 'SH-1033']
const secondPageIds = ['SH-1034', 'SH-1053', 'SH-1047', 'SH-1060', 'SH-1066', 'SH-1009', 'SH-1012', 'SH-1044']

async function expectShipmentsInOrder(page: Page, shipmentIds: string[]) {
  // The table link is named by the id and the card link starts with it, so one locator serves both layouts.
  const links = page.getByRole('main').getByRole('link', { name: /^SH-\d+/ })
  await expect(links).toHaveCount(shipmentIds.length)
  for (const [index, shipmentId] of shipmentIds.entries()) {
    await expect(links.nth(index)).toContainText(shipmentId)
  }
}

test.describe('all shipments list', () => {
  test('lists the first page of shipments with the footer count', async ({ page }) => {
    await page.goto('/ops/shipments')

    await expect(page.getByRole('heading', { level: 1, name: 'All shipments' })).toBeVisible()
    await expectShipmentsInOrder(page, firstPageIds)
    await expect(page.getByText('Showing 8 of 16')).toBeVisible()
  })

  test('searches by shipment id and writes the search to the URL', async ({ page }) => {
    await page.goto('/ops/shipments')

    await page.getByRole('searchbox', { name: 'Search shipments' }).fill('SH-1047')

    await expectShipmentsInOrder(page, ['SH-1047'])
    await expect(page.getByText('Showing 1 of 1')).toBeVisible()
    await expect(page).toHaveURL('/ops/shipments?q=SH-1047')
  })

  test('shows the empty state and clears the filters', async ({ page }) => {
    await page.goto('/ops/shipments')
    await page.getByRole('searchbox', { name: 'Search shipments' }).fill('zzzz-no-match')

    await expect(page.getByText('No shipments match your filters')).toBeVisible()
    await page.getByRole('button', { name: 'Clear filters' }).click()

    await expect(page.getByText('Showing 8 of 16')).toBeVisible()
    await expect(page).toHaveURL('/ops/shipments')
  })

  test('filters by status and resets to page 1', async ({ page }) => {
    await page.goto('/ops/shipments?page=2')

    await page.getByRole('button', { name: 'Status: all' }).click()
    await page.getByRole('radio', { name: 'At risk' }).click()

    await expect(page).toHaveURL('/ops/shipments?status=atRisk')
    await expectShipmentsInOrder(page, ['SH-1037', 'SH-1035', 'SH-1042', 'SH-1051'])
    await expect(page.getByText('Showing 4 of 4')).toBeVisible()
  })

  test('filters by site and resets to page 1', async ({ page }) => {
    await page.goto('/ops/shipments?page=2')

    await page.getByRole('button', { name: /^(All )?[Mm]y sites/ }).click()
    await page.getByRole('radio', { name: /Barcelona warehouse/ }).click()

    await expect(page).toHaveURL('/ops/shipments?site=barcelona-warehouse')
    await expect(page.getByText('Showing 3 of 3')).toBeVisible()
  })

  test('sorts by confidence, highest first', async ({ page, isMobile }) => {
    await page.goto('/ops/shipments')

    if (isMobile) {
      await page.getByRole('combobox', { name: 'Sort by' }).click()
      await page.getByRole('option', { name: 'Confidence, highest first' }).click()
    }
    else {
      await page.getByRole('button', { name: 'Our estimate · Confidence' }).click()
      await expect(page.getByRole('columnheader', { name: 'Our estimate · Confidence' })).toHaveAttribute('aria-sort', 'descending')
    }

    await expect(page).toHaveURL('/ops/shipments?sort=confidenceDesc')
    await expect(page.getByText('Showing 8 of 16')).toBeVisible()
  })

  test('goes to page 2 and back to page 1', async ({ page }) => {
    await page.goto('/ops/shipments')

    await page.getByRole('button', { name: 'Next page' }).click()

    await expect(page).toHaveURL('/ops/shipments?page=2')
    await expectShipmentsInOrder(page, secondPageIds)
    await expect(page.getByText('Showing 8 of 16')).toBeVisible()

    await page.getByRole('button', { name: 'Previous page' }).click()

    await expect(page).toHaveURL('/ops/shipments')
    await expectShipmentsInOrder(page, firstPageIds)
  })

  test('keeps the column widths when changing page and sort on desktop', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Narrow viewports show cards, not the table')
    await page.goto('/ops/shipments')
    const headers = page.getByRole('columnheader')
    await expect(page.getByText('Showing 8 of 16')).toBeVisible()
    const widthsBefore = await headers.evaluateAll(cells => cells.map(cell => cell.getBoundingClientRect().width))

    await page.getByRole('button', { name: 'Next page' }).click()
    await expect(page).toHaveURL('/ops/shipments?page=2')
    const widthsAfterPage = await headers.evaluateAll(cells => cells.map(cell => cell.getBoundingClientRect().width))
    await page.getByRole('button', { name: 'Our estimate · Confidence' }).click()
    await expect(page.getByRole('columnheader', { name: 'Our estimate · Confidence' })).toHaveAttribute('aria-sort', 'descending')
    const widthsAfterSort = await headers.evaluateAll(cells => cells.map(cell => cell.getBoundingClientRect().width))

    expect(widthsAfterPage).toEqual(widthsBefore)
    expect(widthsAfterSort).toEqual(widthsBefore)
  })

  test('keeps the page and sort after a reload', async ({ page }) => {
    await page.goto('/ops/shipments?sort=carrierEtaDesc&page=2')
    await expect(page.getByRole('button', { name: 'Previous page' })).toBeEnabled()

    await page.reload()

    await expect(page).toHaveURL('/ops/shipments?sort=carrierEtaDesc&page=2')
    await expect(page.getByRole('button', { name: 'Previous page' })).toBeEnabled()
    await expect(page.getByRole('button', { name: 'Next page' })).toBeDisabled()
    await expect(page.getByText('Showing 8 of 16')).toBeVisible()
  })

  test('keeps the status filter after a reload', async ({ page }) => {
    await page.goto('/ops/shipments?status=atRisk')
    await expect(page.getByText('Showing 4 of 4')).toBeVisible()

    await page.reload()

    await expect(page).toHaveURL('/ops/shipments?status=atRisk')
    await expect(page.getByRole('button', { name: 'Status: At risk' })).toBeVisible()
    await expect(page.getByText('Showing 4 of 4')).toBeVisible()
  })

  test('opens the shipment detail of a shipment that has an open exception', async ({ page }) => {
    await page.goto('/ops/shipments')

    await page.getByRole('link', { name: /^SH-1029/ }).click()

    await expect(page).toHaveURL('/ops/shipments/SH-1029')
    await expect(page.getByRole('heading', { level: 1, name: /^SH-1029/ })).toBeVisible()
  })

  test('opens the shipment detail of a shipment without an exception', async ({ page }) => {
    await page.goto('/ops/shipments?page=2')

    await page.getByRole('link', { name: /^SH-1053/ }).click()

    await expect(page).toHaveURL('/ops/shipments/SH-1053?page=2')
    await expect(page.getByRole('heading', { level: 1, name: /^SH-1053/ })).toBeVisible()
  })

  test('has no horizontal scroll at 375 px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/ops/shipments')
    await expectShipmentsInOrder(page, firstPageIds)

    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )

    expect(hasHorizontalScroll).toBe(false)
  })
})
