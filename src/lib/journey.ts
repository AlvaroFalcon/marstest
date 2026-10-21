import { orderBy } from 'es-toolkit'
import type { EstimatedEta, Leg, Milestone, MilestoneStatus, Shipment, TransportMode } from '@/api/types'
import { compareEta } from '@/lib/eta'
import { getShipmentStatus, isDelivered } from '@/lib/shipmentStatus'

/** Where a step sits on the route, which decides how the UI weighs and decorates it. */
export type JourneyStepPosition = 'origin' | 'legEndpoint' | 'midLeg' | 'destination'

/**
 * `done` has happened, `problem` is where the shipment is stuck (customs hold, delay, incident,
 * rolled vessel) and `upcoming` has not been reached yet.
 */
export type JourneyStepState = 'done' | 'problem' | 'upcoming'

/**
 * The date line of a step, as data: the UI formats it with react-intl.
 *
 * - `occurred`: a milestone happened at `at`.
 * - `none`: the step was passed but no milestone reports when (for example the intermediate
 *   places of a delivered shipment).
 * - `planned`: intermediate future step, the planned date of its leg.
 * - `overdue`: intermediate future step whose planned date is already in the past.
 * - `carrierEta`: final step, the carrier ETA, shown only when our estimate is in line with it.
 * - `estimate`: final step, our estimate; the UI formats the range and its precision.
 */
export type JourneyStepDate
  = | { kind: 'occurred', at: string }
    | { kind: 'none' }
    | { kind: 'planned', at: string }
    | { kind: 'overdue', plannedAt: string }
    | { kind: 'carrierEta', at: string }
    | { kind: 'estimate', estimate: EstimatedEta }

/**
 * Where the date of a step comes from. Past carrier data has no label (`none`); `estimated` has
 * no confidence for intermediate steps, whose date is only the planned one.
 */
export type JourneyStepProvenance
  = | { kind: 'none' }
    | { kind: 'carrierEta' }
    | { kind: 'estimated', confidence?: number }
    | { kind: 'derivedFromGps' }

type JourneyConnectorBase = {
  /** Leg the connector belongs to; a leg split by a mid-leg step yields two connectors. */
  legId: string
  /** The UI resolves the carrier name from reference data. */
  carrierId: string
  /** `done` when the step after the connector has been reached, `upcoming` otherwise. */
  state: 'done' | 'upcoming'
}

/** The arrow between two consecutive steps, labelled "Mode · Carrier" by the UI. */
export type JourneyConnector
  = | (JourneyConnectorBase & { mode: Extract<TransportMode, 'road'> })
    | (JourneyConnectorBase & { mode: Extract<TransportMode, 'sea'>, vessel: string })

/** One node of the journey. */
export type JourneyStep = {
  /** Stable within a shipment's journey: the position in the list. */
  id: string
  /** Title: the milestone location once reached, the planned place name otherwise. */
  place: string
  position: JourneyStepPosition
  /** Status of the milestone that reached the step; `null` when no milestone reports it. */
  status: MilestoneStatus | null
  state: JourneyStepState
  date: JourneyStepDate
  provenance: JourneyStepProvenance
  /** Raw carrier events behind the step, in chronological order; empty for derived or future steps. */
  rawEventIds: string[]
  /** Arrow to the next step; `null` on the last step. */
  connectorToNext: JourneyConnector | null
}

type MilestoneRole = 'origin' | 'destination' | 'midLeg'

/**
 * Which end of its leg a milestone status describes. Mid-leg statuses never create a place node
 * by themselves: only the latest one of the shipment becomes a node.
 */
const MILESTONE_ROLE: Record<MilestoneStatus, MilestoneRole> = {
  booked: 'origin',
  pickedUp: 'origin',
  loadedOnVessel: 'origin',
  departed: 'origin',
  arrived: 'destination',
  customsHold: 'destination',
  customsCleared: 'destination',
  outForDelivery: 'midLeg',
  delivered: 'destination',
  inTransit: 'midLeg',
  delayed: 'midLeg',
  incident: 'midLeg',
  vesselRolled: 'midLeg',
}

/** Statuses that mean the shipment is stuck, so the node is highlighted as a problem. */
const PROBLEM_STATUSES: ReadonlySet<MilestoneStatus> = new Set(['customsHold', 'delayed', 'incident', 'vesselRolled'])

/** A place of the route, possibly several consecutive legs' boundaries when names repeat. */
type PlaceDraft = {
  name: string
  /** Last route boundary (0 = origin of the first leg, n = destination of leg n) of the place. */
  lastBoundary: number
  milestones: Milestone[]
}

