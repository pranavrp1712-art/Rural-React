import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from 'react'
import {
  navigation,
  primaryCta,
  secondaryCta,
  type NavSection,
} from '../data/navigation'
import { StatusLed } from './primitives'
import { SmartLink } from './SmartLink'
import { ThemeToggle } from './ThemeToggle'

/* ------------------------------------------------------------------
   Logo. Drawn rather than imported so the wordmark can invert between
   the dark hero and the light page without a second asset.
   ------------------------------------------------------------------ */

function Logo({ onBand }: { onBand: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg viewBox="0 0 32 32" aria-hidden="true" className="size-7 shrink-0" fill="none">
        <rect
          width="32"
          height="32"
          rx="4"
          className="transition-[fill] duration-300 ease-(--ease-out)"
          fill={onBand ? 'var(--color-band-ink)' : 'var(--color-band)'}
        />
        <path
          d="M6 20h4l3-8 3 12 3-10 2 6h5"
          stroke="var(--color-signal-orange)"
          strokeWidth="2.4"
          strokeLinecap="square"
        />
        <circle cx="26" cy="8" r="2.5" fill="var(--color-process-green)" />
      </svg>
      <span
        className={`font-display text-xl font-bold tracking-tight transition-[color] duration-300 ease-(--ease-out) ${
          onBand ? 'text-band-ink' : 'text-ink'
        }`}
      >
        RuralReact
      </span>
    </span>
  )
}

/* ------------------------------------------------------------------
   Priority plus. Sections fold into a More menu as width gets tight,
   in the order set on the navigation config.
   ------------------------------------------------------------------ */

/** Highest collapseOrder in the config; the most we can ever fold away. */
const MAX_COLLAPSE = 9

