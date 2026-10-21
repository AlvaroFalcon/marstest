import type { CarrierEta, EstimatedEta } from '@/api/types'
import { ETA_TOLERANCE_HOURS, MILLISECONDS_PER_HOUR } from '@/lib/thresholds'

/**
 * How our estimate relates to the carrier ETA (ADR 0026). `deltaHours` is positive when our
 * estimate is later than the carrier's.
 */
export type EtaComparison
  = | { kind: 'inLine', deltaHours: number }
    | { kind: 'deviates', deltaHours: number }
    | { kind: 'noCarrierEta' }

/**
 * Compares our estimate with the carrier ETA. A gap of up to {@link ETA_TOLERANCE_HOURS} hours
 * (inclusive, in either direction) is in line.
 *
 * @returns `noCarrierEta` when the carrier gave no ETA, since there is nothing to compare with.
 */
export function compareEta(carrierEta: CarrierEta, estimatedEta: EstimatedEta): EtaComparison {
  if (carrierEta.status === 'notProvided') {
    return { kind: 'noCarrierEta' }
  }

  const deltaHours = (Date.parse(estimatedEta.date) - Date.parse(carrierEta.date)) / MILLISECONDS_PER_HOUR
  return { kind: Math.abs(deltaHours) <= ETA_TOLERANCE_HOURS ? 'inLine' : 'deviates', deltaHours }
}
