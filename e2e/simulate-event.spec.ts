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

    await expect(page.getByText('SH-1060: vessel rolled to the next sailing')).toBeVisible()
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
    await expect(page.getByText('SH-1060: vessel rolled to the next sailing')).toBeVisible()
  })

  test('applies the second ops event on SH-1053 and opens its exception', async ({ page }) => {
    await page.goto('/ops/exceptions')
    await simulateCarrierEvent(page)
    await expect(page.getByText('SH-1060: vessel rolled to the next sailing')).toBeVisible()

    await simulateCarrierEvent(page)

    await expect(page.getByText('SH-1053: vessel waiting for a berth in Rotterdam')).toBeVisible()
    await expect(page.getByRole('link', { name: /SH-1053/ })).toBeVisible()
    await expect(page.getByLabel('Inbox summary')).toContainText(/Need attention\s*7/)
  })

  test('sends ops to the shipment detail from the View action of an event that closes an exception', async ({ page }) => {
    await page.goto('/ops/exceptions')
    await simulateCarrierEvent(page)
    await expect(page.getByText('SH-1060: vessel rolled to the next sailing')).toBeVisible()
    await simulateCarrierEvent(page)
    await expect(page.getByText('SH-1053: vessel waiting for a berth in Rotterdam')).toBeVisible()
    await page.reload()
    await expect(page.getByRole('link', { name: /SH-1053/ })).toBeVisible()
    await simulateCarrierEvent(page)
    await expect(page.getByText('SH-1042: customs released the container')).toBeVisible()

    await page.getByRole('button', { name: 'View' }).click()

    await expect(page).toHaveURL('/ops/shipments/SH-1042')
    await expect(page.getByRole('heading', { level: 1, name: /^SH-1042/ })).toBeVisible()
  })

  test('removes the closed exception from the inbox', async ({ page }) => {
    await page.goto('/ops/exceptions')
    await expect(page.getByRole('link', { name: /SH-1042/ })).toBeVisible()
    for (let click = 0; click < 3; click += 1) {
      await simulateCarrierEvent(page)
    }

    await expect(page.getByText('SH-1042: customs released the container')).toBeVisible()

    await expect(page.getByRole('link', { name: /SH-1042/ })).toHaveCount(0)
    await expect(page.getByLabel('Inbox summary')).toContainText(/Need attention\s*6/)
  })

  test.describe('customer view', () => {
    test('walks the three Nordwerk events and then says there are no more', async ({ page }) => {
      await page.goto('/customers/nordwerk/shipments')

      await simulateCarrierEvent(page)
      await expect(page.getByText('SH-1053: vessel waiting for a berth in Rotterdam')).toBeVisible()
      await simulateCarrierEvent(page)
      await expect(page.getByText('SH-1042: customs released the container')).toBeVisible()
      await simulateCarrierEvent(page)
      await expect(page.getByText('SH-1035: a second driver took over, truck back on the road')).toBeVisible()
      await simulateCarrierEvent(page)

      await expect(page.getByText('No more events here. Reset the demo to run them again.')).toBeVisible()
    })

    test('opens the customer shipment detail from the View action', async ({ page }) => {
      await page.goto('/customers/nordwerk/shipments')

      await simulateCarrierEvent(page)
      await page.getByRole('button', { name: 'View' }).click()

      await expect(page).toHaveURL('/customers/nordwerk/shipments/SH-1053')
      await expect(page.getByRole('heading', { level: 1, name: /^SH-1053/ })).toBeVisible()
    })

    test('runs the first Alpen event on its own shipment SH-1037', async ({ page }) => {
      await page.goto('/customers/alpen-werkzeug/shipments')

      await simulateCarrierEvent(page)

      await expect(page.getByText('SH-1037: cleared the Swiss border')).toBeVisible()
    })

    test('shows in ops the event applied from the customer view and skips it in the ops script', async ({ page }) => {
      await page.goto('/customers/nordwerk/shipments')
      await simulateCarrierEvent(page)
      await expect(page.getByText('SH-1053: vessel waiting for a berth in Rotterdam')).toBeVisible()

      await page.goto('/ops/exceptions')

      const card = page.getByRole('link', { name: /SH-1053/ })
      await expect(card).toBeVisible()
      await expect(card).toContainText('New')
      await expect(page.getByLabel('Inbox summary')).toContainText(/Need attention\s*6/)
      await simulateCarrierEvent(page)
      await expect(page.getByText('SH-1060: vessel rolled to the next sailing')).toBeVisible()
      await simulateCarrierEvent(page)
      await expect(page.getByText('SH-1042: customs released the container')).toBeVisible()
    })

    test('restarts the customer script after Reset demo', async ({ page }) => {
      await page.goto('/customers/nordwerk/shipments')
      await simulateCarrierEvent(page)
      await expect(page.getByText('SH-1053: vessel waiting for a berth in Rotterdam')).toBeVisible()

      await page.reload()
      await page.getByRole('button', { name: 'Reset demo' }).click()
      await expect(page.getByText('Demo reset')).toBeVisible()
      await page.reload()
      await simulateCarrierEvent(page)

      await expect(page.getByText('SH-1053: vessel waiting for a berth in Rotterdam')).toBeVisible()
    })
  })
})
