import { Anchor, Factory, Lock, MapPin, Ship, Truck, Warehouse, type LucideIcon } from 'lucide-react'
import type { JourneyStep } from '@/lib/journey'

/** Icon of each kind of place; a module-level map so components can look icons up without creating them during render. */
export const STEP_ICONS = { lock: Lock, truck: Truck, ship: Ship, factory: Factory, anchor: Anchor, warehouse: Warehouse, pin: MapPin } as const satisfies Record<string, LucideIcon>

export type StepIconName = keyof typeof STEP_ICONS

const FACTORY_NAME = /plant|factory/i
const PORT_NAME = /\bport\b/i
const WAREHOUSE_NAME = /warehouse|\bDC\b|depot/i

/**
 * Picks the icon name of a journey node. The data model has no place type, so the status decides first
 * (a customs hold is always a lock, a mid-leg step shows how the goods travel) and the place name
 * second; unknown places get a map pin.
 */
export function getStepIcon(step: Pick<JourneyStep, 'status' | 'position' | 'place' | 'connectorToNext'>): StepIconName {
  if (step.status === 'customsHold') return 'lock'
  if (step.status === 'outForDelivery') return 'truck'
  if (step.position === 'midLeg') {
    if (step.connectorToNext?.mode === 'road') return 'truck'
    if (step.connectorToNext?.mode === 'sea') return 'ship'
  }
  if (FACTORY_NAME.test(step.place)) return 'factory'
  if (PORT_NAME.test(step.place)) return 'anchor'
  if (WAREHOUSE_NAME.test(step.place)) return 'warehouse'

  return 'pin'
}