type StepDraft = {
  place: string
  milestone: Milestone | undefined
  milestones: Milestone[]
  isMidLeg: boolean
  /** Index in `legs` of the leg that the connector to the next step travels. */
  nextLegIndex: number
  plannedAt: string
}

function sortLatestFirst(milestones: Milestone[]): Milestone[] {
  return orderBy(
    milestones,
    [milestone => Date.parse(milestone.occurredAt), milestone => Date.parse(milestone.receivedAt)],
    ['desc', 'desc'],
  )
}

function buildPlaceDrafts(legs: Leg[]): { places: PlaceDraft[], placeIndexOfBoundary: number[] } {
  const boundaryNames = [legs[0]?.origin ?? '', ...legs.map(leg => leg.destination)]
  const places: PlaceDraft[] = []
  const placeIndexOfBoundary: number[] = []

  boundaryNames.forEach((name, boundary) => {
    const previousPlace = places.at(-1)
    if (previousPlace && previousPlace.name === name) {
      previousPlace.lastBoundary = boundary
    }
    else {
      places.push({ name, lastBoundary: boundary, milestones: [] })
    }
    placeIndexOfBoundary.push(places.length - 1)
  })

  return { places, placeIndexOfBoundary }
}

/** True when the leg had already started (a departure-side or mid-leg milestone) when `milestone` happened. */
function wasLegStartedAt(shipment: Shipment, milestone: Milestone): boolean {
  return shipment.milestones.some(other => other.legId === milestone.legId
    && MILESTONE_ROLE[other.status] !== 'destination'
    && Date.parse(other.occurredAt) <= Date.parse(milestone.occurredAt))
}

function getPlannedAt(legs: Leg[], boundary: number): string {
  const leg = boundary === 0 ? legs[0] : legs[boundary - 1]
  if (!leg) {
    return ''
  }
  return boundary === 0 ? leg.plannedDepartureAt : leg.plannedArrivalAt
}

function buildConnector(leg: Leg, state: JourneyConnector['state']): JourneyConnector {
  const base = { legId: leg.id, carrierId: leg.carrierId, state }
  return leg.mode === 'sea' ? { ...base, mode: 'sea', vessel: leg.vessel } : { ...base, mode: 'road' }
}

/**
 * Builds the view model of the journey component: one step per place along the legs, plus one
 * mid-leg step when the latest milestone happened between two places (ADR 0049: data only, the UI
 * formats it).
 *
 * Rules, all decided with the user:
 * - Milestones go to a place by leg and status role (`pickedUp`, `booked`, `loadedOnVessel`,
 *   `departed` to the origin of their leg; `arrived`, `customsHold`, `customsCleared`,
 *   `delivered` to its destination). The latest milestone of a place gives its
 *   title, status and date.
 * - Only the latest milestone of the shipment can be a mid-leg step (`inTransit`, `delayed`,
 *   `incident`, `vesselRolled`, `outForDelivery` or any derived one); earlier ones are dropped.
 * - A customs hold turns the port step into the problem step. A mid-leg `delayed`, `incident` or
 *   `vesselRolled` step is a problem step too.
 * - A step passed without its own milestone is `done` with no date; a delivered shipment is `done`
 *   from end to end.
 * - Future steps carry the planned date of their leg (`overdue` when already past). The final step
 *   carries the carrier ETA when our estimate is in line with it, our estimate otherwise.
 *
 * Two guards keep inconsistent carrier data from marking places as reached: an `arrived`-style
 * milestone of a leg that has no departure-side milestone yet is ignored (a terminal arrival
 * reported under the next leg), and the final place is reached only by `delivered`.
 *
 * @param now - Injected for deterministic tests; decides which planned dates are overdue.
 * @returns Steps in route order; every step but the last carries the connector to the next one.
 */
