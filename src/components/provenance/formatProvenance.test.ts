import { createIntl } from 'react-intl'
import type { EstimatedEta } from '@/api/types'
import {
  formatCarrierChannel,
  formatElapsedTime,
  formatEstimateRange,
  formatEtaInstant,
  formatEvidenceLabel,
  formatUtcDayAndTimeWithComma,
} from '@/components/provenance/formatProvenance'
import { messages } from '@/locales/en'

const intl = createIntl({ locale: 'en', messages })

function buildEstimate(earliest: string, latest: string): EstimatedEta {
  return { date: earliest, earliest, latest, confidence: 80, reason: 'Customs hold' }
}

describe('formatElapsedTime', () => {
  it('formats minutes, hours and days compactly', () => {
    expect(formatElapsedTime(intl, { unit: 'minutes', value: 3 })).toBe('3 min ago')
    expect(formatElapsedTime(intl, { unit: 'hours', value: 2 })).toBe('2 h ago')
    expect(formatElapsedTime(intl, { unit: 'days', value: 3 })).toBe('3 d ago')
  })
})

describe('formatCarrierChannel', () => {
  it('names each channel', () => {
    expect(formatCarrierChannel(intl, 'api')).toBe('API')
    expect(formatCarrierChannel(intl, 'edi')).toBe('EDI')
    expect(formatCarrierChannel(intl, 'email')).toBe('Email')
    expect(formatCarrierChannel(intl, 'portal')).toBe('Portal')
  })
})

describe('formatUtcDayAndTimeWithComma', () => {
  it('writes the UTC day and time', () => {
    expect(formatUtcDayAndTimeWithComma(intl, '2026-10-19T09:00:00Z')).toBe('Oct 19, 09:00')
  })

  it('writes midnight as 00:00 and not 24:00', () => {
    expect(formatUtcDayAndTimeWithComma(intl, '2026-10-19T00:00:00Z')).toBe('Oct 19, 00:00')
  })
})

describe('formatEtaInstant', () => {
  it('shows only the day for a multi-day estimate', () => {
    expect(formatEtaInstant(intl, '2026-10-22T08:00:00Z', 'days')).toBe('Oct 22')
  })

  it('shows day and time for a same-day estimate', () => {
    expect(formatEtaInstant(intl, '2026-10-21T10:00:00Z', 'sameDayTimes')).toBe('Oct 21 · 10:00')
  })
})

describe('formatEstimateRange', () => {
  it('writes times on a single day', () => {
    const estimate = buildEstimate('2026-10-21T10:00:00Z', '2026-10-21T13:00:00Z')

    expect(formatEstimateRange(intl, estimate, 'sameDayTimes')).toBe('Oct 21 · 10:00–13:00')
  })

  it('writes both days with times when the window crosses midnight in under 24 hours', () => {
    const estimate = buildEstimate('2026-10-21T15:00:00Z', '2026-10-22T10:00:00Z')

    expect(formatEstimateRange(intl, estimate, 'acrossDaysTimes')).toBe('Oct 21 15:00 – Oct 22 10:00')
  })

  it('writes a day range within one month', () => {
    const estimate = buildEstimate('2026-10-24T00:00:00Z', '2026-10-25T12:00:00Z')

    expect(formatEstimateRange(intl, estimate, 'days')).toBe('Oct 24–25')
  })

  it('writes both months when the day range crosses months', () => {
    const estimate = buildEstimate('2026-10-31T00:00:00Z', '2026-11-02T12:00:00Z')

    expect(formatEstimateRange(intl, estimate, 'days')).toBe('Oct 31 – Nov 2')
  })

  it('writes a single day when a multi-day window starts and ends on the same day', () => {
    const estimate = buildEstimate('2026-10-24T00:00:00Z', '2026-10-24T23:59:00Z')

    expect(formatEstimateRange(intl, estimate, 'days')).toBe('Oct 24')
  })
})

describe('formatEvidenceLabel', () => {
  it('uses the singular for one item', () => {
    expect(formatEvidenceLabel(intl, { kind: 'events', count: 1 })).toBe('Based on 1 event')
  })

  it('uses the plural for several items', () => {
    expect(formatEvidenceLabel(intl, { kind: 'carrierEvents', count: 6 })).toBe('Based on 6 carrier events')
  })

  it('joins two kinds of evidence', () => {
    expect(formatEvidenceLabel(intl, { kind: 'events', count: 6 }, { kind: 'documents', count: 4 }))
      .toBe('Based on 6 events and 4 documents')
  })
})
