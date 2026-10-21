import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AiBlock } from '@/components/provenance/AiBlock'
import { renderWithProviders } from '@/test/renderWithProviders'

describe('AiBlock', () => {
  it('shows the AI title as a heading and the body text', () => {
    renderWithProviders(<AiBlock title="AI diagnosis">The truck is waiting at customs in Valencia.</AiBlock>)

    expect(screen.getByRole('heading', { name: 'AI diagnosis' })).toBeInTheDocument()
    expect(screen.getByText('The truck is waiting at customs in Valencia.')).toBeInTheDocument()
  })

  it('shows the evidence as plain text when there is no click handler', () => {
    renderWithProviders(
      <AiBlock evidence={{ label: 'Based on 6 events' }} title="AI summary">Your order is on its way.</AiBlock>,
    )

    expect(screen.getByText('Based on 6 events')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows no evidence when none is given', () => {
    renderWithProviders(<AiBlock title="AI summary">Your order is on its way.</AiBlock>)

    expect(screen.queryByText(/Based on/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('calls the handler when the evidence button is clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    renderWithProviders(
      <AiBlock evidence={{ label: 'Based on 6 events', onClick }} title="AI diagnosis">Customs hold.</AiBlock>,
    )

    await user.click(screen.getByRole('button', { name: 'Based on 6 events' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('calls the handler when the evidence button is activated with the keyboard', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    renderWithProviders(
      <AiBlock evidence={{ label: 'Based on 6 events', onClick }} title="AI diagnosis">Customs hold.</AiBlock>,
    )

    await user.tab()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')

    expect(screen.getByRole('button', { name: 'Based on 6 events' })).toHaveFocus()
    expect(onClick).toHaveBeenCalledTimes(2)
  })
})