function useVisibleCount(islandRef: RefObject<HTMLDivElement | null>) {
  const [hiddenBelow, setHiddenBelow] = useState(0)

  /* Measure rather than guess. Fixed breakpoints cannot know how wide
     these particular labels render, so the island folds one more
     section away whenever it does not fit, and unfolds one when there
     is comfortably room again. Re-running on every change lets it
     settle in a few passes instead of one big calculation. */
  useLayoutEffect(() => {
    const node = islandRef.current
    if (!node) return

    const measure = () => {
      const available = node.clientWidth
      // Natural width: every child at its intrinsic size plus the gaps.
      const needed =
        Array.from(node.children).reduce((sum, child) => {
          const el = child as HTMLElement
          const inner = el.firstElementChild as HTMLElement | null
          return sum + Math.max(el.scrollWidth, inner?.scrollWidth ?? 0)
        }, 0) + 48

      setHiddenBelow((current) => {
        if (needed > available && current < MAX_COLLAPSE) return current + 1
        // The slack stops it oscillating between two states on a resize.
        if (needed < available - 180 && current > 0) return current - 1
        return current
      })
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(document.documentElement)
    return () => observer.disconnect()
  }, [islandRef, hiddenBelow])

  return hiddenBelow
}

/* ------------------------------------------------------------------
   Active section indicator, driven by IntersectionObserver.
   ------------------------------------------------------------------ */

function useActiveSection(): string {
  const [active, setActive] = useState('')

  useEffect(() => {
    const ids = navigation.map((s) => s.href.replace('#', ''))
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter((n): n is HTMLElement => Boolean(n))

    if (nodes.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-96px 0px -55% 0px', threshold: [0.01, 0.25, 0.5] },
    )

    nodes.forEach((n) => observer.observe(n))
    return () => observer.disconnect()
  }, [])

  return active
}

/* ------------------------------------------------------------------
   Mega menu panel. Scales in from the trigger, never from centre and
   never from zero.
   ------------------------------------------------------------------ */

function MegaPanel({
  section,
  onNavigate,
}: {
  section: NavSection
  onNavigate: () => void
}) {
  const wide = (section.groups?.length ?? 0) > 1 || Boolean(section.featured)

  return (
    <div
      className={`overflow-hidden rounded-md border border-rule bg-card p-2 shadow-(--shadow-e3) ${
        wide ? 'w-max max-w-[min(90vw,880px)]' : 'w-max max-w-[min(90vw,340px)]'
      }`}
    >
      <div className="flex gap-2">
        <div
          className={`grid gap-2 ${
            (section.groups?.length ?? 0) > 1
              ? 'grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]'
              : 'grid-cols-1'
          }`}
        >
          {section.groups?.map((group) => (
            <div key={group.heading ?? 'items'} className="min-w-[220px]">
              {group.heading && (
                <p className="px-3 pt-2 pb-1 font-mono text-xs font-medium tracking-wide text-ink-faint uppercase">
                  {group.heading}
                </p>
              )}
              <ul>
                {group.items.map((item) => (
                  <li key={item.label}>
                    <SmartLink
                      href={item.href}
                      onClick={onNavigate}
                      className="block rounded-sm px-3 py-2 transition-[background-color] duration-150 ease-(--ease-out) hoverable:hover:bg-hover"
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                        {item.label}
                        {item.status && <StatusLed status={item.status} withLabel={false} />}
                      </span>
                      {item.blurb && (
                        <span className="mt-0.5 block text-sm text-ink-muted">
                          {item.blurb}
                        </span>
                      )}
                      {item.tag && (
                        <span className="mt-1 inline-block rounded-sm border border-rule px-2 py-0.5 font-mono text-xs text-ink-faint">
                          {item.tag}
                        </span>
                      )}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {section.featured && (
          <div className="hidden w-[260px] shrink-0 rounded-sm border border-rule bg-sunk p-4 lg:block">
            <p className="text-sm font-semibold text-ink">{section.featured.title}</p>
            <p className="mt-2 text-sm text-ink-muted">{section.featured.body}</p>
            <SmartLink
              href={section.featured.href}
              onClick={onNavigate}
              className="mt-4 inline-flex min-h-10 items-center rounded-sm bg-signal-orange px-4 py-2 text-sm font-semibold text-on-signal transition-[background-color,transform] duration-150 ease-(--ease-out) hoverable:hover:bg-signal-orange-hover active:scale-[0.97]"
            >
              {section.featured.cta}
            </SmartLink>
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------
   Desktop item with hover intent plus full keyboard support.
   ------------------------------------------------------------------ */

function DesktopItem({
  section,
  isActive,
  onBand,
  openId,
  setOpenId,
}: {
  section: NavSection
  isActive: boolean
  onBand: boolean
  openId: string | null
  setOpenId: (id: string | null) => void
}) {
  const timer = useRef<number | null>(null)
  const wrapRef = useRef<HTMLLIElement>(null)
  const open = openId === section.id

  const clearTimer = () => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = null
  }

  useEffect(() => clearTimer, [])

  const restColor = onBand
    ? 'text-band-ink-muted hoverable:hover:text-band-ink'
    : 'text-ink-muted hoverable:hover:text-ink'

  if (!section.groups) {
    return (
      <li>
        <SmartLink
          href={section.href}
          aria-current={isActive ? 'true' : undefined}
          className={`relative block px-3 py-2 text-sm font-semibold whitespace-nowrap transition-[color] duration-150 ease-(--ease-out) ${restColor}`}
        >
          {section.label}
          {isActive && (
            <span
              aria-hidden="true"
              className="absolute inset-x-3 -bottom-px h-0.5 bg-signal-orange"
            />
          )}
        </SmartLink>
      </li>
    )
  }

  return (
    <li
      ref={wrapRef}
      className="relative"
      onMouseEnter={() => {
        clearTimer()
        timer.current = window.setTimeout(() => setOpenId(section.id), 120)
      }}
      onMouseLeave={() => {
        clearTimer()
        timer.current = window.setTimeout(() => setOpenId(null), 120)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          setOpenId(null)
          wrapRef.current?.querySelector('button')?.focus()
        }
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`menu-${section.id}`}
        onClick={() => setOpenId(open ? null : section.id)}
        className={`relative flex items-center gap-1 px-3 py-2 text-sm font-semibold whitespace-nowrap transition-[color] duration-150 ease-(--ease-out) ${restColor}`}
      >
        {section.label}
        <svg
          viewBox="0 0 12 12"
          aria-hidden="true"
          className={`size-3 transition-transform duration-200 ease-(--ease-out) ${
            open ? 'rotate-180' : ''
          }`}
        >
          <path d="M3 5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        {isActive && (
          <span
            aria-hidden="true"
            className="absolute inset-x-3 -bottom-px h-0.5 bg-signal-orange"
          />
        )}
      </button>

      {/* Origin at the trigger, and it never scales from zero. */}
      <div
        id={`menu-${section.id}`}
        className={`absolute top-full left-0 origin-top-left pt-3 transition-[transform,opacity] duration-200 ease-(--ease-out) ${
          open
            ? 'pointer-events-auto scale-100 opacity-100'
            : 'pointer-events-none scale-[0.97] opacity-0'
        }`}
        hidden={!open}
      >
        <MegaPanel section={section} onNavigate={() => setOpenId(null)} />
      </div>
    </li>
  )
}

/* ------------------------------------------------------------------
   Mobile drawer: scroll locked, focus trapped, Esc to close.
   ------------------------------------------------------------------ */

function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      )
      if (!focusable || focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>('a[href], button')?.focus()
    }, 80)

    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      hidden={!open}
      className={`surface-band fixed inset-0 z-40 overflow-y-auto transition-opacity duration-200 ease-(--ease-drawer) lg:hidden ${
        open ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <nav aria-label="Mobile" className="px-4 pt-20 pb-28">
        <ul>
          {[
            { id: 'home', label: 'Home', href: '#top' } as NavSection,
            ...navigation,
            { id: 'signin', label: 'Sign in', href: '/login' } as NavSection,
          ].map(
            (section, index) => (
              <li
                key={section.id}
                style={{ transitionDelay: open ? `${Math.min(index, 8) * 25}ms` : '0ms' }}
                className={`border-b border-band-rule transition-[transform,opacity] duration-300 ease-(--ease-out) ${
                  open ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                }`}
              >
                {section.groups ? (
                  <>
                    <button
                      type="button"
                      aria-expanded={expanded === section.id}
                      aria-controls={`drawer-${section.id}`}
                      onClick={() =>
                        setExpanded(expanded === section.id ? null : section.id)
                      }
                      className="flex min-h-12 w-full items-center justify-between py-3 text-left font-display text-xl font-semibold text-band-ink"
                    >
                      {section.label}
                      <svg
                        viewBox="0 0 16 16"
                        aria-hidden="true"
                        className={`size-4 transition-transform duration-200 ease-(--ease-out) ${
                          expanded === section.id ? 'rotate-45' : ''
                        }`}
                      >
                        <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </button>
                    <div
                      id={`drawer-${section.id}`}
                      hidden={expanded !== section.id}
                      className="pb-3"
                    >
                      {section.groups.map((group) => (
                        <div key={group.heading ?? 'items'} className="mb-3">
                          {group.heading && (
                            <p className="py-1 font-mono text-xs text-signal-ink uppercase">
                              {group.heading}
                            </p>
                          )}
                          <ul>
                            {group.items.map((item) => (
                              <li key={item.label}>
                                <SmartLink
                                  href={item.href}
                                  onClick={onClose}
                                  className="flex min-h-11 items-center gap-2 py-2 text-base text-band-ink-muted transition-[color] duration-150 ease-(--ease-out) hoverable:hover:text-band-ink"
                                >
                                  {item.label}
                                  {item.status && (
                                    <StatusLed status={item.status} withLabel={false} />
                                  )}
                                </SmartLink>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <SmartLink
                    href={section.href}
                    onClick={onClose}
                    className="flex min-h-12 items-center py-3 font-display text-xl font-semibold text-band-ink"
                  >
                    {section.label}
                  </SmartLink>
                )}
              </li>
            ),
          )}
        </ul>
      </nav>
    </div>
  )
}

/* ------------------------------------------------------------------
   The nav itself: one sticky bar, driven by the typed navigation config.
   ------------------------------------------------------------------ */

export function SiteNav() {
  const [openId, setOpenId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const islandRef = useRef<HTMLDivElement>(null)
  const hiddenBelow = useVisibleCount(islandRef)
  const active = useActiveSection()
  const sentinel = useRef<HTMLDivElement>(null)

  /* Watch a sentinel at the top of the hero rather than listening to
     scroll, which would reflow on every frame. */
  useEffect(() => {
    const node = sentinel.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const closeMenus = useCallback(() => setOpenId(null), [])
  useEffect(() => {
    if (!openId) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-island-nav]')) closeMenus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [openId, closeMenus])

  const onBand = !scrolled

  const visible = navigation.filter(
    (s) => !s.collapseOrder || s.collapseOrder > hiddenBelow,
  )
  const overflow = navigation.filter(
    (s) => s.collapseOrder && s.collapseOrder <= hiddenBelow,
  )

  const moreSection: NavSection = {
    id: 'more',
    label: 'More',
    href: '#',
    groups: [{ items: overflow.map((s) => ({ label: s.label, href: s.href })) }],
  }

  return (
    <>
      <div ref={sentinel} className="absolute top-0 h-24 w-full" aria-hidden="true" />

      <a
        href="#main"
        className="sr-only rounded-sm bg-signal-orange px-4 py-2 text-base font-semibold text-on-signal focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-60"
      >
        Skip to content
      </a>

      {/* One sticky bar: transparent over the navy hero, solid white and
          shorter once the page scrolls onto the light sections. */}
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-200 ease-(--ease-out) ${
          drawerOpen
            ? 'border-band-rule bg-band'
            : onBand
              ? 'border-transparent bg-transparent'
              : 'border-rule bg-card shadow-(--shadow-e1)'
        }`}
      >
        <div
          ref={islandRef}
          data-island-nav
          className={`mx-auto flex w-full max-w-[1320px] items-center justify-between gap-4 px-4 transition-[height] duration-200 ease-(--ease-out) md:px-8 ${
            onBand ? 'h-20' : 'h-16'
          }`}
        >
          <SmartLink
            href="#top"
            aria-label="RuralReact, home"
            className="-ml-1 shrink-0 rounded-sm px-1 py-2"
          >
            <Logo onBand={onBand || drawerOpen} />
          </SmartLink>

          <nav aria-label="Main" className="hidden min-w-0 lg:block">
            <ul className="flex w-max items-center">
              {visible.map((section) => (
                <DesktopItem
                  key={section.id}
                  section={section}
                  isActive={active === section.href.replace('#', '')}
                  onBand={onBand}
                  openId={openId}
                  setOpenId={setOpenId}
                />
              ))}
              {overflow.length > 0 && (
                <DesktopItem
                  section={moreSection}
                  isActive={false}
                  onBand={onBand}
                  openId={openId}
                  setOpenId={setOpenId}
                />
              )}
            </ul>
          </nav>

          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <ThemeToggle variant="cycle" tone={onBand ? 'band' : 'surface'} />
            <SmartLink
              href="/login"
              className={`inline-flex min-h-10 items-center px-2 text-sm font-semibold whitespace-nowrap transition-[color] duration-150 ${
                onBand ? 'text-band-ink-muted hoverable:hover:text-band-ink' : 'text-ink-muted hoverable:hover:text-ink'
              }`}
            >
              Sign in
            </SmartLink>
            <SmartLink
              href={secondaryCta.href}
              className={`inline-flex min-h-10 items-center rounded-sm border px-4 py-2 text-sm font-semibold whitespace-nowrap transition-[background-color,border-color,color,transform] duration-150 ease-(--ease-out) active:scale-[0.97] ${
                onBand
                  ? 'border-band-ink/35 text-band-ink hoverable:hover:border-band-ink hoverable:hover:bg-band-ink/10'
                  : 'border-rule-strong text-ink hoverable:hover:border-ink hoverable:hover:bg-hover'
              }`}
            >
              {secondaryCta.label}
            </SmartLink>
            <SmartLink
              href={primaryCta.href}
              className="inline-flex min-h-10 items-center rounded-sm bg-signal-orange px-4 py-2 text-sm font-semibold whitespace-nowrap text-on-signal transition-[background-color,transform] duration-150 ease-(--ease-out) hoverable:hover:bg-signal-orange-hover active:scale-[0.97]"
            >
              {primaryCta.label}
            </SmartLink>
          </div>

          <ThemeToggle
            variant="cycle"
            tone={onBand || drawerOpen ? 'band' : 'surface'}
            className="ml-auto lg:hidden"
          />

          {/* Hamburger. The bars rotate into an X, they never vanish. */}
          <button
            type="button"
            aria-expanded={drawerOpen}
            aria-controls="mobile-drawer"
            aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setDrawerOpen((v) => !v)}
            className={`relative size-11 shrink-0 rounded-sm border transition-[background-color,border-color] duration-150 ease-(--ease-out) lg:hidden ${
              drawerOpen || onBand ? 'border-band-ink/35' : 'border-rule-strong'
            }`}
          >
            <span
              aria-hidden="true"
              className={`absolute left-1/2 block h-0.5 w-5 -translate-x-1/2 transition-[top,transform,background-color] duration-300 ease-(--ease-drawer) ${
                drawerOpen || onBand ? 'bg-band-ink' : 'bg-ink'
              } ${drawerOpen ? 'top-1/2 rotate-45' : 'top-[38%] rotate-0'}`}
            />
            <span
              aria-hidden="true"
              className={`absolute left-1/2 block h-0.5 w-5 -translate-x-1/2 transition-[top,transform,background-color] duration-300 ease-(--ease-drawer) ${
                drawerOpen || onBand ? 'bg-band-ink' : 'bg-ink'
              } ${drawerOpen ? 'top-1/2 -rotate-45' : 'top-[58%] rotate-0'}`}
            />
          </button>
        </div>
      </header>

      <div id="mobile-drawer">
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </div>

      {/* Thumb reach action bar, mobile only. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-card px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-(--shadow-e3) lg:hidden">
        <div className="flex gap-2">
          <SmartLink
            href={primaryCta.href}
            className="flex min-h-11 flex-1 items-center justify-center rounded-sm bg-signal-orange px-3 py-2 text-sm font-semibold text-on-signal transition-transform duration-150 ease-(--ease-out) active:scale-[0.97]"
          >
            {primaryCta.label}
          </SmartLink>
          <SmartLink
            href={secondaryCta.href}
            className="flex min-h-11 flex-1 items-center justify-center rounded-sm border border-rule-strong px-3 py-2 text-sm font-semibold text-ink transition-transform duration-150 ease-(--ease-out) active:scale-[0.97]"
          >
            {secondaryCta.label}
          </SmartLink>
        </div>
      </div>
    </>
  )
}
