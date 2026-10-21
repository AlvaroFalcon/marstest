/**
 * English messages for react-intl. Keys are namespaced by page or component
 * (`notFound.title`) so unused or duplicated messages are easy to spot.
 */
export const messages = {
  'notFound.title': 'Page not found',
  'notFound.backHome': 'Back to home',
  'shell.brand': 'Shipment visibility',
  'shell.theme.switchToDark': 'Switch to dark theme',
  'shell.theme.switchToLight': 'Switch to light theme',
  'viewer.label': 'Viewing as',
  'opsTabs.label': 'Ops views',
  'opsTabs.exceptions': 'Exceptions',
  'opsTabs.shipments': 'All shipments',
  'opsTabs.loadingCount': 'Loading count',
  'demo.banner': 'Demo mode · synthetic data, no real login',
  'demo.bannerShort': 'Demo mode',
  'demo.simulate': 'Simulate carrier event',
  'demo.simulateShort': 'Simulate event',
  'demo.reset': 'Reset demo',
  'demo.resetDone': 'Demo reset',
  'demo.resetFailed': 'Could not reset the demo. Try again.',
  'viewer.ops': 'Ops · Spain sites',
  'page.comingSoon': 'Coming soon',
  'opsExceptions.title': 'Exceptions inbox',
  'opsShipments.title': 'All shipments',
  'customerShipments.title': 'Your shipments',
  'customerShipments.loadFailed': 'Could not load this page. Try again later.',
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
