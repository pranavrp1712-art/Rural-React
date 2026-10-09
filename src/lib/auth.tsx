/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  LOCKOUT_AFTER,
  demoAccounts,
  type AccountState,
  type DemoAccount,
  type RoleId,
} from '../data/portal'

/**
 * Demo authentication for the portal prototype.
 *
 * Everything lives in the browser: the session in sessionStorage, the
 * login history, audit log, sign ups and password changes in
 * localStorage. That is enough to exercise every screen and state in
 * md/login.md, and it is NOT security. A real deployment replaces this
 * provider with calls to an auth server; the screens do not change.
 */

export interface Session {
  id: string
  email: string
  name: string
  organisation: string
  role: RoleId
  startedAt: number
  lastActive: number
}

export type LoginResult = 'success' | 'failed' | 'locked' | 'unverified' | 'signed-out'

export interface LoginEvent {
  id: string
  email: string
  role: RoleId
  at: number
  result: LoginResult
  device: string
  sessionId?: string
  /** First sign-in from this device: a new-device alert email is sent. */
  newDevice?: boolean
}

export interface AuditEvent {
  id: string
  at: number
  actor: string
  role: RoleId
  action: string
  sessionId?: string
}

export type LoginError =
  | { kind: 'invalid' }
  | { kind: 'locked' }
  | { kind: 'unverified' }
  | { kind: 'wrong-role'; accountRole: RoleId }

export type BeginLogin = { ok: true } | { ok: false; error: LoginError; attemptsLeft?: number }

/* ------------------------------------------------------------------
   Storage. Every read and write is guarded: private windows and
   blocked site data must degrade to "signed out", never to a crash.
   ------------------------------------------------------------------ */

const memory = new Map<string, string>()

function read<T>(store: 'local' | 'session', key: string, fallback: T): T {
  try {
    const raw = (store === 'local' ? localStorage : sessionStorage).getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    const raw = memory.get(`${store}:${key}`)
    return raw ? (JSON.parse(raw) as T) : fallback
  }
}

function write(store: 'local' | 'session', key: string, value: unknown) {
  const raw = JSON.stringify(value)
  try {
    ;(store === 'local' ? localStorage : sessionStorage).setItem(key, raw)
  } catch {
    memory.set(`${store}:${key}`, raw)
  }
}

function remove(store: 'local' | 'session', key: string) {
  try {
    ;(store === 'local' ? localStorage : sessionStorage).removeItem(key)
  } catch {
    memory.delete(`${store}:${key}`)
  }
}

const KEY = {
  session: 'rr-demo-session',
  history: 'rr-demo-logins',
  audit: 'rr-demo-audit',
  accounts: 'rr-demo-accounts',
  failures: 'rr-demo-failures',
  revoked: 'rr-demo-revoked-before',
}

const uid = () => Math.random().toString(36).slice(2, 10)

/** A readable device label from the user agent, for login history. */
export function deviceLabel(): string {
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /Chrome\//.test(ua)
      ? 'Chrome'
      : /Firefox\//.test(ua)
        ? 'Firefox'
        : /Safari\//.test(ua)
          ? 'Safari'
          : 'Browser'
  const os = /Windows/.test(ua)
    ? 'Windows'
    : /Android/.test(ua)
      ? 'Android'
      : /iPhone|iPad/.test(ua)
        ? 'iOS'
        : /Mac OS/.test(ua)
          ? 'macOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : 'Unknown OS'
  return `${browser} on ${os}`
}

/** The demo sign-ins, overlaid with sign ups, invitations and changes. */
export function allAccounts(): DemoAccount[] {
  const stored = read<DemoAccount[]>('local', KEY.accounts, [])
  const byEmail = new Map(demoAccounts.map((a) => [a.email, a]))
  stored.forEach((a) => byEmail.set(a.email, a))
  return [...byEmail.values()]
}

export function saveAccount(account: DemoAccount) {
  const stored = read<DemoAccount[]>('local', KEY.accounts, []).filter((a) => a.email !== account.email)
  write('local', KEY.accounts, [...stored, account])
}

