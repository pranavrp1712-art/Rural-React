import { useState } from 'react'
import { platformLayers } from '../data/content'
import { Container, Reveal, SectionHeading, Stagger } from './primitives'

/**
 * The platform drawn as a controller backplane. Ten module cards sit
 * seated in a rail; selecting one ejects it the way an I/O card is
 * actually pulled from a rack. Hover eases it partly out, selection
 * commits the travel.
 *
 * The depth here is one axis of translation, not a rotated scene, so
 * the card faces stay square to the reader and every label stays
 * legible at any zoom.
 */
export function PlatformLayers() {
  const [selected, setSelected] = useState(platformLayers[0].n)
  const layer = platformLayers.find((l) => l.n === selected) ?? platformLayers[0]

  return (
    <section
      id="platform"
      className="relative isolate overflow-hidden border-t border-rule bg-card/70 py-20 md:py-24"
    >
      <div aria-hidden="true" className="sheet-grid absolute inset-0 -z-10" />

      <Container>
        <Reveal>
          <SectionHeading
            label="THE PLATFORM"
            title="Ten layers, from the probe in the tank to the service contract"
            intro="Take the whole stack or the layers you are missing. Each one is specified and delivered on its own, so an existing plant does not have to be replaced to be automated."
          />
        </Reveal>

        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
          {/* ---------------- The rack ---------------- */}
          <Reveal className="relative">
            {/* The rail cards seat into, with slot marks and a bus edge. */}
            <div
              aria-hidden="true"
              className="absolute inset-y-0 left-0 hidden w-10 rounded-l-md border border-r-0 border-rule bg-page lg:block"
            >
              <div className="backplane absolute inset-y-3 left-4 w-px" />
              <div className="absolute inset-y-0 right-0 w-px bg-rule" />
              <span className="absolute top-3 left-1.5 font-mono text-xs leading-none text-ink-faint [writing-mode:vertical-rl]">
                BACKPLANE
              </span>
            </div>

            <Stagger as="ol" variant="rack" step={45} className="relative lg:pl-10" role="list">
              {platformLayers.map((item, index) => {
                const active = item.n === layer.n
                return (
                  <li key={item.n} className="lg:-mt-px">
                    <button
                      type="button"
                      aria-expanded={active}
                      aria-controls="layer-detail"
                      onClick={() => setSelected(item.n)}
                      onMouseEnter={() => setSelected(item.n)}
                      onFocus={() => setSelected(item.n)}
                      style={{ zIndex: active ? 20 : 10 - index }}
                      className={`group relative flex w-full items-stretch gap-3 border text-left transition-[border-color,background-color,color,box-shadow,transform] duration-300 ease-(--ease-rise) cursor-pointer ${
                        active
                          ? 'bg-hover shadow-(--shadow-e3) border-signal-orange/60 lg:translate-x-6 ring-2 ring-signal-orange/25'
                          : 'border-rule bg-card/60 hoverable:hover:bg-hover hoverable:hover:shadow-(--shadow-e1)'
                      }`}
                    >
                      {/* Card edge: the part still visible when seated. */}
                      <span
                        aria-hidden="true"
                        className={`w-1.5 shrink-0 transition-colors duration-200 ease-(--ease-out) ${
                          active ? 'bg-signal-orange' : 'bg-rule-strong'
                        }`}
                      />

                      <span className="flex flex-1 items-center gap-3 py-3 pr-4">
                        {/* Silkscreened slot number */}
                        <span
                          className={`font-mono text-xs font-bold transition-colors duration-200 ease-(--ease-out) ${
                            active ? 'text-signal-ink' : 'text-ink-faint'
                          }`}
                        >
                          {String(item.n).padStart(2, '0')}
                        </span>

                        <span className="flex-1">
                          <span
                            className={`block text-sm font-bold transition-colors duration-200 ease-(--ease-out) ${
                              active ? 'text-ink' : 'text-ink-muted group-hover:text-ink'
                            }`}
                          >
                            {item.name}
                          </span>
                          <span
                            className={`block overflow-hidden text-xs text-ink-faint transition-[border-color,background-color,color,box-shadow] duration-200 ease-(--ease-out) ${
                              active ? 'max-h-8 opacity-100 mt-0.5' : 'max-h-0 opacity-0'
                            }`}
                          >
                            {item.summary}
                          </span>
                        </span>

                        {/* Seat status LED with glow */}
                        <span className="relative flex size-2 items-center justify-center">
                          {active && (
                            <span className="radar-ping absolute size-full rounded-full bg-process-green/60" />
                          )}
                          <span
                            aria-hidden="true"
                            className={`size-1.5 shrink-0 rounded-full transition-colors duration-200 ease-(--ease-out) ${
                              active
                                ? 'bg-process-green'
                                : 'bg-rule-strong'
                            }`}
                          />
                        </span>
                      </span>
                    </button>

                    {/* Mobile keeps the inline accordion: no rack, no travel. */}
                    <div
                      hidden={!active}
                      className="border border-t-0 border-rule bg-hover px-4 pb-4 text-sm text-ink-muted lg:hidden shadow-sm"
                    >
                      <p className="pt-3 leading-relaxed">{item.detail}</p>
                      <ul className="mt-3 space-y-2">
                        {item.points.map((point) => (
                          <li key={point} className="flex gap-2">
                            <span
                              aria-hidden="true"
                              className="mt-1.5 size-1.5 shrink-0 rounded-full bg-process-green"
                            />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                )
              })}
            </Stagger>
          </Reveal>

          {/* ---------------- The pulled card ---------------- */}
          <Reveal delay={80} id="layer-detail" className="hidden self-start lg:block">
            <div key={layer.n} className="route-enter relative isolate overflow-hidden rounded-xl border border-rule bg-card p-8 shadow-(--shadow-e2)">
              <div aria-hidden="true" className="sheet-grid absolute inset-0 -z-10 opacity-70" />
              <div className="absolute top-0 left-0 h-1.5 w-full bg-signal-orange" />

              <div className="flex items-center justify-between">
                <span className="rounded-sm bg-signal-orange/10 px-2 py-0.5 font-mono text-xs font-semibold text-signal-ink">
                  LAYER {String(layer.n).padStart(2, '0')} OF 10
                </span>
                <span className="font-mono text-xs text-ink-faint">
                  STATUS: READY SPECIFICATION
                </span>
              </div>

              <h3 className="display mt-4 text-3xl font-bold tracking-tight text-ink">
                {layer.name}
              </h3>
              <p className="mt-2 text-lg text-ink-faint">{layer.summary}</p>

              <div aria-hidden="true" className="rail-divider my-6 h-px w-full" />

              <p className="max-w-[560px] text-base leading-relaxed text-ink-muted">{layer.detail}</p>

              <ul className="mt-6 space-y-3">
                {layer.points.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm text-ink-muted">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-process-green"
                    />
                    <span className="leading-snug">{point}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 pt-6 border-t border-rule/60 flex items-center justify-between">
                <a
                  href="#quote"
                  className="inline-flex items-center gap-2 rounded-sm border border-signal-orange/50 bg-signal-orange/10 px-4 py-2 text-sm font-semibold text-signal-ink transition-[border-color,background-color,color,box-shadow] duration-150 hover:border-signal-orange hover:bg-signal-orange hover:text-on-signal hover:gap-3"
                >
                  <span>Inquire about this layer</span>
                  <span aria-hidden="true">&rarr;</span>
                </a>
                <span className="font-mono text-xs text-ink-faint">
                  Single-layer or turn-key deployment
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
