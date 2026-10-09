import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowRight, Gauge, ShieldWarning, Lightning, Wrench } from '@phosphor-icons/react'
import { industryBySlug } from '../data/industries'
import {
  CategoryTag,
  Chip,
  ConfigurableTag,
  Notice,
  PageHeader,
  PageSection,
  SpecTable,
} from '../components/pageKit'
import { IconBadge, Reveal } from '../components/primitives'
import { usePageMeta } from '../lib/usePageMeta'
import { organisationJsonLd } from '../lib/seo'
import { useRequirement } from '../lib/requirementContext'
import { ProcessDiagram } from '../components/diagrams/ProcessDiagram'
import { ArchitectureDiagram } from '../components/diagrams/ArchitectureDiagram'
import { NotSureBand } from '../components/StartPaths'

export default function IndustryDetail() {
  const { slug = '' } = useParams()
  const industry = industryBySlug(slug)
  const { draft, setStages } = useRequirement()

  // Stage selection is part of the configuration, so it is kept in the
  // shared draft rather than in local state that dies on navigation.
  const kept = draft.stages[slug] ?? industry?.processFlow.map((s) => s.id) ?? []
  const [announcement, setAnnouncement] = useState('')
  const [detail, setDetail] = useState<string | undefined>()
  const detailStage = industry?.processFlow.find((s) => s.id === detail)

  usePageMeta({
    title: industry ? `${industry.name} automation` : 'Industry',
    description:
      industry?.summary ??
      'Industrial automation solutions configured to the process, from instrument selection through to cloud monitoring.',
    path: `/industries/${slug}`,
    jsonLd: industry
      ? [
          organisationJsonLd,
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: `${industry.name} automation`,
            description: industry.summary,
            provider: { '@type': 'Organization', name: 'RuralReact' },
            areaServed: 'IN',
          },
        ]
      : undefined,
  })

  if (!industry) return <Navigate to="/industries" replace />

  const toggleStage = (id: string, label: string) => {
    const next = kept.includes(id) ? kept.filter((s) => s !== id) : [...kept, id]
    setStages(slug, next)
    setAnnouncement(`${label} ${next.includes(id) ? 'included in' : 'removed from'} the configuration`)
  }

  return (
    <>
      <PageHeader
        label="INDUSTRY"
        title={industry.name}
        intro={industry.overview}
        trail={[{ label: 'Home', to: '/' }, { label: 'Industries', to: '/industries' }, { label: industry.name }]}
        aside={
          <div className="flex flex-col items-start gap-3">
            {!industry.verified && <CategoryTag />}
            <Link
              to="/configure"
              className="inline-flex items-center gap-2 rounded-sm bg-signal-orange px-4 py-2.5 text-sm font-semibold text-on-signal transition-[gap,background-color] duration-150 hoverable:hover:gap-3 hoverable:hover:bg-signal-orange-hover"
            >
              Configure for this industry
              <ArrowRight size={16} weight="bold" aria-hidden="true" />
            </Link>
          </div>
        }
      />

      {/* Categories */}
      <PageSection>
        <div className="flex flex-wrap gap-2.5">
          {industry.categories.map((category) => (
            <Chip key={category}>{category}</Chip>
          ))}
        </div>
      </PageSection>

      {/* Problems and opportunities, side by side so the pairing reads */}
      <PageSection
        tone="card"
        id="problems"
        label="WHAT GOES WRONG"
        title="Common problems, and what automation actually changes"
        intro="Each problem on the left has a specific mechanism on the right. Nothing here is solved by a dashboard alone."
      >
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="mb-5 flex items-center gap-2.5 font-mono text-xs font-bold tracking-wide text-signal-ink">
              <ShieldWarning size={16} weight="duotone" aria-hidden="true" />
              COMMON PROBLEMS
            </h3>
            <ul className="space-y-3" role="list">
              {industry.problems.map((problem, index) => (
                <Reveal key={problem.title} as="li" delay={index * 60}>
                  <div className="rounded-lg border border-rule border-l-2 border-l-signal-orange/70 bg-sunk/70 p-4">
                    <p className="text-sm font-bold text-ink">{problem.title}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{problem.body}</p>
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-5 flex items-center gap-2.5 font-mono text-xs font-bold tracking-wide text-process-ink">
              <Lightning size={16} weight="duotone" aria-hidden="true" />
              AUTOMATION OPPORTUNITIES
            </h3>
            <ul className="space-y-3" role="list">
              {industry.opportunities.map((opportunity, index) => (
                <Reveal key={opportunity.title} as="li" delay={index * 60}>
                  <div className="rounded-lg border border-rule border-l-2 border-l-process-green/70 bg-sunk/70 p-4">
                    <p className="text-sm font-bold text-ink">{opportunity.title}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{opportunity.body}</p>
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </PageSection>

      {/* Configurable process flow */}
      <PageSection
        id="process"
        label="PROCESS FLOW"
        title="Select the stages that apply to your line"
        intro="Stages you switch off are not supplied and bypassed; they are left out of the configuration entirely. Your selection is kept with the rest of your requirement."
      >
        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
          <div>
            <ul className="flex flex-wrap gap-2.5" role="list">
              {industry.processFlow.map((stage) => {
                const on = kept.includes(stage.id)
                return (
                  <li key={stage.id}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleStage(stage.id, stage.label)}
                      className={`group min-h-11 cursor-pointer rounded-md border px-3.5 py-2.5 text-left transition-[border-color,background-color,color,box-shadow] duration-200 ease-(--ease-out) active:scale-[0.97] ${
                        on
                          ? 'border-signal-orange bg-hover shadow-(--shadow-e2) ring-1 ring-signal-orange/25'
                          : 'border-rule bg-sunk/70 opacity-60 hoverable:hover:border-rule-strong hoverable:hover:opacity-100'
                      }`}
                    >
                      <span className="flex items-center gap-2 font-mono text-[11px] text-ink-faint">
                        <span
                          aria-hidden="true"
                          className={`size-2 shrink-0 rounded-full ${
                            on ? 'bg-process-green' : 'bg-rule-strong'
                          }`}
                        />
                        {stage.tag}
                      </span>
                      <span className={`mt-0.5 block text-sm font-bold ${on ? 'text-ink' : 'text-ink-muted'}`}>
                        {stage.label}
                      </span>
                      {stage.optional && (
                        <span className="mt-0.5 block font-mono text-[10px] text-ink-faint">optional stage</span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
            <p className="mt-5 font-mono text-xs text-ink-faint">
              {kept.length} OF {industry.processFlow.length} STAGES INCLUDED
            </p>

            {detailStage && (
              <div className="mt-5 rounded-lg border border-rule border-l-2 border-l-signal-orange/70 bg-sunk/70 p-4">
                <p className="font-mono text-[11px] text-signal-ink">{detailStage.tag}</p>
                <p className="mt-1 text-sm font-bold text-ink">{detailStage.label}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{detailStage.note}</p>
              </div>
            )}
          </div>

          <ProcessDiagram
            stages={industry.processFlow.filter((stage) => kept.includes(stage.id))}
            selected={detail}
            onSelect={setDetail}
          />
        </div>
      </PageSection>

      {/* Instrumentation */}
      <PageSection
        tone="card"
        id="instrumentation"
        label="INSTRUMENTATION"
        title="What gets measured, and why"
        intro="Selection covers range, wetted material and mounting, not just a part number. Every instrument below is available for configuration rather than supplied from a fixed catalogue."
      >
        <div className="mb-6">
          <ConfigurableTag />
        </div>
        <div className="overflow-x-auto rounded-xl border border-rule bg-card shadow-(--shadow-e1)">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">
              Instrumentation available for configuration in {industry.name} applications
            </caption>
            <thead>
              <tr className="border-b border-rule bg-sunk/80 font-mono text-xs tracking-wide text-ink-faint">
                <th scope="col" className="px-5 py-3 font-semibold">Measured variable</th>
                <th scope="col" className="px-5 py-3 font-semibold">Tag</th>
                <th scope="col" className="px-5 py-3 font-semibold">Typical range</th>
                <th scope="col" className="px-5 py-3 font-semibold">Why it is there</th>
              </tr>
            </thead>
            <tbody>
              {industry.instrumentation.map((instrument) => (
                <tr
                  key={instrument.variable}
                  className="border-b border-rule transition-colors last:border-b-0 hoverable:hover:bg-hover/50"
                >
                  <td className="px-5 py-3.5 font-semibold text-ink">{instrument.variable}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-signal-ink">{instrument.tag}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-ink-muted">{instrument.typicalRange}</td>
                  <td className="px-5 py-3.5 text-ink-muted">{instrument.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageSection>

      {/* Control layers */}
      <PageSection
        id="control"
        label="CONTROL LAYER"
        title="Where the logic lives"
        intro="Interlocks and sequences run in the controller on a fixed scan. The cloud layer reports on the plant; it never becomes a dependency for running it."
      >
        <div className="grid gap-5 md:grid-cols-2">
          {[
            { icon: Gauge, title: 'PLC / controller', body: industry.control.plc, tone: 'orange' as const },
            { icon: Gauge, title: 'HMI / SCADA', body: industry.control.hmi, tone: 'cyan' as const },
            { icon: Wrench, title: 'Control panel', body: industry.control.panel, tone: 'blue' as const },
            { icon: Lightning, title: 'Field equipment', body: industry.control.field, tone: 'teal' as const },
          ].map((layer, index) => (
            <Reveal
              key={layer.title}
              delay={index * 70}
              variant="scale"
              className="group rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1) transition-[border-color,background-color,box-shadow] duration-200 ease-(--ease-out) hoverable:hover:border-signal-orange/40 hoverable:hover:shadow-(--shadow-e2)"
            >
              <IconBadge icon={layer.icon} tone={layer.tone} size="md" />
              <h3 className="mt-4 text-lg font-bold text-ink">{layer.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{layer.body}</p>
            </Reveal>
          ))}
        </div>
      </PageSection>

      {/* Data, alarms, energy */}
      <PageSection
        tone="card"
        id="data"
        label="RECORDS AND ALARMS"
        title="What the system retains, and what it shouts about"
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1)">
            <h3 className="font-mono text-xs font-bold tracking-wide text-signal-ink">ALARMS</h3>
            <ul className="mt-4 space-y-2" role="list">
              {industry.alarms.map((alarm) => (
                <li key={alarm} className="flex items-start gap-2.5 text-sm text-ink-muted">
                  <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-signal-orange" />
                  {alarm}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1)">
            <h3 className="font-mono text-xs font-bold tracking-wide text-cyan-ink">DATA LOGGING</h3>
            <ul className="mt-4 space-y-2" role="list">
              {industry.logging.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-ink-muted">
                  <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-process-cyan" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-6">
            <div className="rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1)">
              <h3 className="font-mono text-xs font-bold tracking-wide text-process-ink">ENERGY MONITORING</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{industry.energy}</p>
            </div>
            <div className="rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1)">
              <h3 className="font-mono text-xs font-bold tracking-wide text-amber-glow">PREDICTIVE MAINTENANCE</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{industry.predictive}</p>
            </div>
          </div>
        </div>
      </PageSection>

      {/* Architecture and communication */}
      <PageSection
        id="architecture"
        label="TYPICAL ARCHITECTURE"
        title="How the pieces connect"
      >
        <ArchitectureDiagram />

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1) md:p-8">
            <p className="text-base leading-relaxed text-ink-muted">{industry.architecture}</p>
            <div className="mt-6">
              <Notice tone="assured" title="THE PLC IS NEVER EXPOSED TO THE INTERNET">
                The gateway initiates every connection outward. Nothing on the public internet can
                open a connection into the plant network.
              </Notice>
            </div>
          </div>
          <div>
            <SpecTable
              caption="COMMUNICATION"
              rows={industry.communication.map((protocol) => ({
                label: protocol,
                value: <span className="font-mono text-xs text-process-ink">Supported</span>,
              }))}
            />
          </div>
        </div>
      </PageSection>

      {/* CTA */}
      <PageSection tone="card">
        <div className="rounded-xl border border-signal-orange/30 bg-card border-l-4 border-l-signal-orange p-8 text-center shadow-(--shadow-e2) md:p-12">
          <h2 className="display text-2xl font-bold md:text-3xl">
            Configure a {industry.name.toLowerCase()} solution
          </h2>
          <p className="mx-auto mt-3 max-w-[560px] text-base text-ink-muted">
            The wizard starts from this industry and asks only the questions that apply. Nothing is
            priced until the scope is confirmed by you.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/configure"
              className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-signal-orange px-5 py-2.5 text-base font-semibold text-on-signal transition-[gap,background-color] duration-150 hoverable:hover:gap-3 hoverable:hover:bg-signal-orange-hover"
            >
              Configure my solution
              <ArrowRight size={18} weight="bold" aria-hidden="true" />
            </Link>
            <Link
              to="/rfq"
              className="inline-flex min-h-11 items-center rounded-sm border border-rule-strong bg-card px-5 py-2.5 text-base font-semibold text-ink transition-colors duration-150 hoverable:hover:border-ink-faint hoverable:hover:bg-hover"
            >
              See the RFQ summary
            </Link>
          </div>
        </div>
      </PageSection>
      <NotSureBand compact />
    </>
  )
}
