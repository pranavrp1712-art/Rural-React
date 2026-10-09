import { industries } from '../data/industries'
import { products } from '../data/productCatalog'
import { demoAccounts, roles, sectionsFor, portalPath, type RoleId } from '../data/portal'
import {
  DAY,
  dayLabel,
  formatInr,
  startOfToday,
  type Bar,
  type BomLine,
  type Customer,
  type Inbox,
  type IiotRequest,
  type Io,
  type LeadStage,
  type PageRow,
  type Point,
  type PortalUser,
  type Rfq,
  type ServiceRequest,
  type Visit,
  type WorkItem,
  type WorkStatus,
  type WorkType,
} from '../data/portalTypes'
import { allAccounts, lastSignIns, saveAccount } from './auth'
import { invalidate, mutate, nextId, notify, read, submitRfq, type Db, type RfqInput } from './db'

export { invalidate, onInvalidate } from './db'
export type { IiotRequest } from '../data/portalTypes'

/**
 * The portal's data access layer (md/improve.md §1A).
 *
 * Every screen behind login reads through these async functions and
 * renders a skeleton while waiting, an empty state when there is
 * nothing, and an error with a retry when a call fails.
 *
 * There is no seed data. Every figure here is computed from records in
 * the store (src/lib/db.ts), which starts empty, so a new install
 * reads zero everywhere until the site and portal are used. Scoping
 * (a customer only receives their own organisation's records) is
 * applied here, where the server will apply it.
 *
 * To exercise the error states, run in the console:
 *   localStorage.setItem('rr-demo-fail', '1')
 */

export class ApiError extends Error {}

const LATENCY = 220

function failing() {
  try {
    return localStorage.getItem('rr-demo-fail') === '1'
  } catch {
    return false
  }
}

const latency = () => new Promise((r) => setTimeout(r, LATENCY + Math.random() * 120))
const offline = () => new ApiError('The server did not respond. Check your connection and try again.')

/** A read: wait for the network, then answer. */
async function respond<T>(produce: () => T): Promise<T> {
  await latency()
  if (failing()) throw offline()
  return produce()
}

/**
 * A write: applied as soon as it is sent, like a request that reached
 * the server, so leaving the page before the reply does not lose it.
 */
async function commit<T>(change: () => T): Promise<T> {
  if (failing()) {
    await latency()
    throw offline()
  }
  const result = change()
  await latency()
  return result
}

export const IIOT_MEASURES = ['pH', 'Temperature', 'Flow', 'Pressure', 'Level', 'Pump & valve status', 'Energy', 'Alarms']

/* ------------------------------------------------------------------
   Aggregation helpers
   ------------------------------------------------------------------ */

const WINDOW = 30

/** Daily counts for the last 30 days, today last. */
function daily(times: number[]): Point[] {
  const today = startOfToday()
  return Array.from({ length: WINDOW }, (_, i) => {
    const t = today - (WINDOW - 1 - i) * DAY
    return { t, label: dayLabel(t), value: times.filter((x) => x >= t && x < t + DAY).length }
  })
}

const since = (days: number) => startOfToday() - (days - 1) * DAY
const recent = <T extends { at: number }>(rows: T[], days = WINDOW) => rows.filter((r) => r.at >= since(days))

function countBy<T>(rows: T[], key: (r: T) => string | undefined): Bar[] {
  const m = new Map<string, number>()
  rows.forEach((r) => {
    const k = key(r)
    if (k) m.set(k, (m.get(k) ?? 0) + 1)
  })
  return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
}

const unique = (visits: Visit[]) => new Set(visits.map((v) => v.visitor)).size
const sessions = (visits: Visit[]) => new Set(visits.map((v) => v.session)).size

function returning(visits: Visit[]) {
  const perVisitor = new Map<string, Set<string>>()
  visits.forEach((v) => perVisitor.set(v.visitor, (perVisitor.get(v.visitor) ?? new Set()).add(v.session)))
  return [...perVisitor.values()].filter((s) => s.size > 1).length
}

