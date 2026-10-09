import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, Minus, Plus } from '@phosphor-icons/react'
import {
  ENCLOSURE_DISCLAIMER,
  IO_DISCLAIMER,
  cardCount,
  existingInfrastructure,
  hmiScreens,
  hmiSizes,
  ioRules,
  moduleSize,
  panelComponents,
  panelElectrical,
  panelEnclosure,
  panelWorkflowSteps,
  plcBrands,
  plcCapabilities,
  plcProtocols,
} from '../data/configurators'
import { FlowRail, Notice, PageHeader, PageSection } from '../components/pageKit'
import { Container } from '../components/primitives'
import { usePageMeta } from '../lib/usePageMeta'
import { useRequirement } from '../lib/requirementContext'
import { IoTopology } from '../components/diagrams/IoTopology'
import { PanelElevation } from '../components/diagrams/PanelElevation'
import { HmiScreenPreview } from '../components/diagrams/HmiScreens'
import { NotSureBand } from '../components/StartPaths'

const tabs = [
  { id: 'plc', label: 'PLC' },
  { id: 'io', label: 'I/O Calculator' },
  { id: 'panel', label: 'Control Panel' },
  { id: 'hmi', label: 'HMI' },
] as const

type TabId = (typeof tabs)[number]['id']

export default function Configurators() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab') as TabId | null
  const initialTab: TabId = tabs.some((t) => t.id === tabParam) ? tabParam! : 'io'
  const [tab, setTabState] = useState<TabId>(initialTab)

  useEffect(() => {
    if (tabParam && tabs.some((t) => t.id === tabParam) && tabParam !== tab) {
      setTabState(tabParam)
    }
  }, [tabParam, tab])

  const setTab = (newTab: TabId) => {
    setTabState(newTab)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('tab', newTab)
      return next
    }, { replace: true })
  }

  usePageMeta({
    title: 'Configurators — PLC, I/O calculator, control panel and HMI',
    description:
      'Client side configurators for industrial automation: PLC selection, automatic I/O calculation with engineering spare, control panel sizing with a preliminary enclosure estimate, and HMI screen selection.',
    path: '/configurators',
  })

  return (
    <>
      <PageHeader
        label="CONFIGURATORS"
        title="Size it yourself, before anybody quotes you"
        intro="Four rule based calculators. Everything runs in your browser, every rule lives in a data file you could audit, and every output is labelled preliminary because that is what it is."
        trail={[{ label: 'Home', to: '/' }, { label: 'Configurators' }]}
      />

      {/* Tabs */}
      <div className="sticky top-[88px] z-30 border-b border-rule bg-page">
        <Container className="py-3">
          <div role="tablist" aria-label="Configurators" className="flex flex-wrap gap-2">
            {tabs.map((item) => {
              const active = tab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  id={`tab-${item.id}`}
                  aria-selected={active}
                  aria-controls={`panel-${item.id}`}
                  onClick={() => setTab(item.id)}
                  className={`min-h-11 cursor-pointer rounded-md border px-4 py-2 text-sm font-semibold transition-[border-color,background-color,color,box-shadow] duration-150 ease-(--ease-out) active:scale-[0.97] ${
                    active
                      ? 'border-signal-orange bg-signal-orange/15 text-ink ring-1 ring-signal-orange/30'
                      : 'border-rule bg-sunk/70 text-ink-muted hoverable:hover:border-rule-strong hoverable:hover:bg-hover hoverable:hover:text-ink'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </Container>
      </div>

      {tab === 'plc' && <PlcConfigurator />}
      {tab === 'io' && <IoCalculator />}
      {tab === 'panel' && <PanelConfigurator />}
      {tab === 'hmi' && <HmiConfigurator />}

      <PageSection tone="card">
        <div className="rounded-xl border border-signal-orange/30 bg-card border-l-4 border-l-signal-orange p-8 text-center shadow-(--shadow-e2) md:p-10">
          <h2 className="display text-2xl font-bold md:text-3xl">
            Turn this into a requirement
          </h2>
          <p className="mx-auto mt-3 max-w-[560px] text-base text-ink-muted">
            The configurator results carry into the RFQ summary and the preliminary bill of
            materials alongside your wizard answers.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/configure"
              className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-signal-orange px-5 py-2.5 text-base font-semibold text-on-signal transition-[gap,background-color] duration-150 hoverable:hover:gap-3 hoverable:hover:bg-signal-orange-hover"
            >
              Open the wizard
              <ArrowRight size={18} weight="bold" aria-hidden="true" />
            </Link>
            <Link
              to="/rfq"
              className="inline-flex min-h-11 items-center rounded-sm border border-rule-strong bg-card px-5 py-2.5 text-base font-semibold text-ink transition-colors duration-150 hoverable:hover:border-ink-faint hoverable:hover:bg-hover"
            >
              View RFQ summary
            </Link>
          </div>
        </div>
      </PageSection>
      <NotSureBand compact />
    </>
  )
}

/* ------------------------------------------------------------------
   PLC configurator
   ------------------------------------------------------------------ */

function PlcConfigurator() {
  const { draft, setAnswer } = useRequirement()
  const reuse = draft.answers.reuseExisting === 'Yes'

  return (
    <div role="tabpanel" id="panel-plc" aria-labelledby="tab-plc">
      <PageSection
        label="PLC CONFIGURATOR"
        title="Controller preference, capability and what you already own"
        intro="Brand preference is a genuine question, not a sales one: an existing spares holding or an in-house programmer is usually a better reason to pick a platform than a datasheet."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1)">
            <h3 className="font-mono text-xs font-bold tracking-wide text-ink-faint">BRAND PREFERENCE</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {plcBrands.map((brand) => {
                const on = draft.answers.plcBrand === brand
                return (
                  <button
                    key={brand}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setAnswer('plcBrand', on ? '' : brand)}
                    className={`min-h-11 cursor-pointer rounded-md border px-3.5 py-2 text-sm font-medium transition-[border-color,background-color,color,box-shadow] duration-150 active:scale-[0.97] ${
                      on
                        ? 'border-signal-orange bg-signal-orange/15 text-ink ring-1 ring-signal-orange/30'
                        : 'border-rule bg-sunk/70 text-ink-muted hoverable:hover:border-rule-strong hoverable:hover:bg-hover hoverable:hover:text-ink'
                    }`}
                  >
                    {brand}
                  </button>
                )
              })}
            </div>

            <h3 className="mt-8 font-mono text-xs font-bold tracking-wide text-ink-faint">PROTOCOLS REQUIRED</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {plcProtocols.map((protocol) => {
                const selected = (draft.answers.plcProtocols ?? '').split(',').filter(Boolean)
                const on = selected.includes(protocol)
                return (
                  <button
                    key={protocol}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setAnswer(
                        'plcProtocols',
                        (on ? selected.filter((p) => p !== protocol) : [...selected, protocol]).join(','),
                      )
                    }
                    className={`min-h-11 cursor-pointer rounded-md border px-3.5 py-2 font-mono text-xs transition-[border-color,background-color,color,box-shadow] duration-150 active:scale-[0.97] ${
                      on
                        ? 'border-process-green/60 bg-process-green/15 text-process-ink'
                        : 'border-rule bg-sunk/70 text-ink-muted hoverable:hover:border-rule-strong hoverable:hover:bg-hover'
                    }`}
                  >
                    {protocol}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1)">
              <h3 className="font-mono text-xs font-bold tracking-wide text-ink-faint">CAPABILITIES</h3>
              <ul className="mt-4 space-y-2.5" role="list">
                {plcCapabilities.map((capability) => (
                  <li key={capability.id} className="flex items-start gap-3 text-sm">
                    <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-process-cyan" />
                    <span>
                      <span className="font-semibold text-ink">{capability.label}</span>
                      <span className="block text-xs text-ink-faint">{capability.blurb}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t border-rule pt-4 text-xs text-ink-faint">
                Counts for each of these come from the I/O calculator rather than being entered twice.
              </p>
            </div>

            <div
              className={`rounded-xl border p-6 shadow-(--shadow-e1) transition-colors ${
                reuse ? 'border-process-green/40 bg-process-green/8' : 'border-rule bg-card'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-mono text-xs font-bold tracking-wide text-ink-faint">
                  REUSE EXISTING INFRASTRUCTURE
                </h3>
                <button
                  type="button"
                  aria-pressed={reuse}
                  onClick={() => setAnswer('reuseExisting', reuse ? 'No' : 'Yes')}
                  className={`min-h-11 cursor-pointer rounded-md border px-3.5 py-2 font-mono text-xs font-semibold transition-[border-color,background-color,color,box-shadow] duration-150 active:scale-[0.97] ${
                    reuse
                      ? 'border-process-green/60 bg-process-green/20 text-process-ink'
                      : 'border-rule bg-sunk text-ink-muted hoverable:hover:border-rule-strong'
                  }`}
                >
                  {reuse ? 'ENABLED' : 'ENABLE'}
                </button>
              </div>
              <p className="mt-2.5 text-sm text-ink-muted">
                Equipment that is fit for purpose stays. Declaring it here keeps it out of the bill
                of materials rather than quietly replacing it.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {existingInfrastructure.map((item) => {
                  const on = draft.answers[item.id] === 'Yes'
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setAnswer(item.id, on ? 'No' : 'Yes')}
                      className={`min-h-11 cursor-pointer rounded-md border px-3 py-2 text-left text-sm transition-[border-color,background-color,color,box-shadow] duration-150 active:scale-[0.97] ${
                        on
                          ? 'border-process-green/50 bg-process-green/10 text-ink'
                          : 'border-rule bg-sunk/60 text-ink-muted hoverable:hover:border-rule-strong hoverable:hover:bg-hover'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`mr-2 inline-block size-1.5 rounded-full ${on ? 'bg-process-green' : 'bg-rule-strong'}`}
                      />
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </PageSection>
    </div>
  )
}

/* ------------------------------------------------------------------
   I/O calculator
   ------------------------------------------------------------------ */

function IoCalculator() {
  const { draft, setQuantity, setSparePercent, io } = useRequirement()

  const rows = [
    { key: 'di' as const, label: 'Digital Inputs', size: moduleSize.di },
    { key: 'do' as const, label: 'Digital Outputs', size: moduleSize.do },
    { key: 'ai' as const, label: 'Analog Inputs', size: moduleSize.ai },
    { key: 'ao' as const, label: 'Analog Outputs', size: moduleSize.ao },
    { key: 'relay' as const, label: 'Relay Outputs', size: moduleSize.relay },
  ]

  const anyDevices = Object.values(draft.quantities).some((q) => q > 0)

  return (
    <div role="tabpanel" id="panel-io" aria-labelledby="tab-io">
      <PageSection
        label="AUTOMATIC I/O CALCULATOR"
        title="Count the devices, get the I/O"
        intro="Each device type carries a fixed I/O signature. Enter how many of each you have and the counts follow, with an engineering spare you control and a rounding to whole modules, because you buy cards rather than points."
      >
        <div className="mb-8">
          <Notice tone="caution" title="PRELIMINARY ENGINEERING ESTIMATE">
            {IO_DISCLAIMER} The counts below are arithmetic from the rules in the table. A final I/O
            schedule comes out of detailed engineering, where signal types, isolation, spare
            philosophy and card availability are all resolved.
          </Notice>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start">
          {/* Device counts */}
          <div className="overflow-hidden rounded-xl border border-rule bg-card shadow-(--shadow-e1)">
            <div className="border-b border-rule bg-sunk/80 px-5 py-3 font-mono text-xs font-semibold tracking-wide text-ink-faint">
              DEVICE COUNTS
            </div>
            <ul role="list">
              {ioRules.map((rule) => {
                const qty = draft.quantities[rule.id] ?? 0
                return (
                  <li
                    key={rule.id}
                    className={`flex flex-wrap items-center justify-between gap-4 border-b border-rule px-5 py-3.5 transition-colors last:border-b-0 ${
                      qty > 0 ? 'bg-hover/40' : 'hoverable:hover:bg-hover/25'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <label htmlFor={`qty-${rule.id}`} className="text-sm font-semibold text-ink">
                        {rule.label}
                      </label>
                      <p className="mt-0.5 text-xs text-ink-faint">{rule.reason}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        aria-label={`Decrease ${rule.label}`}
                        onClick={() => setQuantity(rule.id, qty - 1)}
                        className="flex size-11 cursor-pointer items-center justify-center rounded-md border border-rule bg-sunk text-ink transition-colors duration-150 hoverable:hover:border-signal-orange hoverable:hover:text-signal-ink active:scale-95"
                      >
                        <Minus size={14} weight="bold" aria-hidden="true" />
                      </button>
                      <input
                        id={`qty-${rule.id}`}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={qty}
                        onChange={(event) => setQuantity(rule.id, Number(event.target.value) || 0)}
                        className="readout h-11 w-16 rounded-md border border-rule bg-sunk text-center font-mono text-base font-bold text-ink transition-colors focus:border-signal-orange"
                      />
                      <button
                        type="button"
                        aria-label={`Increase ${rule.label}`}
                        onClick={() => setQuantity(rule.id, qty + 1)}
                        className="flex size-11 cursor-pointer items-center justify-center rounded-md border border-rule bg-sunk text-ink transition-colors duration-150 hoverable:hover:border-signal-orange hoverable:hover:text-signal-ink active:scale-95"
                      >
                        <Plus size={14} weight="bold" aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Results */}
          <div className="space-y-6 lg:sticky lg:top-32">
            <div className="rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e2)">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-mono text-xs font-bold tracking-wide text-ink-faint">I/O RESULT</h3>
                <span className="inline-flex items-center gap-1.5 rounded-sm border border-amber-glow/30 bg-amber-glow/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-amber-glow">
                  PRELIMINARY
                </span>
              </div>

              <div className="mt-5">
                <label htmlFor="spare" className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-semibold text-ink">Engineering spare</span>
                  <span className="readout font-mono text-lg font-bold text-signal-ink">
                    {draft.sparePercent}%
                  </span>
                </label>
                <p className="mt-1 text-xs text-ink-faint">
                  Applied before rounding. Twenty percent is a common starting point; your own
                  standard may differ.
                </p>
                <input
                  id="spare"
                  type="range"
                  min={0}
                  max={50}
                  step={5}
                  value={draft.sparePercent}
                  onChange={(event) => setSparePercent(Number(event.target.value))}
                  className="mt-3 h-11 w-full cursor-pointer accent-[var(--color-signal-orange)]"
                />
              </div>

              <table className="mt-6 w-full text-left text-sm">
                <caption className="sr-only">Required and recommended I/O counts</caption>
                <thead>
                  <tr className="border-b border-rule font-mono text-[11px] tracking-wide text-ink-faint">
                    <th scope="col" className="pb-2 font-semibold">Type</th>
                    <th scope="col" className="pb-2 text-right font-semibold">Req</th>
                    <th scope="col" className="pb-2 text-right font-semibold">Rec</th>
                    <th scope="col" className="pb-2 text-right font-semibold">Diff</th>
                    <th scope="col" className="pb-2 text-right font-semibold">Cards</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const required = io.required[row.key]
                    const recommended = io.recommended[row.key]
                    const diff = recommended - required
                    return (
                      <tr key={row.key} className="border-b border-rule last:border-b-0">
                        <th scope="row" className="py-2.5 text-sm font-semibold text-ink">
                          {row.label}
                        </th>
                        <td className="readout py-2.5 text-right font-mono text-ink-muted">{required}</td>
                        <td className="readout py-2.5 text-right font-mono font-bold text-signal-ink">
                          {recommended}
                        </td>
                        <td className="readout py-2.5 text-right font-mono text-xs text-process-ink">
                          {diff > 0 ? `+${diff}` : diff}
                        </td>
                        <td className="readout py-2.5 text-right font-mono text-xs text-ink-faint">
                          {cardCount(recommended, row.size)}
                        </td>
                      </tr>
                    )
                  })}
                  <tr>
                    <th scope="row" className="py-2.5 text-sm font-semibold text-ink">
                      Comm. nodes
                    </th>
                    <td className="readout py-2.5 text-right font-mono text-ink-muted">{io.required.comms}</td>
                    <td className="readout py-2.5 text-right font-mono font-bold text-signal-ink">
                      {io.recommended.comms}
                    </td>
                    <td className="py-2.5 text-right font-mono text-xs text-ink-faint">—</td>
                    <td className="py-2.5 text-right font-mono text-xs text-ink-faint">—</td>
                  </tr>
                </tbody>
              </table>

              {!anyDevices && (
                <p className="mt-5 rounded-md border border-dashed border-rule bg-sunk/60 p-4 text-center text-sm text-ink-faint">
                  No devices entered yet. Add a count on the left and the I/O follows.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <IoTopology recommended={io.recommended} />
        </div>
      </PageSection>
    </div>
  )
}

/* ------------------------------------------------------------------
   Control panel configurator
   ------------------------------------------------------------------ */

const componentGroups = [
  {
    title: 'SWITCHGEAR & INCOMER PROTECTION',
    items: ['mccb', 'mcb', 'surge'],
  },
  {
    title: 'AUTOMATION & LOGIC CONTROL',
    items: ['plc', 'hmi', 'smps', 'safetyRelay', 'relayModules'],
  },
  {
    title: 'MOTOR STARTERS & SWITCHING',
    items: ['contactors', 'overload'],
  },
  {
    title: 'INDUSTRIAL NETWORKING & TELEMETRY',
    items: ['switch', 'gateway', 'ups'],
  },
  {
    title: 'AUXILIARIES, CLIMATE & ENCLOSURE SAFETY',
    items: ['fan', 'heater', 'lighting', 'doorSwitch', 'estop', 'terminals'],
  },
]

function PanelConfigurator() {
  const { draft, setPanelField, togglePanelComponent, enclosure } = useRequirement()
  const componentMap = new Map(panelComponents.map((c) => [c.id, c]))

  const floorStanding = enclosure.height >= 1200

  return (
    <div role="tabpanel" id="panel-panel" aria-labelledby="tab-panel">
      <PageSection
        label="DESIGN YOUR CONTROL PANEL"
        title="Supply, components and enclosure sizing"
        intro="An interactive preliminary engineering tool. Select your electrical supply characteristics, switchgear, automation modules, and enclosure requirements to see the calculated dimensions and general arrangement layout in real-time."
      >
        {/* Hub Link Banner */}
        <div className="mb-8 rounded-xl border border-rule bg-card p-4 shadow-(--shadow-e1) border-l-4 border-l-signal-orange">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-signal-ink">
                STANDALONE ENGINEERING SECTION
              </span>
              <p className="mt-0.5 text-sm font-semibold text-ink">
                Looking for detailed panel types, fabrication standards, or FAT protocols?
              </p>
            </div>
            <Link
              to="/control-panels"
              className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-sm bg-signal-orange px-3.5 text-xs font-semibold text-on-signal hoverable:hover:bg-signal-orange-hover"
            >
              Open Control Panels Hub
              <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start">
          <div className="space-y-6">
            {/* Electrical Supply & Enclosure Specs */}
            <div className="rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1)">
              <h3 className="font-mono text-xs font-bold tracking-wide text-ink-faint">
                ELECTRICAL SUPPLY & ENCLOSURE RATING
              </h3>
              <div className="mt-4 space-y-5">
                {[...panelElectrical, ...panelEnclosure].map((group) => (
                  <fieldset key={group.id}>
                    <legend className="text-sm font-semibold text-ink">{group.label}</legend>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {group.options.map((option) => {
                        const on = draft.panel[group.id] === option
                        return (
                          <button
                            key={option}
                            type="button"
                            aria-pressed={on}
                            onClick={() => setPanelField(group.id, on ? '' : option)}
                            className={`min-h-10 cursor-pointer rounded-md border px-3.5 py-1.5 text-xs font-medium transition-[border-color,background-color,color,box-shadow] duration-150 active:scale-[0.97] ${
                              on
                                ? 'border-signal-orange bg-signal-orange/15 text-ink ring-1 ring-signal-orange/30 font-semibold'
                                : 'border-rule bg-sunk/70 text-ink-muted hoverable:hover:border-rule-strong hoverable:hover:bg-hover hoverable:hover:text-ink'
                            }`}
                          >
                            {option}
                          </button>
                        )
                      })}
                    </div>
                  </fieldset>
                ))}
              </div>
            </div>

            {/* Categorized Component Library */}
            <div className="rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1)">
              <div className="flex items-center justify-between border-b border-rule pb-3">
                <h3 className="font-mono text-xs font-bold tracking-wide text-ink-faint">
                  COMPONENT SELECTION ({draft.panelComponents.length} OF {panelComponents.length} SELECTED)
                </h3>
                <span className="text-xs text-ink-muted">Click to toggle</span>
              </div>

              <div className="mt-5 space-y-6">
                {componentGroups.map((group) => (
                  <div key={group.title}>
                    <h4 className="font-mono text-[11px] font-bold text-signal-ink tracking-wider mb-2.5">
                      {group.title}
                    </h4>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {group.items.map((id) => {
                        const component = componentMap.get(id)
                        if (!component) return null
                        const on = draft.panelComponents.includes(component.id)
                        return (
                          <button
                            key={component.id}
                            type="button"
                            aria-pressed={on}
                            onClick={() => togglePanelComponent(component.id)}
                            className={`min-h-11 cursor-pointer rounded-md border px-3 py-2 text-left text-xs transition-[border-color,background-color,color,box-shadow] duration-150 active:scale-[0.97] ${
                              on
                                ? 'border-signal-orange/70 bg-signal-orange/15 text-ink font-semibold ring-1 ring-signal-orange/30'
                                : 'border-rule bg-sunk/60 text-ink-muted hoverable:hover:border-rule-strong hoverable:hover:bg-hover'
                            }`}
                          >
                            <span
                              aria-hidden="true"
                              className={`mr-2 inline-block size-2 rounded-full ${on ? 'bg-signal-orange' : 'bg-rule-strong'}`}
                            />
                            {component.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: GA Elevation & Live Dimensions */}
          <div className="space-y-6 lg:sticky lg:top-32">
            <PanelElevation
              enclosure={enclosure}
              components={draft.panelComponents}
              vfdCount={draft.quantities.vfdMotor ?? 0}
            />

            <div className="rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e2)">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-mono text-xs font-bold tracking-wide text-ink-faint">
                  PRELIMINARY ENCLOSURE DIMENSIONS
                </h3>
                <span className="inline-flex items-center gap-1.5 rounded-sm border border-amber-glow/30 bg-amber-glow/10 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-glow uppercase">
                  {floorStanding ? 'Floor Standing' : 'Wall Mounted'}
                </span>
              </div>

              <dl className="mt-5 space-y-2.5 border-t border-rule pt-5">
                {[
                  { label: 'WIDTH', value: `${enclosure.width} mm` },
                  { label: 'HEIGHT', value: `${enclosure.height} mm` },
                  { label: 'DEPTH', value: `${enclosure.depth} mm` },
                  { label: 'CALCULATED VOLUME', value: `${((enclosure.width * enclosure.height * enclosure.depth) / 1e9).toFixed(2)} m³` },
                ].map((row) => (
                  <div key={row.label} className="flex items-baseline justify-between gap-3">
                    <dt className="font-mono text-[11px] text-ink-faint">{row.label}</dt>
                    <dd className="readout font-mono text-base font-bold text-signal-ink">{row.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-5 border-t border-rule pt-4 flex flex-col gap-2">
                <Link
                  to="/rfq"
                  className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-sm bg-signal-orange px-4 text-xs font-semibold text-on-signal hoverable:hover:bg-signal-orange-hover"
                >
                  Carry into RFQ Summary
                  <ArrowRight size={14} weight="bold" />
                </Link>
                <Link
                  to="/control-panels"
                  className="inline-flex min-h-9 items-center justify-center text-xs font-medium text-ink-muted hoverable:hover:text-ink hoverable:hover:underline"
                >
                  View full Control Panels engineering guide →
                </Link>
              </div>
            </div>

            <Notice tone="caution" title="THIS IS NOT A FINAL SPECIFICATION">
              {ENCLOSURE_DISCLAIMER}
            </Notice>
          </div>
        </div>
      </PageSection>

      <PageSection
        tone="card"
        label="PANEL ENGINEERING WORKFLOW"
        title="Sixteen steps between your requirement and an AMC"
        intro="Every panel goes through all of these. The ones people skip are the drawings, which is exactly why a panel becomes unmaintainable two years later."
      >
        <div className="rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1) md:p-8">
          <FlowRail
            items={panelWorkflowSteps.map((label, index) => ({
              id: label,
              label,
              tag: String(index + 1).padStart(2, '0'),
            }))}
          />
        </div>
      </PageSection>
    </div>
  )
}

/* ------------------------------------------------------------------
   HMI configurator
   ------------------------------------------------------------------ */

function HmiConfigurator() {
  const { draft, setAnswer, toggleHmiScreen } = useRequirement()

  return (
    <div role="tabpanel" id="panel-hmi" aria-labelledby="tab-hmi">
      <PageSection
        label="HMI CONFIGURATOR"
        title="Screen size, and what goes on the screens"
        intro="Written for the person on the night shift. The overview screen is the one they leave up all shift, so it is the one worth arguing about."
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div className="rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1)">
            <h3 className="font-mono text-xs font-bold tracking-wide text-ink-faint">SCREEN SIZE</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {hmiSizes.map((size) => {
                const on = draft.answers.hmiSize === size
                return (
                  <button
                    key={size}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setAnswer('hmiSize', on ? '' : size)}
                    className={`min-h-11 cursor-pointer rounded-md border px-4 py-2 text-sm font-medium transition-[border-color,background-color,color,box-shadow] duration-150 active:scale-[0.97] ${
                      on
                        ? 'border-signal-orange bg-signal-orange/15 text-ink ring-1 ring-signal-orange/30'
                        : 'border-rule bg-sunk/70 text-ink-muted hoverable:hover:border-rule-strong hoverable:hover:bg-hover hoverable:hover:text-ink'
                    }`}
                  >
                    {size}
                  </button>
                )
              })}
            </div>
            <p className="mt-5 border-t border-rule pt-4 text-sm text-ink-muted">
              Larger is not automatically better. A 15 inch screen showing four numbers wastes the
              panel door; a 4.3 inch screen carrying an alarm list wastes the operator's time.
            </p>
          </div>

          <div className="rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1)">
            <h3 className="font-mono text-xs font-bold tracking-wide text-ink-faint">
              SCREENS ({draft.hmiScreens.length} SELECTED)
            </h3>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3" role="list">
              {hmiScreens.map((screen) => {
                const on = draft.hmiScreens.includes(screen.id)
                return (
                  <li key={screen.id}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleHmiScreen(screen.id)}
                      className={`w-full cursor-pointer overflow-hidden rounded-md border text-left transition-[border-color,background-color,color,box-shadow] duration-150 active:scale-[0.98] ${
                        on
                          ? 'border-signal-orange/60 bg-signal-orange/8 ring-1 ring-signal-orange/25'
                          : 'border-rule bg-sunk/60 hoverable:hover:border-rule-strong hoverable:hover:bg-hover'
                      }`}
                    >
                      <span className="block px-2.5 pt-2.5">
                        <HmiScreenPreview id={screen.id} active={on} />
                      </span>
                      <span className="block p-3">
                        <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                          <span
                            aria-hidden="true"
                            className={`size-1.5 shrink-0 rounded-full ${on ? 'bg-signal-orange' : 'bg-rule-strong'}`}
                          />
                          {screen.label}
                        </span>
                        <span className="mt-1 block text-xs text-ink-faint">{screen.blurb}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </PageSection>
    </div>
  )
}
