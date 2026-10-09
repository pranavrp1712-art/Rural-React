import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { emailById } from '../../emails/templates'
import { btn } from './styles'

/**
 * The frame every sign-in screen sits in: a panel-navy side that says
 * where you are signing in to, and a quiet light side for the form.
 * On phones the navy side collapses to a header strip.
 */
export function AuthShell({
  eyebrow,
  title,
  body,
  aside,
  children,
}: {
  eyebrow: string
  title: string
  body?: string
  aside?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="min-h-dvh bg-page lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="surface-band relative isolate overflow-hidden px-5 py-6 lg:flex lg:min-h-dvh lg:flex-col lg:px-12 lg:py-10">
        <div aria-hidden="true" className="blueprint-grid absolute inset-0 -z-10" />
        <Link to="/" className="inline-flex items-center gap-2 rounded-sm" aria-label="RuralReact home">
          <svg viewBox="0 0 32 32" aria-hidden="true" className="size-7" fill="none">
            <rect width="32" height="32" rx="4" fill="var(--color-band-ink)" />
            <path d="M6 20h4l3-8 3 12 3-10 2 6h5" stroke="var(--color-signal-orange)" strokeWidth="2.4" strokeLinecap="square" />
            <circle cx="26" cy="8" r="2.5" fill="var(--color-process-green)" />
          </svg>
          <span className="font-display text-xl font-bold text-band-ink">RuralReact</span>
        </Link>

        <div className="mt-6 lg:mt-auto lg:mb-auto lg:max-w-[440px] lg:py-12">
          <p className="border-l-2 border-signal-orange pl-2.5 font-mono text-xs font-medium tracking-wide text-band-ink-muted">
            {eyebrow}
          </p>
          <h1 className="display mt-3 text-3xl leading-[1.05] font-bold text-band-ink lg:text-5xl">{title}</h1>
          {body && <p className="mt-3 hidden text-base text-band-ink-muted lg:block">{body}</p>}
          {aside && <div className="mt-8 hidden lg:block">{aside}</div>}
        </div>

        <p className="mt-4 hidden text-xs text-band-ink-faint lg:block">
          Prototype. Sign-in is simulated in this browser, and every account, demo or new, starts with no records.
        </p>
      </aside>

      <main id="main" className="flex items-start justify-center px-5 py-10 lg:items-center lg:px-12">
        <div className="w-full max-w-[440px]">{children}</div>
      </main>
    </div>
  )
}

/** Lists what a role can do, as the checklist beside its login form. */
export function CapabilityList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5" role="list">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 text-sm text-band-ink">
          <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-process-green" />
          {item}
        </li>
      ))}
    </ul>
  )
}

/**
 * In the prototype there is no mail server, so screens that "send" an
 * email let you open exactly what would have been sent.
 */
export function EmailPreview({ templateId, label = 'Preview the email' }: { templateId: string; label?: string }) {
  const [open, setOpen] = useState(false)
  const template = emailById(templateId)
  if (!template) return null
  return (
    <div className="mt-4">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className={btn.secondary}>
        {open ? 'Hide email preview' : `${label} (demo)`}
      </button>
      {open && (
        <div className="mt-3 overflow-hidden rounded-md border border-rule bg-card">
          <p className="border-b border-rule bg-sunk px-3 py-2 text-xs text-ink-muted">
            <span className="font-semibold text-ink">Subject:</span> {template.subject}
          </p>
          <iframe
            title={`Email preview: ${template.name}`}
            srcDoc={template.render()}
            sandbox=""
            className="block h-[560px] w-full"
          />
        </div>
      )}
    </div>
  )
}
