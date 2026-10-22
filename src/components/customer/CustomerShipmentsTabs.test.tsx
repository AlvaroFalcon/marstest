import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CustomerShipmentsTabs } from '@/components/customer/CustomerShipmentsTabs'
import { renderWithProviders } from '@/test/renderWithProviders'

const counts = { all: 6, needsAttention: 4, inTransit: 5, delivered: 1 }

describe.each([{ layout: 'tabs', isDesktop: true }, { layout: 'chips', isDesktop: false }])('CustomerShipmentsTabs as $layout', ({ isDesktop }) => {
  it('shows the four tabs in order with their counts', () => {
    renderWithProviders(<CustomerShipmentsTabs activeTab="all" counts={counts} onTabChange={() => {}} isDesktop={isDesktop} />)

    const names = screen.getAllByRole('tab').map(tab => tab.textContent)

    expect(names).toEqual(['All · 6', 'Needs attention · 4', 'In transit · 5', 'Delivered · 1'])
  })

  it('marks the active tab as selected', () => {
    renderWithProviders(<CustomerShipmentsTabs activeTab="inTransit" counts={counts} onTabChange={() => {}} isDesktop={isDesktop} />)

    expect(screen.getByRole('tab', { name: 'In transit · 5' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'All · 6' })).toHaveAttribute('aria-selected', 'false')
  })

  it('reports the tab that was clicked', async () => {
    const onTabChange = vi.fn()
    renderWithProviders(<CustomerShipmentsTabs activeTab="all" counts={counts} onTabChange={onTabChange} isDesktop={isDesktop} />)

    await userEvent.click(screen.getByRole('tab', { name: 'Delivered · 1' }))

    expect(onTabChange).toHaveBeenCalledWith('delivered')
  })

  it('moves to the next tab with the arrow key', async () => {
    const onTabChange = vi.fn()
    renderWithProviders(<CustomerShipmentsTabs activeTab="all" counts={counts} onTabChange={onTabChange} isDesktop={isDesktop} />)

    screen.getByRole('tab', { name: 'All · 6' }).focus()
    await userEvent.keyboard('{ArrowRight}')

    expect(onTabChange).toHaveBeenCalledWith('needsAttention')
  })
})
