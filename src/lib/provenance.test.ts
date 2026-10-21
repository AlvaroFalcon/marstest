import type { CarrierEta, EstimatedEta } from '@/api/types'
import {
  getCarrierEtaUpdate,
  getElapsedTime,
  getEstimateComparisonNote,
  getEstimateRangeShape,
} from '@/lib/provenance'

const NOW = new Date('2026-10-20T10:00:00.000Z')

function buildCarrierEta(date: string): CarrierEta {
  return { status: 'provided', date, source: { carrierId: 'transauto', channel: 'api' }, updatedAt: '2026-10-20T08:00:00.000Z' }
}

function buildEstimatedEta(date: string, confidence = 90): EstimatedEta {
  return { date, earliest: date, latest: date, confidence, reason: 'Customs hold at Valencia' }
}

function buildRangedEstimate(earliest: string, latest: string): EstimatedEta {
  return { date: earliest, earliest, latest, confidence: 80, reason: 'Based on the last position' }
}

describe('getElapsedTime', () => {
  it('returns minutes at 59 minutes', () => {
    expect(getElapsedTime('2026-10-20T09:01:00.000Z', NOW)).toEqual({ unit: 'minutes', value: 59 })
  })

  it('returns hours at exactly 60 minutes', () => {
    expect(getElapsedTime('2026-10-20T09:00:00.000Z', NOW)).toEqual({ unit: 'hours', value: 1 })
  })

  it('floors partial hours', () => {
    expect(getElapsedTime('2026-10-20T07:30:00.000Z', NOW)).toEqual({ unit: 'hours', value: 2 })
  })

  it('returns hours at 47.9 hours', () => {
    expect(getElapsedTime('2026-10-18T10:06:00.000Z', NOW)).toEqual({ unit: 'hours', value: 47 })
  })

  it('returns days at exactly 48 hours', () => {
    expect(getElapsedTime('2026-10-18T10:00:00.000Z', NOW)).toEqual({ unit: 'days', value: 2 })
  })

  it('floors partial days', () => {
    expect(getElapsedTime('2026-10-16T22:00:00.000Z', NOW)).toEqual({ unit: 'days', value: 3 })
  })

  it('returns zero minutes when the date is in the future', () => {
    expect(getElapsedTime('2026-10-20T11:00:00.000Z', NOW)).toEqual({ unit: 'minutes', value: 0 })
  })

  it('returns zero minutes when the date equals now', () => {
    expect(getElapsedTime('2026-10-20T10:00:00.000Z', NOW)).toEqual({ unit: 'minutes', value: 0 })
  })
})

describe('getCarrierEtaUpdate', () => {
  it('is recent at 12 minutes', () => {
    expect(getCarrierEtaUpdate('2026-10-20T09:48:00.000Z', NOW)).toEqual({
      kind: 'recent',
      elapsed: { unit: 'minutes', value: 12 },
    })
  })

  it('is still recent at exactly 24 hours', () => {
    expect(getCarrierEtaUpdate('2026-10-19T10:00:00.000Z', NOW)).toEqual({
      kind: 'recent',
      elapsed: { unit: 'hours', value: 24 },
    })
  })

  it('is unchanged at 24 hours and 1 minute', () => {
    expect(getCarrierEtaUpdate('2026-10-19T09:59:00.000Z', NOW)).toEqual({
      kind: 'unchanged',
      since: '2026-10-19T09:59:00.000Z',
    })
  })
})

