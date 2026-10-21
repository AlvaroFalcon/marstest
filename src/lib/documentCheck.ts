import type { DocumentType, ExtractedDocumentFields, Shipment } from '@/api/types'
import { WEIGHT_TOLERANCE_PERCENT } from '@/lib/thresholds'

/** Fields of a document that are compared with the ERP order. */
export type CheckedField = keyof ExtractedDocumentFields

/**
 * One line of the document check. Field findings keep the raw ERP and document values so the UI
 * can show both sides.
 */
export type DocumentFinding
  = | { kind: 'match', documentId: string, documentType: DocumentType, field: 'hsCode', expected: string, actual: string }
    | { kind: 'match', documentId: string, documentType: DocumentType, field: 'grossWeightKg', expected: number, actual: number }
    | { kind: 'mismatch', documentId: string, documentType: DocumentType, field: 'hsCode', expected: string, actual: string }
    | { kind: 'mismatch', documentId: string, documentType: DocumentType, field: 'grossWeightKg', expected: number, actual: number }
    | { kind: 'missing', documentType: DocumentType }
    | { kind: 'pending', documentId: string, documentType: DocumentType }

/** Outcome of {@link checkDocuments}. `hasIssues` is true when any finding is a mismatch or missing. */
export type DocumentCheckResult = {
  findings: DocumentFinding[]
  hasIssues: boolean
}

function digitsOnly(hsCode: string): string {
  return hsCode.replaceAll(/\D/g, '')
}

function isWeightWithinTolerance(expected: number, actual: number): boolean {
  // Multiplying instead of dividing keeps the inclusive 1 % boundary free of floating point noise.
  return Math.abs(actual - expected) * 100 <= expected * WEIGHT_TOLERANCE_PERCENT
}

/**
 * Compares the documents of a shipment with its ERP order (operations only, ADR 0020).
 *
 * - Every received document with extracted fields is compared: HS codes by digits only
 *   ("8467.21" equals "846721"), gross weight within ±{@link WEIGHT_TOLERANCE_PERCENT} %.
 * - A required document with no entry at all is `missing`.
 * - A document that is expected but not received yet is `pending`, a separate finding that is
 *   not counted as an issue.
 */
export function checkDocuments(shipment: Shipment): DocumentCheckResult {
  const { erpOrder, documents } = shipment
  const findings: DocumentFinding[] = []

  for (const document of documents) {
    if (document.status === 'pending') {
      findings.push({ kind: 'pending', documentId: document.id, documentType: document.type })
      continue
    }

    const { hsCode, grossWeightKg } = document.extracted
    if (hsCode !== undefined) {
      findings.push({
        kind: digitsOnly(hsCode) === digitsOnly(erpOrder.hsCode) ? 'match' : 'mismatch',
        documentId: document.id,
        documentType: document.type,
        field: 'hsCode',
        expected: erpOrder.hsCode,
        actual: hsCode,
      })
    }
    if (grossWeightKg !== undefined) {
      findings.push({
        kind: isWeightWithinTolerance(erpOrder.grossWeightKg, grossWeightKg) ? 'match' : 'mismatch',
        documentId: document.id,
        documentType: document.type,
        field: 'grossWeightKg',
        expected: erpOrder.grossWeightKg,
        actual: grossWeightKg,
      })
    }
  }

  const presentTypes = new Set(documents.map(document => document.type))
  for (const requiredType of erpOrder.requiredDocuments) {
    if (!presentTypes.has(requiredType)) {
      findings.push({ kind: 'missing', documentType: requiredType })
    }
  }

  return {
    findings,
    hasIssues: findings.some(finding => finding.kind === 'mismatch' || finding.kind === 'missing'),
  }
}
