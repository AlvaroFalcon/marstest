import { expect, test, type Page } from '@playwright/test'

test.use({ colorScheme: 'light' })

async function expectNoHorizontalScroll(page: Page) {
  const hasHorizontalScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )

  expect(hasHorizontalScroll).toBe(false)
}

test.describe('ops shipment detail states', () => {
  test('on track: estimate in line, no open exception and manual actions only', async ({ page }) => {
    await page.goto('/ops/shipments/SH-1033')

    await expect(page.getByRole('heading', { level: 1, name: 'SH-1033 · Zaragoza → Basel' })).toBeVisible()
    await expect(page.getByText('On time', { exact: true })).toBeVisible()
    await expect(page.getByText('No open exception').first()).toBeAttached()
    await expect(page.getByText('In line with the carrier ETA, no deviation expected')).toBeVisible()
    await expect(page.getByRole('heading', { name: /^AI signal/ })).toHaveCount(0)
    const actions = page.getByRole('region', { name: 'Actions' })
    await expect(actions.getByText('Nothing needs your attention.')).toBeVisible()
    await expect(actions.getByRole('button')).toHaveCount(3)
    await expect(actions.getByRole('link')).toHaveCount(0)
  })

  test('watching: AI signal, not alerting the customer yet and a suggested carrier confirmation', async ({ page }) => {
    await page.goto('/ops/shipments/SH-1034')

    await expect(page.getByText('Watching', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'AI signal · possible delay' })).toBeVisible()
    await expect(page.getByText(/12 km\/h on the A-8 near Nice/)).toBeVisible()
    const actions = page.getByRole('region', { name: 'Actions' })
    await expect(actions.getByText('Not alerting the customer yet (confidence below 75%).')).toBeVisible()
    await expect(actions.getByRole('button', { name: 'Ask EuroRuta to confirm ETA (AI draft)' })).toBeVisible()
  })

  test('predicted delay: AI signal, exception opened and a link to the exceptions inbox', async ({ page }) => {
    await page.goto('/ops/shipments/SH-1035')

    await expect(page.getByText('At risk', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'AI signal · delay very likely' })).toBeVisible()
    await expect(page.getByText('Exception opened').first()).toBeAttached()
    const actions = page.getByRole('region', { name: 'Actions' })
    await expect(actions.getByText('Exception opened: confidence above 75%. Draft ready for review.')).toBeVisible()

    await actions.getByRole('link', { name: 'Open in exceptions inbox' }).click()

    await expect(page).toHaveURL('/ops/exceptions/SH-1035')
    await expect(page.getByRole('heading', { level: 1, name: /^SH-1035/ })).toBeVisible()
  })

  test('shows the exception layer for a shipment with another open exception', async ({ page }) => {
    await page.goto('/ops/shipments/SH-1042')

    await expect(page.getByText('Customs hold', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'AI diagnosis' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Open in exceptions inbox' })).toHaveAttribute('href', '/ops/exceptions/SH-1042')
  })

  test('shows the document check in every state', async ({ page }) => {
    await page.goto('/ops/shipments/SH-1034')

    await expect(page.getByRole('heading', { name: 'Document check' })).toBeVisible()
    await expect(page.getByRole('list', { name: 'Documents checked against the ERP order' }).getByRole('listitem').first()).toBeVisible()
  })

  test('confirms a simulated action with a toast', async ({ page }) => {
    await page.goto('/ops/shipments/SH-1034')

    await page.getByRole('button', { name: 'Message customer' }).click()

    await expect(page.getByText('Message to Alpen Werkzeug AG sent (simulated)')).toBeVisible()
  })

  test('shows the same unavailable message for an unknown and an out-of-scope shipment', async ({ page }) => {
    await page.goto('/ops/shipments/SH-9999')
    await expect(page.getByText('This shipment isn\'t available')).toBeVisible()

    await page.goto('/ops/shipments/SH-1058')

    await expect(page.getByText('This shipment isn\'t available')).toBeVisible()
  })
})

test.describe('ops shipment detail navigation', () => {
  test('goes back to the list with its filters', async ({ page }) => {
    await page.goto('/ops/shipments?status=atRisk')
    await page.getByRole('link', { name: /^SH-1035/ }).click()
    await expect(page).toHaveURL('/ops/shipments/SH-1035?status=atRisk')

    await page.getByRole('link', { name: 'Back to all shipments' }).click()

    await expect(page).toHaveURL('/ops/shipments?status=atRisk')
    await expect(page.getByText('Showing 4 of 4')).toBeVisible()
  })

  test('opens the source events from the AI evidence and returns focus when closed', async ({ page }) => {
    await page.goto('/ops/shipments/SH-1034')
    const evidence = page.getByRole('button', { name: 'Based on 9 GPS pings and 1 traffic feed' })

    await evidence.focus()
    await page.keyboard.press('Enter')

    await expect(page.getByRole('dialog', { name: 'Source events · SH-1034' })).toBeVisible()
    await expect(page).toHaveURL('/ops/shipments/SH-1034?events=open')
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(evidence).toBeFocused()
  })

  test('reaches the actions with the keyboard', async ({ page }) => {
    await page.goto('/ops/shipments/SH-1033')
    const contactCarrier = page.getByRole('button', { name: 'Contact carrier (EuroRuta)' })

    await contactCarrier.focus()
    await page.keyboard.press('Tab')

    await expect(page.getByRole('button', { name: 'Message customer' })).toBeFocused()
  })
})

test.describe('ops shipment detail layout', () => {
  for (const shipmentId of ['SH-1033', 'SH-1034', 'SH-1035']) {
    test(`has no horizontal scroll at 375 px for ${shipmentId}`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 })
      await page.goto(`/ops/shipments/${shipmentId}`)
      await expect(page.getByRole('heading', { level: 1, name: new RegExp(`^${shipmentId}`) })).toBeVisible()

      await expectNoHorizontalScroll(page)
    })
  }
})
