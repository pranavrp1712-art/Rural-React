import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthShell, CapabilityList, EmailPreview } from '../../components/portal/AuthShell'
import { Alert, Field, Spinner } from '../../components/portal/ui'
import { btn } from '../../components/portal/styles'
import { isRoleId, loginPath, roles } from '../../data/portal'
import { useAuth } from '../../lib/auth'
import { usePageMeta } from '../../lib/usePageMeta'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Shared password rule, stated up front rather than discovered on error. */
const PASSWORD_HINT = 'At least 10 characters, with a letter and a number.'
const passwordProblem = (value: string) =>
  value.length < 10 || !/[a-z]/i.test(value) || !/\d/.test(value) ? PASSWORD_HINT : undefined

type Errors = Record<string, string | undefined>

/** After a failed submit, focus the summary so the errors are read out. */
function ErrorSummary({ errors }: { errors: Errors }) {
  const ref = useRef<HTMLDivElement>(null)
  const list = Object.values(errors).filter(Boolean) as string[]
  useEffect(() => {
    if (list.length) ref.current?.focus()
  }, [list.length])
  if (!list.length) return null
  return (
    <div ref={ref} tabIndex={-1} className="outline-none">
      <Alert tone="bad" title={`Fix ${list.length === 1 ? 'this' : `these ${list.length}`} to continue`}>
        <ul className="list-disc pl-4">
          {list.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </Alert>
    </div>
  )
}

/* ------------------------------------------------------------------
   /signup — customers only
   ------------------------------------------------------------------ */

export function Signup() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', organisation: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)

  usePageMeta({
    title: 'Create a customer account | RuralReact',
    description: 'Create a RuralReact customer account to track your RFQs, quotations and projects.',
    path: '/signup',
  })

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const next: Errors = {
      name: form.name.trim() ? undefined : 'Enter your name.',
      organisation: form.organisation.trim() ? undefined : 'Enter your company or organisation.',
      email: !form.email.trim()
        ? 'Enter your work email.'
        : EMAIL_RE.test(form.email.trim())
          ? undefined
          : 'That email address is not complete.',
      password: passwordProblem(form.password),
      confirm: form.confirm && form.confirm === form.password ? undefined : 'The two passwords do not match.',
    }
    setErrors(next)
    if (Object.values(next).some(Boolean)) return

    setBusy(true)
    window.setTimeout(() => {
      const result = auth.signup(form)
      setBusy(false)
      if (result === 'exists') {
        setErrors({ email: 'An account already uses this email. Sign in, or reset the password.' })
        return
      }
      navigate(`/verify-email?email=${encodeURIComponent(form.email.trim().toLowerCase())}`)
    }, 500)
  }

  return (
    <AuthShell
      eyebrow="Customer account"
      title="Track every RFQ and project in one place"
      body="Create an account with your work email. We send a link to confirm it before the account opens."
      aside={<CapabilityList items={roles.customer.can} />}
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        <div>
          <h2 className="display text-3xl font-semibold text-ink">Create your account</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Already registered?{' '}
            <Link to={loginPath('customer')} className="font-semibold text-signal-ink underline underline-offset-2">
              Sign in
            </Link>
          </p>
        </div>
        <ErrorSummary errors={errors} />
        <Field label="Your name" autoComplete="name" required value={form.name} onChange={set('name')} error={errors.name} />
        <Field
          label="Company or organisation"
          autoComplete="organization"
          required
          value={form.organisation}
          onChange={set('organisation')}
          error={errors.organisation}
        />
        <Field
          label="Work email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={set('email')}
          error={errors.email}
        />
        <Field
          label="Password"
          password
          autoComplete="new-password"
          required
          hint={PASSWORD_HINT}
          value={form.password}
          onChange={set('password')}
          error={errors.password}
        />
        <Field
          label="Confirm password"
          password
          autoComplete="new-password"
          required
          value={form.confirm}
          onChange={set('confirm')}
          error={errors.confirm}
        />
        <button type="submit" disabled={busy} className={`${btn.primary} w-full`}>
          {busy && <Spinner />}
          {busy ? 'Creating account…' : 'Create account'}
        </button>
        <p className="text-xs text-ink-faint">
          Your account only ever shows your own RFQs, quotations and documents.
        </p>
      </form>
    </AuthShell>
  )
}

/* ------------------------------------------------------------------
   /verify-email?email=…[&token=…]
   ------------------------------------------------------------------ */

