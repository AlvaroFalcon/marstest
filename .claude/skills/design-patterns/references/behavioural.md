# Behavioural patterns

## Strategy

**Intent:** define a family of interchangeable algorithms and choose one at runtime.

**Use when** the same operation varies by a key (transport mode, user role, sort criterion) and the variants keep growing. In TypeScript a strategy is just a function; a `Record` maps keys to strategies.
**Avoid when** there are only two stable branches: an `if` is clearer.

```ts
export type EtaStrategy = (shipment: Shipment) => EtaEstimate;

const etaStrategies: Record<TransportMode, EtaStrategy> = {
  road: estimateRoadEta,
  sea: estimateSeaEta,
  multimodal: estimateMultimodalEta,
};

/** Estimates the ETA using the algorithm that matches the shipment's transport mode. */
export function estimateEta(shipment: Shipment): EtaEstimate {
  return etaStrategies[shipment.mode](shipment);
}
```

The `Record` type guarantees at compile time that every mode has a strategy.

## Observer

**Intent:** notify subscribers when a subject changes.

**Use when** several unrelated parts react to the same event (notifications, real-time updates, cross-component sync). In React you rarely write it by hand: Context and the TanStack Query cache are observers already. Write it manually only for non-React integrations (WebSocket, `BroadcastChannel`), and connect it with `useSyncExternalStore`.
**Avoid when** a parent can pass a callback prop.

```ts
type Listener<TEvent> = (event: TEvent) => void;

/** Minimal typed event emitter for integrations outside React. */
export function createEmitter<TEvent>() {
  const listeners = new Set<Listener<TEvent>>();
  return {
    subscribe(listener: Listener<TEvent>) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    emit(event: TEvent) {
      listeners.forEach((listener) => listener(event));
    },
  };
}
```

## State machine

**Intent:** model an entity that moves through a finite set of states with explicit allowed transitions (the classic *State* pattern, expressed as data).

**Use when** there are rules about which transitions are legal (shipment lifecycle, multi-step forms, approval flows) or when boolean flags combine into impossible states (`isLoading && isError`).
**Avoid when** there are two states: a boolean is fine.

```ts
export type ExceptionStatus = "open" | "acknowledged" | "action_proposed" | "resolved" | "dismissed";

const allowedTransitions: Record<ExceptionStatus, ExceptionStatus[]> = {
  open: ["acknowledged", "dismissed"],
  acknowledged: ["action_proposed", "dismissed"],
  action_proposed: ["resolved", "acknowledged"],
  resolved: [],
  dismissed: [],
};

/** Returns true when an exception may move from `from` to `to`. */
export function canTransition(from: ExceptionStatus, to: ExceptionStatus): boolean {
  return allowedTransitions[from].includes(to);
}
```

In components, combine it with `useReducer`, whose reducer rejects illegal transitions.

## Command

**Intent:** encapsulate an action as an object so it can be queued, logged, undone or approved before running.

**Use when** actions need undo/redo, an approval step ("AI proposes, human approves"), an audit log or offline queueing. TanStack Query `useMutation` already covers the "run + track status" part.
**Avoid when** the action just runs once on click.

```ts
export type ProposedAction = {
  id: string;
  description: string;
  execute: () => Promise<void>;
};

/** Runs a proposed action only after explicit approval, and records who approved it. */
export async function approveAndRun(action: ProposedAction, approvedBy: string): Promise<void> {
  await auditLog.record({ actionId: action.id, approvedBy });
  await action.execute();
}
```

## Chain of Responsibility

**Intent:** pass a request through an ordered list of handlers until one handles it.

**Use when** applying ordered rules: status normalisation with fallbacks, validation pipelines, priority scoring where the first matching rule wins.
**Avoid when** all rules always apply: use a simple `map`/`reduce` pipeline.

```ts
export type PriorityRule = (shipment: Shipment) => Priority | null;

const priorityRules: PriorityRule[] = [
  (shipment) => (shipment.status === "in_customs" && shipment.isBlocked ? "critical" : null),
  (shipment) => (shipment.hoursSinceLastUpdate > 48 ? "high" : null),
  (shipment) => (shipment.isDelayed ? "medium" : null),
];

/** Returns the priority of the first rule that matches, or "low" when none does. */
export function computePriority(shipment: Shipment): Priority {
  for (const rule of priorityRules) {
    const priority = rule(shipment);
    if (priority) return priority;
  }
  return "low";
}
```

## Template Method

**Intent:** fix the skeleton of a flow and let each case customise specific steps.

**Use when** several flows share the same steps in the same order (fetch → validate → map → report) but differ in one or two of them. In TypeScript pass the varying steps as functions; avoid class inheritance.
**Avoid when** the flows share less than they differ.

```ts
export type ImportSteps<TRaw> = {
  fetchRaw: () => Promise<TRaw[]>;
  toShipment: (raw: TRaw) => Shipment | null;
};

/** Shared import flow for every carrier: fetch, map, and drop unmappable records. */
export async function importShipments<TRaw>({ fetchRaw, toShipment }: ImportSteps<TRaw>): Promise<Shipment[]> {
  const rawRecords = await fetchRaw();
  return rawRecords.map(toShipment).filter((shipment): shipment is Shipment => shipment !== null);
}
```
