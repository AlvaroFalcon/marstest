import { createSeed } from '@/api/seed'
import type { DemoState } from '@/api/types'
import { filterByOriginSite, scopeShipments } from '@/lib/scope'

function getIds(state: DemoState['shipments']): string[] {
  return state.map(shipment => shipment.id)
}

describe('scopeShipments', () => {
  it('gives ops the shipments of the in-scope sites', () => {
    const { shipments, sites } = createSeed()

    const visible = scopeShipments(shipments, { role: 'ops' }, sites)

    expect(visible).toHaveLength(16)
    expect(visible.every(shipment => shipment.originSiteId !== 'lyon-warehouse')).toBe(true)
  })

  it('hides the Lyon shipment SH-1058 from ops', () => {
    const { shipments, sites } = createSeed()

    const visible = scopeShipments(shipments, { role: 'ops' }, sites)

    expect(getIds(visible)).not.toContain('SH-1058')
    expect(getIds(visible)).not.toContain('SH-1055')
  })

  it('follows the inOpsScope flag of the sites', () => {
    const { shipments, sites } = createSeed()
    const lyonInScope = sites.map(site => site.id === 'lyon-warehouse' ? { ...site, inOpsScope: true } : site)

    const visible = scopeShipments(shipments, { role: 'ops' }, lyonInScope)

    expect(getIds(visible)).toContain('SH-1058')
  })

  it('returns nothing to ops when no site is in scope', () => {
    const { shipments, sites } = createSeed()
    const noSiteInScope = sites.map(site => ({ ...site, inOpsScope: false }))

    expect(scopeShipments(shipments, { role: 'ops' }, noSiteInScope)).toEqual([])
  })

  it('gives a customer only their own shipments, including the Lyon ones', () => {
    const { shipments, sites } = createSeed()

    const visible = scopeShipments(shipments, { role: 'customer', customerId: 'nordwerk' }, sites)

    expect(getIds(visible)).toEqual(['SH-1042', 'SH-1051', 'SH-1035', 'SH-1009', 'SH-1053', 'SH-1058'])
  })

  it('does not show a customer the shipments of another customer', () => {
    const { shipments, sites } = createSeed()

    const visible = scopeShipments(shipments, { role: 'customer', customerId: 'brenner-iberia' }, sites)

    expect(visible.every(shipment => shipment.customerId === 'brenner-iberia')).toBe(true)
    expect(getIds(visible)).not.toContain('SH-1042')
  })

  it('returns nothing for a customer id that does not exist', () => {
    const { shipments, sites } = createSeed()

    expect(scopeShipments(shipments, { role: 'customer', customerId: 'nobody' }, sites)).toEqual([])
  })

  it('does not change the input array', () => {
    const { shipments, sites } = createSeed()
    const originalIds = getIds(shipments)

    scopeShipments(shipments, { role: 'ops' }, sites)

    expect(getIds(shipments)).toEqual(originalIds)
  })
})

describe('filterByOriginSite', () => {
  it('keeps only the shipments from the given site', () => {
    const { shipments, sites } = createSeed()
    const opsShipments = scopeShipments(shipments, { role: 'ops' }, sites)

    const bilbao = filterByOriginSite(opsShipments, 'bilbao-plant')

    expect(getIds(bilbao)).toEqual(['SH-1029', 'SH-1051', 'SH-1060', 'SH-1012', 'SH-1053', 'SH-1039'])
  })

  it('yields nothing for an out-of-scope site once the ops scope was applied', () => {
    const { shipments, sites } = createSeed()
    const opsShipments = scopeShipments(shipments, { role: 'ops' }, sites)

    expect(filterByOriginSite(opsShipments, 'lyon-warehouse')).toEqual([])
  })

  it('narrows a customer scope to one site', () => {
    const { shipments, sites } = createSeed()
    const nordwerkShipments = scopeShipments(shipments, { role: 'customer', customerId: 'nordwerk' }, sites)

    const fromLyon = filterByOriginSite(nordwerkShipments, 'lyon-warehouse')

    expect(getIds(fromLyon)).toEqual(['SH-1058'])
  })
})
