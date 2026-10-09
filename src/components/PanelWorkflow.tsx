import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpenText,
  Calculator,
  ChatCircleText,
  CheckSquare,
  ClipboardText,
  Code,
  FileText,
  ShieldCheck,
  Truck,
  UsersThree,
  Wrench,
} from '@phosphor-icons/react'
import { panelWorkflow } from '../data/content'
import {
  Container,
  IconBadge,
  Reveal,
  SectionHeading,
} from './primitives'
import { toneCycle } from '../data/tones'
import { prefersReducedMotion } from '../lib/motion'

const workflowIcon = [
  ClipboardText,
  Calculator,
  FileText,
  Wrench,
  Code,
  CheckSquare,
  Truck,
  ShieldCheck,
]

/**
 * How far the reader has scrolled through the workflow, 0 to 1: the
 * rail fills behind the reading line at 60% of the viewport height.
 */
function useRailProgress() {
  const ref = useRef<HTMLOListElement>(null)
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    if (prefersReducedMotion()) {
      setProgress(1)
      return
    }
    let frame = 0
    const measure = () => {
      frame = 0
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const line = window.innerHeight * 0.6
      setProgress(Math.min(1, Math.max(0, (line - r.top) / r.height)))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])
  return [ref, progress] as const
}

export function PanelWorkflow() {
  const [railRef, progress] = useRailProgress()
  return (
    <section
      id="panels"
      className="border-t border-rule bg-card/70 py-20 md:py-24"
    >
      <Container>
        <Reveal>
          <SectionHeading
            label="PANEL ENGINEERING"
            title="How a control panel gets built here"
            intro="Eight stages with two fixed review points: you approve the drawings before fabrication, and you witness the factory acceptance test before dispatch."
          />
        </Reveal>

        {/* Engineering services in the navigation resolve to this sequence. */}
        <span id="workflow" aria-hidden="true" className="block" />

        <ol ref={railRef} className="relative mt-12 border-l-2 border-rule ml-3 md:ml-4" role="list">
          {/* The rail fills in orange as the reader moves down the stages. */}
          <span
            aria-hidden="true"
            className="absolute top-0 -left-0.5 h-full w-0.5 origin-top bg-signal-orange"
            style={{ transform: `scaleY(${progress})` }}
          />
          {panelWorkflow.map((step, index) => {
            const isSignOff = step.n === 3 || step.n === 6
            const reached = progress >= (index + 0.35) / panelWorkflow.length
            return (
              <Reveal
                key={step.n}
                as="li"
                delay={index * 50}
                className="relative pb-10 pl-6 last:pb-0 md:pl-8 group"
              >
                {/* Terminal block marker on the rail; sign-off is filled orange */}
                <div
                  aria-hidden="true"
                  className={`absolute top-2 -left-[9px] flex size-4 items-center justify-center rounded-full border-2 transition-[background-color,border-color,transform] duration-300 ease-(--ease-rise) ${
                    isSignOff
                      ? 'border-signal-orange bg-signal-orange'
                      : reached
                        ? 'scale-110 border-signal-orange bg-card'
                        : 'border-rule-strong bg-card'
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full transition-colors duration-300 ${
                      isSignOff ? 'bg-card' : reached ? 'bg-signal-orange' : 'bg-rule-strong'
                    }`}
                  />
                </div>

                <div className="flex items-start gap-4">
                  <IconBadge
                    icon={workflowIcon[index] ?? ClipboardText}
                    tone={toneCycle[index % toneCycle.length]}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-3">
                      <span className="font-mono text-xs font-bold text-signal-ink">
                        STAGE {String(step.n).padStart(2, '0')}
                      </span>
                      <h3 className="text-lg font-bold text-ink group-hover:text-signal-ink transition-colors">
                        {step.title}
                      </h3>
                      {isSignOff && (
                        <span className="rounded-sm bg-signal-orange/10 px-2.5 py-0.5 font-mono text-xs font-bold text-signal-ink border border-signal-orange/30 shadow-xs">
                          Customer Approval Gate
                        </span>
                      )}
                    </div>
                    <p className="mt-2 max-w-[680px] text-sm leading-relaxed text-ink-muted">
                      {step.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </ol>

        <div className="mt-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1)">
          <div>
            <span className="font-mono text-xs font-bold text-signal-ink uppercase">DETAILED ENGINEERING GUIDE</span>
            <h4 className="mt-1 text-base font-bold text-ink">Explore our complete Control Panels engineering hub</h4>
            <p className="mt-1 text-xs text-ink-muted">
              Inspect enclosure fabrication specs, IEC 61439 standards, CAD GA drawings, and FAT protocols.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              to="/control-panels"
              className="inline-flex min-h-10 items-center justify-center rounded-sm bg-signal-orange px-4 text-xs font-semibold text-on-signal hoverable:hover:bg-signal-orange-hover"
            >
              Open Control Panels Hub →
            </Link>
            <Link
              to="/configurators?tab=panel"
              className="inline-flex min-h-10 items-center justify-center rounded-sm border border-rule bg-sunk px-3.5 text-xs font-semibold text-ink hoverable:hover:bg-hover"
            >
              Launch Panel Sizer
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}

const standardsCards = [
  {
    icon: ShieldCheck,
    title: 'The controller stays off the internet',
    body: 'The PLC is never given a public address. The gateway is the only component with an outward connection, and that connection is outbound only.',
  },
  {
    icon: FileText,
    title: 'Drawings before metal',
    body: 'Schematics and the general arrangement are issued for your approval before fabrication starts, so a change costs a revision rather than a rebuild.',
  },
  {
    icon: CheckSquare,
    title: 'Tested before it ships',
    body: 'Point to point checks and a factory acceptance test are completed at our works, with you present, before the panel leaves for site.',
  },
]

export function Standards() {
  return (
    <section
      id="standards"
      className="relative isolate overflow-hidden border-t border-rule bg-page/70 py-20 md:py-24"
    >
      <div aria-hidden="true" className="sheet-grid absolute inset-0 -z-10" />

      <Container>
        <Reveal>
          <SectionHeading
            surface="light"
            label="STANDARDS & OT SECURITY"
            title="Designed with reference to the applicable standards"
            intro="Which standards apply depends on the industry, the site and your own specification. They are confirmed during the requirement study rather than claimed in advance."
          />
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {standardsCards.map((item, index) => (
            <Reveal
              key={item.title}
              delay={index * 60}
              variant="scale"
              className="group relative overflow-hidden rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1) transition-[border-color,background-color,box-shadow] duration-200 ease-(--ease-out) hover:border-signal-orange/40 hover:shadow-(--shadow-e2)"
            >
              <IconBadge icon={item.icon} tone={toneCycle[index % toneCycle.length]} size="md" />
              <h3 className="mt-4 text-lg font-bold text-ink group-hover:text-signal-ink transition-colors">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.body}</p>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}

export function About() {
  return (
    <section id="about" className="border-t border-rule bg-card/70 py-20 md:py-24">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Reveal>
            <SectionHeading
              label="ABOUT RURALREACT"
              title="An engineering company, describing only what it has built"
              intro="RuralReact designs and delivers industrial automation for Indian plants, from instrumentation and custom electronics through to control panels, IIoT and maintenance."
            />
            <p className="mt-6 max-w-[680px] text-base leading-relaxed text-ink-muted">
              We publish what the company material supports and nothing beyond
              it. Where a figure, a certification or a case study has not been
              verified, this site says so instead of filling the gap.
            </p>
          </Reveal>

          <Reveal delay={80}>
            <dl className="overflow-hidden rounded-xl border border-rule bg-page shadow-(--shadow-e1)">
              {[
                {
                  icon: UsersThree,
                  term: 'Founder and team',
                  detail: 'Details available on request.',
                },
                {
                  icon: ShieldCheck,
                  term: 'Validation and patent information',
                  detail: 'To be verified against company records.',
                },
                {
                  icon: BookOpenText,
                  term: 'Case studies',
                  detail: 'Case study details available on request.',
                },
                {
                  icon: ChatCircleText,
                  term: 'Customer references',
                  detail: 'Shared directly during engineering discussions.',
                },
              ].map((row, index) => (
                <div
                  key={row.term}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-6 py-4.5 last:border-b-0 transition-colors hover:bg-card"
                >
                  <span className="flex items-center gap-3">
                    <IconBadge icon={row.icon} tone={toneCycle[index % toneCycle.length]} size="sm" />
                    <dt className="text-sm font-bold text-ink">{row.term}</dt>
                  </span>
                  <dd className="font-mono text-xs font-medium text-ink-faint">
                    {row.detail}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
