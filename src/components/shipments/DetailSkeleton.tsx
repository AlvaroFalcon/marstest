import { Skeleton } from '@/components/ui/skeleton'

export type DetailSkeletonProps = {
  /** Screen-reader text announced while loading ("Loading the exception"). */
  label: string
}

/**
 * Placeholder shaped like the detail (header, data row, ETA pair, journey, diagnosis, document
 * rows) so the layout does not jump when the data arrives. It is a container itself so the ETA
 * pair stacks the way the real one does.
 */
export function DetailSkeleton({ label }: DetailSkeletonProps) {
  return (
    <div role="status" aria-busy="true" className="@container flex flex-col gap-6">
      <span className="sr-only">{label}</span>
      <Skeleton aria-hidden="true" className="h-8 w-3/4" />
      <Skeleton
        aria-hidden="true"
        className="
          h-10
          @xl:h-16 @xl:rounded-lg
        "
      />
      <div
        aria-hidden="true"
        className="
          grid gap-3
          @xl:grid-cols-2
        "
      >
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
      <Skeleton aria-hidden="true" className="h-40 rounded-lg" />
      <Skeleton aria-hidden="true" className="h-32 rounded-lg" />
      <div aria-hidden="true" className="flex flex-col gap-3">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    </div>
  )
}
