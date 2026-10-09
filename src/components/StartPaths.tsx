import { Link } from 'react-router-dom'
import { ArrowRight, Check } from '@phosphor-icons/react'
import { Container, SectionHeading, SectionLabel, SplitWords, Stagger } from './primitives'
import { useInView } from '../lib/motion'
import { brandChoice, entryPaths, notSure, positioning, serviceTiles } from '../data/startPaths'

/* ------------------------------------------------------------------
   md/main.md §3.4 — vendor-neutral positioning. Sits directly under
   the hero so it frames everything below it.
   ------------------------------------------------------------------ */

export function Positioning() {
  const [ref, shown] = useInView<HTMLDivElement>()
  return (
    <section id="solutions" aria-labelledby="positioning-title" className="border-t border-rule bg-card py-16 md:py-20">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16">
          <div ref={ref} data-shown={shown || undefined} className="heading-in">
            <SectionLabel>What RuralReact is</SectionLabel>
            <h2 id="positioning-title" className="display mt-3 text-4xl leading-[1.05] font-semibold text-ink md:text-5xl">
              <SplitWords text={positioning.statement} />
            </h2>
            <p className="mt-5 max-w-[60ch] text-lg text-ink-muted">{positioning.intro}</p>
            <p className="mt-4 max-w-[60ch] border-l-2 border-process-green pl-4 text-base font-medium text-ink">{positioning.brands}</p>
            <p className="mt-4 max-w-[60ch] text-base text-ink-muted">{positioning.scope}</p>
          </div>

          <div>
            {/* A terminal-block row: one labelled terminal per thing we do. */}
            <p className="text-sm font-semibold text-ink">RuralReact provides</p>
            <Stagger as="ul" step={40} className="mt-3 flex flex-wrap gap-1.5" role="list">
              {positioning.provides.map((item, i) => (
                <li
                  key={item}
                  className="group flex min-h-14 flex-col justify-between rounded-sm border border-rule bg-page/60 px-3 py-1.5 transition-[border-color,background-color] duration-150 hoverable:hover:border-signal-orange/60 hoverable:hover:bg-signal-orange/5"
                >
                  <span className="font-mono text-[10px] text-ink-faint group-hover:text-signal-ink">X{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-sm font-medium whitespace-nowrap text-ink">{item}</span>
                </li>
              ))}
            </Stagger>

            <dl className="mt-8 divide-y divide-rule border-y border-rule">
              {positioning.needs.map((n) => (
                <div key={n.need} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
                  <dt className="text-base text-ink-muted">{n.need}</dt>
                  <dd className="text-base font-semibold text-ink">{n.answer}</dd>
                </div>
              ))}
            </dl>
            <Link to="/consult" className="mt-5 inline-flex min-h-11 items-center gap-2 text-base font-semibold text-signal-ink hoverable:hover:underline">
              {positioning.consult}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------------
   §3.5 — three equal ways in. Not a sequence, so no numbers.
   ------------------------------------------------------------------ */

export function EntryPaths() {
  return (
    <section id="start" aria-labelledby="start-title" className="border-t border-rule bg-page py-16 md:py-20">
      <Container>
        <div className="max-w-[680px]">
          <SectionLabel>How to start</SectionLabel>
          <h2 id="start-title" className="display mt-3 text-4xl font-semibold text-ink md:text-5xl">
            I need automation. Where do I start?
          </h2>
          <p className="mt-4 text-lg text-ink-muted">Choose the way in that matches how much you already know.</p>
        </div>

        <Stagger as="ul" step={90} className="mt-10 grid gap-4 md:grid-cols-3" role="list">
          {entryPaths.map((p) => (
            <li key={p.id} className="flex">
              <div className="spotlight lift relative flex w-full flex-col rounded-sm border border-rule bg-card shadow-(--shadow-e1) hoverable:hover:border-signal-orange/50">
                <div className="border-b border-rule px-5 py-3">
                  <span className="font-mono text-xs font-semibold tracking-wide text-signal-ink">{p.tag}</span>
                </div>
                <div className="flex flex-1 flex-col px-5 py-5">
                  <h3 className="text-xl font-semibold text-ink">{p.title}</h3>
                  <p className="mt-2 text-base text-ink-muted">{p.body}</p>
                  <ul className="mt-5 space-y-1.5 text-sm text-ink" role="list" aria-label="Your equipment, your choice">
                    {brandChoice.map((b) => (
                      <li key={b} className="flex items-center gap-2">
                        <Check size={14} weight="bold" aria-hidden="true" className="shrink-0 text-process-ink" />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={p.href}
                    className={`mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-sm px-4 py-2.5 text-sm font-semibold transition-[background-color,border-color,transform] duration-150 ease-(--ease-out) active:scale-[0.97] ${
                      p.id === 'configure'
                        ? 'bg-signal-orange text-on-signal hoverable:hover:bg-signal-orange-hover'
                        : 'border border-rule-strong bg-card text-ink hoverable:hover:border-ink hoverable:hover:bg-hover'
                    }`}
                  >
                    {p.cta}
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </Stagger>
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------------
   §3.7 — services teaser. Rows, not cards: it is a list of scope.
   ------------------------------------------------------------------ */

export function ServicesTeaser() {
  return (
    <section id="services" aria-labelledby="services-title" className="border-t border-rule bg-card py-16 md:py-20">
      <Container>
        <SectionHeading
          label="Engineering services"
          title="More than a product catalogue"
          intro="Take one service or the whole project. Each is scoped to your process and to the equipment you already have."
        />
        <Stagger as="ul" step={60} className="mt-10 grid border-t border-rule md:grid-cols-2 md:gap-x-12" role="list">
          {serviceTiles.map((s, i) => (
            <li key={s.title} className="spotlight relative border-b border-rule px-3 py-5 -mx-3">
              <h3 id={`svc-${i}`} className="text-lg font-semibold text-ink">{s.title}</h3>
              <p className="mt-1.5 max-w-[56ch] text-base text-ink-muted">{s.body}</p>
              <Link
                to={s.href}
                aria-describedby={`svc-${i}`}
                className="mt-2 inline-flex min-h-10 items-center text-sm font-semibold text-signal-ink hoverable:hover:underline"
              >
                {s.link}
              </Link>
            </li>
          ))}
        </Stagger>
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------------
   §3.6 — "Not sure what you need?". Full band on the home page, a
   compact strip on industry, product and configurator pages.
   ------------------------------------------------------------------ */

export function NotSureBand({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <aside aria-labelledby="not-sure-compact" className="border-t border-rule bg-card py-10">
        <Container>
          <div className="flex flex-col gap-4 rounded-sm border border-rule border-l-4 border-l-signal-orange bg-page px-5 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 id="not-sure-compact" className="text-xl font-semibold text-ink">{notSure.title}</h2>
              <p className="mt-1 max-w-[70ch] text-base text-ink-muted">Tell our automation team about your process and we'll help define the system.</p>
            </div>
            <Link
              to={notSure.href}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-sm bg-signal-orange px-5 py-2.5 text-sm font-semibold text-on-signal transition-[background-color,transform] duration-150 hoverable:hover:bg-signal-orange-hover active:scale-[0.97]"
            >
              {notSure.cta}
            </Link>
          </div>
        </Container>
      </aside>
    )
  }
  return (
    <section aria-labelledby="not-sure-title" className="surface-band relative isolate overflow-hidden py-16 md:py-20">
      <div aria-hidden="true" className="blueprint-grid grid-drift absolute inset-0 -z-10 opacity-60" />
      <Container>
        <div className="grid items-end gap-8 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="max-w-[680px]">
            <SectionLabel surface="band">Consultation</SectionLabel>
            <h2 id="not-sure-title" className="display mt-3 text-4xl font-semibold text-band-ink md:text-5xl">{notSure.title}</h2>
            <p className="mt-4 text-lg text-band-ink-muted">{notSure.body}</p>
          </div>
          <Link
            to={notSure.href}
            className="btn-sheen group inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-signal-orange px-6 py-3 text-base font-semibold text-on-signal transition-[background-color,transform] duration-150 hoverable:hover:bg-signal-orange-hover active:scale-[0.97]"
          >
            {notSure.cta}
            <ArrowRight size={18} weight="bold" aria-hidden="true" className="transition-transform duration-200 ease-(--ease-rise) group-hover:translate-x-1" />
          </Link>
        </div>
      </Container>
    </section>
  )
}
