import { useIntl } from 'react-intl'
import { useNavigate } from 'react-router'
import type { ViewerOption } from '@/components/layout/ViewerSelect'
import { useReferenceData } from '@/hooks/useReferenceData'
import { useViewer } from '@/hooks/useViewer'
import { parseViewerValue, viewerToValue } from '@/lib/viewerValue'
import routes from '@/routes'

/**
 * Wires the "Viewing as" select: the options (ops plus the customers once loaded), the selected
 * value derived from the path, and the navigation on change. Switching role always lands on the
 * target role's list root, never on a detail page of the previous role.
 */
export function useViewerSwitch() {
  const intl = useIntl()
  const navigate = useNavigate()
  const viewer = useViewer()
  const referenceData = useReferenceData()

  const viewerOptions: ViewerOption[] = [
    { value: viewerToValue({ role: 'ops' }), label: intl.formatMessage({ id: 'viewer.ops' }), kind: 'ops' },
    ...(referenceData.data?.customers ?? []).map((customer): ViewerOption => ({
      value: viewerToValue({ role: 'customer', customerId: customer.id }),
      label: customer.name,
      kind: 'customer',
    })),
  ]

  function onViewerChange(value: string) {
    const parsed = parseViewerValue(value)
    if (!parsed.ok) {
      return
    }
    const target = parsed.viewer
    void navigate(target.role === 'ops' ? routes.ops.exceptions() : routes.customer.shipments(target.customerId))
  }

  return { viewerOptions, selectedViewer: viewerToValue(viewer), onViewerChange }
}
