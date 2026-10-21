import { screen } from '@testing-library/react'
import { ExceptionKpis } from '@/components/exceptions/ExceptionKpis'
import { renderWithProviders } from '@/test/renderWithProviders'

describe('ExceptionKpis', () => {
  it('shows the three labels', () => {
    renderWithProviders(<ExceptionKpis needAttention={5} staleOverDay={2} onTime={9} total={16} />)

    expect(screen.getByText('Need attention')).toBeInTheDocument()
    expect(screen.getByText('Stale over 24 h')).toBeInTheDocument()
    expect(screen.getByText('On time')).toBeInTheDocument()
  })

  it('shows the on-time figure as "N of M" in its accessible text', () => {
    renderWithProviders(<ExceptionKpis needAttention={5} staleOverDay={2} onTime={9} total={16} />)

    expect(screen.getByText('9 of 16')).toBeInTheDocument()
  })

  it('shows the compact "N/M" copy hidden from assistive technology', () => {
    renderWithProviders(<ExceptionKpis needAttention={5} staleOverDay={2} onTime={9} total={16} />)

    expect(screen.getByText('9/16')).toHaveAttribute('aria-hidden', 'true')
  })

  it('shows the counts', () => {
    renderWithProviders(<ExceptionKpis needAttention={5} staleOverDay={2} onTime={9} total={16} />)

    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })
})
