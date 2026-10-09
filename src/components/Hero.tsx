import { Link } from 'react-router-dom'
import type { CSSProperties } from 'react'
import { Container, PrimaryLink, SplitWords } from './primitives'
import { useInView } from '../lib/motion'
import { SignalPath } from './SignalPath'

/** What RuralReact engineers, stated as scope rather than as numbers. */
const scope = [
  { tag: 'FIELD', label: 'Sensors & instrumentation' },
  { tag: 'CONTROL', label: 'PLC, HMI & control panels' },
  { tag: 'EDGE', label: 'IIoT gateway & custom PCB' },
  { tag: 'CLOUD', label: 'Monitoring, analytics & AMC' },
]

const delay = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties

export function Hero() {
  const [ref, shown] = useInView<HTMLDivElement>('0px')
  return (
    <section
      id="top"
      className="surface-band relative isolate overflow-hidden pt-28 pb-14 md:pt-36 md:pb-20"
    >
      {/* Base layer: the plant photograph, darkened with panel navy so
          the headline and the diagram stay above AA contrast. */}
      <img
        src="/hero-plant.png"
        alt=""
        fetchPriority="high"
        decoding="async"
        width={1663}
        height={947}
        className="hero-photo absolute inset-0 -z-20 size-full object-cover"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-band/55" />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-r from-band via-band/80 to-band/25"
      />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-linear-to-t from-band to-transparent" />

      <Container className="relative">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
          <div ref={ref} data-shown={shown || undefined}>
            <p style={delay(0)} className="hero-in inline-flex items-center gap-2 border-l-2 border-signal-orange pl-2.5 font-mono text-xs font-medium tracking-wide text-band-ink-muted">
              Sensor to cloud, engineered as one system
            </p>

            <h1 className="display mt-5 max-w-[16ch] text-[2.75rem] leading-[1.02] font-bold text-band-ink sm:text-6xl lg:text-[4.25rem]">
              <SplitWords text="Industrial automation configured for your process" delay={120} />
            </h1>

            <p style={delay(520)} className="hero-in mt-6 max-w-[56ch] text-lg leading-relaxed text-band-ink-muted">
              Tell us what you want to measure, control, automate or monitor.
              RuralReact helps convert your requirement into a configurable
              industrial automation solution.
            </p>

            <div style={delay(680)} className="hero-in mt-8 flex flex-wrap items-center gap-3">
              <PrimaryLink href="#configurator">Configure my solution</PrimaryLink>
              <Link
                to="/consult"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-band-ink/35 px-5 py-2.5 text-base font-semibold text-band-ink transition-[background-color,border-color,transform] duration-150 ease-(--ease-out) hoverable:hover:border-band-ink hoverable:hover:bg-band-ink/10 active:scale-[0.97]"
              >
                Talk to an engineer
              </Link>
            </div>
          </div>

          {/* The one memorable moment: a P&ID style loop, process to cloud. */}
          <div style={delay(300)} className="hero-in rounded-lg border border-band-rule bg-band/85 shadow-(--shadow-e3)">
            <div className="flex items-center justify-between gap-3 border-b border-band-rule px-5 py-3">
              <span className="font-mono text-xs font-medium tracking-wide text-band-ink">
                LOOP-01 · PROCESS TO CLOUD
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-sm border border-signal-orange/40 px-2 py-0.5 font-mono text-[11px] font-medium text-signal-ink">
                DEMO VALUES
              </span>
            </div>
            <div className="p-4 md:p-6">
              <SignalPath />
            </div>
          </div>
        </div>

        {/* Scope strip: terminal-block rows, one per layer we deliver. */}
        <ul
          role="list"
          className="mt-14 grid grid-cols-2 border-t border-band-rule md:grid-cols-4"
        >
          {scope.map((item, i) => (
            <li
              key={item.tag}
              style={delay(820 + i * 90)}
              className={`hero-in py-5 pr-4 ${i > 0 ? 'md:border-l md:border-band-rule md:pl-5' : ''} ${
                i % 2 === 1 ? 'border-l border-band-rule pl-4 md:pl-5' : ''
              } ${i > 1 ? 'border-t border-band-rule md:border-t-0' : ''}`}
            >
              <span className="font-mono text-[11px] font-medium tracking-wider text-signal-ink">
                {item.tag}
              </span>
              <span className="mt-1 block text-sm font-medium text-band-ink">{item.label}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
