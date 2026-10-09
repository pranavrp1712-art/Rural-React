/**
 * Products and product detail pages. Spec 03.
 *
 * Every technical specification lives here rather than in a component,
 * so a spec can be corrected without touching UI code. Anything the
 * company material does not confirm carries an explicit unverified
 * marker instead of a plausible looking number.
 */

import type { ItemStatus } from './navigation'

/**
 * The three stand-ins the brief mandates for unconfirmed data. A spec
 * value is either a real string or one of these, never a guess.
 */
export const UNVERIFIED = {
  configure: 'To be configured',
  verify: 'To be verified',
  review: 'Engineering review required',
} as const

export type UnverifiedValue = (typeof UNVERIFIED)[keyof typeof UNVERIFIED]

/** A single specification row. `value` may be an unverified marker. */
export interface SpecRow {
  label: string
  value: string | UnverifiedValue
  /** Optional qualifier shown under the value. */
  note?: string
}

export interface SpecGroup {
  heading: string
  rows: SpecRow[]
}

export interface ProductFaq {
  q: string
  a: string
}

export interface Product {
  slug: string
  name: string
  /** Card and menu line. */
  summary: string
  status: ItemStatus
  /** Which of the brief's two lists this belongs to. */
  family: 'product' | 'development'
  overview: string
  problem: string
  applications: string[]
  principle: string
  architecture: string
  features: { title: string; body: string }[]
  specs: SpecGroup[]
  options: string[]
  customization: string
  installation: string
  maintenance: string
  documents: { label: string; state: string }[]
  faqs: ProductFaq[]
}