export function buildJourney(shipment: Shipment, now: Date): JourneyStep[] {
  const { legs } = shipment
  const delivered = isDelivered(shipment)
  const latestStatus = getShipmentStatus(shipment)
  const midLegMilestone = latestStatus.kind === 'known'
    && (MILESTONE_ROLE[latestStatus.status] === 'midLeg' || latestStatus.milestone.source === 'derived')
    ? latestStatus.milestone
    : undefined

  const { places, placeIndexOfBoundary } = buildPlaceDrafts(legs)
  const finalPlaceIndex = places.length - 1

  shipment.milestones.forEach((milestone) => {
    const legIndex = legs.findIndex(leg => leg.id === milestone.legId)
    const role = MILESTONE_ROLE[milestone.status]
    if (legIndex < 0 || milestone.source === 'derived' || role === 'midLeg') {
      return
    }

    const isDelivery = milestone.status === 'delivered'
    const placeIndex = delivered && isDelivery
      ? finalPlaceIndex
      : placeIndexOfBoundary[role === 'origin' ? legIndex : legIndex + 1]
    const place = placeIndex === undefined ? undefined : places[placeIndex]
    if (!place) {
      return
    }

    const isReachedTooEarly = role === 'destination' && !isDelivery && !wasLegStartedAt(shipment, milestone)
    const isFinalPlaceNotDelivered = placeIndex === finalPlaceIndex && !isDelivery && milestone.status !== 'customsHold'
    if (isReachedTooEarly || isFinalPlaceNotDelivered) {
      return
    }

    place.milestones.push(milestone)
  })

  const midLegIndex = midLegMilestone ? legs.findIndex(leg => leg.id === midLegMilestone.legId) : -1
  const drafts: StepDraft[] = []

  places.forEach((place, placeIndex) => {
    const [latestMilestone] = sortLatestFirst(place.milestones)
    const hasMidLegAfter = midLegMilestone !== undefined && midLegIndex >= 0 && placeIndexOfBoundary[midLegIndex] === placeIndex

    drafts.push({
      place: latestMilestone?.location ?? place.name,
      milestone: latestMilestone,
      milestones: place.milestones,
      isMidLeg: false,
      nextLegIndex: hasMidLegAfter ? midLegIndex : place.lastBoundary,
      plannedAt: getPlannedAt(legs, place.lastBoundary),
    })

    if (midLegMilestone && hasMidLegAfter) {
      drafts.push({
        place: midLegMilestone.location,
        milestone: midLegMilestone,
        milestones: [midLegMilestone],
        isMidLeg: true,
        nextLegIndex: midLegIndex,
        plannedAt: '',
      })
    }
  })

  const initialStates = drafts.map((draft): JourneyStepState => {
    if (!draft.milestone) {
      return 'upcoming'
    }
    return PROBLEM_STATUSES.has(draft.milestone.status) ? 'problem' : 'done'
  })
  const lastReachedIndex = initialStates.findLastIndex(state => state !== 'upcoming')
  const states = initialStates.map((state, index): JourneyStepState => {
    if (delivered) {
      return 'done'
    }
    return state === 'upcoming' && index < lastReachedIndex ? 'done' : state
  })

  const lastIndex = drafts.length - 1

  return drafts.map((draft, index): JourneyStep => {
    const state = states[index] ?? 'upcoming'
    const nextState = states[index + 1]
    const leg = legs[draft.nextLegIndex]
    const isLast = index === lastIndex

    let position: JourneyStepPosition = 'legEndpoint'
    if (draft.isMidLeg) {
      position = 'midLeg'
    }
    else if (index === 0) {
      position = 'origin'
    }
    else if (isLast) {
      position = 'destination'
    }

    const rawEventIds = sortLatestFirst(draft.milestones)
      .reverse()
      .flatMap(milestone => milestone.source === 'carrier' ? milestone.rawEventIds : [])

    return {
      id: `step-${index}`,
      place: draft.place,
      position,
      status: draft.milestone?.status ?? null,
      state,
      ...describeDateAndProvenance({ shipment, draft, state, isLast, now }),
      rawEventIds,
      connectorToNext: leg && !isLast && nextState
        ? buildConnector(leg, nextState === 'upcoming' ? 'upcoming' : 'done')
        : null,
    }
  })
}

type DescribeInput = {
  shipment: Shipment
  draft: StepDraft
  state: JourneyStepState
  isLast: boolean
  now: Date
}

function describeDateAndProvenance({ shipment, draft, state, isLast, now }: DescribeInput): Pick<JourneyStep, 'date' | 'provenance'> {
  if (state !== 'upcoming') {
    return {
      date: draft.milestone ? { kind: 'occurred', at: draft.milestone.occurredAt } : { kind: 'none' },
      provenance: draft.milestone?.source === 'derived' ? { kind: 'derivedFromGps' } : { kind: 'none' },
    }
  }

  if (isLast) {
    const { carrierEta, estimatedEta } = shipment
    if (carrierEta.status === 'provided' && compareEta(carrierEta, estimatedEta).kind === 'inLine') {
      return { date: { kind: 'carrierEta', at: carrierEta.date }, provenance: { kind: 'carrierEta' } }
    }
    return {
      date: { kind: 'estimate', estimate: estimatedEta },
      provenance: { kind: 'estimated', confidence: estimatedEta.confidence },
    }
  }

  const isOverdue = Date.parse(draft.plannedAt) < now.getTime()
  return {
    date: isOverdue ? { kind: 'overdue', plannedAt: draft.plannedAt } : { kind: 'planned', at: draft.plannedAt },
    provenance: { kind: 'estimated' },
  }
}
