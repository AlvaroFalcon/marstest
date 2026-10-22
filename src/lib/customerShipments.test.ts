import { createSeed, DEMO_NOW_ISO } from '@/api/seed'
import {
  buildCustomerShipmentListPage,
  countCustomerTabs,
  matchesCustomerTab,
  pickProactiveAlert,
  type CustomerShipmentsQuery,
} from '@/lib/customerShipments'
import { buildShipmentRows, type ShipmentListRow } from '@/lib/shipmentList'

const seed = createSeed()
const now = new Date(DEMO_NOW_ISO)

function rowsOf(customerId: string): ShipmentListRow[] {
  return buildShipmentRows(seed.shipments, seed, now, { role: 'customer', customerId })
}

function ids(list: readonly { id: string }[]): string[] {
  return list.map(row => row.id)
}

const nordwerkRows = rowsOf('nordwerk')
const defaultQuery: CustomerShipmentsQuery = { tab: 'all', search: '', page: 1 }

function findRow(rows: readonly ShipmentListRow[], shipmentId: string): ShipmentListRow {
  const row = rows.find(candidate => candidate.id === shipmentId)
  if (row === undefined) {
    throw new Error(`Missing seed row ${shipmentId}`)
  }
  return row
}

describe('matchesCustomerTab', () => {
  it('puts every row in All', () => {
    expect(nordwerkRows.every(row => matchesCustomerTab(row, 'all'))).toBe(true)
  })

  it('puts at-risk and stale rows in Needs attention', () => {
    const matching = nordwerkRows.filter(row => matchesCustomerTab(row, 'needsAttention'))

    expect(ids(matching)).toEqual(['SH-1042', 'SH-1051', 'SH-1035', 'SH-1058'])
  })

  it('puts every shipment that is not delivered in In transit, at-risk and stale ones included', () => {
    const matching = nordwerkRows.filter(row => matchesCustomerTab(row, 'inTransit'))

    expect(ids(matching)).toEqual(['SH-1042', 'SH-1051', 'SH-1035', 'SH-1053', 'SH-1058'])
  })

  it('puts only delivered rows in Delivered', () => {
    const matching = nordwerkRows.filter(row => matchesCustomerTab(row, 'delivered'))

    expect(ids(matching)).toEqual(['SH-1009'])
  })
})

describe('countCustomerTabs', () => {
  it('counts the tabs of Nordwerk', () => {
    expect(countCustomerTabs(nordwerkRows)).toEqual({ all: 6, needsAttention: 4, inTransit: 5, delivered: 1 })
  })

  it('counts the tabs of Alpen with nothing delivered', () => {
    expect(countCustomerTabs(rowsOf('alpen-werkzeug'))).toEqual({ all: 7, needsAttention: 1, inTransit: 7, delivered: 0 })
  })

  it('counts the tabs of Brenner', () => {
    expect(countCustomerTabs(rowsOf('brenner-iberia'))).toEqual({ all: 5, needsAttention: 1, inTransit: 4, delivered: 1 })
  })

  it('counts zero everywhere for no rows', () => {
    expect(countCustomerTabs([])).toEqual({ all: 0, needsAttention: 0, inTransit: 0, delivered: 0 })
  })
})

