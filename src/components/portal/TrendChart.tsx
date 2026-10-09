import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Point } from '../../data/portalTypes'

/**
 * One series, one axis, one hue: the chart title names the series, so
 * there is no legend. Hovering or focusing gives a crosshair and the
 * exact value; the table under the chart is the non-visual route.
 */
export function TrendChart({
  title,
  points,
  unit = '',
  height = 180,
}: {
  title: string
  points: Point[]
  unit?: string
  height?: number
}) {
  const total = points.reduce((a, p) => a + p.value, 0)
  const first = points[0]?.value ?? 0
  const last = points[points.length - 1]?.value ?? 0
  const peak = points.reduce((a, p) => (p.value > a.value ? p : a), points[0])

  return (
    <figure className="min-w-0 rounded-lg border border-rule bg-card p-4 shadow-(--shadow-e1)">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-ink">{title}</span>
        <span className="text-xs text-ink-faint">Last 30 days</span>
      </figcaption>
      <p className="readout mt-1 font-display text-2xl font-semibold text-ink">
        {total.toLocaleString('en-IN')}
        {unit}
      </p>
      <p className="sr-only">
        {title}: {total} over 30 days, from {first} per day to {last} per day, peaking at {peak?.value} on {peak?.label}.
      </p>

      <div style={{ height }} className="mt-2" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid stroke="var(--color-rule)" strokeOpacity={0.7} vertical={false} />
            <XAxis
              dataKey="label"
              interval={6}
              tickLine={false}
              axisLine={{ stroke: 'var(--color-rule)' }}
              tick={{ fill: 'var(--color-ink-faint)', fontSize: 11 }}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={48}
              tick={{ fill: 'var(--color-ink-faint)', fontSize: 11 }}
            />
            <Tooltip
              cursor={{ stroke: 'var(--color-rule-strong)', strokeWidth: 1 }}
              contentStyle={{
                background: 'var(--color-card)',
                border: '1px solid var(--color-rule)',
                borderRadius: 3,
                fontSize: 12,
                boxShadow: 'var(--shadow-e2)',
              }}
              labelStyle={{ color: 'var(--color-ink-muted)', marginBottom: 2 }}
              itemStyle={{ color: 'var(--color-ink)', padding: 0 }}
              formatter={(v) => [`${Number(v).toLocaleString('en-IN')}${unit}`, title]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-electric-blue)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: 'var(--color-card)', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <details className="mt-2 text-xs">
        <summary className="inline-flex min-h-8 items-center text-ink-muted hoverable:hover:text-ink">View as table</summary>
        <div className="mt-2 max-h-48 overflow-y-auto rounded-sm border border-rule">
          <table className="w-full text-left">
            <caption className="sr-only">{title}, daily values</caption>
            <thead>
              <tr className="bg-sunk">
                <th scope="col" className="px-3 py-1.5 font-semibold text-ink-muted">Day</th>
                <th scope="col" className="px-3 py-1.5 text-right font-semibold text-ink-muted">{title}</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.t} className="border-t border-rule">
                  <td className="px-3 py-1 text-ink-muted">{p.label}</td>
                  <td className="readout px-3 py-1 text-right font-mono text-ink">{p.value.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  )
}
