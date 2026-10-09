import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { LinkSimple, MagnifyingGlass, QrCode } from '@phosphor-icons/react'
import { Query, SkeletonKpis, SkeletonPanel, SkeletonRows } from '../../components/portal/Query'
import { TrendChart } from '../../components/portal/TrendChart'
import { btn, type Tone } from '../../components/portal/styles'
import { Alert, Badge, BarList, DataTable, EmptyState, Field, KpiGrid, PageTitle, Panel } from '../../components/portal/ui'
import { portalPath } from '../../data/portal'
import { formatDate, formatDateTime, type LeadStage, type PageRow, type SeoRow } from '../../data/portalTypes'
import { api } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { useQuery } from '../../lib/useQuery'

/** Where a marketing section lives: its own workspace, or Super Admin's drill-down. */
type PathFor = (section: string) => string
const ownPath: PathFor = (s) => portalPath('marketing', s)

/** Client-side CSV download; the prototype has no report server. */
function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

const TRACKING_NOTE = 'Counted from page views on this site since tracking started. Nothing is estimated or back-filled.'

function Overview({ pathFor }: { pathFor: PathFor }) {
  const q = useQuery('mkt:overview', () => api.marketing.overview())
  const quick = [
    { to: 'qr', label: 'QR code tracking', body: 'Exhibition and nameplate codes', icon: QrCode },
    { to: 'utm', label: 'UTM campaign builder', body: 'Tagged links for every channel', icon: LinkSimple },
    { to: 'seo', label: 'SEO metadata editor', body: 'Titles and descriptions per page', icon: MagnifyingGlass },
  ]
  return (
    <>
      <PageTitle title="Marketing overview" intro="Visitor and campaign activity for the last 30 days. Aggregate only: individual visitor records are not available to this role." />
      <ul className="mt-6 grid gap-3 md:grid-cols-3" role="list">
        {quick.map((x) => (
          <li key={x.to}>
            <Link
              to={pathFor(x.to)}
              className="flex min-h-16 items-center gap-3 rounded-lg border border-rule bg-card px-4 py-3 shadow-(--shadow-e1) transition-[border-color] duration-150 hoverable:hover:border-ink"
            >
              <x.icon size={22} weight="duotone" aria-hidden="true" className="shrink-0 text-signal-ink" />
              <span>
                <span className="block text-sm font-semibold text-ink">{x.label}</span>
                <span className="text-xs text-ink-muted">{x.body}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

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
            <div className="mt-6"><KpiGrid metrics={d.kpis} /></div>
            <p className="mt-3 text-xs text-ink-faint">{TRACKING_NOTE}</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <TrendChart title="Visitors" points={d.trends.visitors} />
              <TrendChart title="Leads" points={d.trends.leads} />
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <Panel title="Traffic sources · page views"><BarList bars={d.trafficSources} empty="No visits recorded yet." /></Panel>
              <Panel title="Campaign performance · leads"><BarList bars={d.campaignPerformance} unit=" leads" empty="No leads from tagged campaigns yet." /></Panel>
              <Panel title="Device breakdown · page views"><BarList bars={d.devices} empty="No visits recorded yet." /></Panel>
              <Panel title="Location">
                <EmptyState title="Not collected yet" body="Visits by state need the server-side analytics collector, which reads the region from the connection. The browser prototype does not guess it." />
              </Panel>
            </div>
          </>
        )}
      </Query>
    </>
  )
}

const pageColumns = [
  { key: 'path', label: 'Page', render: (r: PageRow) => <span className="font-mono text-xs break-all">{r.path}</span> },
  { key: 'views', label: 'Views', align: 'right' as const, render: (r: PageRow) => <span className="readout font-mono">{r.views.toLocaleString('en-IN')}</span> },
  { key: 'leads', label: 'Leads', align: 'right' as const, render: (r: PageRow) => <span className="readout font-mono">{r.leads}</span> },
  { key: 'rate', label: 'Lead rate', align: 'right' as const, secondary: true, render: (r: PageRow) => <span className="readout font-mono">{((r.leads / r.views) * 100).toFixed(1)}%</span> },
  { key: 'exit', label: 'Exit rate', align: 'right' as const, render: (r: PageRow) => <span className="readout font-mono">{r.exitRate}%</span> },
]

function Pages() {
  const q = useQuery('mkt:pages', () => api.marketing.pages())
  return (
    <>
      <PageTitle title="Page performance" intro="Views, leads and exits by page, last 30 days." />
      <Query
        q={q}
        skeleton={<div className="mt-6"><Panel flush><SkeletonRows rows={6} /></Panel></div>}
        isEmpty={(d) => d.length === 0}
        empty={<div className="mt-6"><Panel><EmptyState title="No page views yet" body="Pages appear here as soon as the public site is visited." /></Panel></div>}
      >
        {(rows) => {
          const groups: [string, PageRow[]][] = [
            ['Top pages', [...rows].sort((a, b) => b.views - a.views).slice(0, 8)],
            ['Exit pages', [...rows].filter((r) => r.exitRate > 0).sort((a, b) => b.exitRate - a.exitRate).slice(0, 5)],
            ['Product pages', rows.filter((r) => r.path.startsWith('/products/'))],
            ['Industry pages', rows.filter((r) => r.path.startsWith('/industries/'))],
          ]
          return (
            <div className="mt-6 space-y-6">
              {groups.map(([title, list]) => (
                <Panel key={title} title={title} flush>
                  <DataTable caption={title} rows={list} rowKey={(r) => r.path} columns={pageColumns} empty="No pages in this group yet." />
                </Panel>
              ))}
            </div>
          )
        }}
      </Query>
    </>
  )
}

const leadTone: Record<LeadStage, Tone> = { New: 'warn', Contacted: 'info', 'RFQ raised': 'good', Closed: 'neutral' }

function Leads() {
  const { record } = useAuth()
  const q = useQuery('mkt:leads', () => api.marketing.leads())
  return (
    <>
      <PageTitle
        title="Leads"
        intro="Where each lead came from and how far it has moved. Contact details stay with sales."
        actions={
          q.status === 'success' &&
          q.data.length > 0 && (
            <button
              type="button"
              className={btn.secondary}
              onClick={() =>
                downloadCsv('leads.csv', [
                  ['Lead', 'Received', 'Source', 'Campaign', 'Interest', 'Page', 'Stage'],
                  ...q.data.map((l) => [l.id, formatDateTime(l.at), l.source, l.campaign ?? '', l.interest, l.page, l.stage]),
                ])
              }
            >
              Export CSV
            </button>
          )
        }
      />
      <Panel className="mt-6" flush>
        <Query
          q={q}
          skeleton={<SkeletonRows />}
          isEmpty={(d) => d.length === 0}
          empty={<div className="p-5"><EmptyState title="No leads yet" body="Leads from the website's requirement form, RFQs and QR codes appear here." /></div>}
        >
          {(rows) => (
            <DataTable
              caption="Leads"
              rows={rows}
              rowKey={(l) => l.id}
              columns={[
                { key: 'id', label: 'Lead', render: (l) => <span className="font-mono text-xs font-semibold">{l.id}</span> },
                { key: 'when', label: 'Received', secondary: true, render: (l) => formatDateTime(l.at) },
                { key: 'source', label: 'Source', render: (l) => (<><span className="block">{l.source}</span>{l.campaign && <span className="font-mono text-xs text-ink-faint">{l.campaign}</span>}</>) },
                { key: 'interest', label: 'Interest', render: (l) => l.interest },
                {
                  key: 'stage',
                  label: 'Stage',
                  render: (l) => (
                    <span className="flex flex-wrap items-center gap-2">
                      <Badge tone={leadTone[l.stage]}>{l.stage}</Badge>
                      <select
                        aria-label={`Move ${l.id} to stage`}
                        value={l.stage}
                        onChange={(e) => {
                          api.marketing.setLeadStage(l.id, e.target.value as LeadStage)
                          record(`Moved ${l.id} to ${e.target.value}`)
                        }}
                        className="min-h-9 rounded-sm border border-rule-strong bg-card px-1.5 text-xs text-ink"
                      >
                        {(Object.keys(leadTone) as LeadStage[]).map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </span>
                  ),
                },
              ]}
            />
          )}
        </Query>
      </Panel>
    </>
  )
}

function Campaigns() {
  const { session, record } = useAuth()
  const q = useQuery('mkt:campaigns', () => api.marketing.campaigns())
  const [form, setForm] = useState({ name: '', channel: 'Search' })
  const [error, setError] = useState<string>()

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!/^[a-z0-9-]{3,}$/.test(form.name)) return setError('Use 3 or more lowercase letters, numbers or hyphens, e.g. monsoon-etp.')
    setError(undefined)
    try {
      await api.marketing.addCampaign(form.name, form.channel, session?.email ?? '')
      record(`Created campaign ${form.name}`)
      setForm({ name: '', channel: form.channel })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Not saved. Try again.')
    }
  }

  return (
    <>
      <PageTitle title="Campaigns" intro="Create a campaign, then tag its links in the UTM builder. Visits and leads count against the utm_campaign name." />
      <Panel title="New campaign" className="mt-6">
        <form onSubmit={submit} noValidate className="grid items-start gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
          <Field label="Campaign name" hint="Becomes utm_campaign." value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value.toLowerCase() })} error={error} />
          <div>
            <label htmlFor="c-channel" className="block text-sm font-semibold text-ink">Channel</label>
            <p className="text-xs text-ink-faint">Primary source.</p>
            <select id="c-channel" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} className="mt-1.5 min-h-11 w-full rounded-sm border border-rule-strong bg-card px-3">
              {['Search', 'Social', 'Email', 'Exhibition', 'Referral'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <button type="submit" className={`${btn.primary} md:mt-11`}>Create</button>
        </form>
      </Panel>
      <Panel className="mt-6" flush>
        <Query
          q={q}
          skeleton={<SkeletonRows rows={3} />}
          isEmpty={(d) => d.length === 0}
          empty={<div className="p-5"><EmptyState title="No campaigns yet" body="Create one above." /></div>}
        >
          {(rows) => (
            <DataTable
              caption="Campaigns"
              rows={rows}
              rowKey={(c) => c.name}
              columns={[
                { key: 'name', label: 'Campaign', render: (c) => <span className="font-mono text-xs font-semibold">{c.name}</span> },
                { key: 'channel', label: 'Channel', render: (c) => c.channel },
                { key: 'created', label: 'Created', secondary: true, render: (c) => formatDate(c.at) },
                { key: 'visits', label: 'Visits', align: 'right', render: (c) => <span className="readout font-mono">{c.visits}</span> },
                { key: 'leads', label: 'Leads', align: 'right', render: (c) => <span className="readout font-mono">{c.leads}</span> },
              ]}
            />
          )}
        </Query>
      </Panel>
    </>
  )
}

