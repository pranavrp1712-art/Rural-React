import { useEffect, useState } from 'react'
import { architecture } from '../data/content'
import { Container, Reveal, SectionHeading } from './primitives'
import { prefersReducedMotion, useInView } from '../lib/motion'

export function Architecture() {
  const [selected, setSelected] = useState(architecture[0].id)
  const node = architecture.find((n) => n.id === selected) ?? architecture[0]
  // When the chain scrolls into view a packet runs along the wire and
  // latches each stage's LED as it passes, once.
  const [chainRef, inView] = useInView<HTMLOListElement>('0px 0px -20% 0px')
  const [lit, setLit] = useState(-1)
  useEffect(() => {
    if (!inView) return
    if (prefersReducedMotion()) {
      setLit(architecture.length)
      return
    }
    let i = -1
    const t = window.setInterval(() => {
      i += 1
      setLit(i)
      if (i >= architecture.length) window.clearInterval(t)
    }, 160)
    return () => window.clearInterval(t)
  }, [inView])

  return (
    <section id="architecture" className="relative isolate overflow-hidden border-t border-rule bg-card py-20 md:py-28">
      <div aria-hidden="true" className="sheet-grid absolute inset-0 -z-10 opacity-70" />

      <Container>
        <Reveal>
          <SectionHeading
            label="SYSTEM ARCHITECTURE"
            title="Every automation job runs through the same chain"
            intro="Nine stages sit between a physical process and a number you can act on. Select any one to see what it does and where it sits in a RuralReact system."
          />
        </Reveal>

        <Reveal delay={80} className="mt-12">
          {/* The chain: one row of nine on desktop, joined by the signal
              wire; a 3 by 3 grid on phones, read left to right. */}
          <ol ref={chainRef} className="relative grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9" role="list">
            <span
              aria-hidden="true"
              className="absolute inset-x-6 top-1/2 hidden h-0.5 -translate-y-1/2 bg-rule-strong lg:block"
            >
              <span
                className="absolute inset-y-0 left-0 bg-signal-orange/60 transition-[width] duration-150 ease-linear"
                style={{ width: `${Math.min(100, Math.max(0, (lit / (architecture.length - 1)) * 100))}%` }}
              />
              {inView && lit < architecture.length && <span className="packet motion-reduce:hidden" />}
            </span>
            {architecture.map((item, index) => {
              const active = item.id === node.id
              const passed = index <= lit
              return (
                <li key={item.id} className="relative">
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelected(item.id)}
                    className={`spotlight lift group relative flex h-full min-h-16 w-full flex-col justify-center rounded-md border px-3 py-2.5 text-left active:scale-[0.97] ${
                      active
                        ? 'border-signal-orange bg-card shadow-(--shadow-e2) ring-2 ring-signal-orange/20'
                        : 'border-rule bg-card hoverable:hover:border-rule-strong'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 font-mono text-[11px] text-ink-faint">
                      <span
                        aria-hidden="true"
                        className={`size-2 shrink-0 rounded-full transition-[background-color,box-shadow] duration-300 ${
                          active
                            ? 'bg-process-green'
                            : passed
                              ? 'bg-process-green/70 shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-process-green)_20%,transparent)]'
                              : 'bg-rule-strong'
                        }`}
                      />
                      {item.tag}
                    </span>
                    <span
                      className={`mt-0.5 block text-sm leading-tight font-semibold ${
                        active ? 'text-ink' : 'text-ink-muted hoverable:group-hover:text-ink'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>

          {/* Detail console for the selected node */}
          <div key={node.id} className="route-enter relative mt-6 overflow-hidden rounded-lg border border-rule border-l-4 border-l-signal-orange bg-card p-6 shadow-(--shadow-e1) md:p-8" aria-live="polite">
            <div className="absolute top-0 left-0 h-1 w-full bg-signal-orange" />

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="rounded-sm bg-signal-orange/10 px-2 py-0.5 font-mono text-xs font-semibold text-signal-ink">
                  {node.tag}
                </span>
                <h3 className="text-2xl font-bold tracking-tight text-ink">
                  {node.label}
                </h3>
              </div>
              <span className="font-mono text-xs font-medium text-ink-faint">
                STAGE {String(architecture.findIndex((n) => n.id === node.id) + 1).padStart(2, '0')} OF {architecture.length}
              </span>
            </div>

            <p className="mt-4 max-w-[720px] text-base leading-relaxed text-ink-muted">
              {node.body}
            </p>

            <div className="mt-6 flex items-center gap-4">
              <a
                href={node.href}
                className="inline-flex items-center gap-2 rounded-sm border border-signal-orange/50 bg-signal-orange/10 px-4 py-2 text-sm font-semibold text-signal-ink transition-[border-color,background-color,color,box-shadow] duration-150 hover:border-signal-orange hover:bg-signal-orange hover:text-on-signal hover:gap-3"
              >
                <span>{node.hrefLabel}</span>
                <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
