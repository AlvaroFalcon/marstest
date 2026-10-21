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
  'provenance.badge.carrierEta': 'Carrier ETA',
  'provenance.badge.estimated': 'Estimated · {percent}',
  'provenance.badge.estimatedSrOnly': 'Estimated',
  'provenance.badge.derivedFromGps': 'Derived from GPS',
  'provenance.badge.noUpdate': 'No update for {hours} h',
  'provenance.ago.minutes': '{value} min ago',
  'provenance.ago.hours': '{value} h ago',
  'provenance.ago.days': '{value} d ago',
  'provenance.freshness.updated': 'Updated {ago}',
  'provenance.channel.api': 'API',
  'provenance.channel.edi': 'EDI',
  'provenance.channel.email': 'Email',
  'provenance.channel.portal': 'Portal',
  'provenance.eta.carrierLabel': 'Carrier ETA',
  'provenance.eta.estimateLabel': 'Our estimate',
  'provenance.eta.notProvided': 'Not provided',
  'provenance.eta.notProvidedNote': '{carrier} does not send ETAs',
  'provenance.eta.source': 'Source: {carrier} {channel} · updated {ago}',
  'provenance.eta.sourceUnchanged': 'Source: {carrier} {channel} · ETA unchanged since {since}',
  'provenance.eta.unchangedSince': '{day}, {time}',
  'provenance.eta.why': 'Why: {reason}',
  'provenance.eta.inLine': 'In line with the carrier ETA, no deviation expected',
  'provenance.eta.deviatesHighConfidence': '~{hours} h {direction, select, later {later} other {earlier}} than the carrier ETA · high confidence',
  'provenance.eta.deviatesLowConfidence': 'Wide range, low confidence · we keep watching',
  'provenance.date.dayAndTime': '{day} · {time}',
  'provenance.date.sameDayTimes': '{day} · {start}–{end}',
  'provenance.date.acrossDaysTimes': '{startDay} {startTime} – {endDay} {endTime}',
  'provenance.date.daysSameMonth': '{startDay}–{endDay}',
  'provenance.date.daysAcrossMonths': '{startDay} – {endDay}',
  'provenance.evidence.based': 'Based on {items}',
  'provenance.evidence.pair': '{first} and {second}',
  'provenance.evidence.events': '{count, plural, one {# event} other {# events}}',
  'provenance.evidence.carrierEvents': '{count, plural, one {# carrier event} other {# carrier events}}',
  'provenance.evidence.documents': '{count, plural, one {# document} other {# documents}}',
  'provenance.evidence.gpsPings': '{count, plural, one {# GPS ping} other {# GPS pings}}',
  'provenance.evidence.trafficFeeds': '{count, plural, one {# traffic feed} other {# traffic feeds}}',
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
