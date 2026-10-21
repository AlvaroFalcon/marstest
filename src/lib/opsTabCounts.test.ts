import { createSeed } from '@/api/seed'
import type { Shipment, Site } from '@/api/types'
import { countOpsTabs } from '@/lib/opsTabCounts'

const seed = createSeed()
const baseShipment = seed.shipments[0]
const sampleException = seed.shipments.flatMap(shipment => shipment.exceptions)[0]

function buildShipment(overrides: Partial<Shipment>): Shipment {
  return { ...baseShipment, ...overrides }
}

function buildSite(overrides: Partial<Site>): Site {
  return { id: 'madrid-plant', name: 'Madrid plant', city: 'Madrid', countryCode: 'ES', inOpsScope: true, ...overrides }
}

const madrid = buildSite({ id: 'madrid-plant' })
const lyon = buildSite({ id: 'lyon-warehouse', name: 'Lyon warehouse', city: 'Lyon', countryCode: 'FR', inOpsScope: false })

describe('countOpsTabs', () => {
  it('reports both counts as loading while the inputs are pending', () => {
    const counts = countOpsTabs({
      sites: { status: 'pending' },
      exceptions: { status: 'pending' },
      shipments: { status: 'pending' },
    })

    expect(counts).toEqual({ exceptionCount: { status: 'loading' }, shipmentCount: { status: 'loading' } })
  })

  it('reports a pending list as loading while the sites are loaded', () => {
    const counts = countOpsTabs({
      sites: { status: 'success', data: [madrid] },
      exceptions: { status: 'pending' },
      shipments: { status: 'success', data: [buildShipment({ originSiteId: 'madrid-plant' })] },
    })

    expect(counts).toEqual({ exceptionCount: { status: 'loading' }, shipmentCount: { status: 'ready', value: 1 } })
  })

  it('reports both counts as error when the sites fail to load', () => {
    const counts = countOpsTabs({
      sites: { status: 'error' },
      exceptions: { status: 'success', data: [] },
      shipments: { status: 'success', data: [] },
    })

    expect(counts).toEqual({ exceptionCount: { status: 'error' }, shipmentCount: { status: 'error' } })
  })

  it('lets an error win over a pending input', () => {
    const counts = countOpsTabs({
      sites: { status: 'pending' },
      exceptions: { status: 'error' },
      shipments: { status: 'pending' },
    })

    expect(counts).toEqual({ exceptionCount: { status: 'error' }, shipmentCount: { status: 'loading' } })
  })

  it('fails only the count whose own list failed', () => {
    const counts = countOpsTabs({
      sites: { status: 'success', data: [madrid] },
      exceptions: { status: 'error' },
      shipments: { status: 'success', data: [buildShipment({ originSiteId: 'madrid-plant' })] },
    })

    expect(counts).toEqual({ exceptionCount: { status: 'error' }, shipmentCount: { status: 'ready', value: 1 } })
  })

  it('counts the shipments of the in-scope sites and leaves Lyon out', () => {
    const counts = countOpsTabs({
      sites: { status: 'success', data: [madrid, lyon] },
      exceptions: { status: 'success', data: [] },
      shipments: {
        status: 'success',
        data: [
          buildShipment({ id: 'SH-1', originSiteId: 'madrid-plant' }),
          buildShipment({ id: 'SH-2', originSiteId: 'madrid-plant' }),
          buildShipment({ id: 'SH-3', originSiteId: 'lyon-warehouse' }),
        ],
      },
    })

    expect(counts.shipmentCount).toEqual({ status: 'ready', value: 2 })
  })

  it('leaves out the exceptions of shipments shipped from Lyon', () => {
    const counts = countOpsTabs({
      sites: { status: 'success', data: [madrid, lyon] },
      exceptions: {
        status: 'success',
        data: [
          buildShipment({ id: 'SH-1', originSiteId: 'madrid-plant', exceptions: [sampleException] }),
          buildShipment({ id: 'SH-2', originSiteId: 'lyon-warehouse', exceptions: [sampleException] }),
        ],
      },
      shipments: { status: 'success', data: [] },
    })

    expect(counts.exceptionCount).toEqual({ status: 'ready', value: 1 })
  })

  it('sums the exceptions across shipments instead of counting shipments', () => {
    const counts = countOpsTabs({
      sites: { status: 'success', data: [madrid] },
      exceptions: {
        status: 'success',
        data: [
          buildShipment({ id: 'SH-1', originSiteId: 'madrid-plant', exceptions: [sampleException, sampleException] }),
          buildShipment({ id: 'SH-2', originSiteId: 'madrid-plant', exceptions: [sampleException] }),
        ],
      },
      shipments: { status: 'success', data: [] },
    })

    expect(counts.exceptionCount).toEqual({ status: 'ready', value: 3 })
  })

  it('counts zero when no site is in the ops scope', () => {
    const counts = countOpsTabs({
      sites: { status: 'success', data: [lyon] },
      exceptions: { status: 'success', data: [buildShipment({ originSiteId: 'lyon-warehouse', exceptions: [sampleException] })] },
      shipments: { status: 'success', data: [buildShipment({ originSiteId: 'lyon-warehouse' })] },
    })

    expect(counts).toEqual({ exceptionCount: { status: 'ready', value: 0 }, shipmentCount: { status: 'ready', value: 0 } })
  })
})
