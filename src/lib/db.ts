import type {
  Campaign,
  CustomerQuote,
  Device,
  Doc,
  IiotRequest,
  Lead,
  Notification,
  Project,
  QrCode,
  Rfq,
  SeoRow,
  ServiceRequest,
  Task,
  Thread,
  TrafficSource,
  Visit,
  WorkItem,
} from '../data/portalTypes'
import { DAY } from '../data/portalTypes'

/**
 * The record store behind the portal. It starts EMPTY: there is no seed
 * data for demo accounts or real ones. Every row is created by an
 * action, such as a visit to a public page, a contact form, an RFQ, an
 * engineer's edit or a quotation, so every count and chart starts at
 * zero and grows from use.
 *
 * PROTOTYPE: the store is this browser's localStorage, so records are
 * shared by every account signed in on this browser and by no other
 * device. The backend replaces read()/write() with the database; the
 * functions in api.ts keep their signatures.
 */

export interface Db {
  seq: Record<string, number>
  visits: Visit[]
  leads: Lead[]
  rfqs: Rfq[]
  work: WorkItem[]
  quotes: CustomerQuote[]
  projects: Project[]
  docs: Doc[]
  threads: Thread[]
  service: ServiceRequest[]
  iiot: IiotRequest[]
  tasks: Task[]
  notifications: Notification[]
  campaigns: Campaign[]
  qr: QrCode[]
  seo: SeoRow[]
}

const KEY = 'rr-db'
const MAX_VISITS = 5000

const empty = (): Db => ({
  seq: {},
  visits: [],
  leads: [],
  rfqs: [],
  work: [],
  quotes: [],
  projects: [],
  docs: [],
  threads: [],
  service: [],
  iiot: [],
  tasks: [],
  notifications: [],
  campaigns: [],
  qr: [],
  seo: [],
})

let memory: Db | null = null

export function read(): Db {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...empty(), ...(JSON.parse(raw) as Partial<Db>) } : empty()
  } catch {
    return memory ?? empty()
  }
}

function write(db: Db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    // Storage blocked or full: keep this page view working.
    memory = db
  }
}

/* ------------------------------------------------------------------
   Change events. A write tells every open query whose key starts with
   the prefix to refetch; '' refetches everything. Writes from another
   tab arrive through the storage event.
   ------------------------------------------------------------------ */

const bus = new EventTarget()

export function invalidate(prefix = '') {
  bus.dispatchEvent(new CustomEvent('invalidate', { detail: prefix }))
}

export function onInvalidate(fn: (prefix: string) => void) {
  const handler = (e: Event) => fn((e as CustomEvent<string>).detail)
  bus.addEventListener('invalidate', handler)
  return () => bus.removeEventListener('invalidate', handler)
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY || e.key === null) invalidate('')
  })
}

/** Apply a change and tell every open screen to refresh. */
export function mutate<T>(change: (db: Db) => T): T {
  const db = read()
  const result = change(db)
  write(db)
  invalidate('')
  return result
}

/** Sequential, human-readable IDs: RFQ-0001, Q-0001, L-0001… */
export function nextId(db: Db, prefix: string, width = 4) {
  const n = (db.seq[prefix] ?? 0) + 1
  db.seq[prefix] = n
  return `${prefix}-${String(n).padStart(width, '0')}`
}

export function notify(db: Db, n: Omit<Notification, 'id' | 'at' | 'readBy'>) {
  db.notifications.unshift({ ...n, id: nextId(db, 'N', 5), at: Date.now(), readBy: [] })
  db.notifications = db.notifications.slice(0, 500)
}

/** Erase every record. Accounts, sign-in history and the audit log are kept. */
export function resetAll() {
  write(empty())
  invalidate('')
}

/* ------------------------------------------------------------------
   Website activity. The public site records one row per page view,
   with a coarse source and device and no personal data. In production
   this is the analytics collector.
   ------------------------------------------------------------------ */

const rid = () => Math.random().toString(36).slice(2, 10)

function stored(store: Storage, key: string, make: () => string) {
  try {
    const v = store.getItem(key)
    if (v) return v
    const next = make()
    store.setItem(key, next)
    return next
  } catch {
    return make()
  }
}

interface Attribution {
  session: string
  source: TrafficSource
  campaign?: string
  content?: string
}

function sourceFrom(params: URLSearchParams, referrer: string): TrafficSource {
  const medium = (params.get('utm_medium') ?? '').toLowerCase()
  if (medium === 'qr') return 'QR code'
  if (params.get('utm_campaign')) return 'Campaign'
  if (!referrer) return 'Direct'
  let host = ''
  try {
    host = new URL(referrer).hostname
  } catch {
    return 'Direct'
  }
  if (host === location.hostname) return 'Direct'
  if (/google\.|bing\.|duckduckgo\.|yahoo\./.test(host)) return 'Search'
  if (/linkedin\.|facebook\.|instagram\.|twitter\.|x\.com|youtube\./.test(host)) return 'Social'
  return 'Referral'
}

