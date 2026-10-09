/**
 * Configurator rules. Spec 05.
 *
 * Every calculation here runs client side and every rule lives in this
 * file rather than inside a component, so the engineering can be
 * corrected without touching UI code. Nothing this file produces is a
 * final design: the outputs are labelled preliminary wherever they are
 * shown.
 */

/* ------------------------------------------------------------------
   PLC configurator
   ------------------------------------------------------------------ */

export const plcBrands = [
  'No Preference',
  'Siemens',
  'ABB',
  'Schneider',
  'Rockwell',
  'Honeywell',
  'Emerson',
  'Mitsubishi',
  'Omron',
  'Other',
]

export const plcCapabilities = [
  { id: 'di', label: 'Digital Inputs', blurb: 'Switches, feedback contacts, guard and interlock status.' },
  { id: 'do', label: 'Digital Outputs', blurb: 'Contactors, solenoids and indication.' },
  { id: 'ai', label: 'Analog Inputs', blurb: '4 to 20 mA instrument signals.' },
  { id: 'ao', label: 'Analog Outputs', blurb: 'Speed references and modulating valves.' },
  { id: 'relay', label: 'Relay Outputs', blurb: 'Where a volt free contact is required.' },
  { id: 'hsc', label: 'High speed inputs', blurb: 'Encoders and pulse flow meters.' },
  { id: 'eth', label: 'Ethernet ports', blurb: 'Modbus TCP, OPC UA and gateway link.' },
  { id: 'rs485', label: 'RS485 ports', blurb: 'Modbus RTU field devices and meters.' },
]

export const plcProtocols = ['Modbus RTU', 'Modbus TCP', 'OPC UA', 'Ethernet/IP', 'Profibus', 'Profinet', 'Other']

export const existingInfrastructure = [
  { id: 'existingPlc', label: 'Existing PLC' },
  { id: 'existingPlcModel', label: 'Existing PLC model' },
  { id: 'existingHmi', label: 'Existing HMI' },
  { id: 'existingScada', label: 'Existing SCADA' },
  { id: 'existingVfd', label: 'Existing VFD' },
  { id: 'existingSensors', label: 'Existing sensors' },
  { id: 'existingPanel', label: 'Existing panel' },
]

/* ------------------------------------------------------------------
   I/O calculator rules

   One row per device type. The counts are per unit, multiplied by the
   quantity the user enters. Editing a row here changes the calculation
   everywhere without a component change.
   ------------------------------------------------------------------ */

export interface IoRule {
  id: string
  label: string
  /** Why the device carries this I/O signature. */
  reason: string
  di: number
  do: number
  ai: number
  ao: number
  relay: number
  /** Serial or Ethernet device rather than a wired point. */
  comms?: number
}

export const ioRules: IoRule[] = [
  { id: 'phSensor', label: 'pH sensor', reason: 'One 4 to 20 mA transmitter input.', di: 0, do: 0, ai: 1, ao: 0, relay: 0 },
  { id: 'orpSensor', label: 'ORP sensor', reason: 'One 4 to 20 mA transmitter input.', di: 0, do: 0, ai: 1, ao: 0, relay: 0 },
  { id: 'flowSensor', label: 'Flow sensor', reason: 'One analogue input; pulse output uses a high speed input instead.', di: 0, do: 0, ai: 1, ao: 0, relay: 0 },
  { id: 'pressureSensor', label: 'Pressure sensor', reason: 'One 4 to 20 mA transmitter input.', di: 0, do: 0, ai: 1, ao: 0, relay: 0 },
  { id: 'levelSensor', label: 'Level sensor', reason: 'One analogue input for continuous level.', di: 0, do: 0, ai: 1, ao: 0, relay: 0 },
  { id: 'tempSensor', label: 'Temperature sensor', reason: 'One analogue input, RTD or 4 to 20 mA.', di: 0, do: 0, ai: 1, ao: 0, relay: 0 },
  { id: 'otherSensor', label: 'Other analogue sensor', reason: 'One analogue input per transmitter.', di: 0, do: 0, ai: 1, ao: 0, relay: 0 },
  { id: 'levelSwitch', label: 'Level switch', reason: 'One digital input per float or switch.', di: 1, do: 0, ai: 0, ao: 0, relay: 0 },
  { id: 'pump', label: 'Pump (direct on line)', reason: 'One output to start it, one input to prove it ran.', di: 1, do: 1, ai: 0, ao: 0, relay: 0 },
  { id: 'dosingPump', label: 'Dosing pump', reason: 'One output to run it, one feedback input; analogue output where the stroke is modulated.', di: 1, do: 1, ai: 0, ao: 1, relay: 0 },
  { id: 'vfdMotor', label: 'Motor with VFD', reason: 'Run output, feedback input and a speed reference; drives on Modbus use a communication port instead.', di: 1, do: 1, ai: 0, ao: 1, relay: 0, comms: 1 },
  { id: 'onOffValve', label: 'On / off valve', reason: 'One output to drive it, one input per limit switch.', di: 2, do: 1, ai: 0, ao: 0, relay: 0 },
  { id: 'modulatingValve', label: 'Modulating valve', reason: 'Analogue output for position demand, analogue input for position feedback.', di: 0, do: 0, ai: 1, ao: 1, relay: 0 },
  { id: 'blower', label: 'Blower / aerator', reason: 'Run output and feedback input.', di: 1, do: 1, ai: 0, ao: 0, relay: 0 },
  { id: 'alarmBeacon', label: 'Alarm beacon / hooter', reason: 'One relay output.', di: 0, do: 0, ai: 0, ao: 0, relay: 1 },
  { id: 'energyMeter', label: 'Energy meter', reason: 'Read over RS485 rather than wired; consumes a communication node.', di: 0, do: 0, ai: 0, ao: 0, relay: 0, comms: 1 },
  { id: 'emergencyStop', label: 'Emergency stop', reason: 'Monitored digital input, in addition to the hardwired safety circuit.', di: 1, do: 0, ai: 0, ao: 0, relay: 0 },
]

