/**
 * Industry pages. Spec 02.
 *
 * Nothing here claims a deployment. Where the company material does not
 * confirm an installed application, `verified` stays false and the UI
 * renders the "Automation Solution Category" qualifier instead of
 * presenting it as an existing RuralReact site.
 */

export interface ProcessStage {
  id: string
  label: string
  /** Instrument-style tag for the mono face. */
  tag: string
  /** What the stage does, one line. */
  note: string
  /** Stages the user can switch off in the configurator. */
  optional?: boolean
}

export interface Instrument {
  /** Measured variable, e.g. "pH". */
  variable: string
  tag: string
  typicalRange: string
  /** Why this stage needs it. */
  purpose: string
}

export interface Industry {
  slug: string
  name: string
  /** One line for cards and menus. */
  summary: string
  /** Long form opening for the detail page. */
  overview: string
  /**
   * False until the company material confirms a delivered project in
   * this industry. Drives the "Automation Solution Category" label.
   */
  verified: boolean
  categories: string[]
  problems: { title: string; body: string }[]
  opportunities: { title: string; body: string }[]
  processFlow: ProcessStage[]
  instrumentation: Instrument[]
  control: {
    plc: string
    hmi: string
    panel: string
    field: string
  }
  communication: string[]
  alarms: string[]
  logging: string[]
  energy: string
  predictive: string
  architecture: string
}

