import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation } from 'react-router'
import type { ShipmentsApi } from '@/api/shipmentsApi'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { createTestApi } from '@/test/createTestApi'
import { mockMatchMedia } from '@/test/mockMatchMedia'
import type { MockMatchMedia } from '@/test/mockMatchMedia'
import { renderWithProviders } from '@/test/renderWithProviders'

function CurrentPath() {
  const { pathname } = useLocation()

  return <output aria-label="Current path">{pathname}</output>
}

function renderCenter(initialPath: string, api: ShipmentsApi) {
  renderWithProviders(
    <>
      <NotificationCenter />
      <CurrentPath />
    </>,
    { initialPath, api },
  )
}

describe('NotificationCenter', () => {
  let mediaQuery: MockMatchMedia

  beforeEach(() => {
    mediaQuery = mockMatchMedia(true)
  })

  afterEach(() => {
    mediaQuery.restore()
  })

  it('shows the empty state before any event', async () => {
    renderCenter('/ops/exceptions', createTestApi())

    await userEvent.click(await screen.findByRole('button', { name: 'Notifications' }))

    expect(await screen.findByText('No notifications yet')).toBeInTheDocument()
  })

  it('counts the unread events of the ops viewer', async () => {
    const api = createTestApi()
    await api.simulateCarrierEvent({ role: 'ops' })
    await api.simulateCarrierEvent({ role: 'ops' })

    renderCenter('/ops/exceptions', api)

    expect(await screen.findByRole('button', { name: 'Notifications, 2 unread' })).toBeInTheDocument()
  })

  it('shows a customer only the events on their shipments', async () => {
    const api = createTestApi()
    await api.simulateCarrierEvent({ role: 'customer', customerId: 'nordwerk' })
    await api.simulateCarrierEvent({ role: 'customer', customerId: 'alpen-werkzeug' })

    renderCenter('/customers/alpen-werkzeug/shipments', api)
    await userEvent.click(await screen.findByRole('button', { name: 'Notifications, 1 unread' }))

    expect(await screen.findByRole('button', { name: /SH-1037: cleared the Swiss border/ })).toBeInTheDocument()
    expect(screen.queryByText(/SH-1053/)).not.toBeInTheDocument()
  })

  it('marks the clicked notification read, drops the count and opens the ops exception', async () => {
    const api = createTestApi()
    await api.simulateCarrierEvent({ role: 'ops' })
    renderCenter('/ops/exceptions', api)
    await userEvent.click(await screen.findByRole('button', { name: 'Notifications, 1 unread' }))

    await userEvent.click(await screen.findByRole('button', { name: /SH-1060: vessel rolled/ }))

    expect(screen.getByLabelText('Current path')).toHaveTextContent('/ops/exceptions/SH-1060')
    expect(await screen.findByRole('button', { name: 'Notifications' })).toBeInTheDocument()
    const [notification] = await api.listNotifications({ role: 'ops' })
    expect(notification.readBy).toEqual(['ops'])
  })

  it('opens the customer shipment detail from a customer notification', async () => {
    const api = createTestApi()
    await api.simulateCarrierEvent({ role: 'customer', customerId: 'nordwerk' })
    renderCenter('/customers/nordwerk/shipments', api)
    await userEvent.click(await screen.findByRole('button', { name: 'Notifications, 1 unread' }))

    await userEvent.click(await screen.findByRole('button', { name: /SH-1053: vessel waiting/ }))

    expect(screen.getByLabelText('Current path')).toHaveTextContent('/customers/nordwerk/shipments/SH-1053')
  })

  it('opens the ops shipment detail when the event closed the exception', async () => {
    const api = createTestApi()
    for (let click = 0; click < 3; click += 1) {
      await api.simulateCarrierEvent({ role: 'ops' })
    }
    renderCenter('/ops/exceptions', api)
    await userEvent.click(await screen.findByRole('button', { name: 'Notifications, 3 unread' }))

    await userEvent.click(await screen.findByRole('button', { name: /SH-1042: customs released/ }))

    expect(screen.getByLabelText('Current path')).toHaveTextContent('/ops/shipments/SH-1042')
  })

  it('keeps the notification unread for ops when a customer read it', async () => {
    const api = createTestApi()
    await api.simulateCarrierEvent({ role: 'customer', customerId: 'nordwerk' })
    await api.markNotificationRead({ role: 'customer', customerId: 'nordwerk' }, 'N-rotterdam-congestion-sh-1053')

    renderCenter('/ops/exceptions', api)

    expect(await screen.findByRole('button', { name: 'Notifications, 1 unread' })).toBeInTheDocument()
  })

  it('shows the error state and recovers on Try again', async () => {
    const baseApi = createTestApi()
    let shouldFail = true
    const flakyApi: ShipmentsApi = {
      ...baseApi,
      listNotifications: (viewer) => {
        if (shouldFail) {
          return Promise.reject(new Error('Network down'))
        }
        return baseApi.listNotifications(viewer)
      },
    }
    renderCenter('/ops/exceptions', flakyApi)
    await userEvent.click(await screen.findByRole('button', { name: 'Notifications' }))
    await screen.findByText('Notifications could not be loaded.')

    shouldFail = false
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    await waitFor(() => expect(screen.getByText('No notifications yet')).toBeInTheDocument())
  })
})
