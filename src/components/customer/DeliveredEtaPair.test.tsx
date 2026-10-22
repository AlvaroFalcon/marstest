import { screen } from '@testing-library/react'
import { DeliveredEtaPair, type DeliveredEtaPairProps } from '@/components/customer/DeliveredEtaPair'
import { renderWithProviders } from '@/test/renderWithProviders'

const sh1009Arrival: DeliveredEtaPairProps['arrival'] = {
  kind: 'delivered',
  deliveredAt: '2026-10-18T10:00:00.000Z',
  plannedDeliveryAt: '2026-10-19T10:00:00.000Z',
  deliveryVsPlan: { kind: 'early', duration: { unit: 'day', count: 1 } },
  source: { carrierName: 'Transauto', channel: 'api' },
  hasSignedProofOfDelivery: true,
}

function renderPair(arrival: Partial<DeliveredEtaPairProps['arrival']> = {}) {
  return renderWithProviders(<DeliveredEtaPair arrival={{ ...sh1009Arrival, ...arrival }} />)
}

describe('DeliveredEtaPair', () => {
  describe('delivered card', () => {
    it('shows the delivery date and time in UTC', () => {
      renderPair()

      expect(screen.getByText('Delivered')).toBeInTheDocument()
      expect(screen.getByText('Oct 18 · 10:00')).toBeInTheDocument()
    })

    it('notes the carrier, the channel and the signed proof of delivery', () => {
      renderPair()

      expect(screen.getByText('Source: Transauto API · proof of delivery signed')).toBeInTheDocument()
    })

    it('drops the proof of delivery suffix when it was not received', () => {
      renderPair({ hasSignedProofOfDelivery: false })

      expect(screen.getByText('Source: Transauto API')).toBeInTheDocument()
      expect(screen.queryByText(/proof of delivery signed/)).not.toBeInTheDocument()
    })

    it('names the channel of a portal delivery', () => {
      renderPair({ source: { carrierName: 'Vascor Trans', channel: 'portal' } })

      expect(screen.getByText('Source: Vascor Trans Portal · proof of delivery signed')).toBeInTheDocument()
    })

    it('shows no source note when the delivery has no source', () => {
      renderPair({ source: null })

      expect(screen.queryByText(/^Source:/)).not.toBeInTheDocument()
    })
  })

  describe('planned card', () => {
    it('shows the date planned at dispatch', () => {
      renderPair()

      expect(screen.getByText('Planned at dispatch')).toBeInTheDocument()
      expect(screen.getByText('Oct 19')).toBeInTheDocument()
    })

    it('shows "1 day early" when the delivery was a day ahead', () => {
      renderPair()

      expect(screen.getByText('1 day early')).toBeInTheDocument()
    })

    it('shows the plural for several days early', () => {
      renderPair({ deliveryVsPlan: { kind: 'early', duration: { unit: 'day', count: 3 } } })

      expect(screen.getByText('3 days early')).toBeInTheDocument()
    })

    it('shows the delay in days', () => {
      renderPair({ deliveryVsPlan: { kind: 'late', duration: { unit: 'day', count: 2 } } })

      expect(screen.getByText('2 days late')).toBeInTheDocument()
    })

    it('shows hours early', () => {
      renderPair({ deliveryVsPlan: { kind: 'early', duration: { unit: 'hour', count: 5 } } })

      expect(screen.getByText('5 h early')).toBeInTheDocument()
    })

    it('shows hours late', () => {
      renderPair({ deliveryVsPlan: { kind: 'late', duration: { unit: 'hour', count: 2 } } })

      expect(screen.getByText('2 h late')).toBeInTheDocument()
    })

    it('shows "On time" within the tolerance', () => {
      renderPair({ deliveryVsPlan: { kind: 'onTime' } })

      expect(screen.getByText('On time')).toBeInTheDocument()
    })
  })

  describe('no forecast', () => {
    it('shows no carrier ETA, estimate or estimated badge', () => {
      renderPair()

      expect(screen.queryByText('Carrier ETA')).not.toBeInTheDocument()
      expect(screen.queryByText('Our estimate')).not.toBeInTheDocument()
      expect(screen.queryByText(/Estimated/)).not.toBeInTheDocument()
    })
  })
})
