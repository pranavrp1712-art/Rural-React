import { useMemo, useState } from 'react'
import {
  ChatCircleText,
  Cpu,
  Gauge,
  ListChecks,
  PaperPlaneTilt,
  PencilRuler,
} from '@phosphor-icons/react'
import { howItWorks } from '../data/content'
import {
  Container,
  IconBadge,
  PrimaryLink,
  Reveal,
  SecondaryLink,
  SectionHeading,
} from './primitives'
import { toneCycle } from '../data/tones'

const stepIcon = [ChatCircleText, Gauge, Cpu, PencilRuler, ListChecks, PaperPlaneTilt]

/* ------------------------------------------------------------------
   How it works: a genuine sequence, so the numbering carries meaning.
   ------------------------------------------------------------------ */

export function HowItWorks() {
  return (
    <section
      id="configurator"
      className="relative isolate overflow-hidden border-t border-rule bg-page/70 py-20 md:py-24"
    >
      <div aria-hidden="true" className="sheet-grid absolute inset-0 -z-10" />

      <Container>
        <Reveal>
          <SectionHeading
            label="HOW IT WORKS"
            title="From a sentence about your process to a quotation request"
            intro="Six steps, in order. You can stop after any of them and pick the configuration up again later."
          />
        </Reveal>

        <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {howItWorks.map((step, index) => (
            <Reveal
              key={step.n}
              as="li"
              delay={index * 60}
              variant="scale"
              className="group relative overflow-hidden rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1) transition-[border-color,background-color,box-shadow] duration-200 ease-(--ease-out) hover:border-signal-orange/40 hover:shadow-(--shadow-e2)"
            >
              <div className="flex items-center justify-between gap-3">
                <IconBadge
                  icon={stepIcon[index] ?? ChatCircleText}
                  tone={toneCycle[index % toneCycle.length]}
                />
                <span className="rounded-sm border border-signal-orange/25 bg-signal-orange/10 px-2 py-0.5 font-mono text-xs font-semibold text-signal-ink">
                  STEP {String(step.n).padStart(2, '0')}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-ink group-hover:text-signal-ink transition-colors">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.body}</p>
            </Reveal>
          ))}
        </ol>

        <Reveal delay={120} className="mt-10 flex flex-wrap items-center gap-4">
          <PrimaryLink href="/configure" className="shadow-[0_0_18px_rgba(242,106,29,0.3)]">
            Start the requirement wizard
          </PrimaryLink>
          <SecondaryLink href="/configurators">Open the I/O calculator</SecondaryLink>
        </Reveal>
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------------
   Mini I/O calculator. A small working widget that previews the full
   configurator: count the signals, size the controller.
   ------------------------------------------------------------------ */

interface SignalField {
  key: 'di' | 'do' | 'ai' | 'ao'
  label: string
  hint: string
  /** Channels per module used for the card estimate. */
  perModule: number
}

const fields: SignalField[] = [
  {
    key: 'di',
    label: 'Digital inputs',
    hint: 'Run feedback, level switches, push buttons',
    perModule: 16,
  },
  {
    key: 'do',
    label: 'Digital outputs',
    hint: 'Contactors, solenoid valves, indication',
    perModule: 16,
  },
  {
    key: 'ai',
    label: 'Analog inputs',
    hint: 'pH, flow, level, pressure, temperature',
    perModule: 8,
  },
  {
    key: 'ao',
    label: 'Analog outputs',
    hint: 'Dosing pump speed, drive reference, valve position',
    perModule: 4,
  },
]

type Counts = Record<SignalField['key'], string>

const emptyCounts: Counts = { di: '', do: '', ai: '', ao: '' }

const presets = [
  { name: 'Effluent (ETP)', counts: { di: '18', do: '12', ai: '8', ao: '4' } },
  { name: 'Dosing Skid', counts: { di: '8', do: '6', ai: '6', ao: '4' } },
  { name: 'Solar Dryer', counts: { di: '14', do: '8', ai: '12', ao: '2' } },
  { name: 'Packaging Line', counts: { di: '32', do: '24', ai: '4', ao: '2' } },
]

export function IoCalculator() {
  const [counts, setCounts] = useState<Counts>(emptyCounts)
  const [touched, setTouched] = useState<Partial<Record<string, boolean>>>({})

  const parsed = useMemo(() => {
    const out: Record<string, { value: number; error: string | null }> = {}
    fields.forEach((field) => {
      const raw = counts[field.key].trim()
      if (raw === '') {
        out[field.key] = { value: 0, error: null }
        return
      }
      const n = Number(raw)
      if (!Number.isInteger(n) || n < 0) {
        out[field.key] = {
          value: 0,
          error: 'Enter a whole number of signals, zero or more.',
        }
      } else if (n > 2000) {
        out[field.key] = {
          value: 0,
          error: 'Above 2000 signals this needs an engineering review.',
        }
      } else {
        out[field.key] = { value: n, error: null }
      }
    })
    return out
  }, [counts])

  const hasError = fields.some((f) => parsed[f.key].error)
  const total = fields.reduce((sum, f) => sum + parsed[f.key].value, 0)

  /** Spare capacity is planned in, not discovered during commissioning. */
  const SPARE = 0.2

  const result = useMemo(() => {
    if (total === 0 || hasError) return null

    const modules = fields.map((field) => {
      const withSpare = Math.ceil(parsed[field.key].value * (1 + SPARE))
      return {
        label: field.label,
        points: parsed[field.key].value,
        planned: withSpare,
        cards: withSpare === 0 ? 0 : Math.ceil(withSpare / field.perModule),
        perModule: field.perModule,
      }
    })

    const cardCount = modules.reduce((sum, m) => sum + m.cards, 0)
    const plannedPoints = modules.reduce((sum, m) => sum + m.planned, 0)

    const controller =
      plannedPoints <= 32
        ? 'Compact controller, fixed I/O'
        : plannedPoints <= 128
          ? 'Modular controller, single rack'
          : plannedPoints <= 512
            ? 'Modular controller with an expansion rack'
            : 'Distributed I/O with remote stations'

    return { modules, cardCount, plannedPoints, controller }
  }, [parsed, total, hasError])

  const stepValue = (key: SignalField['key'], delta: number) => {
    const current = parseInt(counts[key], 10) || 0
    const next = Math.max(0, current + delta)
    setCounts((prev) => ({ ...prev, [key]: String(next) }))
    setTouched((prev) => ({ ...prev, [key]: true }))
  }

  const applyPreset = (presetCounts: Counts) => {
    setCounts(presetCounts)
    setTouched({})
  }

  const reset = () => {
    setCounts(emptyCounts)
    setTouched({})
  }

  return (
    <section
      id="calculator"
      className="border-t border-rule bg-card/70 py-20 md:py-24"
    >
      <Container>
        <Reveal>
          <SectionHeading
            label="I/O CALCULATOR"
            title="Count the signals, size the controller"
            intro="A preview of the full configurator. Enter the signals you expect and it returns a planned point count with spare capacity, a card estimate and a controller class."
          />
        </Reveal>

        {/* Quick Industry Presets */}
        <Reveal delay={60} className="mt-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold text-ink-faint mr-2">
              QUICK PRESETS:
            </span>
            {presets.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => applyPreset(p.counts)}
                className="min-h-9 rounded-sm border border-rule bg-card px-3 py-1 font-mono text-xs font-medium text-ink transition-[border-color,background-color,color] hover:border-signal-orange hover:bg-hover hover:text-signal-ink active:scale-95 cursor-pointer shadow-xs"
              >
                {p.name}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <Reveal className="rounded-xl border border-rule bg-page p-6 md:p-8 shadow-(--shadow-e1)">
            <form
              onSubmit={(event) => event.preventDefault()}
              noValidate
              className="space-y-6"
            >
              {fields.map((field) => {
                const error = touched[field.key] ? parsed[field.key].error : null
                return (
                  <div key={field.key}>
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor={`io-${field.key}`}
                        className="block text-sm font-bold text-ink"
                      >
                        {field.label}
                      </label>
                      <span className="font-mono text-xs text-ink-faint">
                        {field.perModule} ch / card
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-faint">{field.hint}</p>

                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => stepValue(field.key, -1)}
                        aria-label={`Decrease ${field.label}`}
                        className="flex size-10 shrink-0 items-center justify-center rounded-md border border-rule bg-card font-mono text-lg font-bold text-ink hover:border-signal-orange hover:text-signal-ink active:scale-95 transition-[border-color,background-color,color] cursor-pointer shadow-xs"
                      >
                        -
                      </button>
                      <input
                        id={`io-${field.key}`}
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="0"
                        value={counts[field.key]}
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? `io-${field.key}-error` : undefined}
                        onChange={(event) =>
                          setCounts({ ...counts, [field.key]: event.target.value })
                        }
                        onBlur={() => setTouched({ ...touched, [field.key]: true })}
                        className={`w-full rounded-md border bg-card px-3 py-2 text-center font-mono text-lg font-bold text-ink transition-[border-color,background-color,color] placeholder:text-ink-faint shadow-xs ${
                          error
                            ? 'border-signal-orange ring-2 ring-signal-orange/20'
                            : 'border-rule hoverable:hover:border-ink-faint focus:border-signal-orange focus:ring-2 focus:ring-signal-orange/20'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => stepValue(field.key, 1)}
                        aria-label={`Increase ${field.label}`}
                        className="flex size-10 shrink-0 items-center justify-center rounded-md border border-rule bg-card font-mono text-lg font-bold text-ink hover:border-signal-orange hover:text-signal-ink active:scale-95 transition-[border-color,background-color,color] cursor-pointer shadow-xs"
                      >
                        +
                      </button>
                    </div>

                    {error && (
                      <p
                        id={`io-${field.key}-error`}
                        role="alert"
                        className="mt-2 text-xs font-semibold text-signal-ink"
                      >
                        {error}
                      </p>
                    )}
                  </div>
                )
              })}

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-md border border-rule bg-card px-4 py-2 text-sm font-semibold text-ink transition-[border-color,background-color,color] hover:border-ink-faint hover:bg-hover active:scale-[0.97] cursor-pointer shadow-xs"
                >
                  Clear all values
                </button>
              </div>
            </form>
          </Reveal>

          {/* Result panel */}
          <Reveal delay={80} className="rounded-xl border border-rule bg-page p-6 md:p-8 shadow-(--shadow-e1)">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-xs font-bold tracking-wide text-signal-ink">
                CALCULATED ESTIMATE
              </span>
              <span className="rounded-sm bg-process-green/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-process-ink border border-process-green/20">
                +20% spare capacity included
              </span>
            </div>
            <div aria-hidden="true" className="rail-divider my-4 h-px w-full" />

            <div aria-live="polite">
              {!result ? (
                <div className="py-6">
                  <div className="flex size-12 items-center justify-center rounded-full bg-signal-orange/10 text-signal-ink mb-4">
                    <span className="font-mono text-xl font-bold">0</span>
                  </div>
                  <p className="text-lg font-bold text-ink">
                    Nothing counted yet
                  </p>
                  <p className="mt-2 max-w-[520px] text-sm leading-relaxed text-ink-muted">
                    Pick one of the quick presets above or enter your sensor counts.
                    A standard effluent skid usually starts with 24 to 60 total I/O points.
                  </p>
                  <ul className="mt-6 space-y-2 rounded-lg border border-rule bg-card p-4 text-xs text-ink-muted">
                    {fields.map((field) => (
                      <li key={field.key} className="flex justify-between gap-4 py-1 border-b border-rule/60 last:border-b-0">
                        <span className="font-medium text-ink">{field.label}</span>
                        <span className="font-mono text-ink-faint">
                          {field.perModule} channels per module
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border border-rule bg-card p-4 shadow-xs">
                      <p className="readout font-mono text-4xl font-extrabold text-ink">
                        {result.plannedPoints}
                      </p>
                      <p className="text-xs font-semibold text-ink-muted mt-1">
                        Planned points (incl. spare)
                      </p>
                    </div>
                    <div className="rounded-lg border border-rule bg-card p-4 shadow-xs">
                      <p className="readout font-mono text-4xl font-extrabold text-signal-ink">
                        {result.cardCount}
                      </p>
                      <p className="text-xs font-semibold text-ink-muted mt-1">
                        I/O expansion cards
                      </p>
                    </div>
                  </div>

                  {/* Controller Chassis Hardware Simulation */}
                  <div className="surface-band mt-5 rounded-md border border-band-rule p-4 text-band-ink">
                    <div className="flex items-center justify-between pb-2 border-b border-band-rule">
                      <span className="font-mono text-[11px] font-semibold text-band-ink-muted">
                        RACK 01 / HARDWARE CARDS
                      </span>
                      <span className="font-mono text-[11px] text-process-ink flex items-center gap-1.5">
                        <span aria-hidden="true" className="size-1.5 rounded-full bg-process-green" />
                        EXPANDABLE
                      </span>
                    </div>

                    <div className="mt-3 flex items-stretch gap-1.5 overflow-x-auto pb-1">
                      {/* CPU Module */}
                      <div className="flex flex-col items-center justify-between w-14 shrink-0 rounded-sm bg-signal-orange p-2 text-center text-on-signal">
                        <span className="font-mono text-[10px] font-bold">CPU</span>
                        <span aria-hidden="true" className="my-1.5 size-2 rounded-full bg-on-signal" />
                        <span className="font-mono text-[9px] text-on-signal/80">MAIN</span>
                      </div>

                      {/* Dynamic Card Modules */}
                      {result.modules.map((m, mIdx) => (
                        Array.from({ length: m.cards }).map((_, cIdx) => (
                          <div
                            key={`${m.label}-${cIdx}`}
                            className="flex flex-col items-center justify-between rounded border border-band-rule bg-band-raised p-2 text-center text-band-ink w-12 shrink-0"
                          >
                            <span className="font-mono text-[10px] font-bold text-band-ink">
                              {mIdx === 0 ? 'DI' : mIdx === 1 ? 'DO' : mIdx === 2 ? 'AI' : 'AO'}
                            </span>
                            <span className={`size-1.5 rounded-full my-1.5 ${mIdx < 2 ? 'bg-process-green' : 'bg-process-cyan'}`} />
                            <span className="font-mono text-[9px] text-band-ink-faint">x{m.perModule}</span>
                          </div>
                        ))
                      ))}

                      {/* Empty Expansion Slot */}
                      <div className="flex flex-col items-center justify-center rounded border border-dashed border-band-rule bg-band-ink/5 p-2 text-center text-band-ink-faint w-11 shrink-0">
                        <span className="font-mono text-[9px]">SPARE</span>
                      </div>
                    </div>
                  </div>

                  <table className="mt-5 w-full text-left text-sm">
                    <thead>
                      <tr className="font-mono text-xs text-ink-faint border-b border-rule">
                        <th scope="col" className="pb-2 font-semibold">
                          Signal type
                        </th>
                        <th scope="col" className="pb-2 font-semibold text-center">
                          Input
                        </th>
                        <th scope="col" className="pb-2 font-semibold text-center">
                          +Spare
                        </th>
                        <th scope="col" className="pb-2 font-semibold text-right">
                          Cards
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-ink-muted divide-y divide-rule/60">
                      {result.modules.map((module) => (
                        <tr key={module.label}>
                          <td className="py-2 text-ink font-medium">{module.label}</td>
                          <td className="py-2 font-mono text-center">{module.points}</td>
                          <td className="py-2 font-mono text-center text-signal-ink font-semibold">{module.planned}</td>
                          <td className="py-2 font-mono text-right font-bold text-ink">{module.cards}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="mt-5 rounded-lg border border-rule bg-card p-4 shadow-xs">
                    <p className="font-mono text-xs font-bold text-process-ink">
                      RECOMMENDED CONTROLLER ARCHITECTURE
                    </p>
                    <p className="mt-1 text-base font-bold text-ink">
                      {result.controller}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                      Indicative sizing based on hardware capacity. Cycle times and networking topology are verified during detailed requirement study.
                    </p>
                  </div>

                  <PrimaryLink href="#quote" size="sm" className="mt-6 w-full text-center">
                    Carry this into a quotation request &rarr;
                  </PrimaryLink>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
