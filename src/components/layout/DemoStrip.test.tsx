import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DemoStrip, type DemoStripProps } from '@/components/layout/DemoStrip'
import { renderWithProviders } from '@/test/renderWithProviders'

function renderStrip(props: Partial<DemoStripProps> = {}) {
  return renderWithProviders(
    <DemoStrip onResetDemo={() => {}} isResetting={false} onSimulateCarrierEvent={() => {}} {...props} />,
  )
}

describe('DemoStrip', () => {
  it('tells the viewer the data is synthetic', () => {
    renderStrip()

    expect(screen.getByText('Demo mode · synthetic data, no real login')).toBeInTheDocument()
    expect(screen.getByText('Demo mode')).toBeInTheDocument()
  })

  it('calls onResetDemo when "Reset demo" is clicked', async () => {
    const onResetDemo = vi.fn()
    renderStrip({ onResetDemo })

    await userEvent.click(screen.getByRole('button', { name: 'Reset demo' }))

    expect(onResetDemo).toHaveBeenCalledTimes(1)
  })

  it('disables "Reset demo" and flags it busy while the reset runs', () => {
    renderStrip({ isResetting: true })

    expect(screen.getByRole('button', { name: 'Reset demo' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Reset demo' })).toHaveAttribute('aria-busy', 'true')
  })

  it('calls onSimulateCarrierEvent when the simulate button is clicked', async () => {
    const onSimulateCarrierEvent = vi.fn()
    renderStrip({ onSimulateCarrierEvent })

    await userEvent.click(screen.getByRole('button', { name: /Simulate/ }))

    expect(onSimulateCarrierEvent).toHaveBeenCalledTimes(1)
  })

  it('offers the theme toggle', () => {
    renderStrip()

    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument()
  })
})
