/**
 * Requirement wizard and sensor configuration. Spec 04.
 *
 * This is a rule based, conditional form flow. There is no AI and no
 * natural language input anywhere in it. Every field can be left as
 * "Not sure", which is recorded as an explicit unknown rather than
 * silently defaulted to a plausible value.
 */

/** The value stored when a user declines to answer. */
export const NOT_SURE = 'not-sure'
export const NOT_SURE_LABEL = 'Not sure — engineering review required'

export type FieldKind = 'choice' | 'number' | 'text'

export interface WizardField {
  id: string
  label: string
  kind: FieldKind
  /** Shown under the label. Persistent helper text, never a placeholder. */
  help?: string
  /** Choices for `kind: 'choice'`. */
  options?: string[]
  unit?: string
  /** Counts toward the completeness percentage. */
  required?: boolean
  /**
   * Only shown when this predicate passes. Conditional steps are what
   * keep the flow short for a simple monitoring job.
   */
  showIf?: (answers: Answers) => boolean
}

export interface WizardStep {
  id: string
  title: string
  /** One line explaining why the step is being asked. */
  intro: string
  fields: WizardField[]
}

export type Answers = Record<string, string>

/* ------------------------------------------------------------------
   Goals and applications
   ------------------------------------------------------------------ */

export const goals = [
  { id: 'measure', label: 'Measure', blurb: 'Get a reliable number out of the process.' },
  { id: 'control', label: 'Control', blurb: 'Hold a variable at a setpoint automatically.' },
  { id: 'automate', label: 'Automate', blurb: 'Run a sequence without an operator driving it.' },
  { id: 'monitor', label: 'Monitor', blurb: 'See and retain what the plant is doing, remotely.' },
]

export const applications = [
  'Wastewater',
  'ETP',
  'STP',
  'Chemical Process',
  'Water Purification',
  'Mining',
  'Solar Drying',
  'Cold Storage',
  'Other',
]

/* ------------------------------------------------------------------
   The sensor library. Every one of these is "Available for
   configuration" unless the company material confirms a standard
   product, which is why none of them carries a part number.
   ------------------------------------------------------------------ */

export interface SensorType {
  id: string
  name: string
  /** Instrument tag prefix. */
  tag: string
  typicalRange: string
  /** I/O signature used by the calculator. */
  io: { ai?: number; di?: number; ao?: number; do?: number }
  blurb: string
}

export const sensorTypes: SensorType[] = [
  { id: 'ph', name: 'pH', tag: 'AIT', typicalRange: '0 to 14 pH', io: { ai: 1 }, blurb: 'Acid and alkali dosing control; the primary compliance parameter in treatment.' },
  { id: 'orp', name: 'ORP', tag: 'AIT', typicalRange: '-1500 to +1500 mV', io: { ai: 1 }, blurb: 'Confirms oxidation or reduction has actually taken place.' },
  { id: 'conductivity', name: 'Conductivity', tag: 'CIT', typicalRange: '0 to 200 mS/cm', io: { ai: 1 }, blurb: 'Dissolved salts, reuse quality and clean in place confirmation.' },
  { id: 'tds', name: 'TDS', tag: 'AIT', typicalRange: '0 to 100000 ppm', io: { ai: 1 }, blurb: 'Total dissolved solids for reuse and RO recovery.' },
  { id: 'turbidity', name: 'Turbidity', tag: 'AIT', typicalRange: '0 to 1000 NTU', io: { ai: 1 }, blurb: 'Clarifier carryover and filter breakthrough.' },
  { id: 'temperature', name: 'Temperature', tag: 'TIT', typicalRange: '-50 to 400 C', io: { ai: 1 }, blurb: 'Process control and compensation for pH and conductivity.' },
  { id: 'pressure', name: 'Pressure', tag: 'PIT', typicalRange: '0 to 25 bar', io: { ai: 1 }, blurb: 'Pump health, vessel protection and filter differential.' },
  { id: 'flow', name: 'Flow', tag: 'FIT', typicalRange: 'Sized to the line', io: { ai: 1 }, blurb: 'Totalisation and flow proportional dosing.' },
  { id: 'level', name: 'Level', tag: 'LIT', typicalRange: 'Sized to the tank', io: { ai: 1 }, blurb: 'Tank protection, pump interlocks and dry run prevention.' },
  { id: 'do', name: 'Dissolved Oxygen', tag: 'AIT', typicalRange: '0 to 20 mg/L', io: { ai: 1 }, blurb: 'Aeration control; usually the largest energy line in treatment.' },
  { id: 'chlorine', name: 'Chlorine', tag: 'AIT', typicalRange: '0 to 10 mg/L', io: { ai: 1 }, blurb: 'Residual disinfection at the outlet.' },
  { id: 'humidity', name: 'Humidity', tag: 'MIT', typicalRange: '0 to 100 % RH', io: { ai: 1 }, blurb: 'Drying rate control and condensation avoidance.' },
  { id: 'vibration', name: 'Vibration', tag: 'VIT', typicalRange: '0 to 50 mm/s', io: { ai: 1 }, blurb: 'Bearing and imbalance condition on rotating equipment.' },
  { id: 'energy', name: 'Energy', tag: 'JIT', typicalRange: 'Sized to the feeder', io: { ai: 1 }, blurb: 'kWh and power factor; usually read over RS485 rather than analogue.' },
  { id: 'current', name: 'Current', tag: 'IIT', typicalRange: 'Sized to the motor', io: { ai: 1 }, blurb: 'Motor load signature and blocked drive detection.' },
  { id: 'voltage', name: 'Voltage', tag: 'EIT', typicalRange: 'LV or MV as applicable', io: { ai: 1 }, blurb: 'Supply quality and trip diagnosis.' },
  { id: 'power', name: 'Power', tag: 'JIT', typicalRange: 'Sized to the plant', io: { ai: 1 }, blurb: 'Instantaneous demand and generation.' },
  { id: 'custom', name: 'Custom Sensor', tag: 'XIT', typicalRange: 'Per application', io: { ai: 1 }, blurb: 'Whatever the process requires, specified during the requirement study.' },
]

