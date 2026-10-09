import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Badge, DataTable, EmptyState, Field, PageTitle, Panel } from '../../components/portal/ui'
import { btn, type Tone } from '../../components/portal/styles'
import { roles, type RoleId } from '../../data/portal'
import { DAY, formatDate, formatDateTime, relativeDue, startOfToday, type Task } from '../../data/portalTypes'
import { Query, SkeletonRows } from '../../components/portal/Query'
import { api } from '../../lib/api'
import { useAuth, type LoginResult } from '../../lib/auth'
import { useQuery } from '../../lib/useQuery'

/* Shared by every role (md/login.md §1): tasks, notifications,
   activity log, login history, profile and security. */

function Tasks() {
  const { session } = useAuth()
  const email = session?.email ?? ''
  const q = useQuery(`tasks:${email}`, () => api.tasks(email))
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  const add = async (e: FormEvent) => {
    e.preventDefault()
    if (title.trim().length < 3) return setError('Describe the task in a few words.')
    setError(undefined)
    setBusy(true)
    try {
      await api.addTask(email, title, due ? new Date(`${due}T00:00`).getTime() : startOfToday() + DAY)
      setTitle('')
      setDue('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Not saved. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageTitle title="Tasks" intro="Your own to-do list. Tick a task off when it is done." />
      <Panel title="Add a task" className="mt-6">
        <form onSubmit={add} noValidate className="grid items-start gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
          <Field label="Task" value={title} onChange={(e) => setTitle(e.target.value)} error={error} />
          <Field label="Due" type="date" hint="Tomorrow if left blank." value={due} onChange={(e) => setDue(e.target.value)} />
          <button type="submit" disabled={busy} className={`${btn.primary} md:mt-7`}>{busy ? 'Adding…' : 'Add task'}</button>
        </form>
      </Panel>
      <Panel className="mt-6" flush>
        <Query
          q={q}
          skeleton={<SkeletonRows rows={3} />}
          isEmpty={(d) => d.length === 0}
          empty={<div className="p-5"><EmptyState title="No tasks yet" body="Add one above. Tasks are private to your account." /></div>}
        >
          {(tasks) => <TaskList tasks={tasks} />}
        </Query>
      </Panel>
    </>
  )
}

function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <>
      <p className="sr-only" aria-live="polite">{tasks.filter((t) => !t.done).length} open tasks</p>
      <ul className="divide-y divide-rule" role="list">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-start gap-3 px-5 py-3.5">
            <input
              id={`task-${t.id}`}
              type="checkbox"
              checked={t.done}
              onChange={() => api.toggleTask(t.id)}
              className="mt-1 size-5 shrink-0 accent-signal-orange"
            />
            <label htmlFor={`task-${t.id}`} className="min-w-0 flex-1 cursor-pointer">
              <span className={`block text-sm font-medium ${t.done ? 'text-ink-faint line-through' : 'text-ink'}`}>{t.title}</span>
              <span className="text-xs text-ink-faint">Due {formatDate(t.due)}</span>
            </label>
            {!t.done && <Badge tone={relativeDue(t.due).includes('overdue') ? 'bad' : 'neutral'}>{relativeDue(t.due)}</Badge>}
          </li>
        ))}
      </ul>
    </>
  )
}

const kindTone: Record<string, Tone> = { alert: 'bad', action: 'warn', info: 'info' }
const kindLabel: Record<string, string> = { alert: 'Alert', action: 'Needs action', info: 'Info' }

