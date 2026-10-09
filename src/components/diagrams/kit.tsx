import type { ReactNode } from 'react'

/**
 * Shared parts for the engineering diagrams.
 *
 * These draw in the same idiom as the hero signal path: ISA style
 * instrument bubbles, orthogonal runs, tags in the mono face. Colours
 * resolve through the theme tokens rather than literal hex, so the
 * diagrams follow the page if the palette changes.
 *
 * Every diagram is decorative in the accessibility tree and carries its
 * meaning in a text alternative next to it, because a screen reader
 * cannot usefully walk a P&ID.
 */

export const DIAGRAM = {
  band: 'var(--color-card)',
  card: 'var(--color-card)',
  raised: 'var(--color-hover)',
  rule: 'var(--color-rule)',
  ruleStrong: 'var(--color-rule-strong)',
  ink: 'var(--color-ink)',
  inkMuted: 'var(--color-ink-muted)',
  inkFaint: 'var(--color-ink-faint)',
  orange: 'var(--color-signal-orange)',
  green: 'var(--color-process-green)',
  cyan: 'var(--color-process-cyan)',
  amber: 'var(--color-amber-glow)',
  blue: 'var(--color-electric-blue)',
} as const

/**
 * The frame every diagram sits in: a titled panel with a drawing sheet
 * background, so a diagram reads as a drawing rather than as clip art.
 */