export const sensorById = (id: string) => sensorTypes.find((s) => s.id === id)

/* ------------------------------------------------------------------
   The common field set every sensor form supports. The brief lists
   these explicitly; they are the same questions an engineer would ask
   before selecting an instrument.
   ------------------------------------------------------------------ */

export const sensorFieldSet: WizardField[] = [
  { id: 'range', label: 'Required range', kind: 'text', help: 'The span you actually operate in, not the full sensor capability.', required: true },
  { id: 'accuracy', label: 'Required accuracy', kind: 'text', help: 'Stated as a percentage of span or an absolute value.', required: true },
  { id: 'resolution', label: 'Required resolution', kind: 'text', help: 'The smallest change you need to detect.' },
  { id: 'output', label: 'Output signal', kind: 'choice', options: ['4 to 20 mA', 'RS485', 'Modbus RTU', 'Digital / pulse', 'Other'], required: true },
  { id: 'protocol', label: 'Protocol', kind: 'choice', options: ['Modbus RTU', 'Modbus TCP', 'OPC UA', 'None / analogue only', 'Other'] },
  { id: 'power', label: 'Power supply available', kind: 'choice', options: ['24 V DC', '230 V AC', 'Loop powered', 'Battery', 'Other'], required: true },
  { id: 'processTemp', label: 'Process temperature', kind: 'text', help: 'Affects wetted material and whether compensation is needed.', unit: 'C', required: true },
  { id: 'processPressure', label: 'Process pressure', kind: 'text', help: 'Determines the process connection rating.', unit: 'bar' },
  { id: 'installation', label: 'Installation type', kind: 'choice', options: ['Immersion', 'Inline', 'Flow through', 'Insertion', 'Clamp on', 'Other'], required: true },
  { id: 'material', label: 'Process compatibility', kind: 'text', help: 'What the wetted parts will be in contact with.', required: true },
  { id: 'ip', label: 'Environmental / IP requirement', kind: 'choice', options: ['IP65', 'IP66', 'IP67', 'IP68', 'Other'], required: true },
  { id: 'cable', label: 'Cable length to panel', kind: 'number', help: 'Long runs are why conversion happens at the device.', unit: 'm' },
  { id: 'calibration', label: 'Calibration requirement', kind: 'choice', options: ['Factory only', 'Field calibratable', 'Automatic', 'Not sure'] },
  { id: 'cleaning', label: 'Cleaning requirement', kind: 'choice', options: ['None', 'Manual periodic', 'Automatic jet cleaning', 'Ultrasonic', 'Not sure'] },
  { id: 'duty', label: 'Continuous or intermittent', kind: 'choice', options: ['Continuous', 'Intermittent'] },
  { id: 'existingSensor', label: 'Existing sensor in place?', kind: 'choice', options: ['Yes', 'No'] },
  { id: 'existingTransmitter', label: 'Existing transmitter in place?', kind: 'choice', options: ['Yes', 'No'] },
]

