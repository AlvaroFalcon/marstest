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

/** Every message id the application can use; unknown ids fail type-checking. */
export type MessageId = keyof typeof messages

// react-intl reads message ids from this global namespace; augmenting it requires
// `namespace` and `interface` (declaration merging), so both lint rules are disabled here.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace FormatjsIntl {
    // Makes react-intl type-check `id` props and `formatMessage` calls against `messages`.
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface Message {
      ids: MessageId
    }
  }
}
