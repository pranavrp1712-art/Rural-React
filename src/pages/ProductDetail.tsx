import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  ArrowRight,
  CaretDown,
  CheckCircle,
  FileText,
  MagnifyingGlass,
  Printer,
  ShieldCheck,
  Sliders,
  WarningCircle,
  Wrench,
  X,
} from '@phosphor-icons/react'
import { productBySlug, UNVERIFIED, type SpecGroup } from '../data/productCatalog'
import { ConfigurableTag, Notice, PageHeader, PageSection, SpecTable } from '../components/pageKit'
import { Container, Reveal, StatusLed } from '../components/primitives'
import { usePageMeta } from '../lib/usePageMeta'
import { organisationJsonLd } from '../lib/seo'
import { ProductSchematic } from '../components/diagrams/ProductSchematic'
import { hasSchematic } from '../components/diagrams/hasSchematic'
import { ArchitectureDiagram } from '../components/diagrams/ArchitectureDiagram'
import { NotSureBand } from '../components/StartPaths'

/** Renders an unverified marker as a visibly provisional value with exact status tone. */
function SpecValue({ value }: { value: string }) {
  if (value === 'Available for configuration') return <ConfigurableTag />
  if (value === UNVERIFIED.configure) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-sm border border-electric-blue/40 bg-electric-blue/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-electric-blue">
        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-electric-blue" />
        To be configured
      </span>
    )
  }
  if (value === UNVERIFIED.verify) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-sm border border-amber-glow/40 bg-amber-glow/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-glow">
        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-amber-glow" />
        To be verified
      </span>
    )
  }
  if (value === UNVERIFIED.review) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-sm border border-signal-orange/40 bg-signal-orange/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-signal-ink">
        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-signal-orange" />
        Engineering review required
      </span>
    )
  }
  return <span className="font-medium text-ink">{value}</span>
}

const sectionNavItems = [
  { id: 'overview', label: 'Overview' },
  { id: 'problem', label: 'Problem & Scope' },
  { id: 'principle', label: 'Principle & Schematics' },
  { id: 'features', label: 'Features' },
  { id: 'specifications', label: 'Specifications' },
  { id: 'lifecycle', label: 'Lifecycle & Maintenance' },
  { id: 'documents', label: 'Documents' },
  { id: 'faq', label: 'FAQ' },
]

