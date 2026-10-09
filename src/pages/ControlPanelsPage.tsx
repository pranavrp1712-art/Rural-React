import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle,
  Cpu,
  Gauge,
  Lightning,
  ShieldCheck,
  Sliders,
  Wrench,
} from '@phosphor-icons/react'
import { Notice, PageHeader, PageSection, SpecTable } from '../components/pageKit'
import { Container, Reveal } from '../components/primitives'
import { usePageMeta } from '../lib/usePageMeta'
import { PanelElevation } from '../components/diagrams/PanelElevation'
import { estimateEnclosure, panelWorkflowSteps } from '../data/configurators'
import { NotSureBand } from '../components/StartPaths'

const panelTypes = [
  {
    id: 'plc-automation',
    title: 'PLC & Automation Panels',
    icon: Cpu,
    tag: 'CONTROL & LOGIC',
    summary:
      'Engineered for automated manufacturing, water processing, and agricultural machinery. Integrated with industrial PLCs, 24 VDC switch-mode power supplies, interposing relay modules, and segregated communication channels.',
    features: [
      'Configured with Siemens, Schneider, Mitsubishi or Delta PLCs',
      'Optocoupled digital & analog I/O terminal segregation',
      'Regulated 24 V DC SMPS with battery backup UPS options',
      'Industrial Ethernet & RS485 Modbus RTU telemetry',
    ],
    standard: 'IEC 61439-1/2',
  },
  {
    id: 'mcc-starter',
    title: 'Motor Control Centers (MCC)',
    icon: Lightning,
    tag: 'POWER DISTRIBUTION',
    summary:
      'Robust power distribution and motor starting panels up to 415 V, 3-phase. Designed with high breaking capacity MCCB incomers, busbar chambers, direct-on-line (DOL) and Star-Delta starters with electronic overload protection.',
    features: [
      'Electrolytic copper busbars sized with 1.5 A/mm² density',
      'Phase failure, phase reversal & under-voltage relays',
      'Direct-on-line (DOL) and automatic Star-Delta starters',
      'Class 10/20 thermal overload & short-circuit protection',
    ],
    standard: 'IS/IEC 60947-4-1',
  },
  {
    id: 'vfd-drives',
    title: 'VFD & Drive Cubicles',
    icon: Gauge,
    tag: 'SPEED & TORQUE CONTROL',
    summary:
      'Variable Frequency Drive control panels for pumps, blowers, agitators, and conveyor systems. Features thermal dissipation channels, input line chokes, harmonic filters, and manual drive-bypass switchgear.',
    features: [
      'Dedicated forced ventilation with thermostatic louvers & filters',
      'Line & load reactors for motor cable runs over 50 meters',
      'Manual DOL bypass contactor arrangement for critical loads',
      'Door-mounted digital keypad and frequency potentiometer',
    ],
    standard: 'IEC 61800-3',
  },
  {
    id: 'outdoor-weatherproof',
    title: 'Weatherproof & Solar Field Panels',
    icon: ShieldCheck,
    tag: 'HARSH & OUTDOOR',
    summary:
      'Ingress-protected enclosures designed for solar drying, agricultural irrigation, and wastewater plants exposed to dust, moisture, and extreme ambient heat.',
    features: [
      'IP65 / IP66 rated polyurethane continuous gasket sealing',
      'SS 304 or 2mm CRCA with 7-tank powder-coated RAL 7035',
      'Dual-canopy sun radiation roof & internal anticondensation heater',
      'Padlockable heavy-duty 3-point door latching mechanism',
    ],
    standard: 'IEC 60529 (IP66)',
  },
]

