import { createSeed, DEMO_NOW_ISO } from '@/api/seed'
import {
  buildShipmentListPage,
  buildShipmentRows,
  countRowsBySite,
  DEFAULT_SHIPMENT_SORT,
  filterShipmentRows,
  getNextSort,
  getShipmentListStatus,
  getSortState,
  paginateShipmentRows,
  sortShipmentRows,
  splitSearchTerms,
  type ShipmentListQuery,
} from '@/lib/shipmentList'

const seed = createSeed()
const now = new Date(DEMO_NOW_ISO)
const rows = buildShipmentRows(seed.shipments, seed, now)

const defaultQuery: ShipmentListQuery = { siteId: null, status: null, search: '', sort: 'carrierEtaAsc', page: 1 }

function ids(list: readonly { id: string }[]): string[] {
  return list.map(row => row.id)
}

describe('getShipmentListStatus', () => {
  function statusOf(shipmentId: string) {
    const shipment = seed.shipments.find(candidate => candidate.id === shipmentId)
    return shipment && getShipmentListStatus(shipment, now)
  }

  it('is delivered for a delivered shipment', () => {
    expect(statusOf('SH-1009')).toBe('delivered')
  })

  it('is at risk for a customs hold even though tracking is also stale', () => {
    expect(statusOf('SH-1042')).toBe('atRisk')
  })

  it('is at risk for a predicted delay', () => {
    expect(statusOf('SH-1035')).toBe('atRisk')
  })

  it('is no recent update when the only exception is stale tracking', () => {
    expect(statusOf('SH-1029')).toBe('stale')
  })

  it('is scheduled when the latest milestone is booked', () => {
    expect(statusOf('SH-1066')).toBe('scheduled')
  })

  it('is on time for a shipment with a low-confidence deviation that is only watched', () => {
    expect(statusOf('SH-1034')).toBe('onTime')
  })
})

describe('buildShipmentRows', () => {
  it('keeps the ops sites only, delivered shipments included', () => {
    expect(rows).toHaveLength(16)
    expect(ids(rows)).not.toContain('SH-1055')
    expect(ids(rows)).toContain('SH-1009')
  })

  it('resolves customer, cities and distinct carriers', () => {
    const row = rows.find(candidate => candidate.id === 'SH-1042')

    expect(row?.customerName).toBe('Nordwerk GmbH')
    expect(row?.originCity).toBe('Zaragoza')
    expect(row?.destinationCity).toBe('Birmingham')
    expect(row?.carrierNames).toEqual(['Transauto', 'Nordsee Line'])
  })

  it('has no confidence for a delivered shipment and flags its proof of delivery', () => {
    const row = rows.find(candidate => candidate.id === 'SH-1009')

    expect(row?.confidence).toBeNull()
    expect(row?.hasProofOfDelivery).toBe(true)
  })
})

describe('filterShipmentRows', () => {
  it('keeps the rows of one site', () => {
    const result = filterShipmentRows(rows, { siteId: 'barcelona-warehouse', status: null, search: '' })

    expect(ids(result)).toEqual(['SH-1034', 'SH-1044', 'SH-1066'])
  })

  it('keeps the rows with one status', () => {
    const result = filterShipmentRows(rows, { siteId: null, status: 'delivered', search: '' })

    expect(ids(result)).toEqual(['SH-1009', 'SH-1012'])
  })

  it('searches the shipment id ignoring case', () => {
    expect(ids(filterShipmentRows(rows, { siteId: null, status: null, search: 'sh-1042' }))).toEqual(['SH-1042'])
  })

  it('searches the customer name', () => {
    const result = filterShipmentRows(rows, { siteId: null, status: null, search: 'brenner' })

    expect(ids(result)).toEqual(['SH-1029', 'SH-1044', 'SH-1060', 'SH-1012', 'SH-1048'])
  })

  it('searches the purchase order number', () => {
    expect(ids(filterShipmentRows(rows, { siteId: null, status: null, search: '4500-1187' }))).toHaveLength(1)
  })

  it('searches the carrier name', () => {
    const result = filterShipmentRows(rows, { siteId: null, status: null, search: 'nordsee' })

    expect(ids(result)).toEqual(['SH-1042', 'SH-1053'])
  })

  it('searches the destination city', () => {
    expect(ids(filterShipmentRows(rows, { siteId: null, status: null, search: 'seville' }))).toEqual(['SH-1029'])
  })

  it('requires every term of the search to match', () => {
    const result = filterShipmentRows(rows, { siteId: null, status: null, search: 'nordwerk hamburg' })

    expect(ids(result)).toEqual(['SH-1009'])
  })

  it('combines site, status and search', () => {
    const result = filterShipmentRows(rows, { siteId: 'zaragoza-plant', status: 'atRisk', search: 'munich' })

    expect(ids(result)).toEqual(['SH-1035'])
  })
})

