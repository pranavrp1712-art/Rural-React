import type { ItemStatus } from './navigation'

/* ------------------------------------------------------------------
   Architecture chain: process through to analytics.
   ------------------------------------------------------------------ */

export interface ArchNode {
  id: string
  label: string
  /** Instrument style tag, mono face only. */
  tag: string
  body: string
  href: string
  hrefLabel: string
}

export const architecture: ArchNode[] = [
  {
    id: 'process',
    label: 'Process',
    tag: 'P-000',
    body: 'The tank, line, dryer or treatment stage you actually run. Everything downstream is sized from what happens here, so the requirement study starts with the process, not the catalogue.',
    href: '#industries',
    hrefLabel: 'See industries we work in',
  },
  {
    id: 'sensors',
    label: 'Sensors',
    tag: 'AIT-101',
    body: 'Instruments that turn a physical variable into a measurable signal: pH, level, flow, pressure, temperature, conductivity. Selection covers range, wetted material and mounting, not just the part number.',
    href: '#platform',
    hrefLabel: 'Sensors and instrumentation layer',
  },
  {
    id: 'transmitters',
    label: 'Transmitters',
    tag: 'AIT-101T',
    body: 'Signal conditioning and conversion to a standard industrial output such as 4 to 20 mA or RS485 Modbus, so a long cable run to the panel does not corrupt the reading.',
    href: '#platform',
    hrefLabel: 'Custom electronics layer',
  },
  {
    id: 'plc',
    label: 'PLC or controller',
    tag: 'PLC-01',
    body: 'Where the control logic lives. Interlocks, dosing sequences, pump changeover and alarm conditions run here on a deterministic scan, independent of any cloud connection.',
    href: '/configurators',
    hrefLabel: 'Size it with the I/O calculator',
  },
  {
    id: 'hmi',
    label: 'HMI or SCADA',
    tag: 'HMI-01',
    body: 'The operator view: live values, setpoints, manual overrides and the alarm list. Built with the people who run the plant on the night shift in mind.',
    href: '#platform',
    hrefLabel: 'HMI and SCADA layer',
  },
  {
    id: 'panel',
    label: 'Control panel',
    tag: 'PNL-01',
    body: 'The enclosure that holds it together: incomer, protection, feeders, drives, terminals and wiring. Built to a schematic and a general arrangement drawing, then tested before it ships.',
    href: '#panels',
    hrefLabel: 'Panel engineering workflow',
  },
  {
    id: 'gateway',
    label: 'IIoT gateway',
    tag: 'GW-01',
    body: 'A one way door out of the plant. It reads from the controller and publishes upward. The PLC is never placed directly on the internet.',
    href: '/standards',
    hrefLabel: 'Our OT security approach',
  },
  {
    id: 'cloud',
    label: 'Cloud',
    tag: 'CLD-01',
    body: 'Where readings are stored and retained so a trend can be looked at next quarter, not just this shift.',
    href: '/iiot',
    hrefLabel: 'See the demo dashboard',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    tag: 'ANL-01',
    body: 'Trends, reports and threshold alerts built on the stored data, so a drifting reading is noticed before it becomes a shutdown.',
    href: '/iiot',
    hrefLabel: 'See the demo dashboard',
  },
]

/* ------------------------------------------------------------------
   Platform: ten layers, sensor to service.
   ------------------------------------------------------------------ */

export interface PlatformLayer {
  n: number
  name: string
  summary: string
  detail: string
  points: string[]
}

