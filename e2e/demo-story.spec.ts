import { expect, test } from '@playwright/test'

test.use({ colorScheme: 'light' })

test.describe('demo story', () => {
  test('walks from the ops inbox to the approved notice, the customer view and a simulated carrier event', async ({ page, isMobile }) => {
    await page.goto('/ops/exceptions')
    await page.getByRole('link', { name: /SH-1042/ }).click()
    await expect(page.getByRole('heading', { level: 1, name: /^SH-1042/ })).toBeVisible()

    await page.getByRole('button', { name: 'Approve and send' }).click()

    await expect(page.getByText('Notice sent to Nordwerk GmbH')).toBeVisible()
    await expect(page.getByText(/Customer notified · /)).toBeVisible()

    await page.getByRole('combobox', { name: 'Viewing as' }).click()
    await page.getByRole('option', { name: 'Nordwerk GmbH' }).click()

    await expect(page).toHaveURL('/customers/nordwerk/shipments')
    const banner = page.getByRole('region', { name: 'Shipment alert' })
    await expect(banner).toContainText('SH-1042')
    // Narrow viewports render the compact wording of the same alert.
    if (isMobile) {
      await expect(banner).toContainText('delayed:')
      await expect(banner).toContainText('New estimate')
    }
    else {
      await expect(banner).toContainText('will arrive later than planned')
      await expect(banner).toContainText('New estimate:')
    }

    await page.getByRole('main').getByRole('link', { name: /^SH-1042/ }).click()

    await expect(page).toHaveURL('/customers/nordwerk/shipments/SH-1042')
    await expect(page.getByText('Carrier ETA', { exact: true })).toBeVisible()
    await expect(page.getByText('Our estimate', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: /^Simulate (carrier )?event$/ }).click()

    await expect(page.getByText('New carrier event: SH-1060 vessel rolled to next sailing')).toBeVisible()
    await page.getByRole('combobox', { name: 'Viewing as' }).click()
    await page.getByRole('option', { name: 'Ops · Spain sites' }).click()
    await expect(page).toHaveURL('/ops/exceptions')
    await expect(page.getByRole('link', { name: /SH-1060/ })).toContainText('New')
    if (!isMobile) {
      await expect(page.getByRole('link', { name: /SH-1042/ })).toContainText('Customer notified')
    }
  })
})