/** The session's source is fixed by its first page view, like any analytics tool. */
function attribution(): Attribution {
  const make = (): Attribution => {
    const params = new URLSearchParams(location.search)
    return {
      session: rid(),
      source: sourceFrom(params, document.referrer),
      campaign: params.get('utm_campaign') ?? undefined,
      content: params.get('utm_content') ?? undefined,
    }
  }
  try {
    const raw = sessionStorage.getItem('rr-visit-session')
    if (raw) return JSON.parse(raw) as Attribution
    const next = make()
    sessionStorage.setItem('rr-visit-session', JSON.stringify(next))
    return next
  } catch {
    return make()
  }
}

function device(): Device {
  const w = window.innerWidth
  return w < 640 ? 'Mobile' : w < 1024 ? 'Tablet' : 'Desktop'
}

export function trackVisit(path: string) {
  const a = attribution()
  const visit: Visit = {
    at: Date.now(),
    path,
    visitor: stored(localStorage, 'rr-visitor', rid),
    session: a.session,
    source: a.source,
    campaign: a.campaign,
    content: a.content,
    device: device(),
  }
  const db = read()
  // React's development double-render mounts effects twice; one view is one row.
  const last = db.visits[db.visits.length - 1]
  if (last && last.session === visit.session && last.path === path && visit.at - last.at < 1000) return
  db.visits.push(visit)
  if (db.visits.length > MAX_VISITS) db.visits = db.visits.slice(-MAX_VISITS)
  write(db)
  invalidate('')
}

/* ------------------------------------------------------------------
   Public forms
   ------------------------------------------------------------------ */

/** The "Describe the process" form on the landing page. */
export function submitEnquiry(input: { email: string; message: string; page: string }) {
  const a = attribution()
  return mutate((db) => {
    const lead: Lead = {
      id: nextId(db, 'L'),
      at: Date.now(),
      email: input.email.trim().toLowerCase(),
      message: input.message.trim(),
      interest: 'General enquiry',
      source: a.source,
      campaign: a.campaign,
      content: a.content,
      page: input.page,
      stage: 'New',
    }
    db.leads.unshift(lead)
    notify(db, { toRole: 'marketing', topic: 'lead', kind: 'action', title: 'New lead from the website', body: `${lead.id} · ${lead.source}${lead.campaign ? ` · ${lead.campaign}` : ''}` })
    return lead
  })
}

/** A request for a technical consultation, from /consult. */
export function submitConsultation(input: { name: string; company: string; email: string; phone: string; topic: string; equipment: string; message: string }) {
  const a = attribution()
  return mutate((db) => {
    const lead: Lead = {
      id: nextId(db, 'L'),
      at: Date.now(),
      email: input.email.trim().toLowerCase(),
      company: input.company.trim(),
      message: [input.message.trim(), `Equipment: ${input.equipment}`, input.phone.trim() ? `Phone: ${input.phone.trim()}` : ''].filter(Boolean).join('\n'),
      interest: `Consultation · ${input.topic}`,
      source: a.source,
      campaign: a.campaign,
      content: a.content,
      page: '/consult',
      stage: 'New',
    }
    db.leads.unshift(lead)
    notify(db, { toRole: 'engineering', topic: 'lead', kind: 'action', title: 'Consultation requested', body: `${input.company.trim()} · ${input.topic}` })
    notify(db, { toRole: 'marketing', topic: 'lead', kind: 'info', title: 'New lead: consultation request', body: `${lead.id} · ${lead.source}` })
    notify(db, { toRole: 'admin', topic: 'lead', kind: 'info', title: 'Consultation requested', body: `${input.company.trim()} · ${input.topic}` })
    return lead
  })
}

export interface RfqInput {
  customer: string
  customerEmail: string
  contact: string
  industry: string
  scope: string
  details: string
  via: Rfq['via']
  missing?: string[]
  io?: Rfq['io']
  bom?: Rfq['bom']
  page?: string
}

/** An RFQ from the public RFQ summary or from the customer portal. */
export function submitRfq(input: RfqInput) {
  const a = attribution()
  return mutate((db) => {
    const rfq: Rfq = {
      id: nextId(db, 'RFQ'),
      at: Date.now(),
      customer: input.customer.trim(),
      customerEmail: input.customerEmail.trim().toLowerCase(),
      contact: input.contact.trim(),
      industry: input.industry,
      scope: input.scope.trim(),
      details: input.details.trim(),
      via: input.via,
      stage: 'Preliminary',
      due: Date.now() + DAY * 3,
      missing: input.missing ?? [],
      io: input.io ?? { di: 0, do: 0, ai: 0, ao: 0 },
      bom: input.bom ?? [],
      notes: [],
      files: [],
    }
    db.rfqs.unshift(rfq)
    if (input.via === 'Website') {
      db.leads.unshift({
        id: nextId(db, 'L'),
        at: Date.now(),
        email: rfq.customerEmail,
        company: rfq.customer,
        message: rfq.scope,
        interest: rfq.industry,
        source: a.source,
        campaign: a.campaign,
        content: a.content,
        page: input.page ?? '/rfq',
        stage: 'RFQ raised',
      })
    }
    notify(db, { toRole: 'engineering', topic: 'rfq', kind: 'action', title: 'New RFQ in the queue', body: `${rfq.id} · ${rfq.customer} · ${rfq.industry}` })
    notify(db, { toRole: 'admin', topic: 'rfq', kind: 'info', title: 'New RFQ received', body: `${rfq.id} · ${rfq.customer} · via ${rfq.via.toLowerCase()}` })
    return rfq
  })
}
