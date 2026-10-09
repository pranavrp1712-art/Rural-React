import { industries, industryCategories } from '../data/industries'
import { CategoryTag, LinkCard, Notice, PageHeader, PageSection } from '../components/pageKit'
import { Reveal } from '../components/primitives'
import { usePageMeta } from '../lib/usePageMeta'
import { organisationJsonLd } from '../lib/seo'

export default function IndustriesIndex() {
  usePageMeta({
    title: 'Industries — water, chemical, manufacturing, mining and energy automation',
    description:
      'Industrial automation across water and wastewater, chemical and process, manufacturing, agriculture and cold chain, waste, solar and energy, and mining. Process flows, instrumentation and control for each.',
    path: '/industries',
    jsonLd: [
      organisationJsonLd,
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Industries served',
        itemListElement: industries.map((industry, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: industry.name,
          url: `https://ruralreact.in/industries/${industry.slug}`,
        })),
      },
    ],
  })

  return (
    <>
      <PageHeader
        label="INDUSTRIES"
        title="The same chain, sized for a different process"
        intro="Every automation job runs through the same stages: measure, control, drive, record. What changes between a treatment plant and a cold store is the selection at each stage, not the structure."
        trail={[{ label: 'Home', to: '/' }, { label: 'Industries' }]}
      />

      <PageSection>
        <Reveal className="mb-10">
          <Notice tone="info" title="HOW TO READ THESE PAGES">
            RuralReact publishes these as automation solution categories. Where the company material
            does not confirm a delivered project in a sector, the page describes what the automation
            involves rather than presenting it as an existing RuralReact deployment.
          </Notice>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {industries.map((industry, index) => (
            <Reveal key={industry.slug} delay={index * 60} variant="scale">
              <LinkCard
                to={`/industries/${industry.slug}`}
                eyebrow={!industry.verified ? <CategoryTag /> : undefined}
                title={industry.name}
                body={industry.summary}
                footer="Open industry page"
              />
            </Reveal>
          ))}
        </div>
      </PageSection>

      <PageSection
        tone="card"
        label="APPLICATION CATEGORIES"
        title="Sixteen categories the configurator already understands"
        intro="Each of these maps onto a process flow and an instrument set in the requirement wizard. If yours is not here, the custom path asks the same engineering questions."
      >
        <ul className="flex flex-wrap gap-2.5" role="list">
          {industryCategories.map((category, index) => (
            <Reveal key={category} as="li" delay={index * 25} variant="fade">
              <span className="inline-flex items-center gap-2 rounded-lg border border-rule bg-sunk px-3.5 py-2 font-mono text-xs text-ink-muted transition-colors hoverable:hover:border-signal-orange/40 hoverable:hover:text-ink">
                <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-process-green" />
                {category}
              </span>
            </Reveal>
          ))}
        </ul>
      </PageSection>
    </>
  )
}