function Utm() {
  const [f, setF] = useState({ url: `${location.origin}/`, source: '', medium: '', campaign: '', content: '' })
  const [copied, setCopied] = useState(false)
  const result = useMemo(() => {
    try {
      const u = new URL(f.url)
      const set = (k: string, v: string) => v.trim() && u.searchParams.set(k, v.trim().toLowerCase().replace(/\s+/g, '-'))
      set('utm_source', f.source)
      set('utm_medium', f.medium)
      set('utm_campaign', f.campaign)
      set('utm_content', f.content)
      return { ok: true as const, url: u.toString() }
    } catch {
      return { ok: false as const }
    }
  }, [f])
  const upd = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setF({ ...f, [k]: e.target.value })
    setCopied(false)
  }
  return (
    <>
      <PageTitle title="UTM builder" intro="Tag a link so its visits and leads land against the right campaign." />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Link details">
          <div className="space-y-4">
            <Field label="Page URL" type="url" value={f.url} onChange={upd('url')} error={result.ok ? undefined : 'Enter a full URL starting with https://'} />
            <Field label="Source" hint="Where the link is posted: google, linkedin, newsletter." value={f.source} onChange={upd('source')} />
            <Field label="Medium" hint="cpc, social, email." value={f.medium} onChange={upd('medium')} />
            <Field label="Campaign" hint="Use a name from Campaigns so it counts there." value={f.campaign} onChange={upd('campaign')} />
            <Field label="Content (optional)" hint="Tells two links in the same campaign apart." value={f.content} onChange={upd('content')} />
          </div>
        </Panel>
        <Panel title="Tagged link">
          {result.ok ? (
            <>
              <p className="rounded-sm border border-rule bg-sunk p-3 font-mono text-xs break-all text-ink">{result.url}</p>
              <button
                type="button"
                className={`${btn.primary} mt-4`}
                onClick={() => {
                  navigator.clipboard?.writeText(result.url).then(() => setCopied(true), () => setCopied(false))
                }}
              >
                {copied ? 'Copied' : 'Copy link'}
              </button>
              <p className="mt-2 text-xs text-ink-faint" aria-live="polite">{copied ? 'Link copied to the clipboard.' : ''}</p>
            </>
          ) : (
            <EmptyState title="Enter a valid page URL" />
          )}
        </Panel>
      </div>
    </>
  )
}

