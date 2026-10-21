import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SiteFilter, type SiteFilterOption, type SiteFilterProps } from '@/components/shipments/SiteFilter'
import { renderWithProviders } from '@/test/renderWithProviders'

const options: SiteFilterOption[] = [
  { site: { id: 'zaragoza-plant', name: 'Zaragoza plant', inOpsScope: true }, exceptionCount: 3 },
  { site: { id: 'bilbao-plant', name: 'Bilbao plant', inOpsScope: true }, exceptionCount: 2 },
  { site: { id: 'barcelona-warehouse', name: 'Barcelona warehouse', inOpsScope: true }, exceptionCount: 0 },
  { site: { id: 'lyon-warehouse', name: 'Lyon warehouse', inOpsScope: false }, exceptionCount: 0 },
]

function buildProps(overrides: Partial<SiteFilterProps> = {}): SiteFilterProps {
  return {
    options,
    selectedSiteId: null,
    totalExceptionCount: 5,
    onSelect: () => {},
    isDesktop: true,
    ...overrides,
  }
}

describe('SiteFilter', () => {
  describe('trigger', () => {
    it('shows the number of sites when all are selected', () => {
      renderWithProviders(<SiteFilter {...buildProps()} />)

      expect(screen.getByRole('button', { name: 'All my sites (3)' })).toBeInTheDocument()
    })

    it('shows the site name and its exception count when one site is selected', () => {
      renderWithProviders(<SiteFilter {...buildProps({ selectedSiteId: 'zaragoza-plant' })} />)

      expect(screen.getByRole('button', { name: 'Zaragoza plant (3)' })).toBeInTheDocument()
    })
  })

  describe.each([
    { variant: 'popover on desktop', isDesktop: true },
    { variant: 'sheet on mobile', isDesktop: false },
  ])('list in a $variant', ({ isDesktop }) => {
    it('lists the all-sites row and each site with its exception count', async () => {
      renderWithProviders(<SiteFilter {...buildProps({ isDesktop })} />)

      await userEvent.click(screen.getByRole('button', { name: 'All my sites (3)' }))

      expect(await screen.findByRole('radio', { name: 'All my sites 5 exceptions' })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'Zaragoza plant 3 exceptions' })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'Bilbao plant 2 exceptions' })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'Barcelona warehouse 0 exceptions' })).toBeInTheDocument()
    })

    it('marks the all-sites row as selected when no site is chosen', async () => {
      renderWithProviders(<SiteFilter {...buildProps({ isDesktop })} />)

      await userEvent.click(screen.getByRole('button', { name: 'All my sites (3)' }))

      expect(await screen.findByRole('radio', { name: 'All my sites 5 exceptions' })).toBeChecked()
      expect(screen.getByRole('radio', { name: 'Bilbao plant 2 exceptions' })).not.toBeChecked()
    })

    it('marks only the chosen site as selected', async () => {
      renderWithProviders(<SiteFilter {...buildProps({ isDesktop, selectedSiteId: 'bilbao-plant' })} />)

      await userEvent.click(screen.getByRole('button', { name: 'Bilbao plant (2)' }))

      expect(await screen.findByRole('radio', { name: 'Bilbao plant 2 exceptions' })).toBeChecked()
      expect(screen.getByRole('radio', { name: 'All my sites 5 exceptions' })).not.toBeChecked()
    })

    it('shows the out-of-scope site locked and not selectable', async () => {
      const onSelect = vi.fn()
      renderWithProviders(<SiteFilter {...buildProps({ isDesktop, onSelect })} />)
      await userEvent.click(screen.getByRole('button', { name: 'All my sites (3)' }))

      const lockedRow = await screen.findByText('Lyon warehouse · outside your scope')
      await userEvent.click(lockedRow)

      expect(lockedRow.closest('[aria-disabled="true"]')).not.toBeNull()
      expect(screen.queryByRole('radio', { name: /Lyon/ })).not.toBeInTheDocument()
      expect(onSelect).not.toHaveBeenCalled()
    })

    // fireEvent skips the pointerup that closes the list: in jsdom the list unmounts without the exit
    // animation, which would swallow the click. The pointer path is covered end to end in Playwright.
    it('calls onSelect with the site id when a site is chosen', async () => {
      const onSelect = vi.fn()
      renderWithProviders(<SiteFilter {...buildProps({ isDesktop, onSelect })} />)
      await userEvent.click(screen.getByRole('button', { name: 'All my sites (3)' }))

      fireEvent.click(await screen.findByRole('radio', { name: 'Bilbao plant 2 exceptions' }))

      expect(onSelect).toHaveBeenCalledExactlyOnceWith('bilbao-plant')
    })

    it('calls onSelect with null when all sites is chosen again', async () => {
      const onSelect = vi.fn()
      renderWithProviders(<SiteFilter {...buildProps({ isDesktop, onSelect, selectedSiteId: 'bilbao-plant' })} />)
      await userEvent.click(screen.getByRole('button', { name: 'Bilbao plant (2)' }))

      fireEvent.click(await screen.findByRole('radio', { name: 'All my sites 5 exceptions' }))

      expect(onSelect).toHaveBeenCalledExactlyOnceWith(null)
    })

    it('keeps the list open while arrow keys browse the options', async () => {
      renderWithProviders(<SiteFilter {...buildProps({ isDesktop })} />)
      await userEvent.click(screen.getByRole('button', { name: 'All my sites (3)' }))

      const allSitesRow = await screen.findByRole('radio', { name: 'All my sites 5 exceptions' })
      allSitesRow.focus()
      await userEvent.keyboard('{ArrowDown}')

      expect(screen.getByRole('radio', { name: 'Bilbao plant 2 exceptions' })).toBeInTheDocument()
    })

    it('closes the list when a site is confirmed with Enter', async () => {
      renderWithProviders(<SiteFilter {...buildProps({ isDesktop })} />)
      await userEvent.click(screen.getByRole('button', { name: 'All my sites (3)' }))

      const allSitesRow = await screen.findByRole('radio', { name: 'All my sites 5 exceptions' })
      allSitesRow.focus()
      await userEvent.keyboard('{ArrowDown}{Enter}')

      expect(screen.queryByRole('radio', { name: 'Bilbao plant 2 exceptions' })).not.toBeInTheDocument()
    })
  })

  it('shows the role caption in the desktop popover', async () => {
    renderWithProviders(<SiteFilter {...buildProps({ isDesktop: true })} />)

    await userEvent.click(screen.getByRole('button', { name: 'All my sites (3)' }))

    expect(await screen.findByText('Your sites (from your role)')).toBeInTheDocument()
  })

  it('shows the title and description in the mobile sheet', async () => {
    renderWithProviders(<SiteFilter {...buildProps({ isDesktop: false })} />)

    await userEvent.click(screen.getByRole('button', { name: 'All my sites (3)' }))

    expect(await screen.findByRole('dialog', { name: 'Filter by site' })).toBeInTheDocument()
    expect(screen.getByText('Your sites come from your role')).toBeInTheDocument()
  })
})
