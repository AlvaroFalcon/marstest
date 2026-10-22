import type { RawCarrierEvent } from '@/api/types'
import { buildSourceEventRows, computeEventTimeDelta } from '@/lib/sourceEvents'

function buildRawEvent(overrides: Partial<RawCarrierEvent>): RawCarrierEvent {
  return {
    id: 'EVT-1',
    carrierId: 'vascor-trans',
    channel: 'portal',
    receivedAt: '2026-10-16T09:14:00.000Z',
    rawText: 'Recogida realizada - Planta Bilbao',
    normalizedStatus: 'pickedUp',
    mapping: { method: 'rule', rule: 'Recogida realizada → Picked up' },
    ...overrides,
  }
}

describe('computeEventTimeDelta', () => {
  it('returns minutes only when the gap is under one hour', () => {
    const delta = computeEventTimeDelta('2026-10-16T09:00:00Z', '2026-10-16T09:45:00Z')

    expect(delta).toEqual({ days: 0, hours: 0, minutes: 45 })
  })

  it('returns zero when the gap is under one minute', () => {
    const delta = computeEventTimeDelta('2026-10-16T09:00:00Z', '2026-10-16T09:00:59Z')

    expect(delta).toEqual({ days: 0, hours: 0, minutes: 0 })
  })

  it('returns zero when the second instant is not after the first', () => {
    const delta = computeEventTimeDelta('2026-10-16T09:00:00Z', '2026-10-16T08:00:00Z')

    expect(delta).toEqual({ days: 0, hours: 0, minutes: 0 })
  })

  it('keeps hours and minutes at 23 h 59 min', () => {
    const delta = computeEventTimeDelta('2026-10-16T09:00:00Z', '2026-10-17T08:59:00Z')

    expect(delta).toEqual({ days: 0, hours: 23, minutes: 59 })
  })

  it('switches to one day and drops minutes at exactly 24 h', () => {
    const delta = computeEventTimeDelta('2026-10-16T09:00:00Z', '2026-10-17T09:00:00Z')

    expect(delta).toEqual({ days: 1, hours: 0, minutes: 0 })
  })

  it('drops minutes once the gap reaches a day', () => {
    const delta = computeEventTimeDelta('2026-10-16T09:00:00Z', '2026-10-17T09:59:00Z')

    expect(delta).toEqual({ days: 1, hours: 0, minutes: 0 })
  })

  it('splits a multi-day gap into days and hours', () => {
    const delta = computeEventTimeDelta('2026-10-15T10:05:00Z', '2026-10-19T04:05:00Z')

    expect(delta).toEqual({ days: 3, hours: 18, minutes: 0 })
  })
})

describe('buildSourceEventRows', () => {
  it('orders the events oldest first regardless of input order', () => {
    const events = [
      buildRawEvent({ id: 'EVT-3', receivedAt: '2026-10-18T09:00:00Z' }),
      buildRawEvent({ id: 'EVT-1', receivedAt: '2026-10-16T09:00:00Z' }),
      buildRawEvent({ id: 'EVT-2', receivedAt: '2026-10-17T09:00:00Z' }),
    ]

    const rows = buildSourceEventRows(events, [])

    expect(rows.map(row => row.id)).toEqual(['EVT-1', 'EVT-2', 'EVT-3'])
  })

  it('gives the first row no delta and the others the gap to the previous one', () => {
    const events = [
      buildRawEvent({ id: 'EVT-1', receivedAt: '2026-10-16T09:00:00Z' }),
      buildRawEvent({ id: 'EVT-2', receivedAt: '2026-10-16T11:25:00Z' }),
    ]

    const rows = buildSourceEventRows(events, [])

    expect(rows[0]?.deltaFromPrevious).toBeNull()
    expect(rows[1]?.deltaFromPrevious).toEqual({ days: 0, hours: 2, minutes: 25 })
  })

  it('marks only the cited events', () => {
    const events = [
      buildRawEvent({ id: 'EVT-1', receivedAt: '2026-10-16T09:00:00Z' }),
      buildRawEvent({ id: 'EVT-2', receivedAt: '2026-10-17T09:00:00Z' }),
    ]

    const rows = buildSourceEventRows(events, ['EVT-2'])

    expect(rows.map(row => row.isCited)).toEqual([false, true])
  })

  it('ignores cited ids that do not match any event', () => {
    const events = [buildRawEvent({ id: 'EVT-1' })]

    const rows = buildSourceEventRows(events, ['EVT-99'])

    expect(rows).toHaveLength(1)
    expect(rows[0]?.isCited).toBe(false)
  })

  it('flags an AI mapping at 69 % for review', () => {
    const events = [buildRawEvent({ rawText: 'Mensaje raro', normalizedStatus: 'delayed', mapping: { method: 'ai', confidence: 69 } })]

    const rows = buildSourceEventRows(events, [])

    expect(rows[0]?.needsReview).toBe(true)
  })

  it('does not flag an AI mapping at 70 %', () => {
    const events = [buildRawEvent({ rawText: 'Mensaje raro', normalizedStatus: 'delayed', mapping: { method: 'ai', confidence: 70 } })]

    const rows = buildSourceEventRows(events, [])

    expect(rows[0]?.needsReview).toBe(false)
  })

  it('does not flag a rule mapping and keeps the rule label', () => {
    const events = [buildRawEvent({})]

    const rows = buildSourceEventRows(events, [])

    expect(rows[0]?.needsReview).toBe(false)
    expect(rows[0]?.status).toBe('pickedUp')
    expect(rows[0]?.mapping).toEqual({ method: 'rule', rule: 'Recogida realizada → Picked up' })
  })

  it('returns no rows for a shipment without events', () => {
    const rows = buildSourceEventRows([], ['EVT-1'])

    expect(rows).toEqual([])
  })
})
