/**
 * Single source of truth for the desktop menu, the mobile drawer and the
 * footer sitemap. Nothing in the header or footer is hard coded in JSX.
 */

export type ItemStatus =
  | 'ready'
  | 'pilot'
  | 'in-development'
  | 'custom'
  | 'coming-soon'
  | 'to-be-configured'

export interface NavItem {
  label: string
  href: string
  /** One short plain language line shown under the item in a mega menu. */
  blurb?: string
  status?: ItemStatus
  /** Shown as a small qualifier chip, e.g. "Automation Solution Category". */
  tag?: string
}

export interface NavGroup {
  /** Column heading inside a mega menu. Omitted for single column menus. */
  heading?: string
  items: NavItem[]
}

export interface NavSection {
  id: string
  label: string
  href: string
  /** A section with no groups renders as a direct link. */
  groups?: NavGroup[]
  featured?: {
    title: string
    body: string
    href: string
    cta: string
  }
  /**
   * Order in which sections collapse into the More menu when the viewport
   * gets tight. Lower collapses first. Undefined never collapses.
   */
  collapseOrder?: number
}

export const navigation: NavSection[] = [
  {
    id: 'solutions',
    label: 'Solutions',
    href: '#solutions',
    groups: [
      {
        heading: 'Automation',
        items: [
          {
            label: 'Industrial automation',
            href: '#solutions',
            blurb: 'Machine and plant control built around your process.',
          },
          {
            label: 'Process automation',
            href: '#solutions',
            blurb: 'Continuous measurement, dosing and closed loop control.',
          },
          {
            label: 'Water and wastewater automation',
            href: '#industries',
            blurb: 'Treatment plants, pumping stations and recycling lines.',
          },
          {
            label: 'PLC and HMI automation',
            href: '#platform',
            blurb: 'Control logic and operator screens written for your plant.',
          },
        ],
      },
      {
        heading: 'Hardware',
        items: [
          {
            label: 'Sensors and instrumentation',
            href: '#platform',
            blurb: 'Selection, ranging and calibration for the measured variable.',
          },
          {
            label: 'Custom PCB',
            href: '#products',
            blurb: 'Purpose built electronics where a standard card does not fit.',
          },
          {
            label: 'IIoT gateway',
            href: '/iiot',
            blurb: 'Plant data to cloud without exposing the controller.',
          },
        ],
      },
      {
        heading: 'Delivery',
        items: [
          {
            label: 'System integration',
            href: '#workflow',
            blurb: 'Existing equipment tied into one supervised system.',
          },
          {
            label: 'Industrial monitoring',
            href: '/iiot',
            blurb: 'Dashboards, trends and alarms for running assets.',
          },
        ],
      },
    ],
    featured: {
      title: 'Not sure which one you need',
      body: 'Answer a few questions about what you measure and control. The wizard maps it to a solution and a bill of materials.',
      href: '/configure',
      cta: 'Start the requirement wizard',
    },
    collapseOrder: 6,
  },
  {
    id: 'industries',
    label: 'Industries',
    href: '/industries',
    groups: [
      {
        heading: 'Core industries',
        items: [
          { label: 'Water and wastewater', href: '/industries/water-and-wastewater' },
          { label: 'Chemical and process', href: '/industries/chemical-and-process' },
          { label: 'Manufacturing and MSMEs', href: '/industries/manufacturing-and-msme' },
          { label: 'Agriculture and cold chain', href: '/industries/agriculture-and-cold-chain' },
          { label: 'Waste management', href: '/industries/waste-management' },
          { label: 'Solar and energy', href: '/industries/solar-and-energy' },
          { label: 'Mining and heavy industry', href: '/industries/mining-and-heavy-industry' },
          { label: 'Other or custom industries', href: '/industries/other-and-custom' },
        ],
      },
      {
        heading: 'Applications',
        items: [
          { label: 'Water purification', href: '/industries', tag: 'Automation Solution Category' },
          { label: 'ETP', href: '/industries', tag: 'Automation Solution Category' },
          { label: 'STP', href: '/industries', tag: 'Automation Solution Category' },
          { label: 'Industrial effluent', href: '/industries', tag: 'Automation Solution Category' },
          { label: 'Chemical dosing', href: '/industries', tag: 'Automation Solution Category' },
          { label: 'Solar drying', href: '/industries', tag: 'Automation Solution Category' },
          { label: 'Cold storage', href: '/industries', tag: 'Automation Solution Category' },
          { label: 'View all industries', href: '/industries' },
        ],
      },
    ],
    collapseOrder: 7,
  },
  {
    id: 'products',
    label: 'Products',
    href: '/products',
    groups: [
      {
        heading: 'From company material',
        items: [
          { label: 'Solar dryer', href: '/products/solar-dryer', status: 'ready' },
          { label: 'Waste water and purification unit', href: '/products/wastewater-and-purification-unit', status: 'ready' },
          { label: 'Chemical and water testing lab kit', href: '/products/chemical-and-water-testing-lab-kit', status: 'pilot' },
          { label: 'IoT gateway and custom PCB', href: '/products/iot-gateway-and-custom-pcb', status: 'pilot' },
          { label: 'Custom industrial control panel', href: '/products/custom-industrial-control-panel', status: 'custom' },
        ],
      },
      {
        heading: 'In development',
        items: [
          { label: 'Sensor transmitter', href: '/products/sensor-transmitter', status: 'in-development' },
          { label: 'PLC and microcontroller', href: '/products/plc-and-microcontroller', status: 'in-development' },
          { label: 'Control system', href: '/products/control-system', status: 'coming-soon' },
        ],
      },
      {
        heading: 'Catalog & Overview',
        items: [
          { label: 'View all products & specifications', href: '/products' },
        ],
      },
    ],
    collapseOrder: 8,
  },
  {
    id: 'configurator',
    label: 'Configurator',
    href: '/configure',
    groups: [
      {
        items: [
          {
            label: 'Requirement wizard',
            href: '/configure',
            blurb: 'Describe the process, get a scoped solution.',
          },
          {
            label: 'Sensor configuration',
            href: '/configure',
            blurb: 'Pick the measured variable, range and output.',
          },
          {
            label: 'PLC and I/O calculator',
            href: '/configurators?tab=io',
            blurb: 'Count your signals, size the controller.',
          },
          {
            label: 'Control panel designer',
            href: '/configurators?tab=panel',
            blurb: 'Enclosure, feeders, protection and layout.',
          },
          {
            label: 'HMI configurator',
            href: '/configurators?tab=hmi',
            blurb: 'Screens, tags and alarm list.',
          },
          {
            label: 'RFQ summary',
            href: '/rfq',
            blurb: 'Everything above, collected as one quotation request.',
          },
        ],
      },
    ],
    featured: {
      title: 'Size the controller first',
      body: 'The I/O calculator takes a signal count and returns a module and controller estimate you can carry into the RFQ.',
      href: '/configurators?tab=io',
      cta: 'Open the I/O calculator',
    },
  },
  {
    id: 'panels',
    label: 'Control Panels',
    href: '/control-panels',
    groups: [
      {
        items: [
          { label: 'About control panels & overview', href: '/control-panels', blurb: 'Custom engineering, standards & panel types.' },
          { label: 'Design your control panel', href: '/configurators?tab=panel', blurb: 'Preliminary sizing, power & GA layout.' },
          { label: 'Panel engineering workflow', href: '/control-panels#workflow', blurb: '16-step process from CAD to FAT witness.' },
          { label: 'Custom industrial control panel', href: '/products/custom-industrial-control-panel', blurb: 'Detailed technical specification sheet.' },
        ],
      },
    ],
    collapseOrder: 9,
  },
  {
    id: 'iiot',
    label: 'IIoT and Cloud',
    href: '/iiot',
    groups: [
      {
        items: [
          { label: 'IIoT architecture', href: '/iiot' },
          { label: 'Live demo dashboard', href: '/iiot', tag: 'Demo data' },
          { label: 'Supported protocols', href: '/iiot' },
          { label: 'Secure OT to cloud approach', href: '/standards' },
        ],
      },
    ],
    collapseOrder: 5,
  },
  {
    id: 'services',
    label: 'Engineering Services',
    href: '#workflow',
    groups: [
      {
        heading: 'Study and design',
        items: [
          { label: 'Technical consultation', href: '/consult' },
          { label: 'Requirement study and load calculation', href: '#workflow' },
          { label: 'I/O calculation and component selection', href: '/configurators' },
          { label: 'Schematic and panel GA', href: '#workflow' },
        ],
      },
      {
        heading: 'Build and commission',
        items: [
          { label: 'Fabrication and wiring', href: '#workflow' },
          { label: 'PLC and HMI programming', href: '#workflow' },
          { label: 'Testing and FAT', href: '#workflow' },
          { label: 'Installation and commissioning', href: '#workflow' },
          { label: 'AMC', href: '#workflow' },
        ],
      },
    ],
    collapseOrder: 4,
  },
  {
    id: 'case-studies',
    label: 'Case Studies',
    href: '#about',
    collapseOrder: 3,
  },
  {
    id: 'about',
    label: 'About',
    href: '#about',
    groups: [
      {
        items: [
          { label: 'Company', href: '#about' },
          { label: 'Founder and team', href: '#about' },
          { label: 'Validation and patent information', href: '#about' },
        ],
      },
    ],
    collapseOrder: 2,
  },
  {
    id: 'resources',
    label: 'Resources',
    href: '#faq',
    groups: [
      {
        items: [
          { label: 'Standards reference', href: '/standards' },
          { label: 'FAQs', href: '#faq' },
          { label: 'Documents and downloads', href: '#faq', status: 'to-be-configured' },
        ],
      },
    ],
    collapseOrder: 1,
  },
  {
    id: 'quote',
    label: 'Request Quote',
    href: '/rfq',
  },
]

export const primaryCta = { label: 'Configure your solution', href: '/configure' }
export const secondaryCta = { label: 'Talk to an engineer', href: '/consult' }

export const statusLabels: Record<ItemStatus, string> = {
  ready: 'Ready',
  pilot: 'Pilot',
  'in-development': 'In development',
  custom: 'Custom',
  'coming-soon': 'Coming soon',
  'to-be-configured': 'To be configured',
}
