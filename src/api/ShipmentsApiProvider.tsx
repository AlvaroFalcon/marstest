import type { ReactNode } from 'react'
import { ShipmentsApiContext } from '@/api/ShipmentsApiContext'
import { shipmentsApi, type ShipmentsApi } from '@/api/shipmentsApi'

export type ShipmentsApiProviderProps = {
  /** Injected by tests so each one owns its data; defaults to the application instance. */
  api?: ShipmentsApi
  children: ReactNode
}

/** Makes one {@link ShipmentsApi} available to every `useShipmentsApi` consumer below it. */
export function ShipmentsApiProvider({ api = shipmentsApi, children }: ShipmentsApiProviderProps) {
  return <ShipmentsApiContext value={api}>{children}</ShipmentsApiContext>
}
