# Creational patterns

## Factory

**Intent:** create the right object from a discriminator in one place, so callers do not repeat `switch` statements.

**Use when** several variants share a type and the variant is chosen from data (a `mode`, a `type`, an API field).
**Avoid when** there is only one variant, or a plain object literal is enough.

```ts
/** Legs of a multimodal shipment, discriminated by transport mode. */
export type ShipmentLeg =
  | { mode: "road"; carrier: string; plate: string }
  | { mode: "sea"; carrier: string; vesselName: string; billOfLading: string };

export type RawLeg = { transport_mode: string; carrier_name: string; [key: string]: unknown };

/**
 * Builds a typed shipment leg from a raw carrier record. Centralises the
 * mode detection so that unknown modes fail loudly in one place.
 *
 * @throws Error when the transport mode is not supported.
 */
export function createShipmentLeg(raw: RawLeg): ShipmentLeg {
  switch (raw.transport_mode) {
    case "ROAD":
      return { mode: "road", carrier: raw.carrier_name, plate: String(raw.plate) };
    case "SEA":
      return {
        mode: "sea",
        carrier: raw.carrier_name,
        vesselName: String(raw.vessel),
        billOfLading: String(raw.bl_number),
      };
    default:
      throw new Error(`Unsupported transport mode: ${raw.transport_mode}`);
  }
}
```

In React, a "component factory" is usually a lookup map: `const legIcons: Record<ShipmentLeg["mode"], ComponentType> = { road: TruckIcon, sea: ShipIcon }`.

## Builder

**Intent:** assemble an object with many optional parts step by step, with readable defaults.

**Use when** objects have many optional fields: test fixtures, complex query/search params, report configurations.
**Avoid when** an object literal with spread defaults is just as readable (most production code). In tests prefer a factory function with overrides (or `fishery`).

```ts
/** Test fixture builder: sensible defaults, override only what the test cares about. */
export function buildShipment(overrides: Partial<Shipment> = {}): Shipment {
  return {
    id: "SHP-001",
    customerName: "John Smith",
    origin: "Barcelona plant",
    destination: "Rotterdam",
    status: "in_transit",
    milestones: [],
    ...overrides,
  };
}
```

Fluent builder variant, useful when construction has ordering rules:

```ts
export class ShipmentQueryBuilder {
  private readonly params = new URLSearchParams();

  withStatus(status: ShipmentStatus): this {
    this.params.set("status", status);
    return this;
  }

  withCarrier(carrier: string): this {
    this.params.set("carrier", carrier);
    return this;
  }

  build(): string {
    return this.params.toString();
  }
}
```

## Singleton (module)

**Intent:** a single shared instance.

**Use when** you need exactly one API client, query client or config object. In ES modules, **the module itself is the singleton**: export an instance.
**Avoid when** the instance holds mutable state that tests need to reset; export a factory and create the instance in `App.tsx` instead.

```ts
// src/config.ts — environment validated once at start-up, one shared config object.
const environment = environmentSchema.parse(import.meta.env);

export const config = { apiUrl: environment.VITE_API_URL, defaultLocale: "en" } as const;
```

```ts
// src/App.tsx — QueryClient created once and provided, so tests can create their own.
const queryClient = new QueryClient();
```
