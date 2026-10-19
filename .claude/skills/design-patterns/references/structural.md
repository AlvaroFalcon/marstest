# Structural patterns

## Adapter

**Intent:** convert an external interface into the one the app expects.

**Use when** data comes from several sources with different shapes or vocabularies (carrier APIs, legacy endpoints, third-party SDKs) and the UI must work with one domain model. Adapters live at the boundary (`src/api/` or `src/lib/adapters/`), never in components.
**Avoid when** there is a single source whose shape is already fine: use the generated types directly.

```ts
/** Unified shipment status used across the whole app. */
export type ShipmentStatus = "booked" | "in_transit" | "at_port" | "in_customs" | "delivered" | "exception";

export type CarrierAdapter = {
  carrier: string;
  /** Maps the carrier's own status vocabulary to the unified status, or `null` if unknown. */
  toStatus(rawStatus: string): ShipmentStatus | null;
};

export const seaCarrierAdapter: CarrierAdapter = {
  carrier: "Oceanic Lines",
  toStatus(rawStatus) {
    const map: Record<string, ShipmentStatus> = {
      "GATE IN": "at_port",
      "LOADED ON VESSEL": "in_transit",
      "CUSTOMS HOLD": "in_customs",
      "DISCHARGED": "at_port",
    };
    return map[rawStatus.toUpperCase()] ?? null;
  },
};
```

Returning `null` for unknown values (instead of guessing) keeps the app from inventing states.

## Facade

**Intent:** one simple interface in front of a complex subsystem.

**Use when** components would otherwise orchestrate several services (fetch + map + cache + error handling). In React the facade is usually a **custom hook**.
**Avoid when** it only forwards a single call without simplifying anything.

```ts
/**
 * Everything a screen needs about one shipment: fetching, normalisation and
 * derived risk, behind one hook so pages stay declarative.
 */
export function useShipmentDetail(shipmentId: string) {
  const query = useQuery({
    queryKey: ["shipment", shipmentId],
    queryFn: () => fetchShipment(shipmentId).then(normaliseShipment),
  });
  const risk = query.data ? computeDeliveryRisk(query.data) : "unknown";
  return { ...query, risk };
}
```

## Decorator

**Intent:** add behaviour around an object or function without modifying it.

**Use when** adding cross-cutting concerns (retries, logging, timing, caching) to functions. In components, prefer composition (wrapper components, hooks) over HOCs.
**Avoid when** the behaviour belongs to the function itself.

```ts
/** Wraps an async function so transient failures are retried with a fixed delay. */
export function withRetry<TArgs extends unknown[], TResult>(
  operation: (...args: TArgs) => Promise<TResult>,
  attempts = 3,
  delayInMilliseconds = 500,
): (...args: TArgs) => Promise<TResult> {
  return async (...args) => {
    let lastError: unknown;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await operation(...args);
      } catch (error) {
        lastError = error;
        await new Promise((resolve) => setTimeout(resolve, delayInMilliseconds));
      }
    }
    throw lastError;
  };
}
```

## Composite

**Intent:** treat individual items and groups of items uniformly through a tree.

**Use when** data is hierarchical: nested navigation, multimodal shipments made of legs made of milestones, nested filter groups. Render it with a recursive component.
**Avoid when** the structure is always flat.

```tsx
export type MilestoneNode = {
  id: string;
  label: string;
  children: MilestoneNode[];
};

export type MilestoneTreeProps = { node: MilestoneNode };

/** Renders a milestone and, recursively, all its sub-milestones. */
export function MilestoneTree({ node }: MilestoneTreeProps) {
  return (
    <li>
      {node.label}
      {node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <MilestoneTree key={child.id} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}
```

## Proxy

**Intent:** a stand-in that controls access to another object (lazy loading, caching, access control).

**Use when** loading something heavy on demand (`React.lazy` for route-level code splitting), guarding routes by role, or memoising expensive lookups.
**Avoid when** TanStack Query already caches the data for you.

```tsx
// Route-level lazy loading: the page bundle is fetched only when the route is visited.
const ExceptionInboxPage = lazy(() =>
  import("./pages/ExceptionInboxPage").then((module) => ({ default: module.ExceptionInboxPage })),
);
```

```tsx
export type RequireRoleProps = { role: UserRole; children: ReactNode };

/** Renders children only for users with the given role; otherwise redirects home. */
export function RequireRole({ role, children }: RequireRoleProps) {
  const { user } = useCurrentUser();
  return user.role === role ? children : <Navigate to={routes.home()} replace />;
}
```
