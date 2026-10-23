import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { NotificationBellProps } from '@/components/notifications/NotificationBell'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { mockMatchMedia } from '@/test/mockMatchMedia'
import type { MockMatchMedia } from '@/test/mockMatchMedia'
import { renderWithProviders } from '@/test/renderWithProviders'

const items: NotificationBellProps['items'] = [
  { id: 'N-1', headline: 'SH-1060: vessel rolled to the next sailing', isRead: false, timeLabel: 'Just now' },
  { id: 'N-2', headline: 'SH-1053: vessel waiting for a berth in Rotterdam', isRead: true, timeLabel: 'Just now' },
]

function renderBell(props: Partial<NotificationBellProps> = {}) {
  const onSelect = vi.fn()
  const onRetry = vi.fn()
  renderWithProviders(
    <NotificationBell
      items={items}
      status="ready"
      unreadCount={1}
      isDesktop
      onSelect={onSelect}
      onRetry={onRetry}
      {...props}
    />,
  )
  return { onSelect, onRetry }
}

describe('NotificationBell', () => {
  let mediaQuery: MockMatchMedia

  beforeEach(() => {
    mediaQuery = mockMatchMedia(true)
  })

  afterEach(() => {
    mediaQuery.restore()
  })

  describe('button', () => {
    it('is named "Notifications" without a count pill when nothing is unread', () => {
      renderBell({ unreadCount: 0 })

      expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument()
      expect(screen.queryByText('0')).not.toBeInTheDocument()
    })

    it('includes the count in its name and shows the pill when one is unread', () => {
      renderBell({ unreadCount: 1 })

      expect(screen.getByRole('button', { name: 'Notifications, 1 unread' })).toHaveTextContent('1')
    })

    it('includes the count in its name when several are unread', () => {
      renderBell({ unreadCount: 3 })

      expect(screen.getByRole('button', { name: 'Notifications, 3 unread' })).toHaveTextContent('3')
    })
  })

  describe('panel states', () => {
    it('shows the empty state when there are no notifications', async () => {
      renderBell({ items: [], unreadCount: 0 })

      await userEvent.click(screen.getByRole('button', { name: 'Notifications' }))

      expect(await screen.findByText('No notifications yet')).toBeInTheDocument()
      expect(screen.getByText('Carrier events you simulate show up here.')).toBeInTheDocument()
    })

    it('announces the loading state while notifications load', async () => {
      renderBell({ items: [], status: 'loading', unreadCount: 0 })

      await userEvent.click(screen.getByRole('button', { name: 'Notifications' }))

      expect(await screen.findByRole('status')).toHaveTextContent('Loading notifications')
      expect(screen.queryByText('No notifications yet')).not.toBeInTheDocument()
    })

    it('shows the error and calls onRetry from Try again', async () => {
      const { onRetry } = renderBell({ items: [], status: 'error', unreadCount: 0 })
      await userEvent.click(screen.getByRole('button', { name: 'Notifications' }))

      await userEvent.click(await screen.findByRole('button', { name: 'Try again' }))

      expect(screen.getByRole('alert')).toHaveTextContent('Notifications could not be loaded.')
      expect(onRetry).toHaveBeenCalledTimes(1)
    })
  })

  describe('rows', () => {
    it('lists the headlines with their time label', async () => {
      renderBell()

      await userEvent.click(screen.getByRole('button', { name: 'Notifications, 1 unread' }))

      expect(await screen.findByRole('button', { name: /SH-1060: vessel rolled/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /SH-1053: vessel waiting/ })).toBeInTheDocument()
      expect(screen.getAllByText('Just now')).toHaveLength(2)
    })

    it('marks only the unread row with a visually hidden Unread', async () => {
      renderBell()

      await userEvent.click(screen.getByRole('button', { name: 'Notifications, 1 unread' }))

      expect(await screen.findByRole('button', { name: /^Unread:\s+SH-1060/ })).toBeInTheDocument()
      expect(screen.getAllByText('Unread:')).toHaveLength(1)
      expect(screen.getByRole('button', { name: /^SH-1053/ })).toBeInTheDocument()
    })

    it('calls onSelect with the id and closes the panel when a row is clicked', async () => {
      const { onSelect } = renderBell()
      await userEvent.click(screen.getByRole('button', { name: 'Notifications, 1 unread' }))

      await userEvent.click(await screen.findByRole('button', { name: /SH-1060: vessel rolled/ }))

      expect(onSelect).toHaveBeenCalledWith('N-1')
      expect(screen.queryByRole('button', { name: /SH-1060: vessel rolled/ })).not.toBeInTheDocument()
    })
  })

  describe('on a narrow screen', () => {
    it('opens the panel as a dialog sheet titled Notifications', async () => {
      mediaQuery.setMatches(false)
      renderBell({ isDesktop: false })

      await userEvent.click(screen.getByRole('button', { name: 'Notifications, 1 unread' }))

      const sheet = await screen.findByRole('dialog', { name: 'Notifications' })
      expect(sheet).toHaveTextContent('SH-1060: vessel rolled to the next sailing')
    })

    it('closes the sheet when a row is clicked', async () => {
      const { onSelect } = renderBell({ isDesktop: false })
      await userEvent.click(screen.getByRole('button', { name: 'Notifications, 1 unread' }))

      await userEvent.click(await screen.findByRole('button', { name: /SH-1060: vessel rolled/ }))

      expect(onSelect).toHaveBeenCalledWith('N-1')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})
