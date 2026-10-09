import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle,
  Eye,
  EyeSlash,
  Info,
  Warning,
  XCircle,
} from '@phosphor-icons/react'
import type { Bar, Metric } from '../../data/portalTypes'
import type { Tone } from './styles'

export type { Tone } from './styles'

/* ------------------------------------------------------------------
   Shared building blocks for the portal. Same tokens, radii and type
   as the public site: nameplate labels, 2-4 px corners, mono only for
   IDs and values.
   ------------------------------------------------------------------ */


export function PageTitle({
  title,
  intro,
  actions,
}: {
  title: string
  intro?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="display text-3xl font-bold text-ink md:text-4xl">{title}</h1>
        {intro && <p className="mt-2 max-w-[68ch] text-base text-ink-muted">{intro}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({
  title,
  action,
  children,
  flush = false,
  className = '',
}: {
  title?: string
  action?: ReactNode
  children: ReactNode
  flush?: boolean
  className?: string
}) {
  return (
    <section className={`min-w-0 rounded-lg border border-rule bg-card shadow-(--shadow-e1) ${className}`}>
      {title && (
        <header className="flex min-h-12 items-center justify-between gap-3 border-b border-rule px-5 py-3">
          <h2 className="font-sans text-base font-semibold text-ink">{title}</h2>
          {action}
        </header>
      )}
      <div className={flush ? '' : 'p-5'}>{children}</div>
    </section>
  )
}

/** A stat tile: the headline number, never a chart when one number will do. */
export function Kpi({ metric }: { metric: Metric }) {
  const up = (metric.delta ?? 0) >= 0
  return (
    <div className="min-w-0 rounded-lg border border-rule bg-card p-4 shadow-(--shadow-e1)">
      <p className="text-sm font-medium text-ink-muted">{metric.label}</p>
      <p className="readout mt-1.5 font-display text-3xl font-semibold text-ink">{metric.value}</p>
      {metric.delta !== undefined ? (
        <p className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${up ? 'text-process-ink' : 'text-signal-ink'}`}>
          {up ? <ArrowUpRight size={14} aria-hidden="true" /> : <ArrowDownRight size={14} aria-hidden="true" />}
          {up ? '+' : ''}
          {metric.delta}% <span className="text-ink-faint">vs previous 30 days</span>
        </p>
      ) : (
        metric.note && <p className="mt-1 text-xs text-ink-faint">{metric.note}</p>
      )}
    </div>
  )
}

export function KpiGrid({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {metrics.map((m) => (
        <Kpi key={m.label} metric={m} />
      ))}
    </div>
  )
}

/**
 * Horizontal bars for a ranked breakdown. One hue, value printed at the
 * end of each bar, so the number never depends on colour or hover.
 */
export function BarList({ bars, unit = '', empty = 'Nothing recorded yet.' }: { bars: Bar[]; unit?: string; empty?: string }) {
  const max = Math.max(...bars.map((b) => b.value), 1)
  const total = bars.reduce((a, b) => a + b.value, 0)
  if (total === 0) return <p className="text-sm text-ink-muted">{empty}</p>
  return (
    <ul className="space-y-3" role="list">
      {bars.map((b) => (
        <li key={b.label} title={`${b.label}: ${b.value.toLocaleString('en-IN')}${unit} (${Math.round((b.value / total) * 100)}%)`}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-ink">{b.label}</span>
            <span className="readout shrink-0 font-mono text-xs text-ink-muted">
              {b.value.toLocaleString('en-IN')}
              {unit}
            </span>
          </div>
          <div className="mt-1.5 h-2 rounded-sm bg-sunk">
            <div
              className="h-full rounded-sm bg-electric-blue"
              style={{ width: `${Math.max(2, (b.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

/* ------------------------------------------------------------------
   Status. Never colour alone: every badge carries an icon and a word.
   ------------------------------------------------------------------ */


const toneClass: Record<Tone, string> = {
  good: 'border-process-green/30 bg-process-green/10 text-process-ink',
  warn: 'border-amber-glow/35 bg-amber-glow/10 text-amber-glow',
  bad: 'border-danger/30 bg-danger/8 text-danger',
  neutral: 'border-rule bg-sunk text-ink-muted',
  info: 'border-process-cyan/30 bg-process-cyan/10 text-cyan-ink',
}

const toneIcon: Record<Tone, typeof Info> = {
  good: CheckCircle,
  warn: Warning,
  bad: XCircle,
  neutral: Info,
  info: Info,
}

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  const Icon = toneIcon[tone]
  return (
    <span className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-xs font-medium whitespace-nowrap ${toneClass[tone]}`}>
      <Icon size={12} weight="bold" aria-hidden="true" />
      {children}
    </span>
  )
}

export function Alert({ tone, title, children }: { tone: Tone; title: string; children?: ReactNode }) {
  const Icon = toneIcon[tone]
  return (
    <div role={tone === 'bad' ? 'alert' : 'status'} className={`flex gap-3 rounded-md border p-3.5 ${toneClass[tone]}`}>
      <Icon size={18} weight="duotone" aria-hidden="true" className="mt-0.5 shrink-0" />
      <div className="min-w-0 text-sm">
        <p className="font-semibold">{title}</p>
        {children && <div className="mt-0.5 text-ink-muted">{children}</div>}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------
   Tables
   ------------------------------------------------------------------ */

export interface Column<T> {
  key: string
  label: string
  render: (row: T) => ReactNode
  align?: 'left' | 'right'
  /** Hidden below md, for secondary columns. */
  secondary?: boolean
}

export function DataTable<T>({
  caption,
  columns,
  rows,
  rowKey,
  empty = 'Nothing here yet.',
}: {
  caption: string
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  empty?: string
}) {
  if (rows.length === 0) return <EmptyState title={empty} />
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-rule bg-sunk/60">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap text-ink-muted ${c.align === 'right' ? 'text-right' : ''} ${c.secondary ? 'hidden md:table-cell' : ''}`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-rule last:border-b-0 hoverable:hover:bg-sunk/50">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`px-4 py-3 align-top text-ink ${c.align === 'right' ? 'text-right' : ''} ${c.secondary ? 'hidden md:table-cell' : ''}`}
                >
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-rule-strong px-5 py-10 text-center">
      <p className="font-semibold text-ink">{title}</p>
      {body && <p className="mx-auto mt-1 max-w-[52ch] text-sm text-ink-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/* ------------------------------------------------------------------
   Form fields: visible label, hint, error below the field and wired
   up with aria-describedby.
   ------------------------------------------------------------------ */

export function Field({
  label,
  hint,
  error,
  password = false,
  ...input
}: {
  label: string
  hint?: string
  error?: string
  password?: boolean
} & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label}
        {input.required && <span className="ml-0.5 text-signal-ink" aria-hidden="true">*</span>}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mt-0.5 text-xs text-ink-faint">
          {hint}
        </p>
      )}
      <div className="relative mt-1.5">
        <input
          id={id}
          {...input}
          type={password ? (visible ? 'text' : 'password') : input.type}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          className={`min-h-11 w-full rounded-sm border bg-card px-3.5 py-2.5 text-base text-ink transition-[border-color,box-shadow] duration-150 placeholder:text-ink-faint focus:border-signal-orange focus:ring-2 focus:ring-signal-orange/20 focus:outline-none ${
            password ? 'pr-12' : ''
          } ${error ? 'border-danger' : 'border-rule-strong hoverable:hover:border-ink-faint'}`}
        />
        {password && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-muted hoverable:hover:text-ink"
          >
            {visible ? <EyeSlash size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

export function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="size-4 animate-spin rounded-full border-2 border-current/30 border-t-current"
    />
  )
}
