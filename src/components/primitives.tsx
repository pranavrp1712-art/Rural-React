import { Children, Fragment, cloneElement, isValidElement, useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactElement, type ReactNode } from 'react'
import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import { statusLabels, type ItemStatus } from '../data/navigation'
import { badgeSize, toneStyles, type AccentTone } from '../data/tones'
import { useInView } from '../lib/motion'
import { SmartLink } from './SmartLink'

/* ------------------------------------------------------------------
   Scroll reveal. IntersectionObserver only, never a scroll listener.
   This is explanatory motion rather than UI feedback, so it is allowed
   to run longer than the 300ms ceiling that governs interactions.
   ------------------------------------------------------------------ */

interface RevealProps {
  children: ReactNode
  as?: ElementType
  className?: string
  /** Stagger in milliseconds. Kept between 30 and 80 per item. */
  delay?: number
  id?: string
  variant?: 'up' | 'scale' | 'fade'
}

export function Reveal({
  children,
  as: Tag = 'div',
  className = '',
  delay = 0,
  id,
  variant = 'up',
}: RevealProps) {
  const ref = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const initialClass =
    variant === 'scale'
      ? 'scale-[0.98] opacity-0'
      : variant === 'fade'
        ? 'opacity-0'
        : 'translate-y-3 opacity-0'

  const activeClass =
    variant === 'scale'
      ? 'scale-100 opacity-100'
      : variant === 'fade'
        ? 'opacity-100'
        : 'translate-y-0 opacity-100'

  return (
    <Tag
      ref={ref}
      id={id}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-[transform,opacity] duration-[400ms] ease-(--ease-out) motion-reduce:transition-none ${
        shown
          ? activeClass
          : `${initialClass} motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:opacity-100`
      } ${className}`}
    >
      {children}
    </Tag>
  )
}

/* ------------------------------------------------------------------
   Scroll progress indicator. Tracks reading progress at viewport top.
   ------------------------------------------------------------------ */

export function ScrollProgressBar() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      if (totalHeight > 0) {
        const current = (window.scrollY / totalHeight) * 100
        setProgress(Math.min(100, Math.max(0, current)))
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 right-0 left-0 z-50 h-[2px]"
    >
      <div
        className="h-full origin-left bg-signal-orange"
        style={{ transform: `scaleX(${progress / 100})` }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------
   Back to top floating action with circular scroll indicator.
   ------------------------------------------------------------------ */

export function BackToTop() {
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      setVisible(scrollY > 450)
      if (totalHeight > 0) {
        setProgress((scrollY / totalHeight) * 100)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!visible) return null

  const circumference = 113.1
  const strokeDashoffset = circumference - (circumference * progress) / 100

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll back to top"
      className="group fixed right-4 bottom-24 z-40 flex size-12 items-center justify-center rounded-lg border border-band-rule bg-band text-band-ink shadow-(--shadow-e2) transition-[border-color,transform] duration-150 ease-(--ease-out) hoverable:hover:border-signal-orange active:scale-[0.96] md:right-6 md:bottom-6"
    >
      <svg className="absolute inset-0 size-12 -rotate-90 pointer-events-none" viewBox="0 0 44 44">
        <circle
          cx="22"
          cy="22"
          r="18"
          stroke="var(--color-band-rule)"
          strokeWidth="2.5"
          fill="none"
        />
        <circle
          cx="22"
          cy="22"
          r="18"
          stroke="var(--color-signal-orange)"
          strokeWidth="2.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          className="transition-[stroke-dashoffset] duration-150"
        />
      </svg>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5 transition-transform duration-200 hoverable:group-hover:-translate-y-0.5 text-band-ink"
      >
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  )
}

/* ------------------------------------------------------------------
   Metric / Stat counter display
   ------------------------------------------------------------------ */

export function StatCounter({
  value,
  label,
  sublabel,
}: {
  value: string
  label: string
  sublabel?: string
}) {
  return (
    <div className="flex flex-col">
      <span className="readout font-display text-3xl font-semibold text-band-ink md:text-4xl">
        {value}
      </span>
      <span className="mt-1 text-sm font-semibold text-band-ink">{label}</span>
      {sublabel && (
        <span className="text-xs text-band-ink-faint font-mono">{sublabel}</span>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------
   Status LED. Carries meaning: green is live or ready, orange is
   attention, grey is not yet available.
   ------------------------------------------------------------------ */

const statusColor: Record<ItemStatus, string> = {
  ready: 'bg-process-green',
  pilot: 'bg-signal-orange',
  'in-development': 'bg-rule-strong',
  custom: 'bg-deep-blue',
  'coming-soon': 'bg-rule-strong',
  'to-be-configured': 'bg-rule-strong',
}

export function StatusLed({
  status,
  withLabel = true,
}: {
  status: ItemStatus
  withLabel?: boolean
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className={`size-2 shrink-0 rounded-full ring-2 ring-ink/10 ${statusColor[status]}`}
      />
      {withLabel && (
        <span className="font-mono text-xs font-medium tracking-wide text-ink-muted uppercase">
          {statusLabels[status]}
        </span>
      )}
    </span>
  )
}

/* ------------------------------------------------------------------
   Icon badge. The visual unit that replaces a paragraph's worth of
   text with one glance: a tinted plate carrying a Phosphor icon.
   ------------------------------------------------------------------ */

export function IconBadge({
  icon: Glyph,
  tone = 'orange',
  size = 'md',
  className = '',
}: {
  icon: PhosphorIcon
  tone?: AccentTone
  size?: keyof typeof badgeSize
  className?: string
}) {
  const t = toneStyles[tone] ?? toneStyles.orange
  const px = badgeSize[size]
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-md ring-1 ring-inset ${t.bg} ${t.ring} ${className}`}
      style={{ width: px, height: px }}
    >
      <Glyph size={Math.round(px * 0.52)} weight="duotone" className={t.fg} />
    </span>
  )
}

