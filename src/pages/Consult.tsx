import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, PageSection } from '../components/pageKit'
import { brandChoice, consultTopics, positioning } from '../data/startPaths'
import { submitConsultation } from '../lib/db'
import { usePageMeta } from '../lib/usePageMeta'

type Errors = Partial<Record<'name' | 'company' | 'email' | 'message', string>>

const inputClass =
  'mt-1.5 min-h-11 w-full rounded-sm border bg-card px-3 text-base text-ink transition-[border-color] duration-150 focus:border-signal-orange focus:outline-none focus:ring-2 focus:ring-signal-orange/20'

function Field({
  id,
  label,
  hint,
  error,
  required,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label}
        {required && <span aria-hidden="true" className="text-danger"> *</span>}
      </label>
      {hint && <p id={`${id}-hint`} className="text-xs text-ink-faint">{hint}</p>}
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * md/main.md §3.5 CONSULT: "Book technical consultation". The request
 * is recorded as a lead for the engineering, marketing and admin
 * dashboards. Nothing is emailed yet, and the page says so.
 */
export default function Consult() {
  usePageMeta({
    title: 'Book a technical consultation',
    description:
      'Talk to a RuralReact automation engineer about your process before anything is specified: sensors, PLC, HMI, control panel, communication and IIoT architecture. Vendor-neutral.',
    path: '/consult',
  })

  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', topic: consultTopics[0], equipment: brandChoice[1], message: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [ref, setRef] = useState<string>()

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: Errors = {
      name: form.name.trim() ? undefined : 'Enter your name.',
      company: form.company.trim() ? undefined : 'Enter your company or plant name.',
      email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()) ? undefined : 'Enter a complete work email so we can reply.',
      message: form.message.trim().length >= 12 ? undefined : 'A sentence or two about the process is enough to start.',
    }
    setErrors(next)
    const first = (Object.keys(next) as (keyof Errors)[]).find((k) => next[k])
    if (first) {
      document.getElementById(`c-${first}`)?.focus()
      return
    }
    setState('sending')
    const lead = submitConsultation(form)
    setRef(lead.id)
    window.setTimeout(() => setState('sent'), 400)
  }

  const describe = (id: string, hint?: boolean) =>
    [hint ? `${id}-hint` : '', errors[id.slice(2) as keyof Errors] ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined

  return (
    <>
      <PageHeader
        label="CONSULT"
        title="Book a technical consultation"
        intro="Talk to an automation engineer about your process before anything is specified. You leave with a clearer scope, whichever brands you end up using."
        trail={[{ label: 'Home', to: '/' }, { label: 'Consultation' }]}
      />

      <PageSection>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-16">
          <div>
            <h2 className="text-xl font-semibold text-ink">What a consultation can cover</h2>
            <ul className="mt-4 divide-y divide-rule border-y border-rule" role="list">
              {consultTopics.map((t) => (
                <li key={t} className="py-2.5 text-base text-ink">{t}</li>
              ))}
            </ul>
            <p className="mt-6 border-l-2 border-process-green pl-4 text-base text-ink">{positioning.brands}</p>
            <p className="mt-6 text-sm text-ink-muted">
              Already know what you need?{' '}
              <Link to="/rfq" className="font-semibold text-signal-ink hoverable:hover:underline">Go to the RFQ summary</Link>
              {' '}or{' '}
              <Link to="/configure" className="font-semibold text-signal-ink hoverable:hover:underline">start the requirement wizard</Link>.
            </p>
          </div>

          <div className="rounded-sm border border-rule bg-card p-5 shadow-(--shadow-e1) md:p-7">
            {state === 'sent' ? (
              <div role="status">
                <p className="font-mono text-xs font-semibold text-process-ink">CONSULTATION REQUEST RECORDED · {ref}</p>
                <h2 className="mt-3 text-2xl font-semibold text-ink">Thank you, {form.name.trim().split(' ')[0]}.</h2>
                <p className="mt-2 text-base text-ink-muted">
                  Your request is with the engineering team. An engineer will reply to{' '}
                  <span className="font-mono text-sm font-medium text-ink">{form.email.trim()}</span> to arrange a time.
                </p>
                <p className="mt-4 text-xs text-ink-faint">Prototype: the request is stored in this browser and no email is sent yet.</p>
                <Link to="/" className="mt-6 inline-flex min-h-11 items-center rounded-sm border border-rule-strong px-4 text-sm font-semibold text-ink hoverable:hover:border-ink">
                  Back to home
                </Link>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="space-y-5">
                <h2 className="text-xl font-semibold text-ink">Tell us about your process</h2>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field id="c-name" label="Your name" required error={errors.name}>
                    <input id="c-name" autoComplete="name" value={form.name} onChange={set('name')} aria-invalid={Boolean(errors.name)} aria-describedby={describe('c-name')} className={`${inputClass} ${errors.name ? 'border-danger' : 'border-rule-strong'}`} />
                  </Field>
                  <Field id="c-company" label="Company or plant" required error={errors.company}>
                    <input id="c-company" autoComplete="organization" value={form.company} onChange={set('company')} aria-invalid={Boolean(errors.company)} aria-describedby={describe('c-company')} className={`${inputClass} ${errors.company ? 'border-danger' : 'border-rule-strong'}`} />
                  </Field>
                  <Field id="c-email" label="Work email" required error={errors.email}>
                    <input id="c-email" type="email" autoComplete="email" value={form.email} onChange={set('email')} aria-invalid={Boolean(errors.email)} aria-describedby={describe('c-email')} className={`${inputClass} ${errors.email ? 'border-danger' : 'border-rule-strong'}`} />
                  </Field>
                  <Field id="c-phone" label="Phone (optional)">
                    <input id="c-phone" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} className={`${inputClass} border-rule-strong`} />
                  </Field>
                </div>
                <Field id="c-topic" label="What is it mainly about?">
                  <select id="c-topic" value={form.topic} onChange={set('topic')} className={`${inputClass} border-rule-strong`}>
                    {consultTopics.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <fieldset>
                  <legend className="text-sm font-semibold text-ink">Equipment and brands</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {brandChoice.map((b) => (
                      <label key={b} className="flex min-h-11 items-center gap-2 rounded-sm border border-rule px-3 text-sm text-ink has-[:checked]:border-signal-orange has-[:checked]:bg-signal-orange/5">
                        <input type="radio" name="equipment" checked={form.equipment === b} onChange={() => setForm({ ...form, equipment: b })} className="accent-signal-orange" />
                        {b}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <Field id="c-message" label="Describe the process" hint="What you measure, control or monitor today, and what is not working." required error={errors.message}>
                  <textarea id="c-message" rows={5} value={form.message} onChange={set('message')} aria-invalid={Boolean(errors.message)} aria-describedby={describe('c-message', true)} className={`${inputClass} py-2 ${errors.message ? 'border-danger' : 'border-rule-strong'}`} />
                </Field>
                <button
                  type="submit"
                  disabled={state === 'sending'}
                  className="inline-flex min-h-11 items-center justify-center rounded-sm bg-signal-orange px-5 py-2.5 text-base font-semibold text-on-signal transition-[background-color,transform] duration-150 hoverable:hover:bg-signal-orange-hover active:scale-[0.97] disabled:opacity-60"
                >
                  {state === 'sending' ? 'Sending…' : 'Request a consultation'}
                </button>
                <p className="text-xs text-ink-faint">Your details go to the engineering team only.</p>
              </form>
            )}
          </div>
        </div>
      </PageSection>
    </>
  )
}
