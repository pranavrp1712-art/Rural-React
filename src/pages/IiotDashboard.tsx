import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Pause, Play, Table as TableIcon, ChartLine } from '@phosphor-icons/react'
import { FlowRail, Notice, PageHeader, PageSection } from '../components/pageKit'
import { Reveal } from '../components/primitives'
import { usePageMeta } from '../lib/usePageMeta'
import { useReducedMotion } from '../hooks/useReducedMotion'

/* ------------------------------------------------------------------
   Demo data.

   Every value on this page is generated in the browser. None of it
   comes from a plant, and the page says so continuously rather than in
   a footnote, because a dashboard that looks live is exactly the kind
   of thing that gets screenshotted out of context.
   ------------------------------------------------------------------ */

interface Tag {
  id: string
  tag: string
  label: string
  unit: string
  min: number
  max: number
  /** Where the generated value sits by default. */
  base: number
  /** How far a single step can move. */
  drift: number
  /** Operating band; outside this the tile reads as deviating. */
  low: number
  high: number
  decimals: number
}

const tags: Tag[] = [
  { id: 'ph', tag: 'AIT-103', label: 'pH', unit: 'pH', min: 0, max: 14, base: 7.2, drift: 0.09, low: 6.5, high: 8.5, decimals: 2 },
  { id: 'temperature', tag: 'TIT-104', label: 'Temperature', unit: 'C', min: 0, max: 60, base: 28.4, drift: 0.35, low: 20, high: 38, decimals: 1 },
  { id: 'flow', tag: 'FIT-101', label: 'Flow', unit: 'm3/h', min: 0, max: 40, base: 18.6, drift: 0.8, low: 8, high: 32, decimals: 1 },
  { id: 'pressure', tag: 'PIT-107', label: 'Pressure', unit: 'bar', min: 0, max: 10, base: 3.4, drift: 0.12, low: 2, high: 6, decimals: 2 },
  { id: 'level', tag: 'LIT-102', label: 'Level', unit: '%', min: 0, max: 100, base: 64, drift: 1.4, low: 20, high: 90, decimals: 0 },
  { id: 'energy', tag: 'JIT-201', label: 'Energy', unit: 'kW', min: 0, max: 120, base: 46, drift: 2.2, low: 0, high: 95, decimals: 0 },
]

const WINDOW = 40

/** Deterministic-ish wander that stays inside the tag's range. */
function nextValue(tag: Tag, current: number) {
  const step = (Math.random() - 0.5) * 2 * tag.drift
  // Pull gently back toward base so a long run does not wander off.
  const pull = (tag.base - current) * 0.03
  return Math.min(tag.max, Math.max(tag.min, current + step + pull))
}

function seedSeries(tag: Tag) {
  const points: { t: number; v: number }[] = []
  let value = tag.base
  for (let i = WINDOW; i > 0; i -= 1) {
    value = nextValue(tag, value)
    points.push({ t: -i, v: value })
  }
  return points
}

type Range = 'live' | '24h' | '7d' | 'historical'

const ranges: { id: Range; label: string; note: string }[] = [
  { id: 'live', label: 'Live', note: 'Updating every second' },
  { id: '24h', label: '24 Hour', note: 'Hourly averages' },
  { id: '7d', label: '7 Day', note: 'Daily averages' },
  { id: 'historical', label: 'Historical', note: 'Retained record' },
]

