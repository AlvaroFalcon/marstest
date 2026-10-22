import { createSeed, DEMO_NOW_ISO } from '@/api/seed'
import type { Shipment } from '@/api/types'
import {
  buildAiSignal,
  buildShipmentActions,
  getShipmentDetailState,
} from '@/lib/shipmentDetailState'

const now = new Date(DEMO_NOW_ISO)

function getSeedShipment(shipmentId: string): Shipment {
  const shipment = createSeed().shipments.find(candidate => candidate.id === shipmentId)
  if (!shipment) {
    throw new Error(`Seed shipment ${shipmentId} not found`)
  }
  return shipment
}

describe('getShipmentDetailState', () => {
  it('is on track for SH-1033, whose estimate is in line with the carrier ETA', () => {
    expect(getShipmentDetailState(getSeedShipment('SH-1033'), now)).toEqual({ kind: 'onTrack' })
  })

  it('is watching for SH-1034, which deviates with 58 % confidence and has no exception', () => {
    expect(getShipmentDetailState(getSeedShipment('SH-1034'), now)).toEqual({ kind: 'watching' })
  })

  it('is a predicted delay with its exception for SH-1035', () => {
    const shipment = getSeedShipment('SH-1035')

    expect(getShipmentDetailState(shipment, now)).toEqual({ kind: 'predictedDelay', exception: shipment.exceptions[0] })
  })

  it('is a predicted delay without exception when the data holds none', () => {
    const shipment = { ...getSeedShipment('SH-1035'), exceptions: [] }

    expect(getShipmentDetailState(shipment, now)).toEqual({ kind: 'predictedDelay', exception: null })
  })

  it('is watching at 74 % and a predicted delay at 75 % for the same deviating shipment', () => {
    const shipment = getSeedShipment('SH-1034')

    const below = getShipmentDetailState({ ...shipment, estimatedEta: { ...shipment.estimatedEta, confidence: 74 } }, now)
    const atThreshold = getShipmentDetailState({ ...shipment, estimatedEta: { ...shipment.estimatedEta, confidence: 75 } }, now)

    expect(below.kind).toBe('watching')
    expect(atThreshold).toEqual({ kind: 'predictedDelay', exception: null })
  })

  it('is an exception state for a customs hold, even though its delay class is predicted', () => {
    const state = getShipmentDetailState(getSeedShipment('SH-1042'), now)

    expect(state.kind).toBe('exception')
  })

  it('is an exception state for stale tracking with an open exception', () => {
    const state = getShipmentDetailState(getSeedShipment('SH-1029'), now)

    expect(state.kind).toBe('exception')
  })

  it('is stale when there is no update for more than 24 h and no exception', () => {
    const shipment = { ...getSeedShipment('SH-1029'), exceptions: [] }

    expect(getShipmentDetailState(shipment, now)).toEqual({ kind: 'stale' })
  })

  it('is scheduled for a shipment that has not been picked up', () => {
    expect(getShipmentDetailState(getSeedShipment('SH-1066'), now)).toEqual({ kind: 'scheduled' })
  })

  it('is delivered for SH-1009', () => {
    expect(getShipmentDetailState(getSeedShipment('SH-1009'), now)).toEqual({ kind: 'delivered' })
  })

  it('is watching when the carrier gave no ETA', () => {
    expect(getShipmentDetailState(getSeedShipment('SH-1044'), now)).toEqual({ kind: 'watching' })
  })
})

