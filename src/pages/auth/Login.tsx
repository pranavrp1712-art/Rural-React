import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowRight } from '@phosphor-icons/react'
import { AuthShell, CapabilityList } from '../../components/portal/AuthShell'
import { Alert, Field, Spinner } from '../../components/portal/ui'
import { btn } from '../../components/portal/styles'
import {
  demoAccounts,
  isRoleId,
  loginPath,
  portalPath,
  roleOrder,
  roles,
  type RoleId,
} from '../../data/portal'
import { useAuth, type LoginError } from '../../lib/auth'
import { usePageMeta } from '../../lib/usePageMeta'

/* ------------------------------------------------------------------
   /login: pick where you are signing in to.
   ------------------------------------------------------------------ */

function Chooser() {
  const { session } = useAuth()
  usePageMeta({
    title: 'Sign in | RuralReact',
    description: 'Sign in to RuralReact as a customer or a team member.',
    path: '/login',
  })
  return (
    <AuthShell
      eyebrow="Sign in"
      title="Sign in to RuralReact"
      body="Customers track their RFQs and projects. Team members open their own workspace. Each login leads only to its own dashboard."
    >
      {session && (
        <div className="mb-6">
          <Alert tone="info" title={`You're signed in as ${roles[session.role].title}`}>
            <Link to={portalPath(session.role)} className="font-semibold text-ink underline underline-offset-2">
              Go to your dashboard
            </Link>
          </Alert>
        </div>
      )}
      <h2 className="display text-2xl font-semibold text-ink">Choose your sign-in</h2>
      <ul className="mt-5 space-y-2.5" role="list">
        {roleOrder.map((id) => (
          <li key={id}>
            <Link
              to={loginPath(id)}
              className="group flex min-h-16 items-center justify-between gap-4 rounded-md border border-rule bg-card px-4 py-3.5 shadow-(--shadow-e1) transition-[border-color] duration-150 hoverable:hover:border-ink"
            >
              <span className="min-w-0">
                <span className="block font-semibold text-ink">
                  {roles[id].title}
                  {id !== 'customer' && <span className="ml-2 text-xs font-medium text-ink-faint">Team</span>}
                </span>
                <span className="mt-0.5 block text-sm text-ink-muted">{roles[id].summary}</span>
              </span>
              <ArrowRight size={18} aria-hidden="true" className="shrink-0 text-ink-faint transition-transform duration-150 hoverable:group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-ink-muted">
        New customer?{' '}
        <Link to="/signup" className="font-semibold text-signal-ink underline underline-offset-2">
          Create an account
        </Link>
      </p>
    </AuthShell>
  )
}

/* ------------------------------------------------------------------
   /login/:role
   ------------------------------------------------------------------ */

function errorCopy(error: LoginError, email: string, attemptsLeft?: number) {
  switch (error.kind) {
    case 'invalid':
      return {
        title: "That email and password don't match",
        body:
          attemptsLeft !== undefined && attemptsLeft <= 3
            ? `Check both and try again. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} left before the account locks.`
            : 'Check both and try again.',
      }
    case 'locked':
      return {
        title: 'This account is locked',
        body: 'Too many failed attempts. Reset your password to unlock it, or ask your administrator.',
        link: { to: `/forgot-password?email=${encodeURIComponent(email)}`, label: 'Reset password' },
      }
    case 'unverified':
      return {
        title: 'Confirm your email first',
        body: `Open the link we sent to ${email} to activate the account.`,
        link: { to: `/verify-email?email=${encodeURIComponent(email)}`, label: 'Resend verification email' },
      }
    case 'wrong-role':
      return {
        title: 'This account signs in somewhere else',
        body: `It signs in at the ${roles[error.accountRole].title} login.`,
        link: { to: loginPath(error.accountRole), label: `Go to ${roles[error.accountRole].title} sign-in` },
      }
  }
}

function RoleLogin({ role }: { role: RoleId }) {
  const def = roles[role]
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [error, setError] = useState<ReturnType<typeof errorCopy> | null>(null)
  const [busy, setBusy] = useState(false)
  const errorRef = useRef<HTMLDivElement>(null)

  usePageMeta({
    title: `${def.title} sign-in | RuralReact`,
    description: `Sign in to the RuralReact ${def.title.toLowerCase()} workspace.`,
    path: loginPath(role),
  })

  const flash = (location.state as { notice?: string } | null)?.notice
  const next = params.get('next')
  // Only this role's portal, or back to the RFQ summary the customer came from.
  const destination = next && (next.startsWith(portalPath(role)) || (role === 'customer' && next === '/rfq')) ? next : portalPath(role)

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  // Already signed in to this role: skip the form.
  if (auth.session?.role === role) return <Navigate to={destination} replace />

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const errs: typeof fieldErrors = {}
    if (!email.trim()) errs.email = 'Enter the email you sign in with.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'That email address is not complete.'
    if (!password) errs.password = 'Enter your password.'
    setFieldErrors(errs)
    setError(null)
    if (Object.keys(errs).length) return

    setBusy(true)
    // A short wait so the loading state is real, as it will be against a server.
    window.setTimeout(() => {
      const result = auth.beginLogin(email, password, role)
      setBusy(false)
      if (!result.ok) {
        setError(errorCopy(result.error, email.trim(), result.attemptsLeft))
        return
      }
      navigate(destination, { replace: true })
    }, 450)
  }

  const demos = demoAccounts.filter((a) => a.role === role)

  return (
    <AuthShell
      eyebrow={`${def.title} sign-in`}
      title={def.id === 'customer' ? 'Your RFQs and projects, in one place' : `${def.title} workspace`}
      body={`After sign-in: ${def.landing}`}
      aside={<CapabilityList items={def.can.slice(0, 5)} />}
    >
      <Link to="/login" className="text-sm font-medium text-ink-muted underline-offset-2 hoverable:hover:text-ink hoverable:hover:underline">
        ← All sign-in options
      </Link>

      {auth.session && auth.session.role !== role && (
        <div className="mt-5">
          <Alert tone="warn" title={`You're signed in as ${roles[auth.session.role].title}`}>
            Sign out first to use a {def.title} account.{' '}
            <button type="button" onClick={auth.logout} className="font-semibold text-ink underline underline-offset-2">
              Sign out
            </button>
          </Alert>
        </div>
      )}

        <form onSubmit={submit} noValidate className="mt-6 space-y-5">
          <div>
            <h2 className="display text-3xl font-semibold text-ink">Sign in</h2>
            <p className="mt-1 text-sm text-ink-muted">{def.title}</p>
          </div>

          {flash && <Alert tone="good" title={flash} />}

          {error && (
            <div ref={errorRef} tabIndex={-1} className="outline-none">
              <Alert tone="bad" title={error.title}>
                {error.body}{' '}
                {error.link && (
                  <Link to={error.link.to} className="font-semibold text-ink underline underline-offset-2">
                    {error.link.label}
                  </Link>
                )}
              </Alert>
            </div>
          )}

          <Field
            label="Email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
          />
          <div>
            <Field
              label="Password"
              password
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
            />
            <div className="mt-2 text-right">
              <Link
                to={`/forgot-password?role=${role}${email ? `&email=${encodeURIComponent(email)}` : ''}`}
                className="text-sm font-medium text-signal-ink underline-offset-2 hoverable:hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <button type="submit" disabled={busy} className={`${btn.primary} w-full`}>
            {busy && <Spinner />}
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          {def.selfSignup && (
            <p className="text-center text-sm text-ink-muted">
              No account yet?{' '}
              <Link to="/signup" className="font-semibold text-signal-ink underline underline-offset-2">
                Create one
              </Link>
            </p>
          )}
        </form>

        <details className="mt-8 rounded-md border border-dashed border-rule-strong bg-card" open>
          <summary className="flex min-h-11 items-center px-4 text-sm font-semibold text-ink">Demo accounts</summary>
          <div className="border-t border-rule px-4 py-3">
            <p className="text-xs text-ink-muted">
              Prototype only. Password for every demo account:{' '}
              <span className="font-mono text-ink">{demos[0]?.password}</span>
            </p>
            <ul className="mt-2 divide-y divide-rule" role="list">
              {demos.map((a) => (
                <li key={a.email} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-xs text-ink">{a.email}</span>
                    <span className="text-xs text-ink-faint">
                      {a.state === 'active' ? a.name : a.state === 'locked' ? 'Shows the locked state' : 'Shows the unverified state'}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(a.email)
                      setPassword(a.password)
                      setError(null)
                      setFieldErrors({})
                    }}
                    className={btn.ghost}
                  >
                    Use
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </details>
    </AuthShell>
  )
}

export default function Login() {
  const { role } = useParams()
  if (role === undefined) return <Chooser />
  if (!isRoleId(role)) return <Navigate to="/login" replace />
  return <RoleLogin role={role} key={role} />
}
