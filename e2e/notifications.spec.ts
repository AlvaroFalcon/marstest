import { expect, test, type Page } from '@playwright/test'

test.use({ colorScheme: 'light' })

const simulateButtonName = /^Simulate (carrier )?event$/

async function simulateCarrierEvent(page: Page, headline: string) {
  await page.getByRole('button', { name: simulateButtonName }).click()
  await expect(page.getByText(headline)).toBeVisible()
}

/** Reloading drops the toast (it can cover the top of the sheet on mobile); the demo state survives. */
async function missTheToast(page: Page) {
  await page.reload()
}

test.describe('notification center', () => {
  test('shows the empty state before any event', async ({ page }) => {
    await page.goto('/ops/exceptions')

    await page.getByRole('button', { name: 'Notifications' }).click()

    await expect(page.getByText('No notifications yet')).toBeVisible()
    await expect(page.getByText('Carrier events you simulate show up here.')).toBeVisible()
  })

  test('finds a missed event in the bell and opens its exception', async ({ page }) => {
    await page.goto('/ops/exceptions')
    await simulateCarrierEvent(page, 'SH-1060: vessel rolled to the next sailing')
    await missTheToast(page)
    await expect(page.getByRole('button', { name: 'Notifications, 1 unread' })).toBeVisible()

    await page.getByRole('button', { name: 'Notifications, 1 unread' }).click()
    await expect(page.getByText('Just now')).toBeVisible()
    await page.getByRole('button', { name: /SH-1060: vessel rolled to the next sailing/ }).click()

    await expect(page).toHaveURL('/ops/exceptions/SH-1060')
    await expect(page.getByRole('button', { name: 'Notifications', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: /unread/ })).toHaveCount(0)
  })

  test('marks the notification read when the toast View action is used', async ({ page }) => {
    await page.goto('/ops/exceptions')
    await page.getByRole('button', { name: simulateButtonName }).click()
    await expect(page.getByRole('button', { name: 'Notifications, 1 unread' })).toBeVisible()

    await page.getByRole('button', { name: 'View' }).click()

    await expect(page).toHaveURL('/ops/exceptions/SH-1060')
    await expect(page.getByRole('button', { name: 'Notifications', exact: true })).toBeVisible()
  })

  test('lists the newest event first with an unread marker', async ({ page }) => {
    await page.goto('/ops/exceptions')
    await simulateCarrierEvent(page, 'SH-1060: vessel rolled to the next sailing')
    await simulateCarrierEvent(page, 'SH-1053: vessel waiting for a berth in Rotterdam')
    await missTheToast(page)

    await page.getByRole('button', { name: 'Notifications, 2 unread' }).click()

    const rows = page.getByRole('button', { name: /SH-10(60|53):/ })
    await expect(rows).toHaveCount(2)
    await expect(rows.nth(0)).toContainText('SH-1053: vessel waiting for a berth in Rotterdam')
    await expect(rows.nth(1)).toContainText('SH-1060: vessel rolled to the next sailing')
    await expect(page.getByText('Unread')).toHaveCount(2)
  })

  test('lists a Nordwerk event for ops', async ({ page }) => {
    await page.goto('/customers/nordwerk/shipments')
    await simulateCarrierEvent(page, 'SH-1053: vessel waiting for a berth in Rotterdam')

    await page.goto('/ops/exceptions')

    await expect(page.getByRole('button', { name: 'Notifications, 1 unread' })).toBeVisible()
  })

  test('lists a Nordwerk event for Nordwerk', async ({ page }) => {
    await page.goto('/customers/nordwerk/shipments')
    await simulateCarrierEvent(page, 'SH-1053: vessel waiting for a berth in Rotterdam')

    await missTheToast(page)

    await expect(page.getByRole('button', { name: 'Notifications, 1 unread' })).toBeVisible()
  })

  test('hides a Nordwerk event from Alpen Werkzeug', async ({ page }) => {
    await page.goto('/customers/nordwerk/shipments')
    await simulateCarrierEvent(page, 'SH-1053: vessel waiting for a berth in Rotterdam')

    await page.goto('/customers/alpen-werkzeug/shipments')
    await page.getByRole('button', { name: 'Notifications', exact: true }).click()

    await expect(page.getByText('No notifications yet')).toBeVisible()
  })

  test('keeps the read state of each viewer separate', async ({ page }) => {
    await page.goto('/customers/nordwerk/shipments')
    await simulateCarrierEvent(page, 'SH-1053: vessel waiting for a berth in Rotterdam')
    await missTheToast(page)
    await page.getByRole('button', { name: 'Notifications, 1 unread' }).click()
    await page.getByRole('button', { name: /SH-1053: vessel waiting/ }).click()
    await expect(page).toHaveURL('/customers/nordwerk/shipments/SH-1053')
    await expect(page.getByRole('button', { name: 'Notifications', exact: true })).toBeVisible()

    await page.goto('/ops/exceptions')

    await expect(page.getByRole('button', { name: 'Notifications, 1 unread' })).toBeVisible()
  })

  test('empties the notifications after Reset demo', async ({ page }) => {
    await page.goto('/ops/exceptions')
    await simulateCarrierEvent(page, 'SH-1060: vessel rolled to the next sailing')
    await page.getByRole('button', { name: 'Reset demo' }).click()
    await expect(page.getByText('Demo reset')).toBeVisible()
    await missTheToast(page)

    await page.getByRole('button', { name: 'Notifications', exact: true }).click()

    await expect(page.getByText('No notifications yet')).toBeVisible()
  })
})
