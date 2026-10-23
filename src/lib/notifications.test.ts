import type { CarrierNotification } from '@/api/types'
import {
  countUnreadNotifications,
  getNotificationAge,
  getNotificationPath,
  getNotificationSeverity,
  getViewerKey,
  isNotificationRead,
} from '@/lib/notifications'

function buildNotification(overrides: Partial<CarrierNotification> = {}): CarrierNotification {
  return {
    id: 'N-vessel-rolled-sh-1060',
    eventId: 'vessel-rolled-sh-1060',
    shipmentId: 'SH-1060',
    customerId: 'brenner-iberia',
    headline: 'SH-1060: vessel rolled to the next sailing',
    receivedAt: '2026-10-20T10:00:00.000Z',
    effect: { kind: 'opened', exceptionType: 'predictedDelay' },
    readBy: [],
    ...overrides,
  }
}

describe('getViewerKey', () => {
  it('returns ops for the ops viewer', () => {
    const key = getViewerKey({ role: 'ops' })

    expect(key).toBe('ops')
  })

  it('returns the customer id prefixed with customer for a customer viewer', () => {
    const key = getViewerKey({ role: 'customer', customerId: 'nordwerk' })

    expect(key).toBe('customer:nordwerk')
  })
})

describe('isNotificationRead', () => {
  it('returns true when the viewer key is in readBy', () => {
    const notification = buildNotification({ readBy: ['customer:nordwerk'] })

    const isRead = isNotificationRead(notification, { role: 'customer', customerId: 'nordwerk' })

    expect(isRead).toBe(true)
  })

  it('returns false when only another viewer read it', () => {
    const notification = buildNotification({ readBy: ['ops'] })

    const isRead = isNotificationRead(notification, { role: 'customer', customerId: 'nordwerk' })

    expect(isRead).toBe(false)
  })
})

describe('countUnreadNotifications', () => {
  it('returns 0 for an empty list', () => {
    const count = countUnreadNotifications([], { role: 'ops' })

    expect(count).toBe(0)
  })

  it('counts only the notifications this viewer has not read', () => {
    const notifications = [
      buildNotification({ id: 'N-1', readBy: ['ops'] }),
      buildNotification({ id: 'N-2', readBy: ['customer:nordwerk'] }),
      buildNotification({ id: 'N-3', readBy: [] }),
    ]

    const count = countUnreadNotifications(notifications, { role: 'ops' })

    expect(count).toBe(2)
  })
})

describe('getNotificationPath', () => {
  it('leads a customer to their own shipment detail', () => {
    const path = getNotificationPath(
      { role: 'customer', customerId: 'nordwerk' },
      { shipmentId: 'SH-1053', effect: { kind: 'opened', exceptionType: 'predictedDelay' } },
    )

    expect(path).toBe('/customers/nordwerk/shipments/SH-1053')
  })

  it('leads ops to the exception when the event opened one', () => {
    const path = getNotificationPath({ role: 'ops' }, { shipmentId: 'SH-1060', effect: { kind: 'opened', exceptionType: 'predictedDelay' } })

    expect(path).toBe('/ops/exceptions/SH-1060')
  })

  it('leads ops to the shipment detail when the event opened no exception', () => {
    const path = getNotificationPath({ role: 'ops' }, { shipmentId: 'SH-1042', effect: { kind: 'closed' } })

    expect(path).toBe('/ops/shipments/SH-1042')
  })
})

describe('getNotificationAge', () => {
  const now = new Date('2026-10-20T10:00:00.000Z')

  it('returns justNow when it was received at the same instant', () => {
    const age = getNotificationAge('2026-10-20T10:00:00.000Z', now)

    expect(age).toEqual({ kind: 'justNow' })
  })

  it('returns justNow 59 seconds after it was received', () => {
    const age = getNotificationAge('2026-10-20T09:59:01.000Z', now)

    expect(age).toEqual({ kind: 'justNow' })
  })

  it('returns one elapsed minute after exactly one minute', () => {
    const age = getNotificationAge('2026-10-20T09:59:00.000Z', now)

    expect(age).toEqual({ kind: 'elapsed', elapsed: { unit: 'minutes', value: 1 } })
  })
})

describe('getNotificationSeverity', () => {
  const ops = { role: 'ops' } as const
  const customer = { role: 'customer', customerId: 'nordwerk' } as const

  it('returns the exception type for ops when the event opened a vessel-rolled exception', () => {
    const severity = getNotificationSeverity({ effect: { kind: 'opened', exceptionType: 'vesselRolled' } }, ops)

    expect(severity).toEqual({ kind: 'exception', exceptionType: 'vesselRolled' })
  })

  it('returns at risk for a customer when the event opened an exception', () => {
    const severity = getNotificationSeverity({ effect: { kind: 'opened', exceptionType: 'predictedDelay' } }, customer)

    expect(severity).toEqual({ kind: 'atRisk' })
  })

  it('returns resolved for ops when the event closed an exception', () => {
    const severity = getNotificationSeverity({ effect: { kind: 'closed' } }, ops)

    expect(severity).toEqual({ kind: 'resolved' })
  })

  it('returns back on track for a customer when the event closed an exception', () => {
    const severity = getNotificationSeverity({ effect: { kind: 'closed' } }, customer)

    expect(severity).toEqual({ kind: 'backOnTrack' })
  })

  it('returns delivered for ops when the shipment was delivered', () => {
    const severity = getNotificationSeverity({ effect: { kind: 'delivered' } }, ops)

    expect(severity).toEqual({ kind: 'delivered' })
  })

  it('returns delivered for a customer when the shipment was delivered', () => {
    const severity = getNotificationSeverity({ effect: { kind: 'delivered' } }, customer)

    expect(severity).toEqual({ kind: 'delivered' })
  })

  it('returns update for ops when the event changed nothing in exceptions', () => {
    const severity = getNotificationSeverity({ effect: { kind: 'update' } }, ops)

    expect(severity).toEqual({ kind: 'update' })
  })

  it('returns update for a customer when the event changed nothing in exceptions', () => {
    const severity = getNotificationSeverity({ effect: { kind: 'update' } }, customer)

    expect(severity).toEqual({ kind: 'update' })
  })
})
