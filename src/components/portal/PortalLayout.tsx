import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  CaretDoubleLeft,
  CaretDoubleRight,
  CaretDown,
  List,
  MagnifyingGlass,
  ShieldCheck,
  SignOut,
  User,
  X,
} from '@phosphor-icons/react'
import { accountNav, portalPath, roles, sectionsFor, type RoleId } from '../../data/portal'
import { formatDateTime } from '../../data/portalTypes'
import { api, type SearchResult } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { useQuery } from '../../lib/useQuery'
import { ThemeToggle } from '../ThemeToggle'

/**
 * The signed-in shell (md/improve.md §1C). One typed per-role nav
 * config drives the sidebar, the search scope and the route guard.
 * Badge counts and the IIoT state come from the data layer, never
 * from literals in the config.
 */

const COLLAPSE_KEY = 'rr-sidebar'

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === 'collapsed'
  } catch {
    return false
  }
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

const iiotPill = {
  locked: { label: 'Locked', full: 'Locked. Request IIoT monitoring to unlock.' },
  requested: { label: 'Requested', full: 'Requested — Pending Provisioning' },
  provisioned: { label: 'Live', full: 'Provisioned and live' },
  failed: { label: 'Attention', full: 'Provisioning needs attention' },
} as const

/* ------------------------------------------------------------------
   Sidebar
   ------------------------------------------------------------------ */

