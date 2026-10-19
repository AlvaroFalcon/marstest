import { screen } from '@testing-library/react'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { renderWithProviders } from '@/test/renderWithProviders'

describe('NotFoundPage', () => {
  it('links back to the home page', () => {
    // Arrange & Act
    renderWithProviders(<NotFoundPage />, { initialPath: '/missing' })

    // Assert
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/')
  })
})