describe('pickProactiveAlert', () => {
  it('picks the most urgent at-risk shipment and counts the others', () => {
    const alert = pickProactiveAlert(nordwerkRows)

    expect(alert?.row.id).toBe('SH-1042')
    expect(alert?.additionalCount).toBe(2)
  })

  it('picks the only at-risk shipment of Alpen with no others', () => {
    const alert = pickProactiveAlert(rowsOf('alpen-werkzeug'))

    expect(alert?.row.id).toBe('SH-1037')
    expect(alert?.additionalCount).toBe(0)
  })

  it('returns null when only a stale shipment is open', () => {
    const alert = pickProactiveAlert(rowsOf('brenner-iberia'))

    expect(alert).toBeNull()
  })

  it('returns null for no rows', () => {
    expect(pickProactiveAlert([])).toBeNull()
  })

  it('alerts for a stale shipment whose notice was sent', () => {
    const staleNotified = { ...findRow(rowsOf('brenner-iberia'), 'SH-1029'), isCustomerNotified: true }

    const alert = pickProactiveAlert([staleNotified])

    expect(alert?.row.id).toBe('SH-1029')
    expect(alert?.additionalCount).toBe(0)
  })

  it('alerts for an on-time shipment whose notice was sent', () => {
    const onTimeNotified = { ...findRow(nordwerkRows, 'SH-1053'), isCustomerNotified: true }

    const alert = pickProactiveAlert([onTimeNotified])

    expect(alert?.row.id).toBe('SH-1053')
  })

  it('never alerts for a delivered shipment even when its notice was sent', () => {
    const deliveredNotified = { ...findRow(nordwerkRows, 'SH-1009'), isCustomerNotified: true }

    expect(pickProactiveAlert([deliveredNotified])).toBeNull()
  })

  it('ranks a more urgent exception before a less urgent one regardless of row order', () => {
    const urgent = findRow(nordwerkRows, 'SH-1042')
    const lessUrgent = findRow(nordwerkRows, 'SH-1035')

    const alert = pickProactiveAlert([lessUrgent, urgent])

    expect(alert?.row.id).toBe('SH-1042')
  })

  it('breaks an urgency tie by shipment id', () => {
    const second = { ...findRow(nordwerkRows, 'SH-1051'), id: 'SH-2000', exceptionUrgencyRank: 1 }
    const first = { ...findRow(nordwerkRows, 'SH-1051'), id: 'SH-1999', exceptionUrgencyRank: 1 }

    const alert = pickProactiveAlert([second, first])

    expect(alert?.row.id).toBe('SH-1999')
  })

  it('ranks an at-risk shipment without an exception after those that have one', () => {
    const predicted = { ...findRow(nordwerkRows, 'SH-1035'), id: 'SH-0001', exceptionUrgencyRank: null }
    const withException = findRow(nordwerkRows, 'SH-1035')

    const alert = pickProactiveAlert([predicted, withException])

    expect(alert?.row.id).toBe('SH-1035')
  })
})

describe('buildCustomerShipmentListPage', () => {
  it('orders by carrier ETA with delivered last, ties by id', () => {
    const page = buildCustomerShipmentListPage(nordwerkRows, defaultQuery)

    expect(ids(page.rows)).toEqual(['SH-1058', 'SH-1035', 'SH-1042', 'SH-1051', 'SH-1053', 'SH-1009'])
    expect(page.totalCount).toBe(6)
    expect(page.pageCount).toBe(1)
  })

  it('keeps only the rows of the tab', () => {
    const page = buildCustomerShipmentListPage(nordwerkRows, { ...defaultQuery, tab: 'needsAttention' })

    expect(ids(page.rows)).toEqual(['SH-1058', 'SH-1035', 'SH-1042', 'SH-1051'])
  })

  it('applies the search inside the tab', () => {
    const page = buildCustomerShipmentListPage(nordwerkRows, { ...defaultQuery, tab: 'needsAttention', search: 'munich' })

    expect(ids(page.rows)).toEqual(['SH-1035'])
  })

  it('searches by purchase order number', () => {
    const page = buildCustomerShipmentListPage(nordwerkRows, { ...defaultQuery, search: '4500-1187' })

    expect(ids(page.rows)).toEqual(['SH-1042'])
  })

  it('does not match a carrier name', () => {
    const page = buildCustomerShipmentListPage(nordwerkRows, { ...defaultQuery, search: 'nordsee' })

    expect(page.rows).toEqual([])
    expect(page.totalCount).toBe(0)
  })

  it('returns an empty page when nothing matches', () => {
    const page = buildCustomerShipmentListPage(nordwerkRows, { ...defaultQuery, search: 'zzzz' })

    expect(page.rows).toEqual([])
    expect(page.totalCount).toBe(0)
    expect(page.pageCount).toBe(1)
  })

  it('splits more than eight rows into pages of eight', () => {
    const template = findRow(nordwerkRows, 'SH-1053')
    const manyRows = Array.from({ length: 9 }, (_, index) => ({ ...template, id: `SH-30${index}0` }))

    const second = buildCustomerShipmentListPage(manyRows, { ...defaultQuery, page: 2 })

    expect(second.pageCount).toBe(2)
    expect(ids(second.rows)).toEqual(['SH-3080'])
    expect(second.totalCount).toBe(9)
  })

  it('clamps a page past the end to the last page', () => {
    const page = buildCustomerShipmentListPage(nordwerkRows, { ...defaultQuery, page: 9 })

    expect(page.page).toBe(1)
  })
})