function Notifications({ role }: { role: RoleId }) {
  const { session } = useAuth()
  const email = session?.email ?? ''
  const q = useQuery(`notifications:${role}:${email}`, () => api.notifications(role, email))
  const unread = q.status === 'success' ? q.data.filter((n) => n.unread) : []
  return (
    <>
      <PageTitle
        title="Notifications"
        intro={q.status === 'success' ? (unread.length ? `${unread.length} unread.` : 'All caught up.') : undefined}
        actions={
          unread.length > 0 && (
            <button type="button" className={btn.secondary} onClick={() => api.markRead(email, unread.map((n) => n.id))}>
              Mark all as read
            </button>
          )
        }
      />
      <Panel className="mt-6" flush>
        <Query
          q={q}
          skeleton={<SkeletonRows rows={4} />}
          isEmpty={(d) => d.length === 0}
          empty={<div className="p-5"><EmptyState title="No notifications yet" body="You'll be notified here when something needs your attention." /></div>}
        >
          {(items) => (
            <ul className="divide-y divide-rule" role="list">
              {items.map((n) => (
                <li key={n.id} className={`flex items-start gap-3 px-5 py-4 ${n.unread ? 'bg-signal-orange/5' : ''}`}>
                  <span aria-hidden="true" className={`mt-2 size-2 shrink-0 rounded-full ${n.unread ? 'bg-signal-orange' : 'bg-transparent'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">
                      {n.title}
                      {n.unread && <span className="sr-only"> (unread)</span>}
                    </p>
                    <p className="text-sm text-ink-muted">{n.body}</p>
                    <p className="mt-1 text-xs text-ink-faint">{formatDateTime(n.at)}</p>
                  </div>
                  <Badge tone={kindTone[n.kind]}>{kindLabel[n.kind]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Query>
      </Panel>
    </>
  )
}

function Activity() {
  const { audit, session } = useAuth()
  const rows = audit().filter((e) => e.actor === session?.email)
  return (
    <>
      <PageTitle title="Activity log" intro="Everything this account has done, newest first." />
      <Panel className="mt-6" flush>
        <DataTable
          caption="Your activity"
          rows={rows}
          rowKey={(r) => r.id}
          empty="No activity recorded yet."
          columns={[
            { key: 'when', label: 'When', render: (r) => <span className="whitespace-nowrap">{formatDateTime(r.at)}</span> },
            { key: 'action', label: 'Action', render: (r) => r.action },
            { key: 'session', label: 'Session', secondary: true, render: (r) => <span className="font-mono text-xs text-ink-muted">{r.sessionId ?? '—'}</span> },
          ]}
        />
      </Panel>
    </>
  )
}

const resultBadge: Record<LoginResult, [Tone, string]> = {
  success: ['good', 'Signed in'],
  failed: ['bad', 'Wrong password'],
  locked: ['bad', 'Blocked: locked'],
  unverified: ['warn', 'Email not confirmed'],
  'signed-out': ['neutral', 'Signed out'],
}

function Logins() {
  const { history, session, logoutAll } = useAuth()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)
  const rows = history()

  return (
    <>
      <PageTitle title="Login history" intro="Sign-ins and failed attempts on this account, newest first." />

      <Panel title="Current session" className="mt-6">
        {session && (
          <dl className="grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-ink-faint">Signed in</dt>
              <dd className="font-medium text-ink">{formatDateTime(session.startedAt)}</dd>
            </div>
            <div>
              <dt className="text-ink-faint">Last active</dt>
              <dd className="font-medium text-ink">{formatDateTime(session.lastActive)}</dd>
            </div>
            <div>
              <dt className="text-ink-faint">Session ID</dt>
              <dd className="font-mono text-ink">{session.id}</dd>
            </div>
          </dl>
        )}
        <div className="mt-5 border-t border-rule pt-5">
          {confirming ? (
            <div className="space-y-3">
              <Alert tone="warn" title="Sign out everywhere?">
                Every session on this account ends, including this one. You will need to sign in again.
              </Alert>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={btn.danger}
                  onClick={() => {
                    logoutAll()
                    navigate('/login', { replace: true })
                  }}
                >
                  Yes, sign out of all sessions
                </button>
                <button type="button" className={btn.ghost} onClick={() => setConfirming(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className={btn.secondary} onClick={() => setConfirming(true)}>
              Sign out of all sessions
            </button>
          )}
        </div>
      </Panel>

      <Panel title="History" className="mt-6" flush>
        <DataTable
          caption="Login history"
          rows={rows}
          rowKey={(r) => r.id}
          empty="No sign-ins recorded yet."
          columns={[
            { key: 'when', label: 'When', render: (r) => <span className="whitespace-nowrap">{formatDateTime(r.at)}</span> },
            {
              key: 'result',
              label: 'Result',
              render: (r) => (
                <span className="flex flex-wrap gap-1.5">
                  <Badge tone={resultBadge[r.result][0]}>{resultBadge[r.result][1]}</Badge>
                  {r.newDevice && <Badge tone="warn">New device · alert emailed</Badge>}
                </span>
              ),
            },
            { key: 'device', label: 'Device', secondary: true, render: (r) => r.device },
          ]}
        />
      </Panel>
    </>
  )
}

function Profile({ role }: { role: RoleId }) {
  const { session } = useAuth()
  const def = roles[role]
  const [saved, setSaved] = useState(false)
  const [name, setName] = useState(session?.name ?? '')
  const [digest, setDigest] = useState(true)
  return (
    <>
      <PageTitle title="Profile" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Panel title="Your details">
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault()
              setSaved(true)
            }}
          >
            {saved && <Alert tone="good" title="Profile saved" />}
            <Field label="Name" value={name} onChange={(e) => { setName(e.target.value); setSaved(false) }} autoComplete="name" />
            <Field label="Email" value={session?.email ?? ''} readOnly hint="Your sign-in email. Ask an administrator to change it." />
            <Field label="Organisation" value={session?.organisation ?? ''} readOnly />
            <label className="flex min-h-11 items-center gap-3 text-sm text-ink">
              <input type="checkbox" checked={digest} onChange={(e) => { setDigest(e.target.checked); setSaved(false) }} className="size-5 accent-signal-orange" />
              Email me a daily digest of notifications
            </label>
            <button type="submit" className={btn.primary}>Save profile</button>
          </form>
        </Panel>
        <Panel title="Your access">
          <p className="text-sm font-semibold text-ink">{def.title}</p>
          <ul className="mt-3 space-y-2" role="list">
            {def.can.map((c) => (
              <li key={c} className="flex gap-2 text-sm text-ink-muted">
                <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-process-green" /> {c}
              </li>
            ))}
          </ul>
          {def.cannot.length > 0 && (
            <>
              <p className="mt-5 text-sm font-semibold text-ink">Not available to this role</p>
              <ul className="mt-2 space-y-2" role="list">
                {def.cannot.map((c) => (
                  <li key={c} className="flex gap-2 text-sm text-ink-muted">
                    <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-rule-strong" /> {c}
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>
      </div>
    </>
  )
}

function Security() {
  const { changePassword } = useAuth()
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [done, setDone] = useState(false)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next = {
      current: form.current ? undefined : 'Enter your current password.',
      next:
        form.next.length < 10 || !/[a-z]/i.test(form.next) || !/\d/.test(form.next)
          ? 'At least 10 characters, with a letter and a number.'
          : undefined,
      confirm: form.confirm === form.next && form.confirm ? undefined : 'The two passwords do not match.',
    }
    setErrors(next)
    setDone(false)
    if (Object.values(next).some(Boolean)) return
    if (!changePassword(form.current, form.next)) {
      setErrors({ current: 'That is not your current password.' })
      return
    }
    setForm({ current: '', next: '', confirm: '' })
    setDone(true)
  }

  return (
    <>
      <PageTitle title="Password & security" />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Change password">
          <form onSubmit={submit} noValidate className="space-y-5">
            {done && <Alert tone="good" title="Password changed">Use the new password next time you sign in.</Alert>}
            <Field label="Current password" password autoComplete="current-password" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} error={errors.current} />
            <Field label="New password" password autoComplete="new-password" hint="At least 10 characters, with a letter and a number." value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} error={errors.next} />
            <Field label="Confirm new password" password autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} error={errors.confirm} />
            <button type="submit" className={btn.primary}>Change password</button>
          </form>
        </Panel>
        <Panel title="Sign-in protection">
          <ul className="space-y-4" role="list">
            <li className="flex items-start justify-between gap-4">
              <span>
                <span className="block text-sm font-semibold text-ink">Account lockout</span>
                <span className="block text-sm text-ink-muted">Five failed attempts lock the account until the password is reset.</span>
              </span>
              <Badge tone="good">On</Badge>
            </li>
            <li className="flex items-start justify-between gap-4">
              <span>
                <span className="block text-sm font-semibold text-ink">New device alerts</span>
                <span className="block text-sm text-ink-muted">A sign-in from a device this account hasn't used sends an email to you.</span>
              </span>
              <Badge tone="good">On</Badge>
            </li>
            <li className="flex items-start justify-between gap-4">
              <span>
                <span className="block text-sm font-semibold text-ink">Sign-in attempt limits</span>
                <span className="block text-sm text-ink-muted">Repeated attempts are slowed down by the server.</span>
              </span>
              <Badge tone="neutral">Needs backend</Badge>
            </li>
          </ul>
          <p className="mt-5 border-t border-rule pt-4 text-xs text-ink-faint">
            Sign-in is a single step: email and password. There is no one-time code.
          </p>
        </Panel>
      </div>
    </>
  )
}

export function AccountView({ role, section }: { role: RoleId; section: string }) {
  switch (section) {
    case 'tasks':
      return <Tasks />
    case 'notifications':
      return <Notifications role={role} />
    case 'activity':
      return <Activity />
    case 'logins':
      return <Logins />
    case 'profile':
      return <Profile role={role} />
    case 'security':
      return <Security />
    default:
      return null
  }
}
