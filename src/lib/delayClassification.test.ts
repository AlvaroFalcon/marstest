import { createSeed } from '@/api/seed'
import type { Shipment } from '@/api/types'
import { classifyDelay } from '@/lib/delayClassification'

function getSeedShipment(shipmentId: string): Shipment {
  const shipment = createSeed().shipments.find(candidate => candidate.id === shipmentId)
  if (!shipment) {
    throw new Error(`Seed shipment ${shipmentId} not found`)
  }
  return shipment
}

/** SH-1034 (in transit, estimate 7 h after the carrier ETA) with the given estimate confidence. */
function buildDeviatingShipment(confidence: number): Shipment {
  const shipment = getSeedShipment('SH-1034')
  return { ...shipment, estimatedEta: { ...shipment.estimatedEta, confidence } }
}

describe('classifyDelay', () => {
  it('is watching when the estimate deviates with 74 % confidence', () => {
    const shipment = buildDeviatingShipment(74)

    expect(classifyDelay(shipment)).toBe('watching')
  })

  it('is a predicted delay when the estimate deviates with exactly 75 % confidence', () => {
    const shipment = buildDeviatingShipment(75)

    expect(classifyDelay(shipment)).toBe('predictedDelay')
  })

  it('is a predicted delay when the estimate deviates with 100 % confidence', () => {
    const shipment = buildDeviatingShipment(100)

    expect(classifyDelay(shipment)).toBe('predictedDelay')
  })

  it('is a predicted delay when our estimate is earlier than the carrier ETA by more than 2 hours', () => {
    const shipment = getSeedShipment('SH-1034')
    const earlier: Shipment = {
      ...shipment,
      estimatedEta: { ...shipment.estimatedEta, date: '2026-10-21T01:00:00.000Z', confidence: 90 },
    }

    expect(classifyDelay(earlier)).toBe('predictedDelay')
  })

  it('is on track when the estimate is in line, even with high confidence', () => {
    const shipment = getSeedShipment('SH-1033')

    expect(classifyDelay(shipment)).toBe('onTrack')
  })

  it('is on track when the estimate is in line, even with low confidence', () => {
    const shipment = getSeedShipment('SH-1033')
    const lowConfidence: Shipment = { ...shipment, estimatedEta: { ...shipment.estimatedEta, confidence: 10 } }

    expect(classifyDelay(lowConfidence)).toBe('onTrack')
  })

  it('is watching when the carrier gave no ETA, even with 99 % confidence', () => {
    const shipment = getSeedShipment('SH-1044')
    const confident: Shipment = { ...shipment, estimatedEta: { ...shipment.estimatedEta, confidence: 99 } }

    expect(classifyDelay(confident)).toBe('watching')
  })

  it('is on track when the shipment is delivered, even if the ETAs deviate', () => {
    const shipment = getSeedShipment('SH-1009')
    const deviating: Shipment = { ...shipment, estimatedEta: { ...shipment.estimatedEta, date: '2026-10-25T10:00:00.000Z', confidence: 95 } }

    expect(classifyDelay(deviating)).toBe('onTrack')
  })

  it('classifies the seeded SH-1034 as watching', () => {
    expect(classifyDelay(getSeedShipment('SH-1034'))).toBe('watching')
  })

  it('classifies the seeded SH-1035 as a predicted delay', () => {
    expect(classifyDelay(getSeedShipment('SH-1035'))).toBe('predictedDelay')
  })
})
