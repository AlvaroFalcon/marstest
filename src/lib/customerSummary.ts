import { minBy } from 'es-toolkit'
import type { MilestoneStatus, Shipment } from '@/api/types'
import { compareEta } from '@/lib/eta'
import { getDeliveryVsPlan, type DeliveryDuration } from '@/lib/deliveryVsPlan'
import { getShipmentStatus } from '@/lib/shipmentStatus'

/** Customer-facing summary of a shipment plus the number of carrier events it is based on. */
export type CustomerShipmentSummary = {
  text: string
  /** Raw carrier events of the shipment: the "Based on N carrier events" label. */
  eventCount: number
}

/** Inputs the summary needs that the shipment only holds as ids. */
export type CustomerSummaryInput = {
  shipment: Shipment
  /** City of the origin site. */
  originCity: string
}

/** Clause that follows "it" and reads naturally with the milestone location. */
const STATUS_CLAUSES: Record<MilestoneStatus, (location: string) => string> = {
  booked: location => `was booked at ${location}`,
  pickedUp: location => `was picked up at ${location}`,
  departed: location => `departed from ${location}`,
  // Seed locations are positions such as "A-2 near Lleida", so they follow a label, not a preposition.
  inTransit: location => `is in transit, last reported position ${location}`,
  arrived: location => `arrived at ${location}`,
  loadedOnVessel: location => `was loaded on the vessel at ${location}`,
  vesselRolled: location => `was not loaded on its vessel at ${location} and moves to the next sailing`,
  customsHold: location => `is waiting for customs clearance at ${location}`,
  customsCleared: location => `was cleared by customs at ${location}`,
  delayed: location => `is delayed at ${location}`,
  incident: location => `was affected by an incident at ${location}`,
  outForDelivery: location => `is out for delivery in ${location}`,
  delivered: location => `was delivered to ${location}`,
}

const dayFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

const timeFormatter = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' })

function formatDay(isoDate: string): string {
  return dayFormatter.format(new Date(isoDate))
}

/** "Oct 24–25" inside one month, "Oct 31 – Nov 2" across two, a single day when both ends fall on it. */
function formatDayRange(earliest: string, latest: string): string {
  const first = formatDay(earliest)
  const last = formatDay(latest)
  if (first === last) {
    return first
  }

  const earliestDate = new Date(earliest)
  const latestDate = new Date(latest)
  return earliestDate.getUTCMonth() === latestDate.getUTCMonth()
    ? `${first}–${latestDate.getUTCDate()}`
    : `${first} – ${last}`
}

function formatDuration({ unit, count }: DeliveryDuration): string {
  return `${count} ${unit}${count === 1 ? '' : 's'}`
}

function describeDeliveryVsPlan(shipment: Shipment): string {
  const deliveryVsPlan = getDeliveryVsPlan(shipment)
  switch (deliveryVsPlan.kind) {
    case 'early':
      return `, ${formatDuration(deliveryVsPlan.duration)} earlier than planned`
    case 'late':
      return `, ${formatDuration(deliveryVsPlan.duration)} later than planned`
    case 'onTime':
      return ', right on schedule'
    case 'notDelivered':
      return ''
  }
}

function hasReceivedProofOfDelivery(shipment: Shipment): boolean {
  return shipment.documents.some(document => document.type === 'proofOfDelivery' && document.status === 'received')
}

function describeExpectedArrival(shipment: Shipment): string {
  const { estimatedEta, carrierEta, destination } = shipment
  const expectedDays = formatDayRange(estimatedEta.earliest, estimatedEta.latest)
  const expected = `We expect it in ${destination.city} on ${expectedDays}`
  // "on Oct 21 instead of Oct 21" would read as a mistake, so a carrier ETA on the same day is left out.
  const isCarrierEtaWorthMentioning = compareEta(carrierEta, estimatedEta).kind === 'deviates'
    && carrierEta.status === 'provided'
    && formatDay(carrierEta.date) !== expectedDays
  return isCarrierEtaWorthMentioning && carrierEta.status === 'provided'
    ? `${expected} instead of ${formatDay(carrierEta.date)}.`
    : `${expected}.`
}

/**
 * Simulated AI summary written for the customer, in plain language. Every sentence is built only
 * from values the customer may see in the shipment (milestones, carrier ETA, our estimate,
 * planned delivery and received documents), so it can never invent a date and never leaks the
 * internal diagnosis, AI signal, notice drafts, document check or ERP data. One text serves the
 * wide and the narrow layout.
 *
 * Delivered shipments say when and how it compared with the plan, and mention the signed proof of
 * delivery only when it was received. The others say where the shipment is and when we expect it,
 * naming the carrier ETA only when our estimate deviates from it.
 */
export function summarizeShipmentForCustomer({ shipment, originCity }: CustomerSummaryInput): CustomerShipmentSummary {
  const status = getShipmentStatus(shipment)
  const departure = minBy(
    shipment.milestones.filter(milestone => milestone.status === 'pickedUp' || milestone.status === 'departed'),
    milestone => Date.parse(milestone.occurredAt),
  )
  const eventCount = shipment.rawEvents.length

  if (status.kind === 'known' && status.status === 'delivered') {
    const departed = departure === undefined ? '' : `left ${originCity} on ${formatDay(departure.occurredAt)} and `
    const deliveredAt = status.milestone.occurredAt
    const sentences = [
      `Your order ${departed}was delivered to your ${shipment.destination.city} site on ${formatDay(deliveredAt)} at ${timeFormatter.format(new Date(deliveredAt))}${describeDeliveryVsPlan(shipment)}.`,
    ]
    if (hasReceivedProofOfDelivery(shipment)) {
      sentences.push('The signed proof of delivery is ready to download.')
    }
    return { text: sentences.join(' '), eventCount }
  }

  const sentences: string[] = []
  if (status.kind === 'unknown') {
    sentences.push('Your order has no tracking update yet.')
  }
  else {
    sentences.push(departure === undefined
      ? `Your order has not left ${originCity} yet.`
      : `Your order left ${originCity} on ${formatDay(departure.occurredAt)}.`)
    if (status.milestone.id !== departure?.id) {
      sentences.push(`Latest update on ${formatDay(status.milestone.occurredAt)}: it ${STATUS_CLAUSES[status.status](status.milestone.location)}.`)
    }
  }
  sentences.push(describeExpectedArrival(shipment))

  return { text: sentences.join(' '), eventCount }
}
