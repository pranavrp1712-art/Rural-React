import { useState } from 'react'
import {
  Drop,
  Factory,
  Flask,
  Mountains,
  Plant,
  PuzzlePiece,
  Recycle,
  SunHorizon,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react'
import { industries } from '../data/content'
import {
  Container,
  IconBadge,
  Reveal,
  Stagger,
  SectionHeading,
} from './primitives'
import { toneCycle } from '../data/tones'

const industryIcon: Record<string, PhosphorIcon> = {
  water: Drop,
  chemical: Flask,
  manufacturing: Factory,
  agri: Plant,
  waste: Recycle,
  solar: SunHorizon,
  mining: Mountains,
  custom: PuzzlePiece,
}

export function Industries() {
  const [open, setOpen] = useState(industries[0].id)

  return (
    <section
      id="industries"
      className="relative isolate overflow-hidden border-t border-rule bg-page/70 py-20 md:py-24"
    >
      <div aria-hidden="true" className="sheet-grid absolute inset-0 -z-10" />

      <Container>
        <Reveal>
          <SectionHeading
            label="INDUSTRIES"
            title="Where these systems are running"
            intro="The requirement study is the same everywhere. What changes is the process strip underneath it. Open a row to see the stages we instrument."
          />
        </Reveal>

        <Reveal delay={80} className="mt-12">
          <Stagger as="ul" step={50} className="overflow-hidden rounded-xl border border-rule bg-card shadow-(--shadow-e1)" role="list">
            {industries.map((industry, index) => {
              const active = industry.id === open
              const tone = toneCycle[index % toneCycle.length]
              return (
                <li
                  key={industry.id}
                  className={`spotlight relative border-b border-rule last:border-b-0 transition-colors duration-200 ${
                    active ? 'bg-sunk' : ''
                  }`}
                  onMouseEnter={() => setOpen(industry.id)}
                >
                  <button
                    type="button"
                    aria-expanded={active}
                    aria-controls={`strip-${industry.id}`}
                    onFocus={() => setOpen(industry.id)}
                    onClick={() => setOpen(industry.id)}
                    className={`flex w-full items-start gap-4 px-5 py-5 text-left transition-[border-color,background-color,color,box-shadow] duration-200 cursor-pointer md:px-7 ${
                      active ? 'bg-hover/60' : 'hoverable:hover:bg-hover/40'
                    }`}
                  >
                    <IconBadge icon={industryIcon[industry.id] ?? Factory} tone={tone} size="md" />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-xl font-bold tracking-tight text-ink flex items-center gap-2">
                          {industry.name}
                          {active && (
                            <span className="size-2 rounded-full bg-signal-orange" />
                          )}
                        </span>
                        <span className="rounded-sm bg-page px-2.5 py-0.5 font-mono text-xs font-semibold text-ink-muted border border-rule">
                          {industry.strip.length} process stages
                        </span>
                      </span>
                      <span className="mt-1.5 block max-w-[680px] text-sm leading-relaxed text-ink-muted">
                        {industry.line}
                      </span>
                    </span>
                  </button>

                  {/* Process strip, revealed for the open row only. */}
                  {active && (
                    <div
                      id={`strip-${industry.id}`}
                      className="bg-sunk/80 px-5 pb-5 pt-1 md:px-7 md:pl-20 transition-[border-color,background-color,box-shadow] duration-200 ease-(--ease-out)"
                    >
                      <p className="font-mono text-xs font-semibold text-ink-faint mb-2.5">
                        PROCESS INSTRUMENTATION STRIP:
                      </p>
                      <Stagger as="ol" step={70} className="flex flex-wrap items-center gap-2" role="list">
                        {industry.strip.map((stage, stageIndex) => (
                          <li key={stage} className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-md border border-rule bg-card px-3 py-1.5 font-mono text-xs font-medium text-ink shadow-xs">
                              <span className="size-1.5 rounded-full bg-signal-orange" />
                              {stage}
                            </span>
                            {stageIndex < industry.strip.length - 1 && (
                              <span aria-hidden="true" className="flow-line h-0.5 w-4" />
                            )}
                          </li>
                        ))}
                      </Stagger>
                    </div>
                  )}
                </li>
              )
            })}
          </Stagger>
        </Reveal>
      </Container>
    </section>
  )
}
