import { useMemo, useState, type FormEvent } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { StatusLed } from '../../components/primitives'
import { Query, SkeletonKpis, SkeletonPanel, SkeletonRows } from '../../components/portal/Query'
import { RfqTable } from '../../components/portal/RfqTable'
import { TrendChart } from '../../components/portal/TrendChart'
import { btn, stageTone, type Tone } from '../../components/portal/styles'
import { Alert, Badge, BarList, DataTable, EmptyState, Field, Kpi, KpiGrid, PageTitle, Panel } from '../../components/portal/ui'
import { emailTemplates } from '../../emails/templates'
import { industries } from '../../data/industries'
import { portalPath, roleOrder, roles, sectionsFor, type RoleId } from '../../data/portal'
import { PROJECT_STAGES, formatDate, formatDateTime, formatInr, type Customer, type PortalUser, type Rfq, type ServiceRequest } from '../../data/portalTypes'
import { products } from '../../data/productCatalog'
import { api } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { resetAll } from '../../lib/db'
import { useQuery } from '../../lib/useQuery'
import { Milestones } from './CustomerViews'
import { RfqDetail, WorkTable } from './EngineeringViews'
import { MarketingView } from './MarketingViews'

const adminPath = (s: string) => portalPath('admin', s)

/** Nothing reports uptime or delivery yet, so nothing claims it is "operational". */
function Monitoring() {
  return (
    <EmptyState
      title="Monitoring not connected"
      body="Uptime, email delivery, IIoT ingest and backup status appear here once the backend reports them. Nothing is shown until there is a real reading."
    />
  )
}

/* ------------------------------------------------------------------
   Command center
   ------------------------------------------------------------------ */