export const ioRuleById = (id: string) => ioRules.find((r) => r.id === id)

export interface IoTotals {
  di: number
  do: number
  ai: number
  ao: number
  relay: number
  comms: number
}

export const emptyTotals: IoTotals = { di: 0, do: 0, ai: 0, ao: 0, relay: 0, comms: 0 }

/**
 * Required I/O is the raw sum. Recommended I/O adds the engineering
 * spare and then rounds up to a whole module, because you buy cards
 * rather than individual points.
 */
export function calculateIo(quantities: Record<string, number>, sparePercent: number) {
  const required: IoTotals = { ...emptyTotals }

  for (const rule of ioRules) {
    const qty = quantities[rule.id] ?? 0
    if (qty <= 0) continue
    required.di += rule.di * qty
    required.do += rule.do * qty
    required.ai += rule.ai * qty
    required.ao += rule.ao * qty
    required.relay += rule.relay * qty
    required.comms += (rule.comms ?? 0) * qty
  }

  const withSpare = (n: number) => Math.ceil(n * (1 + sparePercent / 100))

  const recommended: IoTotals = {
    di: roundToModule(withSpare(required.di), moduleSize.di),
    do: roundToModule(withSpare(required.do), moduleSize.do),
    ai: roundToModule(withSpare(required.ai), moduleSize.ai),
    ao: roundToModule(withSpare(required.ao), moduleSize.ao),
    relay: roundToModule(withSpare(required.relay), moduleSize.relay),
    comms: required.comms,
  }

  return { required, recommended }
}

/** Points per card, used to round a recommendation up to real hardware. */
export const moduleSize = { di: 16, do: 16, ai: 8, ao: 4, relay: 8 } as const

function roundToModule(points: number, size: number) {
  if (points <= 0) return 0
  return Math.ceil(points / size) * size
}

export function cardCount(points: number, size: number) {
  return points <= 0 ? 0 : Math.ceil(points / size)
}

/* ------------------------------------------------------------------
   Control panel configurator
   ------------------------------------------------------------------ */

export const panelElectrical = [
  { id: 'supplyVoltage', label: 'Supply voltage', options: ['230 V', '415 V', 'Other'] },
  { id: 'phase', label: 'Phase', options: ['Single phase', 'Three phase'] },
  { id: 'frequency', label: 'Frequency', options: ['50 Hz', '60 Hz'] },
]

export const panelComponents = [
  { id: 'plc', label: 'PLC' },
  { id: 'hmi', label: 'HMI' },
  { id: 'smps', label: 'SMPS' },
  { id: 'mcb', label: 'MCB' },
  { id: 'mccb', label: 'MCCB' },
  { id: 'contactors', label: 'Contactors' },
  { id: 'overload', label: 'Overload relays' },
  { id: 'relayModules', label: 'Relay modules' },
  { id: 'terminals', label: 'Terminal blocks' },
  { id: 'safetyRelay', label: 'Safety relay' },
  { id: 'estop', label: 'Emergency stop' },
  { id: 'surge', label: 'Surge protection' },
  { id: 'fan', label: 'Cooling fan' },
  { id: 'heater', label: 'Panel heater' },
  { id: 'lighting', label: 'Panel lighting' },
  { id: 'doorSwitch', label: 'Door switch' },
  { id: 'switch', label: 'Industrial Ethernet switch' },
  { id: 'ups', label: 'UPS' },
  { id: 'gateway', label: 'Communication gateway' },
]