export function VerifyEmail() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const email = params.get('email') ?? ''
  const [resent, setResent] = useState(false)

  usePageMeta({ title: 'Confirm your email | RuralReact', description: 'Confirm your email address.', path: '/verify-email' })

  const confirm = () => {
    if (auth.verifyEmail(email)) {
      navigate(loginPath('customer'), { state: { notice: 'Email confirmed. Sign in to open your account.' } })
    }
  }

  const known = email && auth.accountState(email) !== null

  return (
    <AuthShell eyebrow="Customer account" title="One step left" body="Confirming your email keeps other people from opening an account in your name.">
      <h2 className="display text-3xl font-semibold text-ink">Check your inbox</h2>
      {known ? (
        <>
          <p className="mt-2 text-base text-ink-muted">
            We sent a confirmation link to <span className="font-medium text-ink">{email}</span>. It expires in 24 hours.
          </p>
          {resent && (
            <div className="mt-4">
              <Alert tone="good" title="Sent again">Allow a minute, and check the spam folder.</Alert>
            </div>
          )}
          <EmailPreview templateId="verify-email" />
          <div className="mt-6 space-y-3 border-t border-rule pt-6">
            <p className="text-sm text-ink-muted">
              <span className="font-semibold text-ink">Demo:</span> there is no inbox, so confirm here instead of clicking the link.
            </p>
            <button type="button" onClick={confirm} className={`${btn.primary} w-full`}>
              Confirm my email (demo)
            </button>
            <button type="button" onClick={() => setResent(true)} className={`${btn.secondary} w-full`}>
              Resend the email
            </button>
          </div>
        </>
      ) : (
        <div className="mt-4">
          <Alert tone="warn" title="We couldn't find that sign-up">
            The link may be incomplete.{' '}
            <Link to="/signup" className="font-semibold text-ink underline underline-offset-2">
              Create an account
            </Link>
          </Alert>
        </div>
      )}
    </AuthShell>
  )
}

/* ------------------------------------------------------------------
   /forgot-password — the answer is the same whether or not the email
   has an account, so the form cannot be used to find accounts.
   ------------------------------------------------------------------ */

export function ForgotPassword() {
  const [params] = useSearchParams()
  const roleParam = params.get('role') ?? undefined
  const role = isRoleId(roleParam) ? roleParam : 'customer'
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [error, setError] = useState<string>()
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  usePageMeta({ title: 'Reset your password | RuralReact', description: 'Reset your RuralReact password.', path: '/forgot-password' })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!EMAIL_RE.test(email.trim())) {
      setError(email.trim() ? 'That email address is not complete.' : 'Enter the email you sign in with.')
      return
    }
    setError(undefined)
    setBusy(true)
    window.setTimeout(() => {
      setBusy(false)
      setSent(true)
    }, 500)
  }

  return (
    <AuthShell eyebrow="Password reset" title="Get back into your account" body="Resetting the password signs out every other session on the account.">
      <Link to={loginPath(role)} className="text-sm font-medium text-ink-muted hoverable:hover:text-ink hoverable:hover:underline">
        ← Back to sign in
      </Link>
      {sent ? (
        <div className="mt-6">
          <h2 className="display text-3xl font-semibold text-ink">Check your inbox</h2>
          <p className="mt-2 text-base text-ink-muted">
            If an account exists for <span className="font-medium text-ink">{email.trim()}</span>, a reset link is on its way.
            It expires in 30 minutes.
          </p>
          <EmailPreview templateId="password-reset" />
          <div className="mt-6 border-t border-rule pt-6">
            <Link
              to={`/reset-password?email=${encodeURIComponent(email.trim())}&role=${role}`}
              className={`${btn.primary} w-full`}
            >
              Open the reset link (demo)
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="mt-6 space-y-5">
          <div>
            <h2 className="display text-3xl font-semibold text-ink">Forgot your password?</h2>
            <p className="mt-1 text-sm text-ink-muted">Enter your email and we'll send a link to choose a new one.</p>
          </div>
          <Field
            label="Email"
            type="email"
            autoComplete="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
          />
          <button type="submit" disabled={busy} className={`${btn.primary} w-full`}>
            {busy && <Spinner />}
            {busy ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthShell>
  )
}

/* ------------------------------------------------------------------
   /reset-password?email=…
   ------------------------------------------------------------------ */

export function ResetPassword() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const email = params.get('email') ?? ''
  const roleParam = params.get('role') ?? undefined
  const role = isRoleId(roleParam) ? roleParam : 'customer'
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Errors>({})

  usePageMeta({ title: 'Choose a new password | RuralReact', description: 'Choose a new password.', path: '/reset-password' })

  const valid = email && auth.accountState(email) !== null

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const next: Errors = {
      password: passwordProblem(password),
      confirm: confirm && confirm === password ? undefined : 'The two passwords do not match.',
    }
    setErrors(next)
    if (Object.values(next).some(Boolean)) return
    auth.resetPassword(email, password)
    navigate(loginPath(role), { state: { notice: 'Password changed. Sign in with the new one.' } })
  }

  return (
    <AuthShell eyebrow="Password reset" title="Choose a new password" body="The new password works straight away. Any other session on the account is signed out.">
      {valid ? (
        <form onSubmit={submit} noValidate className="space-y-5">
          <div>
            <h2 className="display text-3xl font-semibold text-ink">New password</h2>
            <p className="mt-1 text-sm text-ink-muted">For {email}</p>
          </div>
          <ErrorSummary errors={errors} />
          <Field
            label="New password"
            password
            autoComplete="new-password"
            required
            hint={PASSWORD_HINT}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <Field
            label="Confirm new password"
            password
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={errors.confirm}
          />
          <button type="submit" className={`${btn.primary} w-full`}>
            Save new password
          </button>
        </form>
      ) : (
        <Alert tone="bad" title="This reset link is not valid">
          It may have expired or already been used.{' '}
          <Link to="/forgot-password" className="font-semibold text-ink underline underline-offset-2">
            Request a new link
          </Link>
        </Alert>
      )}
    </AuthShell>
  )
}
