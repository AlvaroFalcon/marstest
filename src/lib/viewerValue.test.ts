import { parseViewerValue, viewerToValue } from '@/lib/viewerValue'

describe('viewerToValue', () => {
  it('encodes the ops viewer as "ops"', () => {
    const value = viewerToValue({ role: 'ops' })

    expect(value).toBe('ops')
  })

  it('encodes a customer with the "customer:" prefix', () => {
    const value = viewerToValue({ role: 'customer', customerId: 'nordwerk' })

    expect(value).toBe('customer:nordwerk')
  })

  it('keeps a customer whose id is "ops" distinct from the ops viewer', () => {
    const value = viewerToValue({ role: 'customer', customerId: 'ops' })

    expect(value).toBe('customer:ops')
  })
})

describe('parseViewerValue', () => {
  it('decodes "ops" as the ops viewer', () => {
    const viewer = parseViewerValue('ops')

    expect(viewer).toEqual({ role: 'ops' })
  })

  it('decodes a prefixed value as that customer', () => {
    const viewer = parseViewerValue('customer:brenner-iberia')

    expect(viewer).toEqual({ role: 'customer', customerId: 'brenner-iberia' })
  })

  it('returns null when the customer id is empty', () => {
    const viewer = parseViewerValue('customer:')

    expect(viewer).toBeNull()
  })

  it('returns null for an unknown value', () => {
    const viewer = parseViewerValue('admin')

    expect(viewer).toBeNull()
  })

  it('returns null for an empty string', () => {
    const viewer = parseViewerValue('')

    expect(viewer).toBeNull()
  })

  it('round-trips a customer id that contains a colon', () => {
    const viewer = parseViewerValue(viewerToValue({ role: 'customer', customerId: 'acme:eu' }))

    expect(viewer).toEqual({ role: 'customer', customerId: 'acme:eu' })
  })
})
