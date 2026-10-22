import { expect, test, type Page } from '@playwright/test'

test.use({ colorScheme: 'light' })

const allSiteCards = ['SH-1042', 'SH-1051', 'SH-1037', 'SH-1035', 'SH-1029']

async function expectCardsInOrder(page: Page, shipmentIds: string[]) {
  const cards = page.getByRole('list', { name: 'Open exceptions' }).getByRole('link')
  await expect(cards).toHaveCount(shipmentIds.length)
  for (const [index, shipmentId] of shipmentIds.entries()) {
    await expect(cards.nth(index)).toContainText(shipmentId)
  }
}

test.describe('exceptions inbox', () => {
  test('lists the ops exceptions ordered by urgency with route, reason and badge', async ({ page }) => {
    await page.goto('/ops/exceptions')

    await expectCardsInOrder(page, allSiteCards)
    const firstCard = page.getByRole('link', { name: /SH-1042/ })
    await expect(firstCard).toContainText('Zaragoza → Birmingham')
    await expect(firstCard).toContainText('UK customs is holding the container at Southampton.')
    await expect(firstCard).toContainText('Customs hold')
  })

  test('shows the seed KPIs', async ({ page }) => {
    await page.goto('/ops/exceptions')

    const summary = page.getByLabel('Inbox summary')
    await expect(summary).toContainText(/Need attention\s*5/)
    await expect(summary).toContainText(/Stale over 24 h\s*2/)
    await expect(summary).toContainText('9 of 16')
  })

  test('filters by site from the trigger and updates the URL, list and KPIs', async ({ page }) => {
    await page.goto('/ops/exceptions')

    await page.getByRole('button', { name: 'All my sites (3)' }).click()
    await page.getByRole('radio', { name: 'Bilbao plant 2 exceptions' }).click()

    await expect(page).toHaveURL('/ops/exceptions?site=bilbao-plant')
    await expectCardsInOrder(page, ['SH-1051', 'SH-1029'])
    await expect(page.getByText('4 of 6')).toBeAttached()
    await expect(page.getByRole('button', { name: 'Bilbao plant (2)' })).toBeVisible()
  })

  test('shows the out-of-scope site locked in the filter', async ({ page }) => {
    await page.goto('/ops/exceptions')

    await page.getByRole('button', { name: 'All my sites (3)' }).click()

    await expect(page.getByText('Lyon warehouse · outside your scope')).toBeVisible()
    await expect(page.getByRole('radio', { name: /Lyon/ })).toHaveCount(0)
  })

  test('returns to all sites from the filter and drops the param', async ({ page }) => {
    await page.goto('/ops/exceptions?site=bilbao-plant')

    await page.getByRole('button', { name: 'Bilbao plant (2)' }).click()
    await page.getByRole('radio', { name: 'All my sites 5 exceptions' }).click()

    await expect(page).toHaveURL('/ops/exceptions')
    await expectCardsInOrder(page, allSiteCards)
  })

  test('ignores an out-of-scope site in the URL and drops the param', async ({ page }) => {
    await page.goto('/ops/exceptions?site=lyon-warehouse')

    await expect(page).toHaveURL('/ops/exceptions')
    await expectCardsInOrder(page, allSiteCards)
  })

  test('opens an exception from its card, keeping the site filter', async ({ page, isMobile }) => {
    await page.goto('/ops/exceptions?site=bilbao-plant')

    await page.getByRole('link', { name: /SH-1051/ }).click()

    await expect(page).toHaveURL('/ops/exceptions/SH-1051?site=bilbao-plant')
    if (isMobile) {
      await expect(page.getByRole('heading', { level: 1, name: /^SH-1051 · Bilbao →/ })).toBeVisible()
      await expect(page.getByRole('list', { name: 'Open exceptions' })).toHaveCount(0)
    }
    else {
      await expect(page.getByRole('link', { name: /SH-1051/ })).toHaveAttribute('aria-current', 'page')
      await expect(page.getByRole('heading', { level: 1, name: /^SH-1051 · Bilbao →/ })).toBeVisible()
    }
  })

  test('goes back from the detail to the filtered inbox on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'The back link only exists where the detail replaces the list')
    await page.goto('/ops/exceptions/SH-1051?site=bilbao-plant')

    await page.getByRole('link', { name: 'Back to exceptions' }).click()

    await expect(page).toHaveURL('/ops/exceptions?site=bilbao-plant')
    await expectCardsInOrder(page, ['SH-1051', 'SH-1029'])
  })

  test('shows the select-an-exception placeholder next to the inbox on desktop', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop shows the list and the detail side by side')
    await page.goto('/ops/exceptions')

    await expect(page.getByText('Select an exception')).toBeVisible()
  })

  test('has no horizontal scroll at 375 px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/ops/exceptions')
    await expectCardsInOrder(page, allSiteCards)

    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )

    expect(hasHorizontalScroll).toBe(false)
  })
})

test.describe('exception detail', () => {
  test('shows the SH-1042 detail with header, diagnosis and document check', async ({ page }) => {
    await page.goto('/ops/exceptions/SH-1042')

    await expect(page.getByRole('heading', { level: 1, name: 'SH-1042 · Zaragoza → Birmingham' })).toBeVisible()
    await expect(page.getByText('No update for 25 h')).toBeVisible()
    await expect(page.getByText('Nordsee Line · Email')).toBeVisible()
    await expect(page.getByText('AI diagnosis')).toBeVisible()
    const documents = page.getByRole('list', { name: 'Documents checked against the ERP order' })
    await expect(documents.getByRole('listitem')).toHaveCount(5)
    await expect(documents.getByRole('listitem').filter({ hasText: 'Commercial invoice' }))
      .toContainText('HS code 8467.29 differs from ERP order (8467.21)')
    await expect(documents.getByRole('listitem').filter({ hasText: 'Certificate of origin' }))
      .toContainText('Missing · cause of the hold')
  })

  test('shows the inbox beside the detail on desktop', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop shows the list and the detail side by side')
    await page.goto('/ops/exceptions/SH-1042')

    await expectCardsInOrder(page, allSiteCards)
    await expect(page.getByRole('heading', { level: 1, name: /^SH-1042/ })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Back to exceptions' })).toHaveCount(0)
  })

  test('shows the detail alone with a back link that keeps the site filter on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'The detail only replaces the list on narrow viewports')
    await page.goto('/ops/exceptions/SH-1051?site=bilbao-plant')

    await expect(page.getByRole('list', { name: 'Open exceptions' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Back to exceptions' })).toHaveAttribute('href', '/ops/exceptions?site=bilbao-plant')
  })

  test('opens SH-1042 from the inbox and lists its documents on mobile and desktop', async ({ page }) => {
    await page.goto('/ops/exceptions')

    await page.getByRole('link', { name: /SH-1042/ }).click()

    await expect(page).toHaveURL('/ops/exceptions/SH-1042')
    const documents = page.getByRole('list', { name: 'Documents checked against the ERP order' })
    await expect(documents.getByRole('listitem')).toHaveCount(5)
  })

  test('shows the same unavailable message for an unknown id and an out-of-scope shipment', async ({ page }) => {
    await page.goto('/ops/exceptions/SH-9999')
    await expect(page.getByText('This exception isn\'t available')).toBeVisible()

    await page.goto('/ops/exceptions/SH-1058')

    await expect(page.getByText('This exception isn\'t available')).toBeVisible()
  })
})