export const platformLayers: PlatformLayer[] = [
  {
    n: 1,
    name: 'Sensors and instrumentation',
    summary: 'Measuring the variable that matters',
    detail:
      'The layer that decides whether everything above it is working with a real number. We select the instrument against the process conditions, not against a price list.',
    points: [
      'Measured variable, range and accuracy matched to the process',
      'Wetted material checked against the medium',
      'Mounting, isolation and serviceability considered at selection',
    ],
  },
  {
    n: 2,
    name: 'Custom electronics and PCB',
    summary: 'Purpose built boards where nothing standard fits',
    detail:
      'Signal conditioning, transmitter and interface boards designed in house when a catalogue product cannot meet the requirement or the commercial target.',
    points: [
      'Schematic and board design for the specific signal chain',
      'Industrial supply, protection and isolation on the board',
      'Built to be repaired and replaced in the field',
    ],
  },
  {
    n: 3,
    name: 'PLC and microcontroller',
    summary: 'The deterministic core',
    detail:
      'The controller that scans inputs, solves the logic and drives the outputs on a fixed cycle. Chosen after the I/O count and the control requirement are known.',
    points: [
      'Controller sized from the actual I/O schedule',
      'Spare capacity planned for the next expansion',
      'Runs independently of any network or cloud link',
    ],
  },
  {
    n: 4,
    name: 'Control logic',
    summary: 'The rules your plant runs by',
    detail:
      'Interlocks, sequences, dosing loops, pump changeover, run hours and alarm conditions, written against your process description and reviewed with you before testing.',
    points: [
      'Interlocks and permissives defined before coding starts',
      'Alarm list agreed with the operations team',
      'Logic documented so a second engineer can maintain it',
    ],
  },
  {
    n: 5,
    name: 'HMI and SCADA',
    summary: 'What the operator sees at 3 am',
    detail:
      'Operator screens that show plant state, live values and setpoints, with manual control where the process needs it and a clear alarm banner where it does not.',
    points: [
      'Screen hierarchy built around real operator tasks',
      'Alarms ranked, not a flat list of every event',
      'Setpoint changes restricted by access level',
    ],
  },
  {
    n: 6,
    name: 'Industrial control panel',
    summary: 'The enclosure everything lands in',
    detail:
      'Incomer, protection, feeders, drives, control supplies, terminals and wiring, laid out to a general arrangement drawing and wired to a numbered schematic.',
    points: [
      'Enclosure and protection rating chosen for the installation site',
      'Ferruled and numbered wiring against the schematic',
      'Thermal load and cable entry planned, not improvised',
    ],
  },
  {
    n: 7,
    name: 'IIoT gateway',
    summary: 'A one way door out of the plant',
    detail:
      'Reads from the controller over the plant protocol and publishes upward over an outbound connection. The controller is never exposed directly to the internet.',
    points: [
      'Outbound only connection from plant to cloud',
      'Local buffering so a link drop does not lose readings',
      'Protocol translation handled at the gateway, not the PLC',
    ],
  },
  {
    n: 8,
    name: 'Cloud dashboard',
    summary: 'Plant state from anywhere',
    detail:
      'Live values, historical trends and asset status, reachable from an office or a phone, with access separated by role.',
    points: [
      'Live and historical views on the same tags',
      'Role based access for operators, managers and service',
      'Retention long enough to compare against last season',
    ],
  },
  {
    n: 9,
    name: 'Analytics',
    summary: 'Turning stored readings into a decision',
    detail:
      'Trends, consumption reports and threshold alerts built on the retained data, so a slow drift is visible before it becomes an unplanned stop.',
    points: [
      'Trend comparison across periods and assets',
      'Threshold and rate of change alerts',
      'Reports exported for compliance records',
    ],
  },
  {
    n: 10,
    name: 'Engineering and AMC',
    summary: 'The part that runs after handover',
    detail:
      'Commissioning support, preventive visits, spares planning and fault attendance under an annual maintenance contract, so the system keeps performing after the first month.',
    points: [
      'Commissioning and operator handover training',
      'Preventive schedule with calibration checks',
      'Defined response path for a fault call',
    ],
  },
]

/* ------------------------------------------------------------------
   Industries, each with the process strip revealed on hover or focus.
   ------------------------------------------------------------------ */

export interface Industry {
  id: string
  name: string
  line: string
  /** The process strip: stages shown when the row is opened. */
  strip: string[]
}

