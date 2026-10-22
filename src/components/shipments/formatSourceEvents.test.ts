import { createIntl } from 'react-intl'
import { messages } from '@/locales/en'
import {
  formatEventMapping,
  formatEventReceivedAt,
  formatEventStatus,
  formatEventTimeDelta,
  formatLowConfidence,
} from './formatSourceEvents'

const intl = createIntl({ locale: 'en', messages })

describe('formatEventReceivedAt', () => {
  it('formats the instant in UTC with date and time', () => {
    expect(formatEventReceivedAt(intl, '2026-10-16T09:14:00.000Z')).toBe('Oct 16 · 09:14')
  })
})

describe('formatEventTimeDelta', () => {
  it('shows days and hours from 24 h on', () => {
    expect(formatEventTimeDelta(intl, { days: 1, hours: 21, minutes: 0 })).toBe('+1 d 21 h')
  })

  it('drops the hours when they are zero', () => {
    expect(formatEventTimeDelta(intl, { days: 1, hours: 0, minutes: 0 })).toBe('+1 d')
  })

  it('shows hours and minutes below 24 h', () => {
    expect(formatEventTimeDelta(intl, { days: 0, hours: 2, minutes: 25 })).toBe('+2 h 25 min')
  })

  it('drops the minutes when they are zero', () => {
    expect(formatEventTimeDelta(intl, { days: 0, hours: 8, minutes: 0 })).toBe('+8 h')
  })

  it('shows only minutes below one hour', () => {
    expect(formatEventTimeDelta(intl, { days: 0, hours: 0, minutes: 45 })).toBe('+45 min')
  })

  it('shows zero minutes for a gap under one minute', () => {
    expect(formatEventTimeDelta(intl, { days: 0, hours: 0, minutes: 0 })).toBe('+0 min')
  })
})

describe('formatEventMapping', () => {
  it('says mapped by rule', () => {
    expect(formatEventMapping(intl, { method: 'rule', rule: 'PICKED_UP → Picked up' })).toBe('Mapped by rule')
  })

  it('says mapped by AI with its confidence', () => {
    expect(formatEventMapping(intl, { method: 'ai', confidence: 91 })).toBe('Mapped by AI · 91% confidence')
  })
})

describe('formatLowConfidence', () => {
  it('warns that the AI mapping needs human review', () => {
    expect(formatLowConfidence(intl, 54)).toBe('AI 54% · below threshold, needs human review')
  })
})

describe('formatEventStatus', () => {
  it('returns the plain status name when no review is needed', () => {
    expect(formatEventStatus(intl, 'customsHold', false)).toBe('Customs hold')
  })

  it('appends a question mark when the status needs review', () => {
    expect(formatEventStatus(intl, 'inTransit', true)).toBe('In transit?')
  })
})
