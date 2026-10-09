import {
  CERTIFICATION_NOTE,
  STANDARDS_QUALIFIER,
  securityLayers,
  securityPrinciples,
  standards,
} from '../data/standards'
import { Notice, PageHeader, PageSection } from '../components/pageKit'
import { Reveal } from '../components/primitives'
import { usePageMeta } from '../lib/usePageMeta'
import { organisationJsonLd } from '../lib/seo'
import { ArchitectureDiagram } from '../components/diagrams/ArchitectureDiagram'

const zoneStyle = {
  OT: { ring: 'border-signal-orange/40', dot: 'bg-signal-orange', text: 'text-signal-ink', label: 'PLANT SIDE' },
  Boundary: { ring: 'border-amber-glow/40', dot: 'bg-amber-glow', text: 'text-amber-glow', label: 'BOUNDARY' },
  IT: { ring: 'border-process-cyan/40', dot: 'bg-process-cyan', text: 'text-cyan-ink', label: 'CLOUD SIDE' },
} as const

export default function StandardsPage() {
  usePageMeta({
    title: 'Standards and industrial cybersecurity',
    description:
      'The standards RuralReact designs with reference to — IEC 60204-1, IEC 61439, IEC 61131-3, IEC 62443, ISA-88, ISA-95, OPC UA and Modbus — and how the OT security boundary keeps PLCs off the public internet.',
    path: '/standards',
    jsonLd: organisationJsonLd,
  })

  return (
    <>
      <PageHeader
        label="STANDARDS & OT SECURITY"
        title={STANDARDS_QUALIFIER}
        intro="Standards inform how a system is designed and documented. Naming one is not the same as being certified against it, and this page is careful about the difference."
        trail={[{ label: 'Home', to: '/' }, { label: 'Standards' }]}
      />

      <PageSection>
        <div className="mb-10">
          <Notice tone="caution" title="NO CERTIFICATION IS CLAIMED">
            {CERTIFICATION_NOTE}
          </Notice>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {standards.map((standard, index) => (
            <Reveal
              key={standard.code}
              delay={index * 50}
              variant="scale"
              className="group rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1) transition-[border-color,background-color,box-shadow] duration-200 ease-(--ease-out) hoverable:hover:border-signal-orange/40 hoverable:hover:shadow-(--shadow-e2)"
            >
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="rounded-md bg-signal-orange/12 px-2.5 py-1 font-mono text-xs font-bold text-signal-ink">
                  {standard.code}
                </span>
                <h2 className="text-base font-bold text-ink">{standard.title}</h2>
              </div>
              <p className="mt-3.5 text-sm leading-relaxed text-ink-muted">{standard.scope}</p>
              <div className="mt-4 rounded-md border border-rule/60 bg-sunk/70 px-3.5 py-2.5">
                <p className="flex gap-2.5 text-xs leading-relaxed text-ink-muted">
                  <span aria-hidden="true" className="mt-1 size-1.5 shrink-0 rounded-full bg-process-green" />
                  <span>{standard.applies}</span>
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </PageSection>

      {/* OT security architecture */}
      <PageSection
        tone="card"
        id="security"
        label="INDUSTRIAL CYBERSECURITY"
        title="The direction of the arrow is the whole design"
        intro="Remote visibility is achieved by publishing outward, never by opening a door inward. Five layers, and only one of them touches both sides."
      >
        <ArchitectureDiagram />

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <ol className="space-y-3" role="list">
            {securityLayers.map((layer, index) => {
              const style = zoneStyle[layer.zone]
              return (
                <Reveal
                  key={layer.id}
                  as="li"
                  delay={index * 60}
                  className={`rounded-xl border-2 bg-card p-5 shadow-(--shadow-e1) ${style.ring}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span aria-hidden="true" className={`size-2 rounded-full ${style.dot}`} />
                      <span className="font-mono text-[11px] text-ink-faint">{layer.tag}</span>
                      <h3 className="text-base font-bold text-ink">{layer.label}</h3>
                    </div>
                    <span className={`font-mono text-[10px] font-bold tracking-wide ${style.text}`}>
                      {style.label}
                    </span>
                  </div>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">{layer.body}</p>
                  {index < securityLayers.length - 1 && (
                    <div className="mt-3 flex items-center gap-2 font-mono text-[10px] text-ink-faint">
                      <span aria-hidden="true" className="h-px w-6 bg-rule-strong" />
                      PUBLISHES UPWARD
                      <span aria-hidden="true">&darr;</span>
                    </div>
                  )}
                </Reveal>
              )
            })}
          </ol>

          <div className="space-y-4 lg:sticky lg:top-24">
            {securityPrinciples.map((principle, index) => (
              <Reveal
                key={principle.title}
                delay={index * 60}
                className="rounded-xl border border-rule border-l-2 border-l-process-green/70 bg-card p-5 shadow-(--shadow-e1)"
              >
                <h3 className="text-sm font-bold text-ink">{principle.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{principle.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </PageSection>
    </>
  )
}