function Sidebar({
  role,
  collapsed,
  onToggleCollapse,
  onNavigate,
}: {
  role: RoleId
  collapsed: boolean
  onToggleCollapse?: () => void
  onNavigate?: () => void
}) {
  const def = roles[role]
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  const email = session?.email ?? ''
  const org = session?.organisation ?? ''
  const badges = useQuery(`badges:${role}:${email}`, () => api.badges(role, email, org))
  const iiot = useQuery(`iiot:state:${email}`, () => (role === 'customer' ? api.iiotState(email) : Promise.resolve(null)))
  const groups = [...def.nav, accountNav]
  // Collapsed-rail tooltip. Fixed-positioned, because the nav scrolls
  // and would clip anything that pokes out sideways.
  const [tip, setTip] = useState<{ text: string; top: number } | null>(null)
  const showTip = (text: string) => (e: React.SyntheticEvent<HTMLElement>) => {
    if (!collapsed) return
    const r = e.currentTarget.getBoundingClientRect()
    setTip({ text, top: r.top + r.height / 2 })
  }
  const hideTip = () => setTip(null)

  const signOut = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="surface-band flex h-full flex-col">
      <div className={`flex h-16 shrink-0 items-center border-b border-band-rule ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
        <Link to="/" className="inline-flex items-center gap-2 rounded-sm" aria-label="RuralReact website">
          <svg viewBox="0 0 32 32" aria-hidden="true" className="size-7 shrink-0" fill="none">
            <rect width="32" height="32" rx="4" fill="var(--color-band-ink)" />
            <path d="M6 20h4l3-8 3 12 3-10 2 6h5" stroke="var(--color-signal-orange)" strokeWidth="2.4" strokeLinecap="square" />
            <circle cx="26" cy="8" r="2.5" fill="var(--color-process-green)" />
          </svg>
          {!collapsed && <span className="font-display text-lg font-bold text-band-ink">RuralReact</span>}
        </Link>
        {onToggleCollapse && !collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Collapse sidebar"
            className="flex size-9 items-center justify-center rounded-sm text-band-ink-muted hoverable:hover:bg-band-raised hoverable:hover:text-band-ink"
          >
            <CaretDoubleLeft size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      {!collapsed && (
        <p className="mx-4 mt-4 border-l-2 border-signal-orange pl-2 font-mono text-[11px] font-medium tracking-wide text-band-ink-muted uppercase">
          {def.title}
        </p>
      )}

      <nav aria-label={`${def.title} sections`} className={`min-h-0 flex-1 overflow-y-auto pb-4 ${collapsed ? 'px-2 pt-2' : 'px-3 pt-1'}`}>
        {groups.map((group, gi) => (
          <div key={group.heading ?? gi} className={gi ? (collapsed ? 'mt-2 border-t border-band-rule pt-2' : 'mt-4') : 'mt-2'}>
            {group.heading && !collapsed && (
              <p className="px-2 pb-1 text-[11px] font-semibold tracking-wide text-band-ink-faint uppercase">{group.heading}</p>
            )}
            <ul role="list">
              {group.items.map((item) => {
                const Icon = item.icon
                const count = badges.status === 'success' ? (badges.data[item.id] ?? 0) : 0
                const pill = item.id === 'iiot' && iiot.status === 'success' && iiot.data ? iiotPill[iiot.data] : null
                const extra = count ? `, ${count} pending` : pill ? `, ${pill.full}` : ''
                return (
                  <li
                    key={item.id}
                    onMouseEnter={showTip(`${item.label}${count ? ` · ${count}` : pill ? ` · ${pill.label}` : ''}`)}
                    onMouseLeave={hideTip}
                    onFocus={showTip(`${item.label}${count ? ` · ${count}` : pill ? ` · ${pill.label}` : ''}`)}
                    onBlur={hideTip}
                  >
                    <NavLink
                      to={portalPath(role, item.id)}
                      end={item.id === ''}
                      onClick={onNavigate}
                      aria-label={collapsed ? `${item.label}${extra}` : undefined}
                      className={({ isActive }) =>
                        `relative flex min-h-10 items-center gap-3 rounded-sm py-2 text-sm transition-[background-color,color] duration-150 ${
                          collapsed ? 'justify-center px-0' : 'px-2'
                        } ${
                          isActive
                            ? `font-semibold text-band-ink before:absolute before:inset-y-1.5 before:w-0.5 before:bg-signal-orange ${collapsed ? 'before:-left-2' : 'before:-left-3'}`
                            : 'text-band-ink-muted hoverable:hover:bg-band-raised hoverable:hover:text-band-ink'
                        }`
                      }
                    >
                      <span className="relative shrink-0">
                        <Icon size={19} weight="duotone" aria-hidden="true" />
                        {collapsed && (count > 0 || pill?.label === 'Requested') && (
                          <span aria-hidden="true" className="absolute -top-1 -right-1.5 size-2 rounded-full bg-signal-orange ring-2 ring-band" />
                        )}
                      </span>
                      {!collapsed && (
                        <>
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          {count > 0 && (
                            <span className="readout rounded-sm bg-signal-orange px-1.5 font-mono text-[11px] font-semibold text-on-signal">
                              {count}
                              <span className="sr-only"> pending</span>
                            </span>
                          )}
                          {pill && (
                            <span
                              title={pill.full}
                              className={`rounded-sm border px-1.5 text-[11px] font-semibold ${
                                pill.label === 'Live'
                                  ? 'border-process-green/50 text-process-ink'
                                  : pill.label === 'Requested'
                                    ? 'border-signal-orange/50 text-signal-ink'
                                    : 'border-band-rule text-band-ink-faint'
                              }`}
                            >
                              {pill.label}
                              <span className="sr-only">: {pill.full}</span>
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {collapsed && tip && (
        <span
          aria-hidden="true"
          style={{ top: tip.top }}
          className="pointer-events-none fixed left-[80px] z-50 -translate-y-1/2 rounded-sm bg-band-high px-2 py-1 text-xs font-semibold whitespace-nowrap text-band-ink shadow-(--shadow-e2)"
        >
          {tip.text}
        </span>
      )}

      {/* Footer, always visible: theme, then profile, then log out. */}
      <div className={`shrink-0 space-y-2 border-t border-band-rule ${collapsed ? 'p-2' : 'p-3'}`}>
        {collapsed ? (
          <div className="flex justify-center">
            <ThemeToggle variant="cycle" tone="band" />
          </div>
        ) : (
          <ThemeToggle tone="band" />
        )}
        {session && (
          <Link
            to={portalPath(role, 'profile')}
            onClick={onNavigate}
            aria-label={collapsed ? `Profile: ${session.name}` : undefined}
            className={`flex min-h-11 items-center gap-2.5 rounded-sm transition-[background-color] duration-150 hoverable:hover:bg-band-raised ${collapsed ? 'justify-center' : 'px-2'}`}
          >
            <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-band-high font-mono text-xs font-semibold text-band-ink">
              {initials(session.name)}
            </span>
            {!collapsed && (
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-band-ink">{session.name}</span>
                <span className="block truncate text-xs text-band-ink-faint">Last active {formatDateTime(session.lastActive)}</span>
              </span>
            )}
          </Link>
        )}
        <button
          type="button"
          onClick={signOut}
          aria-label={collapsed ? 'Log out' : undefined}
          className={`flex min-h-10 w-full items-center gap-2.5 rounded-sm text-sm font-semibold text-band-ink-muted transition-[background-color,color] duration-150 hoverable:hover:bg-band-raised hoverable:hover:text-band-ink ${collapsed ? 'justify-center' : 'px-2'}`}
        >
          <SignOut size={18} aria-hidden="true" />
          {!collapsed && 'Log out'}
        </button>
        {onToggleCollapse && collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Expand sidebar"
            className="flex min-h-10 w-full items-center justify-center rounded-sm text-band-ink-muted hoverable:hover:bg-band-raised hoverable:hover:text-band-ink"
          >
            <CaretDoubleRight size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------
   Top bar pieces
   ------------------------------------------------------------------ */

/** Close a popover on outside pointer or Escape, returning focus to the trigger. */
function useDismiss(open: boolean, close: () => void, ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
        ref.current?.querySelector<HTMLElement>('[data-trigger]')?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close, ref])
}

function Search({ role, onDone }: { role: RoleId; onDone?: () => void }) {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const listId = useId()
  const org = session?.organisation ?? ''

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(q), 200)
    return () => window.clearTimeout(t)
  }, [q])

  const email = session?.email ?? ''
  const results = useQuery(`search:${role}:${debounced}`, () => api.search(role, email, org, debounced))
  useDismiss(open, () => setOpen(false), ref)

  const items: SearchResult[] = results.status === 'success' ? results.data : []
  const go = (r: SearchResult) => {
    navigate(r.to)
    setOpen(false)
    setQ('')
    onDone?.()
  }

  return (
    <div ref={ref} className="relative w-full max-w-[420px]">
      <MagnifyingGlass size={16} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint" />
      <input
        type="search"
        role="combobox"
        aria-label={`Search ${roles[role].title.toLowerCase()} workspace`}
        aria-expanded={open && debounced.length >= 2}
        aria-controls={listId}
        aria-activedescendant={open && items[active] ? `${listId}-${active}` : undefined}
        placeholder="Search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
          setActive(0)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActive((a) => Math.min(a + 1, items.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((a) => Math.max(a - 1, 0))
          } else if (e.key === 'Enter' && items[active]) {
            e.preventDefault()
            go(items[active])
          }
        }}
        className="min-h-10 w-full rounded-sm border border-rule bg-sunk pr-3 pl-9 text-sm text-ink placeholder:text-ink-faint focus:border-signal-orange focus:bg-card focus:ring-2 focus:ring-signal-orange/20 focus:outline-none"
      />
      {open && debounced.length >= 2 && (
        <div className="absolute top-full right-0 left-0 z-40 mt-1.5 overflow-hidden rounded-md border border-rule bg-card shadow-(--shadow-e3)">
          {results.status === 'loading' ? (
            <p className="px-4 py-3 text-sm text-ink-muted" role="status">Searching…</p>
          ) : results.status === 'error' ? (
            <p className="px-4 py-3 text-sm text-danger" role="alert">Search is unavailable. Try again.</p>
          ) : items.length === 0 ? (
            <p className="px-4 py-3 text-sm text-ink-muted" role="status">No matches for “{debounced}”.</p>
          ) : (
            <ul id={listId} role="listbox" aria-label="Search results" className="max-h-80 overflow-y-auto py-1">
              {items.map((r, i) => (
                <li
                  key={`${r.kind}-${r.label}-${i}`}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onPointerDown={(e) => {
                    e.preventDefault()
                    go(r)
                  }}
                  onPointerEnter={() => setActive(i)}
                  className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-2 ${i === active ? 'bg-sunk' : ''}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink">{r.label}</span>
                    <span className="block truncate text-xs text-ink-faint">{r.detail}</span>
                  </span>
                  <span className="shrink-0 rounded-sm border border-rule px-1.5 text-[11px] text-ink-muted">{r.kind}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function Bell_({ role }: { role: RoleId }) {
  const { session } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const email = session?.email ?? ''
  const q = useQuery(`notifications:${role}:${email}`, () => api.notifications(role, email))
  useDismiss(open, () => setOpen(false), ref)
  const list = q.status === 'success' ? q.data : []
  const unread = list.filter((n) => n.unread)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        data-trigger
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Notifications${unread.length ? `, ${unread.length} unread` : ''}`}
        className="relative flex size-10 items-center justify-center rounded-sm text-ink-muted hoverable:hover:bg-hover hoverable:hover:text-ink"
      >
        <Bell size={20} aria-hidden="true" />
        {unread.length > 0 && (
          <span aria-hidden="true" className="absolute top-1 right-1 min-w-4 rounded-sm bg-signal-orange px-1 text-center font-mono text-[10px] leading-4 font-semibold text-on-signal">
            {unread.length}
          </span>
        )}
      </button>
      {open && (
        <div role="dialog" aria-label="Notifications" className="absolute top-full right-0 z-40 mt-1.5 w-[min(92vw,360px)] overflow-hidden rounded-md border border-rule bg-card shadow-(--shadow-e3)">
          <div className="flex items-center justify-between border-b border-rule px-4 py-2.5">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            {unread.length > 0 && (
              <button type="button" onClick={() => api.markRead(email, unread.map((n) => n.id))} className="text-xs font-semibold text-signal-ink hoverable:hover:underline">
                Mark all read
              </button>
            )}
          </div>
          {q.status === 'loading' ? (
            <p className="px-4 py-4 text-sm text-ink-muted">Loading…</p>
          ) : q.status === 'error' ? (
            <div className="px-4 py-4 text-sm">
              <p className="text-danger">Couldn't load notifications.</p>
              <button type="button" onClick={q.retry} className="mt-1 font-semibold text-ink underline">Try again</button>
            </div>
          ) : list.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink-muted">You're all caught up.</p>
          ) : (
            <ul className="max-h-80 divide-y divide-rule overflow-y-auto" role="list">
              {list.slice(0, 6).map((n) => (
                <li key={n.id} className={`flex gap-2.5 px-4 py-3 ${n.unread ? 'bg-signal-orange/5' : ''}`}>
                  <span aria-hidden="true" className={`mt-1.5 size-1.5 shrink-0 rounded-full ${n.unread ? 'bg-signal-orange' : 'bg-transparent'}`} />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink">{n.title}</span>
                    <span className="block text-xs text-ink-muted">{n.body}</span>
                    <span className="block text-[11px] text-ink-faint">{formatDateTime(n.at)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link to={portalPath(role, 'notifications')} onClick={() => setOpen(false)} className="block border-t border-rule px-4 py-2.5 text-center text-sm font-semibold text-signal-ink hoverable:hover:bg-sunk">
            View all notifications
          </Link>
        </div>
      )}
    </div>
  )
}

function AvatarMenu({ role }: { role: RoleId }) {
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(open, () => setOpen(false), ref)
  if (!session) return null
  const item = 'flex min-h-10 w-full items-center gap-2.5 px-4 text-left text-sm text-ink hoverable:hover:bg-sunk'
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        data-trigger
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account menu for ${session.name}`}
        className="flex min-h-10 items-center gap-1.5 rounded-sm px-1.5 hoverable:hover:bg-hover"
      >
        <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-sm bg-band font-mono text-xs font-semibold text-band-ink">
          {initials(session.name)}
        </span>
        <CaretDown size={12} aria-hidden="true" className="hidden text-ink-muted sm:block" />
      </button>
      {open && (
        <div role="menu" className="absolute top-full right-0 z-40 mt-1.5 w-60 overflow-hidden rounded-md border border-rule bg-card py-1 shadow-(--shadow-e3)">
          <div className="border-b border-rule px-4 py-2.5">
            <p className="truncate text-sm font-semibold text-ink">{session.name}</p>
            <p className="truncate font-mono text-xs text-ink-faint">{session.email}</p>
          </div>
          <Link role="menuitem" to={portalPath(role, 'profile')} onClick={() => setOpen(false)} className={item}>
            <User size={16} aria-hidden="true" /> Profile
          </Link>
          <Link role="menuitem" to={portalPath(role, 'security')} onClick={() => setOpen(false)} className={item}>
            <ShieldCheck size={16} aria-hidden="true" /> Password & security
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              logout()
              navigate('/login', { replace: true })
            }}
            className={`${item} border-t border-rule`}
          >
            <SignOut size={16} aria-hidden="true" /> Log out
          </button>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------
   Layout
   ------------------------------------------------------------------ */

function sectionTitle(role: RoleId, pathname: string) {
  const parts = pathname.split('/').filter(Boolean) // portal, role, section?, id?
  const section = parts[2] ?? ''
  const found = sectionsFor(role).find((s) => s.id === section)
  if (parts[3]) {
    if (section === 'rfq') return `RFQ ${decodeURIComponent(parts[3])}`
    if (section === 'customers') return 'Customer'
  }
  return found?.label ?? roles[role].title
}

export function PortalLayout({ role, children }: { role: RoleId; children: ReactNode }) {
  const [drawer, setDrawer] = useState(false)
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [mobileSearch, setMobileSearch] = useState(false)
  const { pathname } = useLocation()
  const { touch } = useAuth()
  const mainRef = useRef<HTMLElement>(null)

  const toggleCollapse = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? 'expanded' : 'collapsed')
      } catch {
        // not persisted when storage is blocked
      }
      return !c
    })
  }

  // Each section change: close overlays, refresh "last active", and
  // move focus to the work area so a screen reader starts at the page.
  useEffect(() => {
    setDrawer(false)
    setMobileSearch(false)
    touch()
    mainRef.current?.focus()
    window.scrollTo(0, 0)
  }, [pathname, touch])

  useEffect(() => {
    if (!drawer) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false)
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [drawer])

  const title = sectionTitle(role, pathname)

  return (
    <div className="min-h-dvh bg-page">
      <a
        href="#portal-main"
        className="sr-only rounded-sm bg-signal-orange px-4 py-2 font-semibold text-on-signal focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-60"
      >
        Skip to content
      </a>

      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden transition-[width] duration-200 ease-(--ease-out) lg:block ${collapsed ? 'w-[72px]' : 'w-64'}`}
      >
        <Sidebar role={role} collapsed={collapsed} onToggleCollapse={toggleCollapse} />
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Portal menu">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-band/70" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-[min(86vw,300px)] shadow-(--shadow-e3)">
            <Sidebar role={role} collapsed={false} onNavigate={() => setDrawer(false)} />
            <button
              type="button"
              onClick={() => setDrawer(false)}
              aria-label="Close menu"
              className="absolute top-2.5 -right-12 flex size-11 items-center justify-center rounded-sm bg-band text-band-ink"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <div className={`transition-[padding] duration-200 ease-(--ease-out) ${collapsed ? 'lg:pl-[72px]' : 'lg:pl-64'}`}>
        <header className="sticky top-0 z-20 border-b border-rule bg-card">
          <div className="flex h-16 items-center gap-3 px-4 md:px-8">
            <button
              type="button"
              onClick={() => setDrawer(true)}
              aria-label="Open menu"
              aria-expanded={drawer}
              className="flex size-11 shrink-0 items-center justify-center rounded-sm border border-rule-strong text-ink lg:hidden"
            >
              <List size={20} aria-hidden="true" />
            </button>
            <p className="min-w-0 flex-1 truncate font-display text-xl font-semibold text-ink md:flex-none md:basis-56">{title}</p>
            <div className="hidden flex-1 justify-center md:flex">
              <Search role={role} />
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setMobileSearch((v) => !v)}
                aria-label="Search"
                aria-expanded={mobileSearch}
                className="flex size-10 items-center justify-center rounded-sm text-ink-muted hoverable:hover:bg-hover md:hidden"
              >
                <MagnifyingGlass size={20} aria-hidden="true" />
              </button>
              <span title="Records are stored in this browser until the backend is connected" className="mr-1 hidden rounded-sm border border-signal-orange/50 bg-signal-orange/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-signal-ink xl:inline">
                PROTOTYPE
              </span>
              <Bell_ role={role} />
              <AvatarMenu role={role} />
            </div>
          </div>
          {mobileSearch && (
            <div className="border-t border-rule px-4 py-2.5 md:hidden">
              <Search role={role} onDone={() => setMobileSearch(false)} />
            </div>
          )}
        </header>

        <main id="portal-main" ref={mainRef} tabIndex={-1} className="mx-auto max-w-[1320px] px-4 py-8 outline-none md:px-8 md:py-10">
          {children}
        </main>
      </div>
    </div>
  )
}
