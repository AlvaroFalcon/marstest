import { createSeed } from '@/api/seed'
import type { Customer, Shipment } from '@/api/types'
import { draftCustomerNotice, suggestNextAction } from '@/lib/aiText'

function getSeedShipment(shipmentId: string): Shipment {
  const shipment = createSeed().shipments.find(candidate => candidate.id === shipmentId)
  if (!shipment) {
    throw new Error(`Seed shipment ${shipmentId} not found`)
  }
  return shipment
}

function getSeedCustomer(customerId: string): Customer {
  const customer = createSeed().customers.find(candidate => candidate.id === customerId)
  if (!customer) {
    throw new Error(`Seed customer ${customerId} not found`)
  }
  return customer
}

/** SH-1042 with the ERP HS code corrected to the one on its documents, so only the certificate of origin is missing. */
function buildCustomsHoldShipment(): Shipment {
  const shipment = getSeedShipment('SH-1042')
  return { ...shipment, erpOrder: { ...shipment.erpOrder, hsCode: '8467.29' } }
}

describe('suggestNextAction', () => {
  it('lists the missing certificate and both HS code corrections on the SH-1042 customs hold', () => {
    const action = suggestNextAction(getSeedShipment('SH-1042'))

    expect(action).toBe(
      'To release the customs hold, provide the missing certificate of origin, correct the HS code on the commercial invoice (8467.29 vs 8467.21 in the ERP order) and correct the HS code on the customs declaration (8467.29 vs 8467.21 in the ERP order).',
    )
  })

  it('asks only for the missing certificate when the documents have no mismatch', () => {
    const action = suggestNextAction(buildCustomsHoldShipment())

    expect(action).toBe('To release the customs hold, provide the missing certificate of origin.')
  })

  it('joins several missing documents', () => {
    const shipment = buildCustomsHoldShipment()
    const twoMissing: Shipment = {
      ...shipment,
      documents: shipment.documents.filter(document => document.type !== 'packingList'),
    }

    const action = suggestNextAction(twoMissing)

    expect(action).toBe('To release the customs hold, provide the missing packing list and certificate of origin.')
  })

  it('adds a gross weight correction step when a document weight is off by more than 1 %', () => {
    const shipment = buildCustomsHoldShipment()
    const heavyPackingList: Shipment = {
      ...shipment,
      documents: shipment.documents.map(document =>
        document.status === 'received' && document.type === 'packingList' ? { ...document, extracted: { grossWeightKg: 2000 } } : document),
    }

    const action = suggestNextAction(heavyPackingList)

    expect(action).toBe('To release the customs hold, provide the missing certificate of origin and correct the gross weight on the packing list (2000 kg vs 1840 kg in the ERP order).')
  })

  it('asks the customs broker when a customs hold has nothing to provide or correct', () => {
    const shipment = buildCustomsHoldShipment()
    const nothingToFix: Shipment = {
      ...shipment,
      erpOrder: { ...shipment.erpOrder, requiredDocuments: ['commercialInvoice', 'packingList', 'billOfLading', 'customsDeclaration'] },
    }

    const action = suggestNextAction(nothingToFix)

    expect(action).toBe('Ask the customs broker what the authority is waiting for.')
  })

  it('asks for a revised ETA and the cargo condition after an incident', () => {
    expect(suggestNextAction(getSeedShipment('SH-1051'))).toBe('Ask the carrier for a revised ETA and the condition of the cargo.')
  })

  it('asks for a new estimate review on a predicted delay exception', () => {
    expect(suggestNextAction(getSeedShipment('SH-1035'))).toBe('Review the new estimate and send the customer notice.')
  })

  it('asks the carrier for an update on stale tracking', () => {
    expect(suggestNextAction(getSeedShipment('SH-1029'))).toBe('Ask the carrier for a status update.')
  })

  it('asks to confirm the new sailing when the vessel was rolled', () => {
    const base = getSeedShipment('SH-1042')
    const shipment: Shipment = { ...base, exceptions: [{ ...base.exceptions[0], type: 'vesselRolled' }] }

    expect(suggestNextAction(shipment)).toBe('Confirm the new sailing with the carrier and send the customer notice.')
  })

  it('needs no action for an on-track shipment without exceptions', () => {
    expect(suggestNextAction(getSeedShipment('SH-1033'))).toBe('No action needed.')
  })

  it('asks the carrier to confirm the ETA when the shipment is only watching', () => {
    expect(suggestNextAction(getSeedShipment('SH-1034'))).toBe('Ask the carrier to confirm the ETA.')
  })

  it('suggests reviewing the estimate for a predicted delay without an exception', () => {
    const shipment = getSeedShipment('SH-1035')
    const withoutException: Shipment = { ...shipment, exceptions: [] }

    expect(suggestNextAction(withoutException)).toBe('Review the new estimate and send the customer notice.')
  })
})

describe('draftCustomerNotice', () => {
  it('drafts a vessel rolled notice for SH-1060 from the shipment values only', () => {
    const notice = draftCustomerNotice({
      shipment: getSeedShipment('SH-1060'),
      customer: getSeedCustomer('brenner-iberia'),
      exceptionType: 'vesselRolled',
    })

    expect(notice).toBe(
      'Hello Brenner Iberia S.L. team, shipment SH-1060 (PO 4500-1203) was not loaded on its vessel and moves to the next sailing. Last reported location: Bilbao port terminal. We now expect delivery on 22 Oct 2026.',
    )
  })

  it('drafts an incident notice for SH-1051', () => {
    const notice = draftCustomerNotice({
      shipment: getSeedShipment('SH-1051'),
      customer: getSeedCustomer('nordwerk'),
      exceptionType: 'incident',
    })

    expect(notice).toBe(
      'Hello Nordwerk GmbH team, shipment SH-1051 (PO 4500-1195) was affected by an incident on its way. Last reported location: A10 near Poitiers. We now expect delivery on 22 Oct 2026.',
    )
  })

  it('omits the location sentence when the shipment has no milestones', () => {
    const shipment: Shipment = { ...getSeedShipment('SH-1060'), milestones: [] }

    const notice = draftCustomerNotice({ shipment, customer: getSeedCustomer('brenner-iberia'), exceptionType: 'predictedDelay' })

    expect(notice).not.toContain('Last reported location')
    expect(notice).toContain('is expected to arrive later than the carrier ETA.')
  })

  it('uses the estimate date of the shipment', () => {
    const shipment = getSeedShipment('SH-1060')
    const moved: Shipment = { ...shipment, estimatedEta: { ...shipment.estimatedEta, date: '2026-11-03T08:00:00.000Z' } }

    const notice = draftCustomerNotice({ shipment: moved, customer: getSeedCustomer('brenner-iberia'), exceptionType: 'vesselRolled' })

    expect(notice).toContain('We now expect delivery on 3 Nov 2026.')
  })

  it('contains only the numbers present in the shipment and the order', () => {
    const notice = draftCustomerNotice({
      shipment: getSeedShipment('SH-1060'),
      customer: getSeedCustomer('brenner-iberia'),
      exceptionType: 'vesselRolled',
    })

    expect(notice.match(/\d+/g)).toEqual(['1060', '4500', '1203', '22', '2026'])
  })
})