export default function IiotDashboard() {
  const reduced = useReducedMotion()
  const [paused, setPaused] = useState(false)
  const [range, setRange] = useState<Range>('live')
  const [asTable, setAsTable] = useState(false)
  const [selected, setSelected] = useState('ph')
  const [series, setSeries] = useState(() =>
    Object.fromEntries(tags.map((tag) => [tag.id, seedSeries(tag)])) as Record<string, { t: number; v: number }[]>,
  )
  const frame = useRef(0)

  usePageMeta({
    title: 'IIoT demo dashboard — remote plant monitoring',
    description:
      'A demonstration industrial IoT dashboard showing pH, temperature, flow, pressure, level and energy with live, 24 hour, 7 day and historical views. All values are generated demo data.',
    path: '/iiot',
  })

  // Reduced motion means the chart rests on a static final snapshot
  // rather than animating; it does not mean an empty chart.
  const streaming = range === 'live' && !paused && !reduced

  useEffect(() => {
    if (!streaming) return
    const timer = window.setInterval(() => {
      frame.current += 1
      setSeries((current) => {
        const next: typeof current = {}
        for (const tag of tags) {
          const points = current[tag.id]
          const last = points[points.length - 1]
          next[tag.id] = [...points.slice(1), { t: frame.current, v: nextValue(tag, last.v) }]
        }
        return next
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [streaming])

  const activeTag = tags.find((t) => t.id === selected) ?? tags[0]
  const activePoints = series[activeTag.id]

  const chartData = useMemo(
    () => activePoints.map((point, index) => ({ i: index, value: Number(point.v.toFixed(activeTag.decimals)) })),
    [activePoints, activeTag.decimals],
  )

  /* Frame the operating band plus whatever the data actually did, with
     a little air either side, and clamp to the sensor's real limits. */
  const domain = useMemo(() => {
    const values = chartData.map((d) => d.value)
    const lo = Math.min(activeTag.low, ...values)
    const hi = Math.max(activeTag.high, ...values)
    const pad = (hi - lo) * 0.15 || 1
    return [
      Math.max(activeTag.min, Number((lo - pad).toFixed(2))),
      Math.min(activeTag.max, Number((hi + pad).toFixed(2))),
    ] as [number, number]
  }, [chartData, activeTag])

  return (
    <>
      <PageHeader
        label="IIOT DEMO DASHBOARD"
        title="What remote monitoring actually looks like"
        intro="A working dashboard running on values generated in your browser. It is here so you can see the shape of the thing before committing to anything, not to suggest a plant is connected to this website."
        trail={[{ label: 'Home', to: '/' }, { label: 'IIoT dashboard' }]}
        aside={<DemoBadge />}
      />

      <PageSection>
        <div className="mb-8">
          <Notice tone="caution" title="DEMO DATA — NOT A REAL PLANT">
            Every reading on this page is generated by your browser for demonstration. No customer
            plant is connected to this website, and nothing shown here is, or represents, actual
            customer plant data.
          </Notice>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div role="group" aria-label="Time range" className="flex flex-wrap gap-2">
            {ranges.map((item) => {
              const on = range === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setRange(item.id)}
                  className={`min-h-11 cursor-pointer rounded-md border px-3.5 py-2 text-sm font-medium transition-[border-color,background-color,color,box-shadow] duration-150 active:scale-[0.97] ${
                    on
                      ? 'border-signal-orange bg-signal-orange/15 text-ink ring-1 ring-signal-orange/30'
                      : 'border-rule bg-sunk/70 text-ink-muted hoverable:hover:border-rule-strong hoverable:hover:bg-hover hoverable:hover:text-ink'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAsTable((v) => !v)}
              aria-pressed={asTable}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-rule bg-sunk px-3.5 py-2 text-sm font-medium text-ink-muted transition-colors duration-150 hoverable:hover:border-rule-strong hoverable:hover:text-ink"
            >
              {asTable ? <ChartLine size={16} weight="bold" aria-hidden="true" /> : <TableIcon size={16} weight="bold" aria-hidden="true" />}
              {asTable ? 'Show chart' : 'Show table'}
            </button>
            <button
              type="button"
              onClick={() => setPaused((v) => !v)}
              disabled={range !== 'live'}
              aria-pressed={paused}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-rule bg-sunk px-3.5 py-2 text-sm font-medium text-ink-muted transition-colors duration-150 hoverable:hover:border-rule-strong hoverable:hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              {paused ? <Play size={16} weight="fill" aria-hidden="true" /> : <Pause size={16} weight="fill" aria-hidden="true" />}
              {paused ? 'Resume updates' : 'Pause updates'}
            </button>
          </div>
        </div>

        {/* Tag tiles. Status is stated in words as well as colour, so the
            deviating tile does not depend on being able to see red. */}
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {tags.map((tag) => {
            const points = series[tag.id]
            const value = points[points.length - 1].v
            const previous = points[points.length - 2]?.v ?? value
            const deviating = value < tag.low || value > tag.high
            const on = selected === tag.id
            const trend = value > previous ? 'rising' : value < previous ? 'falling' : 'steady'
            return (
              <li key={tag.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => setSelected(tag.id)}
                  className={`w-full cursor-pointer rounded-xl border p-5 text-left transition-[border-color,background-color,color,box-shadow] duration-200 active:scale-[0.98] ${
                    on
                      ? 'border-signal-orange bg-hover shadow-(--shadow-e2) ring-1 ring-signal-orange/25'
                      : 'border-rule bg-card shadow-(--shadow-e1) hoverable:hover:border-rule-strong hoverable:hover:bg-hover/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-[11px] text-signal-ink">{tag.tag}</span>
                      <p className="mt-0.5 text-sm font-semibold text-ink">{tag.label}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10px] font-bold ${
                        deviating
                          ? 'border-amber-glow/40 bg-amber-glow/15 text-amber-glow'
                          : 'border-process-green/30 bg-process-green/10 text-process-ink'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`size-1.5 rounded-full ${deviating ? 'bg-amber-glow' : 'bg-process-green'} ${
                          streaming ? 'demo-led' : ''
                        }`}
                      />
                      {deviating ? 'DEVIATING' : 'NORMAL'}
                    </span>
                  </div>
                  <p className="readout mt-4 font-mono text-3xl font-bold text-ink">
                    {value.toFixed(tag.decimals)}
                    <span className="ml-1.5 text-sm font-medium text-ink-faint">{tag.unit}</span>
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-ink-faint">
                    {trend} · band {tag.low}–{tag.high} {tag.unit}
                  </p>
                </button>
              </li>
            )
          })}
        </ul>

        {/* Chart or table */}
        <div className="mt-8 rounded-xl border border-rule bg-card p-5 shadow-(--shadow-e1) md:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-ink">
                {activeTag.label}{' '}
                <span className="font-mono text-xs font-normal text-ink-faint">{activeTag.tag}</span>
              </h2>
              <p className="mt-0.5 text-xs text-ink-faint">
                {ranges.find((r) => r.id === range)?.note}
                {reduced && range === 'live' && ' · static snapshot, reduced motion respected'}
                {paused && range === 'live' && ' · paused'}
              </p>
            </div>
            <DemoBadge compact />
          </div>

          {asTable ? (
            <div className="max-h-[360px] overflow-auto rounded-lg border border-rule">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  {activeTag.label} demo readings, most recent last
                </caption>
                <thead className="sticky top-0 bg-sunk">
                  <tr className="font-mono text-[11px] tracking-wide text-ink-faint">
                    <th scope="col" className="px-4 py-2.5 font-semibold">Sample</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                      Value ({activeTag.unit})
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activePoints.map((point, index) => {
                    const deviating = point.v < activeTag.low || point.v > activeTag.high
                    return (
                      <tr key={index} className="border-t border-rule">
                        <td className="px-4 py-2 font-mono text-xs text-ink-faint">{index + 1}</td>
                        <td className="readout px-4 py-2 text-right font-mono text-ink">
                          {point.v.toFixed(activeTag.decimals)}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-xs">
                          <span className={deviating ? 'text-amber-glow' : 'text-process-ink'}>
                            {deviating ? 'Deviating' : 'Normal'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <>
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 12, right: 16, bottom: 4, left: -12 }}>
                    <defs>
                      <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-process-green)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--color-process-green)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--color-rule)" vertical={false} />
                    <XAxis
                      dataKey="i"
                      tick={{ fill: 'var(--color-ink-faint)', fontSize: 11 }}
                      tickLine={false}
                      minTickGap={32}
                      interval="preserveStartEnd"
                      axisLine={{ stroke: 'rgba(148,189,235,0.15)' }}
                    />
                    <YAxis
                      domain={domain}
                      tick={{ fill: 'var(--color-ink-faint)', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={48}
                      label={{ value: activeTag.unit, angle: -90, position: 'insideLeft', fill: 'var(--color-ink-faint)', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--color-card)',
                        border: '1px solid var(--color-rule)',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      labelStyle={{ color: 'var(--color-ink-muted)' }}
                      itemStyle={{ color: 'var(--color-ink)' }}
                      formatter={(value) => [`${value} ${activeTag.unit}`, activeTag.label] as [string, string]}
                      labelFormatter={(label) => `Sample ${label}`}
                    />
                    <ReferenceLine
                      y={activeTag.high}
                      stroke="var(--color-amber-glow)"
                      strokeDasharray="4 4"
                      strokeOpacity={0.55}
                      label={{ value: 'high limit', position: 'insideTopLeft', fill: 'var(--color-amber-glow)', fontSize: 10 }}
                    />
                    <ReferenceLine
                      y={activeTag.low}
                      stroke="var(--color-amber-glow)"
                      strokeDasharray="4 4"
                      strokeOpacity={0.55}
                      label={{ value: 'low limit', position: 'insideBottomLeft', fill: 'var(--color-amber-glow)', fontSize: 10 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="var(--color-process-green)"
                      strokeWidth={2}
                      fill="url(#trendFill)"
                      isAnimationActive={!reduced}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-3 text-xs text-ink-faint">
                Current value {activePoints[activePoints.length - 1].v.toFixed(activeTag.decimals)}{' '}
                {activeTag.unit}, operating band {activeTag.low} to {activeTag.high} {activeTag.unit}.
                Use "Show table" for the same data as text.
              </p>
            </>
          )}
        </div>
      </PageSection>

      {/* Architecture */}
      <PageSection
        tone="card"
        label="IIOT ARCHITECTURE"
        title="How a reading gets from the tank to your phone"
        intro="Seven stages, and the direction of the arrows matters more than any of them. Every connection is opened from inside the plant outward."
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1) md:p-8">
            <FlowRail
              items={[
                { id: 'plc', label: 'PLC', tag: 'OT-01', note: 'Holds the control logic. Never placed directly on the internet.' },
                { id: 'gw', label: 'Edge Gateway', tag: 'BND-02', note: 'Reads from the controller, buffers locally, publishes upward.' },
                { id: 'sec', label: 'Secure Communication', tag: 'BND-03', note: 'Outbound only. Nothing opens a connection inward.' },
                { id: 'cloud', label: 'Cloud', tag: 'IT-04', note: 'Receives what the gateway publishes.' },
                { id: 'db', label: 'Database', tag: 'IT-05', note: 'Retains readings for the period you have to prove.' },
                { id: 'dash', label: 'Dashboard', tag: 'IT-06', note: 'The view you are looking at now, on real tags.' },
                { id: 'analytics', label: 'Analytics', tag: 'IT-07', note: 'Trends, totals and consumption against output.' },
              ]}
            />
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1)">
              <h3 className="font-mono text-xs font-bold tracking-wide text-ink-faint">PROTOCOLS</h3>
              <ul className="mt-4 flex flex-wrap gap-2" role="list">
                {['Modbus RTU', 'Modbus TCP', 'OPC UA', 'MQTT', 'Ethernet', 'RS485', 'Analog', 'Digital'].map(
                  (protocol) => (
                    <li
                      key={protocol}
                      className="inline-flex items-center gap-1.5 rounded-md border border-rule bg-sunk px-2.5 py-1.5 font-mono text-xs text-ink-muted"
                    >
                      <span aria-hidden="true" className="size-1.5 rounded-full bg-process-cyan" />
                      {protocol}
                    </li>
                  ),
                )}
              </ul>
            </div>

            <Notice tone="assured" title="EXISTING EQUIPMENT, WHERE TECHNICALLY COMPATIBLE">
              Legacy controllers and meters are read over the protocols they already support.
              Compatibility is confirmed during the requirement study rather than assumed in a
              proposal.
            </Notice>

            <Reveal className="rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1)">
              <h3 className="font-mono text-xs font-bold tracking-wide text-ink-faint">
                WHAT A DASHBOARD SHOWS
              </h3>
              <ul className="mt-4 grid grid-cols-2 gap-2 text-sm text-ink-muted" role="list">
                {[
                  'pH',
                  'Temperature',
                  'Flow',
                  'Pressure',
                  'Level',
                  'Pump status',
                  'Valve status',
                  'Energy',
                  'Alarms',
                  'Device health',
                  'Communication status',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-process-green" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </PageSection>
    </>
  )
}

/** The persistent demo marker the brief requires. */
function DemoBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-sm border border-amber-glow/40 bg-amber-glow/15 font-mono font-bold tracking-wide text-amber-glow ${
        compact ? 'px-2.5 py-1 text-[10px]' : 'px-3.5 py-1.5 text-xs'
      }`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-amber-glow" />
      DEMO DATA
    </span>
  )
}