export const panelEnclosure = [
  { id: 'material', label: 'Enclosure material', options: ['Mild steel powder coated', 'Stainless steel 304', 'Stainless steel 316', 'Polycarbonate', 'Not sure'] },
  { id: 'ip', label: 'IP rating', options: ['IP54', 'IP55', 'IP65', 'IP66', 'Not sure'] },
  { id: 'location', label: 'Indoor / outdoor', options: ['Indoor', 'Outdoor', 'Not sure'] },
  { id: 'mounting', label: 'Mounting', options: ['Wall mounted', 'Floor standing', 'Not sure'] },
  { id: 'cableEntry', label: 'Cable entry', options: ['Bottom', 'Top', 'Both', 'Not sure'] },
]

/**
 * A preliminary enclosure estimate from component count and drive
 * quantity. This is deliberately crude: it exists to give a sense of
 * scale, and the UI states plainly that detailed engineering is what
 * actually determines the size.
 */
export function estimateEnclosure(input: {
  ioPoints: number
  motorCount: number
  vfdCount: number
  hasHmi: boolean
  hasUps: boolean
}) {
  // Each starter column and each drive takes real width; I/O takes
  // DIN rail length, which converts to height.
  const widthMm = 600 + input.vfdCount * 200 + Math.max(0, input.motorCount - 2) * 100
  const heightMm = 800 + Math.ceil(input.ioPoints / 32) * 150 + (input.hasUps ? 200 : 0)
  const depthMm = input.vfdCount > 0 || input.hasUps ? 400 : 300

  return {
    width: Math.min(2000, Math.round(widthMm / 100) * 100),
    height: Math.min(2200, Math.round(heightMm / 100) * 100),
    depth: depthMm,
    hasHmi: input.hasHmi,
  }
}

export const ENCLOSURE_DISCLAIMER =
  'Final enclosure dimensions require detailed engineering, component layout, heat dissipation, cable routing, segregation and service-clearance verification.'

export const IO_DISCLAIMER = 'Preliminary Engineering Estimate — not a final engineering design.'

/* ------------------------------------------------------------------
   Panel engineering workflow
   ------------------------------------------------------------------ */

export const panelWorkflowSteps = [
  'Requirement Study',
  'Load Calculation',
  'I/O Calculation',
  'Component Selection',
  'Electrical Schematic',
  'Panel GA',
  'Enclosure Selection',
  'Fabrication',
  'Wiring',
  'PLC Programming',
  'HMI Programming',
  'Testing',
  'FAT',
  'Installation',
  'Commissioning',
  'AMC',
]

/* ------------------------------------------------------------------
   HMI configurator
   ------------------------------------------------------------------ */

export const hmiSizes = ['4.3 inch', '7 inch', '10 inch', '12 inch', '15 inch', 'Custom']

export const hmiScreens = [
  { id: 'overview', label: 'Process Overview', blurb: 'The one screen an operator leaves up all shift.' },
  { id: 'pid', label: 'P&ID View', blurb: 'Live values on the process diagram.' },
  { id: 'pumps', label: 'Pump Status', blurb: 'Run state, hours, duty rotation and faults.' },
  { id: 'valves', label: 'Valve Status', blurb: 'Position, feedback and mismatch detection.' },
  { id: 'sensors', label: 'Sensor Values', blurb: 'Every measured variable with its tag and units.' },
  { id: 'trends', label: 'Trends', blurb: 'Historical curves on the same tags.' },
  { id: 'alarms', label: 'Alarms', blurb: 'Active, acknowledged and historical.' },
  { id: 'manual', label: 'Manual / Auto', blurb: 'Override with the permissives still enforced.' },
  { id: 'setpoints', label: 'Setpoints', blurb: 'Adjustable within engineered limits.' },
  { id: 'recipes', label: 'Recipes', blurb: 'Stored parameter sets for repeatable batches.' },
  { id: 'users', label: 'User Roles', blurb: 'Who can change what, and a record of who did.' },
  { id: 'reports', label: 'Reports', blurb: 'Shift and batch summaries.' },
  { id: 'history', label: 'Historical Data', blurb: 'Retained records and export.' },
]
