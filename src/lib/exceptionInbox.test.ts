import { createSeed, DEMO_NOW_ISO } from '@/api/seed'
import { buildExceptionInbox, getFirstSentence, getRouteLabel } from '@/lib/exceptionInbox'

const seed = createSeed()
const now = new Date(DEMO_NOW_ISO)
const exceptionShipments = seed.shipments.filter(shipment => shipment.exceptions.length > 0)

function buildSeedInbox(siteId: string | null) {
  return buildExceptionInbox({ exceptionShipments, shipments: seed.shipments, sites: seed.sites, siteId, now })
}

describe('getFirstSentence', () => {
  it('returns only the first sentence', () => {
    expect(getFirstSentence('Truck stopped at Basel. The ETA has not changed.')).toBe('Truck stopped at Basel.')
  })

  it('does not split on a decimal number', () => {
    expect(getFirstSentence('HS code 8467.29 does not match. Check it.')).toBe('HS code 8467.29 does not match.')
  })

  it('returns the whole text when it has a single sentence', () => {
    expect(getFirstSentence('Only one sentence here.')).toBe('Only one sentence here.')
  })

  it('returns an empty string for empty text', () => {
    expect(getFirstSentence('  ')).toBe('')
  })
})

describe('getRouteLabel', () => {
  it('joins the origin site city and the destination city', () => {
    const shipment = seed.shipments.find(candidate => candidate.id === 'SH-1042')

    expect(shipment && getRouteLabel(shipment, seed.sites)).toBe('Zaragoza → Birmingham')
  })
})

describe('buildExceptionInbox', () => {
  it('lists the ops exceptions by urgency without the out-of-scope site', () => {
    const inbox = buildSeedInbox(null)

    expect(inbox.items.map(item => item.shipmentId)).toEqual(['SH-1042', 'SH-1051', 'SH-1037', 'SH-1035', 'SH-1029'])
  })

  it('resolves route, reason and hours since the last update of each card', () => {
    const [first] = buildSeedInbox(null).items

    expect(first.routeLabel).toBe('Zaragoza → Birmingham')
    expect(first.reason).toBe('UK customs is holding the container at Southampton.')
    expect(first.hoursSinceUpdate).toBeGreaterThan(24)
  })

  it('computes the KPIs over all in-scope sites', () => {
    expect(buildSeedInbox(null).kpis).toEqual({ needAttention: 5, staleOver24h: 2, onTime: 9, total: 16 })
  })

  it('counts the exceptions per in-scope site regardless of the filter', () => {
    const counts = buildSeedInbox('bilbao-plant').siteCounts.map(entry => [entry.site.id, entry.exceptionCount])

    expect(counts).toEqual([['zaragoza-plant', 3], ['bilbao-plant', 2], ['barcelona-warehouse', 0]])
  })

  it('keeps the total exception count unfiltered', () => {
    expect(buildSeedInbox('bilbao-plant').totalExceptionCount).toBe(5)
  })

  it('narrows cards and KPIs to the selected site', () => {
    const inbox = buildSeedInbox('bilbao-plant')

    expect(inbox.items.map(item => item.shipmentId)).toHaveLength(2)
    expect(inbox.kpis).toEqual({ needAttention: 2, staleOver24h: 1, onTime: 4, total: 6 })
  })

  it('returns an empty view for a site outside the ops scope', () => {
    const inbox = buildSeedInbox('lyon-warehouse')

    expect(inbox.items).toEqual([])
    expect(inbox.kpis).toEqual({ needAttention: 0, staleOver24h: 0, onTime: 0, total: 0 })
  })

  it('lists the out-of-scope sites for the locked row', () => {
    expect(buildSeedInbox(null).outOfScopeSites.map(site => site.id)).toEqual(['lyon-warehouse'])
  })
})
