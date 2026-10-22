import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation } from 'react-router'
import { useCustomerShipmentsSearchParams } from '@/hooks/useCustomerShipmentsSearchParams'
import { renderWithProviders } from '@/test/renderWithProviders'

function Probe() {
  const location = useLocation()
  const { query, setTab, setSearch, setPage } = useCustomerShipmentsSearchParams()

  return (
    <>
      <p>{`search:${location.search}`}</p>
      <p>{`tab:${query.tab}`}</p>
      <p>{`q:${query.search}`}</p>
      <p>{`page:${query.page}`}</p>
      <button type="button" onClick={() => setTab('delivered')}>Delivered tab</button>
      <button type="button" onClick={() => setTab('all')}>All tab</button>
      <button type="button" onClick={() => setSearch('  munich ')}>Search munich</button>
      <button type="button" onClick={() => setSearch('')}>Clear search</button>
      <button type="button" onClick={() => setPage(3)}>Page 3</button>
      <button type="button" onClick={() => setPage(1)}>Page 1</button>
    </>
  )
}

describe('useCustomerShipmentsSearchParams', () => {
  it('uses the defaults when the URL has no params', () => {
    renderWithProviders(<Probe />, { initialPath: '/' })

    expect(screen.getByText('tab:all')).toBeInTheDocument()
    expect(screen.getByText('q:')).toBeInTheDocument()
    expect(screen.getByText('page:1')).toBeInTheDocument()
  })

  it('reads tab, q and page from the URL', () => {
    renderWithProviders(<Probe />, { initialPath: '/?tab=inTransit&q=munich&page=2' })

    expect(screen.getByText('tab:inTransit')).toBeInTheDocument()
    expect(screen.getByText('q:munich')).toBeInTheDocument()
    expect(screen.getByText('page:2')).toBeInTheDocument()
  })

  it('falls back to the defaults for invalid values', () => {
    renderWithProviders(<Probe />, { initialPath: '/?tab=banana&page=-4' })

    expect(screen.getByText('tab:all')).toBeInTheDocument()
    expect(screen.getByText('page:1')).toBeInTheDocument()
  })

  it('writes the tab and resets the page', async () => {
    renderWithProviders(<Probe />, { initialPath: '/?page=2&q=munich' })

    await userEvent.click(screen.getByRole('button', { name: 'Delivered tab' }))

    expect(screen.getByText('search:?q=munich&tab=delivered')).toBeInTheDocument()
  })

  it('omits the tab param when the default tab is chosen', async () => {
    renderWithProviders(<Probe />, { initialPath: '/?tab=delivered' })

    await userEvent.click(screen.getByRole('button', { name: 'All tab' }))

    expect(screen.getByText('search:')).toBeInTheDocument()
  })

  it('writes the trimmed search and resets the page', async () => {
    renderWithProviders(<Probe />, { initialPath: '/?tab=inTransit&page=2' })

    await userEvent.click(screen.getByRole('button', { name: 'Search munich' }))

    expect(screen.getByText('search:?tab=inTransit&q=munich')).toBeInTheDocument()
  })

  it('removes q when the search is cleared', async () => {
    renderWithProviders(<Probe />, { initialPath: '/?q=munich' })

    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(screen.getByText('search:')).toBeInTheDocument()
  })

  it('writes a page above 1 and removes the param for page 1', async () => {
    renderWithProviders(<Probe />, { initialPath: '/?tab=inTransit' })

    await userEvent.click(screen.getByRole('button', { name: 'Page 3' }))
    expect(screen.getByText('search:?tab=inTransit&page=3')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Page 1' }))
    expect(screen.getByText('search:?tab=inTransit')).toBeInTheDocument()
  })
})
