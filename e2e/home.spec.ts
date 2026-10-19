import { expect, test, type Page } from '@playwright/test'

const SMALLEST_SUPPORTED_WIDTH = { width: 375, height: 812 }

/** Returns true when the page content is wider than the viewport, i.e. it scrolls horizontally. */
async function hasHorizontalScroll(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
}

test('shows the home page title', async ({ page }) => {
  // Act
  await page.goto('/')

  // Assert
  await expect(page.getByRole('heading', { name: 'Marstest' })).toBeVisible()
  await expect(page.getByText('Project scaffold ready.')).toBeVisible()
})

test('shows the not found page for unknown paths', async ({ page }) => {
  // Act
  await page.goto('/this-page-does-not-exist')

  // Assert
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
})

test('goes back to the home page from the not found page', async ({ page }) => {
  // Arrange
  await page.goto('/this-page-does-not-exist')

  // Act
  await page.getByRole('link', { name: 'Back to home' }).click()

  // Assert
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('heading', { name: 'Marstest' })).toBeVisible()
})

for (const path of ['/', '/this-page-does-not-exist']) {
  test(`does not scroll horizontally at 375px on ${path}`, async ({ page }) => {
    // Arrange
    await page.setViewportSize(SMALLEST_SUPPORTED_WIDTH)

    // Act
    await page.goto(path)

    // Assert
    expect(await hasHorizontalScroll(page)).toBe(false)
  })
}
