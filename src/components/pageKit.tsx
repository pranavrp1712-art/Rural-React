import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Warning, Info, ShieldCheck, CaretRight } from '@phosphor-icons/react'
import { Container, Reveal, SplitWords } from './primitives'
import { useInView } from '../lib/motion'

/* ------------------------------------------------------------------
   Breadcrumbs. Spec 10 wants orientation on the deeper pages; the
   guidance is to use them once a hierarchy is three levels deep.
   ------------------------------------------------------------------ */

export interface Crumb {
  label: string
  to?: string
}

export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 font-mono text-xs text-ink-faint">
        {trail.map((crumb, index) => {
          const last = index === trail.length - 1
          return (
            <li key={crumb.label} className="flex items-center gap-1.5">
              {crumb.to && !last ? (
                <Link
                  to={crumb.to}
                  className="rounded-sm px-1 py-0.5 transition-colors hoverable:hover:text-signal-ink"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className={last ? 'text-ink-muted' : undefined} aria-current={last ? 'page' : undefined}>
                  {crumb.label}
                </span>
              )}
              {!last && <CaretRight size={10} weight="bold" aria-hidden="true" className="text-rule-strong" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/* ------------------------------------------------------------------
   Page header. The band at the top of every inner page, so a deep page
   is recognisably part of the same site as the landing page.
   ------------------------------------------------------------------ */

export function PageHeader({
  label,
  title,
  intro,
  trail,
  aside,
}: {
  label: string
  title: string
  intro?: string
  trail?: Crumb[]
  aside?: ReactNode
}) {
  const [ref, shown] = useInView<HTMLDivElement>('0px')
  return (
    <header className="surface-band relative isolate overflow-hidden border-b border-band-rule pt-28 pb-14 md:pt-36 md:pb-16">
      <div aria-hidden="true" className="blueprint-grid grid-drift absolute inset-0 -z-10 opacity-60" />

      <Container className="relative">
        {trail && <Breadcrumbs trail={trail} />}
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div ref={ref} data-shown={shown || undefined} className="max-w-[720px]">
            <span className="hero-in inline-flex items-center gap-2 border-l-2 border-signal-orange py-0.5 pl-2.5 font-mono text-xs font-medium tracking-wide text-band-ink-muted">
              {label}
            </span>
            <h1 className="display mt-4 text-4xl leading-[1.05] font-bold text-band-ink md:text-5xl lg:text-[3.5rem]">
              <SplitWords text={title} />
            </h1>
            {intro && <p style={{ '--d': '380ms' } as React.CSSProperties} className="hero-in mt-5 max-w-[62ch] text-lg leading-relaxed text-band-ink-muted">{intro}</p>}
          </div>
          {aside && <div className="shrink-0">{aside}</div>}
        </div>
      </Container>
    </header>
  )
}

/* ------------------------------------------------------------------
   Compliance notices.

   These carry the wording the briefs mandate. They are deliberately
   prominent rather than tucked into a footnote, because the whole
   point is that a preliminary figure must not be mistaken for an
   engineering approved one.
   ------------------------------------------------------------------ */

type NoticeTone = 'caution' | 'info' | 'assured'

const noticeStyle: Record<NoticeTone, { wrap: string; icon: string; Icon: typeof Warning }> = {
  caution: {
    wrap: 'border-amber-glow/35 bg-amber-glow/10',
    icon: 'text-amber-glow',
    Icon: Warning,
  },
  info: {
    wrap: 'border-process-cyan/30 bg-process-cyan/10',
    icon: 'text-cyan-ink',
    Icon: Info,
  },
  assured: {
    wrap: 'border-process-green/30 bg-process-green/10',
    icon: 'text-process-ink',
    Icon: ShieldCheck,
  },
}

export function Notice({
  tone = 'caution',
  title,
  children,
}: {
  tone?: NoticeTone
  title: string
  children?: ReactNode
}) {
  const style = noticeStyle[tone]
  const Icon = style.Icon
  return (
    <div className={`flex gap-3.5 rounded-lg border p-4 md:p-5 ${style.wrap}`}>
      <Icon size={20} weight="duotone" aria-hidden="true" className={`mt-0.5 shrink-0 ${style.icon}`} />
      <div className="min-w-0">
        <p className={`font-mono text-xs font-bold tracking-wide ${style.icon}`}>{title}</p>
        {children && <div className="mt-1.5 text-sm leading-relaxed text-ink-muted">{children}</div>}
      </div>
    </div>
  )
}

/**
 * The qualifier the brief requires wherever an application is shown
 * that is not a confirmed RuralReact deployment.
 */
export function CategoryTag({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border border-rule bg-sunk px-2.5 py-0.5 font-mono text-[11px] font-medium text-ink-faint ${className}`}
      title="This is an automation solution category, not a confirmed RuralReact deployment."
    >
      <span aria-hidden="true" className="size-1 shrink-0 rounded-full bg-rule-strong" />
      Automation Solution Category
    </span>
  )
}

/** Applied to any instrument that is not a confirmed standard product. */
export function ConfigurableTag({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border border-process-cyan/25 bg-process-cyan/10 px-2.5 py-0.5 font-mono text-[11px] font-medium text-cyan-ink ${className}`}
    >
      <span aria-hidden="true" className="size-1 shrink-0 rounded-full bg-process-cyan" />
      Available for configuration
    </span>
  )
}

/* ------------------------------------------------------------------
   Section scaffolding for inner pages.
   ------------------------------------------------------------------ */

export function PageSection({
  id,
  label,
  title,
  intro,
  children,
  tone = 'page',
}: {
  id?: string
  label?: string
  title?: string
  intro?: string
  children: ReactNode
  tone?: 'page' | 'card'
}) {
  return (
    <section
      id={id}
      className={`relative isolate overflow-hidden border-t border-rule py-16 md:py-20 ${
        tone === 'card' ? 'bg-card/70' : 'bg-page/70'
      }`}
    >
      <div aria-hidden="true" className="sheet-grid absolute inset-0 -z-10" />
      <Container>
        {(label || title) && (
          <Reveal className="max-w-[720px]">
            {label && (
              <span className="inline-flex items-center gap-2 border-l-2 border-signal-orange py-0.5 pl-2.5 font-mono text-xs font-medium tracking-wide text-ink-muted">
                {label}
              </span>
            )}
            {title && (
              <h2 className="display mt-3 text-3xl font-semibold md:text-4xl">{title}</h2>
            )}
            {intro && <p className="mt-4 text-lg leading-relaxed text-ink-muted">{intro}</p>}
          </Reveal>
        )}
        <div className={label || title ? 'mt-10' : undefined}>{children}</div>
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------------
   Small shared pieces
   ------------------------------------------------------------------ */

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-rule bg-sunk px-2.5 py-1 font-mono text-xs text-ink-muted">
      {children}
    </span>
  )
}

/** Two column definition row used across the spec tables. */
export function SpecTable({
  rows,
  caption,
}: {
  rows: { label: string; value: ReactNode; note?: string }[]
  caption?: string
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-rule bg-card shadow-(--shadow-e1)">
      {caption && (
        <div className="border-b border-rule bg-sunk/80 px-5 py-3 font-mono text-xs font-semibold tracking-wide text-ink-faint">
          {caption}
        </div>
      )}
      <dl>
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid gap-1 border-b border-rule px-5 py-3.5 transition-colors last:border-b-0 hoverable:hover:bg-hover/50 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] sm:gap-4"
          >
            <dt className="text-sm font-semibold text-ink">{row.label}</dt>
            <dd className="min-w-0 text-sm text-ink-muted">
              {row.value}
              {row.note && <span className="mt-0.5 block text-xs text-ink-faint">{row.note}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/** A numbered flow rendered as a rail, used for process and workflow lists. */
export function FlowRail({
  items,
}: {
  items: { id: string; label: string; tag?: string; note?: string; muted?: boolean }[]
}) {
  return (
    <ol className="relative space-y-0" role="list">
      <span
        aria-hidden="true"
        className="absolute top-2 bottom-2 left-[7px] w-px bg-rule-strong"
      />
      {items.map((item, index) => (
        <li key={item.id} className="relative flex gap-4 pb-6 pl-8 last:pb-0">
          <span
            aria-hidden="true"
            className={`absolute top-1.5 left-0 size-[15px] rounded-full border-2 ${
              item.muted ? 'border-rule-strong bg-card' : 'border-signal-orange bg-band'
            }`}
          >
            <span
              className={`absolute inset-[3px] rounded-full ${item.muted ? 'bg-rule-strong' : 'bg-signal-orange'}`}
            />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-mono text-[11px] text-ink-faint">
                {item.tag ?? String(index + 1).padStart(2, '0')}
              </span>
              <span className="text-base font-bold text-ink">{item.label}</span>
              {item.muted && <span className="font-mono text-[11px] text-ink-faint">optional</span>}
            </div>
            {item.note && <p className="mt-1 text-sm leading-relaxed text-ink-muted">{item.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}

/** Card grid entry used on the index pages. */
export function LinkCard({
  to,
  eyebrow,
  title,
  body,
  footer,
}: {
  to: string
  eyebrow?: ReactNode
  title: string
  body: string
  footer?: ReactNode
}) {
  return (
    <Link
      to={to}
      className="spotlight lift group relative flex flex-col overflow-hidden rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1) hoverable:hover:border-signal-orange/40"
    >
      <span
        aria-hidden="true"
        className="absolute top-0 left-0 h-1 w-full origin-left scale-x-0 bg-signal-orange transition-transform duration-300 ease-(--ease-rise) group-hover:scale-x-100 group-focus-visible:scale-x-100"
      />
      {eyebrow && <div className="mb-4 flex flex-wrap items-center gap-2">{eyebrow}</div>}
      <h3 className="text-xl font-bold tracking-tight text-ink">{title}</h3>
      <p className="mt-2.5 flex-1 text-sm leading-relaxed text-ink-muted">{body}</p>
      <span className="mt-5 inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-signal-ink transition-[gap] duration-200 group-hover:gap-2.5">
        {footer ?? 'Open'}
        <span aria-hidden="true">&rarr;</span>
      </span>
    </Link>
  )
}
