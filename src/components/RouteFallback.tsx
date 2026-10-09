import { Container } from './primitives'

/**
 * Shown while a split route chunk loads. It reserves the height a page
 * header occupies so the arriving page does not shift the layout, and
 * it is a skeleton rather than a spinner because the wait is usually
 * long enough that a spinner just flashes.
 */
export function RouteFallback() {
  return (
    <div className="pt-28 pb-24 md:pt-32" role="status" aria-live="polite">
      <span className="sr-only">Loading page</span>
      <Container>
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 rounded-full bg-rule" />
          <div className="h-12 w-3/4 max-w-[560px] rounded-lg bg-rule/70" />
          <div className="h-4 w-full max-w-[680px] rounded bg-rule/50" />
          <div className="h-4 w-2/3 max-w-[520px] rounded bg-rule/50" />
          <div className="grid gap-4 pt-8 md:grid-cols-3">
            <div className="h-40 rounded-xl bg-rule/40" />
            <div className="h-40 rounded-xl bg-rule/40" />
            <div className="h-40 rounded-xl bg-rule/40" />
          </div>
        </div>
      </Container>
    </div>
  )
}
