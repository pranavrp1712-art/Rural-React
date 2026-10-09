/**
 * RFQ summary, preliminary BOM and quotation stage UI. Spec 07.
 *
 * Frontend only. No backend, no stored pricing, no authentication.
 * Quantities come from the configurators; every commercial figure is
 * shown as "To be configured" because no price data is supplied.
 */

export const NO_PRICE = 'To be configured'

/* ------------------------------------------------------------------
   Preliminary BOM categories
   ------------------------------------------------------------------ */

export interface BomCategory {
  id: string
  label: string
  group: 'Field' | 'Control' | 'Electrical' | 'Connectivity' | 'Services'
  /** How the quantity is arrived at, shown so the number is auditable. */
  basis: string
}

export const bomCategories: BomCategory[] = [
  { id: 'sensors', label: 'Sensors', group: 'Field', basis: 'One per measured variable selected in the requirement.' },
  { id: 'transmitters', label: 'Transmitters', group: 'Field', basis: 'One per sensor requiring signal conversion at the device.' },
  { id: 'plc', label: 'PLC', group: 'Control', basis: 'One controller, selected from I/O count and protocol requirement.' },
  { id: 'ioModules', label: 'I/O Modules', group: 'Control', basis: 'Card count from the recommended I/O, rounded to whole modules.' },
  { id: 'hmi', label: 'HMI', group: 'Control', basis: 'One per operator station where an HMI is required.' },
  { id: 'smps', label: 'SMPS', group: 'Electrical', basis: 'Sized from the 24 V DC load in the panel.' },
  { id: 'mcb', label: 'MCB', group: 'Electrical', basis: 'Per protected circuit.' },
  { id: 'mccb', label: 'MCCB', group: 'Electrical', basis: 'Incomer and major feeders.' },
  { id: 'relays', label: 'Relays', group: 'Electrical', basis: 'Per relay output and interposing requirement.' },
  { id: 'contactors', label: 'Contactors', group: 'Electrical', basis: 'Per direct on line motor feeder.' },
  { id: 'vfd', label: 'VFD', group: 'Electrical', basis: 'Per motor requiring speed control.' },
  { id: 'terminals', label: 'Terminal Blocks', group: 'Electrical', basis: 'Estimated from total field wiring points.' },
  { id: 'enclosure', label: 'Enclosure', group: 'Electrical', basis: 'One panel, sized by the panel configurator.' },
  { id: 'switch', label: 'Industrial Switch', group: 'Connectivity', basis: 'Where more than one Ethernet device is present.' },
  { id: 'gateway', label: 'Gateway', group: 'Connectivity', basis: 'One where remote monitoring is in scope.' },
  { id: 'pcb', label: 'PCB', group: 'Connectivity', basis: 'Where custom electronics are required for the signal or enclosure.' },
  { id: 'cables', label: 'Cables', group: 'Connectivity', basis: 'Estimated from instrument count and stated cable runs.' },
  { id: 'connectors', label: 'Connectors', group: 'Connectivity', basis: 'Per field termination.' },
  { id: 'software', label: 'Software', group: 'Services', basis: 'Controller and HMI development against the functional description.' },
  { id: 'cloud', label: 'Cloud', group: 'Services', basis: 'Where remote monitoring and data retention are in scope.' },
  { id: 'engineering', label: 'Engineering', group: 'Services', basis: 'Requirement study, schematics, GA drawings and I/O list.' },
  { id: 'installation', label: 'Installation', group: 'Services', basis: 'Where installation is in scope.' },
  { id: 'commissioning', label: 'Commissioning', group: 'Services', basis: 'Where commissioning is in scope.' },
  { id: 'calibration', label: 'Calibration', group: 'Services', basis: 'Per supplied instrument.' },
  { id: 'amc', label: 'AMC', group: 'Services', basis: 'Where an annual maintenance contract is in scope.' },
]

export const bomGroups = ['Field', 'Control', 'Electrical', 'Connectivity', 'Services'] as const

/* ------------------------------------------------------------------
   Quotation stages. UI labels only. The website explains the stage; it
   never presents a preliminary estimate as an approved quotation.
   ------------------------------------------------------------------ */

export const quotationStages = [
  {
    stage: 'STAGE 1',
    title: 'Preliminary Estimate',
    body: 'Generated from your answers by the configurator. It reflects what you told us and nothing more. It is not checked by an engineer and it carries no commercial commitment.',
    authority: 'Produced automatically. No approval implied.',
  },
  {
    stage: 'STAGE 2',
    title: 'Engineering Approved Quotation',
    body: 'Issued after a RuralReact engineer has reviewed the requirement, resolved the gaps and verified the selections. This is the only document that carries a commitment.',
    authority: 'Only authorised RuralReact personnel can approve a final commercial quotation.',
  },
]

/** Quote line structure, shown to explain what a quotation contains. */
export const quoteStructure = [
  'Hardware',
  'Sensors',
  'PLC',
  'HMI',
  'Panel',
  'Electrical Components',
  'Gateway',
  'PCB',
  'Software',
  'Cloud',
  'Engineering',
  'Fabrication',
  'Installation',
  'Commissioning',
  'Calibration',
  'Travel',
  'AMC',
  'Taxes',
  'Shipping',
]

/* ------------------------------------------------------------------
   RFQ status tracker. This is a process explainer, not a live status
   tied to a customer account.
   ------------------------------------------------------------------ */

export interface TrackerStage {
  label: string
  /** Who moves it forward. */
  owner: 'You' | 'RuralReact' | 'Both'
  note: string
}

export const rfqTracker: TrackerStage[] = [
  { label: 'Draft', owner: 'You', note: 'Held in your browser until you choose to send it.' },
  { label: 'Submitted', owner: 'You', note: 'The requirement reaches RuralReact as you wrote it.' },
  { label: 'Engineering Review', owner: 'RuralReact', note: 'An engineer checks the selections and the gaps.' },
  { label: 'Clarification Required', owner: 'Both', note: 'The unanswered fields are raised as specific questions.' },
  { label: 'Technical Proposal', owner: 'RuralReact', note: 'Verified scope, architecture and bill of materials.' },
  { label: 'Commercial Proposal', owner: 'RuralReact', note: 'Pricing applied to the verified scope.' },
  { label: 'Quote Sent', owner: 'RuralReact', note: 'Stage 2, engineering approved.' },
  { label: 'Approved', owner: 'You', note: 'Scope and commercials accepted.' },
  { label: 'PO Received', owner: 'You', note: 'Order placed against the approved quotation.' },
  { label: 'Engineering', owner: 'RuralReact', note: 'Schematics, GA drawings and I/O list issued.' },
  { label: 'Manufacturing', owner: 'RuralReact', note: 'Panel fabrication and wiring.' },
  { label: 'Testing', owner: 'RuralReact', note: 'Works testing against the drawings.' },
  { label: 'Dispatch', owner: 'RuralReact', note: 'Released after test records are complete.' },
  { label: 'Installation', owner: 'Both', note: 'Mounting, cabling and termination on site.' },
  { label: 'Commissioning', owner: 'Both', note: 'Loop checks, function tests and operator handover.' },
  { label: 'AMC', owner: 'RuralReact', note: 'Calibration, preventive servicing and support.' },
]

export const PRELIMINARY_LABEL = 'Preliminary Configuration — not engineering approved'