function TeamsStrip() {
  const cust = useQuery('admin:customers', () => api.admin.customers())
  const eng = useQuery('admin:engineering', () => api.admin.engineering())
  const web = useQuery('admin:website', () => api.admin.website())
  const prod = useQuery('admin:products', () => api.admin.products())
  const tiles = [
    { to: 'website', label: 'Website', value: web.status === 'success' ? `${web.data.views30} page views · 30 d` : null },
    { to: 'team-marketing', label: 'Marketing', value: 'Leads, campaigns & SEO' },
    { to: 'customers', label: 'Customers', value: cust.status === 'success' ? `${cust.data.length} organisations` : null },
    { to: 'product-performance', label: 'Products', value: prod.status === 'success' ? `${prod.data.reduce((a, p) => a + p.views, 0)} product page views` : null },
    { to: 'team-engineering', label: 'Engineering', value: eng.status === 'success' ? `${eng.data.openRfqs} open RFQs · ${eng.data.pendingIiot} IIoT pending` : null },
  ]
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5" role="list">
      {tiles.map((t) => (
        <li key={t.to}>
          <Link to={adminPath(t.to)} className="block min-h-16 rounded-lg border border-rule bg-card px-4 py-3 shadow-(--shadow-e1) transition-[border-color] duration-150 hoverable:hover:border-ink">
            <span className="block text-sm font-semibold text-ink">{t.label} →</span>
            <span className="mt-0.5 block text-xs text-ink-muted">{t.value ?? <span className="inline-block h-3 w-24 animate-pulse rounded-sm bg-rule/60 align-middle" />}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function CommandCenter() {
  const { audit } = useAuth()
  const q = useQuery('admin:command', () => api.admin.command())
  const recent = audit().slice(0, 5)
  return (
    <>
      <PageTitle title="Command center" intro="The whole platform at a glance: today's demand, work waiting on people and every team. Every figure is counted from real activity." />

      <Query
        q={q}
        skeleton={
          <div className="mt-6 space-y-4">
            <SkeletonKpis count={8} />
            <div className="grid gap-4 md:grid-cols-2"><SkeletonPanel /><SkeletonPanel /></div>
          </div>
        }
      >
        {(d) => (
          <>
            <h2 className="sr-only">Today</h2>
            <div className="mt-6"><KpiGrid metrics={d.kpis} /></div>

            <h2 className="mt-10 text-lg font-semibold text-ink">Teams</h2>
            <div className="mt-3"><TeamsStrip /></div>

            <h2 className="mt-10 text-lg font-semibold text-ink">Trends</h2>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <TrendChart title="Visitors" points={d.trends.visitors} />
              <TrendChart title="Leads" points={d.trends.leads} />
              <TrendChart title="RFQs" points={d.trends.rfqs} />
              <TrendChart title="Quotes issued" points={d.trends.quotes} />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <Panel title="Industry demand · page views, 30 days"><BarList bars={d.industryDemand} empty="No industry pages viewed yet." /></Panel>
              <Panel title="Product demand · page views, 30 days"><BarList bars={d.productDemand} empty="No product pages viewed yet." /></Panel>
              <Panel title="Traffic sources · page views, 30 days"><BarList bars={d.trafficSources} empty="No visits recorded yet." /></Panel>
              <Panel title="Campaign performance · leads, 30 days"><BarList bars={d.campaignPerformance} unit=" leads" empty="No leads from tagged campaigns yet." /></Panel>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <Panel title="Website & funnel · 30 days" flush>
                <DataTable
                  caption="Website and funnel metrics"
                  rows={d.funnel}
                  rowKey={(r) => r.label}
                  columns={[
                    { key: 'metric', label: 'Metric', render: (r) => r.label },
                    { key: 'value', label: 'Value', align: 'right', render: (r) => <span className="readout font-mono">{r.value}</span> },
                  ]}
                />
              </Panel>
              <Panel title="System health"><Monitoring /></Panel>
            </div>
          </>
        )}
      </Query>

      <Panel
        title="Recent audit events"
        className="mt-4"
        action={<Link to={adminPath('audit')} className="text-sm font-semibold text-signal-ink hoverable:hover:underline">Full audit log</Link>}
      >
        {recent.length ? (
          <ul className="space-y-2 text-sm" role="list">
            {recent.map((e) => (
              <li key={e.id} className="flex flex-wrap gap-x-3">
                <span className="text-ink-faint">{formatDateTime(e.at)}</span>
                <span className="font-mono text-xs text-ink">{e.actor}</span>
                <span className="text-ink-muted">{e.action}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-muted">No events yet.</p>
        )}
      </Panel>
    </>
  )
}

/* ------------------------------------------------------------------
   Cross-team oversight (improve.md §2)
   ------------------------------------------------------------------ */

function Website() {
  const q = useQuery('admin:website', () => api.admin.website())
  return (
    <>
      <PageTitle title="Website" intro="What is live, how its metadata reads to search engines, and whether it is up." />
      <Query q={q} skeleton={<div className="mt-6 grid gap-4 lg:grid-cols-2"><SkeletonPanel /><SkeletonPanel /></div>}>
        {(d) => (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Panel title="Published pages" flush>
              <DataTable
                caption="Published pages by type"
                rows={d.content}
                rowKey={(r) => r.type}
                columns={[
                  { key: 'type', label: 'Page type', render: (r) => r.type },
                  { key: 'pub', label: 'Published', align: 'right', render: (r) => <span className="readout font-mono">{r.published}</span> },
                ]}
              />
              <p className="border-t border-rule px-5 py-3 text-xs text-ink-faint">Draft tracking starts when the CMS is connected.</p>
            </Panel>
            <Panel title="Uptime & system health"><Monitoring /></Panel>
            <Panel title="SEO metadata check" flush className="lg:col-span-2">
              <DataTable
                caption="SEO metadata"
                rows={d.seo}
                rowKey={(r) => r.path}
                empty="No page metadata has been edited yet. Marketing adds pages under SEO metadata."
                columns={[
                  { key: 'path', label: 'Page', render: (r) => <span className="font-mono text-xs break-all">{r.path}</span> },
                  { key: 'title', label: 'Title length', render: (r) => <Badge tone={r.titleOk ? 'good' : 'warn'}>{r.titleOk ? 'OK' : 'Fix'}</Badge> },
                  { key: 'desc', label: 'Description length', render: (r) => <Badge tone={r.descriptionOk ? 'good' : 'warn'}>{r.descriptionOk ? 'OK' : 'Fix'}</Badge> },
                ]}
              />
            </Panel>
          </div>
        )}
      </Query>
    </>
  )
}

const marketingTabs = [
  ['', 'Overview'],
  ['pages', 'Pages'],
  ['leads', 'Leads'],
  ['campaigns', 'Campaigns'],
  ['qr', 'QR codes'],
  ['seo', 'SEO'],
  ['reports', 'Reports'],
] as const

function TeamMarketing({ id }: { id?: string }) {
  const pathFor = (s: string) => adminPath(s ? `team-marketing/${s}` : 'team-marketing')
  return (
    <>
      <nav aria-label="Marketing sections" className="-mx-1 mb-6 flex gap-1 overflow-x-auto border-b border-rule px-1">
        {marketingTabs.map(([s, label]) => (
          <NavLink
            key={s}
            to={pathFor(s)}
            end
            className={({ isActive }) =>
              `relative inline-flex min-h-11 items-center px-3 text-sm font-semibold whitespace-nowrap ${
                isActive ? 'text-ink after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:bg-signal-orange' : 'text-ink-muted hoverable:hover:text-ink'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <p className="mb-4 text-xs text-ink-faint">You are viewing the Marketing team's dashboard with Super Admin permissions.</p>
      <MarketingView section={id ?? ''} pathFor={pathFor} />
    </>
  )
}

const statusTone: Record<Customer['status'], Tone> = { 'Active project': 'good', Prospect: 'info', New: 'neutral' }

function Customers() {
  const q = useQuery('admin:customers', () => api.admin.customers())
  const [text, setText] = useState('')
  const [industry, setIndustry] = useState('All')
  const [status, setStatus] = useState('All')
  return (
    <>
      <PageTitle title="Customers" intro="Every customer organisation: account holders and anyone who has raised an RFQ. Open one to see its RFQs, quotes and projects." />
      <Query
        q={q}
        skeleton={<div className="mt-6"><Panel flush><SkeletonRows rows={5} /></Panel></div>}
        isEmpty={(d) => d.length === 0}
        empty={<div className="mt-6"><Panel><EmptyState title="No customers yet" body="Customers appear here when they sign up or raise an RFQ." /></Panel></div>}
      >
        {(all) => {
          const industriesList = ['All', ...new Set(all.map((c) => c.industry))]
          const rows = all.filter(
            (c) =>
              (industry === 'All' || c.industry === industry) &&
              (status === 'All' || c.status === status) &&
              [c.company, c.contact, c.email].some((f) => f.toLowerCase().includes(text.trim().toLowerCase())),
          )
          return (
            <>
              <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
                <Field label="Search customers" type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="Company, contact or email" />
                <div>
                  <label htmlFor="c-ind" className="block text-sm font-semibold text-ink">Industry</label>
                  <select id="c-ind" value={industry} onChange={(e) => setIndustry(e.target.value)} className="mt-1.5 min-h-11 w-full rounded-sm border border-rule-strong bg-card px-3 text-ink">
                    {industriesList.map((i) => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="c-status" className="block text-sm font-semibold text-ink">Status</label>
                  <select id="c-status" value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1.5 min-h-11 w-full rounded-sm border border-rule-strong bg-card px-3 text-ink">
                    {['All', 'Active project', 'Prospect', 'New'].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <p className="mt-3 text-sm text-ink-muted" aria-live="polite">{rows.length} of {all.length} customers</p>
              <Panel className="mt-2" flush>
                <DataTable
                  caption="Customers"
                  rows={rows}
                  rowKey={(c) => c.id}
                  empty="No customers match these filters."
                  columns={[
                    {
                      key: 'company',
                      label: 'Customer',
                      render: (c) => (
                        <>
                          <Link to={adminPath(`customers/${c.id}`)} className="font-semibold text-signal-ink hoverable:hover:underline">{c.company}</Link>
                          <span className="block text-xs text-ink-faint">{c.contact || c.email}</span>
                        </>
                      ),
                    },
                    { key: 'industry', label: 'Industry', secondary: true, render: (c) => c.industry },
                    { key: 'status', label: 'Status', render: (c) => <Badge tone={statusTone[c.status]}>{c.status}</Badge> },
                    { key: 'account', label: 'Portal account', secondary: true, render: (c) => (c.hasAccount ? 'Yes' : <span className="text-ink-faint">Website only</span>) },
                    { key: 'last', label: 'Last activity', render: (c) => <span className="whitespace-nowrap">{c.lastActivity ? formatDate(c.lastActivity) : '—'}</span> },
                  ]}
                />
              </Panel>
            </>
          )
        }}
      </Query>
    </>
  )
}

const serviceTone: Record<ServiceRequest['status'], Tone> = { Open: 'warn', Scheduled: 'info', Resolved: 'good' }

function CustomerDetail({ id }: { id: string }) {
  const { record } = useAuth()
  const q = useQuery(`admin:customer:${id}`, () => api.admin.customer(id))
  return (
    <>
      <Link to={adminPath('customers')} className="text-sm font-medium text-ink-muted hoverable:hover:text-ink hoverable:hover:underline">← All customers</Link>
      <div className="mt-3">
        <Query q={q} skeleton={<SkeletonRows rows={6} />} isEmpty={(d) => d === null} empty={<EmptyState title="Customer not found" />}>
          {(d) => {
            const x = d!
            const iiot = x.iiot[x.iiot.length - 1]
            return (
              <>
                <PageTitle
                  title={x.customer.company}
                  intro={[x.customer.contact, x.customer.email, x.customer.industry !== '—' ? x.customer.industry : ''].filter(Boolean).join(' · ')}
                  actions={<Badge tone={statusTone[x.customer.status]}>{x.customer.status}</Badge>}
                />
                <Panel title="RFQs" className="mt-6" flush>
                  <RfqTable rows={x.rfqs} linkBase={adminPath('team-engineering')} empty="No RFQs from this customer yet." />
                </Panel>
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <Panel title="Quotations" flush>
                    <DataTable
                      caption="Quotations"
                      rows={x.quotes}
                      rowKey={(r) => r.id}
                      empty="No quotations issued."
                      columns={[
                        { key: 'id', label: 'Quote', render: (r) => <span className="font-mono text-xs font-semibold">{r.id}</span> },
                        { key: 'amount', label: 'Amount', align: 'right', render: (r) => <span className="readout font-mono">{formatInr(r.amount)}</span> },
                        { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'Accepted' ? 'good' : r.status === 'Rejected' ? 'bad' : 'warn'}>{r.status}</Badge> },
                      ]}
                    />
                  </Panel>
                  <Panel title="IIoT monitoring">
                    <p className="text-sm text-ink">
                      {!iiot ? (
                        <span className="text-ink-muted">Not requested</span>
                      ) : (
                        <Badge tone={iiot.status === 'provisioned' ? 'good' : iiot.status === 'failed' ? 'bad' : 'warn'}>
                          {iiot.status === 'provisioned' ? 'Provisioned' : iiot.status === 'failed' ? 'Needs attention' : 'Requested — pending provisioning'}
                        </Badge>
                      )}
                    </p>
                    {iiot && <p className="mt-2 text-sm text-ink-muted">{iiot.site} · {iiot.measures.join(', ')}</p>}
                  </Panel>
                </div>

                <h2 className="mt-8 text-lg font-semibold text-ink">Projects</h2>
                <div className="mt-3 space-y-4">
                  {x.projects.length === 0 ? (
                    <Panel><EmptyState title="No projects yet" body="A project starts when the customer accepts a quotation." /></Panel>
                  ) : (
                    x.projects.map((p) => (
                      <Panel key={p.id} title={p.title} action={<span className="font-mono text-xs text-ink-faint">{p.id}</span>}>
                        <Milestones project={p} />
                        {p.stage < PROJECT_STAGES.length - 1 && (
                          <button
                            type="button"
                            className={`${btn.secondary} mt-4`}
                            onClick={async () => {
                              await api.admin.advanceProject(p.id)
                              record(`Moved ${p.id} to ${PROJECT_STAGES[p.stage + 1]}`)
                            }}
                          >
                            Mark “{PROJECT_STAGES[p.stage]}” done
                          </button>
                        )}
                      </Panel>
                    ))
                  )}
                </div>

                <Panel title="Service requests" className="mt-6" flush>
                  <DataTable
                    caption="Service requests"
                    rows={x.service}
                    rowKey={(s) => s.id}
                    empty="No service requests."
                    columns={[
                      { key: 'id', label: 'Request', render: (s) => <span className="font-mono text-xs font-semibold">{s.id}</span> },
                      { key: 'summary', label: 'Summary', render: (s) => (<><span className="block">{s.summary}</span><span className="text-xs text-ink-faint">{s.project} · {formatDate(s.at)}</span></>) },
                      { key: 'priority', label: 'Priority', secondary: true, render: (s) => <Badge tone={s.priority === 'Urgent' ? 'bad' : 'neutral'}>{s.priority}</Badge> },
                      {
                        key: 'status',
                        label: 'Status',
                        render: (s) => (
                          <span className="flex flex-wrap items-center gap-2">
                            <Badge tone={serviceTone[s.status]}>{s.status}</Badge>
                            <select
                              aria-label={`Status of ${s.id}`}
                              value={s.status}
                              onChange={(e) => {
                                api.admin.setServiceStatus(s.id, e.target.value as ServiceRequest['status'])
                                record(`Set ${s.id} to ${e.target.value}`)
                              }}
                              className="min-h-9 rounded-sm border border-rule-strong bg-card px-1.5 text-xs text-ink"
                            >
                              {(Object.keys(serviceTone) as ServiceRequest['status'][]).map((v) => <option key={v}>{v}</option>)}
                            </select>
                          </span>
                        ),
                      },
                    ]}
                  />
                </Panel>
              </>
            )
          }}
        </Query>
      </div>
    </>
  )
}

function ProductPerformance() {
  const q = useQuery('admin:products', () => api.admin.products())
  return (
    <>
      <PageTitle title="Product performance" intro="How each product page turns interest into enquiries, last 30 days." />
      <Panel className="mt-6" flush>
        <Query q={q} skeleton={<SkeletonRows rows={6} />}>
          {(rows) => (
            <DataTable
              caption="Product performance"
              rows={[...rows].sort((a, b) => b.views - a.views)}
              rowKey={(r) => r.slug}
              columns={[
                { key: 'name', label: 'Product', render: (r) => (<><Link to={`/products/${r.slug}`} className="font-medium text-ink hoverable:hover:underline">{r.name}</Link><span className="mt-1 block"><StatusLed status={r.status} /></span></>) },
                { key: 'views', label: 'Page views', align: 'right', render: (r) => <span className="readout font-mono">{r.views.toLocaleString('en-IN')}</span> },
                { key: 'visitors', label: 'Visitors', align: 'right', secondary: true, render: (r) => <span className="readout font-mono">{r.visitors}</span> },
                { key: 'leads', label: 'Leads', align: 'right', render: (r) => <span className="readout font-mono">{r.leads}</span> },
                { key: 'conv', label: 'Visitor → lead', align: 'right', secondary: true, render: (r) => <span className="readout font-mono">{r.visitors ? `${((r.leads / r.visitors) * 100).toFixed(1)}%` : '—'}</span> },
              ]}
            />
          )}
        </Query>
      </Panel>
    </>
  )
}

function TeamEngineering({ id }: { id?: string }) {
  const q = useQuery('admin:engineering', () => api.admin.engineering())
  if (id) return <RfqDetail id={id} readOnly backTo={{ to: adminPath('team-engineering'), label: 'Engineering overview' }} />
  return (
    <>
      <PageTitle title="Engineering" intro="Open work across the engineering team. Open an RFQ for a read-only view." />
      <Query q={q} skeleton={<div className="mt-6 space-y-4"><SkeletonKpis /><Panel flush><SkeletonRows /></Panel></div>}>
        {(d) => (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Kpi metric={{ label: 'Open RFQs', value: String(d.openRfqs) }} />
              <Kpi metric={{ label: 'Pending technical reviews', value: String(d.pendingReviews) }} />
              <Kpi metric={{ label: 'Average first response', value: d.avgResponseHours === null ? '—' : `${d.avgResponseHours.toFixed(1)} h`, note: 'RFQ received → first engineer note or question' }} />
              <Kpi metric={{ label: 'IIoT requests pending', value: String(d.pendingIiot) }} />
            </div>
            <Panel title="RFQs" className="mt-6" flush>
              <RfqTable rows={d.rfqs} linkBase={adminPath('team-engineering')} />
            </Panel>
            <Panel title="Work in progress" className="mt-6" flush>
              <WorkTable rows={d.work.filter((w) => w.status !== 'Done')} rfqBase={adminPath('team-engineering')} />
            </Panel>
          </>
        )}
      </Query>
    </>
  )
}

/* ------------------------------------------------------------------
   Management
   ------------------------------------------------------------------ */

const userTone: Record<PortalUser['status'], Tone> = { Active: 'good', Disabled: 'bad', Invited: 'warn', Unverified: 'neutral' }

function Users() {
  const { record, session } = useAuth()
  const q = useQuery('admin:users', () => api.admin.users())
  const [invite, setInvite] = useState({ email: '', role: 'engineering' as RoleId })
  const [error, setError] = useState<string>()
  const [notice, setNotice] = useState<string>()

  const update = async (email: string, patch: { role?: RoleId; disabled?: boolean }, action: string) => {
    try {
      await api.admin.updateUser(email, patch)
      record(`${action}: ${email}`)
      setNotice(`${action}: ${email}`)
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Not saved.')
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const email = invite.email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Enter a complete email address.')
    setError(undefined)
    try {
      await api.admin.invite(email, invite.role)
      record(`Invited ${email} as ${roles[invite.role].title}`)
      setNotice(`Invitation recorded for ${email}. Sending it needs the email service.`)
      setInvite({ email: '', role: invite.role })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Not saved.')
    }
  }

  return (
    <>
      <PageTitle title="Users & roles" intro="Invite users, change roles and disable access. Every change is written to the audit log." />
      {notice && <div className="mt-6"><Alert tone="good" title={notice} /></div>}
      <Panel title="Invite a user" className="mt-6">
        <form onSubmit={submit} noValidate className="grid items-start gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
          <Field label="Email" type="email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} error={error} />
          <div>
            <label htmlFor="invite-role" className="block text-sm font-semibold text-ink">Role</label>
            <select id="invite-role" value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value as RoleId })} className="mt-1.5 min-h-11 w-full rounded-sm border border-rule-strong bg-card px-3 text-base text-ink">
              {roleOrder.map((r) => <option key={r} value={r}>{roles[r].title}</option>)}
            </select>
          </div>
          <button type="submit" className={`${btn.primary} md:mt-7`}>Invite</button>
        </form>
      </Panel>
      <Query q={q} skeleton={<div className="mt-6"><Panel flush><SkeletonRows rows={6} /></Panel></div>}>
        {(users) => (
          <Panel title={`All users · ${users.length}`} className="mt-6" flush>
            <DataTable
              caption="Users"
              rows={users}
              rowKey={(u) => u.email}
              columns={[
                { key: 'user', label: 'User', render: (u) => (<><span className="block font-medium">{u.name}</span><span className="font-mono text-xs text-ink-muted">{u.email}</span></>) },
                {
                  key: 'role',
                  label: 'Role',
                  render: (u) => (
                    <select
                      aria-label={`Role for ${u.email}`}
                      value={u.role}
                      disabled={u.email === session?.email}
                      onChange={(e) => update(u.email, { role: e.target.value as RoleId }, `Changed role to ${roles[e.target.value as RoleId].title}`)}
                      className="min-h-10 rounded-sm border border-rule-strong bg-card px-2 text-sm text-ink disabled:opacity-60"
                    >
                      {roleOrder.map((r) => <option key={r} value={r}>{roles[r].title}</option>)}
                    </select>
                  ),
                },
                { key: 'status', label: 'Status', render: (u) => <Badge tone={userTone[u.status]}>{u.status}</Badge> },
                { key: 'active', label: 'Last sign-in', secondary: true, render: (u) => (u.lastActive ? formatDateTime(u.lastActive) : 'Never') },
                {
                  key: 'actions',
                  label: 'Actions',
                  align: 'right',
                  render: (u) =>
                    u.email === session?.email ? (
                      <span className="text-xs text-ink-faint">You</span>
                    ) : u.status === 'Disabled' ? (
                      <button type="button" className={btn.ghost} onClick={() => update(u.email, { disabled: false }, 'Enabled user')}>Enable</button>
                    ) : (
                      <button type="button" className={`${btn.ghost} text-danger`} onClick={() => update(u.email, { disabled: true }, 'Disabled user')}>Disable</button>
                    ),
                },
              ]}
            />
          </Panel>
        )}
      </Query>
      <Panel title="Permissions by role" className="mt-6">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {roleOrder.map((r) => (
            <div key={r}>
              <p className="text-sm font-semibold text-ink">{roles[r].title}</p>
              <p className="mt-1 text-xs text-ink-faint">{sectionsFor(r).length} sections</p>
              <ul className="mt-2 space-y-1 text-sm text-ink-muted" role="list">
                {roles[r].can.slice(0, 4).map((c) => <li key={c}>{c}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Panel>
    </>
  )
}

function Audit() {
  const { audit } = useAuth()
  const [filter, setFilter] = useState<RoleId | 'all'>('all')
  const rows = useMemo(() => audit().filter((e) => filter === 'all' || e.role === filter), [audit, filter])
  return (
    <>
      <PageTitle title="Audit log" intro="Who did what, when, and from which session. Sign-ins are recorded automatically." />
      <div className="mt-6 flex items-center gap-3">
        <label htmlFor="audit-role" className="text-sm font-semibold text-ink">Role</label>
        <select id="audit-role" value={filter} onChange={(e) => setFilter(e.target.value as RoleId | 'all')} className="min-h-10 rounded-sm border border-rule-strong bg-card px-2 text-sm text-ink">
          <option value="all">All roles</option>
          {roleOrder.map((r) => <option key={r} value={r}>{roles[r].title}</option>)}
        </select>
      </div>
      <Panel className="mt-4" flush>
        <DataTable
          caption="Audit log"
          rows={rows}
          rowKey={(r) => r.id}
          empty="No audit events for this filter."
          columns={[
            { key: 'when', label: 'When', render: (r) => <span className="whitespace-nowrap">{formatDateTime(r.at)}</span> },
            { key: 'who', label: 'Who', render: (r) => <span className="font-mono text-xs">{r.actor}</span> },
            { key: 'role', label: 'Role', secondary: true, render: (r) => roles[r.role].title },
            { key: 'action', label: 'Action', render: (r) => r.action },
            { key: 'session', label: 'Session', secondary: true, render: (r) => <span className="font-mono text-xs text-ink-muted">{r.sessionId ?? '—'}</span> },
          ]}
        />
      </Panel>
      <p className="mt-3 text-xs text-ink-faint">IP addresses are recorded by the server in production; this browser prototype stores the session ID only.</p>
    </>
  )
}

function Emails() {
  const [active, setActive] = useState(emailTemplates[0].id)
  const template = emailTemplates.find((t) => t.id === active) ?? emailTemplates[0]
  return (
    <>
      <PageTitle title="Email templates" intro="Every email the sign-in and notification flows send, in the site's design. Placeholder values are shown where each message fills in its own." />
      <div className="mt-6 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <Panel flush>
          <ul className="divide-y divide-rule" role="list">
            {emailTemplates.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  aria-pressed={t.id === active}
                  onClick={() => setActive(t.id)}
                  className={`block w-full px-4 py-3 text-left transition-[background-color] duration-150 ${t.id === active ? 'bg-signal-orange/8 shadow-[inset_2px_0_0_var(--color-signal-orange)]' : 'hoverable:hover:bg-sunk'}`}
                >
                  <span className="block text-sm font-semibold text-ink">{t.name}</span>
                  <span className="block text-xs text-ink-muted">{t.audience} · {t.trigger}</span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title={template.subject} flush>
          <iframe title={`Email preview: ${template.name}`} srcDoc={template.render()} sandbox="" className="block h-[680px] w-full bg-page" />
        </Panel>
      </div>
    </>
  )
}

function Catalogue({ kind }: { kind: 'products' | 'industries' }) {
  if (kind === 'products') {
    return (
      <>
        <PageTitle title="Products" intro="The catalogue the website reads. Specifications marked 'To be verified' stay that way until engineering confirms them." />
        <Panel className="mt-6" flush>
          <DataTable
            caption="Products"
            rows={products}
            rowKey={(p) => p.slug}
            columns={[
              { key: 'name', label: 'Product', render: (p) => <span className="font-medium">{p.name}</span> },
              { key: 'family', label: 'List', secondary: true, render: (p) => (p.family === 'product' ? 'Company material' : 'Development category') },
              { key: 'status', label: 'Status', render: (p) => <StatusLed status={p.status} /> },
              { key: 'view', label: 'Page', align: 'right', render: (p) => <Link className="text-sm font-semibold text-signal-ink hoverable:hover:underline" to={`/products/${p.slug}`}>View</Link> },
            ]}
          />
        </Panel>
      </>
    )
  }
  return (
    <>
      <PageTitle title="Industries" intro="An industry only loses its 'Automation Solution Category' label once a delivered project is confirmed." />
      <Panel className="mt-6" flush>
        <DataTable
          caption="Industries"
          rows={industries}
          rowKey={(i) => i.slug}
          columns={[
            { key: 'name', label: 'Industry', render: (i) => <span className="font-medium">{i.name}</span> },
            { key: 'verified', label: 'Label', render: (i) => (i.verified ? <Badge tone="good">Confirmed</Badge> : <Badge tone="neutral">Solution category</Badge>) },
            { key: 'view', label: 'Page', align: 'right', render: (i) => <Link className="text-sm font-semibold text-signal-ink hoverable:hover:underline" to={`/industries/${i.slug}`}>View</Link> },
          ]}
        />
      </Panel>
    </>
  )
}

function Rfqs() {
  const q = useQuery('admin:rfqs', () => api.admin.rfqs())
  return (
    <>
      <PageTitle title="RFQs" intro="All incoming requirements, across every engineer." />
      <Panel className="mt-6" flush>
        <Query
          q={q}
          skeleton={<SkeletonRows />}
          isEmpty={(d) => d.length === 0}
          empty={<div className="p-5"><EmptyState title="No RFQs yet" body="RFQs arrive from the website's RFQ summary and from customer portals." /></div>}
        >
          {(rows) => <RfqTable rows={rows} linkBase={adminPath('team-engineering')} />}
        </Query>
      </Panel>
    </>
  )
}

function IssueQuote({ rfq }: { rfq: Rfq }) {
  const { record } = useAuth()
  const [amount, setAmount] = useState('')
  const [days, setDays] = useState('30')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const value = Number(amount.replace(/[,\s₹]/g, ''))
    if (!Number.isFinite(value) || value <= 0) return setError('Enter the quoted amount in rupees, before GST.')
    const valid = Number(days)
    if (!Number.isInteger(valid) || valid < 1) return setError('Validity must be a whole number of days.')
    setError(undefined)
    setBusy(true)
    try {
      const q = await api.admin.issueQuote(rfq.id, { amount: value, validDays: valid })
      record(`Issued quotation ${q.id} for ${rfq.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Not issued. Try again.')
      setBusy(false)
    }
  }

  return (
    <Panel title={`${rfq.id} · ${rfq.customer}`} action={<Badge tone={stageTone[rfq.stage]}>{rfq.stage}</Badge>}>
      <p className="text-sm text-ink-muted">{rfq.scope}</p>
      <p className="mt-1 text-xs text-ink-faint">
        {rfq.bom.length} BOM lines · engineer {rfq.assignee ?? '—'} ·{' '}
        <Link to={adminPath(`team-engineering/${rfq.id}`)} className="font-semibold text-signal-ink hoverable:hover:underline">Review configuration</Link>
      </p>
      <form onSubmit={submit} noValidate className="mt-4 grid items-start gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
        <Field label="Amount (₹, before GST)" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} error={error} />
        <Field label="Valid for (days)" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} />
        <button type="submit" disabled={busy} className={`${btn.primary} md:mt-7`}>{busy ? 'Issuing…' : 'Approve and issue quotation'}</button>
      </form>
    </Panel>
  )
}

function Quotes() {
  const q = useQuery('admin:quotes', () => api.admin.quotes())
  return (
    <>
      <PageTitle title="Quotes" intro="Approve engineering's configuration and issue the commercial quotation. Pricing is set here, never by engineering." />
      <Query q={q} skeleton={<div className="mt-6 space-y-4"><SkeletonPanel /><Panel flush><SkeletonRows rows={3} /></Panel></div>}>
        {(d) => (
          <>
            <h2 className="mt-8 text-lg font-semibold text-ink">Waiting for a quotation</h2>
            <div className="mt-3 space-y-4">
              {d.awaiting.length === 0 ? (
                <Panel><EmptyState title="Nothing waiting" body="RFQs appear here when an engineer submits them for technical owner approval." /></Panel>
              ) : (
                d.awaiting.map((r) => <IssueQuote key={r.id} rfq={r} />)
              )}
            </div>
            <h2 className="mt-8 text-lg font-semibold text-ink">Issued</h2>
            <Panel className="mt-3" flush>
              <DataTable
                caption="Issued quotations"
                rows={d.quotes}
                rowKey={(x) => x.id}
                empty="No quotations issued yet."
                columns={[
                  { key: 'id', label: 'Quote', render: (x) => <span className="font-mono text-xs font-semibold">{x.id}</span> },
                  { key: 'title', label: 'Scope', render: (x) => (<><span className="block">{x.title}</span><span className="text-xs text-ink-faint">{x.org} · {x.rfq}</span></>) },
                  { key: 'amount', label: 'Amount', align: 'right', render: (x) => <span className="readout font-mono text-sm">{formatInr(x.amount)}</span> },
                  { key: 'status', label: 'Status', render: (x) => <Badge tone={x.status === 'Accepted' ? 'good' : x.status === 'Rejected' ? 'bad' : 'warn'}>{x.status}</Badge> },
                  { key: 'valid', label: 'Valid until', secondary: true, render: (x) => formatDate(x.validUntil) },
                ]}
              />
            </Panel>
          </>
        )}
      </Query>
    </>
  )
}

function Settings() {
  const { record } = useAuth()
  const [confirm, setConfirm] = useState(false)
  const [done, setDone] = useState(false)
  return (
    <>
      <PageTitle title="System settings" />
      <Panel title="Policies" className="mt-6">
        <EmptyState title="Not connected yet" body="Password and session policy, lockout thresholds and backups are managed here once the backend is connected." />
      </Panel>
      <Panel title="Prototype records" className="mt-6">
        <p className="max-w-[68ch] text-sm text-ink-muted">
          RFQs, quotes, projects, leads, website visits, notifications and tasks are stored in this browser. Erasing them returns every
          account to zero. Accounts, sign-in history and the audit log are kept.
        </p>
        {done && <div className="mt-4"><Alert tone="good" title="All records erased" /></div>}
        <div className="mt-4 flex flex-wrap gap-2">
          {confirm ? (
            <>
              <button
                type="button"
                className={btn.danger}
                onClick={() => {
                  resetAll()
                  record('Erased all prototype records')
                  setConfirm(false)
                  setDone(true)
                }}
              >
                Yes, erase everything
              </button>
              <button type="button" className={btn.ghost} onClick={() => setConfirm(false)}>Cancel</button>
            </>
          ) : (
            <button type="button" className={btn.danger} onClick={() => { setConfirm(true); setDone(false) }}>Erase all records</button>
          )}
        </div>
      </Panel>
    </>
  )
}

/** Modules that exist in the permission model but need the backend. */
const modules: Record<string, { title: string; manages: string[] }> = {
  specifications: { title: 'Specifications', manages: ['Spec groups per product', 'Verification state per value', 'Units and ranges'] },
  pricing: { title: 'Pricing', manages: ['Price lists', 'Margins and discounts', 'Quote approval limits'] },
  content: { title: 'Website content', manages: ['Page copy', 'Navigation', 'Documents and downloads'] },
  seo: { title: 'SEO', manages: ['Titles and descriptions', 'Sitemap', 'Structured data'] },
  chatbot: { title: 'Chatbot', manages: ['Conversations', 'Hand-off to engineering', 'Answer sources'] },
  knowledge: { title: 'Knowledge base', manages: ['Articles', 'Standards references', 'FAQs'] },
  analytics: { title: 'Analytics', manages: ['Tracking setup', 'Funnels', 'Retention of visitor data'] },
  integrations: { title: 'Integrations', manages: ['Email delivery', 'CRM', 'IIoT data source', 'Payment and invoicing'] },
}

function Module({ id }: { id: string }) {
  const m = modules[id]
  return (
    <>
      <PageTitle title={m.title} />
      <Panel className="mt-6">
        <EmptyState title="Not connected yet" body={`This module needs the platform backend. Once connected, Super Admin manages: ${m.manages.join(', ').toLowerCase()}.`} />
      </Panel>
    </>
  )
}

export function AdminView({ section, id }: { section: string; id?: string }) {
  switch (section) {
    case '':
      return <CommandCenter />
    case 'website':
      return <Website />
    case 'team-marketing':
      return <TeamMarketing id={id} />
    case 'customers':
      return id ? <CustomerDetail id={id} /> : <Customers />
    case 'product-performance':
      return <ProductPerformance />
    case 'team-engineering':
      return <TeamEngineering id={id} />
    case 'users':
      return <Users />
    case 'audit':
      return <Audit />
    case 'emails':
      return <Emails />
    case 'products':
      return <Catalogue kind="products" />
    case 'industries':
      return <Catalogue kind="industries" />
    case 'rfqs':
      return <Rfqs />
    case 'quotes':
      return <Quotes />
    case 'settings':
      return <Settings />
    default:
      return modules[section] ? <Module id={section} /> : null
  }
}
