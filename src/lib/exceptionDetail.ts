import { maxBy, sortBy, uniq } from 'es-toolkit'
import type {
  CarrierChannel,
  DocumentType,
  ExceptionType,
  ReferenceData,
  Shipment,
  ShipmentException,
} from '@/api/types'
import { checkDocuments, type DocumentFinding } from '@/lib/documentCheck'
import { getRouteLabel } from '@/lib/exceptionInbox'
import { listExceptionsByUrgency } from '@/lib/exceptionPriority'

/** Where the latest raw carrier message came from: shown next to the freshness of the tracking. */
export type LatestEventSource = {
  carrierName: string
  channel: CarrierChannel
}

/** Values of the header and internal data row shared by every shipment detail (exception or not). */
export type ShipmentDetailModel = {
  shipmentId: string
  /** "Zaragoza → Birmingham". */
  routeLabel: string
  customerName: string
  originSiteName: string
  /** Carriers in leg order without repeats, joined with " · ". */
  carriersLabel: string
  /** PO number of the ERP order, without any prefix. */
  poNumber: string
  /** Carrier named in the carrier ETA card: the source of the ETA, or the last carrier when none is given. */
  etaCarrierName: string
  /** Carrier and channel of the most recently received raw event, or `null` when none arrived yet. */
  latestEventSource: LatestEventSource | null
}

/** Outcome of a document row; `received` is a received document with nothing to compare. */
export type DocumentRowResult = DocumentFinding | { kind: 'received', documentType: DocumentType }

/** One line of the document check: a required document and its worst finding. */
export type DocumentRow = {
  documentType: DocumentType
  result: DocumentRowResult
  /** True when this missing document is what keeps the shipment in customs. */
  isCauseOfHold: boolean
}

/** Values of the optional exception layer of a shipment detail. */
export type ExceptionLayerModel = {
  exceptionId: string
  type: ExceptionType
  /** ISO instant the exception was opened. */
  openedAt: string
  /** Full AI diagnosis text. */
  diagnosis: string
  /** Events the diagnosis cites. */
  citedEventCount: number
  /** Documents already received (pending and missing ones do not count as evidence). */
  receivedDocumentCount: number
  /** One row per required document, in the order of the ERP order. */
  documentRows: DocumentRow[]
}

const FINDING_SEVERITY: Record<DocumentRowResult['kind'], number> = {
  missing: 0,
  mismatch: 1,
  pending: 2,
  match: 3,
  received: 4,
}

/**
 * Returns the open exception to show for a shipment: the most urgent one by the inbox rules, so
 * the detail and the inbox card always agree. `null` when the shipment has no open exception.
 */
export function pickMostUrgentException(shipment: Shipment): ShipmentException | null {
  const [mostUrgent] = listExceptionsByUrgency([shipment])
  return mostUrgent?.exception ?? null
}

/** Carrier names in leg order without repeats, joined with " · " ("Transauto · Nordsee Line"). */
export function getCarriersLabel(shipment: Shipment, carriers: ReferenceData['carriers']): string {
  const carrierIds = uniq(shipment.legs.map(leg => leg.carrierId))
  return carrierIds
    .map(carrierId => carriers.find(carrier => carrier.id === carrierId)?.name ?? carrierId)
    .join(' · ')
}

/** Returns the carrier and channel of the raw event received last, or `null` without raw events. */
export function getLatestEventSource(shipment: Shipment, carriers: ReferenceData['carriers']): LatestEventSource | null {
  const latest = maxBy(shipment.rawEvents, rawEvent => Date.parse(rawEvent.receivedAt))
  if (latest === undefined) {
    return null
  }
  return {
    carrierName: carriers.find(carrier => carrier.id === latest.carrierId)?.name ?? latest.carrierId,
    channel: latest.channel,
  }
}

/**
 * Builds one row per required document, in ERP order, each showing its worst finding
 * (missing, then mismatch, then pending, then match). A mismatch therefore wins over a match on
 * the same document. Documents that are not required are left out. Without an `exceptionType`
 * (a shipment with no open exception) no row is marked as the cause of a hold.
 */
export function buildDocumentRows(shipment: Shipment, exceptionType?: ExceptionType): DocumentRow[] {
  const { findings } = checkDocuments(shipment)

  return shipment.erpOrder.requiredDocuments.map((documentType): DocumentRow => {
    const documentFindings = findings.filter(finding => finding.documentType === documentType)
    // sortBy is stable, so among equally severe findings the first one reported (HS code) is kept.
    const [worstFinding] = sortBy(documentFindings, [finding => FINDING_SEVERITY[finding.kind]])
    const result: DocumentRowResult = worstFinding ?? { kind: 'received', documentType }

    return {
      documentType,
      result,
      isCauseOfHold: result.kind === 'missing' && documentType === 'certificateOfOrigin' && exceptionType === 'customsHold',
    }
  })
}

/** Resolves the header and internal data row values of a shipment, ready to display. */
export function buildShipmentDetail(shipment: Shipment, referenceData: ReferenceData): ShipmentDetailModel {
  const { customers, sites, carriers } = referenceData
  const lastLeg = shipment.legs.at(-1)
  const etaCarrierId = shipment.carrierEta.status === 'provided'
    ? shipment.carrierEta.source.carrierId
    : lastLeg?.carrierId

  return {
    shipmentId: shipment.id,
    routeLabel: getRouteLabel(shipment, sites),
    customerName: customers.find(customer => customer.id === shipment.customerId)?.name ?? shipment.customerId,
    originSiteName: sites.find(site => site.id === shipment.originSiteId)?.name ?? shipment.originSiteId,
    carriersLabel: getCarriersLabel(shipment, carriers),
    poNumber: shipment.erpOrder.poNumber,
    etaCarrierName: carriers.find(carrier => carrier.id === etaCarrierId)?.name ?? etaCarrierId ?? '',
    latestEventSource: getLatestEventSource(shipment, carriers),
  }
}

/** Resolves the values of the exception layer (badge, diagnosis, evidence counts, document check). */
export function buildExceptionLayer(shipment: Shipment, exception: ShipmentException): ExceptionLayerModel {
  return {
    exceptionId: exception.id,
    type: exception.type,
    openedAt: exception.openedAt,
    diagnosis: exception.aiDiagnosis.summary,
    citedEventCount: exception.aiDiagnosis.basedOnEventIds.length,
    receivedDocumentCount: shipment.documents.filter(document => document.status === 'received').length,
    documentRows: buildDocumentRows(shipment, exception.type),
  }
}
