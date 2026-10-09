import { Link } from 'react-router-dom'
import { CASE_STUDY_FALLBACK, caseStudies } from '../data/standards'
import { CategoryTag, Notice, PageHeader, PageSection } from '../components/pageKit'
import { Reveal } from '../components/primitives'
import { usePageMeta } from '../lib/usePageMeta'

/** The fields a verified case study fills in, shown as the template. */
const templateFields = [
  'Customer',
  'Industry',
  'Problem',
  'Existing System',
  'Solution',
  'Sensors',
  'PLC',
  'Control',
  'IIoT',
  'Results',
  'Images',
  'Architecture',
]

export default function CaseStudies() {
  usePageMeta({
    title: 'Case studies',
    description:
      'RuralReact case studies. Only verified customer and project information is published; where details are not verified, they are available on request rather than invented.',
    path: '/case-studies',
  })

  return (
    <>
      <PageHeader
        label="CASE STUDIES"
        title="Only what can be verified"
        intro="A case study is a claim about somebody else's plant. Until the customer and project information is verified, this page names the application category and nothing more."
        trail={[{ label: 'Home', to: '/' }, { label: 'Case studies' }]}
      />

      <PageSection>
        <div className="mb-10">
          <Notice tone="info" title="WHY THESE ARE EMPTY">
            Published results, customer names and before-and-after figures are only shown once they
            are verified. None are verified yet, so none are shown. The alternative — plausible
            numbers with no project behind them — is the thing this site exists to avoid.
          </Notice>
        </div>

        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" role="list">
          {caseStudies.map((study, index) => (
            <Reveal
              key={study.id}
              as="li"
              delay={index * 60}
              variant="scale"
              className="flex h-full flex-col rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1)"
            >
              <span className="font-mono text-[11px] tracking-wide text-signal-ink">
                {study.industry.toUpperCase()}
              </span>
              <h2 className="mt-2 text-lg font-bold text-ink">{study.application}</h2>

              {study.verified ? (
                <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-muted">{study.problem}</p>
              ) : (
                <>
                  <div className="mt-4 flex-1 rounded-md border border-dashed border-rule bg-sunk/60 p-4">
                    <p className="text-sm text-ink-muted">{CASE_STUDY_FALLBACK}</p>
                  </div>
                  <div className="mt-4">
                    <CategoryTag />
                  </div>
                </>
              )}
            </Reveal>
          ))}
        </ul>
      </PageSection>

      <PageSection
        tone="card"
        label="THE TEMPLATE"
        title="What a published case study will contain"
        intro="When a customer agrees to be named and the figures are confirmed, this is the structure each one follows."
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <ul className="flex flex-wrap gap-2 self-start" role="list">
            {templateFields.map((field) => (
              <li
                key={field}
                className="inline-flex items-center gap-1.5 rounded-md border border-rule bg-sunk px-3 py-2 font-mono text-xs text-ink-muted"
              >
                <span aria-hidden="true" className="size-1.5 rounded-full bg-rule-strong" />
                {field}
              </li>
            ))}
          </ul>

          <div className="rounded-xl border border-signal-orange/30 bg-card border-l-4 border-l-signal-orange p-8 shadow-(--shadow-e2)">
            <h2 className="display text-xl font-bold md:text-2xl">
              Want the detail on a specific application?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              Ask, and what can be shared will be shared, with the customer's agreement. What cannot
              be shared will be described in general terms rather than dressed up.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/configure"
                className="inline-flex min-h-11 items-center rounded-sm bg-signal-orange px-5 py-2.5 text-sm font-semibold text-on-signal transition-colors duration-150 hoverable:hover:bg-signal-orange-hover"
              >
                Configure my solution
              </Link>
              <Link
                to="/industries"
                className="inline-flex min-h-11 items-center rounded-sm border border-rule-strong bg-card px-5 py-2.5 text-sm font-semibold text-ink transition-colors duration-150 hoverable:hover:border-ink-faint hoverable:hover:bg-hover"
              >
                Browse industries
              </Link>
            </div>
          </div>
        </div>
      </PageSection>
    </>
  )
}
