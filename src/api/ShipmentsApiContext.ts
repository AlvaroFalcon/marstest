import { createContext } from 'react'
import type { ShipmentsApi } from '@/api/shipmentsApi'

/**
 * Carries the shipments API to the hooks. It is `null` outside a `ShipmentsApiProvider` so a
 * missing provider fails loudly instead of silently talking to the real demo database.
 */
export const ShipmentsApiContext = createContext<ShipmentsApi | null>(null)