function Qr() {
  const { record } = useAuth()
  const q = useQuery('mkt:qr', () => api.marketing.qr())
  const [form, setForm] = useState({ event: '', placement: '', page: '/', campaign: '' })
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next = {
      event: form.event.trim() ? undefined : 'Name the event or place the code is used.',
      page: form.page.startsWith('/') ? undefined : 'Enter a site path starting with /, e.g. /industries/solar-and-energy',
    }
    setErrors(next)
    if (Object.values(next).some(Boolean)) return
    try {
      const id = await api.marketing.addQr({ event: form.event.trim(), placement: form.placement.trim(), page: form.page.trim(), campaign: form.campaign.trim() })
      record(`Created QR code ${id}`)
      setForm({ event: '', placement: '', page: '/', campaign: '' })
    } catch (err) {
      setErrors({ event: err instanceof Error ? err.message : 'Not saved.' })
    }
  }

  return (
    <>
      <PageTitle title="QR code tracking" intro="Each code gets its own tagged link. Scans count when someone opens it; leads count when they then enquire." />
      <Panel title="New QR code" className="mt-6">
        <form onSubmit={submit} noValidate className="grid items-start gap-4 md:grid-cols-2">
          <Field label="Event or use" hint="e.g. Water expo 2026, panel nameplate" value={form.event} onChange={(e) => setForm({ ...form, event: e.target.value })} error={errors.event} />
          <Field label="Placement (optional)" hint="Stall backdrop, brochure, delivered panels" value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })} />
          <Field label="Landing page" value={form.page} onChange={(e) => setForm({ ...form, page: e.target.value })} error={errors.page} />
          <Field label="Campaign (optional)" value={form.campaign} onChange={(e) => setForm({ ...form, campaign: e.target.value.toLowerCase() })} />
          <div><button type="submit" className={btn.primary}>Create code</button></div>
        </form>
      </Panel>
      <Panel className="mt-6" flush>
        <Query
          q={q}
          skeleton={<SkeletonRows rows={3} />}
          isEmpty={(d) => d.length === 0}
          empty={<div className="p-5"><EmptyState title="No QR codes yet" body="Create one above, then print its link as a QR code." /></div>}
        >
          {(rows) => (
            <DataTable
              caption="QR codes"
              rows={rows}
              rowKey={(x) => x.id}
              columns={[
                { key: 'id', label: 'Code', render: (x) => <span className="font-mono text-xs font-semibold">{x.id}</span> },
                { key: 'where', label: 'Placement', render: (x) => (<><span className="block">{x.event}</span><span className="text-xs text-ink-faint">{x.placement || '—'}</span></>) },
                { key: 'url', label: 'Link to print', secondary: true, render: (x) => <span className="font-mono text-[11px] break-all text-ink-muted">{x.url}</span> },
                { key: 'scans', label: 'Scans', align: 'right', render: (x) => <span className="readout font-mono">{x.scans}</span> },
                { key: 'leads', label: 'Leads', align: 'right', render: (x) => <span className="readout font-mono">{x.leads}</span> },
              ]}
            />
          )}
        </Query>
      </Panel>
    </>
  )
}

