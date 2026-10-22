import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createSeed } from '@/api/seed'
import { ShipmentDetail, type ShipmentDetailProps } from '@/components/shipments/ShipmentDetail'
import { buildDocumentRows, buildExceptionLayer, buildShipmentDetail, pickMostUrgentException } from '@/lib/exceptionDetail'
import { getFreshness } from '@/lib/freshness'
import { renderWithProviders } from '@/test/renderWithProviders'

const NOW = new Date('2026-10-20T10:00:00.000Z')

async function renderSeedDetail(onOpenSourceEvents?: ShipmentDetailProps['onOpenSourceEvents']) {
  const seed = createSeed()
  const shipment = seed.shipments.find(candidate => candidate.id === 'SH-1042')
  if (!shipment) throw new Error('SH-1042 missing from the seed')
  const exception = pickMostUrgentException(shipment)
  if (!exception) throw new Error('SH-1042 has no exception')

  return renderWithProviders(
    <ShipmentDetail
      shipment={shipment}
      detail={buildShipmentDetail(shipment, seed)}
      carrierNames={{ 'nordsee-line': 'Nordsee Line' }}
      freshness={getFreshness(shipment, NOW)}
      now={NOW}
      statusBadge={null}
      exception={buildExceptionLayer(shipment, exception)}
      onOpenSourceEvents={onOpenSourceEvents}
    />,
  )
}

describe('ShipmentDetail source events entry points', () => {
  it('keeps the evidence as plain text and the journey steps unclickable without the callback', async () => {
    await renderSeedDetail()

    expect(screen.getByText(/Based on 2 events/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Based on/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Southampton port/ })).not.toBeInTheDocument()
  })

  it('calls the callback without ids from the evidence button', async () => {
    const onOpenSourceEvents = vi.fn()
    await renderSeedDetail(onOpenSourceEvents)

    await userEvent.click(screen.getByRole('button', { name: /Based on 2 events/ }))

    expect(onOpenSourceEvents).toHaveBeenCalledTimes(1)
    expect(onOpenSourceEvents).toHaveBeenCalledWith()
  })

  it('calls the callback with the raw event ids of the clicked journey step', async () => {
    const onOpenSourceEvents = vi.fn()
    await renderSeedDetail(onOpenSourceEvents)

    await userEvent.click(screen.getByRole('button', { name: /Southampton port/ }))

    expect(onOpenSourceEvents).toHaveBeenCalledWith(['SH-1042-E5', 'SH-1042-E6'])
  })
})

describe('ShipmentDetail state layers', () => {
  async function renderSeedShipment(shipmentId: string, extra: Partial<ShipmentDetailProps>) {
    const seed = createSeed()
    const shipment = seed.shipments.find(candidate => candidate.id === shipmentId)
    if (!shipment) throw new Error(`${shipmentId} missing from the seed`)

    return renderWithProviders(
      <ShipmentDetail
        shipment={shipment}
        detail={buildShipmentDetail(shipment, seed)}
        carrierNames={{ euroruta: 'EuroRuta' }}
        freshness={getFreshness(shipment, NOW)}
        now={NOW}
        statusBadge={null}
        {...extra}
      />,
    )
  }

  it('shows the state badge with its label', async () => {
    await renderSeedShipment('SH-1033', { stateBadge: { tone: 'success', label: 'No open exception' } })

    expect(screen.getAllByText('No open exception')).not.toHaveLength(0)
  })

  it('uses the short label of the state badge under the title', async () => {
    await renderSeedShipment('SH-1035', {
      stateBadge: { tone: 'critical', label: 'Exception opened automatically', shortLabel: 'Exception opened' },
    })

    expect(screen.getByText('Exception opened')).toBeInTheDocument()
    expect(screen.getByText('Exception opened automatically')).toBeInTheDocument()
  })

  it('shows the AI signal with its evidence as plain text without the source events callback', async () => {
    await renderSeedShipment('SH-1034', {
      aiSignal: { title: 'AI signal · possible delay', text: 'Possible delay of 7 h.', evidenceLabel: 'Based on 9 GPS pings' },
    })

    expect(screen.getByRole('heading', { name: 'AI signal · possible delay' })).toBeInTheDocument()
    expect(screen.getByText('Based on 9 GPS pings')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Based on 9 GPS pings' })).not.toBeInTheDocument()
  })

  it('makes the AI signal evidence a button that opens the source events', async () => {
    const onOpenSourceEvents = vi.fn()
    await renderSeedShipment('SH-1034', {
      aiSignal: { title: 'AI signal · possible delay', text: 'Possible delay of 7 h.', evidenceLabel: 'Based on 9 GPS pings' },
      onOpenSourceEvents,
    })

    await userEvent.click(screen.getByRole('button', { name: 'Based on 9 GPS pings' }))

    expect(onOpenSourceEvents).toHaveBeenCalledWith()
  })

  it('shows no evidence line when the AI signal has none', async () => {
    await renderSeedShipment('SH-1034', {
      aiSignal: { title: 'AI signal · possible delay', text: 'Possible delay of 7 h.', evidenceLabel: null },
    })

    expect(screen.queryByText(/^Based on/)).not.toBeInTheDocument()
  })

  it('shows the document check and the actions card without an exception layer', async () => {
    const seed = createSeed()
    const shipment = seed.shipments.find(candidate => candidate.id === 'SH-1033')
    if (!shipment) throw new Error('SH-1033 missing from the seed')

    await renderSeedShipment('SH-1033', {
      documentRows: buildDocumentRows(shipment),
      actions: <p>Actions card</p>,
    })

    expect(screen.getByRole('heading', { name: 'Document check' })).toBeInTheDocument()
    expect(screen.getByText('Actions card')).toBeInTheDocument()
  })
})
