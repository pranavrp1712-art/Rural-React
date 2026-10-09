import {
  Bell,
  BookOpen,
  Broadcast,
  Buildings,
  ChartBar,
  ChartLine,
  ChatCircleText,
  ClipboardText,
  ClockCounterClockwise,
  Code,
  Cpu,
  CurrencyInr,
  Envelope,
  Factory,
  FileText,
  Folder,
  Gauge,
  Gear,
  Globe,
  Handshake,
  Kanban,
  Lifebuoy,
  LinkSimple,
  ListChecks,
  Lock,
  MagnifyingGlass,
  Megaphone,
  Package,
  Plug,
  QrCode,
  Receipt,
  ShieldCheck,
  Sliders,
  Stack,
  Tag,
  TestTube,
  TreeStructure,
  Truck,
  User,
  Users,
  UsersThree,
  Wrench,
  Database,
  type Icon,
} from '@phosphor-icons/react'

/**
 * Role based access for the four logins in md/login.md and
 * md/improve.md. One typed config drives the login screens, the
 * redirect after sign in, the portal sidebar, the search scope and
 * the route guard, so a role's reach is declared in exactly one place.
 *
 * PROTOTYPE: there is no backend yet. The guard protects the UI only;
 * the same checks must run on the server before real data is served.
 */

export type RoleId = 'admin' | 'engineering' | 'marketing' | 'customer'

export interface PortalNavItem {
  /** Section slug under /portal/:role. Empty string is the role's home. */
  id: string
  label: string
  icon: Icon
}

export interface PortalNavGroup {
  heading?: string
  items: PortalNavItem[]
}

export interface RoleDef {
  id: RoleId
  title: string
  /** What the role is, in one line, on the login chooser. */
  summary: string
  /** What the role lands on, in plain words. */
  landing: string
  selfSignup: boolean
  can: string[]
  cannot: string[]
  nav: PortalNavGroup[]
  /**
   * Sections reachable with an id (a record page) but not listed in the
   * sidebar, e.g. /portal/engineering/rfq/RFQ-0142.
   */
  detail?: string[]
}

/** Shared by every role, on top of the role's own dashboard. */
export const accountNav: PortalNavGroup = {
  heading: 'Account',
  items: [
    { id: 'tasks', label: 'Tasks', icon: ListChecks },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'activity', label: 'Activity log', icon: ClockCounterClockwise },
    { id: 'logins', label: 'Login history', icon: Lock },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Password & security', icon: ShieldCheck },
  ],
}