const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1)}%` : '—')

const industryName = (slug: string) => industries.find((i) => i.slug === slug)?.name
const productName = (slug: string) => products.find((p) => p.slug === slug)?.name

function pageRows(db: Db): PageRow[] {
  const visits = recent(db.visits)
  const leads = recent(db.leads)
  const last = new Map<string, Visit>()
  visits.forEach((v) => {
    const prev = last.get(v.session)
    if (!prev || v.at >= prev.at) last.set(v.session, v)
  })
  const exits = countBy([...last.values()], (v) => v.path)
  return countBy(visits, (v) => v.path).map(({ label, value }) => ({
    path: label,
    views: value,
    leads: leads.filter((l) => l.page === label).length,
    exitRate: Math.round(((exits.find((e) => e.label === label)?.value ?? 0) / value) * 100),
  }))
}

const eqOrg = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()
const orgId = (org: string) => org.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** The RFQ ids a customer may see: their own, or their organisation's portal RFQs. */
function ownRfqs(db: Db, email: string, org: string) {
  return db.rfqs.filter((r) => r.customerEmail === email || (org && eqOrg(r.customer, org)))
}

function scoped(db: Db, email: string, org: string) {
  const rfqs = ownRfqs(db, email, org)
  const ids = new Set(rfqs.map((r) => r.id))
  const projects = db.projects.filter((p) => ids.has(p.rfq))
  const projectIds = new Set(projects.map((p) => p.id))
  return {
    rfqs,
    quotes: db.quotes.filter((q) => ids.has(q.rfq)),
    projects,
    threads: db.threads.filter((t) => ids.has(t.rfq)),
    docs: db.docs.filter((d) => projectIds.has(d.project)),
    service: db.service.filter((s) => projectIds.has(s.project)),
  }
}

function inbox(db: Db, role: RoleId, email: string): Inbox[] {
  return db.notifications
    .filter((n) => n.toEmail === email || (!n.toEmail && n.toRole === role))
    .map(({ readBy, ...n }) => ({ ...n, unread: !readBy.includes(email) }))
}

const openStage = (r: Rfq) => r.stage !== 'Approval pending' && r.stage !== 'Quoted'
const pendingReviews = (db: Db) => db.work.filter((w) => w.type === 'reviews' && w.status !== 'Done').length

function updateRfq(db: Db, id: string, change: (r: Rfq) => void) {
  const r = db.rfqs.find((x) => x.id === id)
  if (!r) throw new ApiError('That RFQ no longer exists.')
  change(r)
  return r
}

/** Tell the customer who raised an RFQ, by email. */
function tellCustomer(db: Db, r: Rfq, n: { topic: 'clarification' | 'quote' | 'project' | 'rfq'; title: string; body: string; kind?: 'info' | 'action' }) {
  notify(db, { toEmail: r.customerEmail, toRole: 'customer', kind: 'action', ...n })
}

function threadFor(db: Db, r: Rfq) {
  let t = db.threads.find((x) => x.rfq === r.id)
  if (!t) {
    t = { id: nextId(db, 'T'), rfq: r.id, org: r.customer, subject: r.scope, messages: [] }
    db.threads.unshift(t)
  }
  return t
}

/** Customer organisations: every customer account plus anyone who raised an RFQ. */
function customerList(db: Db): Customer[] {
  const byOrg = new Map<string, Customer>()
  const touch = (org: string, patch: Partial<Customer>, at: number) => {
    if (!org.trim()) return
    const id = orgId(org)
    const c = byOrg.get(id) ?? { id, company: org.trim(), contact: '', email: '', industry: '—', status: 'New' as const, hasAccount: false, lastActivity: 0 }
    byOrg.set(id, { ...c, ...Object.fromEntries(Object.entries(patch).filter(([, v]) => v)), lastActivity: Math.max(c.lastActivity, at) })
  }
  allAccounts()
    .filter((a) => a.role === 'customer' && a.state === 'active')
    .forEach((a) => touch(a.organisation, { contact: a.name, email: a.email, hasAccount: true }, 0))
  ;[...db.rfqs].reverse().forEach((r) => touch(r.customer, { contact: r.contact, email: r.customerEmail, industry: r.industry, status: 'Prospect' }, r.at))
  db.quotes.forEach((q) => touch(q.org, {}, q.at))
  db.projects.forEach((p) => touch(p.org, { status: 'Active project' }, p.at))
  return [...byOrg.values()].sort((a, b) => b.lastActivity - a.lastActivity)
}

export interface SearchResult {
  label: string
  detail: string
  to: string
  kind: 'Page' | 'RFQ' | 'Customer' | 'Quote' | 'Project' | 'Document' | 'Lead' | 'Campaign' | 'Request'
}

export type Amc = { id: string; project: string; coverage: string; visitsLeft: number; renews: number }
export type Invoice = { id: string; project: string; amount: number; status: 'Paid' | 'Due'; at: number }

/* ------------------------------------------------------------------
   API
   ------------------------------------------------------------------ */

export const api = {
  /** Sidebar badge counts, keyed by section id. */
  badges: (role: RoleId, email: string, org: string) =>
    respond((): Record<string, number> => {
      const db = read()
      switch (role) {
        case 'admin':
          return {
            rfqs: db.rfqs.filter((r) => !r.assignee).length,
            quotes: db.rfqs.filter((r) => r.stage === 'Approval pending').length,
          }
        case 'engineering':
          return {
            '': db.rfqs.filter((r) => r.assignee === email && openStage(r)).length,
            queue: db.rfqs.filter((r) => !r.assignee).length,
            reviews: pendingReviews(db),
            'iiot-requests': db.iiot.filter((r) => r.status === 'requested').length,
          }
        case 'marketing':
          return { leads: db.leads.filter((l) => l.stage === 'New').length }
        case 'customer': {
          const s = scoped(db, email, org)
          return {
            quotes: s.quotes.filter((q) => q.status === 'Awaiting decision').length,
            discussions: s.threads.filter((t) => t.messages[t.messages.length - 1]?.from === 'engineer').length,
          }
        }
      }
    }),

  /** The customer's IIoT access state, shown as a pill on the sidebar item. */
  iiotState: (email: string) =>
    respond(() => {
      const mine = read().iiot.filter((r) => r.customerEmail === email)
      return mine.length ? mine[mine.length - 1].status : ('locked' as const)
    }),

  notifications: (role: RoleId, email: string) => respond(() => inbox(read(), role, email)),

  markRead: (email: string, ids: string[]) =>
    commit(() =>
      mutate((db) => {
        db.notifications.forEach((n) => {
          if (ids.includes(n.id) && !n.readBy.includes(email)) n.readBy.push(email)
        })
        return true
      }),
    ),

  tasks: (email: string) => respond(() => read().tasks.filter((t) => t.owner === email).sort((a, b) => Number(a.done) - Number(b.done) || a.due - b.due)),

  addTask: (email: string, title: string, due: number) =>
    commit(() => mutate((db) => db.tasks.push({ id: nextId(db, 'TSK'), owner: email, title: title.trim(), due, done: false, at: Date.now() }))),

  toggleTask: (id: string) =>
    commit(() =>
      mutate((db) => {
        const t = db.tasks.find((x) => x.id === id)
        if (t) t.done = !t.done
      }),
    ),

  /** Global search, scoped to what the role may see. */
  search: (role: RoleId, email: string, org: string, q: string) =>
    respond<SearchResult[]>(() => {
      const needle = q.trim().toLowerCase()
      if (needle.length < 2) return []
      const db = read()
      const hit = (...fields: (string | undefined)[]) => fields.some((f) => f?.toLowerCase().includes(needle))
      const out: SearchResult[] = sectionsFor(role)
        .filter((s) => hit(s.label))
        .map((s) => ({ label: s.label, detail: roles[role].title, to: portalPath(role, s.id), kind: 'Page' as const }))

      if (role === 'admin') {
        db.rfqs.filter((r) => hit(r.id, r.scope, r.customer)).forEach((r) => out.push({ label: r.id, detail: r.scope, to: portalPath('admin', `team-engineering/${r.id}`), kind: 'RFQ' }))
        db.quotes.filter((x) => hit(x.id, x.title, x.org)).forEach((x) => out.push({ label: x.id, detail: x.title, to: portalPath('admin', 'quotes'), kind: 'Quote' }))
        const orgs = new Set(db.rfqs.map((r) => r.customer))
        allAccounts().filter((a) => a.role === 'customer').forEach((a) => orgs.add(a.organisation))
        ;[...orgs].filter((o) => hit(o)).forEach((o) => out.push({ label: o, detail: 'Customer', to: portalPath('admin', `customers/${orgId(o)}`), kind: 'Customer' }))
      }
      if (role === 'engineering') {
        db.rfqs.filter((r) => hit(r.id, r.scope, r.customer)).forEach((r) => out.push({ label: r.id, detail: r.scope, to: portalPath('engineering', `rfq/${r.id}`), kind: 'RFQ' }))
        db.iiot.filter((r) => hit(r.organisation, r.site)).forEach((r) => out.push({ label: r.site, detail: `IIoT request · ${r.organisation}`, to: portalPath('engineering', 'iiot-requests'), kind: 'Request' }))
      }
      if (role === 'marketing') {
        db.leads.filter((l) => hit(l.id, l.source, l.interest, l.campaign)).forEach((l) => out.push({ label: l.id, detail: `${l.source} · ${l.interest}`, to: portalPath('marketing', 'leads'), kind: 'Lead' }))
        db.campaigns.filter((c) => hit(c.name)).forEach((c) => out.push({ label: c.name, detail: c.channel, to: portalPath('marketing', 'campaigns'), kind: 'Campaign' }))
      }
      if (role === 'customer') {
        const s = scoped(db, email, org)
        s.rfqs.filter((r) => hit(r.id, r.scope)).forEach((r) => out.push({ label: r.id, detail: r.scope, to: portalPath('customer', 'rfqs'), kind: 'RFQ' }))
        s.quotes.filter((x) => hit(x.id, x.title)).forEach((x) => out.push({ label: x.id, detail: x.title, to: portalPath('customer', 'quotes'), kind: 'Quote' }))
        s.projects.filter((p) => hit(p.id, p.title)).forEach((p) => out.push({ label: p.title, detail: p.id, to: portalPath('customer', 'projects'), kind: 'Project' }))
        s.docs.filter((d) => hit(d.name)).forEach((d) => out.push({ label: d.name, detail: d.kind, to: portalPath('customer', 'documents'), kind: 'Document' }))
      }
      return out.slice(0, 12)
    }),

  /* ---------------------------------------------------------------- */

  admin: {
    command: () =>
      respond(() => {
        const db = read()
        const today = startOfToday()
        const visits = recent(db.visits)
        const leads = recent(db.leads)
        return {
          kpis: [
            { label: 'Visitors today', value: String(unique(db.visits.filter((v) => v.at >= today))) },
            { label: "Today's leads", value: String(db.leads.filter((l) => l.at >= today).length) },
            { label: 'Unassigned RFQs', value: String(db.rfqs.filter((r) => !r.assignee).length) },
            { label: 'Awaiting quotation', value: String(db.rfqs.filter((r) => r.stage === 'Approval pending').length), note: 'Engineering approved, no quote yet' },
            { label: 'Quotes awaiting customer', value: String(db.quotes.filter((q) => q.status === 'Awaiting decision').length) },
            { label: 'Active projects', value: String(db.projects.filter((p) => p.stage < 6).length) },
            { label: 'Open service requests', value: String(db.service.filter((s) => s.status !== 'Resolved').length) },
            { label: 'Accepted quote value', value: formatInr(db.quotes.filter((q) => q.status === 'Accepted').reduce((a, q) => a + q.amount, 0)), note: 'All time, before tax' },
          ],
          trends: {
            visitors: daily(visits.map((v) => v.at)),
            leads: daily(leads.map((l) => l.at)),
            rfqs: daily(recent(db.rfqs).map((r) => r.at)),
            quotes: daily(recent(db.quotes).map((q) => q.at)),
          },
          industryDemand: countBy(visits, (v) => (v.path.startsWith('/industries/') ? industryName(v.path.split('/')[2]) : undefined)),
          productDemand: countBy(visits, (v) => (v.path.startsWith('/products/') ? productName(v.path.split('/')[2]) : undefined)),
          trafficSources: countBy(visits, (v) => v.source),
          campaignPerformance: countBy(leads, (l) => l.campaign),
          funnel: [
            { label: 'Unique visitors', value: String(unique(visits)) },
            { label: 'Returning visitors', value: String(returning(visits)) },
            { label: 'Page views', value: String(visits.length) },
            { label: 'Sessions', value: String(sessions(visits)) },
            { label: 'Conversion (visitor → lead)', value: pct(leads.length, unique(visits)) },
            { label: 'Configurator and wizard views', value: String(visits.filter((v) => v.path.startsWith('/configure')).length) },
            { label: 'RFQs submitted', value: String(recent(db.rfqs).length) },
            { label: 'Customer registrations', value: String(allAccounts().filter((a) => a.role === 'customer' && !demoAccounts.some((d) => d.email === a.email)).length), note: 'Self-service sign ups' },
          ],
        }
      }),

    users: () =>
      respond((): PortalUser[] => {
        const seen = lastSignIns()
        return allAccounts().map((a) => ({
          email: a.email,
          name: a.name,
          role: a.role,
          status: a.state === 'disabled' || a.state === 'locked' ? 'Disabled' : a.state === 'invited' ? 'Invited' : a.state === 'unverified' ? 'Unverified' : 'Active',
          lastActive: seen[a.email],
        }))
      }),

    updateUser: (email: string, patch: { role?: RoleId; disabled?: boolean }) =>
      commit(() => {
        const a = allAccounts().find((x) => x.email === email)
        if (!a) throw new ApiError('That account no longer exists.')
        saveAccount({ ...a, role: patch.role ?? a.role, state: patch.disabled === undefined ? a.state : patch.disabled ? 'disabled' : 'active' })
        invalidate('')
      }),

    invite: (email: string, role: RoleId) =>
      commit(() => {
        if (allAccounts().some((a) => a.email === email)) throw new ApiError('That person already has an account.')
        saveAccount({ email, password: '', role, name: 'Invited user', organisation: role === 'customer' ? '' : 'RuralReact', state: 'invited' })
        invalidate('')
      }),

    rfqs: () => respond(() => read().rfqs),

    quotes: () =>
      respond(() => {
        const db = read()
        return { quotes: db.quotes, awaiting: db.rfqs.filter((r) => r.stage === 'Approval pending') }
      }),

    issueQuote: (rfqId: string, input: { amount: number; validDays: number }) =>
      commit(() =>
        mutate((db) => {
          const r = updateRfq(db, rfqId, (x) => (x.stage = 'Quoted'))
          const q = { id: nextId(db, 'Q'), at: Date.now(), rfq: r.id, org: r.customer, customerEmail: r.customerEmail, title: r.scope, amount: input.amount, validUntil: Date.now() + input.validDays * DAY, status: 'Awaiting decision' as const }
          db.quotes.unshift(q)
          tellCustomer(db, r, { topic: 'quote', title: 'Quotation ready', body: `${q.id} for ${r.id} is waiting for your decision.` })
          if (r.assignee) notify(db, { toEmail: r.assignee, toRole: 'engineering', topic: 'quote', kind: 'info', title: 'Quotation issued', body: `${q.id} for ${r.id}.` })
          return q
        }),
      ),

    customers: () => respond(() => customerList(read())),

    customer: (id: string) =>
      respond(() => {
        const db = read()
        const c = customerList(db).find((x) => x.id === id)
        if (!c) return null
        const s = scoped(db, c.email, c.company)
        return { customer: c, ...s, iiot: db.iiot.filter((r) => eqOrg(r.organisation, c.company)) }
      }),

    advanceProject: (id: string) =>
      commit(() =>
        mutate((db) => {
          const p = db.projects.find((x) => x.id === id)
          if (!p || p.stage >= 6) return
          p.stage += 1
          notify(db, { toEmail: p.customerEmail, toRole: 'customer', topic: 'project', kind: 'info', title: 'Project moved forward', body: `${p.title} is now at the next stage.` })
        }),
      ),

    setServiceStatus: (id: string, status: ServiceRequest['status']) =>
      commit(() =>
        mutate((db) => {
          const s = db.service.find((x) => x.id === id)
          if (!s) return
          s.status = status
          notify(db, { toEmail: s.customerEmail, toRole: 'customer', topic: 'service', kind: 'info', title: `Service request ${status.toLowerCase()}`, body: `${s.id} · ${s.summary}` })
        }),
      ),

    products: () =>
      respond(() => {
        const db = read()
        const visits = recent(db.visits)
        const leads = recent(db.leads)
        return products.map((p) => {
          const path = `/products/${p.slug}`
          return {
            slug: p.slug,
            name: p.name,
            status: p.status,
            views: visits.filter((v) => v.path === path).length,
            visitors: unique(visits.filter((v) => v.path === path)),
            leads: leads.filter((l) => l.page === path).length,
          }
        })
      }),

    website: () =>
      respond(() => {
        const db = read()
        return {
          // Published counts are the routes this site serves.
          content: [
            { type: 'Industry pages', published: industries.length },
            { type: 'Product pages', published: products.length },
            { type: 'Tools (wizard, configurators, RFQ)', published: 3 },
            { type: 'Reference pages', published: 3 },
          ],
          seo: db.seo.map((r) => ({
            path: r.path,
            titleOk: r.title.length >= 20 && r.title.length <= 60,
            descriptionOk: r.description.length >= 70 && r.description.length <= 160,
          })),
          views30: recent(db.visits).length,
        }
      }),

    engineering: () =>
      respond(() => {
        const db = read()
        // First response: RFQ received → the engineer's first note or question.
        const hours = db.rfqs
          .map((r) => {
            const first = [...r.notes.map((n) => n.at), ...db.threads.filter((t) => t.rfq === r.id).flatMap((t) => t.messages.filter((m) => m.from === 'engineer').map((m) => m.at))].sort()[0]
            return first ? (first - r.at) / 3_600_000 : null
          })
          .filter((h): h is number => h !== null)
        return {
          openRfqs: db.rfqs.filter(openStage).length,
          pendingReviews: pendingReviews(db),
          avgResponseHours: hours.length ? hours.reduce((a, h) => a + h, 0) / hours.length : null,
          pendingIiot: db.iiot.filter((r) => r.status === 'requested').length,
          rfqs: db.rfqs,
          work: db.work,
        }
      }),
  },

  /* ---------------------------------------------------------------- */

  engineering: {
    summary: (email: string) =>
      respond(() => {
        const db = read()
        const unread = inbox(db, 'engineering', email).filter((n) => n.unread)
        return {
          queue: db.rfqs.filter((r) => !r.assignee).length,
          reviews: pendingReviews(db),
          replies: unread.filter((n) => n.topic === 'clarification').length,
          iiot: db.iiot.filter((r) => r.status === 'requested').length,
        }
      }),
    myRfqs: (email: string) => respond(() => read().rfqs.filter((r) => r.assignee === email)),
    queue: () => respond(() => read().rfqs),
    rfq: (id: string) =>
      respond(() => {
        const db = read()
        const rfq = db.rfqs.find((r) => r.id === id)
        if (!rfq) return null
        return { rfq, thread: db.threads.find((t) => t.rfq === id) ?? null, work: db.work.filter((w) => w.rfq === id) }
      }),

    assign: (id: string, email: string) =>
      commit(() =>
        mutate((db) => {
          const r = updateRfq(db, id, (x) => {
            x.assignee = email
            if (x.stage === 'Preliminary') x.stage = 'Technical review'
          })
          notify(db, { toRole: 'admin', topic: 'rfq', kind: 'info', title: 'RFQ picked up', body: `${r.id} assigned to ${email}.` })
        }),
      ),

    saveConfig: (id: string, io: Io, bom: BomLine[]) => commit(() => mutate((db) => updateRfq(db, id, (r) => Object.assign(r, { io, bom })))),

    addNote: (id: string, by: string, text: string) => commit(() => mutate((db) => updateRfq(db, id, (r) => r.notes.push({ at: Date.now(), by, text })))),

    addFiles: (id: string, names: string[]) => commit(() => mutate((db) => updateRfq(db, id, (r) => r.files.push(...names)))),

    ask: (id: string, by: string, text: string) =>
      commit(() =>
        mutate((db) => {
          const r = updateRfq(db, id, (x) => (x.stage = 'Awaiting customer'))
          threadFor(db, r).messages.push({ at: Date.now(), from: 'engineer', author: by, text })
          tellCustomer(db, r, { topic: 'clarification', title: 'Your engineer asked a question', body: `${r.id}: ${text}` })
        }),
      ),

    submit: (id: string, by: string) =>
      commit(() =>
        mutate((db) => {
          const r = updateRfq(db, id, (x) => (x.stage = 'Approval pending'))
          notify(db, { toRole: 'admin', topic: 'review', kind: 'action', title: 'RFQ ready for quotation', body: `${r.id} was submitted by ${by} for technical owner approval.` })
          tellCustomer(db, r, { topic: 'rfq', kind: 'info', title: 'Engineering review complete', body: `${r.id} is with the commercial team for quotation.` })
        }),
      ),

    work: (type: WorkType) => respond(() => read().work.filter((w) => w.type === type)),

    addWork: (input: Omit<WorkItem, 'id' | 'status'>) =>
      commit(() =>
        mutate((db) => {
          db.work.push({ ...input, id: nextId(db, 'W'), status: 'To do' })
        }),
      ),

    setWorkStatus: (id: string, status: WorkStatus) =>
      commit(() =>
        mutate((db) => {
          const w = db.work.find((x) => x.id === id)
          if (w) w.status = status
        }),
      ),

    iiotRequests: () => respond(() => [...read().iiot].sort((a, b) => b.requestedAt - a.requestedAt)),

    provision: (id: string, input: { gatewayId: string; devices: string; engineer: string }) =>
      commit(() =>
        mutate((db) => {
          const r = db.iiot.find((x) => x.id === id)
          if (!r) throw new ApiError('That request no longer exists.')
          Object.assign(r, input, { status: 'provisioned', provisionedAt: Date.now(), failureReason: undefined })
          notify(db, { toEmail: r.customerEmail, toRole: 'customer', topic: 'iiot', kind: 'info', title: 'Your IIoT dashboard is unlocked', body: `${r.site} is connected. Readings appear as the gateway reports.` })
          return true
        }),
      ),

    failProvision: (id: string, reason: string) =>
      commit(() =>
        mutate((db) => {
          const r = db.iiot.find((x) => x.id === id)
          if (!r) throw new ApiError('That request no longer exists.')
          Object.assign(r, { status: 'failed', failureReason: reason })
          notify(db, { toEmail: r.customerEmail, toRole: 'customer', topic: 'iiot', kind: 'alert', title: 'IIoT connection needs attention', body: reason })
          return true
        }),
      ),
  },

  /* ---------------------------------------------------------------- */

  marketing: {
    overview: () =>
      respond(() => {
        const db = read()
        const visits = recent(db.visits)
        const leads = recent(db.leads)
        return {
          kpis: [
            { label: 'Page views', value: String(visits.length) },
            { label: 'Unique visitors', value: String(unique(visits)) },
            { label: 'Returning visitors', value: String(returning(visits)) },
            { label: 'Conversion rate', value: pct(leads.length, unique(visits)), note: 'Visitors who left a lead' },
            { label: 'Leads', value: String(leads.length) },
            { label: 'RFQs from the website', value: String(recent(db.rfqs).filter((r) => r.via === 'Website').length) },
            { label: 'Campaign visits', value: String(visits.filter((v) => v.source === 'Campaign' || v.source === 'QR code').length) },
            { label: 'Search visits', value: String(visits.filter((v) => v.source === 'Search').length) },
          ],
          trends: { visitors: daily(visits.map((v) => v.at)), leads: daily(leads.map((l) => l.at)) },
          trafficSources: countBy(visits, (v) => v.source),
          campaignPerformance: countBy(leads, (l) => l.campaign),
          devices: countBy(visits, (v) => v.device),
        }
      }),

    pages: () => respond(() => pageRows(read())),

    leads: () => respond(() => read().leads),

    setLeadStage: (id: string, stage: LeadStage) =>
      commit(() =>
        mutate((db) => {
          const l = db.leads.find((x) => x.id === id)
          if (l) l.stage = stage
        }),
      ),

    campaigns: () =>
      respond(() => {
        const db = read()
        return db.campaigns.map((c) => ({
          ...c,
          visits: sessions(db.visits.filter((v) => v.campaign === c.name)),
          leads: db.leads.filter((l) => l.campaign === c.name).length,
        }))
      }),

    addCampaign: (name: string, channel: string, by: string) =>
      commit(() =>
        mutate((db) => {
          if (db.campaigns.some((c) => c.name === name)) throw new ApiError('A campaign with that name already exists.')
          db.campaigns.unshift({ name, channel, at: Date.now(), by })
        }),
      ),

    qr: () =>
      respond(() => {
        const db = read()
        return db.qr.map((q) => ({
          ...q,
          scans: sessions(db.visits.filter((v) => v.source === 'QR code' && v.content === q.id)),
          leads: db.leads.filter((l) => l.source === 'QR code' && l.content === q.id).length,
        }))
      }),

    addQr: (input: { event: string; placement: string; page: string; campaign: string }) =>
      commit(() =>
        mutate((db) => {
          const id = nextId(db, 'QR', 3)
          const u = new URL(input.page, location.origin)
          u.searchParams.set('utm_source', 'qr')
          u.searchParams.set('utm_medium', 'qr')
          u.searchParams.set('utm_campaign', input.campaign || id.toLowerCase())
          u.searchParams.set('utm_content', id)
          db.qr.unshift({ id, event: input.event, placement: input.placement, url: u.toString(), at: Date.now() })
          return id
        }),
      ),

    seo: () => respond(() => read().seo),

    saveSeo: (row: { path: string; title: string; description: string }) =>
      commit(() =>
        mutate((db) => {
          const existing = db.seo.find((r) => r.path === row.path)
          if (existing) Object.assign(existing, row, { at: Date.now() })
          else db.seo.push({ ...row, at: Date.now() })
        }),
      ),
  },

  /* ---------------------------------------------------------------- */

  customer: {
    rfqs: (email: string, org: string) => respond(() => scoped(read(), email, org).rfqs),

    submitRfq: (input: Omit<RfqInput, 'via'>) => commit(() => submitRfq({ ...input, via: 'Portal' })),

    /** A change to a requirement goes to the RFQ's discussion and its engineer. */
    sendUpdate: (rfqId: string, author: string, text: string) =>
      commit(() =>
        mutate((db) => {
          const r = updateRfq(db, rfqId, (x) => {
            if (x.stage === 'Awaiting customer') x.stage = 'Technical review'
          })
          threadFor(db, r).messages.push({ at: Date.now(), from: 'customer', author, text })
          notify(db, { ...(r.assignee ? { toEmail: r.assignee } : {}), toRole: 'engineering', topic: 'clarification', kind: 'action', title: 'Customer clarification received', body: `${r.id}: ${text}` })
        }),
      ),

    quotes: (email: string, org: string) => respond(() => scoped(read(), email, org).quotes),

    decideQuote: (id: string, decision: 'Accepted' | 'Rejected') =>
      commit(() =>
        mutate((db) => {
          const q = db.quotes.find((x) => x.id === id)
          if (!q || q.status !== 'Awaiting decision') throw new ApiError('This quotation has already been decided.')
          q.status = decision
          const r = db.rfqs.find((x) => x.id === q.rfq)
          if (decision === 'Accepted') {
            const p = { id: nextId(db, 'PRJ'), at: Date.now(), org: q.org, customerEmail: q.customerEmail, rfq: q.rfq, quote: q.id, title: q.title, stage: 1 }
            db.projects.unshift(p)
            notify(db, { toRole: 'admin', topic: 'project', kind: 'action', title: 'Quotation accepted', body: `${q.id} · ${q.org}. Project ${p.id} started.` })
            if (r?.assignee) notify(db, { toEmail: r.assignee, toRole: 'engineering', topic: 'project', kind: 'action', title: 'Project started', body: `${p.id} · ${q.title}` })
          } else {
            notify(db, { toRole: 'admin', topic: 'quote', kind: 'alert', title: 'Quotation rejected', body: `${q.id} · ${q.org}.` })
          }
        }),
      ),

    projects: (email: string, org: string) => respond(() => scoped(read(), email, org).projects),

    documents: (email: string, org: string) => respond(() => scoped(read(), email, org).docs),

    uploadDocs: (input: { org: string; project: string; kind: 'Drawing' | 'Datasheet' | 'Site photo'; names: string[] }) =>
      commit(() =>
        mutate((db) => {
          input.names.forEach((name) => db.docs.unshift({ id: nextId(db, 'D'), at: Date.now(), org: input.org, project: input.project, name, kind: input.kind, by: 'customer' }))
        }),
      ),

    threads: (email: string, org: string) => respond(() => scoped(read(), email, org).threads),

    service: (email: string, org: string) => respond(() => scoped(read(), email, org).service),

    raiseService: (input: Omit<ServiceRequest, 'id' | 'at' | 'status'>) =>
      commit(() =>
        mutate((db) => {
          const s = { ...input, id: nextId(db, 'SR'), at: Date.now(), status: 'Open' as const }
          db.service.unshift(s)
          notify(db, { toRole: 'admin', topic: 'service', kind: s.priority === 'Urgent' ? 'alert' : 'action', title: `${s.priority === 'Urgent' ? 'Urgent service' : 'Service'} request`, body: `${s.id} · ${s.org}: ${s.summary}` })
        }),
      ),

    /** Contracts and invoices come from the billing system, which is not connected. */
    amc: () => respond((): Amc[] => []),
    invoices: () => respond((): Invoice[] => []),

    iiot: (email: string) =>
      respond(() => {
        const mine = read().iiot.filter((r) => r.customerEmail === email)
        return mine.length ? mine[mine.length - 1] : null
      }),

    requestIiot: (input: Omit<IiotRequest, 'id' | 'status' | 'requestedAt'>) =>
      commit(() =>
        mutate((db) => {
          const req: IiotRequest = { ...input, id: nextId(db, 'IIOT', 3), status: 'requested', requestedAt: Date.now() }
          db.iiot.push(req)
          notify(db, { toRole: 'engineering', topic: 'iiot', kind: 'action', title: 'New IIoT dashboard request', body: `${req.organisation} · ${req.site}. Pending provisioning.` })
          notify(db, { toRole: 'admin', topic: 'iiot', kind: 'info', title: 'IIoT monitoring requested', body: `${req.organisation} · ${req.site}.` })
          return req
        }),
      ),
  },
}
