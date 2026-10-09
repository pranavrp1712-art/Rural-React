import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Broadcast, CheckCircle, Lock } from '@phosphor-icons/react'
import { Query, Skeleton, SkeletonRows } from '../../components/portal/Query'
import { btn, stageTone } from '../../components/portal/styles'
import { Alert, Badge, DataTable, EmptyState, Field, PageTitle, Panel } from '../../components/portal/ui'
import { industries } from '../../data/industries'
import { portalPath } from '../../data/portal'
import {
  PROJECT_STAGES,
  formatDate,
  formatDateTime,
  formatInr,
  milestones,
  type CustomerQuote,
  type Doc,
  type Project,
  type Rfq,
} from '../../data/portalTypes'
import { IIOT_MEASURES, api, type IiotRequest } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { useQuery } from '../../lib/useQuery'

/**
 * Everything here is requested for the signed-in customer's own
 * organisation. Customers never receive internal cost, margin, notes,
 * analytics or other customers' records: the data layer does not
 * return those fields, which is how the server must behave too.
 */

function useOrg() {
  const { session } = useAuth()
  return { org: session?.organisation ?? '', email: session?.email ?? '', name: session?.name ?? '' }
}

export function Milestones({ project }: { project: Project }) {
  return (
    <ol className="mt-4 grid gap-2 sm:grid-cols-7" role="list">
      {milestones(project).map((m) => (
        <li key={m.label} className="flex items-center gap-2 sm:flex-col sm:items-start">
          <span
            aria-hidden="true"
            className={`h-1.5 w-8 shrink-0 rounded-sm sm:w-full ${m.state === 'done' ? 'bg-process-green' : m.state === 'current' ? 'bg-signal-orange' : 'bg-rule'}`}
          />
          <span className={`text-xs ${m.state === 'next' ? 'text-ink-faint' : 'font-medium text-ink'}`}>
            {m.label}
            <span className="sr-only">{m.state === 'done' ? ' (done)' : m.state === 'current' ? ' (in progress)' : ' (not started)'}</span>
          </span>
        </li>
      ))}
    </ol>
  )
}

const quoteTone = (s: CustomerQuote['status']) => (s === 'Accepted' ? 'good' : s === 'Rejected' ? 'bad' : 'warn')

/** What a customer is shown for each internal RFQ stage. */
const customerStage: Record<Rfq['stage'], string> = {
  Preliminary: 'Received',
  'Technical review': 'Engineering review',
  'Awaiting customer': 'Question for you',
  'Approval pending': 'Preparing quotation',
  Quoted: 'Quotation issued',
}

function RfqList({ rows }: { rows: Rfq[] }) {
  return (
    <DataTable
      caption="Your RFQs"
      rows={rows}
      rowKey={(r) => r.id}
      columns={[
        { key: 'id', label: 'RFQ', render: (r) => <span className="font-mono text-xs font-semibold">{r.id}</span> },
        { key: 'scope', label: 'Scope', render: (r) => (<><span className="block">{r.scope}</span><span className="text-xs text-ink-faint">{r.industry}</span></>) },
        { key: 'stage', label: 'Status', render: (r) => <Badge tone={stageTone[r.stage]}>{customerStage[r.stage]}</Badge> },
        { key: 'at', label: 'Submitted', align: 'right', secondary: true, render: (r) => formatDate(r.at) },
      ]}
    />
  )
}