describe('getSortState', () => {
  it('splits the sort into column and direction', () => {
    expect(getSortState('confidenceDesc')).toEqual({ column: 'confidence', direction: 'desc' })
  })
})

describe('getNextSort', () => {
  it('toggles carrier ETA from ascending to descending and back to the default', () => {
    expect(getNextSort('carrierEtaAsc', 'carrierEta')).toBe('carrierEtaDesc')
    expect(getNextSort('carrierEtaDesc', 'carrierEta')).toBe(DEFAULT_SHIPMENT_SORT)
  })

  it('starts confidence with the highest first, then lowest first, then the default', () => {
    expect(getNextSort('carrierEtaAsc', 'confidence')).toBe('confidenceDesc')
    expect(getNextSort('confidenceDesc', 'confidence')).toBe('confidenceAsc')
    expect(getNextSort('confidenceAsc', 'confidence')).toBe('carrierEtaAsc')
  })

  it('returns to the default carrier ETA order from a confidence sort', () => {
    expect(getNextSort('confidenceDesc', 'carrierEta')).toBe('carrierEtaAsc')
  })
})

describe('sortShipmentRows', () => {
  it('orders by carrier ETA ascending with delivered and missing ETAs last', () => {
    const sorted = ids(sortShipmentRows(rows, 'carrierEtaAsc'))

    expect(sorted.slice(0, 3)).toEqual(['SH-1029', 'SH-1037', 'SH-1035'])
    expect(sorted.slice(-3)).toEqual(['SH-1009', 'SH-1012', 'SH-1044'])
  })

  it('keeps delivered and missing ETAs last when descending', () => {
    const sorted = ids(sortShipmentRows(rows, 'carrierEtaDesc'))

    expect(sorted[0]).toBe('SH-1066')
    expect(sorted.slice(-3)).toEqual(['SH-1009', 'SH-1012', 'SH-1044'])
  })

  it('orders by confidence descending with delivered last', () => {
    const sorted = sortShipmentRows(rows, 'confidenceDesc')

    expect(sorted[0]?.id).toBe('SH-1035')
    expect(ids(sorted.slice(-2))).toEqual(['SH-1009', 'SH-1012'])
  })

  it('orders by confidence ascending', () => {
    expect(sortShipmentRows(rows, 'confidenceAsc')[0]?.id).toBe('SH-1034')
  })
})

describe('paginateShipmentRows', () => {
  it('returns the rows of the requested page and the totals', () => {
    const page = paginateShipmentRows(rows, 2, 8)

    expect(page.rows).toHaveLength(8)
    expect(page).toMatchObject({ page: 2, pageCount: 2, totalCount: 16 })
  })

  it('clamps a page past the end to the last page', () => {
    expect(paginateShipmentRows(rows, 9, 8).page).toBe(2)
  })

  it('has one empty page when nothing matches', () => {
    expect(paginateShipmentRows([], 3, 8)).toEqual({ rows: [], page: 1, pageCount: 1, totalCount: 0 })
  })
})

describe('buildShipmentListPage', () => {
  it('shows the first eight rows by carrier ETA by default', () => {
    const page = buildShipmentListPage(rows, defaultQuery)

    expect(ids(page.rows)).toEqual([
      'SH-1029',
      'SH-1037',
      'SH-1035',
      'SH-1042',
      'SH-1039',
      'SH-1048',
      'SH-1051',
      'SH-1033',
    ])
    expect(page.totalCount).toBe(16)
  })

  it('reports the filtered total, not the page size', () => {
    const page = buildShipmentListPage(rows, { ...defaultQuery, status: 'atRisk' })

    expect(page.totalCount).toBe(4)
    expect(page.pageCount).toBe(1)
  })
})

