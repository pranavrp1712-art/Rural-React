import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle,
  Cpu,
  Drop,
  Factory,
  Lightning,
  MagnifyingGlass,
  Package,
  Sliders,
  Sun,
  X,
} from '@phosphor-icons/react'
import { products } from '../data/productCatalog'
import { Notice, PageHeader, PageSection } from '../components/pageKit'
import { Container, Reveal, StatusLed } from '../components/primitives'
import { usePageMeta } from '../lib/usePageMeta'
import { organisationJsonLd } from '../lib/seo'
import { NotSureBand } from '../components/StartPaths'

type StatusFilter = 'all' | 'ready' | 'pilot' | 'custom' | 'in-development'
type FamilyFilter = 'all' | 'product' | 'development'
type IndustryFilter = 'all' | 'water' | 'agriculture' | 'manufacturing' | 'solar'

const industryCategories = [
  { id: 'all', label: 'All Industries', icon: Factory },
  { id: 'water', label: 'Water & Effluent', icon: Drop, match: ['water', 'purification', 'testing', 'effluent', 'ph'] },
  { id: 'agriculture', label: 'Agriculture & Food', icon: Sun, match: ['drying', 'solar', 'food', 'spice', 'produce', 'produce'] },
  { id: 'manufacturing', label: 'Manufacturing & MSME', icon: Cpu, match: ['panel', 'plc', 'control', 'machinery', 'automation', 'gateway'] },
  { id: 'solar', label: 'Solar & Renewable', icon: Lightning, match: ['solar', 'thermal', 'energy', 'irradiance', 'battery'] },
]

