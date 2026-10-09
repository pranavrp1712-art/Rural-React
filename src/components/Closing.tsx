import { useState, type FormEvent } from 'react'
import { faqs } from '../data/content'
import { navigation, secondaryCta } from '../data/navigation'
import { Container, Reveal, SectionHeading } from './primitives'
import { SmartLink } from './SmartLink'
import { submitEnquiry } from '../lib/db'

/* ------------------------------------------------------------------
   FAQ. Plain question and answer, all readable without JavaScript
   through the native details element.
   ------------------------------------------------------------------ */

export function Faqs() {
  return (
    <section id="faq" className="relative isolate overflow-hidden border-t border-rule py-20 md:py-28">
      <div aria-hidden="true" className="sheet-grid absolute inset-0 -z-10" />

      <Container>
        <Reveal>
          <SectionHeading
            label="QUESTIONS"
            title="What engineers ask us before they start"
            intro="If your question is not here, put it to an engineer directly. You will get an answer from someone who has commissioned a panel, not from a sales desk."
          />
        </Reveal>

        <Reveal delay={80} className="mt-12 overflow-hidden rounded-xl border border-rule bg-card shadow-(--shadow-e1)">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              name="faq"
              className="group border-b border-rule last:border-b-0 open:bg-sunk/60"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 min-h-14 px-5 py-4 text-base font-semibold text-ink transition-[background-color] duration-150 hoverable:hover:bg-sunk md:px-7">
                <span>{faq.q}</span>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-sm border border-rule text-ink-muted transition-transform duration-200 ease-(--ease-out) group-open:rotate-45 group-open:border-signal-orange group-open:text-signal-ink">
                  <svg
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                    className="size-3.5 shrink-0"
                  >
                    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <p className="max-w-[700px] px-5 pb-6 pt-1 text-base leading-relaxed text-ink-muted md:px-7">
                {faq.a}
              </p>
            </details>
          ))}
        </Reveal>
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------------
   Final CTA. Centred, the one centred block on the page, with a short
   form that validates on the client before it would be submitted.
   ------------------------------------------------------------------ */

type FormState = 'idle' | 'submitting' | 'done'

