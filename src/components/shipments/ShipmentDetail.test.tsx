import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createSeed } from '@/api/seed'
import { ShipmentDetail, type ShipmentDetailProps } from '@/components/shipments/ShipmentDetail'
import { buildExceptionLayer, buildShipmentDetail, pickMostUrgentException } from '@/lib/exceptionDetail'
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
