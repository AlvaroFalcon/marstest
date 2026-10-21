import { screen } from '@testing-library/react'
import { EtaPair, type EtaPairProps } from '@/components/provenance/EtaPair'
import { renderWithProviders } from '@/test/renderWithProviders'

const now = new Date('2026-10-20T10:00:00Z')

const providedCarrierEta: EtaPairProps['carrierEta'] = {
  status: 'provided',
  date: '2026-10-21T10:00:00Z',
  source: { carrierId: 'euroruta', channel: 'api' },
  updatedAt: '2026-10-20T09:48:00Z',
}

const inLineEstimate: EtaPairProps['estimatedEta'] = {
  date: '2026-10-21T10:30:00Z',
  earliest: '2026-10-21T10:00:00Z',
  latest: '2026-10-21T13:00:00Z',
  confidence: 78,
  reason: 'customs hold at Valencia, typically cleared within 4 h',
}

const lateEstimate: EtaPairProps['estimatedEta'] = {
  date: '2026-10-22T08:00:00Z',
  earliest: '2026-10-22T06:00:00Z',
  latest: '2026-10-22T12:00:00Z',
  confidence: 92,
  reason: 'customs hold at Valencia, typically cleared within 4 h',
}

function renderPair(props: Partial<EtaPairProps> = {}) {
  return renderWithProviders(
    <EtaPair
      carrierEta={providedCarrierEta}
      carrierName="EuroRuta"
      estimatedEta={inLineEstimate}
      now={now}
      variant="reason"
      {...props}
    />,
  )
}

