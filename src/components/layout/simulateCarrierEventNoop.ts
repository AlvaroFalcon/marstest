/**
 * Carrier events can only be simulated from M15 on. The button is already visible and clickable
 * (ADR 0057) but intentionally does nothing until that milestone wires it to the API.
 */
export function simulateCarrierEventNoop(): void {}
