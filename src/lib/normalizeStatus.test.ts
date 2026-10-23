import { createScriptedEvents, createSeed } from '@/api/seed'
import type { EventMapping, MilestoneStatus, RawCarrierEvent } from '@/api/types'
import { normalizeStatus } from '@/lib/normalizeStatus'

const seededRawEvents = createSeed().shipments.flatMap(shipment => shipment.rawEvents)
function getSeedRawEvent(predicate: (rawEvent: RawCarrierEvent) => boolean): RawCarrierEvent {
  const rawEvent = seededRawEvents.find(predicate)
  if (!rawEvent) {
    throw new Error('Seed raw event not found')
  }
  return rawEvent
}

const seededRuleEvents = seededRawEvents.filter(rawEvent => rawEvent.mapping.method === 'rule')

function buildRawEvent(overrides: Partial<RawCarrierEvent>): RawCarrierEvent {
  return {
    id: 'EVT-1',
    carrierId: 'vascor-trans',
    channel: 'portal',
    receivedAt: '2026-10-20T09:00:00.000Z',
    rawText: 'Mensaje desconocido',
    normalizedStatus: 'booked',
    mapping: { method: 'ai', confidence: 80 },
    ...overrides,
  }
}

describe('normalizeStatus', () => {
  describe('seeded rule-mapped events', () => {
    it('includes rule events to cover', () => {
      expect(seededRuleEvents.length).toBeGreaterThan(30)
    })

    it.each(seededRuleEvents.map(rawEvent => [rawEvent.id, rawEvent] as const))(
      'reproduces the stored status and rule label of %s',
      (_id, rawEvent) => {
        const result = normalizeStatus(rawEvent)

        expect(result.status).toBe(rawEvent.normalizedStatus)
        expect(result.mapping).toEqual(rawEvent.mapping)
        expect(result.needsReview).toBe(false)
      },
    )

    it('maps the simulated SH-1060 event to vessel rolled with its rule label', () => {
      const [rolledEvent] = createScriptedEvents(new Date('2026-10-20T10:00:00.000Z'))
      const rawEvent = {
        id: 'SH-1060-E4',
        receivedAt: '2026-10-20T10:00:00.000Z',
        normalizedStatus: rolledEvent.milestone.status,
        ...rolledEvent.carrierMessage,
      }

      const result = normalizeStatus(rawEvent)

      expect(result).toEqual({
        status: 'vesselRolled',
        mapping: { method: 'rule', rule: 'CODECO ROLLED → Vessel rolled' },
        needsReview: false,
      })
    })
  })

  describe('rule matching', () => {
    it('ignores the stored mapping when a rule matches', () => {
      const rawEvent = buildRawEvent({ rawText: 'Recogida realizada en planta', normalizedStatus: 'booked' })

      const result = normalizeStatus(rawEvent)

      expect(result).toEqual({
        status: 'pickedUp',
        mapping: { method: 'rule', rule: 'Recogida realizada → Picked up' },
        needsReview: false,
      })
    })

    it('matches without accents and in upper case', () => {
      const rawEvent = buildRawEvent({ rawText: 'EN TRANSITO POR ZARAGOZA' })

      const result = normalizeStatus(rawEvent)

      expect(result.status).toBe('inTransit')
      expect(result.mapping).toEqual({ method: 'rule', rule: 'En tránsito → In transit' })
    })

    it('matches in lower case', () => {
      const rawEvent = buildRawEvent({ carrierId: 'euroruta', rawText: 'picked_up zaragoza' })

      const result = normalizeStatus(rawEvent)

      expect(result.status).toBe('pickedUp')
    })

    it('uses the longest pattern when several match', () => {
      const rawEvent = buildRawEvent({ rawText: 'Entregado en terminal Bilbao' })

      const result = normalizeStatus(rawEvent)

      expect(result.status).toBe('arrived')
      expect(result.mapping).toEqual({ method: 'rule', rule: 'Entregado en terminal → Arrived' })
    })

    it('uses the shorter pattern when the longer one does not match', () => {
      const rawEvent = buildRawEvent({ rawText: 'Entregado en destino' })

      const result = normalizeStatus(rawEvent)

      expect(result.status).toBe('delivered')
    })

    it('does not match a pattern that belongs to another carrier', () => {
      const rawEvent = buildRawEvent({
        carrierId: 'euroruta',
        rawText: 'Entregado en terminal Bilbao',
        normalizedStatus: 'incident',
        mapping: { method: 'ai', confidence: 82 },
      })

      const result = normalizeStatus(rawEvent)

      expect(result).toEqual({ status: 'incident', mapping: { method: 'ai', confidence: 82 }, needsReview: false })
    })

    it('falls back to the stored AI mapping when the pattern is only a prefix of a longer word', () => {
      const rawEvent = buildRawEvent({
        carrierId: 'transauto',
        rawText: 'DELIVERED_TO_TERMINAL BILBAO',
        normalizedStatus: 'delayed',
        mapping: { method: 'ai', confidence: 90 },
      })

      const result = normalizeStatus(rawEvent)

      expect(result).toEqual({ status: 'delayed', mapping: { method: 'ai', confidence: 90 }, needsReview: false })
    })

    it('matches a pattern followed by a space', () => {
      const rawEvent = buildRawEvent({ carrierId: 'transauto', rawText: 'DELIVERED BILBAO', normalizedStatus: 'delayed' })

      const result = normalizeStatus(rawEvent)

      expect(result.status).toBe('delivered')
    })

    it('matches a pattern followed by punctuation', () => {
      const rawEvent = buildRawEvent({ carrierId: 'transauto', rawText: 'DELIVERED, signed by Maria', normalizedStatus: 'delayed' })

      const result = normalizeStatus(rawEvent)

      expect(result.status).toBe('delivered')
    })

    it('matches a pattern that is the whole text', () => {
      const rawEvent = buildRawEvent({ carrierId: 'transauto', rawText: 'DELIVERED', normalizedStatus: 'delayed' })

      const result = normalizeStatus(rawEvent)

      expect(result.status).toBe('delivered')
    })

    it('falls back to the stored mapping for a carrier without rules', () => {
      const rawEvent = buildRawEvent({
        carrierId: 'unknown-carrier',
        rawText: 'PICKED_UP',
        normalizedStatus: 'delayed',
        mapping: { method: 'ai', confidence: 88 },
      })

      const result = normalizeStatus(rawEvent)

      expect(result).toEqual({ status: 'delayed', mapping: { method: 'ai', confidence: 88 }, needsReview: false })
    })
  })

  describe('AI fallback', () => {
    it('uses the seeded AI status and confidence when no rule matches', () => {
      const rawEvent = getSeedRawEvent(candidate => candidate.id === 'SH-1051-E3')

      const result = normalizeStatus(rawEvent)

      expect(result).toEqual({ status: 'incident', mapping: { method: 'ai', confidence: 88 }, needsReview: false })
    })

    it('flags the seeded 54 % AI mapping for review', () => {
      const rawEvent = getSeedRawEvent(candidate => candidate.mapping.method === 'ai' && candidate.mapping.confidence === 54)

      const result = normalizeStatus(rawEvent)

      expect(result.status).toBe('inTransit')
      expect(result.needsReview).toBe(true)
    })

    it.each([
      [69, true],
      [70, false],
      [71, false],
      [0, true],
      [100, false],
    ] satisfies Array<[number, boolean]>)('with confidence %i sets needsReview to %s', (confidence, expectedNeedsReview) => {
      const mapping: EventMapping = { method: 'ai', confidence }
      const status: MilestoneStatus = 'customsHold'
      const rawEvent = buildRawEvent({ normalizedStatus: status, mapping })

      const result = normalizeStatus(rawEvent)

      expect(result.needsReview).toBe(expectedNeedsReview)
    })
  })
})