export const roles: Record<RoleId, RoleDef> = {
  admin: {
    id: 'admin',
    title: 'Super Admin',
    summary: 'Owner access to every module, user and setting, with a view across every team.',
    landing: 'Command center: live visitors, leads, RFQs, pending reviews and revenue.',
    selfSignup: false,
    can: [
      'Manage, create and disable users',
      'Change roles and set permissions',
      'View audit logs',
      'See every team: website, marketing, customers, products, engineering',
      'Manage products, industries and specifications',
      'Manage pricing, RFQs and quotes',
      'Manage website content, marketing and SEO',
      'Manage chatbot, knowledge base, analytics, integrations and settings',
    ],
    cannot: [],
    nav: [
      { items: [{ id: '', label: 'Command center', icon: Gauge }] },
      {
        heading: 'Teams',
        items: [
          { id: 'website', label: 'Website', icon: Globe },
          { id: 'team-marketing', label: 'Marketing', icon: Megaphone },
          { id: 'customers', label: 'Customers', icon: UsersThree },
          { id: 'product-performance', label: 'Product performance', icon: ChartBar },
          { id: 'team-engineering', label: 'Engineering', icon: Kanban },
        ],
      },
      {
        heading: 'Commercial',
        items: [
          { id: 'rfqs', label: 'RFQs', icon: ClipboardText },
          { id: 'quotes', label: 'Quotes', icon: Receipt },
        ],
      },
      {
        heading: 'People & access',
        items: [
          { id: 'users', label: 'Users & roles', icon: Users },
          { id: 'audit', label: 'Audit log', icon: ClockCounterClockwise },
        ],
      },
      {
        heading: 'Catalogue',
        items: [
          { id: 'products', label: 'Products', icon: Package },
          { id: 'industries', label: 'Industries', icon: Factory },
          { id: 'specifications', label: 'Specifications', icon: Sliders },
          { id: 'pricing', label: 'Pricing', icon: CurrencyInr },
        ],
      },
      {
        heading: 'Website admin',
        items: [
          { id: 'content', label: 'Website content', icon: FileText },
          { id: 'seo', label: 'SEO', icon: MagnifyingGlass },
          { id: 'chatbot', label: 'Chatbot', icon: ChatCircleText },
          { id: 'knowledge', label: 'Knowledge base', icon: BookOpen },
        ],
      },
      {
        heading: 'System',
        items: [
          { id: 'analytics', label: 'Analytics', icon: ChartLine },
          { id: 'integrations', label: 'Integrations', icon: Plug },
          { id: 'emails', label: 'Email templates', icon: Envelope },
          { id: 'settings', label: 'System settings', icon: Gear },
        ],
      },
    ],
    detail: ['customers', 'team-marketing', 'team-engineering'],
  },
  engineering: {
    id: 'engineering',
    title: 'Engineering Team',
    summary: 'Assigned RFQs, technical reviews, I/O, drawings, programming, site work and IIoT provisioning.',
    landing: 'My assigned RFQs, with the full engineering queue one click away.',
    selfSignup: false,
    can: [
      'View assigned RFQs',
      'Edit the preliminary configuration',
      'Calculate I/O and create the BOM',
      'Add technical notes',
      'Upload drawings and datasheets',
      'Ask the customer questions',
      'Submit for technical owner approval',
      "Fulfil a customer's IIoT dashboard request",
    ],
    cannot: [
      'Change company pricing',
      'Change website analytics',
      'Change marketing content',
      'Approve the final commercial quotation',
    ],
    nav: [
      {
        items: [
          { id: '', label: 'My assigned RFQs', icon: ClipboardText },
          { id: 'queue', label: 'Engineering queue', icon: Kanban },
          { id: 'reviews', label: 'Technical reviews', icon: ShieldCheck },
          { id: 'iiot-requests', label: 'IIoT requests', icon: Broadcast },
        ],
      },
      {
        heading: 'Design',
        items: [
          { id: 'io', label: 'I/O calculations', icon: TreeStructure },
          { id: 'panel', label: 'Panel design', icon: Stack },
          { id: 'drawings', label: 'Engineering drawings', icon: FileText },
        ],
      },
      {
        heading: 'Programming & config',
        items: [
          { id: 'programming', label: 'PLC, HMI & SCADA', icon: Code },
          { id: 'configuration', label: 'Sensor, gateway & IIoT', icon: Cpu },
        ],
      },
      {
        heading: 'Delivery',
        items: [
          { id: 'testing', label: 'Testing & FAT', icon: TestTube },
          { id: 'site', label: 'Installation & commissioning', icon: Truck },
        ],
      },
    ],
    detail: ['rfq'],
  },
  marketing: {
    id: 'marketing',
    title: 'Marketing Team',
    summary: 'Aggregate traffic, campaigns, leads, content and SEO.',
    landing: 'Visitor and campaign trends, aggregate only.',
    selfSignup: false,
    can: [
      'Create campaigns, landing pages and blog posts',
      'Manage SEO metadata and social links',
      'Manage website banners, CTAs and promotional content',
      'Create UTM campaigns',
      'Track leads and export marketing reports',
    ],
    cannot: [
      'Change technical, PLC or sensor specifications',
      'Change the BOM or engineering architecture',
      'Change quotation prices',
      'Approve a technical RFQ',
    ],
    nav: [
      {
        items: [
          { id: '', label: 'Overview', icon: ChartLine },
          { id: 'pages', label: 'Page performance', icon: ChartBar },
          { id: 'leads', label: 'Leads', icon: Handshake },
        ],
      },
      {
        heading: 'Campaigns',
        items: [
          { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
          { id: 'utm', label: 'UTM builder', icon: LinkSimple },
          { id: 'qr', label: 'QR code tracking', icon: QrCode },
        ],
      },
      {
        heading: 'Content',
        items: [
          { id: 'seo', label: 'SEO metadata', icon: MagnifyingGlass },
          { id: 'content', label: 'Pages, blog & banners', icon: Globe },
          { id: 'reports', label: 'Reports', icon: Database },
        ],
      },
    ],
  },
  customer: {
    id: 'customer',
    title: 'Customer',
    summary: 'Your RFQs, quotations, projects, documents, service and IIoT monitoring.',
    landing: 'The status of your own RFQs and projects.',
    selfSignup: true,
    can: [
      'Submit and update an RFQ',
      'Upload documents, site photos and drawings',
      'View the technical proposal and quotation',
      'Accept or reject a quotation',
      'Ask questions and track your project',
      'Request IIoT monitoring for your site',
    ],
    cannot: [],
    nav: [
      {
        items: [
          { id: '', label: 'Dashboard', icon: Gauge },
          { id: 'rfqs', label: 'My RFQs', icon: ClipboardText },
          { id: 'quotes', label: 'My quotes', icon: Receipt },
          { id: 'projects', label: 'My projects', icon: Buildings },
          { id: 'documents', label: 'My documents', icon: Folder },
          { id: 'iiot', label: 'IIoT Dashboard', icon: Broadcast },
        ],
      },
      {
        heading: 'Support',
        items: [
          { id: 'discussions', label: 'Technical discussions', icon: ChatCircleText },
          { id: 'service', label: 'Service requests', icon: Lifebuoy },
          { id: 'amc', label: 'AMC', icon: Wrench },
          { id: 'invoices', label: 'Invoices', icon: Tag },
        ],
      },
    ],
  },
}

export const roleOrder: RoleId[] = ['customer', 'engineering', 'marketing', 'admin']

export const isRoleId = (value: string | undefined): value is RoleId =>
  value === 'admin' || value === 'engineering' || value === 'marketing' || value === 'customer'

export const loginPath = (role: RoleId) => `/login/${role}`
export const portalPath = (role: RoleId, section = '') =>
  section ? `/portal/${role}/${section}` : `/portal/${role}`

/** Every section a role may open from the sidebar. */
export function sectionsFor(role: RoleId): PortalNavItem[] {
  return [...roles[role].nav, accountNav].flatMap((g) => g.items)
}

/** Route guard: may this role open this section (and record id)? */
export function canOpen(role: RoleId, section: string, id?: string): boolean {
  if (id) return Boolean(roles[role].detail?.includes(section))
  return sectionsFor(role).some((s) => s.id === section)
}

/* ------------------------------------------------------------------
   Demo accounts. Shown on every login screen, so nobody mistakes the
   prototype for a live system.
   ------------------------------------------------------------------ */

export type AccountState = 'active' | 'locked' | 'unverified' | 'disabled' | 'invited'

export interface DemoAccount {
  email: string
  password: string
  role: RoleId
  name: string
  organisation: string
  state: AccountState
}

export const DEMO_PASSWORD = 'Demo@2026'

export const demoAccounts: DemoAccount[] = [
  { email: 'owner@ruralreact.demo', password: DEMO_PASSWORD, role: 'admin', name: 'Platform Owner', organisation: 'RuralReact', state: 'active' },
  { email: 'engineer@ruralreact.demo', password: DEMO_PASSWORD, role: 'engineering', name: 'Demo Engineer', organisation: 'RuralReact', state: 'active' },
  { email: 'marketing@ruralreact.demo', password: DEMO_PASSWORD, role: 'marketing', name: 'Demo Marketer', organisation: 'RuralReact', state: 'active' },
  { email: 'customer@example.demo', password: DEMO_PASSWORD, role: 'customer', name: 'Demo Customer', organisation: 'Demo Process Industries', state: 'active' },
  { email: 'locked@example.demo', password: DEMO_PASSWORD, role: 'customer', name: 'Locked Account', organisation: 'Demo Process Industries', state: 'locked' },
  { email: 'unverified@example.demo', password: DEMO_PASSWORD, role: 'customer', name: 'Unverified Account', organisation: 'Demo Process Industries', state: 'unverified' },
]

/** Failed attempts before an account locks. */
export const LOCKOUT_AFTER = 5