export default function ProductDetail() {
  const { slug = '' } = useParams()
  const product = productBySlug(slug)

  const [activeSection, setActiveSection] = useState('overview')
  const [specQuery, setSpecQuery] = useState('')
  const [activeLifecycleTab, setActiveLifecycleTab] = useState<'customization' | 'installation' | 'maintenance'>('customization')

  usePageMeta({
    title: product ? `${product.name} — Technical Specifications & Schematics` : 'Product',
    description: product?.summary ?? 'RuralReact industrial automation equipment and specifications.',
    path: `/products/${slug}`,
    jsonLd: product
      ? [
          organisationJsonLd,
          {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.summary,
            brand: { '@type': 'Brand', name: 'RuralReact' },
            category: product.family === 'product' ? 'Industrial Automation Equipment' : 'Engineering Development Category',
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: product.faqs.map((faq) => ({
              '@type': 'Question',
              name: faq.q,
              acceptedAnswer: { '@type': 'Answer', text: faq.a },
            })),
          },
        ]
      : undefined,
  })

  // Filtered spec groups based on search query
  const filteredSpecs = useMemo(() => {
    if (!product) return []
    if (!specQuery.trim()) return product.specs
    const q = specQuery.toLowerCase()
    return product.specs
      .map((group) => {
        const matchesHeading = group.heading.toLowerCase().includes(q)
        const matchingRows = group.rows.filter(
          (row) => row.label.toLowerCase().includes(q) || String(row.value).toLowerCase().includes(q) || (row.note && row.note.toLowerCase().includes(q))
        )
        if (matchesHeading) return group
        if (matchingRows.length > 0) return { ...group, rows: matchingRows }
        return null
      })
      .filter((g): g is SpecGroup => g !== null)
  }, [product, specQuery])

  if (!product) return <Navigate to="/products" replace />

  const isDevelopment = product.family === 'development'
  const isControlPanel = product.slug === 'custom-industrial-control-panel'

  const scrollTo = (id: string) => {
    setActiveSection(id)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      <PageHeader
        label={isDevelopment ? 'DEVELOPMENT CATEGORY' : 'STANDARD INDUSTRIAL PRODUCT'}
        title={product.name}
        intro={product.overview}
        trail={[{ label: 'Home', to: '/' }, { label: 'Products', to: '/products' }, { label: product.name }]}
        aside={
          <div className="flex flex-col items-start gap-3 rounded-lg border border-band-rule bg-band-raised/70 p-4">
            <span className="font-mono text-[11px] tracking-wide text-band-ink-faint">COMMERCIAL STATUS</span>
            <div className="flex items-center gap-2">
              <StatusLed status={product.status} />
              <span className="font-mono text-xs font-bold text-band-ink uppercase">{product.status.replace('-', ' ')}</span>
            </div>
            <span className="text-[11px] text-band-ink-muted">
              {product.status === 'ready' && 'Verified for commercial order'}
              {product.status === 'pilot' && 'Active in customer trials'}
              {product.status === 'custom' && 'Engineered against project loads'}
              {product.status === 'in-development' && 'Prototype stage, under review'}
              {product.status === 'coming-soon' && 'Design phase'}
            </span>
          </div>
        }
      />

      {/* Sticky In-Page Navigation Bar */}
      <div className="sticky top-[88px] z-30 border-b border-rule bg-page/95 backdrop-blur-sm">
        <Container className="py-2.5">
          <nav aria-label="Product sheet navigation" className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {sectionNavItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollTo(item.id)}
                  className={`min-h-9 cursor-pointer rounded-sm px-2.5 sm:px-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
                    activeSection === item.id
                      ? 'border border-signal-orange bg-signal-orange/15 text-ink ring-1 ring-signal-orange/30'
                      : 'border border-rule bg-card text-ink-muted hoverable:hover:bg-hover hoverable:hover:text-ink'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="hidden sm:inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-rule bg-card px-3 text-xs font-semibold text-ink-muted hoverable:hover:bg-hover hoverable:hover:text-ink"
                title="Print or save spec sheet as PDF"
              >
                <Printer size={15} />
                Print / Save
              </button>

              <Link
                to={isControlPanel ? '/configurators?tab=panel' : '/configure'}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-sm bg-signal-orange px-3.5 text-xs font-semibold text-on-signal transition-colors hoverable:hover:bg-signal-orange-hover"
              >
                <Sliders size={15} weight="bold" />
                Configure
              </Link>
            </div>
          </nav>
        </Container>
      </div>

      {/* Status Warning Banner for Non-Ready Products */}
      {product.status !== 'ready' && (
        <PageSection id="overview">
          <Notice tone="caution" title="VERIFIED STATUS DISCLAIMER">
            This item is labelled as <strong>{product.status.toUpperCase()}</strong>. Figures shown as "To be configured",
            "To be verified" or "Engineering review required" indicate actual engineering checkpoints, not placeholders.
            RuralReact guarantees that no specification is falsified to mimic commercial readiness.
          </Notice>
        </PageSection>
      )}

      {/* Control Panels Hub Callout if viewing Control Panel */}
      {isControlPanel && (
        <PageSection>
          <div className="rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1) border-l-4 border-l-signal-orange">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-signal-ink">
                  DEDICATED SECTION AVAILABLE
                </span>
                <h3 className="mt-1 text-lg font-bold text-ink">Explore our Complete Control Panels Hub</h3>
                <p className="mt-1 text-sm text-ink-muted">
                  View panel types, enclosure standards, interactive CAD GA elevations, and our 16-step engineering workflow.
                </p>
              </div>
              <Link
                to="/control-panels"
                className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-sm bg-signal-orange px-4 text-xs font-bold text-on-signal hoverable:hover:bg-signal-orange-hover"
              >
                Open Control Panels Hub
                <ArrowRight size={15} weight="bold" />
              </Link>
            </div>
          </div>
        </PageSection>
      )}

      {/* Problem Solved & Target Applications */}
      <PageSection
        tone="card"
        id="problem"
        label="OPERATIONAL CHALLENGE"
        title="What this equipment exists to solve"
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="rounded-xl border border-rule border-l-4 border-l-amber-glow bg-card p-6 shadow-(--shadow-e1) md:p-8">
            <div className="flex items-center gap-2 text-amber-glow">
              <WarningCircle size={20} weight="bold" />
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider">PLANT PAIN POINT</h3>
            </div>
            <p className="mt-3 text-lg leading-relaxed text-ink-muted">{product.problem}</p>
          </div>

          <div className="rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1)">
            <h3 className="font-mono text-xs font-bold tracking-wide text-ink-faint uppercase">
              TARGET APPLICATIONS ({product.applications.length})
            </h3>
            <ul className="mt-4 space-y-2.5" role="list">
              {product.applications.map((application) => (
                <li key={application} className="flex items-start gap-2.5 text-sm text-ink-muted">
                  <CheckCircle size={16} weight="fill" className="mt-0.5 shrink-0 text-process-green" />
                  <span>{application}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </PageSection>

      {/* Working Principle and Architecture */}
      <PageSection id="principle" label="TECHNICAL ARCHITECTURE" title="Working principle and system architecture">
        {hasSchematic(product.slug) ? (
          <>
            <ProductSchematic slug={product.slug} />
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-rule border-l-2 border-l-signal-orange/70 bg-card p-6 shadow-(--shadow-e1)">
                <h3 className="font-mono text-xs font-bold tracking-wide text-signal-ink uppercase">
                  WORKING PRINCIPLE
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">{product.principle}</p>
              </div>
              <div className="rounded-xl border border-rule border-l-2 border-l-process-cyan/60 bg-card p-6 shadow-(--shadow-e1)">
                <h3 className="font-mono text-xs font-bold tracking-wide text-cyan-ink uppercase">
                  ELECTRICAL & SIGNAL ARCHITECTURE
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">{product.architecture}</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <ArchitectureDiagram compact />
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-rule border-l-2 border-l-signal-orange/70 bg-card p-6 shadow-(--shadow-e1)">
                <h3 className="font-mono text-xs font-bold tracking-wide text-signal-ink uppercase">
                  WORKING PRINCIPLE
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">{product.principle}</p>
              </div>
              <div className="rounded-xl border border-rule border-l-2 border-l-process-cyan/60 bg-card p-6 shadow-(--shadow-e1)">
                <h3 className="font-mono text-xs font-bold tracking-wide text-cyan-ink uppercase">
                  ELECTRICAL & SIGNAL ARCHITECTURE
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">{product.architecture}</p>
              </div>
            </div>
          </>
        )}
      </PageSection>

      {/* Key Features */}
      <PageSection tone="card" id="features" label="KEY FEATURES" title="Engineering capabilities and mechanisms">
        <div className="grid gap-5 md:grid-cols-2">
          {product.features.map((feature, index) => (
            <Reveal
              key={feature.title}
              delay={index * 50}
              variant="scale"
              className="group relative overflow-hidden rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1) transition-[border-color,box-shadow] duration-200 hoverable:hover:border-signal-orange/50 hoverable:hover:shadow-(--shadow-e2)"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-signal-ink">
                  F{String(index + 1).padStart(2, '0')}
                </span>
                <span className="size-2 rounded-full bg-rule group-hover:bg-signal-orange transition-colors" />
              </div>
              <h3 className="mt-3 text-lg font-bold text-ink">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{feature.body}</p>
            </Reveal>
          ))}
        </div>
      </PageSection>

      {/* Specifications Section with Search Filter */}
      <PageSection
        id="specifications"
        label="TECHNICAL SPECIFICATIONS"
        title="Complete audited parameters & data points"
        intro="Technical specifications are maintained in verified data structures. Unverified parameters are explicitly tagged so engineers can plan reviews accordingly."
      >
        {/* Spec Search Bar */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-rule bg-card p-3">
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              type="search"
              value={specQuery}
              onChange={(e) => setSpecQuery(e.target.value)}
              placeholder="Search specifications (e.g., voltage, IP, I/O)..."
              className="min-h-9 w-full rounded-sm border border-rule bg-sunk/60 pl-9 pr-3 text-xs text-ink focus:border-signal-orange focus:outline-none"
              aria-label="Filter specifications"
            />
            {specQuery && (
              <button
                type="button"
                onClick={() => setSpecQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px] text-ink-faint font-mono">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-electric-blue" /> To configure
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-amber-glow" /> To verify
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-signal-orange" /> Review req.
            </span>
          </div>
        </div>

        {filteredSpecs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-rule bg-card p-8 text-center text-sm text-ink-muted">
            No specifications matched "{specQuery}". Try searching another parameter.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {filteredSpecs.map((group, index) => (
              <Reveal key={group.heading} delay={index * 50}>
                <SpecTable
                  caption={group.heading.toUpperCase()}
                  rows={group.rows.map((row) => ({
                    label: row.label,
                    value: <SpecValue value={row.value} />,
                    note: row.note,
                  }))}
                />
              </Reveal>
            ))}
          </div>
        )}
      </PageSection>

      {/* Options and Engineering Lifecycle Tabs */}
      <PageSection
        tone="card"
        id="lifecycle"
        label="ENGINEERING LIFECYCLE"
        title="Customization, installation and maintenance"
      >
        <div className="rounded-xl border border-rule bg-card shadow-(--shadow-e1) overflow-hidden">
          {/* Tab Selector */}
          <div className="flex border-b border-rule bg-sunk/60">
            {[
              { id: 'customization', label: 'Customization Scope', icon: Sliders },
              { id: 'installation', label: 'Mounting & Installation', icon: Wrench },
              { id: 'maintenance', label: 'Preventive Maintenance', icon: ShieldCheck },
            ].map((tab) => {
              const active = activeLifecycleTab === tab.id
              const IconComp = tab.icon
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveLifecycleTab(tab.id as typeof activeLifecycleTab)}
                  className={`flex flex-1 min-h-12 items-center justify-center gap-2 px-4 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    active
                      ? 'border-b-2 border-b-signal-orange bg-card text-ink'
                      : 'text-ink-muted hover:bg-hover hover:text-ink'
                  }`}
                >
                  <IconComp size={16} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          <div className="p-6 md:p-8">
            {activeLifecycleTab === 'customization' && (
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                  <h4 className="text-base font-bold text-ink">Engineering Scope & Customization</h4>
                  <p className="text-sm leading-relaxed text-ink-muted">{product.customization}</p>
                </div>
                <div className="rounded-lg border border-rule bg-sunk/40 p-5">
                  <h5 className="font-mono text-xs font-bold text-signal-ink uppercase">AVAILABLE OPTIONS</h5>
                  <ul className="mt-3 space-y-2 text-xs text-ink-muted" role="list">
                    {product.options.map((opt) => (
                      <li key={opt} className="flex items-start gap-2">
                        <CheckCircle size={14} className="text-process-green shrink-0 mt-0.5" />
                        <span>{opt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeLifecycleTab === 'installation' && (
              <div className="space-y-4">
                <h4 className="text-base font-bold text-ink">Field Installation & Site Requirements</h4>
                <p className="text-sm leading-relaxed text-ink-muted">{product.installation}</p>
              </div>
            )}

            {activeLifecycleTab === 'maintenance' && (
              <div className="space-y-4">
                <h4 className="text-base font-bold text-ink">Preventive Maintenance & Spares Schedule</h4>
                <p className="text-sm leading-relaxed text-ink-muted">{product.maintenance}</p>
              </div>
            )}
          </div>
        </div>
      </PageSection>

      {/* Documents and Drawing Vault */}
      <PageSection id="documents" label="DOCUMENT VAULT" title="Drawings, certificates and deliverables">
        <div className="rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1)">
          <SpecTable
            caption="ENGINEERING PACK & CERTIFICATES"
            rows={product.documents.map((document) => ({
              label: document.label,
              value: <SpecValue value={document.state} />,
            }))}
          />
        </div>
      </PageSection>

      {/* Frequently Asked Questions */}
      <PageSection tone="card" id="faq" label="FAQ" title="Engineering questions frequently asked by buyers">
        <div className="overflow-hidden rounded-xl border border-rule bg-card shadow-(--shadow-e1)">
          {product.faqs.map((faq) => (
            <details key={faq.q} className="group border-b border-rule transition-colors last:border-b-0 open:bg-hover/20">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-base font-bold text-ink hoverable:hover:bg-hover/50 md:px-7">
                {faq.q}
                <CaretDown
                  size={18}
                  weight="bold"
                  aria-hidden="true"
                  className="shrink-0 text-ink-faint transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              <div className="px-5 pb-5 text-sm leading-relaxed text-ink-muted md:px-7">{faq.a}</div>
            </details>
          ))}
        </div>
      </PageSection>

      {/* Bottom Conversion Action Banner */}
      <PageSection id="quote">
        <div className="rounded-xl border border-signal-orange/30 bg-card border-l-4 border-l-signal-orange p-8 text-center shadow-(--shadow-e2) md:p-12">
          <h2 className="display text-2xl font-bold md:text-3xl text-ink">
            Ready to integrate {product.name}?
          </h2>
          <p className="mx-auto mt-3 max-w-[580px] text-base text-ink-muted leading-relaxed">
            Configure your technical requirements first. We produce a preliminary bill of materials and single-line design;
            a formal commercial quotation follows engineering verification.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
            <Link
              to={isControlPanel ? '/configurators?tab=panel' : '/configure'}
              className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-signal-orange px-6 py-2.5 text-base font-semibold text-on-signal transition-all hoverable:hover:bg-signal-orange-hover"
            >
              {isControlPanel ? 'Launch Panel Sizer' : 'Configure My Solution'}
              <ArrowRight size={18} weight="bold" />
            </Link>
            <Link
              to="/rfq"
              className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-rule-strong bg-card px-5 py-2.5 text-base font-semibold text-ink transition-colors hoverable:hover:bg-hover"
            >
              <FileText size={18} />
              Request Quotation (RFQ)
            </Link>
          </div>
        </div>
      </PageSection>

      <NotSureBand compact />
    </>
  )
}
