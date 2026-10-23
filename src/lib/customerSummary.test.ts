import { createSeed } from '@/api/seed'
import type { Shipment } from '@/api/types'
import { summarizeShipmentForCustomer } from '@/lib/customerSummary'

function getSeedShipment(shipmentId: string): Shipment {
  const shipment = createSeed().shipments.find(candidate => candidate.id === shipmentId)
  if (!shipment) {
    throw new Error(`Seed shipment ${shipmentId} not found`)
  }
  return shipment
}

describe('summarizeShipmentForCustomer', () => {
  it('returns the hand-written summary of SH-1042 and its number of carrier events', () => {
    const shipment = getSeedShipment('SH-1042')

    const summary = summarizeShipmentForCustomer(shipment)

    expect(summary).toEqual({
      text: 'Your order left our Zaragoza plant on Oct 14 and reached Southampton port on Oct 19. It\'s waiting for UK customs clearance while we send a missing document; holds like this usually clear in about 2 days. We expect it in Birmingham on Oct 22–23 instead of Oct 20.',
      eventCount: 6,
    })
  })
})
