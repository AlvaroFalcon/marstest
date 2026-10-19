/**
 * English messages for react-intl. Keys are namespaced by page or component
 * (`home.title`) so unused or duplicated messages are easy to spot.
 */
export const messages = {
  'home.title': 'Marstest',
  'home.subtitle': 'Project scaffold ready.',
  'notFound.title': 'Page not found',
  'notFound.backHome': 'Back to home',
} satisfies Record<string, string>

export type MessageId = keyof typeof messages
