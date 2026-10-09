import type { ProcessStage } from '../../data/industries'
import { DIAGRAM, DiagramDefs, DiagramFrame, InstrumentBubble, Pump, Run, Vessel } from './kit'
import { useMediaQuery } from '../../hooks/useMediaQuery'

/**
 * A P&ID style view of the selected process stages: vessels connected
 * by pipe runs, each with its instrument bubble on a leader line.
 *
 * Rows always read left to right. A serpentine would save a little
 * width but makes every second row run backwards against the labels,
 * so instead a row break is drawn the way a real multi-sheet drawing
 * does it: an outgoing continuation marker and a matching incoming one.
 */

const CELL = 168
const ROW_H = 208
/* A wrapped drawing needs room on the left for the incoming
   continuation marker; a single row does not. */
const PAD_SINGLE = 34
const PAD_WRAPPED = 52

export function ProcessDiagram({
  stages,
  selected,
  onSelect,
}: {
  stages: ProcessStage[]
  selected?: string
  onSelect?: (id: string) => void
}) {
  /* Fewer columns on a narrow screen. Keeping four would scale the
     whole drawing down until the tags were unreadable, which is worse
     than a taller diagram. */
  const narrow = useMediaQuery('(max-width: 640px)')
  const medium = useMediaQuery('(max-width: 1024px)')
  const PER_ROW = narrow ? 2 : medium ? 3 : 4

  if (stages.length === 0) {
    return (
      <DiagramFrame title="PROCESS DIAGRAM" sheet="P&ID-01" caption="No process stages selected.">
        <p className="py-14 text-center text-sm text-ink-faint">
          No stages selected. Choose at least one to draw the line.
        </p>
      </DiagramFrame>
    )
  }

  const perRow = Math.min(stages.length, PER_ROW)
  const rows = Math.ceil(stages.length / PER_ROW)
  const pad = rows > 1 ? PAD_WRAPPED : PAD_SINGLE
  const width = perRow * CELL + pad * 2
  const height = rows * ROW_H + 24

  const position = (index: number) => ({
    x: pad + (index % PER_ROW) * CELL,
    y: 70 + Math.floor(index / PER_ROW) * ROW_H,
    row: Math.floor(index / PER_ROW),
    col: index % PER_ROW,
  })

  const isPumped = (stage: ProcessStage) =>
    /pump|dosing|transfer|dewater/i.test(`${stage.id} ${stage.label}`)

  return (
    <DiagramFrame
      title="PROCESS DIAGRAM"
      sheet={`P&ID-01 · ${stages.length} STAGES`}
      legend={[
        { color: DIAGRAM.cyan, label: 'Process flow' },
        { color: DIAGRAM.ruleStrong, label: 'Instrument leader', dashed: true },
        { color: DIAGRAM.orange, label: 'Selected stage' },
      ]}
      caption={`Process diagram, flowing left to right across ${rows} row${
        rows > 1 ? 's' : ''
      }: ${stages.map((s) => `${s.label} (${s.tag})`).join(', then ')}. Each stage carries an instrument reporting to the controller.`}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full select-none"
        aria-hidden="true"
      >
        <DiagramDefs />

        {/* Pipe runs. Within a row it is a straight connection; at a row
            end it becomes a pair of continuation markers. */}
        {stages.slice(0, -1).map((stage, index) => {
          const from = position(index)
          const to = position(index + 1)
          const active = stage.id === selected || stages[index + 1].id === selected

          if (from.row === to.row) {
            return (
              <Run
                key={stage.id}
                d={`M${from.x + 62} ${from.y + 30} H${to.x - 4}`}
                kind="pipe"
                active={active}
              />
            )
          }

          // Row break: leave to the right, re-enter from the left below.
          const outX = from.x + 62
          const inX = to.x - 22
          return (
            <g key={stage.id}>
              <Run d={`M${outX} ${from.y + 30} H${outX + 26}`} kind="pipe" active={active} />
              <circle
                cx={outX + 34}
                cy={from.y + 30}
                r="8"
                fill={DIAGRAM.band}
                stroke={DIAGRAM.cyan}
                strokeWidth="1.2"
              />
              <text
                x={outX + 34}
                y={from.y + 33}
                textAnchor="middle"
                className="font-mono"
                fontSize="7"
                fill={DIAGRAM.cyan}
              >
                {to.row + 1}
              </text>

              <circle
                cx={inX - 12}
                cy={to.y + 30}
                r="8"
                fill={DIAGRAM.band}
                stroke={DIAGRAM.cyan}
                strokeWidth="1.2"
              />
              <text
                x={inX - 12}
                y={to.y + 33}
                textAnchor="middle"
                className="font-mono"
                fontSize="7"
                fill={DIAGRAM.cyan}
              >
                {to.row + 1}
              </text>
              <Run d={`M${inX - 4} ${to.y + 30} H${to.x - 4}`} kind="pipe" active={active} />
            </g>
          )
        })}

        {stages.map((stage, index) => {
          const { x, y } = position(index)
          const active = stage.id === selected
          const pumped = isPumped(stage)

          return (
            <g
              key={stage.id}
              onClick={() => onSelect?.(stage.id)}
              className={onSelect ? 'cursor-pointer' : undefined}
            >
              {onSelect && (
                <rect x={x - 16} y={y - 48} width={CELL - 20} height={150} fill="transparent" />
              )}

              <InstrumentBubble x={x + 30} y={y - 22} tag={stage.tag} active={active} leaderTo={y} />

              <Vessel x={x} y={y} w={60} h={58} label="" active={active} fillLevel={pumped ? 0.32 : 0.55} />

              {/* A pumped stage carries its pump on the discharge side,
                  clear of the label band below. */}
              {pumped && (
                <>
                  <Run d={`M${x + 30} ${y + 58} V${y + 68}`} kind="pipe" active={active} arrow={false} />
                  <Pump x={x + 30} y={y + 80} active={active} />
                </>
              )}

              {/* Label band, below everything, so nothing collides. */}
              <text
                x={x + 30}
                y={pumped ? y + 108 : y + 78}
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                fill={active ? DIAGRAM.ink : DIAGRAM.inkMuted}
              >
                {stage.label.length > 18 ? `${stage.label.slice(0, 17)}…` : stage.label}
              </text>
              {stage.optional && (
                <text
                  x={x + 30}
                  y={pumped ? y + 120 : y + 90}
                  textAnchor="middle"
                  className="font-mono"
                  fontSize="7"
                  fill={DIAGRAM.inkFaint}
                >
                  OPTIONAL
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </DiagramFrame>
  )
}
