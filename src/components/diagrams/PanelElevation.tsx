import { DIAGRAM, DiagramFrame } from './kit'

/**
 * A general arrangement elevation of the configured panel, drawn to
 * scale from the estimated dimensions with the selected components laid
 * out on DIN rails and dimension lines down two sides.
 *
 * It replaces a box with three numbers next to it. The drawing is still
 * an estimate, and the page says so; what it adds is a sense of whether
 * the estimate is a wall box or a floor standing cubicle.
 */

interface Enclosure {
  width: number
  height: number
  depth: number
  hasHmi: boolean
}

export function PanelElevation({
  enclosure,
  components,
  vfdCount,
}: {
  enclosure: Enclosure
  components: string[]
  vfdCount: number
}) {
  // Draw to scale inside a fixed canvas, so a 600mm box and a 2000mm
  // cubicle actually look different.
  const scale = Math.min(230 / enclosure.height, 260 / enclosure.width)
  const w = enclosure.width * scale
  const h = enclosure.height * scale
  const x = 70
  const y = 34

  const has = (id: string) => components.includes(id)
  const floorStanding = enclosure.height >= 1200

  // Rails are laid out top to bottom the way a real GA would be:
  // incomer and protection high, control in the middle, terminals low.
  const rails = [
    { label: 'INCOMER / PROTECTION', items: [has('mccb') && 'MCCB', has('mcb') && 'MCB', has('surge') && 'SPD'] },
    { label: 'POWER / DRIVES', items: [vfdCount > 0 && `VFD x${vfdCount}`, has('contactors') && 'CONT', has('overload') && 'OLR'] },
    { label: 'CONTROL', items: [has('plc') && 'PLC', has('smps') && 'SMPS', has('relayModules') && 'RLY'] },
    { label: 'COMMS', items: [has('switch') && 'SW', has('gateway') && 'GW', has('ups') && 'UPS'] },
    { label: 'FIELD TERMINALS', items: [has('terminals') && 'TB', has('safetyRelay') && 'SR'] },
  ]
    .map((rail) => ({ ...rail, items: rail.items.filter(Boolean) as string[] }))
    .filter((rail) => rail.items.length > 0)

  const railTop = enclosure.hasHmi ? y + h * 0.3 : y + 14
  const railSpace = (y + h - 16 - railTop) / Math.max(rails.length, 1)

  return (
    <DiagramFrame
      title="PANEL GENERAL ARRANGEMENT"
      sheet="GA-01 · ESTIMATE"
      legend={[
        { color: DIAGRAM.orange, label: 'Enclosure' },
        { color: DIAGRAM.cyan, label: 'Component' },
        { color: DIAGRAM.inkFaint, label: 'Dimension', dashed: true },
      ]}
      minWidth={420}
      caption={`Panel general arrangement estimate: ${enclosure.width} by ${enclosure.height} by ${enclosure.depth} millimetres, ${
        floorStanding ? 'floor standing' : 'wall mounted'
      }${enclosure.hasHmi ? ', with an HMI on the door' : ''}. Rails from top to bottom: ${
        rails.map((r) => r.label.toLowerCase()).join(', ') || 'none selected'
      }.`}
    >
      <svg viewBox="0 0 400 300" className="h-auto w-full select-none" aria-hidden="true">
        {/* Enclosure body */}
        <rect x={x} y={y} width={w} height={h} rx="3" fill={DIAGRAM.band} stroke={DIAGRAM.orange} strokeWidth="2" />
        {/* Door seam and handle */}
        <line x1={x + w - 10} y1={y + 6} x2={x + w - 10} y2={y + h - 6} stroke={DIAGRAM.rule} strokeWidth="1" strokeDasharray="3 3" />
        <rect x={x + w - 7} y={y + h / 2 - 8} width="3" height="16" rx="1.5" fill={DIAGRAM.ruleStrong} />

        {/* HMI on the door */}
        {enclosure.hasHmi && (
          <g>
            <rect
              x={x + w / 2 - w * 0.22}
              y={y + 14}
              width={w * 0.44}
              height={h * 0.13}
              rx="2"
              fill={DIAGRAM.card}
              stroke={DIAGRAM.cyan}
              strokeWidth="1.4"
            />
            <rect
              x={x + w / 2 - w * 0.19}
              y={y + 18}
              width={w * 0.38}
              height={h * 0.13 - 8}
              rx="1"
              fill={DIAGRAM.cyan}
              opacity="0.18"
            />
            <text
              x={x + w / 2}
              y={y + 14 + h * 0.13 + 9}
              textAnchor="middle"
              className="font-mono"
              fontSize="7"
              fill={DIAGRAM.cyan}
            >
              HMI
            </text>
          </g>
        )}

        {/* DIN rails with the selected components seated on them */}
        {rails.map((rail, index) => {
          const ry = railTop + index * railSpace
          return (
            <g key={rail.label}>
              <rect x={x + 8} y={ry + railSpace * 0.55} width={w - 26} height="3" rx="1.5" fill={DIAGRAM.rule} />
              {rail.items.map((item, i) => {
                const slotW = Math.max(16, (w - 34) / Math.max(rail.items.length, 3) - 4)
                const ix = x + 12 + i * (slotW + 4)
                return (
                  <g key={item}>
                    <rect
                      x={ix}
                      y={ry + railSpace * 0.55 - Math.min(16, railSpace * 0.42)}
                      width={slotW}
                      height={Math.min(16, railSpace * 0.42)}
                      rx="1.5"
                      fill={DIAGRAM.card}
                      stroke={DIAGRAM.cyan}
                      strokeWidth="1"
                      opacity="0.9"
                    />
                    <text
                      x={ix + slotW / 2}
                      y={ry + railSpace * 0.55 - 5}
                      textAnchor="middle"
                      className="font-mono"
                      fontSize="6"
                      fill={DIAGRAM.inkMuted}
                    >
                      {item}
                    </text>
                  </g>
                )
              })}
              <text
                x={x + w + 8}
                y={ry + railSpace * 0.58}
                className="font-mono"
                fontSize="6.5"
                fill={DIAGRAM.inkFaint}
              >
                {rail.label}
              </text>
            </g>
          )
        })}

        {rails.length === 0 && (
          <text
            x={x + w / 2}
            y={y + h / 2}
            textAnchor="middle"
            className="font-mono"
            fontSize="8"
            fill={DIAGRAM.inkFaint}
          >
            NO COMPONENTS SELECTED
          </text>
        )}

        {/* Plinth on a floor standing cubicle */}
        {floorStanding && (
          <rect x={x - 4} y={y + h} width={w + 8} height="7" rx="1" fill={DIAGRAM.rule} />
        )}

        {/* Dimension lines, drawn the way a GA would carry them */}
        <g stroke={DIAGRAM.inkFaint} strokeWidth="0.8" opacity="0.8">
          {/* Height, on the left */}
          <line x1={x - 22} y1={y} x2={x - 22} y2={y + h} strokeDasharray="3 2" />
          <line x1={x - 26} y1={y} x2={x - 18} y2={y} />
          <line x1={x - 26} y1={y + h} x2={x - 18} y2={y + h} />
          {/* Width, along the bottom */}
          <line x1={x} y1={y + h + (floorStanding ? 22 : 16)} x2={x + w} y2={y + h + (floorStanding ? 22 : 16)} strokeDasharray="3 2" />
          <line x1={x} y1={y + h + (floorStanding ? 18 : 12)} x2={x} y2={y + h + (floorStanding ? 26 : 20)} />
          <line x1={x + w} y1={y + h + (floorStanding ? 18 : 12)} x2={x + w} y2={y + h + (floorStanding ? 26 : 20)} />
        </g>
        <text
          x={x - 28}
          y={y + h / 2}
          textAnchor="middle"
          transform={`rotate(-90 ${x - 28} ${y + h / 2})`}
          className="font-mono"
          fontSize="8"
          fill={DIAGRAM.inkFaint}
        >
          {enclosure.height} mm
        </text>
        <text
          x={x + w / 2}
          y={y + h + (floorStanding ? 36 : 30)}
          textAnchor="middle"
          className="font-mono"
          fontSize="8"
          fill={DIAGRAM.inkFaint}
        >
          {enclosure.width} mm
        </text>

        {/* Depth, as a plan hint rather than a second drawing */}
        <text x={x + w + 8} y={y - 8} className="font-mono" fontSize="8" fill={DIAGRAM.inkFaint}>
          DEPTH {enclosure.depth} mm
        </text>
        <text x={x - 58} y={y - 8} className="font-mono" fontSize="8" fill={DIAGRAM.orange}>
          {floorStanding ? 'FLOOR STANDING' : 'WALL MOUNTED'}
        </text>
      </svg>
    </DiagramFrame>
  )
}
