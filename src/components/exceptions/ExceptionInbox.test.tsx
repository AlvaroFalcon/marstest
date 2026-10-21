import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  ExceptionInbox,
  type ExceptionInboxContent,
  type ExceptionInboxProps,
} from '@/components/exceptions/ExceptionInbox'
import { renderWithProviders } from '@/test/renderWithProviders'

const siteFilter: ExceptionInboxProps['siteFilter'] = {
  options: [
    { site: { id: 'zaragoza-plant', name: 'Zaragoza plant', inOpsScope: true }, exceptionCount: 3 },
    { site: { id: 'bilbao-plant', name: 'Bilbao plant', inOpsScope: true }, exceptionCount: 2 },
  ],
  selectedSiteId: null,
  totalExceptionCount: 5,
  onSelect: () => {},
  isDesktop: true,
}

const readyContent: ExceptionInboxContent = {
  status: 'ready',
  items: [
    {
      shipmentId: 'SH-1042',
      route: 'Zaragoza → Birmingham',
      reason: 'UK customs is holding the container at Southampton.',
      status: { type: 'customsHold' },
      href: '/ops/exceptions/SH-1042',
      isOpen: false,
    },
    {
      shipmentId: 'SH-1051',
      route: 'Bilbao → Rotterdam',
      reason: 'The vessel was rolled to the next sailing.',
      status: { type: 'vesselRolled' },
      href: '/ops/exceptions/SH-1051',
      isOpen: true,
    },
  ],
  kpis: { needAttention: 5, staleOverDay: 2, onTime: 9, total: 16 },
}

describe('ExceptionInbox', () => {
  describe('loading', () => {
    it('announces that the exceptions are loading and shows no cards', () => {
      renderWithProviders(<ExceptionInbox content={{ status: 'loading' }} siteFilter={siteFilter} />)

      expect(screen.getByRole('status')).toHaveTextContent('Loading exceptions')
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })
  })

  describe('error', () => {
    it('shows the error message and retries when "Try again" is pressed', async () => {
      const onRetry = vi.fn()
      renderWithProviders(<ExceptionInbox content={{ status: 'error', onRetry }} siteFilter={siteFilter} />)

      await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

      expect(screen.getByRole('alert')).toHaveTextContent('Could not load the exceptions')
      expect(onRetry).toHaveBeenCalledTimes(1)
    })
  })

  describe('empty', () => {
    it('shows "No open exceptions" without a way back when no site is selected', () => {
      renderWithProviders(
        <ExceptionInbox content={{ ...readyContent, items: [] }} siteFilter={siteFilter} />,
      )

      expect(screen.getByText('No open exceptions')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Show all my sites' })).not.toBeInTheDocument()
    })

    it('shows "No open exceptions at this site" and selects all sites with "Show all my sites"', async () => {
      const onSelect = vi.fn()
      renderWithProviders(
        <ExceptionInbox
          content={{ ...readyContent, items: [] }}
          siteFilter={{ ...siteFilter, selectedSiteId: 'bilbao-plant', onSelect }}
        />,
      )

      await userEvent.click(screen.getByRole('button', { name: 'Show all my sites' }))

      expect(screen.getByText('No open exceptions at this site')).toBeInTheDocument()
      expect(onSelect).toHaveBeenCalledExactlyOnceWith(null)
    })
  })

  describe('ready', () => {
    it('shows the heading, the KPIs and the cards in the given order', () => {
      renderWithProviders(<ExceptionInbox content={readyContent} siteFilter={siteFilter} />)

      expect(screen.getByRole('heading', { name: 'Exceptions inbox' })).toBeInTheDocument()
      expect(screen.getByText('9 of 16')).toBeInTheDocument()
      const cards = screen.getAllByRole('link')
      expect(cards[0]).toHaveTextContent('SH-1042 · Zaragoza → Birmingham')
      expect(cards[1]).toHaveTextContent('SH-1051 · Bilbao → Rotterdam')
    })

    it('marks only the open card as the current page', () => {
      renderWithProviders(<ExceptionInbox content={readyContent} siteFilter={siteFilter} />)

      expect(screen.getByRole('link', { name: /SH-1051/ })).toHaveAttribute('aria-current', 'page')
      expect(screen.getByRole('link', { name: /SH-1042/ })).not.toHaveAttribute('aria-current')
    })

    it('shows the site filter trigger', () => {
      renderWithProviders(<ExceptionInbox content={readyContent} siteFilter={siteFilter} />)

      expect(screen.getByRole('button', { name: 'All my sites (2)' })).toBeInTheDocument()
    })

    it('hides the site filter when there are no sites to choose from', () => {
      renderWithProviders(
        <ExceptionInbox content={readyContent} siteFilter={{ ...siteFilter, options: [] }} />,
      )

      expect(screen.queryByRole('button', { name: /sites/ })).not.toBeInTheDocument()
    })
  })
})
