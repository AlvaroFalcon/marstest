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
    const result = parseViewerValue('ops')

    expect(result).toEqual({ ok: true, viewer: { role: 'ops' } })
  })

  it('decodes a prefixed value as that customer', () => {
    const result = parseViewerValue('customer:brenner-iberia')

    expect(result).toEqual({ ok: true, viewer: { role: 'customer', customerId: 'brenner-iberia' } })
  })

  it('fails when the customer id is empty', () => {
    const result = parseViewerValue('customer:')

    expect(result).toEqual({ ok: false })
  })

  it('fails for an unknown value', () => {
    const result = parseViewerValue('admin')

    expect(result).toEqual({ ok: false })
  })

  it('fails for an empty string', () => {
    const result = parseViewerValue('')

    expect(result).toEqual({ ok: false })
  })

  it('round-trips a customer id that contains a colon', () => {
    const result = parseViewerValue(viewerToValue({ role: 'customer', customerId: 'acme:eu' }))

    expect(result).toEqual({ ok: true, viewer: { role: 'customer', customerId: 'acme:eu' } })
  })
})
