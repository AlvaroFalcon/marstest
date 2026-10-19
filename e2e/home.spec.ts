import { expect, test } from '@playwright/test'

test('shows the home page title', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Marstest' })).toBeVisible()
})

test('shows the not found page for unknown paths', async ({ page }) => {
  await page.goto('/this-page-does-not-exist')

  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
})
