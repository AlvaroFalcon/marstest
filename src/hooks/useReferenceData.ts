import { useQuery } from '@tanstack/react-query'
import { useShipmentsApi } from '@/hooks/useShipmentsApi'

/** Query key of the reference data (customers, sites, carriers). */
export const REFERENCE_DATA_QUERY_KEY = ['reference-data']

/** Loads customers, sites and carriers, used to resolve ids into names and ops scope. */
export function useReferenceData() {
  const api = useShipmentsApi()

  return useQuery({
    queryKey: REFERENCE_DATA_QUERY_KEY,
    queryFn: () => api.getReferenceData(),
  })
}
