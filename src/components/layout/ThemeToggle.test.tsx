import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { renderWithProviders } from '@/test/renderWithProviders'

describe('ThemeToggle', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.className = ''
  })

  it('switches to the dark theme and stores the choice', async () => {
    renderWithProviders(<ThemeToggle />)

    await userEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }))

    expect(document.documentElement).toHaveClass('dark')
    expect(window.localStorage.getItem('theme')).toBe('dark')
    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument()
  })

  it('switches back to the light theme on the second click', async () => {
    renderWithProviders(<ThemeToggle />)

    await userEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }))
    await userEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }))

    expect(document.documentElement).not.toHaveClass('dark')
    expect(window.localStorage.getItem('theme')).toBe('light')
  })

  it('starts in the dark theme when the stored choice is dark', () => {
    window.localStorage.setItem('theme', 'dark')

    renderWithProviders(<ThemeToggle />)

    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument()
  })
})
