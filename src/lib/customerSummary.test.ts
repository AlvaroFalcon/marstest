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
  describe('in transit', () => {
    it('summarizes SH-1042 with the departure, the latest update and the deviating estimate', () => {
      const shipment = getSeedShipment('SH-1042')

      const summary = summarizeShipmentForCustomer({ shipment, originCity: 'Zaragoza' })

      expect(summary.text).toBe(
        'Your order left Zaragoza on Oct 14. Latest update on Oct 19: it is waiting for customs clearance at Southampton port. We expect it in Birmingham on Oct 22–23 instead of Oct 20.',
      )
    })

    it('counts the raw carrier events of the shipment', () => {
      const shipment = getSeedShipment('SH-1042')

      const summary = summarizeShipmentForCustomer({ shipment, originCity: 'Zaragoza' })

      expect(summary.eventCount).toBe(6)
    })

    it('omits the carrier date when it falls on the same day as the expected arrival', () => {
      const shipment = getSeedShipment('SH-1034')

      const { text } = summarizeShipmentForCustomer({ shipment, originCity: 'Barcelona' })

      expect(text).not.toContain('instead of')
    })

    it('omits the carrier date when the estimate is in line with the carrier ETA', () => {
      const shipment = getSeedShipment('SH-1047')

      const summary = summarizeShipmentForCustomer({ shipment, originCity: 'Zaragoza' })

      expect(summary.text).toBe(
        'Your order left Zaragoza on Oct 18. Latest update on Oct 19: it arrived at Barcelona port terminal. We expect it in Zurich on Oct 22.',
      )
    })

    it('omits the carrier date when the carrier gave no ETA', () => {
      const shipment: Shipment = { ...getSeedShipment('SH-1042'), carrierEta: { status: 'notProvided' } }

      const summary = summarizeShipmentForCustomer({ shipment, originCity: 'Zaragoza' })

      expect(summary.text).toBe(
        'Your order left Zaragoza on Oct 14. Latest update on Oct 19: it is waiting for customs clearance at Southampton port. We expect it in Birmingham on Oct 22–23.',
      )
    })

    it('writes a range across two months with both months', () => {
      const base = getSeedShipment('SH-1047')
      const shipment: Shipment = {
        ...base,
        estimatedEta: { ...base.estimatedEta, earliest: '2026-10-31T08:00:00.000Z', latest: '2026-11-02T08:00:00.000Z' },
      }

      const summary = summarizeShipmentForCustomer({ shipment, originCity: 'Zaragoza' })

      expect(summary.text).toContain('We expect it in Zurich on Oct 31 – Nov 2.')
    })

    it('says the order has not left yet when only a booking exists', () => {
      const shipment = getSeedShipment('SH-1066')

      const summary = summarizeShipmentForCustomer({ shipment, originCity: 'Barcelona' })

      expect(summary.text).toBe(
        'Your order has not left Barcelona yet. Latest update on Oct 20: it was booked at Barcelona warehouse. We expect it in Zurich on Oct 22.',
      )
    })

    it('skips the latest update when the departure is the latest milestone', () => {
      const shipment = getSeedShipment('SH-1055')

      const summary = summarizeShipmentForCustomer({ shipment, originCity: 'Lyon' })

      expect(summary.text).toBe('Your order left Lyon on Oct 20. We expect it in Geneva on Oct 20.')
    })

    it('says there is no tracking update yet when the shipment has no milestones', () => {
      const shipment: Shipment = { ...getSeedShipment('SH-1042'), milestones: [], rawEvents: [] }

      const summary = summarizeShipmentForCustomer({ shipment, originCity: 'Zaragoza' })

      expect(summary.text).toBe(
        'Your order has no tracking update yet. We expect it in Birmingham on Oct 22–23 instead of Oct 20.',
      )
      expect(summary.eventCount).toBe(0)
    })
  })

  describe('delivered', () => {
    it('summarizes SH-1009 with the delivery time, the gap to the plan and the proof of delivery', () => {
      const shipment = getSeedShipment('SH-1009')

      const summary = summarizeShipmentForCustomer({ shipment, originCity: 'Zaragoza' })

      expect(summary.text).toBe(
        'Your order left Zaragoza on Oct 16 and was delivered to your Hamburg site on Oct 18 at 10:00, 1 day earlier than planned. The signed proof of delivery is ready to download.',
      )
      expect(summary.eventCount).toBe(4)
    })

    it('words a late delivery in hours', () => {
      const shipment = getSeedShipment('SH-1012')

      const summary = summarizeShipmentForCustomer({ shipment, originCity: 'Bilbao' })

      expect(summary.text).toBe(
        'Your order left Bilbao on Oct 16 and was delivered to your Valencia site on Oct 17 at 12:00, 2 hours later than planned. The signed proof of delivery is ready to download.',
      )
    })

    it('says the delivery was right on schedule within the tolerance', () => {
      const base = getSeedShipment('SH-1009')
      const shipment: Shipment = { ...base, plannedDeliveryAt: '2026-10-18T10:30:00.000Z' }

      const summary = summarizeShipmentForCustomer({ shipment, originCity: 'Zaragoza' })

      expect(summary.text).toContain('on Oct 18 at 10:00, right on schedule.')
    })

    it('does not mention the proof of delivery when it was not received', () => {
      const base = getSeedShipment('SH-1009')
      const shipment: Shipment = {
        ...base,
        documents: base.documents.filter(document => document.type !== 'proofOfDelivery'),
      }

      const summary = summarizeShipmentForCustomer({ shipment, originCity: 'Zaragoza' })

      expect(summary.text).toBe(
        'Your order left Zaragoza on Oct 16 and was delivered to your Hamburg site on Oct 18 at 10:00, 1 day earlier than planned.',
      )
    })

    it('does not mention the proof of delivery when it is still pending', () => {
      const base = getSeedShipment('SH-1009')
      const shipment: Shipment = {
        ...base,
        documents: base.documents.map(document =>
          document.type === 'proofOfDelivery' ? { id: document.id, type: document.type, status: 'pending' } : document),
      }

      const summary = summarizeShipmentForCustomer({ shipment, originCity: 'Zaragoza' })

      expect(summary.text).not.toContain('proof of delivery')
    })

    it('leaves out the departure when the shipment has no pickup milestone', () => {
      const base = getSeedShipment('SH-1009')
      const shipment: Shipment = {
        ...base,
        milestones: base.milestones.filter(milestone => milestone.status !== 'pickedUp' && milestone.status !== 'departed'),
      }

      const summary = summarizeShipmentForCustomer({ shipment, originCity: 'Zaragoza' })

      expect(summary.text).toBe(
        'Your order was delivered to your Hamburg site on Oct 18 at 10:00, 1 day earlier than planned. The signed proof of delivery is ready to download.',
      )
    })
  })

  describe('internal data', () => {
    it('never repeats the estimate reason, the diagnosis or the notice draft of SH-1042', () => {
      const shipment = getSeedShipment('SH-1042')

      const { text } = summarizeShipmentForCustomer({ shipment, originCity: 'Zaragoza' })

      expect(text).not.toContain('Held by UK customs')
      expect(text).not.toContain('certificate of origin')
      expect(text).not.toContain('HS code')
      expect(text).not.toContain('demurrage')
      expect(text).not.toContain('Hello Nordwerk team')
    })

    it('never repeats the AI signal of a shipment that has one', () => {
      const shipment = getSeedShipment('SH-1034')

      const { text } = summarizeShipmentForCustomer({ shipment, originCity: 'Barcelona' })

      expect(shipment.aiSignal).toBeDefined()
      expect(text).not.toContain('12 km/h')
    })
  })
})
