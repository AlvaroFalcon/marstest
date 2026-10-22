import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SourceEventsSheet, type SourceEventsSheetProps } from '@/components/shipments/SourceEventsSheet'
import type { SourceEventRow } from '@/lib/sourceEvents'
import { renderWithProviders } from '@/test/renderWithProviders'

const CARRIER_NAMES = { 'vascor-trans': 'Vascor Trans', 'nordsee-line': 'Nordsee Line' }

function buildRow(overrides: Partial<SourceEventRow>): SourceEventRow {
  return {
    id: 'EVT-1',
    carrierId: 'vascor-trans',
    channel: 'portal',
    receivedAt: '2026-10-16T09:14:00.000Z',
    rawText: 'Recogida realizada - Planta Bilbao',
    status: 'pickedUp',
    mapping: { method: 'rule', rule: 'Recogida realizada → Picked up' },
    needsReview: false,
    isCited: false,
    deltaFromPrevious: null,
    ...overrides,
  }
}

const ruleRow = buildRow({})
const aiRow = buildRow({
  id: 'EVT-2',
  carrierId: 'nordsee-line',
  channel: 'email',
  receivedAt: '2026-10-18T07:35:00.000Z',
  rawText: 'Box held by HMRC pending CoO',
  status: 'customsHold',
  mapping: { method: 'ai', confidence: 91 },
  isCited: true,
  deltaFromPrevious: { days: 1, hours: 21, minutes: 0 },
})
const lowConfidenceRow = buildRow({
  id: 'EVT-3',
  rawText: 'Camión parado en zona de espera',
  status: 'inTransit',
  mapping: { method: 'ai', confidence: 54 },
  needsReview: true,
  receivedAt: '2026-10-18T10:00:00.000Z',
  deltaFromPrevious: { days: 0, hours: 2, minutes: 25 },
})

function renderSheet(overrides: Partial<SourceEventsSheetProps> = {}) {
  return renderWithProviders(
    <SourceEventsSheet
      isOpen
      onOpenChange={vi.fn()}
      shipmentId="SH-1042"
      rows={[ruleRow, aiRow, lowConfidenceRow]}
      carrierNames={CARRIER_NAMES}
      highlightedEventIds={[]}
      isDesktop
      {...overrides}
    />,
  )
}

function getEventItem(rawText: string): HTMLElement {
  const list = screen.getByRole('list', { name: 'Carrier events, oldest first' })
  const match = within(list).getAllByRole('listitem').find(item => within(item).queryByText(rawText) !== null)
  if (!match) {
    throw new Error(`Event ${rawText} not found`)
  }
  return match
}

describe('SourceEventsSheet', () => {
  describe('content', () => {
    it('shows the title with the shipment id inside a dialog', () => {
      renderSheet()

      const dialog = screen.getByRole('dialog', { name: 'Source events · SH-1042' })

      expect(dialog).toBeInTheDocument()
    })

    it('renders nothing when closed', () => {
      renderSheet({ isOpen: false })

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('shows carrier, channel, time and raw message of each event', () => {
      renderSheet()

      const item = getEventItem('Box held by HMRC pending CoO')

      expect(item).toHaveTextContent('Nordsee Line · Email')
      expect(item).toHaveTextContent('Oct 18 · 07:35')
    })

    it('shows the normalised status of each event', () => {
      renderSheet()

      expect(getEventItem('Recogida realizada - Planta Bilbao')).toHaveTextContent('Picked up')
      expect(getEventItem('Box held by HMRC pending CoO')).toHaveTextContent('Customs hold')
    })

    it('shows "Mapped by rule" for a rule mapping', () => {
      renderSheet()

      expect(getEventItem('Recogida realizada - Planta Bilbao')).toHaveTextContent('Mapped by rule')
    })

    it('shows the confidence for an AI mapping above the threshold', () => {
      renderSheet()

      const item = getEventItem('Box held by HMRC pending CoO')

      expect(item).toHaveTextContent('Mapped by AI · 91% confidence')
      expect(item).not.toHaveTextContent('needs human review')
    })

    it('flags a low-confidence AI mapping for review with a question mark on the status', () => {
      renderSheet()

      const item = getEventItem('Camión parado en zona de espera')

      expect(item).toHaveTextContent('AI 54% · below threshold, needs human review')
      expect(within(item).getByText('In transit?')).toBeInTheDocument()
      expect(item).not.toHaveTextContent('Mapped by AI')
    })

    it('marks the events cited by the diagnosis and no others', () => {
      renderSheet()

      expect(getEventItem('Box held by HMRC pending CoO')).toHaveTextContent('Cited by diagnosis')
      expect(getEventItem('Recogida realizada - Planta Bilbao')).not.toHaveTextContent('Cited by diagnosis')
    })

    it('falls back to the carrier id when the carrier name is unknown', () => {
      renderSheet({ carrierNames: {} })

      expect(getEventItem('Box held by HMRC pending CoO')).toHaveTextContent('nordsee-line · Email')
    })
  })

  describe('time deltas', () => {
    it('shows no delta on the first event', () => {
      renderSheet()

      expect(getEventItem('Recogida realizada - Planta Bilbao')).not.toHaveTextContent('+')
    })

    it('shows days and hours before an event 24 h or more after the previous one', () => {
      renderSheet()

      expect(getEventItem('Box held by HMRC pending CoO')).toHaveTextContent('+1 d 21 h')
    })

    it('shows hours and minutes before an event less than 24 h after the previous one', () => {
      renderSheet()

      expect(getEventItem('Camión parado en zona de espera')).toHaveTextContent('+2 h 25 min')
    })
  })

  describe('highlighted events', () => {
    it('marks the highlighted events as current with a screen reader cue', () => {
      renderSheet({ highlightedEventIds: ['EVT-2'] })

      const item = getEventItem('Box held by HMRC pending CoO')

      expect(item).toHaveAttribute('aria-current', 'true')
      expect(item).toHaveTextContent('Selected journey step')
    })

    it('leaves the other events unmarked', () => {
      renderSheet({ highlightedEventIds: ['EVT-2'] })

      const item = getEventItem('Recogida realizada - Planta Bilbao')

      expect(item).not.toHaveAttribute('aria-current')
      expect(item).not.toHaveTextContent('Selected journey step')
    })

    it('marks nothing when no event is highlighted', () => {
      renderSheet()

      expect(screen.queryByText('Selected journey step')).not.toBeInTheDocument()
    })
  })

  describe('dismissal', () => {
    it('asks to close on Escape', async () => {
      const onOpenChange = vi.fn()
      renderSheet({ onOpenChange })

      await userEvent.keyboard('{Escape}')

      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    it('asks to close from the close button', async () => {
      const onOpenChange = vi.fn()
      renderSheet({ onOpenChange })

      await userEvent.click(screen.getByRole('button', { name: 'Close' }))

      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })
})