/* ------------------------------------------------------------------
   The main wizard flow. Conditional steps mean a monitoring only job
   never sees the dosing or panel questions.
   ------------------------------------------------------------------ */

/* The goal question stores the option's label ("Control"), not its id,
   so this compares against the label. Getting this wrong silently hides
   the whole dosing and actuator step. */
const wantsControl = (a: Answers) => a.goal === 'Control' || a.goal === 'Automate'

export const wizardSteps: WizardStep[] = [
  {
    id: 'goal',
    title: 'What do you want to do?',
    intro: 'This sets which questions are worth asking. A monitoring job and a closed loop control job need very different information.',
    fields: [
      { id: 'goal', label: 'Primary goal', kind: 'choice', options: goals.map((g) => g.label), required: true, help: 'Pick the one that matters most. The rest can be added later.' },
      { id: 'application', label: 'Application', kind: 'choice', options: applications, required: true, help: 'Used to pre select the process stages and likely instrumentation.' },
    ],
  },
  {
    id: 'process',
    title: 'The process itself',
    intro: 'Sizing everything downstream starts here. Approximate figures are fine; a wrong precise number is worse than an honest estimate.',
    fields: [
      { id: 'flowRate', label: 'Approximate flow rate or throughput', kind: 'text', unit: 'KL/hour', help: 'Leave as not sure if it has never been measured.', required: true },
      { id: 'capacity', label: 'Plant or tank capacity', kind: 'text', help: 'Whatever figure you have: volume, tonnes per hour, batch size.' },
      { id: 'stages', label: 'Number of process stages to instrument', kind: 'number', required: true },
      { id: 'siteType', label: 'Installation environment', kind: 'choice', options: ['Indoor', 'Outdoor', 'Mixed', 'Hazardous area'], required: true, help: 'Drives IP rating, enclosure material and cable specification.' },
    ],
  },
  {
    id: 'measurement',
    title: 'What has to be measured',
    intro: 'Each selected variable becomes an instrument in the preliminary bill of materials and an input in the I/O count.',
    fields: [
      { id: 'sensors', label: 'Measured variables', kind: 'choice', options: sensorTypes.map((s) => s.name), required: true, help: 'Select every variable you need. You can refine the detail per sensor afterwards.' },
      { id: 'sampleRate', label: 'How often does it need updating?', kind: 'choice', options: ['Continuous', 'Every minute', 'Every 15 minutes', 'Hourly', 'Not sure'] },
    ],
  },
  {
    id: 'control',
    title: 'Control and dosing',
    intro: 'Only asked because you selected a control or automation goal. Each actuator adds outputs and feedback inputs to the count.',
    fields: [
      { id: 'dosingChemicals', label: 'Number of dosing chemicals', kind: 'number', showIf: wantsControl, help: 'Zero is a valid answer.' },
      { id: 'dosingPumps', label: 'Number of dosing pumps', kind: 'number', showIf: wantsControl },
      { id: 'pumps', label: 'Number of process pumps', kind: 'number', showIf: wantsControl },
      { id: 'valves', label: 'Number of actuated valves', kind: 'number', showIf: wantsControl },
      { id: 'motors', label: 'Number of motors or drives', kind: 'number', showIf: wantsControl },
      { id: 'vfds', label: 'How many need speed control (VFD)?', kind: 'number', showIf: wantsControl, help: 'A VFD adds an analogue output and usually a communication link.' },
    ],
  },
  {
    id: 'existing',
    title: 'What already exists on site',
    intro: 'Equipment that is fit for purpose should be kept. Declaring it here keeps it out of the bill of materials.',
    fields: [
      { id: 'reuseExisting', label: 'Reuse existing infrastructure where possible?', kind: 'choice', options: ['Yes', 'No', 'Not sure'], required: true },
      { id: 'existingPlc', label: 'Existing PLC?', kind: 'choice', options: ['Yes', 'No'] },
      { id: 'existingPlcModel', label: 'Existing PLC make and model', kind: 'text', showIf: (a) => a.existingPlc === 'Yes' },
      { id: 'existingHmi', label: 'Existing HMI?', kind: 'choice', options: ['Yes', 'No'] },
      { id: 'existingScada', label: 'Existing SCADA?', kind: 'choice', options: ['Yes', 'No'] },
      { id: 'existingVfd', label: 'Existing VFD?', kind: 'choice', options: ['Yes', 'No'] },
      { id: 'existingSensors', label: 'Existing sensors?', kind: 'choice', options: ['Yes', 'No'] },
      { id: 'existingPanel', label: 'Existing control panel?', kind: 'choice', options: ['Yes', 'No'] },
    ],
  },
  {
    id: 'interface',
    title: 'Operator interface and panel',
    intro: 'Who looks at this, where they stand, and what they need to be able to change.',
    fields: [
      { id: 'hmiRequired', label: 'HMI required?', kind: 'choice', options: ['Yes', 'No', 'Not sure'], required: true },
      { id: 'hmiSize', label: 'HMI screen size', kind: 'choice', options: ['4.3 inch', '7 inch', '10 inch', '12 inch', '15 inch', 'Custom'], showIf: (a) => a.hmiRequired === 'Yes' },
      { id: 'panelRequired', label: 'Control panel required?', kind: 'choice', options: ['Yes', 'No', 'Not sure'], required: true },
      { id: 'supplyVoltage', label: 'Supply voltage', kind: 'choice', options: ['230 V single phase', '415 V three phase', 'Other'], showIf: (a) => a.panelRequired === 'Yes', required: true },
    ],
  },
  {
    id: 'monitoring',
    title: 'Remote monitoring and records',
    intro: 'The cloud layer reports on the plant. It never becomes a dependency for running it.',
    fields: [
      { id: 'remoteMonitoring', label: 'Mobile or remote monitoring required?', kind: 'choice', options: ['Yes', 'No', 'Not sure'], required: true },
      { id: 'dataRetention', label: 'How long must data be retained?', kind: 'choice', options: ['Not required', '3 months', '1 year', '3 years', 'Longer', 'Not sure'], showIf: (a) => a.remoteMonitoring === 'Yes' },
      { id: 'compliance', label: 'Is this data used for compliance reporting?', kind: 'choice', options: ['Yes', 'No', 'Not sure'], help: 'Changes what has to be retained and how it is exported.' },
      { id: 'alarmDelivery', label: 'How should alarms reach somebody?', kind: 'choice', options: ['HMI only', 'HMI and mobile', 'Email', 'Not sure'], showIf: (a) => a.remoteMonitoring === 'Yes' },
    ],
  },
  {
    id: 'commercial',
    title: 'Scope and timeline',
    intro: 'Nothing here is priced. It establishes which line items belong in the preliminary bill of materials.',
    fields: [
      { id: 'installation', label: 'Installation required?', kind: 'choice', options: ['Yes', 'No', 'Not sure'] },
      { id: 'commissioning', label: 'Commissioning required?', kind: 'choice', options: ['Yes', 'No', 'Not sure'] },
      { id: 'amc', label: 'AMC required?', kind: 'choice', options: ['Yes', 'No', 'Not sure'] },
      { id: 'timeline', label: 'Expected timeline', kind: 'choice', options: ['Urgent', 'Within 3 months', 'Within 6 months', 'Planning stage', 'Not sure'] },
    ],
  },
]

/** Fields a completed requirement should carry, used for the gap list. */
export function visibleFields(step: WizardStep, answers: Answers) {
  return step.fields.filter((f) => !f.showIf || f.showIf(answers))
}

/**
 * Completeness is a count of answered required fields over the required
 * fields currently visible. It is arithmetic, not a judgement, and it
 * deliberately does not reward a "Not sure" answer.
 */
export function completeness(answers: Answers) {
  let total = 0
  let answered = 0
  const missing: string[] = []

  for (const step of wizardSteps) {
    for (const field of visibleFields(step, answers)) {
      if (!field.required) continue
      total += 1
      const value = answers[field.id]
      if (value && value !== NOT_SURE && value.trim() !== '') answered += 1
      else missing.push(field.label)
    }
  }

  return {
    percent: total === 0 ? 0 : Math.round((answered / total) * 100),
    answered,
    total,
    missing,
  }
}