export function DiagramFrame({
  title,
  sheet,
  legend,
  caption,
  minWidth,
  children,
  className = '',
}: {
  title: string
  /** Drawing number, shown in the corner the way a title block would. */
  sheet?: string
  legend?: { color: string; label: string; dashed?: boolean }[]
  /** The text alternative. Required: it is what a screen reader gets. */
  caption: string
  /**
   * Narrowest width the drawing stays readable at. Below this the frame
   * scrolls horizontally instead of scaling the drawing down.
   */
  minWidth?: number
  children: ReactNode
  className?: string
}) {
  return (
    <figure
      className={`overflow-hidden rounded-xl border border-rule bg-card shadow-(--shadow-e1) ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule bg-sunk/80 px-5 py-3">
        <span className="font-mono text-xs font-semibold tracking-wide text-ink-faint">{title}</span>
        {sheet && <span className="font-mono text-[11px] text-signal-ink">{sheet}</span>}
      </div>

      <div className="relative isolate">
        <div aria-hidden="true" className="blueprint-grid absolute inset-0 -z-10 opacity-50" />
        {minWidth ? (
          <div
            className="overflow-x-auto p-4 md:p-6"
            tabIndex={0}
            role="group"
            aria-label={`${title} drawing, scrollable`}
          >
            <div style={{ minWidth }}>{children}</div>
          </div>
        ) : (
          <div className="p-4 md:p-6">{children}</div>
        )}
      </div>

      {minWidth && (
        <p className="border-t border-rule px-5 py-2 font-mono text-[10px] text-ink-faint md:hidden">
          SCROLL SIDEWAYS TO SEE THE FULL DRAWING
        </p>
      )}

      {legend && legend.length > 0 && (
        <ul className="flex flex-wrap gap-x-5 gap-y-2 border-t border-rule px-5 py-3" role="list">
          {legend.map((item) => (
            <li key={item.label} className="flex items-center gap-2 font-mono text-[11px] text-ink-faint">
              <svg width="18" height="8" aria-hidden="true" className="shrink-0">
                <line
                  x1="0"
                  y1="4"
                  x2="18"
                  y2="4"
                  stroke={item.color}
                  strokeWidth="2"
                  strokeDasharray={item.dashed ? '4 3' : undefined}
                />
              </svg>
              {item.label}
            </li>
          ))}
        </ul>
      )}

      <figcaption className="sr-only">{caption}</figcaption>
    </figure>
  )
}

/* ------------------------------------------------------------------
   Symbols
   ------------------------------------------------------------------ */

/**
 * An ISA instrument bubble: a circle carrying the tag, with a leader
 * line down to whatever it measures.
 */
export function InstrumentBubble({
  x,
  y,
  tag,
  active = false,
  leaderTo,
}: {
  x: number
  y: number
  tag: string
  active?: boolean
  /** y of the equipment the leader drops to. */
  leaderTo?: number
}) {
  const stroke = active ? DIAGRAM.orange : DIAGRAM.ruleStrong
  return (
    <g>
      {leaderTo !== undefined && (
        <line
          x1={x}
          y1={y + 15}
          x2={x}
          y2={leaderTo}
          stroke={stroke}
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      )}
      <circle
        cx={x}
        cy={y}
        r="15"
        fill={active ? DIAGRAM.raised : DIAGRAM.band}
        stroke={stroke}
        strokeWidth="1.5"
      />
      <line x1={x - 15} y1={y} x2={x + 15} y2={y} stroke={stroke} strokeWidth="1" />
      <text
        x={x}
        y={y - 4}
        textAnchor="middle"
        className="font-mono"
        fontSize="8"
        fill={active ? DIAGRAM.orange : DIAGRAM.inkFaint}
      >
        {tag.split('-')[0]}
      </text>
      <text
        x={x}
        y={y + 10}
        textAnchor="middle"
        className="font-mono"
        fontSize="8"
        fill={active ? DIAGRAM.ink : DIAGRAM.inkFaint}
      >
        {tag.split('-')[1] ?? ''}
      </text>
    </g>
  )
}

/** A vessel: tank, chamber or pit, with a liquid level suggestion. */
export function Vessel({
  x,
  y,
  w,
  h,
  label,
  active = false,
  fillLevel = 0.55,
}: {
  x: number
  y: number
  w: number
  h: number
  label: string
  active?: boolean
  fillLevel?: number
}) {
  const stroke = active ? DIAGRAM.orange : DIAGRAM.ruleStrong
  const liquidY = y + h * (1 - fillLevel)
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="3"
        fill={active ? DIAGRAM.raised : DIAGRAM.band}
        stroke={stroke}
        strokeWidth="1.5"
      />
      {/* Contents, hinted rather than drawn as a solid block. */}
      <rect
        x={x + 1.5}
        y={liquidY}
        width={w - 3}
        height={y + h - liquidY - 1.5}
        rx="2"
        fill={DIAGRAM.cyan}
        opacity={active ? 0.34 : 0.2}
      />
      <line
        x1={x + 1.5}
        y1={liquidY}
        x2={x + w - 1.5}
        y2={liquidY}
        stroke={DIAGRAM.cyan}
        strokeWidth="1"
        opacity="0.8"
      />
      <text
        x={x + w / 2}
        y={y + h + 14}
        textAnchor="middle"
        className="font-mono"
        fontSize="9"
        fill={active ? DIAGRAM.ink : DIAGRAM.inkFaint}
      >
        {label}
      </text>
    </g>
  )
}

/** A pump, drawn as the usual circle with a discharge triangle. */
export function Pump({ x, y, active = false }: { x: number; y: number; active?: boolean }) {
  const stroke = active ? DIAGRAM.orange : DIAGRAM.ruleStrong
  return (
    <g>
      <circle cx={x} cy={y} r="11" fill={DIAGRAM.band} stroke={stroke} strokeWidth="1.5" />
      <path d={`M${x - 5} ${y - 6} L${x + 7} ${y} L${x - 5} ${y + 6} Z`} fill={stroke} opacity="0.8" />
    </g>
  )
}

/** A generic equipment box: controller, gateway, panel, cloud. */
export function DeviceBox({
  x,
  y,
  w,
  h,
  label,
  tag,
  tone = 'neutral',
  active = false,
}: {
  x: number
  y: number
  w: number
  h: number
  label: string
  tag?: string
  tone?: 'neutral' | 'orange' | 'green' | 'cyan' | 'amber'
  active?: boolean
}) {
  const toneColor =
    tone === 'orange'
      ? DIAGRAM.orange
      : tone === 'green'
        ? DIAGRAM.green
        : tone === 'cyan'
          ? DIAGRAM.cyan
          : tone === 'amber'
            ? DIAGRAM.amber
            : DIAGRAM.ruleStrong
  const stroke = active ? DIAGRAM.orange : toneColor
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="4"
        fill={active ? DIAGRAM.raised : DIAGRAM.card}
        stroke={stroke}
        strokeWidth="1.5"
      />
      {/* A coloured cap, the way a labelled module carries its type. */}
      <path
        d={`M${x + 4} ${y} h${w - 8} a4 4 0 0 1 4 4 v2 h-${w} v-2 a4 4 0 0 1 4 -4 z`}
        fill={stroke}
        opacity="0.55"
      />
      <text
        x={x + w / 2}
        y={y + h / 2 + (tag ? -1 : 3)}
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        fill={DIAGRAM.ink}
      >
        {label}
      </text>
      {tag && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 11}
          textAnchor="middle"
          className="font-mono"
          fontSize="8"
          fill={DIAGRAM.inkFaint}
        >
          {tag}
        </text>
      )}
    </g>
  )
}

/**
 * A run between two points. `kind` picks the visual language: a process
 * pipe is heavy, a signal is thin, and a cloud link is dashed because
 * it is the one that is allowed to be absent.
 */
export function Run({
  d,
  kind = 'signal',
  active = false,
  arrow = true,
}: {
  d: string
  kind?: 'pipe' | 'signal' | 'link'
  active?: boolean
  arrow?: boolean
}) {
  if (kind === 'pipe') {
    return (
      <>
        <path d={d} fill="none" stroke={DIAGRAM.ruleStrong} strokeWidth="6" strokeLinecap="round" />
        <path
          d={d}
          fill="none"
          stroke={active ? DIAGRAM.orange : DIAGRAM.cyan}
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity={active ? 0.9 : 0.45}
          markerEnd={arrow ? 'url(#arrow-flow)' : undefined}
        />
      </>
    )
  }
  return (
    <path
      d={d}
      fill="none"
      stroke={active ? DIAGRAM.orange : DIAGRAM.ruleStrong}
      strokeWidth="1.5"
      strokeDasharray={kind === 'link' ? '5 4' : undefined}
      markerEnd={arrow ? 'url(#arrow-signal)' : undefined}
    />
  )
}

/** Arrow markers, defined once per diagram. */
export function DiagramDefs() {
  return (
    <defs>
      <marker id="arrow-flow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto">
        <path d="M0 1 L7 4 L0 7 z" fill={DIAGRAM.cyan} opacity="0.8" />
      </marker>
      <marker id="arrow-signal" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto">
        <path d="M0 1 L7 4 L0 7 z" fill={DIAGRAM.ruleStrong} />
      </marker>
      <marker id="arrow-out" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto">
        <path d="M0 1 L7 4 L0 7 z" fill={DIAGRAM.green} />
      </marker>
    </defs>
  )
}

/** A zone band: the OT / boundary / IT separation on the architecture. */
export function Zone({
  x,
  y,
  w,
  h,
  label,
  color,
}: {
  x: number
  y: number
  w: number
  h: number
  label: string
  color: string
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="6"
        fill={color}
        fillOpacity="0.05"
        stroke={color}
        strokeOpacity="0.35"
        strokeWidth="1"
        strokeDasharray="6 4"
      />
      <text x={x + 10} y={y + 16} className="font-mono" fontSize="9" fontWeight="700" fill={color}>
        {label}
      </text>
    </g>
  )
}
