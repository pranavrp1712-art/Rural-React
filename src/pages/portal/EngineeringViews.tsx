import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Query, SkeletonKpis, SkeletonRows } from '../../components/portal/Query'
import { RfqTable } from '../../components/portal/RfqTable'
import { btn, stageTone, type Tone } from '../../components/portal/styles'
import { Alert, Badge, DataTable, EmptyState, Field, PageTitle, Panel } from '../../components/portal/ui'
import { portalPath } from '../../data/portal'
import { DAY, formatDate, formatDateTime, relativeDue, startOfToday, type BomLine, type Rfq, type Thread, type WorkItem, type WorkStatus, type WorkType } from '../../data/portalTypes'
import { api, type IiotRequest } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { useQuery } from '../../lib/useQuery'

const workTone: Record<WorkStatus, Tone> = { 'To do': 'neutral', 'In progress': 'info', Blocked: 'bad', Done: 'good' }

function MyRfqs() {
  const { session } = useAuth()
  const email = session?.email ?? ''
  const rfqs = useQuery(`eng:mine:${email}`, () => api.engineering.myRfqs(email))
  const summary = useQuery(`eng:summary:${email}`, () => api.engineering.summary(email))

  const tiles =
    summary.status === 'success'
      ? [
          { label: 'Unassigned RFQs in the queue', count: summary.data.queue, to: 'queue' },
          { label: 'Technical reviews open', count: summary.data.reviews, to: 'reviews' },
          { label: 'Customer replies unread', count: summary.data.replies, to: 'notifications' },
          { label: 'IIoT dashboard requests', count: summary.data.iiot, to: 'iiot-requests' },
        ]
      : null

  return (
    <>
      <PageTitle
        title="My assigned RFQs"
        intro="Your personal worklist. Pick up new RFQs from the engineering queue."
        actions={<Link to={portalPath('engineering', 'queue')} className={btn.secondary}>Engineering queue</Link>}
      />
      <div className="mt-6">
        {tiles ? (
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4" role="list">
            {tiles.map((b) => (
              <li key={b.label}>
                <Link
                  to={portalPath('engineering', b.to)}
                  className="flex min-h-16 items-center justify-between gap-3 rounded-lg border border-rule bg-card px-4 py-3 shadow-(--shadow-e1) transition-[border-color] duration-150 hoverable:hover:border-ink"
                >
                  <span className="text-sm font-medium text-ink">{b.label}</span>
                  <span className={`readout rounded-sm px-2 py-0.5 font-mono text-sm font-semibold ${b.count ? 'bg-signal-orange text-on-signal' : 'bg-sunk text-ink-muted'}`}>
                    {b.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : summary.status === 'error' ? null : (
          <SkeletonKpis />
        )}
      </div>
      <Panel title="Assigned to you" className="mt-6" flush>
        <Query q={rfqs} skeleton={<SkeletonRows />}>
          {(rows) => (
            <RfqTable
              rows={rows}
              linkBase={portalPath('engineering', 'rfq')}
              empty="Nothing is assigned to you yet. Open an RFQ from the engineering queue and choose Assign to me."
            />
          )}
        </Query>
      </Panel>
      <Panel title="Hand-offs from the requirement assistant" className="mt-6">
        <EmptyState
          title="No hand-offs"
          body="When an AI-assisted requirement is sent to the technical team it arrives here with the transcript, extracted requirements, missing information, preliminary BOM and I/O estimate. The assistant is not connected yet."
        />
      </Panel>
    </>
  )
}

function Queue() {
  const q = useQuery('eng:queue', () => api.engineering.queue())
  return (
    <>
      <PageTitle title="Engineering queue" intro="Every RFQ across the team. Open an unassigned one to pick it up." />
      <Panel className="mt-6" flush>
        <Query
          q={q}
          skeleton={<SkeletonRows />}
          isEmpty={(d) => d.length === 0}
          empty={<div className="p-5"><EmptyState title="The queue is empty" body="RFQs arrive here when a customer submits one from the website or their portal." /></div>}
        >
          {(rows) => <RfqTable rows={rows} linkBase={portalPath('engineering', 'rfq')} />}
        </Query>
      </Panel>
    </>
  )
}

/* ------------------------------------------------------------------
   RFQ detail. Editable by the assigned engineer; read-only for other
   engineers until they pick it up, and for Super Admin drilling in.
   ------------------------------------------------------------------ */

const CARD = { di: 16, do: 16, ai: 8, ao: 4 } as const
const IO_LABEL = { di: 'Digital inputs', do: 'Digital outputs', ai: 'Analog inputs', ao: 'Analog outputs' } as const

export function RfqDetail({ id, readOnly = false, backTo }: { id: string; readOnly?: boolean; backTo: { to: string; label: string } }) {
  const q = useQuery(`eng:rfq:${id}`, () => api.engineering.rfq(id))
  return (
    <>
      <Link to={backTo.to} className="text-sm font-medium text-ink-muted hoverable:hover:text-ink hoverable:hover:underline">
        ← {backTo.label}
      </Link>
      <div className="mt-3">
        <Query
          q={q}
          skeleton={<SkeletonRows rows={6} />}
          isEmpty={(d) => d === null}
          empty={<EmptyState title="RFQ not found" body="It may have been removed." />}
        >
          {(d) => <RfqEditor key={d!.rfq.id} data={d!} readOnly={readOnly} />}
        </Query>
      </div>
    </>
  )
}

type RfqData = { rfq: Rfq; thread: Thread | null; work: WorkItem[] }

/** One in-flight write at a time, with its error kept for the alert. */
function useAction() {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string>()
  const run = async (name: string, fn: () => Promise<unknown>) => {
    setBusy(name)
    setError(undefined)
    try {
      await fn()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Not saved. Try again.')
      return false
    } finally {
      setBusy(null)
    }
  }
  return { busy, error, run }
}

function RfqEditor({ data, readOnly }: { data: RfqData; readOnly: boolean }) {
  const { rfq, thread, work } = data
  const { session, record } = useAuth()
  const me = session?.email ?? ''
  const mine = rfq.assignee === me
  const [io, setIo] = useState(rfq.io)
  const [bom, setBom] = useState<BomLine[]>(rfq.bom)
  const [dirty, setDirty] = useState(false)
  const [note, setNote] = useState('')
  const [question, setQuestion] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [saved, setSaved] = useState<string>()
  const { busy, error, run } = useAction()
  const submitted = rfq.stage === 'Approval pending' || rfq.stage === 'Quoted'
  const locked = readOnly || !mine || submitted

  const act = async (name: string, fn: () => Promise<unknown>, audit: string, message?: string) => {
    if (!(await run(name, fn))) return false
    record(audit)
    setSaved(message)
    return true
  }

  const editBom = (i: number, patch: Partial<BomLine>) => {
    setBom((b) => b.map((x, j) => (j === i ? { ...x, ...patch } : x)))
    setDirty(true)
  }

  return (
    <>
      <PageTitle
        title={rfq.id}
        intro={`${rfq.scope} · ${rfq.customer} · ${rfq.industry}. Received ${formatDateTime(rfq.at)} via ${rfq.via.toLowerCase()}.`}
        actions={<Badge tone={stageTone[rfq.stage]}>{rfq.stage}</Badge>}
      />
      <div className="mt-4 space-y-3">
        {error && <Alert tone="bad" title="Not saved">{error}</Alert>}
        {saved && <Alert tone="good" title={saved} />}
        {readOnly ? (
          <Alert tone="info" title="Read-only view">You're viewing this RFQ from the Super Admin engineering overview.</Alert>
        ) : !rfq.assignee ? (
          <Alert tone="warn" title="Nobody has picked this RFQ up yet">
            <button
              type="button"
              disabled={busy !== null}
              className={`${btn.primary} mt-2`}
              onClick={() => act('assign', () => api.engineering.assign(rfq.id, me), `Assigned ${rfq.id} to self`, `${rfq.id} is now assigned to you`)}
            >
              {busy === 'assign' ? 'Assigning…' : 'Assign to me'}
            </button>
          </Alert>
        ) : !mine ? (
          <Alert tone="info" title={`Assigned to ${rfq.assignee}`}>Only the assigned engineer can edit it.</Alert>
        ) : submitted ? null : (
          <Alert tone="warn" title="Preliminary configuration — not engineering approved">
            Values below are editable until you submit for technical owner approval.
          </Alert>
        )}
      </div>

      <Panel title="Customer requirement" className="mt-6">
        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          <div><dt className="text-ink-faint">Contact</dt><dd className="text-ink">{rfq.contact || '—'}</dd></div>
          <div><dt className="text-ink-faint">Email</dt><dd className="font-mono text-xs break-all text-ink">{rfq.customerEmail}</dd></div>
          <div><dt className="text-ink-faint">Due</dt><dd className="text-ink">{formatDate(rfq.due)}</dd></div>
        </dl>
        {rfq.details && <p className="mt-4 text-sm whitespace-pre-line text-ink-muted">{rfq.details}</p>}
      </Panel>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="I/O calculation">
          <DataTable
            caption="I/O calculation"
            rows={(Object.keys(io) as (keyof typeof io)[]).map((k) => ({ k }))}
            rowKey={(r) => r.k}
            columns={[
              { key: 'type', label: 'Signal', render: ({ k }) => IO_LABEL[k] },
              {
                key: 'count',
                label: 'Points',
                render: ({ k }) => (
                  <input
                    type="number"
                    min={0}
                    aria-label={`${IO_LABEL[k]} points`}
                    disabled={locked}
                    value={io[k]}
                    onChange={(e) => {
                      setIo({ ...io, [k]: Math.max(0, Number(e.target.value) || 0) })
                      setDirty(true)
                    }}
                    className="min-h-10 w-20 rounded-sm border border-rule-strong bg-card px-2 font-mono text-sm disabled:bg-sunk"
                  />
                ),
              },
              { key: 'spare', label: '+20% spare', align: 'right', render: ({ k }) => <span className="readout font-mono">{Math.ceil(io[k] * 1.2)}</span> },
              { key: 'cards', label: 'Cards', align: 'right', render: ({ k }) => <span className="readout font-mono">{Math.ceil(Math.ceil(io[k] * 1.2) / CARD[k])} × {CARD[k]} ch</span> },
            ]}
          />
        </Panel>

        <Panel title="Bill of materials" action={<span className="text-xs text-ink-faint">No prices at engineering stage</span>}>
          {bom.length === 0 && <p className="text-sm text-ink-muted">No lines yet.{locked ? '' : ' Add the first one below.'}</p>}
          <ul className="divide-y divide-rule" role="list">
            {bom.map((line, i) => (
              <li key={i} className="flex items-start gap-3 py-2.5 first:pt-0">
                <input
                  type="number"
                  min={0}
                  aria-label={`Quantity for line ${i + 1}`}
                  disabled={locked}
                  value={line.qty}
                  onChange={(e) => editBom(i, { qty: Math.max(0, Number(e.target.value) || 0) })}
                  className="min-h-10 w-16 shrink-0 rounded-sm border border-rule-strong bg-card px-2 font-mono text-sm disabled:bg-sunk"
                />
                <span className="min-w-0 flex-1 space-y-1.5">
                  <input
                    aria-label={`Item for line ${i + 1}`}
                    disabled={locked}
                    value={line.item}
                    placeholder="Item"
                    onChange={(e) => editBom(i, { item: e.target.value })}
                    className="block min-h-10 w-full rounded-sm border border-rule-strong bg-card px-2 text-sm font-medium text-ink disabled:border-transparent disabled:bg-transparent disabled:px-0"
                  />
                  <input
                    aria-label={`Basis for line ${i + 1}`}
                    disabled={locked}
                    value={line.basis}
                    placeholder="Why this quantity"
                    onChange={(e) => editBom(i, { basis: e.target.value })}
                    className="block min-h-9 w-full rounded-sm border border-rule bg-card px-2 text-xs text-ink-muted disabled:border-transparent disabled:bg-transparent disabled:px-0"
                  />
                </span>
              </li>
            ))}
          </ul>
          {!locked && (
            <button
              type="button"
              className={`${btn.ghost} mt-3`}
              onClick={() => {
                setBom((b) => [...b, { item: '', qty: 1, basis: '' }])
                setDirty(true)
              }}
            >
              + Add line
            </button>
          )}
        </Panel>
      </div>

      {!locked && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={!dirty || busy !== null}
            className={btn.primary}
            onClick={async () => {
              const clean = bom.filter((l) => l.item.trim())
              if (await act('config', () => api.engineering.saveConfig(rfq.id, io, clean), `Saved I/O and BOM on ${rfq.id}`, 'Configuration saved')) {
                setBom(clean)
                setDirty(false)
              }
            }}
          >
            {busy === 'config' ? 'Saving…' : 'Save configuration'}
          </button>
          <span className="text-sm text-ink-faint" aria-live="polite">{dirty ? 'Unsaved changes' : ''}</span>
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Missing information & customer questions">
          {rfq.missing.length > 0 ? (
            <ol className="list-decimal space-y-1 pl-5 text-sm text-ink" role="list">
              {rfq.missing.map((m) => <li key={m}>{m}</li>)}
            </ol>
          ) : (
            <p className="text-sm text-ink-muted">Nothing marked as missing.</p>
          )}
          {thread && thread.messages.length > 0 && (
            <ul className="mt-4 space-y-2" role="list">
              {thread.messages.map((m, i) => (
                <li key={i} className={`rounded-sm border px-3 py-2 text-sm text-ink ${m.from === 'customer' ? 'border-signal-orange/30 bg-signal-orange/5' : 'border-rule bg-sunk'}`}>
                  <span className="block text-xs text-ink-faint">{m.from === 'customer' ? 'Customer' : 'Sent to customer'} · {formatDateTime(m.at)}</span>
                  {m.text}
                </li>
              ))}
            </ul>
          )}
          {!locked && (
            <form
              onSubmit={async (e: FormEvent) => {
                e.preventDefault()
                if (!question.trim()) return
                if (await act('ask', () => api.engineering.ask(rfq.id, me, question.trim()), `Asked customer a question on ${rfq.id}`, 'Question sent to the customer')) setQuestion('')
              }}
              className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
            >
              <div className="flex-1">
                <Field label="Ask the customer" value={question} onChange={(e) => setQuestion(e.target.value)} />
              </div>
              <button type="submit" disabled={busy !== null} className={btn.secondary}>{busy === 'ask' ? 'Sending…' : 'Send question'}</button>
            </form>
          )}
        </Panel>

        <Panel title="Technical notes, drawings & datasheets">
          {rfq.notes.length > 0 ? (
            <ul className="mb-4 space-y-2" role="list">
              {rfq.notes.map((n, i) => (
                <li key={i} className="border-l-2 border-rule-strong pl-3 text-sm text-ink">
                  {n.text}
                  <span className="block text-xs text-ink-faint">{n.by} · {formatDateTime(n.at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-4 text-sm text-ink-muted">No notes yet.</p>
          )}
          {rfq.files.length > 0 && (
            <ul className="mb-4 space-y-1 font-mono text-xs text-ink" role="list">
              {rfq.files.map((f, i) => <li key={`${f}-${i}`}>{f}</li>)}
            </ul>
          )}
          {!locked && (
            <>
              <form
                onSubmit={async (e: FormEvent) => {
                  e.preventDefault()
                  if (!note.trim()) return
                  if (await act('note', () => api.engineering.addNote(rfq.id, me, note.trim()), `Added technical note on ${rfq.id}`)) setNote('')
                }}
                className="flex flex-col gap-3 sm:flex-row sm:items-end"
              >
                <div className="flex-1">
                  <Field label="Add a technical note" value={note} onChange={(e) => setNote(e.target.value)} />
                </div>
                <button type="submit" disabled={busy !== null} className={btn.secondary}>Add note</button>
              </form>
              <div className="mt-5 border-t border-rule pt-5">
                <label htmlFor="eng-upload" className="block text-sm font-semibold text-ink">Upload drawings or datasheets</label>
                <p className="text-xs text-ink-faint">PDF, DWG or images. The prototype records file names only.</p>
                <input
                  id="eng-upload"
                  type="file"
                  multiple
                  onChange={(e) => {
                    const names = Array.from(e.target.files ?? []).map((f) => f.name)
                    e.target.value = ''
                    if (names.length) act('files', () => api.engineering.addFiles(rfq.id, names), `Uploaded ${names.length} file(s) to ${rfq.id}`)
                  }}
                  className="mt-2 block w-full text-sm text-ink-muted file:mr-3 file:min-h-10 file:rounded-sm file:border file:border-rule-strong file:bg-card file:px-3 file:font-semibold file:text-ink"
                />
              </div>
            </>
          )}
        </Panel>
      </div>

      <WorkPanel rfq={rfq} work={work} editable={!readOnly && mine} />

      {!readOnly && mine && (
        <Panel title="Submit" className="mt-6">
          {submitted ? (
            <Alert tone="good" title={rfq.stage === 'Quoted' ? 'Quotation issued' : 'Submitted for technical owner approval'}>
              {rfq.stage === 'Quoted'
                ? 'The commercial team has sent the quotation to the customer.'
                : 'The configuration is locked while it is reviewed. The commercial quotation is prepared after approval.'}
            </Alert>
          ) : confirming ? (
            <div className="space-y-3">
              <p className="text-sm text-ink-muted">
                Submitting locks the I/O and BOM while the technical owner reviews them.{dirty ? ' Save your configuration first.' : ''}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={dirty || busy !== null}
                  className={btn.primary}
                  onClick={async () => {
                    if (await act('submit', () => api.engineering.submit(rfq.id, me), `Submitted ${rfq.id} for technical owner approval`)) setConfirming(false)
                  }}
                >
                  {busy === 'submit' ? 'Submitting…' : 'Submit for approval'}
                </button>
                <button type="button" className={btn.ghost} onClick={() => setConfirming(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="max-w-[60ch] text-sm text-ink-muted">Engineering cannot approve the final commercial quotation or change company pricing.</p>
              <button type="button" className={btn.primary} onClick={() => setConfirming(true)}>
                Submit for technical owner approval
              </button>
            </div>
          )}
        </Panel>
      )}
    </>
  )
}

function WorkPanel({ rfq, work, editable }: { rfq: Rfq; work: WorkItem[]; editable: boolean }) {
  const { session, record } = useAuth()
  const [form, setForm] = useState({ type: 'io' as WorkType, title: '', due: '' })
  const [error, setError] = useState<string>()
  const { busy, error: apiError, run } = useAction()

  const add = async (e: FormEvent) => {
    e.preventDefault()
    if (form.title.trim().length < 3) return setError('Describe the work in a few words.')
    setError(undefined)
    const due = form.due ? new Date(`${form.due}T00:00`).getTime() : startOfToday() + DAY * 3
    if (await run('work', () => api.engineering.addWork({ rfq: rfq.id, type: form.type, title: form.title.trim(), due, by: session?.email ?? '' }))) {
      record(`Added a ${workTitle[form.type][0]} item on ${rfq.id}`)
      setForm({ ...form, title: '', due: '' })
    }
  }

  return (
    <Panel title="Work items" className="mt-6" flush>
      {editable && (
        <form onSubmit={add} noValidate className="grid items-start gap-4 border-b border-rule p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)_auto]">
          <div>
            <label htmlFor="work-type" className="block text-sm font-semibold text-ink">Type</label>
            <select
              id="work-type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as WorkType })}
              className="mt-1.5 min-h-11 w-full rounded-sm border border-rule-strong bg-card px-3 text-ink"
            >
              {(Object.keys(workTitle) as WorkType[]).map((t) => <option key={t} value={t}>{workTitle[t][0]}</option>)}
            </select>
          </div>
          <Field label="Work item" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} error={error ?? apiError} />
          <Field label="Due" type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} />
          <button type="submit" disabled={busy !== null} className={`${btn.secondary} md:mt-7`}>{busy ? 'Adding…' : 'Add'}</button>
        </form>
      )}
      <WorkTable rows={work} editable={editable} />
    </Panel>
  )
}

/* ------------------------------------------------------------------
   IIoT requests (improve.md §3, §5): fulfil a customer's request by
   connecting their gateway and confirming data flows, which flips the
   IIoT access on for that customer's account.
   ------------------------------------------------------------------ */

const iiotTone: Record<IiotRequest['status'], [Tone, string]> = {
  requested: ['warn', 'Pending provisioning'],
  provisioned: ['good', 'Provisioned'],
  failed: ['bad', 'Needs attention'],
}

function ProvisionForm({ req }: { req: IiotRequest }) {
  const { session, record } = useAuth()
  const [gatewayId, setGatewayId] = useState('')
  const [devices, setDevices] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [busy, setBusy] = useState<'provision' | 'fail' | null>(null)
  const [reason, setReason] = useState('')
  const [failing, setFailing] = useState(false)
  const [apiError, setApiError] = useState<string>()

  const provision = async (e: FormEvent) => {
    e.preventDefault()
    const next = {
      gatewayId: gatewayId.trim() ? undefined : 'Enter the gateway ID you commissioned.',
      devices: devices.trim() ? undefined : 'List the connected devices or tags.',
      confirmed: confirmed ? undefined : 'Confirm the data pipeline before unlocking the customer.',
    }
    setErrors(next)
    if (Object.values(next).some(Boolean)) return
    setBusy('provision')
    setApiError(undefined)
    try {
      await api.engineering.provision(req.id, { gatewayId: gatewayId.trim(), devices: devices.trim(), engineer: session?.email ?? '' })
      record(`Provisioned IIoT dashboard for ${req.organisation} (${req.id})`)
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Provisioning failed.')
    } finally {
      setBusy(null)
    }
  }

  const markFailed = async () => {
    if (!reason.trim()) return setErrors({ reason: 'Say what is blocking the connection, so the customer is told.' })
    setBusy('fail')
    try {
      await api.engineering.failProvision(req.id, reason.trim())
      record(`Marked IIoT request ${req.id} as needing attention`)
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Update failed.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <form onSubmit={provision} noValidate className="mt-4 space-y-4 border-t border-rule pt-4">
      {apiError && <Alert tone="bad" title="Not saved">{apiError}</Alert>}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Gateway ID" hint="As labelled on the commissioned gateway." value={gatewayId} onChange={(e) => setGatewayId(e.target.value)} error={errors.gatewayId} />
        <Field label="Connected devices / tags" hint="e.g. AIT-101 pH, FIT-102 flow, P-01 pump" value={devices} onChange={(e) => setDevices(e.target.value)} error={errors.devices} />
      </div>
      <label className="flex min-h-11 items-start gap-3 text-sm text-ink">
        <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1 size-5 accent-signal-orange" />
        <span>
          I have confirmed the gateway publishes outbound only and the data pipeline for this customer's account is receiving messages.
          {errors.confirmed && <span className="mt-1 block font-medium text-danger">{errors.confirmed}</span>}
        </span>
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy !== null} className={btn.primary}>
          {busy === 'provision' ? 'Provisioning…' : 'Provision and unlock for customer'}
        </button>
        <button type="button" className={btn.ghost} onClick={() => setFailing((v) => !v)}>
          Can't connect yet
        </button>
      </div>
      {failing && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Field label="What is blocking the connection?" value={reason} onChange={(e) => setReason(e.target.value)} error={errors.reason} />
          </div>
          <button type="button" disabled={busy !== null} onClick={markFailed} className={btn.secondary}>
            {busy === 'fail' ? 'Saving…' : 'Mark as needs attention'}
          </button>
        </div>
      )}
    </form>
  )
}

function IiotRequests() {
  const q = useQuery('iiot:requests', () => api.engineering.iiotRequests())
  return (
    <>
      <PageTitle title="IIoT dashboard requests" intro="Customers who asked for live monitoring. Provisioning connects their gateway and unlocks the IIoT dashboard on their account." />
      <div className="mt-6">
        <Query
          q={q}
          skeleton={<Panel flush><SkeletonRows rows={3} /></Panel>}
          isEmpty={(d) => d.length === 0}
          empty={<Panel><EmptyState title="No IIoT requests yet" body="When a customer requests IIoT monitoring from their dashboard, it appears here for provisioning." /></Panel>}
        >
          {(list) => (
            <div className="space-y-4">
              {list.map((r) => (
                <Panel key={r.id} title={`${r.organisation} · ${r.site}`} action={<Badge tone={iiotTone[r.status][0]}>{iiotTone[r.status][1]}</Badge>}>
                  <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <div><dt className="text-ink-faint">Request</dt><dd className="font-mono text-xs text-ink">{r.id}</dd></div>
                    <div><dt className="text-ink-faint">Requested</dt><dd className="text-ink">{formatDateTime(r.requestedAt)}</dd></div>
                    <div><dt className="text-ink-faint">Gateway on site</dt><dd className="text-ink">{r.hasGateway === 'yes' ? 'Yes' : r.hasGateway === 'no' ? 'No, needs one' : 'Not sure'}</dd></div>
                    <div><dt className="text-ink-faint">Customer</dt><dd className="truncate font-mono text-xs text-ink">{r.customerEmail}</dd></div>
                  </dl>
                  <p className="mt-3 text-sm text-ink-muted"><span className="font-semibold text-ink">Monitor:</span> {r.measures.join(', ')}</p>
                  {r.notes && <p className="mt-1 text-sm text-ink-muted"><span className="font-semibold text-ink">Notes:</span> {r.notes}</p>}
                  {r.status === 'provisioned' ? (
                    <p className="mt-3 text-sm text-process-ink">
                      Provisioned {r.provisionedAt ? formatDateTime(r.provisionedAt) : ''} · gateway <span className="font-mono">{r.gatewayId}</span> · {r.devices}
                    </p>
                  ) : (
                    <>
                      {r.status === 'failed' && <p className="mt-3 text-sm text-danger">Needs attention: {r.failureReason}</p>}
                      <ProvisionForm req={r} />
                    </>
                  )}
                </Panel>
              ))}
            </div>
          )}
        </Query>
      </div>
    </>
  )
}

const workTitle: Record<WorkType, [string, string]> = {
  reviews: ['Technical reviews', 'Reviews waiting on you before an RFQ can move on.'],
  io: ['I/O calculations', 'Signal schedules being sized for each RFQ.'],
  panel: ['Panel design', 'General arrangement and enclosure work.'],
  drawings: ['Engineering drawings', 'Schematics and GA drawings by revision.'],
  programming: ['PLC, HMI & SCADA', 'Programming tasks across controllers, operator screens and supervisory systems.'],
  configuration: ['Sensor, gateway & IIoT', 'Instrument ranges, gateway uplinks and IIoT rules.'],
  testing: ['Testing & FAT', 'Point-to-point checks and factory acceptance tests.'],
  site: ['Installation & commissioning', 'Site work, loop checks and handover.'],
}

export function WorkTable({ rows, rfqBase, editable = false }: { rows: WorkItem[]; rfqBase?: string; editable?: boolean }) {
  return (
    <DataTable
      caption="Work items"
      rows={rows}
      rowKey={(w) => w.id}
      empty="No work items yet."
      columns={[
        { key: 'task', label: 'Task', render: (w) => (<><span className="block font-medium">{w.title}</span><span className="text-xs text-ink-faint">{workTitle[w.type][0]}</span></>) },
        {
          key: 'rfq',
          label: 'RFQ',
          render: (w) =>
            rfqBase ? (
              <Link to={`${rfqBase}/${w.rfq}`} className="font-mono text-xs font-semibold text-signal-ink hoverable:hover:underline">{w.rfq}</Link>
            ) : (
              <span className="font-mono text-xs">{w.rfq}</span>
            ),
        },
        {
          key: 'status',
          label: 'Status',
          render: (w) =>
            editable ? (
              <select
                aria-label={`Status of ${w.title}`}
                value={w.status}
                onChange={(e) => api.engineering.setWorkStatus(w.id, e.target.value as WorkStatus)}
                className="min-h-10 rounded-sm border border-rule-strong bg-card px-2 text-sm text-ink"
              >
                {(Object.keys(workTone) as WorkStatus[]).map((s) => <option key={s}>{s}</option>)}
              </select>
            ) : (
              <Badge tone={workTone[w.status]}>{w.status}</Badge>
            ),
        },
        { key: 'due', label: 'Due', align: 'right', render: (w) => <span className="whitespace-nowrap">{w.status === 'Done' ? formatDate(w.due) : relativeDue(w.due)}</span> },
      ]}
    />
  )
}

function WorkList({ type }: { type: WorkType }) {
  const [title, intro] = workTitle[type]
  const q = useQuery(`eng:work:${type}`, () => api.engineering.work(type))
  return (
    <>
      <PageTitle title={title} intro={intro} />
      <Panel className="mt-6" flush>
        <Query
          q={q}
          skeleton={<SkeletonRows />}
          isEmpty={(d) => d.length === 0}
          empty={<div className="p-5"><EmptyState title="Nothing in this list" body="Add work items from an RFQ assigned to you; items of this type appear here." /></div>}
        >
          {(rows) => <WorkTable rows={rows} rfqBase={portalPath('engineering', 'rfq')} editable />}
        </Query>
      </Panel>
    </>
  )
}

export function EngineeringView({ section, id }: { section: string; id?: string }) {
  if (section === '') return <MyRfqs />
  if (section === 'queue') return <Queue />
  if (section === 'iiot-requests') return <IiotRequests />
  if (section === 'rfq' && id) return <RfqDetail id={id} backTo={{ to: portalPath('engineering', 'queue'), label: 'Engineering queue' }} />
  if (section in workTitle) return <WorkList type={section as WorkType} />
  return null
}
