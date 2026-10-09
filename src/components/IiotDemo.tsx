import { useEffect, useState } from 'react'
import { demoTags, protocols, type DemoTag } from '../data/content'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { Container, Reveal, SectionHeading } from './primitives'

/** Deterministic wander so the demo reads like a process, not noise. */
/** Deterministic wander with optional mode multiplier */
function seriesFor(tag: DemoTag, tick: number, modeFactor: number = 1.0, length = 28): number[] {
  const out: number[] = []
  for (let i = 0; i < length; i += 1) {
    const t = (tick + i) * 0.35
    const wander =
      Math.sin(t * 0.7 + tag.base) * 0.6 + Math.sin(t * 0.23 + tag.spread) * 0.4
    out.push(tag.base + wander * tag.spread * modeFactor)
  }
  return out
}

function Sparkline({ points, id }: { points: number[]; id: string }) {
  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = max - min || 1
  const coords = points.map((value, index) => {
    const x = (index / (points.length - 1)) * 100
    const y = 28 - ((value - min) / span) * 22
    return { x, y }
  })

  const lineD = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(2)} ${c.y.toFixed(2)}`)
    .join(' ')

  const last = coords[coords.length - 1]
  const areaD = `${lineD} L100 30 L0 30 Z`

  return (
    <svg
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="h-10 w-full overflow-visible"
    >
      <defs>
        <linearGradient id={`spark-grad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-process-green)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--color-process-green)" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#spark-grad-${id})`} />
      <path d={lineD} fill="none" stroke="var(--color-process-green)" strokeWidth="2" strokeLinecap="round" />
      <circle cx={last.x} cy={last.y} r="2.5" fill="var(--color-process-ink)" />
    </svg>
  )
}

export function IiotDemo() {
  const reduced = useReducedMotion()
  const [tick, setTick] = useState(0)
  const [mode, setMode] = useState<'nominal' | 'peak' | 'dosing'>('nominal')

  const modeFactor = mode === 'peak' ? 1.6 : mode === 'dosing' ? 0.7 : 1.0

  useEffect(() => {
    if (reduced) return
    const id = window.setInterval(() => setTick((t) => t + 1), 1600)
    return () => window.clearInterval(id)
  }, [reduced])

  return (
    <section id="iiot" className="relative isolate overflow-hidden border-t border-rule bg-page/70 py-20 md:py-24">
      <div aria-hidden="true" className="sheet-grid absolute inset-0 -z-10" />

      <Container>
        <Reveal>
          <SectionHeading
            label="IIOT & EDGE CLOUD"
            title="Plant state, readable from anywhere it matters"
            intro="The gateway reads from the controller and publishes upward. Nothing reaches in the other direction, and the control logic keeps running whether or not the link is up."
          />
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          <Reveal className="surface-band relative isolate overflow-hidden rounded-lg border border-band-rule p-5 shadow-(--shadow-e3) md:p-7">
            <div aria-hidden="true" className="blueprint-grid absolute inset-0 -z-10" />
            
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold tracking-wider text-band-ink">
                  TELEMETRY DASHBOARD
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-sm border border-signal-orange/50 bg-signal-orange/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-signal-ink">
                  DEMO DATA
                </span>
              </div>

              {/* Mode switch */}
              <div className="flex items-center gap-1 rounded-md border border-band-rule bg-band-raised p-1">
                <button
                  type="button"
                  onClick={() => setMode('nominal')}
                  className={`min-h-9 rounded-sm px-3 py-1 font-mono text-xs transition-[background-color,color] duration-150 ${
                    mode === 'nominal' ? 'bg-signal-orange font-semibold text-on-signal' : 'text-band-ink-muted hoverable:hover:text-band-ink'
                  }`}
                >
                  Nominal
                </button>
                <button
                  type="button"
                  onClick={() => setMode('peak')}
                  className={`min-h-9 rounded-sm px-3 py-1 font-mono text-xs transition-[background-color,color] duration-150 ${
                    mode === 'peak' ? 'bg-signal-orange font-semibold text-on-signal' : 'text-band-ink-muted hoverable:hover:text-band-ink'
                  }`}
                >
                  High Load
                </button>
                <button
                  type="button"
                  onClick={() => setMode('dosing')}
                  className={`min-h-9 rounded-sm px-3 py-1 font-mono text-xs transition-[background-color,color] duration-150 ${
                    mode === 'dosing' ? 'bg-signal-orange font-semibold text-on-signal' : 'text-band-ink-muted hoverable:hover:text-band-ink'
                  }`}
                >
                  PID Dosing
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 overflow-hidden sm:grid-cols-2">
              {demoTags.map((tag) => {
                const series = seriesFor(tag, tick, modeFactor)
                const current = series[series.length - 1]
                return (
                  <div key={tag.tag} className="rounded-md border border-band-rule bg-band-raised p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-signal-ink">
                        {tag.tag}
                      </span>
                      <span className="flex items-center gap-1.5 font-mono text-[11px] text-process-ink">
                        <span aria-hidden="true" className="demo-led size-1.5 rounded-full bg-process-green" />
                        NORMAL
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-band-ink-muted">{tag.label}</p>
                    <p className="readout mt-2 flex items-baseline gap-1.5 font-mono text-3xl font-semibold text-band-ink">
                      {current.toFixed(tag.decimals)}
                      <span className="text-xs font-normal text-band-ink-faint">
                        {tag.unit}
                      </span>
                    </p>
                    <div className="mt-3 pt-2 border-t border-band-rule">
                      <Sparkline points={series} id={tag.tag} />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-band-ink-faint">
              <span>Streaming 1.6s interval • Outbound TLS</span>
              <span className="font-mono">PACKETS: {1420 + tick * 4} SENT</span>
            </div>
          </Reveal>

          <Reveal delay={80} className="space-y-6">
            <div className="rounded-xl border border-rule bg-card p-6 md:p-7 shadow-(--shadow-e1)">
              <h3 className="text-xl font-bold text-ink">
                Industrial protocols supported
              </h3>
              <p className="mt-1 text-sm text-ink-muted">
                Connect to existing PLCs, drives and SCADA without ripping out wiring:
              </p>
              <ul className="mt-4 flex flex-wrap gap-2" role="list">
                {protocols.map((protocol) => (
                  <li
                    key={protocol}
                    className="inline-flex items-center gap-1.5 rounded-md border border-rule bg-sunk/80 px-3 py-1.5 font-mono text-xs font-semibold text-ink shadow-xs"
                  >
                    <span className="size-1.5 rounded-full bg-signal-orange" />
                    {protocol}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-rule bg-card p-6 md:p-7 shadow-(--shadow-e1)">
              <h3 className="text-xl font-bold text-ink">
                Fail-safe offline architecture
              </h3>
              <ul className="mt-4 space-y-3.5 text-sm leading-relaxed text-ink-muted">
                <li className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 size-2 shrink-0 rounded-full bg-process-green"
                  />
                  <span>
                    <strong className="text-ink">Independent Control:</strong> Control logic and emergency interlocks run entirely inside the deterministic PLC.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 size-2 shrink-0 rounded-full bg-process-green"
                  />
                  <span>
                    <strong className="text-ink">Local Flash Buffering:</strong> The gateway buffers high-frequency process readings locally during network outages.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 size-2 shrink-0 rounded-full bg-process-green"
                  />
                  <span>
                    <strong className="text-ink">Zero Data Loss:</strong> Buffered trends backfill automatically once cellular or ethernet connectivity restores.
                  </span>
                </li>
              </ul>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
