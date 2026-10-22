import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation } from 'react-router'
import { useExceptionsSearchParams } from '@/hooks/useExceptionsSearchParams'
import { renderWithProviders } from '@/test/renderWithProviders'

function Probe() {
  const location = useLocation()
  const { siteId, isSourceEventsOpen, openSourceEvents, closeSourceEvents } = useExceptionsSearchParams(['bilbao-plant'])

  return (
    <>
      <p>{`search:${location.search}`}</p>
      <p>{`site:${siteId ?? 'none'}`}</p>
      <p>{`events:${isSourceEventsOpen ? 'open' : 'closed'}`}</p>
      <button type="button" onClick={openSourceEvents}>Open events</button>
      <button type="button" onClick={closeSourceEvents}>Close events</button>
    </>
  )
}

describe('useExceptionsSearchParams source events', () => {
  it('reads events=open as open', () => {
    renderWithProviders(<Probe />, { initialPath: '/?events=open' })

    expect(screen.getByText('events:open')).toBeInTheDocument()
  })

  it('is closed when the param is absent', () => {
    renderWithProviders(<Probe />, { initialPath: '/' })

    expect(screen.getByText('events:closed')).toBeInTheDocument()
  })

  it('ignores an invalid events value', () => {
    renderWithProviders(<Probe />, { initialPath: '/?events=banana' })

    expect(screen.getByText('events:closed')).toBeInTheDocument()
  })

  it('adds events=open and keeps the other params when opening', async () => {
    renderWithProviders(<Probe />, { initialPath: '/?site=bilbao-plant&view=compact' })

    await userEvent.click(screen.getByRole('button', { name: 'Open events' }))

    expect(screen.getByText('search:?site=bilbao-plant&view=compact&events=open')).toBeInTheDocument()
    expect(screen.getByText('events:open')).toBeInTheDocument()
  })

  it('removes only events when closing', async () => {
    renderWithProviders(<Probe />, { initialPath: '/?site=bilbao-plant&events=open' })

    await userEvent.click(screen.getByRole('button', { name: 'Close events' }))

    expect(screen.getByText('search:?site=bilbao-plant')).toBeInTheDocument()
    expect(screen.getByText('site:bilbao-plant')).toBeInTheDocument()
    expect(screen.getByText('events:closed')).toBeInTheDocument()
  })
})