describe('EtaPair', () => {
  describe('carrier card', () => {
    it('shows the carrier ETA with its source and how long ago it was updated', () => {
      renderPair()

      expect(screen.getByText('Carrier ETA')).toBeInTheDocument()
      expect(screen.getByText('Oct 21 · 10:00')).toBeInTheDocument()
      expect(screen.getByText('Source: EuroRuta API · updated 12 min ago')).toBeInTheDocument()
    })

    it('names the channel the ETA came through', () => {
      renderPair({ carrierEta: { ...providedCarrierEta, source: { carrierId: 'euroruta', channel: 'edi' } } })

      expect(screen.getByText('Source: EuroRuta EDI · updated 12 min ago')).toBeInTheDocument()
    })

    it('says since when the ETA has not changed when the update is older than 24 hours', () => {
      renderPair({ carrierEta: { ...providedCarrierEta, updatedAt: '2026-10-19T09:00:00Z' } })

      expect(screen.getByText('Source: EuroRuta API · ETA unchanged since Oct 19, 09:00')).toBeInTheDocument()
      expect(screen.queryByText(/updated/)).not.toBeInTheDocument()
    })

    it('still shows the updated wording when the update is exactly 24 hours old', () => {
      renderPair({ carrierEta: { ...providedCarrierEta, updatedAt: '2026-10-19T10:00:00Z' } })

      expect(screen.getByText('Source: EuroRuta API · updated 24 h ago')).toBeInTheDocument()
    })

    it('shows Not provided and a note when the carrier sends no ETA', () => {
      renderPair({ carrierEta: { status: 'notProvided' } })

      expect(screen.getByText('Not provided')).toBeInTheDocument()
      expect(screen.getByText('EuroRuta does not send ETAs')).toBeInTheDocument()
      expect(screen.queryByText(/Source:/)).not.toBeInTheDocument()
    })

    it('shows the carrier date without time when the estimate spans more than a day', () => {
      renderPair({
        estimatedEta: {
          ...inLineEstimate,
          date: '2026-10-24T12:00:00Z',
          earliest: '2026-10-24T00:00:00Z',
          latest: '2026-10-25T12:00:00Z',
        },
        carrierEta: { ...providedCarrierEta, date: '2026-10-22T10:00:00Z' },
      })

      expect(screen.getByText('Oct 22')).toBeInTheDocument()
      expect(screen.queryByText('Oct 22 · 10:00')).not.toBeInTheDocument()
    })
  })

  describe('estimate card', () => {
    it('shows the estimated date range, the confidence and the reason in the reason variant', () => {
      renderPair({ variant: 'reason' })

      expect(screen.getByText('Our estimate')).toBeInTheDocument()
      expect(screen.getByText('Oct 21 · 10:00–13:00')).toBeInTheDocument()
      expect(screen.getByText('Estimated · 78%')).toBeInTheDocument()
      expect(screen.getByText('Why: customs hold at Valencia, typically cleared within 4 h')).toBeInTheDocument()
    })

    it('shows the reason even when the estimate deviates from the carrier', () => {
      renderPair({ estimatedEta: lateEstimate, variant: 'reason' })

      expect(screen.getByText('Why: customs hold at Valencia, typically cleared within 4 h')).toBeInTheDocument()
    })

    it('shows only the percentage and keeps Estimated for screen readers in the comparison variant', () => {
      renderPair({ variant: 'comparison' })

      expect(screen.getByText('78%', { exact: false })).toBeInTheDocument()
      expect(screen.queryByText('Estimated · 78%')).not.toBeInTheDocument()
      expect(screen.getByText('Estimated')).toBeInTheDocument()
    })

    it('says the estimate is in line when it is within the tolerance of the carrier ETA', () => {
      renderPair({ variant: 'comparison' })

      expect(screen.getByText('In line with the carrier ETA, no deviation expected')).toBeInTheDocument()
    })

    it('says how many hours later the estimate is when it deviates with high confidence', () => {
      renderPair({ estimatedEta: lateEstimate, variant: 'comparison' })

      expect(screen.getByText('~22 h later than the carrier ETA · high confidence')).toBeInTheDocument()
    })

    it('says how many hours earlier the estimate is when it deviates in the other direction', () => {
      renderPair({
        carrierEta: { ...providedCarrierEta, date: '2026-10-22T10:00:00Z' },
        estimatedEta: {
          ...inLineEstimate,
          date: '2026-10-21T10:00:00Z',
          earliest: '2026-10-21T08:00:00Z',
          latest: '2026-10-21T14:00:00Z',
          confidence: 90,
        },
        variant: 'comparison',
      })

      expect(screen.getByText('~24 h earlier than the carrier ETA · high confidence')).toBeInTheDocument()
    })

    it('shows the low-confidence note when it deviates with confidence below 75', () => {
      renderPair({ estimatedEta: { ...lateEstimate, confidence: 58 }, variant: 'comparison' })

      expect(screen.getByText('Wide range, low confidence · we keep watching')).toBeInTheDocument()
      expect(screen.queryByText(/high confidence/)).not.toBeInTheDocument()
    })

    it('shows the reason in the comparison variant when the carrier sent no ETA', () => {
      renderPair({ carrierEta: { status: 'notProvided' }, variant: 'comparison' })

      expect(screen.getByText('Why: customs hold at Valencia, typically cleared within 4 h')).toBeInTheDocument()
    })

    it('writes the range with times across two days when it is shorter than 24 hours', () => {
      renderPair({
        estimatedEta: {
          ...inLineEstimate,
          earliest: '2026-10-21T15:00:00Z',
          latest: '2026-10-22T10:00:00Z',
        },
      })

      expect(screen.getByText('Oct 21 15:00 – Oct 22 10:00')).toBeInTheDocument()
    })

    it('writes the range as dates only when it spans 24 hours or more', () => {
      renderPair({
        estimatedEta: {
          ...inLineEstimate,
          date: '2026-10-24T12:00:00Z',
          earliest: '2026-10-24T00:00:00Z',
          latest: '2026-10-25T12:00:00Z',
        },
        carrierEta: { ...providedCarrierEta, date: '2026-10-24T11:00:00Z' },
      })

      expect(screen.getByText('Oct 24–25')).toBeInTheDocument()
    })
  })
})