export const industries: Industry[] = [
  {
    id: 'water',
    name: 'Water and wastewater',
    line: 'Treatment plants, pumping stations and recycling lines that must hold a discharge quality.',
    strip: ['Intake', 'Screening', 'Dosing', 'Aeration', 'Clarifier', 'Filtration', 'Discharge'],
  },
  {
    id: 'chemical',
    name: 'Chemical and process',
    line: 'Batching, dosing and reaction stages where the sequence and the interlocks decide the outcome.',
    strip: ['Raw feed', 'Batch weigh', 'Reactor', 'Dosing', 'Transfer', 'Storage'],
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing and MSMEs',
    line: 'Machine control and utility monitoring for plants running without a resident automation team.',
    strip: ['Utility feed', 'Machine control', 'Interlocks', 'Run hours', 'Output count'],
  },
  {
    id: 'agri',
    name: 'Agriculture and cold chain',
    line: 'Drying, storage and cold rooms where temperature and humidity hold the product value.',
    strip: ['Intake', 'Drying', 'Grading', 'Cold room', 'Dispatch'],
  },
  {
    id: 'waste',
    name: 'Waste management',
    line: 'Handling and treatment lines where effluent quality has to be recorded, not estimated.',
    strip: ['Collection', 'Segregation', 'Treatment', 'Effluent check', 'Disposal'],
  },
  {
    id: 'solar',
    name: 'Solar and energy',
    line: 'Generation and consumption monitoring tied back into the plant control system.',
    strip: ['Array', 'Inverter', 'Metering', 'Load', 'Monitoring'],
  },
  {
    id: 'mining',
    name: 'Mining and heavy industry',
    line: 'Conveying, dewatering and dust suppression in environments that punish the enclosure.',
    strip: ['Feed', 'Conveying', 'Dewatering', 'Suppression', 'Monitoring'],
  },
  {
    id: 'custom',
    name: 'Other or custom industries',
    line: 'A process that does not fit the list above. The requirement study starts the same way.',
    strip: ['Requirement study', 'Signal list', 'Control scheme', 'Panel', 'Commissioning'],
  },
]

/* ------------------------------------------------------------------
   Products as spec sheet rows.
   ------------------------------------------------------------------ */

export interface Product {
  id: string
  name: string
  tag: string
  line: string
  specs: { label: string; value: string }[]
  status: ItemStatus
}

export const products: Product[] = [
  {
    id: 'solar-dryer',
    name: 'Solar dryer',
    tag: 'PRD-SD',
    line: 'Controlled drying for agricultural and food produce using solar thermal input with monitored conditions.',
    specs: [
      { label: 'Control', value: 'Temperature and humidity' },
      { label: 'Monitoring', value: 'Local and remote' },
      { label: 'Sizing', value: 'Per batch requirement' },
    ],
    status: 'ready',
  },
  {
    id: 'wwt-unit',
    name: 'Waste water and purification unit',
    tag: 'PRD-WW',
    line: 'Treatment and purification skid with instrumentation and dosing control for the target discharge quality.',
    specs: [
      { label: 'Control', value: 'Dosing and sequence' },
      { label: 'Instruments', value: 'pH, level, flow' },
      { label: 'Sizing', value: 'Per flow and load' },
    ],
    status: 'ready',
  },
  {
    id: 'lab-kit',
    name: 'Chemical and water testing lab kit',
    tag: 'PRD-LK',
    line: 'A bench kit for on site water and chemical parameter checks, so samples do not have to leave the plant.',
    specs: [
      { label: 'Parameters', value: 'To be configured' },
      { label: 'Readout', value: 'Digital' },
      { label: 'Use', value: 'On site checks' },
    ],
    status: 'pilot',
  },
  {
    id: 'gateway-pcb',
    name: 'IoT gateway and custom PCB',
    tag: 'PRD-GW',
    line: 'Gateway hardware and purpose built boards for reading plant signals and publishing them upward.',
    specs: [
      { label: 'Plant side', value: 'Modbus RTU and TCP' },
      { label: 'Uplink', value: 'Outbound only' },
      { label: 'Board', value: 'Custom per application' },
    ],
    status: 'pilot',
  },
  {
    id: 'panel',
    name: 'Custom industrial control panel',
    tag: 'PRD-PNL',
    line: 'Control panels engineered for the specific plant: schematic, general arrangement, fabrication, wiring and testing.',
    specs: [
      { label: 'Design', value: 'Schematic and GA' },
      { label: 'Build', value: 'Fabrication and wiring' },
      { label: 'Test', value: 'FAT before dispatch' },
    ],
    status: 'custom',
  },
  {
    id: 'transmitter',
    name: 'Sensor transmitter',
    tag: 'PRD-TX',
    line: 'In house transmitter for conditioning sensor output into a standard industrial signal.',
    specs: [
      { label: 'Output', value: 'To be verified' },
      { label: 'Supply', value: 'To be verified' },
      { label: 'Status', value: 'Under development' },
    ],
    status: 'in-development',
  },
  {
    id: 'plc-mcu',
    name: 'PLC and microcontroller',
    tag: 'PRD-PLC',
    line: 'Controller hardware under development for compact automation requirements.',
    specs: [
      { label: 'I/O', value: 'To be verified' },
      { label: 'Protocol', value: 'To be verified' },
      { label: 'Status', value: 'Under development' },
    ],
    status: 'in-development',
  },
  {
    id: 'control-system',
    name: 'Control system',
    tag: 'PRD-CS',
    line: 'An integrated control offering combining the controller, panel and supervisory layers.',
    specs: [
      { label: 'Scope', value: 'To be configured' },
      { label: 'Availability', value: 'Not yet released' },
      { label: 'Status', value: 'Planned' },
    ],
    status: 'coming-soon',
  },
]