export const products: Product[] = [
  {
    slug: 'solar-dryer',
    name: 'Solar Dryer',
    summary: 'Controlled drying chamber using solar thermal input with instrumented profile control.',
    status: 'pilot',
    family: 'product',
    overview:
      'A drying chamber that uses solar thermal energy as its primary heat input, with the chamber condition measured and held to a profile rather than left to the weather. The control system stages airflow and any assist heating against measured temperature, humidity and available irradiance.',
    problem:
      'Open air and uncontrolled drying produces uneven batches, over dried product and losses that nobody can attribute to a cause, because the chamber condition through the batch was never recorded.',
    applications: [
      'Agricultural produce drying',
      'Spice and herb drying',
      'Food processing pre treatment',
      'Post harvest loss reduction',
      'Batch drying where a record is required',
    ],
    principle:
      'Solar thermal input raises chamber air temperature. Measured temperature and relative humidity are compared against the batch profile, and the controller stages fans, dampers and any assist heater to hold the setpoint. Weight loss through the batch is tracked as the drying progress indicator.',
    architecture:
      'Chamber sensors report to the controller over 4 to 20 mA and RS485. The controller executes the drying profile locally. An optional gateway publishes batch data outbound for remote visibility and retained records.',
    features: [
      { title: 'Profile driven batches', body: 'Temperature and humidity setpoints held through the batch, with staged airflow rather than a single fixed fan speed.' },
      { title: 'Retained batch record', body: 'The condition history for each batch is logged, so a buyer asking how the product was dried can be answered.' },
      { title: 'Irradiance aware assist', body: 'Available solar energy is measured, so assist heating only runs when the sun genuinely cannot carry the profile.' },
      { title: 'Deviation alarms', body: 'Over temperature and stalled drying raise an alarm during the batch rather than after it.' },
    ],
    specs: [
      {
        heading: 'Capacity and chamber',
        rows: [
          { label: 'Batch capacity', value: UNVERIFIED.configure, note: 'Sized per application during the requirement study.' },
          { label: 'Chamber dimensions', value: UNVERIFIED.configure },
          { label: 'Tray configuration', value: UNVERIFIED.configure },
          { label: 'Construction material', value: UNVERIFIED.verify },
        ],
      },
      {
        heading: 'Sensors',
        rows: [
          { label: 'Temperature', value: 'Available for configuration', note: 'Chamber and ambient, range per application.' },
          { label: 'Relative humidity', value: 'Available for configuration', note: '0 to 100 % RH.' },
          { label: 'Solar irradiance', value: 'Available for configuration', note: '0 to 1500 W/m2.' },
          { label: 'Batch weight', value: 'Available for configuration', note: 'Optional; drives the drying progress indicator.' },
        ],
      },
      {
        heading: 'Controller and interface',
        rows: [
          { label: 'Controller', value: UNVERIFIED.configure, note: 'PLC or microcontroller depending on scale and I/O count.' },
          { label: 'Operator interface', value: 'HMI, size per configuration' },
          { label: 'Communication', value: 'RS485 / Modbus RTU', note: 'Ethernet and MQTT where remote monitoring is in scope.' },
        ],
      },
      {
        heading: 'Power and environment',
        rows: [
          { label: 'Power supply', value: UNVERIFIED.configure },
          { label: 'Operating ambient', value: UNVERIFIED.verify },
          { label: 'Enclosure IP rating', value: UNVERIFIED.configure, note: 'Outdoor mounting raises this; specified per site.' },
        ],
      },
    ],
    options: [
      'Assist heating element',
      'Batch weight measurement',
      'IIoT gateway and cloud dashboard',
      'Extended data retention',
      'Multi chamber control from one panel',
    ],
    customization:
      'Chamber size, tray arrangement, sensor count and the drying profile itself are all configured per application. The control philosophy stays the same; the sizing does not.',
    installation:
      'Site orientation, chamber siting and cable routing are established during the requirement study. Installation and commissioning are quoted as separate line items.',
    maintenance:
      'Sensor calibration intervals and fan servicing are scheduled from run hours. An AMC option covers calibration and preventive servicing.',
    documents: [
      { label: 'Technical datasheet', state: UNVERIFIED.review },
      { label: 'General arrangement drawing', state: 'Issued per configuration' },
      { label: 'Operating manual', state: 'Issued at handover' },
      { label: 'Calibration certificates', state: 'Per supplied instrument' },
    ],
    faqs: [
      { q: 'Does it work without sun?', a: 'The chamber holds its profile using assist heating when irradiance is insufficient, if that option is configured. Without it, the batch simply takes longer and the controller reports the stall rather than hiding it.' },
      { q: 'Can I see the batch remotely?', a: 'Yes, where the gateway option is included. The gateway publishes outbound only; it does not accept inbound control.' },
      { q: 'What capacity do I need?', a: 'That comes out of the requirement study, from your throughput, product and moisture targets. The configurator captures those inputs.' },
    ],
  },
  {
    slug: 'wastewater-and-purification-unit',
    name: 'Waste Water & Purification Unit',
    summary: 'Packaged treatment and purification skid with instrumented dosing and closed loop control.',
    status: 'in-development',
    family: 'product',
    overview:
      'A packaged treatment unit that brings the measurement, dosing and control for a treatment line into one engineered skid, rather than assembling instruments, a panel and a dashboard from three suppliers on site.',
    problem:
      'Small and mid sized treatment installations are usually assembled from separately procured parts, which leaves nobody accountable for the discharge number and no retained record when a regulator asks for one.',
    applications: [
      'Effluent treatment (ETP)',
      'Sewage treatment (STP)',
      'Water purification',
      'Industrial effluent pre treatment',
      'Water reuse and recycling',
    ],
    principle:
      'Inlet flow is totalised and the treatment stages are instrumented. pH, ORP and residual measurements drive dosing pumps through the controller on a closed loop, with interlocks preventing dosing into a stalled or empty line. Outlet quality is measured and retained.',
    architecture:
      'Instruments report to the PLC over 4 to 20 mA and RS485. The PLC holds dosing logic and every interlock. A gateway publishes readings, totals and alarms outbound to the cloud layer.',
    features: [
      { title: 'Closed loop dosing', body: 'Chemical metered against the measured value and the flow, not against a fixed pump setting.' },
      { title: 'Compliance record retained', body: 'The parameters you have to prove are logged on the same tags the operator sees.' },
      { title: 'Runs through a network outage', body: 'Control lives in the PLC. Losing the link loses visibility, never the plant.' },
      { title: 'Configurable stage set', body: 'Stages that do not apply to your line are switched off rather than supplied and bypassed.' },
    ],
    specs: [
      {
        heading: 'Capacity',
        rows: [
          { label: 'Treatment capacity', value: UNVERIFIED.configure, note: 'Sized from measured or stated inlet flow.' },
          { label: 'Inlet flow range', value: UNVERIFIED.configure },
          { label: 'Stage configuration', value: 'Selected per process', note: 'Equalization through to disinfection.' },
        ],
      },
      {
        heading: 'Instrumentation',
        rows: [
          { label: 'pH', value: 'Available for configuration', note: '0 to 14 pH.' },
          { label: 'ORP', value: 'Available for configuration', note: '-1500 to +1500 mV.' },
          { label: 'Conductivity / TDS', value: 'Available for configuration' },
          { label: 'Turbidity', value: 'Available for configuration' },
          { label: 'Flow', value: 'Available for configuration', note: 'Sized to the line.' },
          { label: 'Level', value: 'Available for configuration' },
          { label: 'Residual chlorine', value: 'Available for configuration' },
        ],
      },
      {
        heading: 'Control',
        rows: [
          { label: 'Controller', value: UNVERIFIED.configure, note: 'PLC selected from the I/O count and protocol requirement.' },
          { label: 'Operator interface', value: 'HMI, size per configuration' },
          { label: 'Dosing pumps', value: UNVERIFIED.configure, note: 'Quantity and capacity from the dosing calculation.' },
          { label: 'Communication', value: 'Modbus RTU / Modbus TCP / Ethernet' },
        ],
      },
      {
        heading: 'Power and environment',
        rows: [
          { label: 'Supply voltage', value: UNVERIFIED.configure },
          { label: 'Connected load', value: UNVERIFIED.configure },
          { label: 'Enclosure IP rating', value: UNVERIFIED.configure },
          { label: 'Indoor / outdoor', value: UNVERIFIED.configure },
        ],
      },
    ],
    options: [
      'IIoT gateway and cloud dashboard',
      'Extended data retention for compliance',
      'Redundant dosing pump',
      'Remote alarm notification',
      'AMC with scheduled calibration',
    ],
    customization:
      'Stage set, instrument selection, dosing configuration and panel sizing are all established from the process. The unit is configured to the line rather than the line adapted to the unit.',
    installation:
      'Civil interfaces, cable routing and utility connections are established during the requirement study. Installation and commissioning are quoted separately.',
    maintenance:
      'Probe calibration is the recurring task and drives the AMC schedule. Dosing pump servicing is scheduled from run hours logged by the controller.',
    documents: [
      { label: 'Process and instrumentation diagram', state: 'Issued per configuration' },
      { label: 'Electrical schematic', state: 'Issued per configuration' },
      { label: 'Panel general arrangement', state: 'Issued per configuration' },
      { label: 'Operating and maintenance manual', state: 'Issued at handover' },
      { label: 'Calibration certificates', state: 'Per supplied instrument' },
    ],
    faqs: [
      { q: 'Will this meet my discharge limit?', a: 'That depends on your influent and your consent conditions, which is exactly what the requirement study establishes. No discharge performance is promised before that review.' },
      { q: 'Can it use my existing panel?', a: 'Where the existing panel is fit for purpose, yes. The configurator has a reuse existing infrastructure option that carries through to the bill of materials.' },
      { q: 'Is the data suitable for a regulator?', a: 'The system retains readings and alarms on the operator tags. Whether that satisfies a specific regulator is a question for your consent conditions, not something the website can answer.' },
    ],
  },
  {
    slug: 'chemical-and-water-testing-lab-kit',
    name: 'Chemical & Water Testing Lab Kit',
    summary: 'Bench testing set for water and chemical parameters, supporting plant verification.',
    status: 'in-development',
    family: 'product',
    overview:
      'A bench level testing set covering the water and chemical parameters a treatment plant needs to verify. It exists to cross check what the inline instruments are reporting, which is how probe drift is caught before it becomes a compliance problem.',
    problem:
      'Inline probes drift. Without an independent bench measurement there is no way to tell a genuine process change from an instrument that needs calibration, so operators either distrust every reading or trust a wrong one.',
    applications: [
      'Inline instrument verification',
      'Treatment plant sample testing',
      'Incoming water quality checks',
      'Chemical dosing verification',
      'Training and operator familiarisation',
    ],
    principle:
      'Bench instruments measure the same parameters as the inline probes on a grab sample. The difference between the two is the drift, which drives the calibration schedule rather than a fixed calendar interval.',
    architecture:
      'Standalone bench equipment. Results are entered against the plant tags so the comparison is retained alongside the inline trend.',
    features: [
      { title: 'Independent cross check', body: 'A second measurement path, so a suspicious inline reading can be confirmed or dismissed.' },
      { title: 'Calibration on condition', body: 'Drift measured rather than assumed, so probes are calibrated when they need it.' },
      { title: 'Operator training value', body: 'Understanding what the probe measures makes the operator better at spotting when it is wrong.' },
    ],
    specs: [
      {
        heading: 'Parameters',
        rows: [
          { label: 'pH', value: 'Available for configuration' },
          { label: 'Conductivity / TDS', value: 'Available for configuration' },
          { label: 'Turbidity', value: 'Available for configuration' },
          { label: 'Residual chlorine', value: 'Available for configuration' },
          { label: 'Hardness and alkalinity', value: 'Available for configuration' },
          { label: 'Additional parameters', value: UNVERIFIED.configure },
        ],
      },
      {
        heading: 'Kit composition',
        rows: [
          { label: 'Instrument set', value: UNVERIFIED.verify },
          { label: 'Reagents', value: UNVERIFIED.verify },
          { label: 'Glassware and consumables', value: UNVERIFIED.verify },
          { label: 'Carrying case', value: UNVERIFIED.configure },
        ],
      },
      {
        heading: 'Operating',
        rows: [
          { label: 'Power', value: UNVERIFIED.configure, note: 'Mains or battery per instrument.' },
          { label: 'Operating conditions', value: UNVERIFIED.verify },
          { label: 'Calibration standards', value: 'Supplied per parameter' },
        ],
      },
    ],
    options: ['Additional parameter modules', 'Reagent replenishment under AMC', 'Operator training session', 'Results logging against plant tags'],
    customization: 'Parameter set is chosen from what your plant actually has to prove. There is no value in a kit that tests what you never report.',
    installation: 'Bench setup only. No plant interface is required.',
    maintenance: 'Reagent shelf life and calibration standard replacement drive the schedule. Both can sit under the AMC.',
    documents: [
      { label: 'Parameter list and methods', state: UNVERIFIED.review },
      { label: 'Operating instructions', state: 'Issued at handover' },
      { label: 'Reagent safety data sheets', state: 'Per supplied reagent' },
    ],
    faqs: [
      { q: 'Does this replace a NABL lab?', a: 'No. It is a plant level cross check for operational decisions and calibration scheduling. Statutory testing stays with an accredited laboratory.' },
      { q: 'How often should I cross check?', a: 'That is set during commissioning from how fast your probes actually drift in your process, not from a generic interval.' },
    ],
  },
  {
    slug: 'iot-gateway-and-custom-pcb',
    name: 'IoT Gateway & Custom PCB',
    summary: 'Edge gateway and purpose built electronics, publishing outbound only from the plant.',
    status: 'pilot',
    family: 'product',
    overview:
      'An edge device that reads from the controller and publishes upward, plus the custom electronics work that sits behind it when an off the shelf board does not fit the signal, the enclosure or the environment.',
    problem:
      'Remote monitoring is often achieved by exposing plant equipment to the network in ways that would not survive a security review. A gateway that only ever initiates outbound connections gives the visibility without that exposure.',
    applications: [
      'Remote plant monitoring',
      'Legacy equipment integration where technically compatible',
      'Protocol conversion between field and cloud',
      'Custom sensor transmitter electronics',
      'OEM embedded control boards',
    ],
    principle:
      'The gateway polls the controller or field devices over Modbus or OPC UA, buffers locally, and publishes outbound over MQTT. It initiates every connection; nothing on the internet initiates a connection into the plant. The PLC is never placed directly on a public network.',
    architecture:
      'PLC or field device, to industrial network, to edge gateway, to secure outbound communication, to cloud. The customer website and the OT environment stay logically separated.',
    features: [
      { title: 'Outbound only by design', body: 'No inbound listening service on the plant side, so remote visibility does not create a remote attack surface.' },
      { title: 'Local buffering', body: 'A dropped link delays reporting; it does not create a hole in the record.' },
      { title: 'Protocol conversion', body: 'Modbus RTU and TCP, OPC UA and analogue inputs brought into one publishing path.' },
      { title: 'Custom electronics where needed', body: 'Purpose built transmitter and controller boards when the signal, enclosure or environment rules out a standard module.' },
    ],
    specs: [
      {
        heading: 'Interfaces',
        rows: [
          { label: 'Serial', value: 'RS485', note: 'Modbus RTU master.' },
          { label: 'Ethernet', value: 'Modbus TCP / OPC UA client' },
          { label: 'Analogue inputs', value: 'Available for configuration', note: '4 to 20 mA, count per configuration.' },
          { label: 'Digital inputs', value: 'Available for configuration' },
          { label: 'Cloud protocol', value: 'MQTT, outbound only' },
        ],
      },
      {
        heading: 'Hardware',
        rows: [
          { label: 'Processor', value: UNVERIFIED.verify },
          { label: 'Local buffer depth', value: UNVERIFIED.configure, note: 'Sized from tag count and expected outage duration.' },
          { label: 'Enclosure', value: UNVERIFIED.configure, note: 'DIN rail or panel mount per installation.' },
          { label: 'IP rating', value: UNVERIFIED.configure },
        ],
      },
      {
        heading: 'Power and environment',
        rows: [
          { label: 'Power supply', value: UNVERIFIED.configure, note: 'Typically 24 V DC from the panel SMPS.' },
          { label: 'Operating temperature', value: UNVERIFIED.verify },
          { label: 'Connectivity', value: UNVERIFIED.configure, note: 'Ethernet, or cellular where no site link exists.' },
        ],
      },
      {
        heading: 'Custom PCB scope',
        rows: [
          { label: 'Schematic and layout', value: 'In scope' },
          { label: 'Prototype and bring up', value: 'In scope' },
          { label: 'Compliance testing', value: UNVERIFIED.review, note: 'Scoped per target market and application.' },
          { label: 'Production quantity', value: UNVERIFIED.configure },
        ],
      },
    ],
    options: ['Cellular connectivity', 'Extended local buffering', 'Additional protocol drivers', 'Redundant power input', 'Custom transmitter board development'],
    customization:
      'Tag list, poll rates, buffer depth and protocol set are configured per plant. Custom board work is scoped separately against the signal and environment requirements.',
    installation: 'DIN rail mounting inside the existing control panel in most cases. Network and power interfaces are established during the requirement study.',
    maintenance: 'Firmware updates and certificate rotation are handled under the AMC. No routine field servicing is expected.',
    documents: [
      { label: 'Interface and tag list', state: 'Issued per configuration' },
      { label: 'Network architecture drawing', state: 'Issued per configuration' },
      { label: 'Security notes', state: 'Issued per configuration' },
      { label: 'Compliance documentation', state: UNVERIFIED.review },
    ],
    faqs: [
      { q: 'Is my PLC exposed to the internet?', a: 'No. The gateway initiates outbound connections only. Nothing on the internet can open a connection into the plant network through it.' },
      { q: 'Can it read my existing equipment?', a: 'Where the equipment exposes a compatible protocol, yes. Compatibility is confirmed during the requirement study rather than assumed.' },
      { q: 'What happens when the link drops?', a: 'Readings are buffered locally and forwarded when the link returns, so the retained record has no gap.' },
    ],
  },
  {
    slug: 'custom-industrial-control-panel',
    name: 'Custom Industrial Control Panel',
    summary: 'Engineered enclosures built to schematic and GA drawings, tested before dispatch.',
    status: 'ready',
    family: 'product',
    overview:
      'Control panels designed from the load and I/O counts rather than assembled from a template: incomer, protection, feeders, drives, controller, terminals and wiring, documented in a drawing set you keep.',
    problem:
      'A panel built without a schematic is a panel nobody can modify safely later. The cost of that shows up two years after handover, when a change that should take a day takes a week of tracing wires.',
    applications: [
      'PLC control panels',
      'Motor control centres',
      'Dosing and treatment panels',
      'VFD and drive panels',
      'Instrumentation and metering panels',
      'Outdoor and weatherproof installations',
    ],
    principle:
      'Load calculation and I/O counts drive component selection. Component selection drives the schematic. The schematic drives the general arrangement and the enclosure size. Everything is wired to the drawing and tested against it before dispatch.',
    architecture:
      'Incomer and protection, distribution, controller and I/O, drives and starters, field terminals, with power and signal segregated through the enclosure.',
    features: [
      { title: 'Drawing set you keep', body: 'Schematic and general arrangement issued with the panel, so the next change is an edit rather than an investigation.' },
      { title: 'Designed with reference to applicable standards', body: 'Built with reference to IEC 60204-1 and IEC 61439 practice. RuralReact does not claim certification against them.' },
      { title: 'Tested before it ships', body: 'Continuity, function and I/O checks completed at works, so site commissioning is commissioning and not fault finding.' },
      { title: 'Sized from the actual load', body: 'Enclosure and cooling sized from calculated heat dissipation, not from what fits the budget.' },
    ],
    specs: [
      {
        heading: 'Electrical',
        rows: [
          { label: 'Supply voltage', value: UNVERIFIED.configure, note: 'From the panel configurator inputs.' },
          { label: 'Phase and frequency', value: UNVERIFIED.configure },
          { label: 'Connected load', value: UNVERIFIED.configure },
          { label: 'Incomer rating', value: UNVERIFIED.review, note: 'Sized during detailed engineering.' },
          { label: 'Short circuit withstand', value: UNVERIFIED.review },
        ],
      },
      {
        heading: 'Control',
        rows: [
          { label: 'Controller', value: UNVERIFIED.configure, note: 'Brand per preference or no preference.' },
          { label: 'I/O count', value: 'From the I/O calculator', note: 'Preliminary engineering estimate until reviewed.' },
          { label: 'HMI', value: UNVERIFIED.configure },
          { label: 'Communication', value: 'Modbus RTU / Modbus TCP / Ethernet / OPC UA' },
        ],
      },
      {
        heading: 'Enclosure',
        rows: [
          { label: 'Material', value: UNVERIFIED.configure, note: 'Selected for the environment.' },
          { label: 'IP rating', value: UNVERIFIED.configure },
          { label: 'Mounting', value: UNVERIFIED.configure, note: 'Wall or floor.' },
          { label: 'Dimensions', value: UNVERIFIED.review, note: 'Auto estimate available; final size requires detailed engineering.' },
          { label: 'Cooling', value: UNVERIFIED.review, note: 'From calculated heat dissipation.' },
        ],
      },
      {
        heading: 'Safety and protection',
        rows: [
          { label: 'Emergency stop circuit', value: 'Available for configuration' },
          { label: 'Safety relay', value: 'Available for configuration' },
          { label: 'Surge protection', value: 'Available for configuration' },
          { label: 'Earthing', value: 'Per installation requirement' },
        ],
      },
    ],
    options: [
      'VFD and soft starter feeders',
      'UPS for controller and gateway',
      'Industrial Ethernet switch',
      'Panel heater and thermostat',
      'Door switch and internal lighting',
      'IIoT gateway pre mounted',
    ],
    customization:
      'Every panel is configured from the load, the I/O and the environment. The panel configurator captures those inputs and produces a preliminary enclosure estimate.',
    installation: 'Mounting, cable entry and earthing are established during the requirement study. Installation and commissioning are quoted as separate line items.',
    maintenance: 'Thermal inspection, terminal torque checks and filter replacement are scheduled under the AMC.',
    documents: [
      { label: 'Electrical schematic', state: 'Issued with the panel' },
      { label: 'Panel general arrangement', state: 'Issued with the panel' },
      { label: 'Bill of materials', state: 'Issued with the panel' },
      { label: 'Test report', state: 'Issued at works testing' },
      { label: 'Operating manual', state: 'Issued at handover' },
    ],
    faqs: [
      { q: 'Are your panels certified?', a: 'They are designed with reference to applicable standards such as IEC 60204-1 and IEC 61439. RuralReact does not claim certification unless verified documentation is provided for a specific project.' },
      { q: 'Can you give me a panel size now?', a: 'The configurator produces a preliminary enclosure estimate. Final dimensions require detailed engineering covering component layout, heat dissipation, cable routing, segregation and service clearance.' },
      { q: 'Do you modify existing panels?', a: 'Yes, where the existing panel is fit for purpose. That is captured as reuse existing infrastructure in the configurator.' },
    ],
  },
  {
    slug: 'sensor-transmitter',
    name: 'Sensor Transmitter',
    summary: 'Signal conditioning and conversion at the device, for long runs and noisy environments.',
    status: 'in-development',
    family: 'development',
    overview:
      'Transmitter electronics that convert a raw sensor signal into a standard industrial output at the device, so a long cable run to the panel does not corrupt the reading.',
    problem:
      'Raw sensor signals degrade over distance in an electrically noisy plant. Converting at the panel rather than at the device means the damage is already done by the time the signal arrives.',
    applications: ['Long cable runs', 'High noise environments', 'Custom sensing elements', 'OEM instrument integration'],
    principle: 'The sensing element output is conditioned, linearised and converted to 4 to 20 mA or RS485 Modbus RTU at the device, so what travels down the cable is already a robust industrial signal.',
    architecture: 'Sensing element, to transmitter, to 4 to 20 mA or RS485, to controller input.',
    features: [
      { title: 'Conversion at the device', body: 'The weak signal path is as short as it can be.' },
      { title: 'Standard industrial output', body: '4 to 20 mA or RS485 Modbus RTU, so any controller can read it.' },
      { title: 'Application specific ranging', body: 'Scaled to the range you actually operate in rather than the full sensor span.' },
    ],
    specs: [
      {
        heading: 'Signal',
        rows: [
          { label: 'Input', value: UNVERIFIED.configure, note: 'Per sensing element.' },
          { label: 'Output', value: '4 to 20 mA / RS485 Modbus RTU' },
          { label: 'Accuracy', value: UNVERIFIED.verify },
          { label: 'Resolution', value: UNVERIFIED.verify },
        ],
      },
      {
        heading: 'Physical and power',
        rows: [
          { label: 'Power supply', value: UNVERIFIED.configure },
          { label: 'Enclosure and IP rating', value: UNVERIFIED.configure },
          { label: 'Operating temperature', value: UNVERIFIED.verify },
          { label: 'Cable entry', value: UNVERIFIED.configure },
        ],
      },
    ],
    options: ['RS485 Modbus output', 'Extended temperature range', 'Field calibration access', 'Custom ranging'],
    customization: 'Input type, range, output and enclosure are all specified per application. This is development category work, scoped per requirement.',
    installation: 'Mounted at or near the sensing element. Cable specification is part of the requirement study.',
    maintenance: 'Calibration interval is set from measured drift in your process.',
    documents: [{ label: 'Specification sheet', state: UNVERIFIED.review }, { label: 'Wiring detail', state: 'Issued per configuration' }],
    faqs: [
      { q: 'Is this a standard product?', a: 'No. It is a development category item, configured and developed per application rather than supplied from stock.' },
    ],
  },
  {
    slug: 'plc-and-microcontroller',
    name: 'PLC & Microcontroller',
    summary: 'Controller selection and programming, plus embedded control where a PLC does not fit.',
    status: 'in-development',
    family: 'development',
    overview:
      'Controller work across both ends of the range: industrial PLC selection and programming where the application calls for it, and embedded microcontroller development where a PLC is the wrong shape for the problem.',
    problem:
      'Controller choice is often made on familiarity rather than on the application. An oversized PLC on a small machine and an underpowered board on a plant are both expensive mistakes, in different ways.',
    applications: ['Process control', 'Machine automation', 'OEM embedded control', 'Retrofit of relay logic', 'Data acquisition'],
    principle: 'The I/O count, the scan requirement, the protocol set and the environment determine the controller. Logic is written to IEC 61131-3 practice on PLC platforms so that the next engineer can read it.',
    architecture: 'Field I/O, to controller, to operator interface, with an outbound gateway path where remote visibility is in scope.',
    features: [
      { title: 'Selection from the application', body: 'I/O count, scan time, protocols and environment drive the choice, not habit.' },
      { title: 'Readable logic', body: 'Written to IEC 61131-3 practice and documented, so it can be maintained by somebody else.' },
      { title: 'Brand flexible', body: 'Siemens, ABB, Schneider, Rockwell, Mitsubishi, Omron and others, or no preference.' },
    ],
    specs: [
      {
        heading: 'Scope',
        rows: [
          { label: 'Controller platform', value: UNVERIFIED.configure },
          { label: 'I/O count', value: 'From the I/O calculator' },
          { label: 'Programming standard', value: 'IEC 61131-3 practice' },
          { label: 'Protocols', value: 'Modbus RTU / Modbus TCP / OPC UA / Ethernet' },
        ],
      },
      {
        heading: 'Embedded development',
        rows: [
          { label: 'Board development', value: 'In scope' },
          { label: 'Firmware', value: 'In scope' },
          { label: 'Compliance testing', value: UNVERIFIED.review },
        ],
      },
    ],
    options: ['Redundant controller', 'Additional protocol drivers', 'Remote programming access under controlled conditions', 'Source code handover'],
    customization: 'Entirely application driven. This is development category work.',
    installation: 'Controller mounted in the panel. Commissioning is quoted separately.',
    maintenance: 'Logic changes and backup retention are covered under the AMC where taken.',
    documents: [
      { label: 'I/O list', state: 'Issued per configuration' },
      { label: 'Functional description', state: 'Issued per configuration' },
      { label: 'Program backup', state: 'Issued at handover' },
    ],
    faqs: [
      { q: 'Do I get the source program?', a: 'Source code handover is an option and is agreed as part of scope before the project starts, not afterwards.' },
      { q: 'Can you work with my existing PLC?', a: 'Where it is fit for purpose and accessible, yes. That is the reuse existing infrastructure path in the configurator.' },
    ],
  },
  {
    slug: 'control-system',
    name: 'Control System',
    summary: 'The integrated system: instruments, controller, panel, interface and monitoring as one scope.',
    status: 'custom',
    family: 'development',
    overview:
      'The full stack delivered as a single accountable scope rather than as separately procured parts: instruments, transmitters, controller, panel, operator interface, gateway and cloud layer, specified together.',
    problem:
      'The gaps between suppliers are where automation projects fail. When the probe, the panel and the dashboard come from three places, a wrong reading becomes an argument instead of a fix.',
    applications: ['Complete plant automation', 'Greenfield installations', 'Major retrofits', 'Multi stage process control', 'Projects requiring single point accountability'],
    principle: 'Every layer is specified against the same requirement study, so the selections are consistent with each other and one party is responsible for the number on the screen.',
    architecture: 'Process, to sensors, to transmitters, to PLC, to HMI and panel, to gateway, to cloud, to dashboard and retained records.',
    features: [
      { title: 'One accountable party', body: 'From probe to dashboard, the scope boundary is drawn once and sits in one place.' },
      { title: 'Consistent selection', body: 'Every layer sized against the same study, so the instrument, the input card and the cable actually match.' },
      { title: 'Transparent bill of materials', body: 'Every selected item listed with the reason for its selection, reviewable before any price is discussed.' },
      { title: 'Control independent of the cloud', body: 'The cloud layer reports on the plant. It never becomes a dependency for running it.' },
    ],
    specs: [
      {
        heading: 'Scope of supply',
        rows: [
          { label: 'Instrumentation', value: 'Per requirement study' },
          { label: 'Control panel', value: 'Per panel configurator' },
          { label: 'Controller and I/O', value: 'Per I/O calculator' },
          { label: 'Operator interface', value: 'Per HMI configurator' },
          { label: 'Gateway and cloud', value: 'Optional, per configuration' },
          { label: 'Installation and commissioning', value: UNVERIFIED.configure },
          { label: 'AMC', value: 'Optional' },
        ],
      },
      {
        heading: 'Engineering deliverables',
        rows: [
          { label: 'P&ID', value: 'Issued per configuration' },
          { label: 'Electrical schematic', value: 'Issued per configuration' },
          { label: 'Panel GA', value: 'Issued per configuration' },
          { label: 'I/O list and functional description', value: 'Issued per configuration' },
          { label: 'Test and FAT records', value: 'Issued at works testing' },
        ],
      },
    ],
    options: ['Redundancy at controller or instrument level', 'Extended data retention', 'Operator training', 'Extended AMC', 'Spares package'],
    customization: 'This category exists because the application did not fit a standard product. Everything is scoped from the requirement study.',
    installation: 'Full installation and commissioning scope, quoted as separate line items against the site conditions established in the study.',
    maintenance: 'AMC covering calibration, preventive servicing, logic backup and support response is scoped alongside the system.',
    documents: [
      { label: 'Full engineering document set', state: 'Issued per project' },
      { label: 'FAT and commissioning records', state: 'Issued at each stage' },
      { label: 'As built drawings', state: 'Issued at handover' },
    ],
    faqs: [
      { q: 'How is this priced?', a: 'Only after the scope is confirmed. The configurator produces a preliminary estimate; a commercial quotation follows engineering review and requires authorisation.' },
      { q: 'What if I already have some of this?', a: 'Declare it in the configurator. Existing infrastructure that is fit for purpose stays, and the bill of materials reflects that.' },
    ],
  },
]

export const productBySlug = (slug: string) => products.find((p) => p.slug === slug)
export const standardProducts = products.filter((p) => p.family === 'product')
export const developmentCategories = products.filter((p) => p.family === 'development')