export function FinalCta() {
  const [email, setEmail] = useState('')
  const [requirement, setRequirement] = useState('')
  const [errors, setErrors] = useState<{ email?: string; requirement?: string }>({})
  const [state, setState] = useState<FormState>('idle')

  const validate = () => {
    const next: typeof errors = {}
    if (email.trim() === '') {
      next.email = 'Enter a work email so we can reply.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      next.email = 'That email address is not complete. Check it and try again.'
    }
    if (requirement.trim().length < 12) {
      next.requirement =
        'A sentence or two about the process is enough to start.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!validate()) return
    setState('submitting')
    /* Recorded as a lead for the Marketing and Super Admin dashboards.
       The prototype stores it in this browser; nothing is emailed yet. */
    submitEnquiry({ email, message: requirement, page: window.location.pathname })
    window.setTimeout(() => setState('done'), 600)
  }

  return (
    <section
      id="quote"
      className="surface-band relative isolate overflow-hidden py-24 md:py-32"
    >
      <div aria-hidden="true" className="hazard-rule absolute inset-x-0 top-0 h-1.5" />
      <div aria-hidden="true" className="blueprint-grid grid-drift absolute inset-0 -z-10" />

      <Container>
        <Reveal className="mx-auto max-w-[720px] text-center">
          <span className="font-mono text-xs font-medium tracking-wide text-band-ink-muted">
            Engineering requirement
          </span>
          <h2 className="display mt-4 text-4xl leading-[1.05] font-bold text-band-ink md:text-5xl lg:text-6xl">
            Describe the process. We will tell you what it takes.
          </h2>
          <p className="mx-auto mt-5 max-w-[56ch] text-lg text-band-ink-muted">
            One engineer reads every requirement that comes in. You get a scoped
            answer with a transparent bill of materials, not a sales brochure.
          </p>
        </Reveal>

        <Reveal delay={80} className="mx-auto mt-10 max-w-[620px]">
          {state === 'done' ? (
            <div
              role="status"
              className="rounded-lg border border-process-green/60 bg-band-raised p-8 text-left"
            >
              <div className="flex items-center gap-2">
                <span aria-hidden="true" className="size-2 rounded-full bg-process-green" />
                <p className="font-mono text-xs font-semibold text-process-ink">
                  REQUIREMENT STUDY RECEIVED
                </p>
              </div>
              <h3 className="mt-3 text-2xl font-semibold text-band-ink">
                Thank you for your requirement.
              </h3>
              <p className="mt-2 text-base leading-relaxed text-band-ink-muted">
                An engineer will review your process and reply to{' '}
                <span className="font-mono font-medium text-signal-ink">{email}</span> with the
                next questions and a first scope.
              </p>
              <button
                type="button"
                onClick={() => {
                  setState('idle')
                  setEmail('')
                  setRequirement('')
                }}
                className="mt-6 min-h-11 rounded-sm border border-band-ink/35 px-4 py-2 text-sm font-semibold text-band-ink transition-[border-color,background-color] duration-150 hoverable:hover:bg-band-ink/10 active:scale-[0.97]"
              >
                Submit another process requirement
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-lg border border-band-rule bg-band-raised p-6 text-left md:p-8">
              <div>
                <label
                  htmlFor="cta-email"
                  className="block text-sm font-semibold text-band-ink"
                >
                  Work email address
                </label>
                <input
                  id="cta-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'cta-email-error' : undefined}
                  onChange={(event) => setEmail(event.target.value)}
                  className={`mt-2 w-full rounded-sm border bg-band px-4 py-3 text-base text-band-ink transition-[border-color] duration-150 placeholder:text-band-ink-faint focus:outline-none ${
                    errors.email
                      ? 'border-signal-orange ring-2 ring-signal-orange/20'
                      : 'border-band-rule hoverable:hover:border-band-ink/35 focus:border-signal-orange focus:ring-2 focus:ring-signal-orange/20'
                  }`}
                  placeholder="name@company.in"
                />
                {errors.email && (
                  <p
                    id="cta-email-error"
                    role="alert"
                    className="mt-2 text-sm font-medium text-signal-ink"
                  >
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="cta-requirement"
                  className="block text-sm font-semibold text-band-ink"
                >
                  What do you need to measure, control or monitor?
                </label>
                <textarea
                  id="cta-requirement"
                  rows={4}
                  value={requirement}
                  aria-invalid={Boolean(errors.requirement)}
                  aria-describedby={
                    errors.requirement ? 'cta-requirement-error' : undefined
                  }
                  onChange={(event) => setRequirement(event.target.value)}
                  className={`mt-2 w-full rounded-sm border bg-band px-4 py-3 text-base text-band-ink transition-[border-color] duration-150 placeholder:text-band-ink-faint focus:outline-none ${
                    errors.requirement
                      ? 'border-signal-orange ring-2 ring-signal-orange/20'
                      : 'border-band-rule hoverable:hover:border-band-ink/35 focus:border-signal-orange focus:ring-2 focus:ring-signal-orange/20'
                  }`}
                  placeholder="e.g. Effluent treatment plant, ~20 m³/h. We want pH dosing controlled automatically, pump trip alarms forwarded to WhatsApp, and a compliance export report."
                />
                {errors.requirement && (
                  <p
                    id="cta-requirement-error"
                    role="alert"
                    className="mt-2 text-sm font-medium text-signal-ink"
                  >
                    {errors.requirement}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="submit"
                  disabled={state === 'submitting'}
                  className="inline-flex min-h-12 items-center gap-2 rounded-sm bg-signal-orange px-5 py-3 text-base font-semibold text-on-signal transition-[background-color,transform] duration-150 hoverable:hover:bg-signal-orange-hover active:scale-[0.97] disabled:cursor-wait disabled:opacity-70"
                >
                  {state === 'submitting' && (
                    <span
                      aria-hidden="true"
                      className="size-3.5 animate-spin rounded-full border-2 border-on-signal/30 border-t-on-signal"
                    />
                  )}
                  {state === 'submitting' ? 'Sending…' : 'Send requirement'}
                </button>
                <SmartLink
                  href={secondaryCta.href}
                  className="inline-flex min-h-12 items-center rounded-sm border border-band-ink/35 px-5 py-3 text-base font-semibold text-band-ink transition-[border-color,background-color] duration-150 hoverable:hover:bg-band-ink/10 active:scale-[0.97]"
                >
                  {secondaryCta.label}
                </SmartLink>
              </div>

              <p className="pt-2 text-xs text-band-ink-faint">
                We reply to the requirement itself. No subscription, and your
                details are not passed to anyone outside the engineering team.
              </p>
            </form>
          )}
        </Reveal>
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------------
   Footer sitemap, rendered from the same navigation config.
   ------------------------------------------------------------------ */

export function SiteFooter() {
  return (
    <footer className="surface-band relative isolate overflow-hidden border-t border-band-rule pt-16 pb-28 lg:pb-16">
      <div aria-hidden="true" className="blueprint-grid absolute inset-0 -z-10" />
      <Container>
        <nav aria-label="Footer">
          <div className="grid gap-8 md:grid-cols-3 lg:grid-cols-4">
            {navigation
              .filter((section) => section.groups)
              .map((section) => (
                <div key={section.id}>
                  <h2 className="font-mono text-xs font-medium tracking-wide text-signal-ink">
                    {section.label.toUpperCase()}
                  </h2>
                  <ul className="mt-3 space-y-2" role="list">
                    {section.groups?.flatMap((group) =>
                      group.items.slice(0, 6).map((item) => (
                        <li key={`${section.id}-${item.label}`}>
                          <SmartLink
                            href={item.href}
                            className="text-sm text-band-ink-muted transition-[color] duration-150 ease-(--ease-out) hoverable:hover:text-band-ink"
                          >
                            {item.label}
                          </SmartLink>
                        </li>
                      )),
                    )}
                  </ul>
                </div>
              ))}
          </div>
        </nav>

        <div aria-hidden="true" className="rail-divider-band my-10 h-px w-full" />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-band-ink-faint">
            RuralReact. Industrial automation, configured for your process.
          </p>
          <ul className="flex flex-wrap gap-6" role="list">
            <li>
              <SmartLink
                href="/login"
                className="text-sm text-band-ink-muted transition-[color] duration-150 ease-(--ease-out) hoverable:hover:text-band-ink"
              >
                Customer & team sign-in
              </SmartLink>
            </li>
            <li>
              <SmartLink
                href="#about"
                className="text-sm text-band-ink-muted transition-[color] duration-150 ease-(--ease-out) hoverable:hover:text-band-ink"
              >
                Privacy policy
              </SmartLink>
            </li>
            <li>
              <SmartLink
                href="#about"
                className="text-sm text-band-ink-muted transition-[color] duration-150 ease-(--ease-out) hoverable:hover:text-band-ink"
              >
                Terms of use
              </SmartLink>
            </li>
            <li>
              <SmartLink
                href="#top"
                className="text-sm text-band-ink-muted transition-[color] duration-150 ease-(--ease-out) hoverable:hover:text-band-ink"
              >
                Back to top
              </SmartLink>
            </li>
          </ul>
        </div>
      </Container>

      {/* The wordmark, sized to the viewport and cropped by the footer
          edge. Decorative, so it is hidden from assistive tech. `truncate`
          would ellipsise it, hence the explicit nowrap. */}
      <p
        aria-hidden="true"
        className="display mt-12 w-full px-4 text-[15.5vw] leading-[0.78] font-bold whitespace-nowrap text-band-ink/8 select-none md:px-8"
      >
        RuralReact
      </p>
    </footer>
  )
}
