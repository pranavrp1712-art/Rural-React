import { useState } from 'react'

interface PathNode {
  id: string
  label: string
  tag: string
  x: number
  y: number
  step: number
  metric: string
  desc: string
}

/** Pulse start and travel time, matched to .signal-wire-pulse in index.css. */
const PULSE_DELAY = 0.4
const PULSE_TRAVEL = 3.2

const nodes: PathNode[] = [
  { id: 'process', label: 'Process', tag: 'P-000', x: 80, y: 64, step: 0, metric: 'Raw Effluent • 24.2 m³/h', desc: 'Equalization tank inflow with submerged agitator' },
  { id: 'sensor', label: 'Sensor', tag: 'AIT-101', x: 240, y: 64, step: 1, metric: 'pH Sensor • 7.42 pH', desc: 'Industrial glass electrode with auto-temperature compensation' },
  { id: 'transmitter', label: 'Transmitter', tag: 'AIT-101T', x: 400, y: 64, step: 2, metric: 'Loop Current • 12.8 mA', desc: '4-20mA two-wire transmitter with digital field display' },
  { id: 'plc', label: 'PLC', tag: 'PLC-01', x: 560, y: 64, step: 3, metric: 'Logic Cycle • 14ms', desc: 'Real-time deterministic PID dosing controller' },
  { id: 'panel', label: 'Panel', tag: 'PNL-01', x: 400, y: 208, step: 4, metric: 'Dosing Drive • 65% VFD', desc: 'IP55 enclosure with safety interlocks & surge protection' },
  { id: 'gateway', label: 'Gateway', tag: 'GW-01', x: 240, y: 208, step: 5, metric: 'MQTT Link • TLS 1.3', desc: 'Edge gateway buffering offline logs with cellular uplink' },
  { id: 'cloud', label: 'Cloud', tag: 'CLD-01', x: 80, y: 208, step: 6, metric: 'Live Stream • Synced', desc: 'Cloud telemetry & historical compliance database' },
]

/** The wire, drawn as orthogonal runs the way a loop diagram would be. */
const WIRE = 'M80 64 H560 V208 H80'

function NodeGlyph({ id, active }: { id: string; active: boolean }) {
  const stroke = active ? 'var(--color-signal-orange)' : 'var(--color-band-ink)'
  const common = { fill: 'none', stroke, strokeWidth: 1.6 }

  switch (id) {
    case 'process':
      return (
        <g>
          <path d="M-14 -16 h28 v32 h-28 z" {...common} />
          <path d="M-14 2 h28" stroke="var(--color-process-green)" strokeWidth="1.6" fill="none" />
          <path d="M-14 6 h28" stroke="var(--color-process-green)" strokeWidth="1.2" opacity="0.6" fill="none" />
        </g>
      )
    case 'sensor':
      return (
        <g>
          <circle r="13" {...common} />
          <path d="M0 -13 v26" {...common} />
          <path d="M-6 -4 h12" {...common} />
        </g>
      )
    case 'transmitter':
      return (
        <g>
          <path d="M-14 -12 h28 v24 h-28 z" {...common} />
          <path d="M-7 -12 v24" {...common} />
        </g>
      )
    case 'plc':
      return (
        <g>
          <path d="M-16 -14 h32 v28 h-32 z" {...common} />
          <path d="M-8 -14 v28M0 -14 v28M8 -14 v28" {...common} strokeWidth="1.2" />
        </g>
      )
    case 'panel':
      return (
        <g>
          <path d="M-16 -16 h32 v32 h-32 z" {...common} />
          <path d="M0 -16 v32" {...common} strokeWidth="1.2" />
          <path d="M-4 0 h-4" {...common} />
        </g>
      )
    case 'gateway':
      return (
        <g>
          <path d="M-14 -6 h28 v18 h-28 z" {...common} />
          <path d="M0 -6 v-12" {...common} />
          <path d="M-6 -22 a8 8 0 0 1 12 0" {...common} strokeWidth="1.2" />
        </g>
      )
    case 'cloud':
      return (
        <g>
          <path
            d="M-16 8 a9 9 0 0 1 2 -17 a12 12 0 0 1 23 -2 a8 8 0 0 1 7 19 z"
            {...common}
          />
        </g>
      )
    default:
      return null
  }
}