const workflowPhases = [
  {
    phase: 'Phase 1: Design & Engineering',
    steps: panelWorkflowSteps.slice(0, 7),
    deliverables: ['Load calculation sheet', 'Single line diagram (SLD)', 'Schematics & GA drawing', 'BOM with part codes'],
    holdPoint: 'Customer sign-off on Schematics & GA layout before cutting steel',
  },
  {
    phase: 'Phase 2: Fabrication & Wiring',
    steps: panelWorkflowSteps.slice(7, 9),
    deliverables: ['Laser cut & CNC bent enclosure', '7-tank powder coating (70-80 microns)', 'Numbered ferruled wiring with wire ducts'],
    holdPoint: 'Internal quality check for torque tightness and wiring aesthetics',
  },
  {
    phase: 'Phase 3: Automation & Logic',
    steps: panelWorkflowSteps.slice(9, 11),
    deliverables: ['PLC program backup (Ladder/FBD)', 'HMI dynamic graphics & alarm screens', 'I/O tag list with memory maps'],
    holdPoint: 'Dry simulation of sequence and interlock trip conditions',
  },
  {
    phase: 'Phase 4: Inspection & FAT',
    steps: panelWorkflowSteps.slice(11, 13),
    deliverables: ['High voltage insulation test record', 'Point-to-point continuity report', 'Live Factory Acceptance Test (FAT) certificate'],
    holdPoint: 'Customer witnessed FAT or video inspection sign-off before dispatch',
  },
  {
    phase: 'Phase 5: Site Commissioning & AMC',
    steps: panelWorkflowSteps.slice(13, 16),
    deliverables: ['As-built CAD drawing pack (PDF & DWG)', 'Laminated door pocket schematics', '12-month warranty & AMC schedule'],
    holdPoint: 'Final site handover certificate after 72-hour trial run',
  },
]