/* ------------------------------------------------------------------
   How it works: a true sequence, so numbering is appropriate.
   ------------------------------------------------------------------ */

export interface Step {
  n: number
  title: string
  body: string
}

export const howItWorks: Step[] = [
  {
    n: 1,
    title: 'Describe the requirement',
    body: 'Tell us the process, what has to be measured and what has to be controlled. The wizard asks in plain language, not in part numbers.',
  },
  {
    n: 2,
    title: 'Select the instruments',
    body: 'Measured variables become a sensor and transmitter list, ranged and specified against your process conditions.',
  },
  {
    n: 3,
    title: 'Size the controller',
    body: 'The signal list becomes an I/O schedule, and the I/O schedule sizes the PLC, the modules and the spare capacity.',
  },
  {
    n: 4,
    title: 'Design the panel',
    body: 'Protection, feeders, drives and layout are worked out into a schematic and a general arrangement drawing.',
  },
  {
    n: 5,
    title: 'Assemble the bill of materials',
    body: 'Every item from the steps above is collected into one list you can review line by line before anything is priced.',
  },
  {
    n: 6,
    title: 'Send it as an RFQ',
    body: 'The bill of materials goes to our engineering team as a quotation request, with your configuration attached to it.',
  },
]

/* ------------------------------------------------------------------
   Panel engineering workflow (post order delivery sequence).
   ------------------------------------------------------------------ */

export const panelWorkflow: Step[] = [
  {
    n: 1,
    title: 'Requirement study and load calculation',
    body: 'Process description, load list and site conditions established before any component is selected.',
  },
  {
    n: 2,
    title: 'I/O calculation and component selection',
    body: 'Signal schedule built, controller and modules sized, protection and switchgear selected.',
  },
  {
    n: 3,
    title: 'Schematic and panel GA',
    body: 'Numbered schematic and general arrangement drawing issued for your approval before fabrication.',
  },
  {
    n: 4,
    title: 'Fabrication and wiring',
    body: 'Enclosure prepared, components mounted, wiring ferruled and numbered against the approved schematic.',
  },
  {
    n: 5,
    title: 'PLC and HMI programming',
    body: 'Control logic and operator screens written against the agreed process description and alarm list.',
  },
  {
    n: 6,
    title: 'Testing and FAT',
    body: 'Point to point checks and a factory acceptance test with you, before the panel leaves the works.',
  },
  {
    n: 7,
    title: 'Installation and commissioning',
    body: 'Site installation, loop checks, live tuning and operator handover on the running process.',
  },
  {
    n: 8,
    title: 'AMC',
    body: 'Preventive visits, calibration checks, spares planning and a defined response path for faults.',
  },
]