/* ------------------------------------------------------------------
   Buttons. Press feedback is instant and physical: scale settles in
   150ms, and the scale carries the label with it.
   ------------------------------------------------------------------ */

type ButtonSize = 'md' | 'sm'

const sizeClass: Record<ButtonSize, string> = {
  md: 'min-h-11 px-5 py-2.5 text-base',
  sm: 'min-h-10 px-4 py-2 text-sm',
}

const pressable =
  'transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-(--ease-out) active:scale-[0.97]'

export function PrimaryLink({
  href,
  children,
  size = 'md',
  className = '',
}: {
  href: string
  children: ReactNode
  size?: ButtonSize
  className?: string
}) {
  return (
    <SmartLink
      href={href}
      className={`btn-sheen inline-flex items-center justify-center gap-2 rounded-sm bg-signal-orange font-semibold text-on-signal shadow-(--shadow-e1) hoverable:hover:bg-signal-orange-hover ${pressable} ${sizeClass[size]} ${className}`}
    >
      {children}
    </SmartLink>
  )
}

export function SecondaryLink({
  href,
  children,
  size = 'md',
  className = '',
}: {
  href: string
  children: ReactNode
  size?: ButtonSize
  className?: string
}) {
  return (
    <SmartLink
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-sm border border-rule-strong bg-card font-semibold text-ink hoverable:hover:border-ink hoverable:hover:bg-hover ${pressable} ${sizeClass[size]} ${className}`}
    >
      {children}
    </SmartLink>
  )
}

/* ------------------------------------------------------------------
   Section scaffolding. A nameplate label plus a heading, left aligned.
   `surface` says what the section sits on, not what colour it is.
   ------------------------------------------------------------------ */

export type Surface = 'light' | 'band'

export function SectionLabel({
  children,
  surface = 'light',
}: {
  children: ReactNode
  surface?: Surface
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 border-l-2 border-signal-orange py-0.5 pl-2.5 font-mono text-xs font-medium tracking-wide ${
        surface === 'light' ? 'text-ink-muted' : 'text-band-ink-muted'
      }`}
    >
      {children}
    </span>
  )
}

export function SectionHeading({
  label,
  title,
  intro,
  surface = 'light',
}: {
  label: string
  title: string
  intro?: string
  surface?: Surface
}) {
  const [ref, shown] = useInView<HTMLDivElement>()
  return (
    <div ref={ref} data-shown={shown || undefined} className="heading-in max-w-[680px]">
      <SectionLabel surface={surface}>{label}</SectionLabel>
      <h2
        className={`display mt-3 text-4xl font-semibold md:text-5xl ${
          surface === 'light' ? 'text-ink' : 'text-band-ink'
        }`}
      >
        <SplitWords text={title} />
      </h2>
      {intro && (
        <p
          className={`mt-4 max-w-[62ch] text-lg ${
            surface === 'light' ? 'text-ink-muted' : 'text-band-ink-muted'
          }`}
        >
          {intro}
        </p>
      )}
    </div>
  )
}

/** Consistent page gutter and max width for every section. */
export function Container({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`mx-auto w-full max-w-[1200px] px-4 md:px-8 ${className}`}>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------
   Motion building blocks. See src/lib/motion.ts for the rules.
   ------------------------------------------------------------------ */

/**
 * Words rise out of a mask when an ancestor gets `data-shown`. The
 * text stays one readable string for assistive technology.
 */
export function SplitWords({ text, delay = 0 }: { text: string; delay?: number }) {
  const words = text.split(' ')
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((w, i) => (
          <Fragment key={`${w}-${i}`}>
            <span className="split-word">
              <span style={{ '--i': i, '--d': `${delay}ms` } as CSSProperties}>{w}</span>
            </span>
            {i < words.length - 1 ? ' ' : null}
          </Fragment>
        ))}
      </span>
    </>
  )
}

/**
 * A list whose items arrive one after another when it scrolls into
 * view. `variant="rack"` slides them in sideways, like modules pushed
 * into a rack.
 */
export function Stagger({
  as: Tag = 'div',
  className = '',
  variant = 'up',
  step = 60,
  children,
  ...rest
}: {
  as?: ElementType
  className?: string
  variant?: 'up' | 'rack'
  step?: number
  children: ReactNode
  role?: string
  id?: string
}) {
  const [ref, shown] = useInView<HTMLElement>()
  let i = 0
  const items = Children.map(children, (child) => {
    if (!isValidElement(child)) return child
    const el = child as ReactElement<{ style?: CSSProperties }>
    const index = i++
    return cloneElement(el, { style: { ...el.props.style, '--i': index, '--step': `${step}ms` } as CSSProperties })
  })
  return (
    <Tag ref={ref} data-stagger={variant} data-shown={shown || undefined} className={className} {...rest}>
      {items}
    </Tag>
  )
}
