import type { CarrierNotification, Viewer } from '@/api/types'
import type { ElapsedTime } from '@/lib/provenance'
import { getElapsedTime } from '@/lib/provenance'
import routes from '@/routes'

/**
 * Identifies a viewer in the read state of a notification: `ops` or `customer:<customerId>`.
 * Ops and every customer read independently, so the key (not the role) is what is stored.
 *
 * @example
 * getViewerKey({ role: 'customer', customerId: 'nordwerk' }) // 'customer:nordwerk'
 */
export function getViewerKey(viewer: Viewer): string {
  if (viewer.role === 'customer') {
    return `customer:${viewer.customerId}`
  }
  return 'ops'
}

/** True when this viewer has already opened the notification. */
export function isNotificationRead(notification: CarrierNotification, viewer: Viewer): boolean {
  return notification.readBy.includes(getViewerKey(viewer))
}

/** Number of notifications this viewer has not opened yet. */
export function countUnreadNotifications(notifications: readonly CarrierNotification[], viewer: Viewer): number {
  return notifications.filter(notification => !isNotificationRead(notification, viewer)).length
}

/** The part of a notification (or applied event) that decides where "View" leads. */
export type NotificationTarget = Pick<CarrierNotification, 'shipmentId' | 'opensException'>

/**
 * Where a notification leads, shared by the toast "View" and the notification panel so both open
 * the same place: the exception when ops can still open one (the event opened it), otherwise the
 * shipment in the viewer's own area. A closing event leaves ops no exception, so they land on the
 * shipment.
 */
export function getNotificationPath(viewer: Viewer, target: NotificationTarget): string {
  if (viewer.role === 'customer') {
    return routes.customer.shipment(viewer.customerId, target.shipmentId)
  }
  if (target.opensException) {
    return routes.ops.exception(target.shipmentId)
  }
  return routes.ops.shipment(target.shipmentId)
}

/** How old a notification is: `justNow` under one minute, otherwise a floored {@link ElapsedTime}. */
export type NotificationAge
  = | { kind: 'justNow' }
    | { kind: 'elapsed', elapsed: ElapsedTime }

/**
 * Age label input of a notification. Under the frozen demo clock every notification is
 * `justNow`; it only becomes "N min ago" if the clock moves.
 *
 * @param now - Injected for deterministic tests.
 */
export function getNotificationAge(receivedAt: string, now: Date): NotificationAge {
  const elapsed = getElapsedTime(receivedAt, now)
  if (elapsed.unit === 'minutes' && elapsed.value < 1) {
    return { kind: 'justNow' }
  }
  return { kind: 'elapsed', elapsed }
}