const normalise = (email: string) => email.trim().toLowerCase()

/** When each account last signed in, from the login history. */
export function lastSignIns(): Record<string, number> {
  const out: Record<string, number> = {}
  for (const e of read<LoginEvent[]>('local', KEY.history, [])) {
    if (e.result === 'success' && !(e.email in out)) out[e.email] = e.at
  }
  return out
}

/* ------------------------------------------------------------------
   Provider
   ------------------------------------------------------------------ */

interface AuthApi {
  session: Session | null
  /** Single step: email and password. There is no second factor (improve.md §1). */
  beginLogin: (email: string, password: string, role: RoleId) => BeginLogin
  logout: () => void
  logoutAll: () => void
  touch: () => void
  signup: (input: { name: string; email: string; organisation: string; password: string }) => 'ok' | 'exists'
  verifyEmail: (email: string) => boolean
  resetPassword: (email: string, password: string) => boolean
  changePassword: (current: string, next: string) => boolean
  accountState: (email: string) => AccountState | null
  history: () => LoginEvent[]
  audit: () => AuditEvent[]
  record: (action: string) => void
}

const AuthContext = createContext<AuthApi | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    const stored = read<Session | null>('session', KEY.session, null)
    const revokedBefore = read<number>('local', KEY.revoked, 0)
    return stored && stored.startedAt > revokedBefore ? stored : null
  })

  const logEvent = useCallback((event: Omit<LoginEvent, 'id' | 'at' | 'device' | 'newDevice'>) => {
    const list = read<LoginEvent[]>('local', KEY.history, [])
    const device = deviceLabel()
    // A successful sign-in from a device this account has not used
    // before triggers the new-device alert email (email template
    // "suspicious-login"). The first ever sign-in is not "new".
    const priorSuccess = list.filter((e) => e.email === event.email && e.result === 'success')
    const newDevice = event.result === 'success' && priorSuccess.length > 0 && !priorSuccess.some((e) => e.device === device)
    write('local', KEY.history, [{ ...event, id: uid(), at: Date.now(), device, newDevice }, ...list].slice(0, 200))
  }, [])

  const logAudit = useCallback((event: Omit<AuditEvent, 'id' | 'at'>) => {
    const list = read<AuditEvent[]>('local', KEY.audit, [])
    write('local', KEY.audit, [{ ...event, id: uid(), at: Date.now() }, ...list].slice(0, 500))
  }, [])

  const openSession = useCallback(
    (account: DemoAccount) => {
      const next: Session = {
        id: uid(),
        email: account.email,
        name: account.name,
        organisation: account.organisation,
        role: account.role,
        startedAt: Date.now(),
        lastActive: Date.now(),
      }
      write('session', KEY.session, next)
      setSession(next)
      logEvent({ email: account.email, role: account.role, result: 'success', sessionId: next.id })
      logAudit({ actor: account.email, role: account.role, action: 'Signed in', sessionId: next.id })
    },
    [logAudit, logEvent],
  )

  const beginLogin = useCallback<AuthApi['beginLogin']>(
    (rawEmail, password, role) => {
      const email = normalise(rawEmail)
      const account = allAccounts().find((a) => a.email === email)
      const failures = read<Record<string, number>>('local', KEY.failures, {})

      // Same message whether the email exists or not, so the form
      // cannot be used to discover accounts.
      // An invitation has no password until it is accepted.
      if (!account || account.state === 'invited') return { ok: false, error: { kind: 'invalid' } }

      if (account.state === 'locked' || account.state === 'disabled' || (failures[email] ?? 0) >= LOCKOUT_AFTER) {
        logEvent({ email, role: account.role, result: 'locked' })
        return { ok: false, error: { kind: 'locked' } }
      }

      if (account.password !== password) {
        const count = (failures[email] ?? 0) + 1
        write('local', KEY.failures, { ...failures, [email]: count })
        logEvent({ email, role: account.role, result: 'failed' })
        if (count >= LOCKOUT_AFTER) return { ok: false, error: { kind: 'locked' } }
        return { ok: false, error: { kind: 'invalid' }, attemptsLeft: LOCKOUT_AFTER - count }
      }

      if (account.state === 'unverified') {
        logEvent({ email, role: account.role, result: 'unverified' })
        return { ok: false, error: { kind: 'unverified' } }
      }

      if (account.role !== role) {
        return { ok: false, error: { kind: 'wrong-role', accountRole: account.role } }
      }

      write('local', KEY.failures, { ...failures, [email]: 0 })
      openSession(account)
      return { ok: true }
    },
    [logEvent, openSession],
  )

  const logout = useCallback(() => {
    if (session) {
      logEvent({ email: session.email, role: session.role, result: 'signed-out', sessionId: session.id })
      logAudit({ actor: session.email, role: session.role, action: 'Signed out', sessionId: session.id })
    }
    remove('session', KEY.session)
    setSession(null)
  }, [logAudit, logEvent, session])

  const logoutAll = useCallback(() => {
    // Any session that started before this moment is no longer valid,
    // including ones held in other tabs.
    write('local', KEY.revoked, Date.now())
    if (session) {
      logAudit({ actor: session.email, role: session.role, action: 'Signed out of all sessions', sessionId: session.id })
    }
    remove('session', KEY.session)
    setSession(null)
  }, [logAudit, session])

  const touch = useCallback(() => {
    setSession((current) => {
      if (!current) return current
      const next = { ...current, lastActive: Date.now() }
      write('session', KEY.session, next)
      return next
    })
  }, [])

  const signup = useCallback<AuthApi['signup']>((input) => {
    const email = normalise(input.email)
    if (allAccounts().some((a) => a.email === email)) return 'exists'
    saveAccount({
      email,
      password: input.password,
      role: 'customer',
      name: input.name.trim(),
      organisation: input.organisation.trim(),
      state: 'unverified',
    })
    return 'ok'
  }, [])

  const verifyEmail = useCallback((rawEmail: string) => {
    const account = allAccounts().find((a) => a.email === normalise(rawEmail))
    if (!account) return false
    saveAccount({ ...account, state: 'active' })
    return true
  }, [])

  const resetPassword = useCallback((rawEmail: string, password: string) => {
    const email = normalise(rawEmail)
    const account = allAccounts().find((a) => a.email === email)
    if (!account) return false
    saveAccount({ ...account, password, state: account.state === 'locked' ? 'active' : account.state })
    const failures = read<Record<string, number>>('local', KEY.failures, {})
    write('local', KEY.failures, { ...failures, [email]: 0 })
    return true
  }, [])

  const changePassword = useCallback(
    (current: string, next: string) => {
      if (!session) return false
      const account = allAccounts().find((a) => a.email === session.email)
      if (!account || account.password !== current) return false
      saveAccount({ ...account, password: next })
      logAudit({ actor: session.email, role: session.role, action: 'Changed password', sessionId: session.id })
      return true
    },
    [logAudit, session],
  )

  const accountState = useCallback((rawEmail: string) => {
    const account = allAccounts().find((a) => a.email === normalise(rawEmail))
    return account ? account.state : null
  }, [])

  const history = useCallback(() => {
    const list = read<LoginEvent[]>('local', KEY.history, [])
    return session ? list.filter((e) => e.email === session.email) : []
  }, [session])

  const audit = useCallback(() => read<AuditEvent[]>('local', KEY.audit, []), [])

  const record = useCallback(
    (action: string) => {
      if (session) logAudit({ actor: session.email, role: session.role, action, sessionId: session.id })
    },
    [logAudit, session],
  )

  const api = useMemo<AuthApi>(
    () => ({
      session,
      beginLogin,
      logout,
      logoutAll,
      touch,
      signup,
      verifyEmail,
      resetPassword,
      changePassword,
      accountState,
      history,
      audit,
      record,
    }),
    [session, beginLogin, logout, logoutAll, touch, signup, verifyEmail, resetPassword, changePassword, accountState, history, audit, record],
  )

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthApi {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
