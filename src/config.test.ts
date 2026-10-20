import { environmentSchema } from '@/config'

describe('environmentSchema', () => {
  it('treats an empty API URL as not set', () => {
    const rawEnvironment = { VITE_API_URL: '' }

    const environment = environmentSchema.parse(rawEnvironment)

    expect(environment.VITE_API_URL).toBeUndefined()
  })

  it('keeps a valid API URL', () => {
    const rawEnvironment = { VITE_API_URL: 'https://api.example.com' }

    const environment = environmentSchema.parse(rawEnvironment)

    expect(environment.VITE_API_URL).toBe('https://api.example.com')
  })

  it('rejects a value that is not a URL', () => {
    const rawEnvironment = { VITE_API_URL: 'not-a-url' }

    const result = environmentSchema.safeParse(rawEnvironment)

    expect(result.success).toBe(false)
  })
})
