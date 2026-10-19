# React patterns

## Custom hooks

**Intent:** extract and reuse stateful logic (the React-native form of Facade + Template Method).

**Use when** two components share stateful logic, or a component mixes data/logic concerns with rendering. Hooks live in `src/hooks/` and are named `useSomething`.
**Avoid when** the logic is pure: write a plain function in `src/lib/` (easier to test).

```ts
/**
 * Reads and writes the shipment list filters from the URL, validated with zod.
 * Changing any filter resets pagination, as required by the URL-state guidelines.
 */
export function useShipmentFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = shipmentFiltersSchema.parse(Object.fromEntries(searchParams));

  function setFilter<TKey extends keyof ShipmentFilters>(key: TKey, value: ShipmentFilters[TKey]) {
    setSearchParams(serialiseFilters({ ...filters, [key]: value, page: 1 }));
  }

  return { filters, setFilter };
}
```

## Compound components

**Intent:** a set of components that work together and share implicit state through Context (Composite applied to UI).

**Use when** building a widget with several related parts whose layout the caller controls (Tabs, Stepper, Timeline). shadcn/ui components (Radix-based) already follow it: prefer them.
**Avoid when** a single component with a few props is enough.

```tsx
const TimelineContext = createContext<{ activeStepId: string } | null>(null);

export type TimelineProps = { activeStepId: string; children: ReactNode };

/** Vertical timeline; steps read the active step from context to highlight themselves. */
export function Timeline({ activeStepId, children }: TimelineProps) {
  return (
    <TimelineContext value={{ activeStepId }}>
      <ol className="flex flex-col gap-4">{children}</ol>
    </TimelineContext>
  );
}

export type TimelineStepProps = { id: string; label: string };

export function TimelineStep({ id, label }: TimelineStepProps) {
  const context = use(TimelineContext);
  if (!context) throw new Error("TimelineStep must be used inside Timeline");
  return <li data-state={context.activeStepId === id ? "active" : "inactive"}>{label}</li>;
}
```

## Slots and render props

**Intent:** let the caller decide what to render in parts of a reusable component.

**Use when** a layout component should not know its content (`header`, `actions`, `emptyState` props), or the caller needs data from inside the component to render (render prop).
**Avoid when** `children` alone is enough.

```tsx
export type DataStateProps<TData> = {
  query: UseQueryResult<TData>;
  emptyState: ReactNode;
  children: (data: TData) => ReactNode;
};

/** Renders loading, error and empty states consistently; the caller only renders the data. */
export function DataState<TData>({ query, emptyState, children }: DataStateProps<TData>) {
  if (query.isPending) return <Skeleton className="h-24" />;
  if (query.isError) return <ErrorMessage error={query.error} onRetry={query.refetch} />;
  if (Array.isArray(query.data) && query.data.length === 0) return emptyState;
  return children(query.data);
}
```

## Provider

**Intent:** make a value available to a subtree without prop drilling (Context).

**Use when** the value is truly global and changes rarely (theme, current user, selected role, locale). Expose it through a hook (`useCurrentRole`) that throws when used outside the provider.
**Avoid when** the value changes often or has many consumers that only need part of it: Context re-renders every consumer, so use zustand with selectors. Server data belongs in TanStack Query, not Context.

## Controlled and uncontrolled

**Intent:** let a component manage its own state by default, while allowing the parent to take control.

**Use when** building reusable inputs/widgets (shadcn/Radix components follow this: `value` + `onValueChange` vs `defaultValue`).
**Avoid when** the component has a single consumer: pick one mode.

```tsx
export type ToggleProps = {
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
};

/** Toggle that is uncontrolled by default and controlled when `pressed` is provided. */
export function Toggle({ pressed, defaultPressed = false, onPressedChange }: ToggleProps) {
  const [internalPressed, setInternalPressed] = useState(defaultPressed);
  const isControlled = pressed !== undefined;
  const currentPressed = isControlled ? pressed : internalPressed;

  function handleClick() {
    if (!isControlled) setInternalPressed(!currentPressed);
    onPressedChange?.(!currentPressed);
  }

  return <button type="button" aria-pressed={currentPressed} onClick={handleClick} />;
}
```