export const industries: Industry[] = [
  {
    slug: 'water-and-wastewater',
    name: 'Water & Wastewater',
    summary: 'ETP, STP, purification and reuse lines, measured and dosed under closed loop control.',
    overview:
      'Treatment is a chain of stages that each depend on the one before. A pH correction step that runs blind wastes chemical and still misses the discharge limit, and nobody finds out until the sample comes back from the lab. Instrumenting the stages and closing the loop in a controller turns that into a number the operator can see on the shift he is working.',
    verified: false,
    categories: ['Water Purification', 'ETP', 'STP', 'Industrial Effluent', 'Chemical Dosing'],
    problems: [
      {
        title: 'Dosing set by hand and by habit',
        body: 'Chemical is dosed to a fixed pump setting rather than to the measured value, so the plant over doses to stay safe and pays for it every day.',
      },
      {
        title: 'Discharge quality proven from memory',
        body: 'When a compliance question arrives there is no retained record of pH, flow or chlorine at the time in question, only the operator log book.',
      },
      {
        title: 'Faults found on the next round',
        body: 'A stopped dosing pump or a drifting probe is discovered when somebody walks past it, not when it happens.',
      },
      {
        title: 'Three suppliers, one wrong reading',
        body: 'The probe, the panel and the dashboard come from different vendors, so a bad number turns into an argument rather than a fix.',
      },
    ],
    opportunities: [
      {
        title: 'Closed loop pH correction',
        body: 'Measure pH continuously, drive the dosing pump from the deviation, and alarm on the pump feedback rather than on the setpoint alone.',
      },
      {
        title: 'Retained compliance record',
        body: 'Log the parameters you have to prove on the same tags the operator sees, with trends and exportable reports.',
      },
      {
        title: 'Remote visibility without remote control',
        body: 'The gateway publishes outbound so a plant can be watched from a phone while the interlocks stay in the controller.',
      },
      {
        title: 'Chemical consumption as a tracked number',
        body: 'Totalise dosing against flow so consumption per cubic metre becomes a figure you can manage instead of an invoice you receive.',
      },
    ],
    processFlow: [
      { id: 'inlet', label: 'Inlet', tag: 'FIT-101', note: 'Raw effluent arrives; flow is totalised here.' },
      { id: 'equalization', label: 'Equalization', tag: 'LIT-102', note: 'Buffers load so downstream stages see a steady feed.' },
      { id: 'ph', label: 'pH correction', tag: 'AIT-103', note: 'Acid or alkali dosed to bring pH into the working band.' },
      { id: 'dosing', label: 'Chemical dosing', tag: 'PMP-104', note: 'Coagulant and flocculant metered against flow.' },
      { id: 'aeration', label: 'Aeration', tag: 'AIT-105', note: 'Blowers held to a dissolved oxygen setpoint.', optional: true },
      { id: 'clarification', label: 'Clarification', tag: 'LIT-106', note: 'Solids settle; sludge drawn off on a timer or level.' },
      { id: 'filtration', label: 'Filtration', tag: 'PIT-107', note: 'Differential pressure triggers the backwash sequence.', optional: true },
      { id: 'disinfection', label: 'Disinfection', tag: 'AIT-108', note: 'Residual chlorine trimmed to the target.', optional: true },
      { id: 'outlet', label: 'Outlet / reuse', tag: 'AIT-109', note: 'Final quality logged before discharge or recycle.' },
    ],
    instrumentation: [
      { variable: 'pH', tag: 'AIT', typicalRange: '0 to 14 pH', purpose: 'Drives acid and alkali dosing; the primary compliance parameter.' },
      { variable: 'ORP', tag: 'AIT', typicalRange: '-1500 to +1500 mV', purpose: 'Confirms oxidation or reduction has actually taken place.' },
      { variable: 'Conductivity', tag: 'CIT', typicalRange: '0 to 200 mS/cm', purpose: 'Tracks dissolved salts through the line and after reuse.' },
      { variable: 'TDS', tag: 'AIT', typicalRange: '0 to 100000 ppm', purpose: 'Reuse quality and RO recovery monitoring.' },
      { variable: 'Turbidity', tag: 'AIT', typicalRange: '0 to 1000 NTU', purpose: 'Carryover from the clarifier and filter breakthrough.' },
      { variable: 'Flow', tag: 'FIT', typicalRange: 'Sized to the line', purpose: 'Totalisation and flow proportional dosing.' },
      { variable: 'Pressure', tag: 'PIT', typicalRange: '0 to 10 bar', purpose: 'Pump health and filter differential pressure.' },
      { variable: 'Level', tag: 'LIT', typicalRange: 'Sized to the tank', purpose: 'Tank protection, pump interlocks and dry run prevention.' },
      { variable: 'Temperature', tag: 'TIT', typicalRange: '0 to 100 C', purpose: 'Process compensation for pH and conductivity.' },
      { variable: 'Dissolved oxygen', tag: 'AIT', typicalRange: '0 to 20 mg/L', purpose: 'Aeration control; usually the largest energy line.' },
      { variable: 'Chlorine', tag: 'AIT', typicalRange: '0 to 10 mg/L', purpose: 'Residual disinfection at the outlet.' },
    ],
    control: {
      plc: 'Dosing sequences, pump changeover and interlocks run on a fixed scan in the controller, so the plant keeps running when the link is down.',
      hmi: 'Process overview, pump and valve status, setpoints, trends and the alarm list, written for the operator on the night shift.',
      panel: 'Incomer, protection, feeders, dosing pump starters, drives, terminals and wiring, built to schematic and GA drawings and tested before dispatch.',
      field: 'Dosing pumps, blowers, actuated valves and transfer pumps, driven direct on line or through a VFD depending on the duty.',
    },
    communication: ['4 to 20 mA', 'RS485', 'Modbus RTU', 'Modbus TCP', 'Ethernet', 'MQTT to cloud'],
    alarms: ['pH high', 'pH low', 'Level high / low', 'Dosing pump fault', 'Blower fault', 'Sensor fault', 'Communication fault'],
    logging: ['pH and ORP trends', 'Flow totals per shift and per day', 'Chemical consumption', 'Outlet quality record', 'Alarm and event history'],
    energy:
      'Aeration is usually the largest consumer. Metering the blower feeder separately turns energy per cubic metre treated into a figure that can be managed.',
    predictive:
      'Pump run hours, starts per hour and filter differential pressure are trended so servicing is scheduled on condition rather than on the calendar.',
    architecture:
      'Field instruments report to the PLC over 4 to 20 mA and RS485. The PLC holds all control logic. An edge gateway reads from the PLC and publishes outbound only to the cloud, so the plant network is never exposed to the internet.',
  },
  {
    slug: 'chemical-and-process',
    name: 'Chemical & Process',
    summary: 'Batch and continuous process control, dosing, recipes and retained batch records.',
    overview:
      'Process plants live on repeatability. The same batch run twice should produce the same result, and when it does not you need the record to show which step drifted. Sequencing the steps in the controller and retaining the parameters turns a recipe from a procedure on paper into something the plant actually executes the same way each time.',
    verified: false,
    categories: ['Chemical Dosing', 'Process Plants', 'Industrial Effluent', 'Custom Industrial Applications'],
    problems: [
      { title: 'Batch to batch variation', body: 'Manual steps and manual timing mean two operators produce two slightly different results from the same recipe.' },
      { title: 'No retained batch record', body: 'A quality query cannot be answered because the temperature and dosing profile for that batch was never stored.' },
      { title: 'Interlocks in the operator memory', body: 'Safety sequencing depends on somebody remembering the order rather than on the controller enforcing it.' },
      { title: 'Unmonitored utilities', body: 'Steam, chilled water and compressed air are consumed without being measured against output.' },
    ],
    opportunities: [
      { title: 'Recipe driven sequencing', body: 'Steps, setpoints and hold times stored as recipes and executed by the controller, with the operator confirming rather than timing.' },
      { title: 'Retained batch record', body: 'Every batch logged with its parameters and its alarms, exportable when a customer asks.' },
      { title: 'Enforced interlocks', body: 'Valve and agitator permissives held in logic so an out of order step is simply not possible.' },
      { title: 'Utility metering per batch', body: 'Steam and power attributed to the batch that consumed them.' },
    ],
    processFlow: [
      { id: 'charge', label: 'Raw material charge', tag: 'WIT-201', note: 'Weighed or metered addition against the recipe.' },
      { id: 'mix', label: 'Mixing', tag: 'AGT-202', note: 'Agitator speed and run time held to the step.' },
      { id: 'react', label: 'Reaction', tag: 'TIT-203', note: 'Temperature ramped and held; the critical control step.' },
      { id: 'dose', label: 'Dosing', tag: 'PMP-204', note: 'Reagent metered to rate or to measured endpoint.' },
      { id: 'hold', label: 'Hold / maturation', tag: 'TIT-205', note: 'Timed hold with deviation alarms.', optional: true },
      { id: 'transfer', label: 'Transfer', tag: 'FIT-206', note: 'Metered transfer to the next vessel or to storage.' },
      { id: 'clean', label: 'Clean in place', tag: 'CIT-207', note: 'Rinse, caustic, rinse sequence with conductivity confirmation.', optional: true },
    ],
    instrumentation: [
      { variable: 'Temperature', tag: 'TIT', typicalRange: '-50 to 400 C', purpose: 'The primary reaction control variable.' },
      { variable: 'Pressure', tag: 'PIT', typicalRange: '0 to 25 bar', purpose: 'Vessel protection and reaction monitoring.' },
      { variable: 'Level', tag: 'LIT', typicalRange: 'Sized to the vessel', purpose: 'Charge confirmation and overfill protection.' },
      { variable: 'Flow', tag: 'FIT', typicalRange: 'Sized to the line', purpose: 'Metered addition and transfer totalisation.' },
      { variable: 'pH', tag: 'AIT', typicalRange: '0 to 14 pH', purpose: 'Endpoint detection for neutralisation steps.' },
      { variable: 'Conductivity', tag: 'CIT', typicalRange: '0 to 200 mS/cm', purpose: 'Clean in place rinse confirmation.' },
      { variable: 'Weight', tag: 'WIT', typicalRange: 'Sized to the vessel', purpose: 'Gravimetric charging where volumetric is not accurate enough.' },
    ],
    control: {
      plc: 'Sequential control written to an ISA-88 style step structure, with recipes held as data rather than as code.',
      hmi: 'P&ID view, step status, setpoint entry, recipe selection, trends and batch reports.',
      panel: 'Segregated power and control, drives for agitators and pumps, intrinsically safe barriers where the area classification requires them.',
      field: 'Actuated valves, agitator drives, metering pumps and heating or cooling control.',
    },
    communication: ['4 to 20 mA', 'HART', 'Modbus RTU', 'Modbus TCP', 'OPC UA', 'MQTT to cloud'],
    alarms: ['Temperature deviation', 'Pressure high', 'Level high / low', 'Step timeout', 'Valve feedback mismatch', 'Sensor fault', 'Communication fault'],
    logging: ['Batch record per run', 'Step and setpoint history', 'Deviation and alarm log', 'Utility consumption per batch'],
    energy: 'Heating, cooling and agitation dominate. Metering them per batch shows which recipes and which vessels carry the cost.',
    predictive:
      'Agitator current signature, pump run hours and heat exchanger approach temperature are trended to flag fouling and wear before a batch is lost.',
    architecture:
      'Instruments report to the PLC; the PLC executes the recipe and holds every interlock. Batch records are written locally and forwarded by the gateway over an outbound link, so a network outage delays reporting but never a batch.',
  },
  {
    slug: 'manufacturing-and-msme',
    name: 'Manufacturing & MSMEs',
    summary: 'Machine automation, OEE visibility and panel retrofits sized for smaller plants.',
    overview:
      'A smaller plant rarely needs a full SCADA project. It needs the machine to stop making scrap, and it needs to know why it stopped. Starting from the existing machine and adding measurement, a controller and a simple operator view gets most of the value without replacing equipment that still works.',
    verified: false,
    categories: ['OEM Automation', 'Utilities', 'Custom Industrial Applications', 'Food & Beverage'],
    problems: [
      { title: 'Downtime with no reason code', body: 'The machine stopped for two hours yesterday and nobody can say which of the four usual causes it was.' },
      { title: 'Ageing relay logic', body: 'Control sits in a relay and timer panel nobody has a drawing for, so every change is a risk.' },
      { title: 'Quality checked at the end', body: 'A drifting parameter is caught at final inspection rather than at the station that caused it.' },
      { title: 'Energy billed as one number', body: 'The whole plant is on one meter, so no machine can be held responsible for its own consumption.' },
    ],
    opportunities: [
      { title: 'Downtime capture with reasons', body: 'Stops detected automatically and the operator prompted for a reason code on the HMI.' },
      { title: 'Relay panel to PLC retrofit', body: 'Existing sequence reproduced in a controller with a drawing set, so the next change is an edit rather than an excavation.' },
      { title: 'In process measurement', body: 'The parameter that causes the defect measured at the station that controls it.' },
      { title: 'Machine level energy metering', body: 'A meter per feeder turns plant energy into a per machine figure.' },
    ],
    processFlow: [
      { id: 'infeed', label: 'Infeed', tag: 'ZS-301', note: 'Part present and orientation sensing.' },
      { id: 'station', label: 'Process station', tag: 'PLC-302', note: 'The controlled operation itself.' },
      { id: 'inspect', label: 'In process check', tag: 'AIT-303', note: 'Measured parameter compared against tolerance.', optional: true },
      { id: 'reject', label: 'Reject', tag: 'SOL-304', note: 'Out of tolerance parts diverted and counted.', optional: true },
      { id: 'outfeed', label: 'Outfeed', tag: 'ZS-305', note: 'Good part counted for OEE.' },
    ],
    instrumentation: [
      { variable: 'Proximity / position', tag: 'ZS', typicalRange: 'Discrete', purpose: 'Part presence, guarding and sequence confirmation.' },
      { variable: 'Temperature', tag: 'TIT', typicalRange: '0 to 600 C', purpose: 'Process heat control on ovens, sealers and moulds.' },
      { variable: 'Pressure', tag: 'PIT', typicalRange: '0 to 16 bar', purpose: 'Pneumatic and hydraulic circuit health.' },
      { variable: 'Vibration', tag: 'VIT', typicalRange: '0 to 50 mm/s', purpose: 'Bearing and imbalance monitoring on rotating machines.' },
      { variable: 'Energy', tag: 'JIT', typicalRange: 'Sized to the feeder', purpose: 'Per machine consumption and load profile.' },
      { variable: 'Current', tag: 'IIT', typicalRange: 'Sized to the motor', purpose: 'Load signature and blocked drive detection.' },
    ],
    control: {
      plc: 'Machine sequence, guarding interlocks and reject logic, with the cycle written so a stop can be resumed rather than restarted.',
      hmi: 'Machine status, cycle counts, downtime reason entry, setpoints and the alarm list.',
      panel: 'Compact enclosure with incomer, protection, drives, safety relay and emergency stop circuit, wired to a drawing you keep.',
      field: 'Drives, solenoid valves, guard switches, light curtains and indication.',
    },
    communication: ['Digital I/O', '4 to 20 mA', 'Modbus RTU', 'Modbus TCP', 'Ethernet', 'MQTT to cloud'],
    alarms: ['Guard open', 'Emergency stop', 'Drive fault', 'Cycle timeout', 'Reject rate high', 'Sensor fault'],
    logging: ['Cycle and part counts', 'Downtime with reason codes', 'Reject counts by cause', 'Energy per shift'],
    energy:
      'Feeder level metering attributes consumption to the machine that used it, which is the only way a smaller plant can act on an energy bill.',
    predictive:
      'Motor current signature, vibration and cycle time drift are trended so a bearing or a worn tool is flagged before it produces scrap.',
    architecture:
      'The controller sits with the machine and owns the sequence. A gateway collects counts and states and publishes them outbound, so production visibility never becomes a dependency for running the line.',
  },
  {
    slug: 'agriculture-and-cold-chain',
    name: 'Agriculture & Cold Chain',
    summary: 'Solar drying, cold storage, environmental monitoring and smart farming control.',
    overview:
      'Produce is lost in the gap between harvest and market, and most of that loss is a temperature or a humidity that nobody was watching. Monitoring is the first step, but control is what actually saves the crop: holding a drying chamber at the right condition, or staging a cold room so the compressor is not the only thing standing between stock and spoilage.',
    verified: false,
    categories: ['Solar Drying', 'Cold Storage', 'Smart Farming', 'Environmental Monitoring'],
    problems: [
      { title: 'Spoilage discovered on opening', body: 'A cold room excursion overnight is found in the morning, by which point the stock is already affected.' },
      { title: 'Drying by judgement', body: 'Chamber temperature and airflow set by feel, so batches dry unevenly and some are over dried.' },
      { title: 'No record for the buyer', body: 'A buyer asking for a temperature history through storage cannot be given one.' },
      { title: 'Irrigation on a fixed timer', body: 'Water applied to a clock rather than to soil moisture, wasting water and stressing the crop.' },
    ],
    opportunities: [
      { title: 'Controlled drying profile', body: 'Chamber held to a temperature and humidity profile through the batch, with airflow staged against it.' },
      { title: 'Cold room excursion alarms', body: 'Deviation alarmed to a phone while there is still time to act, not logged for later reading.' },
      { title: 'Retained cold chain record', body: 'Temperature history per room and per batch, exportable for the buyer.' },
      { title: 'Soil moisture driven irrigation', body: 'Valves driven from measured soil moisture with a manual override that always works.' },
    ],
    processFlow: [
      { id: 'intake', label: 'Intake', tag: 'WIT-401', note: 'Batch weighed and identified on arrival.' },
      { id: 'precool', label: 'Pre cooling', tag: 'TIT-402', note: 'Field heat removed before storage.', optional: true },
      { id: 'dry', label: 'Drying chamber', tag: 'TIT-403', note: 'Temperature and humidity held to the batch profile.', optional: true },
      { id: 'store', label: 'Cold storage', tag: 'TIT-404', note: 'Room held to setpoint with staged compressors.' },
      { id: 'monitor', label: 'Environmental monitoring', tag: 'AIT-405', note: 'Distributed temperature and humidity across the space.' },
      { id: 'dispatch', label: 'Dispatch', tag: 'ZS-406', note: 'Batch released with its retained condition record.' },
    ],
    instrumentation: [
      { variable: 'Temperature', tag: 'TIT', typicalRange: '-40 to 120 C', purpose: 'The controlled variable in every stage here.' },
      { variable: 'Humidity', tag: 'MIT', typicalRange: '0 to 100 % RH', purpose: 'Drying rate control and condensation avoidance.' },
      { variable: 'Soil moisture', tag: 'MIT', typicalRange: '0 to 100 %', purpose: 'Irrigation demand rather than irrigation schedule.' },
      { variable: 'Solar irradiance', tag: 'RIT', typicalRange: '0 to 1500 W/m2', purpose: 'Available drying energy; sizes the assist heater duty.' },
      { variable: 'Airflow', tag: 'FIT', typicalRange: 'Sized to the chamber', purpose: 'Even drying across trays.' },
      { variable: 'Energy', tag: 'JIT', typicalRange: 'Sized to the feeder', purpose: 'Compressor and fan consumption per batch.' },
      { variable: 'Weight', tag: 'WIT', typicalRange: 'Sized to the batch', purpose: 'Moisture loss tracked as weight loss through drying.' },
    ],
    control: {
      plc: 'Chamber profile execution, compressor staging with minimum run and rest timers, and defrost sequencing.',
      hmi: 'Room and chamber overview, batch selection, profile setpoints, trends and the alarm list.',
      panel: 'Weatherproof enclosure where mounted outdoors, with compressor starters, fan drives and heater contactors.',
      field: 'Compressors, fans, dampers, heaters and irrigation valves.',
    },
    communication: ['4 to 20 mA', 'RS485', 'Modbus RTU', 'Ethernet', 'MQTT to cloud'],
    alarms: ['Temperature deviation', 'Humidity deviation', 'Compressor fault', 'Door open too long', 'Power fail', 'Sensor fault', 'Communication fault'],
    logging: ['Room temperature history', 'Batch drying profile', 'Door events', 'Energy per batch', 'Alarm history'],
    energy: 'Compressors and fans are the load. Staging them properly and trending consumption per batch is usually where the saving is.',
    predictive: 'Compressor run hours, pull down time and suction temperature drift are trended to flag a failing unit before the room is lost.',
    architecture:
      'Distributed sensors report to the controller over RS485. The controller holds staging and defrost logic locally so a room keeps its setpoint through a network outage. The gateway publishes readings and alarms outbound.',
  },
  {
    slug: 'waste-management',
    name: 'Waste Management',
    summary: 'Handling, segregation and treatment lines with weighbridge and emission monitoring.',
    overview:
      'Waste handling is measured at the gate and at the stack, and both numbers end up in front of a regulator. Between them sits equipment that runs hard in a difficult environment. Automation here is mostly about capturing the measurements reliably and keeping the plant running through conditions that punish instrumentation.',
    verified: false,
    categories: ['Industrial Effluent', 'Environmental Monitoring', 'Utilities', 'Custom Industrial Applications'],
    problems: [
      { title: 'Gate figures reconciled by hand', body: 'Weighbridge tickets and plant throughput are added up separately and never quite agree.' },
      { title: 'Emission monitoring in isolation', body: 'Stack analysers report to their own box with no link to the plant that caused the reading.' },
      { title: 'Harsh duty on instruments', body: 'Dust, moisture and vibration take out sensors that were selected on price rather than on environment.' },
      { title: 'Conveyor stoppages found late', body: 'A jam is noticed when the downstream stage runs empty.' },
    ],
    opportunities: [
      { title: 'Weighbridge to plant reconciliation', body: 'Gate weights and processed throughput brought into the same record so the difference is visible daily.' },
      { title: 'Emission data in plant context', body: 'Stack readings trended alongside the process conditions at the time.' },
      { title: 'Environment led selection', body: 'IP rating, wetted material and mounting chosen for the duty, which is most of the reliability problem.' },
      { title: 'Conveyor interlocking', body: 'Run permissives and jam detection chained so a stoppage stops the feed rather than burying it.' },
    ],
    processFlow: [
      { id: 'gate', label: 'Weighbridge', tag: 'WIT-501', note: 'Inbound and outbound weights captured.' },
      { id: 'tipping', label: 'Tipping / receiving', tag: 'ZS-502', note: 'Material received and staged.' },
      { id: 'segregate', label: 'Segregation', tag: 'CNV-503', note: 'Conveyors and separators with chained interlocks.' },
      { id: 'process', label: 'Processing', tag: 'PLC-504', note: 'Shredding, baling or composting stage.' },
      { id: 'treat', label: 'Leachate treatment', tag: 'AIT-505', note: 'Effluent from the site treated before discharge.', optional: true },
      { id: 'emission', label: 'Emission monitoring', tag: 'AIT-506', note: 'Stack parameters measured and retained.', optional: true },
    ],
    instrumentation: [
      { variable: 'Weight', tag: 'WIT', typicalRange: 'Sized to the bridge', purpose: 'Gate measurement; the commercial number.' },
      { variable: 'Level', tag: 'LIT', typicalRange: 'Sized to the bunker', purpose: 'Bunker and hopper level for feed control.' },
      { variable: 'Current', tag: 'IIT', typicalRange: 'Sized to the motor', purpose: 'Conveyor and shredder load, and jam detection.' },
      { variable: 'Vibration', tag: 'VIT', typicalRange: '0 to 50 mm/s', purpose: 'Rotating equipment condition in a punishing duty.' },
      { variable: 'pH', tag: 'AIT', typicalRange: '0 to 14 pH', purpose: 'Leachate treatment control.' },
      { variable: 'Gas / emission', tag: 'AIT', typicalRange: 'Per parameter', purpose: 'Stack and ambient monitoring against the consent limit.' },
      { variable: 'Temperature', tag: 'TIT', typicalRange: '0 to 600 C', purpose: 'Composting and thermal stage control.' },
    ],
    control: {
      plc: 'Conveyor chain interlocking, feed control from bunker level, and sequencing that stops upstream before downstream floods.',
      hmi: 'Line overview, drive status, throughput counters, emission readings and the alarm list.',
      panel: 'Higher IP rated enclosure with drives for conveyors and shredders, and segregation appropriate to a dusty environment.',
      field: 'Conveyor drives, separators, shredders, dosing pumps and dampers.',
    },
    communication: ['4 to 20 mA', 'RS485', 'Modbus RTU', 'Modbus TCP', 'Ethernet', 'MQTT to cloud'],
    alarms: ['Conveyor jam', 'Drive overload', 'Bunker level high', 'Emission limit approach', 'pH out of band', 'Sensor fault'],
    logging: ['Gate weights', 'Throughput per shift', 'Drive run hours and trips', 'Emission record', 'Alarm history'],
    energy: 'Shredding and conveying dominate. Trending energy per tonne processed makes the efficiency of the line visible.',
    predictive: 'Motor current and vibration trends on shredders and conveyors are the earliest warning available in this duty.',
    architecture:
      'Field devices report to the PLC, which owns the interlock chain. Weighbridge and analyser data is brought in over serial or Ethernet. The gateway publishes outbound only.',
  },
  {
    slug: 'solar-and-energy',
    name: 'Solar & Energy',
    summary: 'Generation monitoring, energy metering and load management across the site.',
    overview:
      'Energy work is measurement before it is control. Once generation, consumption and the boundary meter are all visible on the same time base, the questions that matter become answerable: what is actually being self consumed, which feeders carry the load, and whether a string is underperforming or just shaded.',
    verified: false,
    categories: ['Utilities', 'Environmental Monitoring', 'Custom Industrial Applications'],
    problems: [
      { title: 'Generation and consumption on separate systems', body: 'The inverter portal and the plant meters never appear on the same screen, so self consumption is an estimate.' },
      { title: 'Underperforming strings unnoticed', body: 'A string that has dropped off is only found when somebody compares monthly totals.' },
      { title: 'No feeder level visibility', body: 'Consumption is known at the boundary and nowhere else.' },
      { title: 'Manual load management', body: 'Heavy loads run whenever they are needed rather than when generation supports them.' },
    ],
    opportunities: [
      { title: 'One time base for everything', body: 'Generation, feeders and the boundary meter logged together so the numbers reconcile.' },
      { title: 'String level performance ratio', body: 'Output normalised against measured irradiance so a real fault separates from a cloudy day.' },
      { title: 'Feeder submetering', body: 'Consumption attributed to areas and machines rather than to the site.' },
      { title: 'Load scheduling against generation', body: 'Deferrable loads advised or interlocked to run when generation is available.' },
    ],
    processFlow: [
      { id: 'array', label: 'PV array', tag: 'RIT-601', note: 'Irradiance and module temperature measured for normalisation.' },
      { id: 'inverter', label: 'Inverter', tag: 'JIT-602', note: 'AC output and inverter status read over Modbus.' },
      { id: 'metering', label: 'Boundary metering', tag: 'JIT-603', note: 'Import and export at the point of common coupling.' },
      { id: 'distribution', label: 'Distribution', tag: 'JIT-604', note: 'Feeder level submetering across the plant.' },
      { id: 'storage', label: 'Storage', tag: 'JIT-605', note: 'Battery state of charge and cycling where fitted.', optional: true },
      { id: 'loads', label: 'Controlled loads', tag: 'PLC-606', note: 'Deferrable loads scheduled against available generation.', optional: true },
    ],
    instrumentation: [
      { variable: 'Energy', tag: 'JIT', typicalRange: 'Sized to the feeder', purpose: 'kWh, kVAh and power factor at each metering point.' },
      { variable: 'Current', tag: 'IIT', typicalRange: 'Sized to the feeder', purpose: 'Load profile and imbalance detection.' },
      { variable: 'Voltage', tag: 'EIT', typicalRange: 'LV or MV as applicable', purpose: 'Supply quality and inverter trip diagnosis.' },
      { variable: 'Solar irradiance', tag: 'RIT', typicalRange: '0 to 1500 W/m2', purpose: 'Normalisation; separates a fault from weather.' },
      { variable: 'Temperature', tag: 'TIT', typicalRange: '-20 to 100 C', purpose: 'Module and inverter temperature derating.' },
      { variable: 'Power', tag: 'JIT', typicalRange: 'Sized to the plant', purpose: 'Instantaneous generation and demand.' },
    ],
    control: {
      plc: 'Load scheduling and interlocking where control is in scope; otherwise the controller aggregates and the system stays read only.',
      hmi: 'Single line overview, generation against consumption, feeder breakdown and the alarm list.',
      panel: 'Metering and communication panel with isolation, CT shorting facilities and surge protection.',
      field: 'Meters, CTs, inverters, irradiance sensors and controlled load contactors.',
    },
    communication: ['Modbus RTU', 'Modbus TCP', 'RS485', 'Ethernet', 'MQTT to cloud'],
    alarms: ['String underperformance', 'Inverter fault', 'Export limit approach', 'Power factor out of band', 'Communication fault'],
    logging: ['Generation per interval', 'Feeder consumption', 'Performance ratio', 'Import and export totals', 'Alarm history'],
    energy:
      'This industry is energy monitoring, so the whole system is the energy layer: interval data retained long enough to support a tariff or investment decision.',
    predictive: 'Performance ratio trends and inverter temperature are used to separate soiling and shading from a genuine equipment fault.',
    architecture:
      'Meters and inverters are read over Modbus by the gateway or PLC. Data is timestamped at the edge so an outage does not leave a hole in the interval record, then published outbound.',
  },
  {
    slug: 'mining-and-heavy-industry',
    name: 'Mining & Heavy Industry',
    summary: 'Material handling, dewatering and plant monitoring in high vibration environments.',
    overview:
      'Heavy industry punishes everything: the instruments, the panel and the cabling. The engineering that matters is unglamorous, and it happens before anything is ordered. Selecting for the environment, segregating the panel properly and interlocking the material path is what determines whether the system is still working in two years.',
    verified: false,
    categories: ['Mining', 'Iron & Steel', 'Process Plants', 'Utilities'],
    problems: [
      { title: 'Instruments failing in service', body: 'Devices selected on specification sheet alone do not survive the dust, vibration and temperature.' },
      { title: 'Conveyor damage from uncontrolled stops', body: 'A downstream stop that does not propagate upstream buries the belt.' },
      { title: 'Dewatering run blind', body: 'Sump pumps run on float switches with no level trend and no run hour record.' },
      { title: 'Long cable runs corrupting signals', body: 'Analogue signals degraded over distance in a high noise environment.' },
    ],
    opportunities: [
      { title: 'Environment led selection', body: 'IP rating, enclosure material, mounting and cable specification chosen for the duty rather than the datasheet.' },
      { title: 'Interlocked material path', body: 'Conveyor chains permissive linked so a stop cascades correctly in both directions.' },
      { title: 'Instrumented dewatering', body: 'Continuous level with pump duty rotation, run hours and dry run protection.' },
      { title: 'Signal integrity by design', body: 'Transmitters converting to 4 to 20 mA or RS485 at the device, with screening and segregation through the run.' },
    ],
    processFlow: [
      { id: 'extraction', label: 'Extraction / feed', tag: 'WIT-701', note: 'Material presented to the plant and weighed.' },
      { id: 'crushing', label: 'Crushing / screening', tag: 'IIT-702', note: 'Drive load monitored; chokes detected on current.' },
      { id: 'conveying', label: 'Conveying', tag: 'ZS-703', note: 'Belt drift, slip and pull cord in the interlock chain.' },
      { id: 'processing', label: 'Processing', tag: 'PLC-704', note: 'Separation, washing or beneficiation stage.', optional: true },
      { id: 'dewatering', label: 'Dewatering', tag: 'LIT-705', note: 'Sump level with duty and standby pump rotation.', optional: true },
      { id: 'stockpile', label: 'Stockpile / dispatch', tag: 'WIT-706', note: 'Outbound weight and stock movement recorded.' },
    ],
    instrumentation: [
      { variable: 'Level', tag: 'LIT', typicalRange: 'Sized to the sump or bin', purpose: 'Dewatering control and bin management.' },
      { variable: 'Weight', tag: 'WIT', typicalRange: 'Sized to the belt', purpose: 'Belt weighing and throughput.' },
      { variable: 'Current', tag: 'IIT', typicalRange: 'Sized to the motor', purpose: 'Crusher and conveyor load, choke detection.' },
      { variable: 'Vibration', tag: 'VIT', typicalRange: '0 to 50 mm/s', purpose: 'Bearing and gearbox condition on critical drives.' },
      { variable: 'Temperature', tag: 'TIT', typicalRange: '0 to 200 C', purpose: 'Bearing and gearbox temperature.' },
      { variable: 'Pressure', tag: 'PIT', typicalRange: '0 to 40 bar', purpose: 'Hydraulic circuits and pump discharge.' },
      { variable: 'Flow', tag: 'FIT', typicalRange: 'Sized to the line', purpose: 'Dewatering and process water.' },
    ],
    control: {
      plc: 'Interlock chains across the material path, pump duty rotation, and start sequences that bring a loaded plant up in the right order.',
      hmi: 'Plant overview with drive status, interlock state, throughput and the alarm list.',
      panel: 'Robust enclosure with appropriate IP and material, forced cooling, surge protection and careful segregation of power and signal.',
      field: 'Conveyor and crusher drives, pull cords, belt drift switches, dewatering pumps and hydraulic packs.',
    },
    communication: ['4 to 20 mA', 'RS485', 'Modbus RTU', 'Modbus TCP', 'Ethernet', 'MQTT to cloud'],
    alarms: ['Pull cord operated', 'Belt drift', 'Belt slip', 'Drive overload', 'Bearing temperature high', 'Sump level high', 'Sensor fault'],
    logging: ['Throughput per shift', 'Drive run hours and trips', 'Pump run hours', 'Vibration trends', 'Alarm history'],
    energy: 'Crushing and conveying carry the load. Energy per tonne is the figure that exposes an inefficient circuit.',
    predictive:
      'Vibration, bearing temperature and motor current together give enough warning on critical drives to plan a shutdown rather than suffer one.',
    architecture:
      'Signals are converted at the device and carried on screened, segregated runs to the PLC. The PLC owns every interlock. The gateway reads from the PLC and publishes outbound only.',
  },
  {
    slug: 'other-and-custom',
    name: 'Other / Custom Industries',
    summary: 'Applications outside the listed sectors, scoped through the same requirement study.',
    overview:
      'Most enquiries do not arrive with an industry label attached. They arrive as a variable somebody needs to measure or a sequence somebody needs to run reliably. The requirement study is the same regardless of sector: establish what is being measured or controlled, what already exists on site, and what has to be proven afterwards.',
    verified: false,
    categories: ['Custom Industrial Applications', 'OEM Automation', 'Environmental Monitoring', 'Utilities'],
    problems: [
      { title: 'No off the shelf fit', body: 'The application does not match a standard product, so suppliers either decline it or force it into something that does not suit.' },
      { title: 'Requirement never written down', body: 'The scope lives in conversations, so every quotation received is for a slightly different system.' },
      { title: 'Existing equipment ignored', body: 'Proposals assume a clean site and quietly replace equipment that is working.' },
      { title: 'Unclear responsibility', body: 'Nobody is accountable end to end because the scope boundary was never drawn.' },
    ],
    opportunities: [
      { title: 'Structured requirement capture', body: 'The configurator asks the same engineering questions an engineer would, and records the answers as a document you own.' },
      { title: 'Reuse of existing infrastructure', body: 'Existing PLC, panel, sensors or SCADA declared up front and kept where they are fit for purpose.' },
      { title: 'Transparent bill of materials', body: 'Every selected item listed with the reason it was selected, before any price is discussed.' },
      { title: 'One accountable scope', body: 'The boundary drawn explicitly, so the responsibility for the number on the screen sits in one place.' },
    ],
    processFlow: [
      { id: 'study', label: 'Requirement study', tag: 'REQ-801', note: 'What is measured, controlled, automated or monitored.' },
      { id: 'survey', label: 'Existing site review', tag: 'SUR-802', note: 'What is already installed and worth keeping.' },
      { id: 'concept', label: 'Concept architecture', tag: 'ARC-803', note: 'Sensor to cloud chain drawn for this application.' },
      { id: 'io', label: 'I/O and panel sizing', tag: 'IO-804', note: 'Preliminary counts and enclosure estimate.' },
      { id: 'bom', label: 'Preliminary BOM', tag: 'BOM-805', note: 'Item list with selection reasoning, no prices yet.' },
      { id: 'review', label: 'Engineering review', tag: 'ENG-806', note: 'Human verification before anything is quoted.' },
    ],
    instrumentation: [
      { variable: 'Custom sensor', tag: 'XIT', typicalRange: 'Per application', purpose: 'Whatever the process actually requires, selected on duty.' },
      { variable: 'Temperature', tag: 'TIT', typicalRange: 'Per application', purpose: 'The most commonly required variable across sectors.' },
      { variable: 'Pressure', tag: 'PIT', typicalRange: 'Per application', purpose: 'Circuit and vessel monitoring.' },
      { variable: 'Flow', tag: 'FIT', typicalRange: 'Per application', purpose: 'Throughput and consumption measurement.' },
      { variable: 'Level', tag: 'LIT', typicalRange: 'Per application', purpose: 'Storage and protection.' },
      { variable: 'Energy', tag: 'JIT', typicalRange: 'Per application', purpose: 'Consumption attribution.' },
    ],
    control: {
      plc: 'Scoped to the application. Where an existing controller is fit for purpose it is kept and extended rather than replaced.',
      hmi: 'Screen set built from the requirement study rather than from a template.',
      panel: 'Enclosure, protection and layout sized from the load and I/O counts established in the study.',
      field: 'Selected once the process and the duty are understood, not before.',
    },
    communication: ['4 to 20 mA', 'RS485', 'Modbus RTU', 'Modbus TCP', 'OPC UA', 'Ethernet', 'MQTT to cloud'],
    alarms: ['Defined from the process and the failure modes identified in the study'],
    logging: ['Defined from what has to be proven afterwards'],
    energy: 'Included where consumption is part of what the customer needs to manage.',
    predictive: 'Applied to the equipment whose failure actually costs something, identified during the study.',
    architecture:
      'The same chain applies regardless of sector: instrument, transmitter, controller, operator interface, panel, gateway, cloud. What changes is the selection at each stage.',
  },
]

export const industryBySlug = (slug: string) => industries.find((i) => i.slug === slug)

/** Expandable category list from the brief, shown as a discovery grid. */
export const industryCategories = [
  'Water Purification',
  'ETP',
  'STP',
  'Industrial Effluent',
  'Chemical Dosing',
  'Iron & Steel',
  'Mining',
  'Process Plants',
  'Food & Beverage',
  'Cold Storage',
  'Solar Drying',
  'Smart Farming',
  'Environmental Monitoring',
  'OEM Automation',
  'Utilities',
  'Custom Industrial Applications',
]
