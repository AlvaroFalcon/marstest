import { DEMO_NOW_ISO } from '@/api/seed'

/**
 * The current moment of the demo. It is frozen on purpose: the seed data is generated relative to
 * `DEMO_NOW_ISO`, so reading the real clock would make every shipment look stale or overdue.
 * Pages call this once and pass the result down as `now`, which keeps components deterministic.
 */
export function useNow(): Date {
  return new Date(DEMO_NOW_ISO)
}