function Dashboard() {
  const { org, email, name } = useOrg()
  const projects = useQuery(`cust:projects:${email}`, () => api.customer.projects(email, org))
  const rfqs = useQuery(`cust:rfqs:${email}`, () => api.customer.rfqs(email, org))
  const quotes = useQuery(`cust:quotes:${email}`, () => api.customer.quotes(email, org))
  const threads = useQuery(`cust:threads:${email}`, () => api.customer.threads(email, org))
  const iiot = useQuery(`iiot:mine:${email}`, () => api.customer.iiot(email))

  const pendingQuote = quotes.status === 'success' ? quotes.data.find((q) => q.status === 'Awaiting decision') : undefined
  const openThread = threads.status === 'success' ? threads.data.find((t) => t.messages[t.messages.length - 1]?.from === 'engineer') : undefined

  return (
    <>
      <PageTitle
        title={`Welcome, ${name.split(' ')[0]}`}
        intro={`Status of the RFQs and projects for ${org}.`}
        actions={<Link to={portalPath('customer', 'rfqs')} className={btn.primary}>Submit a new RFQ</Link>}
      />

      <div className="mt-6 space-y-3">
        {pendingQuote && (
          <Alert tone="warn" title={`Quotation ${pendingQuote.id} is waiting for your decision`}>
            <Link to={portalPath('customer', 'quotes')} className="font-semibold text-ink underline underline-offset-2">Review the quotation</Link>
          </Alert>
        )}
        {openThread && (
          <Alert tone="info" title={`Your engineer asked about ${openThread.rfq}`}>
            <Link to={portalPath('customer', 'discussions')} className="font-semibold text-ink underline underline-offset-2">Answer it</Link>
          </Alert>
        )}
        {iiot.status === 'success' && iiot.data === null && (
          <Alert tone="neutral" title="Live monitoring is available for your site">
            <Link to={portalPath('customer', 'iiot')} className="font-semibold text-ink underline underline-offset-2">Request IIoT monitoring</Link>
          </Alert>
        )}
      </div>

      <h2 className="mt-8 text-lg font-semibold text-ink">Projects</h2>
      <div className="mt-3">
        <Query
          q={projects}
          skeleton={<Panel><Skeleton className="h-4 w-48" /><Skeleton className="mt-5 h-2 w-full" /></Panel>}
          isEmpty={(d) => d.length === 0}
          empty={<Panel><EmptyState title="No projects yet" body="A project starts when you accept a quotation. Its stages will show here." /></Panel>}
        >
          {(list) => (
            <div className="space-y-4">
              {list.map((p) => (
                <Panel key={p.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-ink">{p.title}</p>
                    <span className="font-mono text-xs text-ink-faint">{p.id}</span>
                  </div>
                  <Milestones project={p} />
                </Panel>
              ))}
            </div>
          )}
        </Query>
      </div>

      <Panel title="Your RFQs" className="mt-6" flush>
        <Query
          q={rfqs}
          skeleton={<SkeletonRows rows={2} />}
          isEmpty={(d) => d.length === 0}
          empty={<div className="p-5"><EmptyState title="No RFQs yet" body="They'll show up here once submitted." action={<Link to={portalPath('customer', 'rfqs')} className={btn.primary}>Submit an RFQ</Link>} /></div>}
        >
          {(rows) => <RfqList rows={rows} />}
        </Query>
      </Panel>
    </>
  )
}

function NewRfq() {
  const { org, email, name } = useOrg()
  const { record } = useAuth()
  const [form, setForm] = useState({ scope: '', industry: '', details: '' })
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<string>()
  const [apiError, setApiError] = useState<string>()

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next = {
      scope: form.scope.trim().length >= 8 ? undefined : 'Summarise the requirement in a line, e.g. "pH dosing for a 20 m³/h ETP".',
      industry: form.industry ? undefined : 'Choose the closest industry.',
    }
    setErrors(next)
    if (Object.values(next).some(Boolean)) return
    setBusy(true)
    setApiError(undefined)
    try {
      const rfq = await api.customer.submitRfq({ customer: org, customerEmail: email, contact: name, industry: form.industry, scope: form.scope, details: form.details })
      record(`Submitted ${rfq.id}`)
      setDone(rfq.id)
      setForm({ scope: '', industry: '', details: '' })
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'The RFQ was not sent.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel title="Submit a new RFQ" className="mt-6">
      <form onSubmit={submit} noValidate className="space-y-5">
        {done && <Alert tone="good" title={`${done} submitted`}>An engineer picks it up from the queue. You'll be notified of questions and the quotation.</Alert>}
        {apiError && <Alert tone="bad" title="Not sent">{apiError}</Alert>}
        <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Field label="Requirement" value={form.scope} onChange={(e) => { setForm({ ...form, scope: e.target.value }); setDone(undefined) }} error={errors.scope} required />
          <div>
            <label htmlFor="rfq-industry" className="block text-sm font-semibold text-ink">Industry <span aria-hidden="true" className="text-danger">*</span></label>
            <select
              id="rfq-industry"
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
              aria-invalid={Boolean(errors.industry)}
              className="mt-1.5 min-h-11 w-full rounded-sm border border-rule-strong bg-card px-3 text-ink"
            >
              <option value="">Choose…</option>
              {industries.map((i) => <option key={i.slug}>{i.name}</option>)}
              <option>Other</option>
            </select>
            {errors.industry && <p className="mt-1.5 text-sm font-medium text-danger">{errors.industry}</p>}
          </div>
        </div>
        <div>
          <label htmlFor="rfq-details" className="block text-sm font-semibold text-ink">Details (optional)</label>
          <p className="text-xs text-ink-faint">Flow rates, tank sizes, existing equipment, site conditions.</p>
          <textarea
            id="rfq-details"
            rows={4}
            value={form.details}
            onChange={(e) => setForm({ ...form, details: e.target.value })}
            className="mt-1.5 w-full rounded-sm border border-rule-strong bg-card px-3 py-2 text-base text-ink"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={busy} className={btn.primary}>{busy ? 'Submitting…' : 'Submit RFQ'}</button>
          <Link to="/configure" className={btn.ghost}>Use the guided requirement wizard instead</Link>
        </div>
      </form>
    </Panel>
  )
}

function Rfqs() {
  const { org, email, name } = useOrg()
  const q = useQuery(`cust:rfqs:${email}`, () => api.customer.rfqs(email, org))
  const [rfq, setRfq] = useState('')
  const [update, setUpdate] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string>()
  return (
    <>
      <PageTitle title="My RFQs" intro="Requirements you have submitted and where each one stands." />
      <NewRfq />
      <Panel className="mt-6" flush>
        <Query
          q={q}
          skeleton={<SkeletonRows rows={3} />}
          isEmpty={(d) => d.length === 0}
          empty={<div className="p-5"><EmptyState title="No RFQs yet" body="Submit your first one above." /></div>}
        >
          {(rows) => <RfqList rows={rows} />}
        </Query>
      </Panel>
      {q.status === 'success' && q.data.length > 0 && (
        <Panel title="Update a requirement" className="mt-6">
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const target = rfq || q.data[0].id
              if (!update.trim()) return setError('Say what changed.')
              setError(undefined)
              try {
                await api.customer.sendUpdate(target, name, update.trim())
                setSent(true)
                setUpdate('')
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Not sent. Try again.')
              }
            }}
            noValidate
            className="space-y-4"
          >
            {sent && <Alert tone="good" title="Update sent to engineering">It is kept with the RFQ under Technical discussions.</Alert>}
            <div>
              <label htmlFor="upd-rfq" className="block text-sm font-semibold text-ink">RFQ</label>
              <select id="upd-rfq" value={rfq || q.data[0].id} onChange={(e) => setRfq(e.target.value)} className="mt-1.5 min-h-11 w-full rounded-sm border border-rule-strong bg-card px-3 text-ink md:w-auto">
                {q.data.map((r) => <option key={r.id} value={r.id}>{r.id} · {r.scope}</option>)}
              </select>
            </div>
            <Field label="What changed?" hint="New flow rate, extra tank, a different panel location…" value={update} error={error} onChange={(e) => { setUpdate(e.target.value); setSent(false) }} />
            <button type="submit" className={btn.secondary}>Send update</button>
          </form>
        </Panel>
      )}
    </>
  )
}