export default function ControlPanelsPage() {
  usePageMeta({
    title: 'Industrial Control Panels — Design, Fabrication & Engineering',
    description:
      'Custom industrial control panels engineered from single-line schematics to Factory Acceptance Testing (FAT). PLC automation panels, Motor Control Centers (MCC), VFD cubicles, and weatherproof enclosures built to IEC 61439.',
    path: '/control-panels',
  })

  const [activeTab, setActiveTab] = useState<'overview' | 'types' | 'standards' | 'workflow'>('overview')

  // Sample enclosure preview for the GA layout showcase
  const sampleEnclosure = estimateEnclosure({
    ioPoints: 32,
    motorCount: 2,
    vfdCount: 1,
    hasHmi: true,
    hasUps: true,
  })

  return (
    <>
      <PageHeader
        label="CONTROL PANEL ENGINEERING"
        title="Custom Industrial Control Panels"
        intro="Control panels engineered from load schedules and process requirements rather than assembled from rigid templates. Every panel ships with as-built drawings, ferruled wiring, factory acceptance testing, and a drawing set you own."
        trail={[{ label: 'Home', to: '/' }, { label: 'Control Panels' }]}
        aside={
          <div className="flex flex-col items-start gap-2.5 rounded-lg border border-band-rule bg-band-raised/70 p-4">
            <span className="font-mono text-[11px] tracking-wide text-band-ink-faint">COMPLIANCE & STANDARDS</span>
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-xs border border-rule/30 bg-card/10 px-2 py-0.5 font-mono text-[11px] text-ink font-semibold">
                IEC 61439-1/2
              </span>
              <span className="rounded-xs border border-rule/30 bg-card/10 px-2 py-0.5 font-mono text-[11px] text-ink font-semibold">
                IP54 — IP66
              </span>
              <span className="rounded-xs border border-rule/30 bg-card/10 px-2 py-0.5 font-mono text-[11px] text-ink font-semibold">
                CE / UL 508A
              </span>
            </div>
          </div>
        }
      />

      {/* Subnav Navigation Bar */}
      <div className="sticky top-[88px] z-30 border-b border-rule bg-page/95 backdrop-blur-sm">
        <Container className="py-2.5">
          <nav aria-label="Control panel sections" className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'overview', label: 'Capabilities' },
                { id: 'types', label: 'Panel Types' },
                { id: 'standards', label: 'Standards & Specs' },
                { id: 'workflow', label: '16-Step Workflow' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id as typeof activeTab)
                    const el = document.getElementById(tab.id)
                    if (el) el.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className={`min-h-10 cursor-pointer rounded-md border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                    activeTab === tab.id
                      ? 'border-signal-orange bg-signal-orange/15 text-ink ring-1 ring-signal-orange/30'
                      : 'border-rule bg-card text-ink-muted hoverable:hover:bg-hover hoverable:hover:text-ink'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/configurators?tab=panel"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-sm bg-signal-orange px-3.5 py-1.5 text-xs font-semibold text-on-signal transition-colors hoverable:hover:bg-signal-orange-hover"
              >
                <Sliders size={15} weight="bold" />
                Launch Panel Designer
              </Link>
            </div>
          </nav>
        </Container>
      </div>

      {/* Overview & Value Proposition */}
      <PageSection id="overview" label="ENGINEERING PRINCIPLE" title="Why RuralReact builds panels differently">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1) lg:col-span-2">
            <h3 className="text-xl font-bold text-ink">Built against process reality, not catalogue templates</h3>
            <p className="mt-3 text-base leading-relaxed text-ink-muted">
              Most panel builders take a standard box, mount switchgear where it fits, and leave wiring undocumented.
              Two years down the road, when a maintenance engineer opens the enclosure at 2 AM, there are no wire ferrules,
              no laminated drawings in the door pocket, and no thermal clearance for the drive.
            </p>
            <p className="mt-3 text-base leading-relaxed text-ink-muted">
              RuralReact approaches panel manufacturing as an integrated automation discipline: we calculate actual connected
              loads, factor in 20% engineering spare capacity on both I/O terminals and busbars, verify heat dissipation,
              and test every interlock before the panel leaves the assembly bay.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3 border-t border-rule pt-6">
              <div>
                <span className="font-mono text-xs font-bold text-signal-ink">100% FERULED</span>
                <p className="mt-1 text-xs text-ink-muted">Every wire numbered matching CAD schematics</p>
              </div>
              <div>
                <span className="font-mono text-xs font-bold text-signal-ink">FAT WITNESSED</span>
                <p className="mt-1 text-xs text-ink-muted">Live test run with full sequence simulation</p>
              </div>
              <div>
                <span className="font-mono text-xs font-bold text-signal-ink">DRAWINGS YOU KEEP</span>
                <p className="mt-1 text-xs text-ink-muted">PDF & DWG source electrical schematics included</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1)">
              <span className="font-mono text-xs font-bold tracking-wide text-ink-faint">RAPID ESTIMATION</span>
              <h4 className="mt-2 text-base font-bold text-ink">Preliminary Sizing Studio</h4>
              <p className="mt-2 text-sm text-ink-muted">
                Calculate enclosure dimensions, incomer amps, and heat generation directly in your browser.
              </p>
              <Link
                to="/configurators?tab=panel"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-signal-ink hoverable:hover:underline"
              >
                Configure panel in 2 minutes →
              </Link>
            </div>

            <div className="rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1)">
              <span className="font-mono text-xs font-bold tracking-wide text-ink-faint">PRODUCT SPEC SHEET</span>
              <h4 className="mt-2 text-base font-bold text-ink">Custom Industrial Control Panel</h4>
              <p className="mt-2 text-sm text-ink-muted">
                Inspect the standard product specification, bill of materials structure, and options.
              </p>
              <Link
                to="/products/custom-industrial-control-panel"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-signal-ink hoverable:hover:underline"
              >
                Open product detail sheet →
              </Link>
            </div>
          </div>
        </div>
      </PageSection>

      {/* Panel Types & Categories */}
      <PageSection tone="card" id="types" label="PANEL CATEGORIES" title="Specialized enclosures for every factory zone">
        <div className="grid gap-6 md:grid-cols-2">
          {panelTypes.map((panel, idx) => {
            const IconComp = panel.icon
            return (
              <Reveal key={panel.id} delay={idx * 80} variant="scale">
                <div className="group relative flex h-full flex-col justify-between rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1) transition-[border-color,box-shadow] duration-200 hoverable:hover:border-signal-orange/40 hoverable:hover:shadow-(--shadow-e2)">
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-9 items-center justify-center rounded-md border border-rule bg-sunk text-signal-ink">
                          <IconComp size={20} weight="bold" />
                        </div>
                        <span className="font-mono text-[11px] font-bold tracking-wider text-ink-faint">{panel.tag}</span>
                      </div>
                      <span className="rounded-xs border border-rule bg-sunk px-2 py-0.5 font-mono text-[10px] font-semibold text-ink-muted">
                        {panel.standard}
                      </span>
                    </div>

                    <h3 className="mt-4 text-xl font-bold text-ink">{panel.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">{panel.summary}</p>

                    <h4 className="mt-4 font-mono text-xs font-bold tracking-wide text-ink-faint">KEY SPECIFICATIONS</h4>
                    <ul className="mt-2.5 space-y-1.5" role="list">
                      {panel.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2 text-xs text-ink-muted">
                          <CheckCircle size={15} weight="fill" className="mt-0.5 shrink-0 text-process-green" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 border-t border-rule pt-4 flex items-center justify-between">
                    <Link
                      to="/configurators?tab=panel"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-signal-ink hoverable:hover:underline"
                    >
                      Size this panel type
                      <ArrowRight size={14} weight="bold" />
                    </Link>
                    <Link
                      to="/consult"
                      className="text-xs font-medium text-ink-muted hoverable:hover:text-ink hoverable:hover:underline"
                    >
                      Consult an engineer
                    </Link>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </PageSection>

      {/* General Arrangement (GA) CAD & Elevation Showcase */}
      <PageSection id="ga-layout" label="CAD & GENERAL ARRANGEMENT" title="Engineered layout and clear segregation">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start">
          <div className="rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1)">
            <PanelElevation
              enclosure={sampleEnclosure}
              components={['mccb', 'mcb', 'smps', 'plc', 'relayModules', 'terminals', 'switch', 'fan']}
              vfdCount={1}
            />
          </div>

          <div className="space-y-5">
            <div className="rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1)">
              <h3 className="text-lg font-bold text-ink">Segregation & Thermal Best Practices</h3>
              <ul className="mt-3.5 space-y-3 text-sm text-ink-muted" role="list">
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-xs font-bold text-signal-ink">01</span>
                  <div>
                    <strong className="text-ink">Power & Control Separation:</strong> High voltage 415 V supply and motor
                    feeders run along dedicated right-hand trunking; 24 V DC control and sensitive analog signals stay on the left.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-xs font-bold text-signal-ink">02</span>
                  <div>
                    <strong className="text-ink">DIN Rail Spacing:</strong> Minimum 150 mm spacing between parallel rails ensures
                    adequate finger clearance, wire duct access, and airflow.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-xs font-bold text-signal-ink">03</span>
                  <div>
                    <strong className="text-ink">Thermal Airflow:</strong> Heat-dissipating units (VFDs, large transformers,
                    SMPS) are placed with required manufacturer clearances and top exhaust fans.
                  </div>
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-signal-orange/30 bg-card border-l-4 border-l-signal-orange p-6 shadow-(--shadow-e1)">
              <h4 className="font-mono text-xs font-bold tracking-wide text-signal-ink">TRY OUR SIZING ENGINE</h4>
              <p className="mt-2 text-sm text-ink-muted">
                Add or remove VFDs, motors, PLC I/O cards, and check how the preliminary dimensions shift in real-time.
              </p>
              <Link
                to="/configurators?tab=panel"
                className="mt-4 inline-flex items-center gap-1.5 rounded-sm bg-signal-orange px-4 py-2 text-xs font-semibold text-on-signal transition-colors hoverable:hover:bg-signal-orange-hover"
              >
                Launch Live GA Sizer
                <ArrowRight size={14} weight="bold" />
              </Link>
            </div>
          </div>
        </div>
      </PageSection>

      {/* Specifications & Fabrication Standards Table */}
      <PageSection tone="card" id="standards" label="FABRICATION STANDARDS" title="Manufacturing & materials specification">
        <div className="grid gap-6 lg:grid-cols-2">
          <SpecTable
            caption="ENCLOSURE & SHEET METAL"
            rows={[
              { label: 'Sheet metal thickness', value: '1.6 mm doors & covers, 2.0 mm gland plates & load gear trays' },
              { label: 'Base frame / plinth', value: '50 mm or 100 mm ISMC channel base frame, pre-punched for floor anchors' },
              { label: 'Surface treatment', value: '7-tank chemical pre-treatment with phosphating' },
              { label: 'Powder coating', value: 'Pure polyester electrostatically applied, 70 to 80 microns thickness' },
              { label: 'Standard color', value: 'RAL 7035 (Structure finish) or customer specified shade' },
              { label: 'Gasket type', value: 'Continuous CNC-poured polyurethane (PU) foam gasket' },
            ]}
          />

          <SpecTable
            caption="BUSBARS, WIRING & TESTING"
            rows={[
              { label: 'Busbar material', value: 'EC grade copper, rated at 1.5 A/mm² with heat shrinkable color PVC sleeving' },
              { label: 'Wire specifications', value: 'FRLS multi-strand copper flexible wire (1100 V grade, IS 694)' },
              { label: 'Color coding', value: 'R-Y-B phases, Black neutral, Red/Black DC, Grey analog, Green/Yellow earth' },
              { label: 'Wire marking', value: 'Cross-ferruled interlocking PVC sleeves matching electrical CAD drawings' },
              { label: 'Insulation test', value: 'Tested at 500 V / 1000 V DC megger (> 100 Megaohms)' },
              { label: 'High voltage test', value: '2.5 kV AC for 1 minute between live terminals and earth bus' },
            ]}
          />
        </div>
      </PageSection>

      {/* 16-Step Engineering Workflow */}
      <PageSection id="workflow" label="PANEL LIFECYCLE" title="The 16-step panel engineering workflow">
        <div className="space-y-6">
          <Notice tone="info" title="ENGINEERING DISCIPLINE PREVENTS BREAKDOWNS">
            Every control panel built at RuralReact traverses these 16 steps. Two milestones require formal customer sign-off:
            approving electrical CAD schematics before fabrication, and witnessing the Factory Acceptance Test (FAT) before shipment.
          </Notice>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {workflowPhases.map((phaseGroup, idx) => (
              <Reveal key={phaseGroup.phase} delay={idx * 60}>
                <div className="flex h-full flex-col justify-between rounded-xl border border-rule bg-card p-5 shadow-(--shadow-e1)">
                  <div>
                    <span className="font-mono text-xs font-bold text-signal-ink">{phaseGroup.phase}</span>
                    <ol className="mt-3 space-y-1.5 border-t border-rule pt-3 text-xs text-ink" role="list">
                      {phaseGroup.steps.map((step) => (
                        <li key={step} className="flex items-center gap-2">
                          <span className="size-1.5 rounded-full bg-signal-orange" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>

                    <div className="mt-4 border-t border-rule pt-3">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">Deliverables:</span>
                      <ul className="mt-1 space-y-1 text-[11px] text-ink-muted">
                        {phaseGroup.deliverables.map((del) => (
                          <li key={del}>• {del}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 rounded-md border border-rule bg-sunk/60 p-2.5">
                    <span className="block font-mono text-[10px] font-bold text-amber-glow uppercase">Inspection Hold Point:</span>
                    <span className="mt-0.5 block text-xs text-ink-muted font-medium">{phaseGroup.holdPoint}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </PageSection>

      {/* Final Action Callout */}
      <PageSection>
        <div className="rounded-xl border border-signal-orange/30 bg-card border-l-4 border-l-signal-orange p-8 text-center shadow-(--shadow-e2) md:p-12">
          <h2 className="display text-2xl font-bold md:text-3xl text-ink">Ready to specify your control panel?</h2>
          <p className="mx-auto mt-3 max-w-[620px] text-base text-ink-muted">
            Configure your required components, drives, I/O count, and enclosure specs using our client-side sizing studio.
            We will review your single-line diagram and prepare a detailed preliminary bill of materials.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/configurators?tab=panel"
              className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-signal-orange px-6 py-2.5 text-base font-semibold text-on-signal transition-all hoverable:hover:bg-signal-orange-hover"
            >
              Open Control Panel Configurator
              <ArrowRight size={18} weight="bold" />
            </Link>
            <Link
              to="/consult"
              className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-rule-strong bg-card px-5 py-2.5 text-base font-semibold text-ink transition-colors hoverable:hover:bg-hover"
            >
              <Wrench size={18} />
              Book Technical Consultation
            </Link>
          </div>
        </div>
      </PageSection>

      <NotSureBand compact />
    </>
  )
}