function lengthBadge(len: number, min: number, max: number) {
  if (len === 0) return <Badge tone="bad">Missing</Badge>
  if (len > max) return <Badge tone="warn">{len} chars · too long</Badge>
  if (len < min) return <Badge tone="warn">{len} chars · short</Badge>
  return <Badge tone="good">{len} chars</Badge>
}

function SeoForm({ row, onSaved }: { row?: SeoRow; onSaved: (path: string) => void }) {
  const { record } = useAuth()
  const [f, setF] = useState({ path: row?.path ?? '', title: row?.title ?? '', description: row?.description ?? '' })
  const [error, setError] = useState<string>()
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault()
        if (!f.path.startsWith('/')) return setError('Enter a site path starting with /.')
        setError(undefined)
        try {
          await api.marketing.saveSeo({ path: f.path.trim(), title: f.title.trim(), description: f.description.trim() })
          record(`Updated SEO metadata for ${f.path}`)
          onSaved(f.path)
          if (!row) setF({ path: '', title: '', description: '' })
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Not saved.')
        }
      }}
    >
      {!row && <Field label="Page path" hint="e.g. /industries/water-and-wastewater" value={f.path} error={error} onChange={(e) => setF({ ...f, path: e.target.value })} />}
      <div>
        <Field label="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <div className="mt-1.5">{lengthBadge(f.title.length, 20, 60)}</div>
      </div>
      <div>
        <Field label="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <div className="mt-1.5">{lengthBadge(f.description.length, 70, 160)}</div>
      </div>
      <button type="submit" className={btn.secondary}>{row ? 'Save' : 'Add page'}</button>
    </form>
  )
}

