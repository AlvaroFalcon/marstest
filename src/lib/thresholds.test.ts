import { AI_REVIEW_THRESHOLD, CONFIDENCE_THRESHOLD, ETA_TOLERANCE_HOURS, STALE_AFTER_HOURS, WEIGHT_TOLERANCE_PERCENT } from '@/lib/thresholds'

describe('thresholds', () => {
  it('keeps the values agreed in the decision log', () => {
    expect(CONFIDENCE_THRESHOLD).toBe(75)
    expect(AI_REVIEW_THRESHOLD).toBe(70)
    expect(ETA_TOLERANCE_HOURS).toBe(2)
    expect(STALE_AFTER_HOURS).toBe(24)
    expect(WEIGHT_TOLERANCE_PERCENT).toBe(1)
  })
})