export default function ProductsIndex() {
  usePageMeta({
    title: 'Industrial Products & Automation Scopes — RuralReact',
    description:
      'RuralReact products and engineering development categories: custom industrial control panels, IoT gateway and custom PCB, solar dryer, wastewater treatment unit, lab kit, and sensors. Tested to industrial standards.',
    path: '/products',
    jsonLd: [
      organisationJsonLd,
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'RuralReact products and automation scopes',
        itemListElement: products.map((product, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: product.name,
          url: `https://ruralreact.in/products/${product.slug}`,
        })),
      },
    ],
  })

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [familyFilter, setFamilyFilter] = useState<FamilyFilter>('all')
  const [industryFilter, setIndustryFilter] = useState<IndustryFilter>('all')

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search term
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchTitle = p.name.toLowerCase().includes(q)
        const matchSummary = p.summary.toLowerCase().includes(q)
        const matchOverview = p.overview.toLowerCase().includes(q)
        const matchApps = p.applications.some((app) => app.toLowerCase().includes(q))
        if (!matchTitle && !matchSummary && !matchOverview && !matchApps) return false
      }

      // Status filter
      if (statusFilter !== 'all' && p.status !== statusFilter) return false

      // Family filter
      if (familyFilter !== 'all' && p.family !== familyFilter) return false

      // Industry filter
      if (industryFilter !== 'all') {
        const cat = industryCategories.find((c) => c.id === industryFilter)
        if (cat?.match) {
          const content = `${p.name} ${p.summary} ${p.applications.join(' ')}`.toLowerCase()
          const matched = cat.match.some((keyword) => content.includes(keyword))
          if (!matched) return false
        }
      }

      return true
    })
  }, [search, statusFilter, familyFilter, industryFilter])

  const counts = useMemo(() => {
    const ready = products.filter((p) => p.status === 'ready').length
    const pilot = products.filter((p) => p.status === 'pilot').length
    const custom = products.filter((p) => p.status === 'custom').length
    const dev = products.filter((p) => p.status === 'in-development' || p.status === 'coming-soon').length
    return { total: products.length, ready, pilot, custom, dev }
  }, [])

  const resetFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setFamilyFilter('all')
    setIndustryFilter('all')
  }

  const hasActiveFilters = search || statusFilter !== 'all' || familyFilter !== 'all' || industryFilter !== 'all'

  return (
    <>
      <PageHeader
        label="EQUIPMENT & CAPABILITIES"
        title="Products & Engineering Development Scopes"
        intro="Verified industrial equipment and scoped development categories. Status labels are stated plainly on every item: unconfirmed specifications carry explicit verification flags rather than plausible guesses."
        trail={[{ label: 'Home', to: '/' }, { label: 'Products' }]}
        aside={
          <div className="flex flex-col items-start gap-2 rounded-lg border border-band-rule bg-band-raised/70 p-4">
            <span className="font-mono text-[11px] tracking-wide text-band-ink-faint">CATALOGUE STATUS</span>
            <div className="flex items-center gap-2">
              <span className="readout font-mono text-2xl font-bold text-signal-ink">{counts.total}</span>
              <span className="text-xs text-band-ink-muted">TOTAL ITEMS DOCUMENTED</span>
            </div>
            <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-band-ink-muted">
              <span>{counts.ready} Ready</span>•<span>{counts.pilot} Pilot</span>•<span>{counts.custom} Custom</span>
            </div>
          </div>
        }
      />

      {/* Metrics Banner */}
      <div className="border-b border-rule bg-card py-4 shadow-(--shadow-e1)">
        <Container>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-6">
            <div className="flex flex-col border-r border-rule/60 pr-4 last:border-r-0">
              <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">Available from stock</span>
              <span className="readout mt-1 font-mono text-xl font-bold text-process-green">{counts.ready} Products</span>
              <span className="text-[11px] text-ink-muted">Commercially ready & proven</span>
            </div>
            <div className="flex flex-col border-r border-rule/60 pr-4 last:border-r-0">
              <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">In field deployment</span>
              <span className="readout mt-1 font-mono text-xl font-bold text-signal-orange">{counts.pilot} Pilots</span>
              <span className="text-[11px] text-ink-muted">Active site trials running</span>
            </div>
            <div className="flex flex-col border-r border-rule/60 pr-4 last:border-r-0">
              <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">Scoped per project</span>
              <span className="readout mt-1 font-mono text-xl font-bold text-electric-blue">{counts.custom} Custom Builds</span>
              <span className="text-[11px] text-ink-muted">Engineered to client load</span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">Engineering R&D</span>
              <span className="readout mt-1 font-mono text-xl font-bold text-ink-faint">{counts.dev} Development</span>
              <span className="text-[11px] text-ink-muted">Prototypes in validation</span>
            </div>
          </div>
        </Container>
      </div>

      <PageSection>
        {/* Verification Policy Notice */}
        <Reveal className="mb-8">
          <Notice tone="caution" title="STATUS LABELS ARE LOAD BEARING">
            READY indicates equipment available today. PILOT means active in customer field trials. CUSTOM indicates built
            against project load calculations and drawing approvals. IN DEVELOPMENT means engineering is in progress with no
            commercial readiness claimed. Any specification not yet verified carries an explicit marker.
          </Notice>
        </Reveal>

        {/* Search & Filter Toolbar */}
        <div className="rounded-xl border border-rule bg-card p-4 shadow-(--shadow-e1) md:p-6 mb-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products, sensors, applications or specs..."
                className="min-h-11 w-full rounded-md border border-rule bg-sunk/60 pl-10 pr-4 text-sm text-ink placeholder:text-ink-faint focus:border-signal-orange focus:bg-card focus:outline-none focus:ring-1 focus:ring-signal-orange"
                aria-label="Search catalogue"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by status">
              <span className="font-mono text-xs font-semibold text-ink-faint mr-1">Status:</span>
              {[
                { id: 'all', label: 'All' },
                { id: 'ready', label: 'Ready' },
                { id: 'pilot', label: 'Pilot' },
                { id: 'custom', label: 'Custom' },
                { id: 'in-development', label: 'In Dev' },
              ].map((s) => {
                const active = statusFilter === s.id
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStatusFilter(s.id as StatusFilter)}
                    className={`min-h-9 cursor-pointer rounded-sm px-3 text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-signal-orange text-on-signal font-bold'
                        : 'border border-rule bg-sunk/70 text-ink-muted hoverable:hover:bg-hover hoverable:hover:text-ink'
                    }`}
                  >
                    {s.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Industry Filter Pills */}
          <div className="mt-4 border-t border-rule pt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold text-ink-faint mr-1">Industry:</span>
              {industryCategories.map((cat) => {
                const active = industryFilter === cat.id
                const IconComp = cat.icon
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setIndustryFilter(cat.id as IndustryFilter)}
                    className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors ${
                      active
                        ? 'border border-signal-orange/60 bg-signal-orange/15 text-ink ring-1 ring-signal-orange/30'
                        : 'border border-rule bg-card text-ink-muted hoverable:hover:bg-hover hoverable:hover:text-ink'
                    }`}
                  >
                    <IconComp size={14} weight={active ? 'bold' : 'regular'} />
                    {cat.label}
                  </button>
                )
              })}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs font-semibold text-danger hover:underline cursor-pointer"
              >
                <X size={14} />
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Results Counter */}
        <div className="mb-6 flex items-center justify-between">
          <p className="font-mono text-xs font-semibold text-ink-muted">
            SHOWING {filteredProducts.length} OF {products.length} CATALOGUE ITEMS
          </p>
          {hasActiveFilters && (
            <span className="text-xs text-ink-faint">Filters active</span>
          )}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="rounded-xl border border-dashed border-rule bg-card p-12 text-center">
            <Package size={40} className="mx-auto text-ink-faint" />
            <h3 className="mt-3 text-lg font-bold text-ink">No matching products found</h3>
            <p className="mt-1 text-sm text-ink-muted">Try adjusting your search terms or clearing current filter selections.</p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 inline-flex items-center rounded-sm bg-signal-orange px-4 py-2 text-xs font-semibold text-on-signal"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product, index) => {
            const isCustom = product.slug === 'custom-industrial-control-panel'
            return (
              <Reveal key={product.slug} delay={index * 50} variant="scale">
                <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1) transition-[border-color,box-shadow,transform] duration-200 hoverable:hover:border-signal-orange/50 hoverable:hover:shadow-(--shadow-e2)">
                  <div>
                    {/* Card Eyebrow */}
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-xs border border-rule bg-sunk px-2 py-0.5 font-mono text-[10px] font-semibold text-ink-muted uppercase">
                        {product.family === 'product' ? 'Standard Product' : 'Development Scope'}
                      </span>
                      <StatusLed status={product.status} />
                    </div>

                    {/* Title */}
                    <h3 className="mt-4 text-xl font-bold text-ink group-hover:text-signal-orange transition-colors">
                      <Link to={`/products/${product.slug}`} className="hover:underline">
                        {product.name}
                      </Link>
                    </h3>

                    {/* Summary */}
                    <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">
                      {product.summary}
                    </p>

                    {/* Target Applications preview */}
                    <div className="mt-4 border-t border-rule/70 pt-3">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                        Applications:
                      </span>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {product.applications.slice(0, 3).map((app) => (
                          <span
                            key={app}
                            className="rounded-xs border border-rule/50 bg-sunk/40 px-2 py-0.5 text-[11px] text-ink-muted"
                          >
                            {app}
                          </span>
                        ))}
                        {product.applications.length > 3 && (
                          <span className="rounded-xs bg-sunk/20 px-1.5 py-0.5 font-mono text-[10px] text-ink-faint">
                            +{product.applications.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="mt-6 border-t border-rule pt-4 flex flex-wrap items-center justify-between gap-2">
                    <Link
                      to={`/products/${product.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-signal-ink hoverable:hover:underline"
                    >
                      Technical specs & drawings
                      <ArrowRight size={14} weight="bold" />
                    </Link>

                    {isCustom ? (
                      <Link
                        to="/control-panels"
                        className="rounded-xs border border-rule bg-sunk px-2.5 py-1 text-[11px] font-semibold text-ink hoverable:hover:bg-hover"
                      >
                        Control Panels Hub →
                      </Link>
                    ) : (
                      <Link
                        to="/configure"
                        className="rounded-xs border border-rule bg-sunk px-2.5 py-1 text-[11px] font-semibold text-ink-muted hoverable:hover:bg-hover hoverable:hover:text-ink"
                      >
                        Configure
                      </Link>
                    )}
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </PageSection>

      {/* Control Panels Feature Highlight Banner */}
      <PageSection tone="card">
        <div className="rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1) md:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-center">
            <div>
              <span className="font-mono text-xs font-bold tracking-wider text-signal-ink uppercase">
                FEATURED ENGINEERING CAPABILITY
              </span>
              <h2 className="mt-2 text-2xl font-bold text-ink md:text-3xl">
                Custom Industrial Control Panels
              </h2>
              <p className="mt-3 text-base text-ink-muted leading-relaxed">
                Looking for tailored PLC enclosures, motor starter cabinets, or solar field enclosures?
                Explore our dedicated Control Panels engineering section with live General Arrangement (GA) CAD preview,
                heat load estimation, and our verified 16-step engineering workflow.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/control-panels"
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-sm bg-signal-orange px-5 py-2 text-sm font-semibold text-on-signal transition-colors hoverable:hover:bg-signal-orange-hover"
                >
                  Explore Control Panels Hub
                  <ArrowRight size={16} weight="bold" />
                </Link>
                <Link
                  to="/configurators?tab=panel"
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-sm border border-rule-strong bg-card px-4 py-2 text-sm font-semibold text-ink transition-colors hoverable:hover:bg-hover"
                >
                  <Sliders size={16} />
                  Open Panel Sizer
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-rule bg-sunk/60 p-5">
              <span className="font-mono text-[11px] font-bold text-ink-faint uppercase">ENGINEERING ASSURANCES:</span>
              <ul className="mt-3 space-y-2 text-xs text-ink-muted" role="list">
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} weight="fill" className="text-process-green shrink-0 mt-0.5" />
                  <span>IEC 61439-1 & 2 low voltage assembly compliance</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} weight="fill" className="text-process-green shrink-0 mt-0.5" />
                  <span>100% ferruled wiring matching as-built CAD schematics</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} weight="fill" className="text-process-green shrink-0 mt-0.5" />
                  <span>Customer witnessed Factory Acceptance Testing (FAT)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} weight="fill" className="text-process-green shrink-0 mt-0.5" />
                  <span>Complete source schematics & layout drawings you keep</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </PageSection>

      <NotSureBand compact />
    </>
  )
}
