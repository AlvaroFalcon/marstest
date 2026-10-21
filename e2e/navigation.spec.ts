import { expect, test } from '@playwright/test'

test.use({ colorScheme: 'light' })

test.describe('ops tabs', () => {
  test('shows the exception and shipment counts of the ops scope', async ({ page }) => {
    await page.goto('/ops/exceptions')

    await expect(page.getByRole('link', { name: /^Exceptions\s*5$/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /^All shipments\s*16$/ })).toBeVisible()
  })

  test('moves between the exceptions and all-shipments tabs', async ({ page }) => {
    await page.goto('/ops/exceptions')

    await page.getByRole('link', { name: /^All shipments/ }).click()

    await expect(page).toHaveURL('/ops/shipments')
    await expect(page.getByRole('heading', { name: 'All shipments' })).toBeVisible()
    await expect(page.getByRole('link', { name: /^All shipments/ })).toHaveAttribute('aria-current', 'page')

    await page.getByRole('link', { name: /^Exceptions/ }).click()

    await expect(page).toHaveURL('/ops/exceptions')
    await expect(page.getByRole('heading', { name: 'Exceptions inbox' })).toBeVisible()
    await expect(page.getByRole('link', { name: /^Exceptions/ })).toHaveAttribute('aria-current', 'page')
  })
})

test.describe('viewing as', () => {
  test('lists Ops and the three customers', async ({ page }) => {
    await page.goto('/ops/exceptions')

    await page.getByRole('combobox', { name: 'Viewing as' }).click()

    await expect(page.getByRole('option')).toHaveText([
      'Ops · Spain sites',
      'Nordwerk GmbH',
      'Brenner Iberia S.L.',
      'Alpen Werkzeug AG',
    ])
  })

  test('switches from ops to a customer and back to ops', async ({ page }) => {
    await page.goto('/ops/exceptions')

    await page.getByRole('combobox', { name: 'Viewing as' }).click()
    await page.getByRole('option', { name: 'Nordwerk GmbH' }).click()

    await expect(page).toHaveURL('/customers/nordwerk/shipments')
    await expect(page.getByRole('heading', { name: 'Your shipments' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Ops views' })).toHaveCount(0)

    await page.getByRole('combobox', { name: 'Viewing as' }).click()
    await page.getByRole('option', { name: 'Ops · Spain sites' }).click()

    await expect(page).toHaveURL('/ops/exceptions')
    await expect(page.getByRole('heading', { name: 'Exceptions inbox' })).toBeVisible()
  })

  test('switches between customers', async ({ page }) => {
    await page.goto('/customers/nordwerk/shipments')

    await page.getByRole('combobox', { name: 'Viewing as' }).click()
    await page.getByRole('option', { name: 'Alpen Werkzeug AG' }).click()

    await expect(page).toHaveURL('/customers/alpen-werkzeug/shipments')
    await expect(page.getByText('Alpen Werkzeug AG', { exact: true }).last()).toBeVisible()
  })

  test('lands on the target list when switching from a detail page', async ({ page }) => {
    await page.goto('/ops/shipments/SH-1042')

    await page.getByRole('combobox', { name: 'Viewing as' }).click()
    await page.getByRole('option', { name: 'Brenner Iberia S.L.' }).click()

    await expect(page).toHaveURL('/customers/brenner-iberia/shipments')
  })

  test('shows page not found inside the shell for an unknown customer', async ({ page }) => {
    await page.goto('/customers/unknown-co/shipments')

    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Viewing as' })).toBeVisible()
  })
})

test.describe('demo strip', () => {
  test('shows the demo mode notice and a simulate button that changes nothing', async ({ page }) => {
    await page.goto('/ops/exceptions')

    await page.getByRole('button', { name: /Simulate/ }).click()

    await expect(page.getByText(/^Demo mode/).filter({ visible: true })).toHaveCount(1)
    await expect(page).toHaveURL('/ops/exceptions')
    await expect(page.getByRole('link', { name: /^Exceptions\s*5$/ })).toBeVisible()
  })

  test('resets the demo, shows the toast and stays on the page', async ({ page }) => {
    await page.goto('/ops/shipments')

    await page.getByRole('button', { name: 'Reset demo' }).click()

    await expect(page.getByText('Demo reset')).toBeVisible()
    await expect(page).toHaveURL('/ops/shipments')
    await expect(page.getByRole('heading', { name: 'All shipments' })).toBeVisible()
  })

  test('toggles the dark theme and keeps it after a reload', async ({ page }) => {
    await page.goto('/ops/exceptions')
    await expect(page.getByRole('button', { name: 'Switch to dark theme' })).toBeVisible()

    await page.getByRole('button', { name: 'Switch to dark theme' }).click()

    await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible()

    await page.reload()

    await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible()

    await page.getByRole('button', { name: 'Switch to light theme' }).click()

    await expect(page.getByRole('button', { name: 'Switch to dark theme' })).toBeVisible()
  })
})
