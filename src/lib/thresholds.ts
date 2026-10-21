/**
 * Business thresholds of the prototype, kept in one place so the written document can quote them
 * and tests do not repeat magic numbers.
 */

/**
 * Largest gap, in hours, between our estimate and the carrier ETA that still counts as "in line".
 * The gap is inclusive: exactly this many hours is in line.
 */
export const ETA_TOLERANCE_HOURS = 2

/**
 * A shipment with no update for strictly more than this many hours has stale tracking
 * (exactly this many hours is still fresh).
 */
export const STALE_AFTER_HOURS = 24

/**
 * Confidence percentage (ADR 0027) at or above which a deviating estimate becomes a predicted
 * delay; below it the shipment is only "watching".
 */
export const CONFIDENCE_THRESHOLD = 75

/**
 * Confidence percentage below which an AI mapping of a raw carrier message is flagged for human
 * review. Rule mappings are deterministic and never flagged.
 */
export const AI_REVIEW_THRESHOLD = 70

/** Largest relative gap, in percent, between the document and the ERP gross weight that still matches. */
export const WEIGHT_TOLERANCE_PERCENT = 1

/** Milliseconds in an hour, shared by the time calculations of `src/lib/`. */
export const MILLISECONDS_PER_HOUR = 3_600_000