/* ------------------------------------------------------------------
   IIoT demo tags. Clearly labelled demo data throughout.
   ------------------------------------------------------------------ */

export interface DemoTag {
  tag: string
  label: string
  unit: string
  base: number
  spread: number
  decimals: number
}

export const demoTags: DemoTag[] = [
  { tag: 'AIT-101', label: 'Inlet pH', unit: 'pH', base: 7.2, spread: 0.3, decimals: 2 },
  { tag: 'FIT-204', label: 'Feed flow', unit: 'm3/h', base: 18.4, spread: 1.6, decimals: 1 },
  { tag: 'LIT-310', label: 'Buffer tank level', unit: '%', base: 62, spread: 7, decimals: 0 },
  { tag: 'TIT-118', label: 'Dryer chamber temp', unit: 'degC', base: 54.6, spread: 2.4, decimals: 1 },
]

export const protocols = ['Modbus RTU', 'Modbus TCP', 'MQTT', 'OPC UA', 'HTTPS REST']

/* ------------------------------------------------------------------
   FAQ, written as plain question and answer for AEO.
   ------------------------------------------------------------------ */

export interface Faq {
  q: string
  a: string
}

export const faqs: Faq[] = [
  {
    q: 'What do I need to have ready before I use the configurator',
    a: 'A description of your process and a rough idea of what has to be measured or controlled. You do not need part numbers, drawings or an I/O list. If you have a process flow diagram or an existing panel schematic it speeds up the review, but the wizard is written to work without one.',
  },
  {
    q: 'Does the configurator give me a price',
    a: 'No. It produces a configuration and a bill of materials that you can review line by line. Pricing is issued by our engineering team against that bill of materials once the scope is confirmed, because site conditions and delivery terms change the number.',
  },
  {
    q: 'Can you work with the PLC brand already installed in my plant',
    a: 'In most cases yes. Tell us the make and model during the requirement study. Where an existing controller can be retained we integrate with it rather than replacing working equipment, and where it cannot support the requirement we will say so and explain why.',
  },
  {
    q: 'Is my PLC exposed to the internet if I take the cloud dashboard',
    a: 'No. The gateway reads from the controller on the plant network and publishes upward over an outbound connection. There is no inbound path from the internet to the controller, and the control logic keeps running on its own scan if the uplink drops.',
  },
  {
    q: 'What happens to my data if the internet connection fails',
    a: 'The gateway buffers readings locally and forwards them once the link is restored, so the trend does not show a hole for the outage. Control and interlocks are unaffected, because they run in the PLC and never depend on the cloud.',
  },
  {
    q: 'Do you supply only panels, or the full system',
    a: 'Either. Some customers order a control panel against their own drawings. Others hand over the process requirement and take the full chain: instruments, controller, panel, programming, gateway, dashboard and commissioning. The layers are built to be taken separately.',
  },
  {
    q: 'What support do I get after commissioning',
    a: 'Operator handover is part of commissioning. Beyond that an annual maintenance contract covers preventive visits, calibration checks, spares planning and a defined response path for fault calls. The scope is agreed in writing rather than assumed.',
  },
  {
    q: 'Which standards do you design to',
    a: 'Panels and control schemes are designed with reference to the applicable standards for the installation and the site. The specific standards that apply are confirmed during the requirement study, since they depend on the industry, the location and the customer specification.',
  },
  {
    q: 'How long does a typical panel take from order to dispatch',
    a: 'It depends on the scope, the component lead times and how quickly drawings are approved. A schedule is issued with the order confirmation and the two fixed review points, drawing approval and factory acceptance test, are scheduled with you rather than assumed.',
  },
  {
    q: 'Can you handle a process that is not in your industries list',
    a: 'Yes. The requirement study does not depend on the industry label. If the process can be described, measured and controlled, it can be scoped the same way. Start with the wizard or talk to an engineer directly.',
  },
]