export function SignalPath() {
  const [activeId, setActiveId] = useState<string>('plc')
  const activeNode = nodes.find((n) => n.id === activeId) ?? nodes[3]

  return (
    <div className="flex flex-col">
      <svg
        viewBox="0 0 640 280"
        role="img"
        aria-label="Signal path from the process through sensor, transmitter, PLC, control panel and IIoT gateway to the cloud."
        className="h-auto w-full select-none"
      >
        {/* The 4-20 mA loop wire, then the pulse that travels it once. */}
        <path d={WIRE} fill="none" stroke="var(--color-band-rule)" strokeWidth="2" />
        <path
          d={WIRE}
          fill="none"
          stroke="var(--color-signal-orange)"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="signal-wire-pulse"
        />

        {nodes.map((node) => {
          const isSelected = node.id === activeId
          return (
            <g
              key={node.id}
              transform={`translate(${node.x} ${node.y})`}
              className="cursor-pointer outline-none [&:focus-visible>circle:first-of-type]:stroke-signal-orange"
              onClick={() => setActiveId(node.id)}
              onMouseEnter={() => setActiveId(node.id)}
              role="button"
              tabIndex={0}
              aria-label={`${node.label}, ${node.tag}`}
              aria-pressed={isSelected}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setActiveId(node.id)
                }
              }}
            >
              {/* Node plate */}
              <circle
                r="26"
                fill={isSelected ? 'var(--color-band-high)' : 'var(--color-band)'}
                stroke={isSelected ? 'var(--color-signal-orange)' : 'var(--color-band-rule)'}
                strokeWidth={isSelected ? '2' : '1.5'}
                className="transition-colors duration-200"
              />

              <NodeGlyph id={node.id} active={isSelected} />

              {/* Status LED */}
              <circle
                cx="19"
                cy="-19"
                r="3.5"
                fill="var(--color-process-green)"
                className="signal-led"
                style={{
                  animationDelay: `${PULSE_DELAY + (node.step / (nodes.length - 1)) * PULSE_TRAVEL}s`,
                }}
              />

              {/* Top row / bottom row labels */}
              <text
                y={node.y < 140 ? -42 : 44}
                textAnchor="middle"
                fill="var(--color-band-ink)"
                fontSize="13"
                fontWeight="600"
                fontFamily="var(--font-display)"
                className="transition-colors duration-200"
              >
                {node.label}
              </text>
              <text
                y={node.y < 140 ? -28 : 60}
                textAnchor="middle"
                fill={isSelected ? 'var(--color-signal-ink)' : 'var(--color-band-ink-faint)'}
                fontSize="10"
                fontFamily="var(--font-mono)"
                className="transition-colors duration-200"
              >
                {node.tag}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Interactive telemetry chip for inspected node */}
      <div className="mt-4 rounded-md border border-band-rule bg-band-raised p-3" aria-live="polite">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-signal-ink">
              {activeNode.tag}
            </span>
            <span aria-hidden="true" className="h-3 w-px bg-band-rule" />
            <span className="text-sm font-semibold text-band-ink">
              {activeNode.label}
            </span>
            <span className="readout rounded-sm bg-process-green/15 px-2 py-0.5 font-mono text-[11px] text-process-ink">
              {activeNode.metric}
            </span>
          </div>
          <span className="font-mono text-[11px] text-band-ink-faint">
            Select a node
          </span>
        </div>
        <p className="mt-1.5 text-sm text-band-ink-muted">
          {activeNode.desc}
        </p>
      </div>
    </div>
  )
}
