import type { Shipment } from '@/api/types'
import { compareEta } from '@/lib/eta'
import { isDelivered } from '@/lib/shipmentStatus'
import { CONFIDENCE_THRESHOLD } from '@/lib/thresholds'

/** Delay class of a shipment (ADR 0027). */
export type DelayClass = 'onTrack' | 'watching' | 'predictedDelay'

/**
 * Classifies a shipment from its ETAs and the 75 % confidence threshold.
 *
 * - Delivered, or our estimate in line with the carrier ETA: `onTrack`.
 * - Estimate deviates with confidence below {@link CONFIDENCE_THRESHOLD}: `watching`.
 * - Estimate deviates with confidence at or above it: `predictedDelay`.
 * - Carrier gave no ETA: always `watching`, because without a reference the estimate alone is
 *   never enough to raise a delay.
 */
export function classifyDelay(shipment: Shipment): DelayClass {
  if (isDelivered(shipment)) {
    return 'onTrack'
  }

  const comparison = compareEta(shipment.carrierEta, shipment.estimatedEta)
  switch (comparison.kind) {
    case 'inLine':
      return 'onTrack'
    case 'noCarrierEta':
      return 'watching'
    case 'deviates':
      return shipment.estimatedEta.confidence >= CONFIDENCE_THRESHOLD ? 'predictedDelay' : 'watching'
  }
}
