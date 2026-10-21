import type { CarrierEta, EstimatedEta } from '@/api/types'
import { compareEta } from '@/lib/eta'

function buildCarrierEta(date: string): CarrierEta {
  return { status: 'provided', date, source: { carrierId: 'transauto', channel: 'api' }, updatedAt: '2026-10-20T08:00:00.000Z' }
}

function buildEstimatedEta(date: string): EstimatedEta {
  return { date, earliest: date, latest: date, confidence: 80, reason: 'Based on the last position' }
}

describe('compareEta', () => {
  it('is in line when both dates are equal', () => {
    const carrierEta = buildCarrierEta('2026-10-21T10:00:00.000Z')
    const estimatedEta = buildEstimatedEta('2026-10-21T10:00:00.000Z')

    const comparison = compareEta(carrierEta, estimatedEta)

    expect(comparison).toEqual({ kind: 'inLine', deltaHours: 0 })
  })

  it('is in line at exactly 2 hours later', () => {
    const carrierEta = buildCarrierEta('2026-10-21T10:00:00.000Z')
    const estimatedEta = buildEstimatedEta('2026-10-21T12:00:00.000Z')

    const comparison = compareEta(carrierEta, estimatedEta)

    expect(comparison).toEqual({ kind: 'inLine', deltaHours: 2 })
  })

  it('is in line at exactly 2 hours earlier', () => {
    const carrierEta = buildCarrierEta('2026-10-21T10:00:00.000Z')
    const estimatedEta = buildEstimatedEta('2026-10-21T08:00:00.000Z')

    const comparison = compareEta(carrierEta, estimatedEta)

    expect(comparison).toEqual({ kind: 'inLine', deltaHours: -2 })
  })

  it('deviates when the estimate is one minute over 2 hours later', () => {
    const carrierEta = buildCarrierEta('2026-10-21T10:00:00.000Z')
    const estimatedEta = buildEstimatedEta('2026-10-21T12:01:00.000Z')

    const comparison = compareEta(carrierEta, estimatedEta)

    expect(comparison.kind).toBe('deviates')
  })

  it('deviates when the estimate is one minute over 2 hours earlier', () => {
    const carrierEta = buildCarrierEta('2026-10-21T10:00:00.000Z')
    const estimatedEta = buildEstimatedEta('2026-10-21T07:59:00.000Z')

    const comparison = compareEta(carrierEta, estimatedEta)

    expect(comparison.kind).toBe('deviates')
  })

  it('reports a positive delta when our estimate is later than the carrier ETA', () => {
    const carrierEta = buildCarrierEta('2026-10-21T06:00:00.000Z')
    const estimatedEta = buildEstimatedEta('2026-10-21T13:00:00.000Z')

    const comparison = compareEta(carrierEta, estimatedEta)

    expect(comparison).toEqual({ kind: 'deviates', deltaHours: 7 })
  })

  it('reports a negative delta when our estimate is earlier than the carrier ETA', () => {
    const carrierEta = buildCarrierEta('2026-10-21T13:00:00.000Z')
    const estimatedEta = buildEstimatedEta('2026-10-21T06:00:00.000Z')

    const comparison = compareEta(carrierEta, estimatedEta)

    expect(comparison).toEqual({ kind: 'deviates', deltaHours: -7 })
  })

  it('reports a fractional delta in hours', () => {
    const carrierEta = buildCarrierEta('2026-10-21T10:00:00.000Z')
    const estimatedEta = buildEstimatedEta('2026-10-21T11:30:00.000Z')

    const comparison = compareEta(carrierEta, estimatedEta)

    expect(comparison).toEqual({ kind: 'inLine', deltaHours: 1.5 })
  })

  it('returns no carrier ETA when the carrier did not provide one', () => {
    const estimatedEta = buildEstimatedEta('2026-10-21T10:00:00.000Z')

    const comparison = compareEta({ status: 'notProvided' }, estimatedEta)

    expect(comparison).toEqual({ kind: 'noCarrierEta' })
  })
})
