/**
 * Standards wording, OT security content and case studies. Spec 08.
 *
 * The wording rule matters more than the content here: RuralReact does
 * not claim certification against any of these standards. Every surface
 * that names one carries the "designed with reference to" qualifier.
 */

export const STANDARDS_QUALIFIER = 'Designed with reference to applicable standards'

export const CERTIFICATION_NOTE =
  'RuralReact does not claim certification against these standards. They are named because they inform how a system is designed and documented. Where verified certification documentation exists for a specific project, it is issued with that project.'

export interface StandardRef {
  code: string
  title: string
  /** What it actually governs, in plain language. */
  scope: string
  /** Where it shows up in a RuralReact system. */
  applies: string
}

export const standards: StandardRef[] = [
  {
    code: 'IEC 60204-1',
    title: 'Safety of machinery — electrical equipment of machines',
    scope: 'Electrical safety requirements for machine equipment: protection, disconnection, emergency stop and wiring practice.',
    applies: 'Panel design, emergency stop circuits, protective earthing and the wiring standard used through the enclosure.',
  },
  {
    code: 'IEC 61439',
    title: 'Low voltage switchgear and controlgear assemblies',
    scope: 'How an assembly is constructed, verified and rated, including temperature rise and short circuit withstand.',
    applies: 'Enclosure construction, busbar and incomer sizing, and the verification approach used for control panels.',
  },
  {
    code: 'IEC 61131-3',
    title: 'Programmable controllers — programming languages',
    scope: 'The standard programming languages for PLCs and how a program is structured.',
    applies: 'Controller logic is written to this practice so that the next engineer can read and maintain it.',
  },
  {
    code: 'IEC 62443',
    title: 'Industrial communication networks — security for industrial automation',
    scope: 'Security for industrial automation and control systems: zones, conduits and the boundary between OT and IT.',
    applies: 'Why the gateway publishes outbound only and why a PLC is never placed directly on a public network.',
  },
  {
    code: 'ISA-88',
    title: 'Batch control',
    scope: 'A model for structuring batch processes into procedures, unit procedures, operations and phases.',
    applies: 'How recipe driven sequencing is structured in chemical and process applications.',
  },
  {
    code: 'ISA-95',
    title: 'Enterprise control system integration',
    scope: 'A model for the boundary between plant floor control and business systems.',
    applies: 'Where the reporting layer sits relative to the control layer, and what crosses between them.',
  },
  {
    code: 'OPC UA',
    title: 'Open Platform Communications Unified Architecture',
    scope: 'A platform independent machine to machine communication standard with built in security.',
    applies: 'Available as a protocol on the gateway and on controllers that support it.',
  },
  {
    code: 'Modbus',
    title: 'Modbus RTU and Modbus TCP',
    scope: 'A widely implemented industrial protocol for reading and writing device registers.',
    applies: 'The default field protocol for instruments, meters, drives and legacy equipment integration.',
  },
]

/* ------------------------------------------------------------------
   OT security architecture. The diagram this drives must never show a
   PLC connected directly to the public internet.
   ------------------------------------------------------------------ */

export interface SecurityLayer {
  id: string
  label: string
  tag: string
  body: string
  /** Which side of the OT boundary this sits on. */
  zone: 'OT' | 'Boundary' | 'IT'
}

export const securityLayers: SecurityLayer[] = [
  {
    id: 'plc',
    label: 'PLC',
    tag: 'OT-01',
    zone: 'OT',
    body: 'Holds every interlock and control sequence. It runs the plant and it never listens on a public network.',
  },
  {
    id: 'network',
    label: 'Industrial network',
    tag: 'OT-02',
    zone: 'OT',
    body: 'The plant network: controllers, drives, meters and instruments. Segregated from any office network.',
  },
  {
    id: 'gateway',
    label: 'Edge gateway',
    tag: 'BND-03',
    zone: 'Boundary',
    body: 'Reads from the plant side and publishes upward. It is the only device that touches both sides, and it initiates every connection itself.',
  },
  {
    id: 'outbound',
    label: 'Secure outbound communication',
    tag: 'BND-04',
    zone: 'Boundary',
    body: 'Connections are opened from inside the plant outward. Nothing on the internet can open a connection inward through this path.',
  },
  {
    id: 'cloud',
    label: 'Cloud',
    tag: 'IT-05',
    zone: 'IT',
    body: 'Stores readings and serves the dashboard. Losing it costs visibility, never control.',
  },
]

export const securityPrinciples = [
  {
    title: 'The PLC is never exposed to the internet',
    body: 'There is no port forward, no public IP and no inbound service on the controller. Remote visibility is achieved by publishing outward, not by opening a door inward.',
  },
  {
    title: 'The website and the OT environment stay logically separated',
    body: 'This website has no connection to any customer plant. The demo dashboard runs on generated values in your browser.',
  },
  {
    title: 'Control survives a lost connection',
    body: 'Every interlock and sequence lives in the controller on a fixed scan. A network outage delays reporting; it never stops the plant.',
  },
  {
    title: 'Legacy equipment is integrated where technically compatible',
    body: 'Existing controllers and meters are read over the protocols they already support. Compatibility is confirmed during the requirement study rather than assumed in a proposal.',
  },
]

/* ------------------------------------------------------------------
   Case studies.

   The brief is explicit: only verified customer or project information
   may be used. Nothing is verified yet, so every entry below is
   unverified and the UI renders the mandated fallback line instead of
   invented results.
   ------------------------------------------------------------------ */

export const CASE_STUDY_FALLBACK = 'Case study details available on request.'

export interface CaseStudy {
  id: string
  /** Industry is safe to state; it describes the category, not a client. */
  industry: string
  /** The application category. Never a customer name unless verified. */
  application: string
  /**
   * False until verified customer or project information exists. While
   * false the UI shows the fallback line and no fabricated detail.
   */
  verified: boolean
  customer?: string
  problem?: string
  existingSystem?: string
  solution?: string
  sensors?: string[]
  plc?: string
  control?: string
  iiot?: string
  results?: string[]
}

export const caseStudies: CaseStudy[] = [
  { id: 'cs-etp-ph', industry: 'Water & Wastewater', application: 'ETP pH correction and dosing control', verified: false },
  { id: 'cs-stp-monitor', industry: 'Water & Wastewater', application: 'STP remote monitoring and compliance logging', verified: false },
  { id: 'cs-panel-retrofit', industry: 'Manufacturing & MSMEs', application: 'Relay logic to PLC control panel retrofit', verified: false },
  { id: 'cs-cold-chain', industry: 'Agriculture & Cold Chain', application: 'Cold storage monitoring with excursion alarms', verified: false },
  { id: 'cs-solar-dry', industry: 'Agriculture & Cold Chain', application: 'Solar drying chamber profile control', verified: false },
  { id: 'cs-energy', industry: 'Solar & Energy', application: 'Generation and feeder level energy monitoring', verified: false },
]