describe('getEstimateComparisonNote', () => {
  it('is in line at exactly 2 hours later', () => {
    const carrierEta = buildCarrierEta('2026-10-21T10:00:00.000Z')
    const estimatedEta = buildEstimatedEta('2026-10-21T12:00:00.000Z')

    expect(getEstimateComparisonNote(carrierEta, estimatedEta)).toEqual({ kind: 'inLine' })
  })

  it('is in line at exactly 2 hours earlier', () => {
    const carrierEta = buildCarrierEta('2026-10-21T10:00:00.000Z')
    const estimatedEta = buildEstimatedEta('2026-10-21T08:00:00.000Z')

    expect(getEstimateComparisonNote(carrierEta, estimatedEta)).toEqual({ kind: 'inLine' })
  })

  it('reports hours and later direction when it deviates with high confidence', () => {
    const carrierEta = buildCarrierEta('2026-10-21T10:00:00.000Z')
    const estimatedEta = buildEstimatedEta('2026-10-22T08:00:00.000Z', 92)

    expect(getEstimateComparisonNote(carrierEta, estimatedEta)).toEqual({
      kind: 'deviatesHighConfidence',
      hours: 22,
      direction: 'later',
    })
  })

  it('reports the earlier direction when our estimate precedes the carrier ETA', () => {
    const carrierEta = buildCarrierEta('2026-10-21T10:00:00.000Z')
    const estimatedEta = buildEstimatedEta('2026-10-21T04:00:00.000Z', 80)

    expect(getEstimateComparisonNote(carrierEta, estimatedEta)).toEqual({
      kind: 'deviatesHighConfidence',
      hours: 6,
      direction: 'earlier',
    })
  })

  it('rounds the deviation to whole hours', () => {
    const carrierEta = buildCarrierEta('2026-10-21T10:00:00.000Z')
    const estimatedEta = buildEstimatedEta('2026-10-21T15:30:00.000Z', 80)

    expect(getEstimateComparisonNote(carrierEta, estimatedEta)).toEqual({
      kind: 'deviatesHighConfidence',
      hours: 6,
      direction: 'later',
    })
  })

  it('treats exactly 75 percent confidence as high', () => {
    const carrierEta = buildCarrierEta('2026-10-21T10:00:00.000Z')
    const estimatedEta = buildEstimatedEta('2026-10-21T20:00:00.000Z', 75)

    expect(getEstimateComparisonNote(carrierEta, estimatedEta).kind).toBe('deviatesHighConfidence')
  })

  it('reports low confidence at 74 percent', () => {
    const carrierEta = buildCarrierEta('2026-10-21T10:00:00.000Z')
    const estimatedEta = buildEstimatedEta('2026-10-21T20:00:00.000Z', 74)

    expect(getEstimateComparisonNote(carrierEta, estimatedEta)).toEqual({ kind: 'deviatesLowConfidence' })
  })

  it('returns the reason when the carrier did not provide an ETA', () => {
    const estimatedEta = buildEstimatedEta('2026-10-21T20:00:00.000Z')

    expect(getEstimateComparisonNote({ status: 'notProvided' }, estimatedEta)).toEqual({
      kind: 'reason',
      reason: 'Customs hold at Valencia',
    })
  })
})

describe('getEstimateRangeShape', () => {
  it('is same-day times when the range stays within one UTC day', () => {
    const estimatedEta = buildRangedEstimate('2026-10-21T10:00:00.000Z', '2026-10-21T13:00:00.000Z')

    expect(getEstimateRangeShape(estimatedEta)).toBe('sameDayTimes')
  })

  it('is same-day times for a single instant', () => {
    expect(getEstimateRangeShape(buildEstimatedEta('2026-10-21T10:00:00.000Z'))).toBe('sameDayTimes')
  })

  it('is across-days times when the range crosses midnight in under 24 hours', () => {
    const estimatedEta = buildRangedEstimate('2026-10-21T23:00:00.000Z', '2026-10-22T01:00:00.000Z')

    expect(getEstimateRangeShape(estimatedEta)).toBe('acrossDaysTimes')
  })

  it('is across-days times at 23 hours 59 minutes', () => {
    const estimatedEta = buildRangedEstimate('2026-10-21T15:00:00.000Z', '2026-10-22T14:59:00.000Z')

    expect(getEstimateRangeShape(estimatedEta)).toBe('acrossDaysTimes')
  })

  it('is days at exactly 24 hours', () => {
    const estimatedEta = buildRangedEstimate('2026-10-21T15:00:00.000Z', '2026-10-22T15:00:00.000Z')

    expect(getEstimateRangeShape(estimatedEta)).toBe('days')
  })

  it('is days for a multi-day range', () => {
    const estimatedEta = buildRangedEstimate('2026-10-24T00:00:00.000Z', '2026-10-25T23:00:00.000Z')

    expect(getEstimateRangeShape(estimatedEta)).toBe('days')
  })
})