function Seo() {
  const q = useQuery('mkt:seo', () => api.marketing.seo())
  const [saved, setSaved] = useState<string>()
  return (
    <>
      <PageTitle title="SEO metadata" intro="Titles up to 60 characters and descriptions of 70–160 read cleanly in search results." />
      {saved && <div className="mt-6"><Alert tone="good" title={`Saved metadata for ${saved}`} /></div>}
      <Panel title="Add a page" className="mt-6"><SeoForm onSaved={setSaved} /></Panel>
      <Query
        q={q}
        skeleton={<div className="mt-6"><Panel><SkeletonRows rows={4} /></Panel></div>}
        isEmpty={(d) => d.length === 0}
        empty={<div className="mt-6"><Panel><EmptyState title="No pages edited yet" body="Search clicks and positions appear per page once Google Search Console is connected." /></Panel></div>}
      >
        {(rows) => (
          <div className="mt-6 space-y-4">
            {rows.map((r) => (
              <Panel key={r.path} title={r.path} action={<span className="text-xs text-ink-faint">Saved {formatDateTime(r.at)}</span>}>
                <SeoForm row={r} onSaved={setSaved} />
              </Panel>
            ))}
          </div>
        )}
      </Query>
    </>
  )
}

function Content() {
  const kinds = ['Landing pages', 'Blog posts', 'Website banners', 'CTAs', 'Promotional content', 'Social links']
  return (
    <>
      <PageTitle title="Pages, blog & banners" />
      <Panel className="mt-6">
        <EmptyState
          title="Content editing needs the CMS backend"
          body={`Once connected, marketing creates and schedules: ${kinds.join(', ').toLowerCase()}. Technical specifications, BOMs and prices stay read-only for this role.`}
        />
      </Panel>
    </>
  )
}

function Reports() {
  const [busy, setBusy] = useState<string>()
  const [error, setError] = useState<string>()
  const reports: { name: string; file: string; rows: () => Promise<(string | number)[][]> }[] = [
    { name: 'Traffic sources, 30 days', file: 'traffic-sources.csv', rows: async () => [['Source', 'Page views'], ...(await api.marketing.overview()).trafficSources.map((b) => [b.label, b.value])] },
    { name: 'Daily visitors, 30 days', file: 'visitors.csv', rows: async () => [['Day', 'Visitors'], ...(await api.marketing.overview()).trends.visitors.map((p) => [p.label, p.value])] },
    { name: 'Page performance', file: 'pages.csv', rows: async () => [['Page', 'Views', 'Leads', 'Exit rate %'], ...(await api.marketing.pages()).map((r) => [r.path, r.views, r.leads, r.exitRate])] },
    { name: 'Campaign performance', file: 'campaigns.csv', rows: async () => [['Campaign', 'Channel', 'Visits', 'Leads'], ...(await api.marketing.campaigns()).map((c) => [c.name, c.channel, c.visits, c.leads])] },
  ]
  return (
    <>
      <PageTitle title="Reports" intro="Download aggregate reports as CSV. Each export is generated from current data." />
      {error && <div className="mt-6"><Alert tone="bad" title="Export failed">{error}</Alert></div>}
      <Panel className="mt-6" flush>
        <ul className="divide-y divide-rule" role="list">
          {reports.map((r) => (
            <li key={r.file} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
              <span className="text-sm font-medium text-ink">{r.name}</span>
              <button
                type="button"
                disabled={busy !== undefined}
                className={btn.secondary}
                onClick={async () => {
                  setBusy(r.file)
                  setError(undefined)
                  try {
                    downloadCsv(r.file, await r.rows())
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Try again.')
                  } finally {
                    setBusy(undefined)
                  }
                }}
              >
                {busy === r.file ? 'Preparing…' : 'Download CSV'}
              </button>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  )
}

export function MarketingView({ section, pathFor = ownPath }: { section: string; pathFor?: PathFor }) {
  switch (section) {
    case '':
      return <Overview pathFor={pathFor} />
    case 'pages':
      return <Pages />
    case 'leads':
      return <Leads />
    case 'campaigns':
      return <Campaigns />
    case 'utm':
      return <Utm />
    case 'qr':
      return <Qr />
    case 'seo':
      return <Seo />
    case 'content':
      return <Content />
    case 'reports':
      return <Reports />
    default:
      return null
  }
}
