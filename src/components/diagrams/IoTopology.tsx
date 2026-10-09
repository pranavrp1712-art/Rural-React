import { DIAGRAM, DiagramDefs, DiagramFrame } from './kit'
import { cardCount, moduleSize, type IoTotals } from '../../data/configurators'

/**
 * The recommended I/O drawn as a populated controller rack, so the
 * numbers in the results table have a physical shape: this many cards,
 * of these types, in this order, with the spare slots visible.
 */

const CARD_W = 30
const CARD_GAP = 4
const RACK_Y = 56
const CARD_H = 92

interface Card {
  kind: 'cpu' | 'di' | 'do' | 'ai' | 'ao' | 'relay' | 'spare'
  label: string
  points?: number
  color: string
}

export function IoTopology({ recommended }: { recommended: IoTotals }) {
  const cards: Card[] = [{ kind: 'cpu', label: 'CPU', color: DIAGRAM.orange }]

  const add = (kind: Card['kind'], label: string, points: number, size: number, color: string) => {
    const count = cardCount(points, size)
    for (let i = 0; i < count; i += 1) {
      cards.push({ kind, label, points: size, color })
    }
  }

  add('di', 'DI', recommended.di, moduleSize.di, DIAGRAM.cyan)
  add('do', 'DO', recommended.do, moduleSize.do, DIAGRAM.green)
  add('ai', 'AI', recommended.ai, moduleSize.ai, DIAGRAM.blue)
  add('ao', 'AO', recommended.ao, moduleSize.ao, DIAGRAM.amber)
  add('relay', 'RLY', recommended.relay, moduleSize.relay, DIAGRAM.inkMuted)

  const populated = cards.length
  // Always draw two spare slots; expansion room is part of the point.
  cards.push({ kind: 'spare', label: 'SPARE', color: DIAGRAM.rule })
  cards.push({ kind: 'spare', label: 'SPARE', color: DIAGRAM.rule })

  const rackW = cards.length * (CARD_W + CARD_GAP) + 16
  const width = Math.max(620, rackW + 40)
  const height = 210
  // Centre a short rack rather than stretching the drawing to fit it.
  const originX = Math.max(20, (width - rackW) / 2)

  const empty = populated <= 1

  return (
    <DiagramFrame
      title="CONTROLLER RACK"
      sheet={`RACK-01 · ${populated} CARDS`}
      legend={[
        { color: DIAGRAM.cyan, label: 'Digital in' },
        { color: DIAGRAM.green, label: 'Digital out' },
        { color: DIAGRAM.blue, label: 'Analog in' },
        { color: DIAGRAM.amber, label: 'Analog out' },
      ]}
      minWidth={600}
      caption={
        empty
          ? 'Controller rack with a CPU and two spare slots. No I/O cards yet: enter device counts to populate it.'
          : `Controller rack populated with a CPU and ${populated - 1} I/O cards: ${recommended.di} digital inputs, ${recommended.do} digital outputs, ${recommended.ai} analog inputs, ${recommended.ao} analog outputs and ${recommended.relay} relay outputs, plus two spare slots.`
      }
    >
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full select-none" aria-hidden="true">
        <DiagramDefs />

        {/* DIN rail the rack seats on */}
        <rect x={originX - 8} y={RACK_Y - 12} width={rackW} height="8" rx="2" fill={DIAGRAM.rule} />
        <rect
          x={originX - 8}
          y={RACK_Y + CARD_H + 4}
          width={rackW}
          height="8"
          rx="2"
          fill={DIAGRAM.rule}
        />

        {cards.map((card, index) => {
          const x = originX + index * (CARD_W + CARD_GAP)
          const spare = card.kind === 'spare'
          return (
            <g key={index}>
              <rect
                x={x}
                y={RACK_Y}
                width={CARD_W}
                height={CARD_H}
                rx="3"
                fill={spare ? 'transparent' : DIAGRAM.band}
                stroke={card.color}
                strokeWidth="1.4"
                strokeDasharray={spare ? '4 3' : undefined}
                opacity={spare ? 0.55 : 1}
              />
              {/* Type cap */}
              {!spare && (
                <rect x={x} y={RACK_Y} width={CARD_W} height="5" rx="2" fill={card.color} opacity="0.7" />
              )}
              <text
                x={x + CARD_W / 2}
                y={RACK_Y + 22}
                textAnchor="middle"
                className="font-mono"
                fontSize="9"
                fontWeight="700"
                fill={spare ? DIAGRAM.inkFaint : card.color}
              >
                {card.label}
              </text>
              {card.points && (
                <text
                  x={x + CARD_W / 2}
                  y={RACK_Y + 34}
                  textAnchor="middle"
                  className="font-mono"
                  fontSize="7"
                  fill={DIAGRAM.inkFaint}
                >
                  x{card.points}
                </text>
              )}
              {/* Terminal points down the card face */}
              {!spare &&
                card.kind !== 'cpu' &&
                Array.from({ length: 6 }).map((_, t) => (
                  <line
                    key={t}
                    x1={x + 6}
                    y1={RACK_Y + 46 + t * 7}
                    x2={x + CARD_W - 6}
                    y2={RACK_Y + 46 + t * 7}
                    stroke={DIAGRAM.ruleStrong}
                    strokeWidth="1"
                    opacity="0.6"
                  />
                ))}
              {card.kind === 'cpu' && (
                <>
                  <circle cx={x + 10} cy={RACK_Y + 50} r="2.5" fill={DIAGRAM.green} />
                  <circle cx={x + 20} cy={RACK_Y + 50} r="2.5" fill={DIAGRAM.green} opacity="0.4" />
                  <rect
                    x={x + 6}
                    y={RACK_Y + 62}
                    width={CARD_W - 12}
                    height="10"
                    rx="2"
                    fill="none"
                    stroke={DIAGRAM.ruleStrong}
                    strokeWidth="1"
                  />
                  <rect
                    x={x + 6}
                    y={RACK_Y + 76}
                    width={CARD_W - 12}
                    height="10"
                    rx="2"
                    fill="none"
                    stroke={DIAGRAM.ruleStrong}
                    strokeWidth="1"
                  />
                </>
              )}
            </g>
          )
        })}

        {/* Field wiring leaving the rack */}
        <path
          d={`M${originX} ${RACK_Y + CARD_H + 26} H${originX + rackW - 16}`}
          fill="none"
          stroke={DIAGRAM.ruleStrong}
          strokeWidth="1.5"
        />
        {!empty &&
          cards.slice(1, -2).map((card, index) => {
            const x = originX + (index + 1) * (CARD_W + CARD_GAP) + CARD_W / 2
            return (
              <path
                key={index}
                d={`M${x} ${RACK_Y + CARD_H + 12} V${RACK_Y + CARD_H + 26}`}
                stroke={card.color}
                strokeWidth="1.2"
                opacity="0.7"
              />
            )
          })}
        <text
          x={originX}
          y={RACK_Y + CARD_H + 42}
          className="font-mono"
          fontSize="8"
          fill={DIAGRAM.inkFaint}
        >
          TO FIELD TERMINALS
        </text>

        <text x={originX} y={30} className="font-mono" fontSize="9" fill={DIAGRAM.inkFaint}>
          {empty ? 'NO CARDS — ENTER DEVICE COUNTS' : `${populated} CARDS + 2 SPARE SLOTS`}
        </text>
      </svg>
    </DiagramFrame>
  )
}
