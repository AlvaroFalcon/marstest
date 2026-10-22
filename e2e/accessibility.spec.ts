import { expect, test, type Page } from '@playwright/test'

const keyRoutes = [
  '/ops/exceptions',
  '/ops/exceptions/SH-1042',
  '/ops/shipments',
  '/ops/shipments/SH-1035',
  '/customers/nordwerk/shipments',
  '/customers/nordwerk/shipments/SH-1042',
]

const colorSchemes = ['light', 'dark'] as const

const mobileWidth = 375

const minimumFontSizePx = 12

async function expectNoHorizontalScroll(page: Page) {
  const hasHorizontalScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )

  expect(hasHorizontalScroll).toBe(false)
}

async function expectFocusIndicatorVisible(page: Page) {
  const indicator = await page.evaluate(() => {
    const focused = document.activeElement
    if (!focused) {
      return { boxShadow: 'none', outlineStyle: 'none', outlineWidth: '0px' }
    }
    const { boxShadow, outlineStyle, outlineWidth } = getComputedStyle(focused)
    return { boxShadow, outlineStyle, outlineWidth }
  })

  const hasBoxShadow = indicator.boxShadow !== 'none'
  const hasOutline = indicator.outlineStyle !== 'none' && parseFloat(indicator.outlineWidth) > 0
  expect(hasBoxShadow || hasOutline).toBe(true)
}

/** Presses Tab until the locator holds focus, failing if it is not reached within the limit. */
async function tabUntilFocused(page: Page, target: ReturnType<Page['locator']>, maxPresses = 60) {
  for (let press = 0; press < maxPresses; press++) {
    await page.keyboard.press('Tab')
    const isFocused = await target.evaluate(element => element === document.activeElement)
    if (isFocused) {
      return
    }
  }
  throw new Error(`Target was not reached with ${maxPresses} Tab presses`)
}

for (const colorScheme of colorSchemes) {
  test.describe(`accessibility in ${colorScheme} mode`, () => {
    test.use({ colorScheme })

    for (const route of keyRoutes) {
      test.describe(route, () => {
        test(`has no horizontal scroll at ${mobileWidth} px`, async ({ page }) => {
          await page.setViewportSize({ width: mobileWidth, height: 800 })
          await page.goto(route)
          await expect(page.getByRole('heading').first()).toBeVisible()

          await expectNoHorizontalScroll(page)
        })

        test(`renders no visible text below ${minimumFontSizePx} px`, async ({ page }) => {
          await page.goto(route)
          await expect(page.getByRole('heading').first()).toBeVisible()

          const tooSmall = await page.evaluate((minimum) => {
            const offenders: string[] = []
            for (const element of document.body.querySelectorAll('*')) {
              const ownText = Array.from(element.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE)
                .map(node => node.textContent?.trim() ?? '')
                .join(' ')
                .trim()
              if (!ownText || !element.checkVisibility()) {
                continue
              }
              const style = getComputedStyle(element)
              const box = element.getBoundingClientRect()
              // Visually hidden helper text (sr-only: 1px box, clipped) is not rendered for sighted users.
              const isScreenReaderOnly = box.width <= 1 && box.height <= 1
              // Script and style contents are never painted even though they hold text nodes.
              const isNonRendered = ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(element.tagName)
              if (isScreenReaderOnly || isNonRendered) {
                continue
              }
              if (parseFloat(style.fontSize) < minimum) {
                offenders.push(`${ownText.slice(0, 40)} (${style.fontSize})`)
              }
            }
            return offenders
          }, minimumFontSizePx)

          expect(tooSmall).toEqual([])
        })
      })
    }
  })
}

test.describe('keyboard-only walkthrough', () => {
  test.use({ colorScheme: 'light' })

  test('opens SH-1042 and approves the notice with a visible focus indicator at every step', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Keyboard navigation is a desktop concern; touch devices have no Tab flow')
    await page.goto('/ops/exceptions')
    await expect(page.getByRole('link', { name: /SH-1042/ })).toBeVisible()

    const inboxCard = page.getByRole('link', { name: /SH-1042/ })
    await tabUntilFocused(page, inboxCard)

    await expect(inboxCard).toBeFocused()
    await expectFocusIndicatorVisible(page)

    await page.keyboard.press('Enter')

    await expect(page).toHaveURL('/ops/exceptions/SH-1042')
    await expect(page.getByRole('heading', { level: 1, name: /^SH-1042/ })).toBeVisible()
    const approveButton = page.getByRole('button', { name: 'Approve and send' })
    await tabUntilFocused(page, approveButton)

    await expect(approveButton).toBeFocused()
    await expectFocusIndicatorVisible(page)

    await page.keyboard.press('Enter')

    await expect(page.getByText('Notice sent to Nordwerk GmbH')).toBeVisible()
    await expect(page.getByText(/Customer notified · /)).toBeVisible()
  })
})
