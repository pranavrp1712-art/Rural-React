import type { ReactNode } from 'react'
import { WarningCircle } from '@phosphor-icons/react'
import type { QueryState } from '../../lib/useQuery'
import { btn } from './styles'

/* ------------------------------------------------------------------
   The three states every data-backed block must have (improve.md §1A):
   a skeleton while loading, a real empty state, and an error with a
   retry. Never a placeholder number that later "pops in".
   ------------------------------------------------------------------ */

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-sm bg-rule/60 motion-reduce:animate-none ${className}`} />
}

export function SkeletonKpis({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-lg border border-rule bg-card p-4">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="mt-3 h-7 w-16" />
          <Skeleton className="mt-2 h-3 w-28" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonPanel({ height = 220 }: { height?: number }) {
  return (
    <div className="rounded-lg border border-rule bg-card p-4">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-3 h-7 w-20" />
      <div style={{ height }} className="mt-4 flex items-end gap-2">
        {[40, 65, 50, 80, 60, 90, 70].map((h, i) => (
          <div key={i} className="flex h-full flex-1 flex-col justify-end">
            <div aria-hidden="true" className="animate-pulse rounded-sm bg-rule/60 motion-reduce:animate-none" style={{ height: `${h}%` }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-rule" role="presentation">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-md border border-danger/30 bg-danger/5 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <WarningCircle size={20} weight="duotone" aria-hidden="true" className="mt-0.5 shrink-0 text-danger" />
        <div>
          <p className="text-sm font-semibold text-ink">Couldn't load this</p>
          <p className="text-sm text-ink-muted">{message}</p>
        </div>
      </div>
      <button type="button" onClick={onRetry} className={btn.secondary}>
        Try again
      </button>
    </div>
  )
}

/**
 * Renders the right state for a query. `isEmpty` decides when the
 * loaded data counts as empty; `empty` is what to show then.
 */
export function Query<T>({
  q,
  skeleton,
  isEmpty,
  empty,
  children,
}: {
  q: QueryState<T> & { retry: () => void }
  skeleton: ReactNode
  isEmpty?: (data: T) => boolean
  empty?: ReactNode
  children: (data: T) => ReactNode
}) {
  if (q.status === 'loading') {
    return (
      <div aria-busy="true">
        <span className="sr-only" role="status">Loading</span>
        {skeleton}
      </div>
    )
  }
  if (q.status === 'error') return <ErrorState message={q.error} onRetry={q.retry} />
  if (isEmpty?.(q.data) && empty) return <>{empty}</>
  return <>{children(q.data)}</>
}
