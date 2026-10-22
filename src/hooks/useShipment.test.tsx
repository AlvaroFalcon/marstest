import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ShipmentsApi } from '@/api/shipmentsApi'
import { useShipment } from '@/hooks/useShipment'
import type { Viewer } from '@/lib/scope'
import { createTestApi } from '@/test/createTestApi'
import { renderWithProviders } from '@/test/renderWithProviders'

const opsViewer: Viewer = { role: 'ops' }

type ShipmentProbeProps = {
  shipmentId: string
}

function ShipmentProbe({ shipmentId }: ShipmentProbeProps) {
  const result = useShipment(shipmentId, opsViewer)

  return (
    <>
      <output aria-label="Lookup">
        {result.status === 'ready' ? `ready:${result.shipment.id}` : result.status}
      </output>
      {result.status === 'error' && <button onClick={result.retry}>Retry</button>}
    </>
  )
}

describe('useShipment', () => {
  it('reports loading while the shipment is pending', () => {
    const api: ShipmentsApi = { ...createTestApi(), getShipment: () => new Promise(() => {}) }

    renderWithProviders(<ShipmentProbe shipmentId="SH-1042" />, { api })

    expect(screen.getByLabelText('Lookup')).toHaveTextContent('loading')
  })

  it('reports the shipment when the id exists and is in scope', async () => {
    renderWithProviders(<ShipmentProbe shipmentId="SH-1042" />)

    expect(await screen.findByText('ready:SH-1042')).toBeInTheDocument()
  })

  it('reports notFound for an unknown id', async () => {
    renderWithProviders(<ShipmentProbe shipmentId="SH-9999" />)

    expect(await screen.findByText('notFound')).toBeInTheDocument()
  })

  it('reports notFound for a shipment outside the ops scope', async () => {
    renderWithProviders(<ShipmentProbe shipmentId="SH-1058" />)

    expect(await screen.findByText('notFound')).toBeInTheDocument()
  })

  it('does not retry a missing shipment', async () => {
    const api = createTestApi()
    let calls = 0
    const countingApi: ShipmentsApi = {
      ...api,
      getShipment: (shipmentId) => {
        calls += 1
        return api.getShipment(shipmentId)
      },
    }

    renderWithProviders(<ShipmentProbe shipmentId="SH-9999" />, { api: countingApi })
    await screen.findByText('notFound')

    expect(calls).toBe(1)
  })

  it('reports error when the reference data fails to load', async () => {
    const api: ShipmentsApi = { ...createTestApi(), getReferenceData: () => Promise.reject(new Error('Network down')) }

    renderWithProviders(<ShipmentProbe shipmentId="SH-1042" />, { api })

    expect(await screen.findByText('error')).toBeInTheDocument()
  })

  it('refetches only the failed query and recovers when retry is called', async () => {
    const api = createTestApi()
    let shouldFail = true
    let shipmentCalls = 0
    const flakyApi: ShipmentsApi = {
      ...api,
      getShipment: (shipmentId) => {
        shipmentCalls += 1
        return api.getShipment(shipmentId)
      },
      getReferenceData: () => shouldFail ? Promise.reject(new Error('Network down')) : api.getReferenceData(),
    }
    renderWithProviders(<ShipmentProbe shipmentId="SH-1042" />, { api: flakyApi })
    await screen.findByText('error')

    shouldFail = false
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))

    expect(await screen.findByText('ready:SH-1042')).toBeInTheDocument()
    expect(shipmentCalls).toBe(1)
  })
})