describe('buildAiSignal', () => {
  it('returns null for an on-track shipment', () => {
    const shipment = getSeedShipment('SH-1033')

    expect(buildAiSignal(shipment, getShipmentDetailState(shipment, now))).toBeNull()
  })

  it('returns null for a shipment with an exception that is not a delay', () => {
    const shipment = getSeedShipment('SH-1042')

    expect(buildAiSignal(shipment, getShipmentDetailState(shipment, now))).toBeNull()
  })

  it('uses the seeded text and evidence for a possible delay', () => {
    const shipment = getSeedShipment('SH-1034')

    const signal = buildAiSignal(shipment, getShipmentDetailState(shipment, now))

    expect(signal).toEqual({
      kind: 'possibleDelay',
      text: expect.stringContaining('A-8 near Nice'),
      evidence: { kind: 'label', label: 'Based on 9 GPS pings and 1 traffic feed' },
      citedEventIds: ['SH-1034-E1', 'SH-1034-E2'],
    })
  })

  it('marks a predicted delay as very likely', () => {
    const shipment = getSeedShipment('SH-1035')

    expect(buildAiSignal(shipment, getShipmentDetailState(shipment, now))?.kind).toBe('delayVeryLikely')
  })

  it('falls back to the reason of the estimate and the event count without a seeded signal', () => {
    const shipment = { ...getSeedShipment('SH-1034'), aiSignal: undefined }

    const signal = buildAiSignal(shipment, getShipmentDetailState(shipment, now))

    expect(signal).toEqual({
      kind: 'possibleDelay',
      text: shipment.estimatedEta.reason,
      evidence: { kind: 'events', count: 2 },
      citedEventIds: [],
    })
  })

  it('falls back to the diagnosis of the open exception for a predicted delay', () => {
    const shipment = { ...getSeedShipment('SH-1035'), aiSignal: undefined }
    const [exception] = shipment.exceptions

    const signal = buildAiSignal(shipment, getShipmentDetailState(shipment, now))

    expect(signal).toEqual({
      kind: 'delayVeryLikely',
      text: exception?.aiDiagnosis.summary,
      evidence: { kind: 'events', count: 2 },
      citedEventIds: ['SH-1035-E2', 'SH-1035-E3'],
    })
  })

  it('has no evidence to open when there are no events at all', () => {
    const shipment = { ...getSeedShipment('SH-1034'), aiSignal: undefined, rawEvents: [] }

    expect(buildAiSignal(shipment, getShipmentDetailState(shipment, now))?.evidence).toBeNull()
  })
})

describe('buildShipmentActions', () => {
  it('offers only manual actions when on track', () => {
    const shipment = getSeedShipment('SH-1033')

    expect(buildShipmentActions(shipment, getShipmentDetailState(shipment, now))).toEqual({
      note: 'nothingNeeded',
      actions: ['contactCarrier', 'messageCustomer', 'copyTrackingLink'],
    })
  })

  it('suggests asking the carrier to confirm while watching below the threshold', () => {
    const shipment = getSeedShipment('SH-1034')

    expect(buildShipmentActions(shipment, getShipmentDetailState(shipment, now))).toEqual({
      note: 'watchingLowConfidence',
      actions: ['askCarrierToConfirm', 'messageCustomer', 'copyTrackingLink'],
    })
  })

  it('does not blame low confidence when watching because the carrier gave no ETA at high confidence', () => {
    const shipment = getSeedShipment('SH-1044')
    const confident = { ...shipment, estimatedEta: { ...shipment.estimatedEta, confidence: 80 } }

    expect(buildShipmentActions(confident, getShipmentDetailState(confident, now)).note).toBe('watchingNoCarrierEta')
  })

  it('offers the draft review, a new slot and the inbox for a predicted delay with a pending draft', () => {
    const shipment = getSeedShipment('SH-1035')

    expect(buildShipmentActions(shipment, getShipmentDetailState(shipment, now))).toEqual({
      note: 'exceptionWithDraft',
      actions: ['reviewDraft', 'askNewSlot', 'openInbox'],
    })
  })

  it('hides the draft review once the draft is no longer pending', () => {
    const shipment = getSeedShipment('SH-1035')
    const [exception] = shipment.exceptions
    const handled: Shipment = {
      ...shipment,
      exceptions: exception ? [{ ...exception, draft: { status: 'discarded', discardedAt: DEMO_NOW_ISO } }] : [],
    }

    expect(buildShipmentActions(handled, getShipmentDetailState(handled, now))).toEqual({
      note: 'exceptionOpened',
      actions: ['askNewSlot', 'messageCustomer', 'openInbox'],
    })
  })

  it('offers no inbox link for a predicted delay without an exception', () => {
    const shipment = { ...getSeedShipment('SH-1035'), exceptions: [] }

    expect(buildShipmentActions(shipment, getShipmentDetailState(shipment, now))).toEqual({
      note: 'predictedWithoutException',
      actions: ['askNewSlot', 'messageCustomer', 'copyTrackingLink'],
    })
  })

  it('links to the inbox for a customs hold', () => {
    const shipment = getSeedShipment('SH-1042')

    expect(buildShipmentActions(shipment, getShipmentDetailState(shipment, now)).actions).toContain('openInbox')
  })

  it('offers only customer actions once delivered', () => {
    const shipment = getSeedShipment('SH-1009')

    expect(buildShipmentActions(shipment, getShipmentDetailState(shipment, now))).toEqual({
      note: 'delivered',
      actions: ['messageCustomer', 'copyTrackingLink'],
    })
  })
})