function QuoteCard({ quote }: { quote: CustomerQuote }) {
  const { record } = useAuth()
  const [confirm, setConfirm] = useState<'Accepted' | 'Rejected' | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  const decide = async (decision: 'Accepted' | 'Rejected') => {
    setBusy(true)
    setError(undefined)
    try {
      await api.customer.decideQuote(quote.id, decision)
      record(`${decision} quotation ${quote.id}`)
      setConfirm(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Not saved. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-ink-faint">{quote.id} · for {quote.rfq}</p>
          <p className="mt-1 font-semibold text-ink">{quote.title}</p>
          <p className="readout mt-2 font-display text-2xl font-semibold text-ink">{formatInr(quote.amount)} <span className="text-sm font-normal text-ink-muted">+ GST</span></p>
          <p className="text-xs text-ink-faint">Valid until {formatDate(quote.validUntil)}</p>
        </div>
        <Badge tone={quoteTone(quote.status)}>{quote.status}</Badge>
      </div>
      {error && <div className="mt-4"><Alert tone="bad" title="Not saved">{error}</Alert></div>}
      {quote.status === 'Awaiting decision' && (
        <div className="mt-5 border-t border-rule pt-4">
          {confirm ? (
            <div className="space-y-3">
              <p className="text-sm text-ink">{confirm === 'Accepted' ? 'Accept this quotation and start the project?' : 'Reject this quotation? Your engineer will ask what to change.'}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={busy} className={confirm === 'Accepted' ? btn.primary : btn.danger} onClick={() => decide(confirm)}>
                  {busy ? 'Saving…' : `Yes, ${confirm === 'Accepted' ? 'accept' : 'reject'}`}
                </button>
                <button type="button" className={btn.ghost} onClick={() => setConfirm(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button type="button" className={btn.primary} onClick={() => setConfirm('Accepted')}>Accept quotation</button>
              <button type="button" className={btn.secondary} onClick={() => setConfirm('Rejected')}>Reject</button>
            </div>
          )}
        </div>
      )}
    </Panel>
  )
}

function Quotes() {
  const { org, email } = useOrg()
  const q = useQuery(`cust:quotes:${email}`, () => api.customer.quotes(email, org))
  return (
    <>
      <PageTitle title="My quotes" intro="Quotations issued to you. Accepting starts the project; rejecting lets you tell us why." />
      <div className="mt-6">
        <Query
          q={q}
          skeleton={<Panel><SkeletonRows rows={2} /></Panel>}
          isEmpty={(d) => d.length === 0}
          empty={<Panel><EmptyState title="No quotations yet" body="A quotation arrives after an engineer has reviewed your RFQ." /></Panel>}
        >
          {(list) => <div className="space-y-4">{list.map((x) => <QuoteCard key={x.id} quote={x} />)}</div>}
        </Query>
      </div>
    </>
  )
}

function Projects() {
  const { org, email } = useOrg()
  const q = useQuery(`cust:projects:${email}`, () => api.customer.projects(email, org))
  return (
    <>
      <PageTitle title="My projects" intro="Every stage from approved drawings to commissioning and handover." />
      <div className="mt-6">
        <Query
          q={q}
          skeleton={<Panel><SkeletonRows rows={2} /></Panel>}
          isEmpty={(d) => d.length === 0}
          empty={<Panel><EmptyState title="No projects yet" body="A project starts when you accept a quotation." /></Panel>}
        >
          {(list) => (
            <div className="space-y-4">
              {list.map((p) => (
                <Panel key={p.id} title={p.title} action={<span className="font-mono text-xs text-ink-faint">{p.id}</span>}>
                  <p className="text-sm text-ink-muted">Current stage: <span className="font-semibold text-ink">{PROJECT_STAGES[p.stage] ?? 'Complete'}</span></p>
                  <Milestones project={p} />
                </Panel>
              ))}
            </div>
          )}
        </Query>
      </div>
    </>
  )
}

function DocumentsTable({ docs, projects }: { docs: Doc[]; projects: Project[] }) {
  const { org } = useOrg()
  const [project, setProject] = useState(projects[0]?.id ?? '')
  const [kind, setKind] = useState<'Site photo' | 'Drawing' | 'Datasheet'>('Site photo')
  const [error, setError] = useState<string>()
  return (
    <>
      <Panel title="Upload" className="mt-6">
        {projects.length === 0 ? (
          <p className="text-sm text-ink-muted">Uploads attach to a project. You can upload once your first project starts.</p>
        ) : (
          <>
            {error && <div className="mb-4"><Alert tone="bad" title="Not uploaded">{error}</Alert></div>}
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label htmlFor="doc-project" className="block text-sm font-semibold text-ink">Project</label>
                <select id="doc-project" value={project} onChange={(e) => setProject(e.target.value)} className="mt-1.5 min-h-11 w-full rounded-sm border border-rule-strong bg-card px-3">
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="doc-kind" className="block text-sm font-semibold text-ink">Type</label>
                <select id="doc-kind" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className="mt-1.5 min-h-11 w-full rounded-sm border border-rule-strong bg-card px-3">
                  {(['Site photo', 'Drawing', 'Datasheet'] as const).map((k) => <option key={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="doc-file" className="block text-sm font-semibold text-ink">Files</label>
                <input
                  id="doc-file"
                  type="file"
                  multiple
                  onChange={(e) => {
                    const names = Array.from(e.target.files ?? []).map((f) => f.name)
                    e.target.value = ''
                    if (!names.length) return
                    setError(undefined)
                    api.customer.uploadDocs({ org, project, kind, names }).catch((err: unknown) => setError(err instanceof Error ? err.message : 'Try again.'))
                  }}
                  className="mt-1.5 block w-full text-sm text-ink-muted file:mr-3 file:min-h-11 file:rounded-sm file:border file:border-rule-strong file:bg-card file:px-3 file:font-semibold file:text-ink"
                />
              </div>
            </div>
            <p className="mt-3 text-xs text-ink-faint">Uploads attach to the selected project and are visible to you and its engineers. The prototype records file names only.</p>
          </>
        )}
      </Panel>
      <Panel className="mt-6" flush>
        {docs.length === 0 ? (
          <div className="p-5"><EmptyState title="No documents yet" body="Proposals, drawings and reports appear here as your project moves." /></div>
        ) : (
          <DataTable
            caption="Documents"
            rows={docs}
            rowKey={(d) => d.id}
            columns={[
              { key: 'name', label: 'File', render: (d) => <span className="font-medium break-all">{d.name}</span> },
              { key: 'kind', label: 'Type', render: (d) => d.kind },
              { key: 'project', label: 'Project', secondary: true, render: (d) => <span className="font-mono text-xs">{d.project}</span> },
              { key: 'by', label: 'From', secondary: true, render: (d) => (d.by === 'customer' ? 'You' : 'RuralReact') },
              { key: 'at', label: 'Added', align: 'right', render: (d) => formatDate(d.at) },
            ]}
          />
        )}
      </Panel>
    </>
  )
}

function Documents() {
  const { org, email } = useOrg()
  const docs = useQuery(`cust:docs:${email}`, () => api.customer.documents(email, org))
  const projects = useQuery(`cust:projects:${email}`, () => api.customer.projects(email, org))
  return (
    <>
      <PageTitle title="My documents" intro="Proposals, drawings and reports from us, and the files you have shared." />
      <Query q={docs} skeleton={<div className="mt-6"><Panel flush><SkeletonRows rows={4} /></Panel></div>}>
        {(d) => (
          <Query q={projects} skeleton={<div className="mt-6"><Panel flush><SkeletonRows rows={4} /></Panel></div>}>
            {(p) => <DocumentsTable docs={d} projects={p} />}
          </Query>
        )}
      </Query>
    </>
  )
}

function ThreadReply({ rfq }: { rfq: string }) {
  const { name } = useOrg()
  const [reply, setReply] = useState('')
  const [error, setError] = useState<string>()
  return (
    <form
      onSubmit={async (e: FormEvent) => {
        e.preventDefault()
        if (!reply.trim()) return
        try {
          await api.customer.sendUpdate(rfq, name, reply.trim())
          setReply('')
          setError(undefined)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Not sent. Try again.')
        }
      }}
      className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <Field label="Your reply" value={reply} error={error} onChange={(e) => setReply(e.target.value)} />
      </div>
      <button type="submit" className={btn.primary}>Send</button>
    </form>
  )
}

function Discussions() {
  const { org, email } = useOrg()
  const q = useQuery(`cust:threads:${email}`, () => api.customer.threads(email, org))
  return (
    <>
      <PageTitle title="Technical discussions" intro="Questions between you and your engineer, kept with the RFQ they belong to." />
      <div className="mt-6">
        <Query
          q={q}
          skeleton={<Panel><SkeletonRows rows={2} /></Panel>}
          isEmpty={(d) => d.length === 0}
          empty={<Panel><EmptyState title="No discussions yet" body="When your engineer has a question about your requirement, it appears here." /></Panel>}
        >
          {(threads) => (
            <div className="space-y-4">
              {threads.map((t) => (
                <Panel key={t.id} title={t.subject} action={<span className="font-mono text-xs text-ink-faint">{t.rfq}</span>}>
                  <ul className="space-y-3" role="list">
                    {t.messages.map((m, i) => (
                      <li key={i} className={`max-w-[75ch] rounded-md border px-4 py-3 ${m.from === 'customer' ? 'ml-auto border-signal-orange/30 bg-signal-orange/5' : 'border-rule bg-sunk'}`}>
                        <p className="text-xs text-ink-faint">{m.from === 'customer' ? 'You' : 'RuralReact engineer'} · {formatDateTime(m.at)}</p>
                        <p className="mt-1 text-sm text-ink">{m.text}</p>
                      </li>
                    ))}
                  </ul>
                  <ThreadReply rfq={t.rfq} />
                </Panel>
              ))}
            </div>
          )}
        </Query>
      </div>
    </>
  )
}

function Service() {
  const { org, email } = useOrg()
  const { record } = useAuth()
  const q = useQuery(`cust:service:${email}`, () => api.customer.service(email, org))
  const projects = useQuery(`cust:projects:${email}`, () => api.customer.projects(email, org))
  const [project, setProject] = useState('')
  const [summary, setSummary] = useState('')
  const [urgent, setUrgent] = useState(false)
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const list = projects.status === 'success' ? projects.data : []

  return (
    <>
      <PageTitle title="Service requests" intro="Report a fault or ask for a visit on a delivered system." />
      {list.length > 0 && (
        <Panel title="New request" className="mt-6">
          <form
            noValidate
            onSubmit={async (e) => {
              e.preventDefault()
              if (summary.trim().length < 8) return setError('Describe the problem in a sentence, e.g. "Level alarm stays on after tank drains".')
              setError(undefined)
              setBusy(true)
              try {
                await api.customer.raiseService({ org, customerEmail: email, project: project || list[0].id, summary: summary.trim(), priority: urgent ? 'Urgent' : 'Normal' })
                record('Raised a service request')
                setSummary('')
                setUrgent(false)
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Not sent. Try again.')
              } finally {
                setBusy(false)
              }
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="sr-project" className="block text-sm font-semibold text-ink">Project</label>
              <select id="sr-project" value={project || list[0].id} onChange={(e) => setProject(e.target.value)} className="mt-1.5 min-h-11 w-full rounded-sm border border-rule-strong bg-card px-3 text-ink md:w-auto">
                {list.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <Field label="What is happening?" value={summary} onChange={(e) => setSummary(e.target.value)} error={error} />
            <label className="flex min-h-11 items-center gap-3 text-sm text-ink">
              <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} className="size-5 accent-signal-orange" />
              Production is stopped or at risk
            </label>
            <button type="submit" disabled={busy} className={btn.primary}>{busy ? 'Sending…' : 'Raise request'}</button>
          </form>
        </Panel>
      )}
      <Panel className="mt-6" flush>
        <Query
          q={q}
          skeleton={<SkeletonRows rows={2} />}
          isEmpty={(d) => d.length === 0}
          empty={<div className="p-5"><EmptyState title="No service requests" body={list.length ? 'Raise one above if something needs attention.' : 'Service requests open once you have a project with us.'} /></div>}
        >
          {(rows) => (
            <DataTable
              caption="Service requests"
              rows={rows}
              rowKey={(s) => s.id}
              columns={[
                { key: 'id', label: 'Request', render: (s) => <span className="font-mono text-xs font-semibold">{s.id}</span> },
                { key: 'summary', label: 'Summary', render: (s) => s.summary },
                { key: 'priority', label: 'Priority', secondary: true, render: (s) => <Badge tone={s.priority === 'Urgent' ? 'bad' : 'neutral'}>{s.priority}</Badge> },
                { key: 'status', label: 'Status', render: (s) => <Badge tone={s.status === 'Resolved' ? 'good' : s.status === 'Scheduled' ? 'info' : 'warn'}>{s.status}</Badge> },
                { key: 'at', label: 'Raised', align: 'right', secondary: true, render: (s) => formatDate(s.at) },
              ]}
            />
          )}
        </Query>
      </Panel>
    </>
  )
}

function Amc() {
  const q = useQuery('cust:amc', () => api.customer.amc())
  return (
    <>
      <PageTitle title="AMC" intro="Annual maintenance contracts on your delivered systems." />
      <div className="mt-6">
        <Query
          q={q}
          skeleton={<Panel><SkeletonRows rows={1} /></Panel>}
          isEmpty={(d) => d.length === 0}
          empty={<Panel><EmptyState title="No maintenance contract yet" body="An AMC can start once a system is commissioned." /></Panel>}
        >
          {(list) => (
            <div className="space-y-4">
              {list.map((a) => (
                <Panel key={a.id} title={a.id} action={<Badge tone="good">Active</Badge>}>
                  <dl className="grid gap-4 text-sm sm:grid-cols-3">
                    <div><dt className="text-ink-faint">Coverage</dt><dd className="text-ink">{a.coverage}</dd></div>
                    <div><dt className="text-ink-faint">Visits left</dt><dd className="readout font-mono text-ink">{a.visitsLeft}</dd></div>
                    <div><dt className="text-ink-faint">Renews</dt><dd className="text-ink">{formatDate(a.renews)}</dd></div>
                  </dl>
                </Panel>
              ))}
            </div>
          )}
        </Query>
      </div>
    </>
  )
}

function Invoices() {
  const q = useQuery('cust:invoices', () => api.customer.invoices())
  return (
    <>
      <PageTitle title="Invoices" />
      <Panel className="mt-6" flush>
        <Query
          q={q}
          skeleton={<SkeletonRows rows={3} />}
          isEmpty={(d) => d.length === 0}
          empty={<div className="p-5"><EmptyState title="No invoices yet" body="Invoices appear here once billing is connected and your project is invoiced." /></div>}
        >
          {(rows) => (
            <DataTable
              caption="Invoices"
              rows={rows}
              rowKey={(i) => i.id}
              columns={[
                { key: 'id', label: 'Invoice', render: (i) => <span className="font-mono text-xs font-semibold">{i.id}</span> },
                { key: 'project', label: 'Project', secondary: true, render: (i) => <span className="font-mono text-xs">{i.project}</span> },
                { key: 'date', label: 'Date', render: (i) => formatDate(i.at) },
                { key: 'amount', label: 'Amount', align: 'right', render: (i) => <span className="readout font-mono">{formatInr(i.amount)}</span> },
                { key: 'status', label: 'Status', render: (i) => <Badge tone={i.status === 'Paid' ? 'good' : 'warn'}>{i.status}</Badge> },
              ]}
            />
          )}
        </Query>
      </Panel>
    </>
  )
}

/* ------------------------------------------------------------------
   IIoT Dashboard: locked → requested → provisioned (improve.md §5).
   Never shows sample readings. Once provisioned, a widget with no
   data says so.
   ------------------------------------------------------------------ */

const WIDGETS = ['pH', 'Temperature', 'Flow', 'Pressure', 'Level', 'Pump & valve status', 'Energy', 'Alarms']

function IiotLocked() {
  const { org, email } = useOrg()
  const [site, setSite] = useState('')
  const [measures, setMeasures] = useState<string[]>([])
  const [hasGateway, setHasGateway] = useState<IiotRequest['hasGateway']>('unsure')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [busy, setBusy] = useState(false)
  const [apiError, setApiError] = useState<string>()

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next = {
      site: site.trim() ? undefined : 'Name the site or equipment to monitor.',
      measures: measures.length ? undefined : 'Choose at least one thing to monitor.',
    }
    setErrors(next)
    if (Object.values(next).some(Boolean)) return
    setBusy(true)
    setApiError(undefined)
    try {
      await api.customer.requestIiot({ customerEmail: email, organisation: org, site: site.trim(), measures, hasGateway, notes: notes.trim() })
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'The request was not sent.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <Panel>
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-sunk text-ink-muted"><Lock size={20} weight="duotone" aria-hidden="true" /></span>
          <p className="font-semibold text-ink">Locked until your site is connected</p>
        </div>
        <p className="mt-4 text-sm text-ink-muted">
          The IIoT dashboard shows live readings from your own equipment: pH, temperature, flow, pressure, level, pump and valve status,
          energy and alarms, with device health and communication status, and live, 24 hour, 7 day and historical charts.
        </p>
        <p className="mt-3 text-sm text-ink-muted">
          An engineer connects your gateway and confirms data is flowing before the dashboard unlocks. Only your organisation can see its data.
        </p>
      </Panel>
      <Panel title="Request IIoT monitoring">
        <form onSubmit={submit} noValidate className="space-y-5">
          {apiError && <Alert tone="bad" title="Request not sent">{apiError}</Alert>}
          <Field label="Site or equipment" hint="e.g. ETP at Plant 2, dryer line 1" value={site} onChange={(e) => setSite(e.target.value)} error={errors.site} required />
          <fieldset>
            <legend className="text-sm font-semibold text-ink">What should we monitor?</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {IIOT_MEASURES.map((m) => (
                <label key={m} className="flex min-h-11 items-center gap-2.5 rounded-sm border border-rule px-3 text-sm text-ink has-[:checked]:border-signal-orange has-[:checked]:bg-signal-orange/5">
                  <input
                    type="checkbox"
                    checked={measures.includes(m)}
                    onChange={(e) => setMeasures((all) => (e.target.checked ? [...all, m] : all.filter((x) => x !== m)))}
                    className="size-4 accent-signal-orange"
                  />
                  {m}
                </label>
              ))}
            </div>
            {errors.measures && <p className="mt-1.5 text-sm font-medium text-danger">{errors.measures}</p>}
          </fieldset>
          <fieldset>
            <legend className="text-sm font-semibold text-ink">Is there a gateway on site?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(['yes', 'no', 'unsure'] as const).map((v) => (
                <label key={v} className="flex min-h-11 items-center gap-2 rounded-sm border border-rule px-3 text-sm text-ink has-[:checked]:border-signal-orange has-[:checked]:bg-signal-orange/5">
                  <input type="radio" name="gateway" checked={hasGateway === v} onChange={() => setHasGateway(v)} className="accent-signal-orange" />
                  {v === 'yes' ? 'Yes' : v === 'no' ? 'No' : 'Not sure'}
                </label>
              ))}
            </div>
          </fieldset>
          <Field label="Anything else (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <button type="submit" disabled={busy} className={btn.primary}>
            {busy ? 'Sending…' : 'Request IIoT Monitoring'}
          </button>
        </form>
      </Panel>
    </div>
  )
}

function IiotPending({ req }: { req: IiotRequest }) {
  return (
    <Panel>
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone="warn">Requested — Pending Provisioning</Badge>
        <span className="font-mono text-xs text-ink-faint">{req.id}</span>
      </div>
      <p className="mt-4 text-sm text-ink-muted">
        We received your request on {formatDateTime(req.requestedAt)} for <span className="font-semibold text-ink">{req.site}</span>. An engineer will
        connect your gateway and confirm data is flowing. The dashboard unlocks as soon as that is done, and you'll get a notification.
      </p>
      <p className="mt-3 text-sm text-ink-muted"><span className="font-semibold text-ink">Monitoring:</span> {req.measures.join(', ')}</p>
      {req.status === 'failed' && (
        <div className="mt-4">
          <Alert tone="bad" title="Provisioning needs attention">{req.failureReason} Your engineer will contact you.</Alert>
        </div>
      )}
    </Panel>
  )
}

function IiotLive({ req }: { req: IiotRequest }) {
  const [range, setRange] = useState<'Live' | '24 hours' | '7 days' | 'Historical'>('Live')
  const widgets = [...WIDGETS.filter((w) => req.measures.includes(w)), 'Device health']
  return (
    <>
      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 font-semibold text-ink">
              <CheckCircle size={18} weight="duotone" aria-hidden="true" className="text-process-ink" />
              Connected: {req.site}
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              Gateway <span className="font-mono">{req.gatewayId}</span> · {req.devices}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-sm border border-rule bg-sunk px-3 py-2 text-sm">
            <Broadcast size={16} aria-hidden="true" className="text-ink-muted" />
            <span className="text-ink">Communication:</span>
            <span className="font-semibold text-amber-glow">Connecting… waiting for first message</span>
          </div>
        </div>
      </Panel>

      <div role="group" aria-label="Time range" className="mt-6 inline-flex rounded-sm border border-rule bg-sunk p-0.5">
        {(['Live', '24 hours', '7 days', 'Historical'] as const).map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={range === r}
            onClick={() => setRange(r)}
            className={`min-h-9 rounded-sm px-3 text-sm font-semibold ${range === r ? 'bg-card text-ink shadow-(--shadow-e1)' : 'text-ink-muted hoverable:hover:text-ink'}`}
          >
            {r}
          </button>
        ))}
      </div>

      <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="list">
        {widgets.map((w) => (
          <li key={w} className="rounded-lg border border-rule bg-card p-4 shadow-(--shadow-e1)">
            <p className="text-sm font-semibold text-ink">{w}</p>
            <div className="mt-3 flex h-28 items-center justify-center rounded-sm border border-dashed border-rule-strong">
              <p className="text-center text-sm text-ink-muted">
                No data received yet
                <span className="block text-xs text-ink-faint">{range === 'Live' ? 'Readings appear as the gateway reports.' : `No ${range.toLowerCase()} history yet.`}</span>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}

function Iiot() {
  const { email } = useOrg()
  const q = useQuery(`iiot:mine:${email}`, () => api.customer.iiot(email))
  return (
    <>
      <PageTitle title="IIoT Dashboard" intro="Live monitoring for your own site and equipment." />
      <div className="mt-6">
        <Query q={q} skeleton={<Panel><SkeletonRows rows={3} /></Panel>}>
          {(req) =>
            !req ? <IiotLocked /> : req.status === 'provisioned' ? <IiotLive req={req} /> : <IiotPending req={req} />
          }
        </Query>
      </div>
    </>
  )
}

export function CustomerView({ section }: { section: string }) {
  switch (section) {
    case '':
      return <Dashboard />
    case 'rfqs':
      return <Rfqs />
    case 'quotes':
      return <Quotes />
    case 'projects':
      return <Projects />
    case 'documents':
      return <Documents />
    case 'iiot':
      return <Iiot />
    case 'discussions':
      return <Discussions />
    case 'service':
      return <Service />
    case 'amc':
      return <Amc />
    case 'invoices':
      return <Invoices />
    default:
      return null
  }
}