describe('countRowsBySite', () => {
  it('counts the rows of one origin site', () => {
    expect(countRowsBySite(rows, 'bilbao-plant')).toBe(6)
  })
})

describe('buildShipmentRows customer fields and viewer', () => {
  const customerRows = buildShipmentRows(seed.shipments, seed, now, { role: 'customer', customerId: 'nordwerk' })

  function rowOf(shipmentId: string) {
    return customerRows.find(candidate => candidate.id === shipmentId)
  }

  it('keeps only the shipments of the customer viewer, including those from the out-of-scope site', () => {
    const alpenRows = buildShipmentRows(seed.shipments, seed, now, { role: 'customer', customerId: 'alpen-werkzeug' })

    expect(alpenRows).toHaveLength(7)
    expect(ids(alpenRows)).toContain('SH-1055')
    expect(alpenRows.every(row => row.customerId === 'alpen-werkzeug')).toBe(true)
  })

  it('returns no rows for a customer id that does not exist', () => {
    expect(buildShipmentRows(seed.shipments, seed, now, { role: 'customer', customerId: 'unknown-co' })).toEqual([])
  })

  it('keeps the ops list unchanged when no viewer is given', () => {
    expect(buildShipmentRows(seed.shipments, seed, now)).toHaveLength(16)
  })

  it('exposes the purchase order number', () => {
    expect(rowOf('SH-1042')?.poNumber).toBe('4500-1187')
  })

  it('lists the transport modes in leg order keeping repeats', () => {
    expect(rowOf('SH-1042')?.modes).toEqual(['road', 'sea', 'road'])
    expect(rowOf('SH-1051')?.modes).toEqual(['road'])
  })

  it('has the urgency rank of the most urgent exception', () => {
    expect(rowOf('SH-1042')?.exceptionUrgencyRank).toBe(0)
    expect(rowOf('SH-1035')?.exceptionUrgencyRank).toBe(3)
  })

  it('has no urgency rank without an exception', () => {
    expect(rowOf('SH-1053')?.exceptionUrgencyRank).toBeNull()
  })

  it('is not notified when no notice was sent', () => {
    expect(rowOf('SH-1042')?.isCustomerNotified).toBe(false)
  })

  it('is notified when the notice of an exception was sent', () => {
    const sentSeed = createSeed()
    const shipment = sentSeed.shipments.find(candidate => candidate.id === 'SH-1042')
    if (shipment === undefined) {
      throw new Error('Missing SH-1042')
    }
    shipment.exceptions[0].draft = { status: 'sent', body: 'Hello', notifiedAt: DEMO_NOW_ISO }

    const sentRows = buildShipmentRows(sentSeed.shipments, sentSeed, now, { role: 'customer', customerId: 'nordwerk' })

    expect(sentRows.find(row => row.id === 'SH-1042')?.isCustomerNotified).toBe(true)
  })
})

describe('customerSearchText', () => {
  it('holds the lower-cased id, purchase order and both cities', () => {
    const row = rows.find(candidate => candidate.id === 'SH-1042')

    expect(row?.customerSearchText).toBe('sh-1042 4500-1187 zaragoza birmingham')
  })

  it('leaves out carrier names and the customer name', () => {
    const row = rows.find(candidate => candidate.id === 'SH-1042')

    expect(row?.customerSearchText).not.toContain('nordsee')
    expect(row?.customerSearchText).not.toContain('transauto')
    expect(row?.customerSearchText).not.toContain('nordwerk')
  })
})

describe('splitSearchTerms', () => {
  it('lower-cases and splits on any whitespace', () => {
    expect(splitSearchTerms('  SH-1042   Munich\tZaragoza ')).toEqual(['sh-1042', 'munich', 'zaragoza'])
  })

  it('returns no terms for blank text', () => {
    expect(splitSearchTerms('   ')).toEqual([])
  })
})
