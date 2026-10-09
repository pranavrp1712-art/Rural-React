/**
 * Home page content for md/main.md §3.4–3.7: the vendor-neutral
 * positioning, the three ways in, the services teaser and the
 * "not sure what you need?" band. Copy follows the brief; nothing here
 * names a customer, a metric or a certification.
 */

export const positioning = {
  statement: 'Vendor-neutral automation engineering and system integration partner.',
  intro:
    'Hardware brands are made by their manufacturers. RuralReact selects, integrates, engineers and supports them as one system for your process.',
  provides: [
    'Selection',
    'Integration',
    'Engineering',
    'Programming',
    'Panel fabrication',
    'Installation',
    'Commissioning',
    'Monitoring',
    'Support',
    'AMC',
  ],
  brands: 'Bring your own preferred brands, or let RuralReact help you select the right combination.',
  scope: 'From PLC programming to panel fabrication, from instrumentation to IIoT — RuralReact can manage the automation scope.',
  needs: [
    { need: 'Need only programming?', answer: 'We can do that.' },
    { need: 'Need only a panel?', answer: 'We can do that.' },
    { need: 'Need complete automation?', answer: 'We can manage the complete project.' },
  ],
  consult: 'Need technical consultation first? Talk to our engineering team.',
}

export interface EntryPath {
  id: 'consult' | 'configure' | 'quote'
  tag: string
  title: string
  body: string
  cta: string
  href: string
}

export const entryPaths: EntryPath[] = [
  {
    id: 'consult',
    tag: 'CONSULT',
    title: 'Talk to our engineering team first',
    body: 'Describe your process and what is going wrong. An engineer helps define the sensors, control, panel and communication before anything is specified.',
    cta: 'Book a technical consultation',
    href: '/consult',
  },
  {
    id: 'configure',
    tag: 'CONFIGURE',
    title: 'Build the requirement yourself',
    body: 'The guided wizard and configurators turn your answers into sensors, I/O count, panel size and a preliminary bill of materials.',
    cta: 'Start the requirement wizard',
    href: '/configure',
  },
  {
    id: 'quote',
    tag: 'REQUEST QUOTE',
    title: 'Already know what you need?',
    body: 'Go straight to the RFQ summary, check the scope and missing information, and send it for a quotation.',
    cta: 'Go to the RFQ summary',
    href: '/rfq',
  },
]

/** Said on every entry path: the brand decision stays with the customer. */
export const brandChoice = [
  'Supply your own brands',
  'Ask us to recommend one',
  'Keep existing equipment',
]

export interface ServiceTile {
  title: string
  body: string
  href: string
  link: string
}

export const serviceTiles: ServiceTile[] = [
  {
    title: 'Automation consulting',
    body: 'Requirement study, load calculation and an architecture for your process before any hardware is chosen.',
    href: '/consult',
    link: 'Book a consultation',
  },
  {
    title: 'PLC, HMI and SCADA programming',
    body: 'Control logic, interlocks and operator screens, on the controller brand you use or the one we select with you.',
    href: '/#workflow',
    link: 'See the engineering workflow',
  },
  {
    title: 'Control panel design and fabrication',
    body: 'Schematic, general arrangement, fabrication, wiring and factory acceptance testing.',
    href: '/configurators',
    link: 'Design your control panel',
  },
  {
    title: 'Instrumentation and sensor integration',
    body: 'Measured variables, ranges, signals and mounting, specified per sensor and wired into the control system.',
    href: '/configure',
    link: 'Configure sensors',
  },
  {
    title: 'IIoT and cloud integration',
    body: 'An outbound-only gateway, buffering and dashboards that report on the plant without becoming a dependency for running it.',
    href: '/iiot',
    link: 'IIoT architecture',
  },
  {
    title: 'Installation, commissioning and AMC',
    body: 'Site installation, loop checks, operator handover and annual maintenance on the delivered system.',
    href: '/#workflow',
    link: 'See the engineering workflow',
  },
]

export const notSure = {
  title: 'Not sure what you need?',
  body: 'Tell our automation team about your process. We can help define the sensors, PLC, HMI, panel, communication and automation architecture.',
  cta: 'Consult an Automation Engineer',
  href: '/consult',
}

/** What a consultation can cover, shown on the consultation page. */
export const consultTopics = [
  'Requirement study for a new plant or line',
  'Retrofit of existing equipment',
  'Sensor and instrument selection',
  'PLC, HMI and SCADA architecture',
  'Control panel scope',
  'IIoT and remote monitoring',
  'Compliance data and reporting',
  'A second opinion on a proposal you already have',
]
