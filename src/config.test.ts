import { environmentSchema } from '@/config'

describe('environmentSchema', () => {
  it('treats an empty API URL as not set', () => {
    // Arrange
    const rawEnvironment = { VITE_API_URL: '' }

    // Act
    const environment = environmentSchema.parse(rawEnvironment)

    // Assert
    expect(environment.VITE_API_URL).toBeUndefined()
  })

  it('keeps a valid API URL', () => {
    // Arrange
    const rawEnvironment = { VITE_API_URL: 'https://api.example.com' }

    // Act
    const environment = environmentSchema.parse(rawEnvironment)

    // Assert
    expect(environment.VITE_API_URL).toBe('https://api.example.com')
  })

  it('rejects a value that is not a URL', () => {
    // Arrange
    const rawEnvironment = { VITE_API_URL: 'not-a-url' }

    // Act
    const result = environmentSchema.safeParse(rawEnvironment)

    // Assert
    expect(result.success).toBe(false)
  })
})
