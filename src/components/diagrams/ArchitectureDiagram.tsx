import { DIAGRAM, DeviceBox, DiagramDefs, DiagramFrame, Run, Zone } from './kit'

/**
 * The sensor-to-cloud chain drawn across three zones, with the arrows
 * pointing one way through the boundary.
 *
 * The direction of the arrow is the whole security argument, so it is
 * drawn explicitly: a green outbound arrow crossing the boundary, and a
 * barred inbound arrow that says what cannot happen.
 */
export function ArchitectureDiagram({ compact = false }: { compact?: boolean }) {
  return (
    <DiagramFrame
      title="SYSTEM ARCHITECTURE"
      sheet="ARC-01"
      legend={[
        { color: DIAGRAM.cyan, label: 'Field signal' },
        { color: DIAGRAM.green, label: 'Outbound publish' },
        { color: DIAGRAM.amber, label: 'Zone boundary', dashed: true },
      ]}
      minWidth={720}
      caption="Architecture across three zones. Plant side: instruments and transmitters wire to the PLC, which holds all control logic. Boundary: an edge gateway reads from the PLC and publishes outward over a secure link; nothing on the internet can open a connection inward. Cloud side: a database retains the readings and serves the dashboard."
    >
      <svg viewBox="0 0 760 300" className="h-auto w-full select-none" aria-hidden="true">
        <DiagramDefs />

        <Zone x={8} y={16} w={296} h={268} label="PLANT SIDE / OT" color={DIAGRAM.orange} />
        <Zone x={316} y={16} w={148} h={268} label="BOUNDARY" color={DIAGRAM.amber} />
        <Zone x={476} y={16} w={276} h={268} label="CLOUD SIDE / IT" color={DIAGRAM.cyan} />

        {/* --- Plant side ------------------------------------------- */}
        <DeviceBox x={28} y={54} w={90} h={40} label="Sensors" tag="AIT / FIT" tone="cyan" />
        <DeviceBox x={28} y={118} w={90} h={40} label="Actuators" tag="PMP / VLV" tone="cyan" />
        <DeviceBox x={28} y={182} w={90} h={40} label="Drives" tag="VFD" tone="cyan" />

        <Run d="M118 74 H150 V126 H176" kind="signal" />
        <Run d="M118 138 H176" kind="signal" />
        <Run d="M118 202 H150 V150 H176" kind="signal" />

        <DeviceBox x={176} y={100} w={104} h={76} label="PLC" tag="CONTROL LOGIC" tone="orange" />
        <text
          x={228}
          y={196}
          textAnchor="middle"
          className="font-mono"
          fontSize="8"
          fill={DIAGRAM.inkFaint}
        >
          interlocks · fixed scan
        </text>
        <text
          x={228}
          y={208}
          textAnchor="middle"
          className="font-mono"
          fontSize="8"
          fill={DIAGRAM.green}
        >
          runs without the cloud
        </text>

        {/* --- Boundary ---------------------------------------------- */}
        <Run d="M280 138 H336" kind="signal" />
        <DeviceBox x={336} y={100} w={108} h={76} label="Gateway" tag="EDGE / BUFFER" tone="amber" />

        {/* The outbound arrow, and the inbound one that is barred. */}
        <path
          d="M444 124 H512"
          fill="none"
          stroke={DIAGRAM.green}
          strokeWidth="2"
          markerEnd="url(#arrow-out)"
        />
        <text x={478} y={116} textAnchor="middle" className="font-mono" fontSize="8" fill={DIAGRAM.green}>
          PUBLISH
        </text>

        <path d="M512 158 H452" fill="none" stroke={DIAGRAM.rule} strokeWidth="2" strokeDasharray="4 3" />
        <g>
          <line x1={482} y1={148} x2={470} y2={168} stroke="var(--color-signal-orange)" strokeWidth="2" />
          <line x1={470} y1={148} x2={482} y2={168} stroke="var(--color-signal-orange)" strokeWidth="2" />
        </g>
        <text x={496} y={176} textAnchor="middle" className="font-mono" fontSize="8" fill={DIAGRAM.inkFaint}>
          NO INBOUND
        </text>

        {/* --- Cloud side -------------------------------------------- */}
        <DeviceBox x={512} y={100} w={92} h={48} label="Cloud" tag="INGEST" tone="cyan" />
        <Run d="M604 124 H636" kind="link" />
        <DeviceBox x={636} y={100} w={96} h={48} label="Database" tag="RETENTION" tone="cyan" />

        <Run d="M684 148 V196" kind="link" />
        <DeviceBox x={620} y={196} w={112} h={44} label="Dashboard" tag="OPERATOR VIEW" tone="green" />
        <Run d="M620 218 H556" kind="link" arrow={false} />
        <DeviceBox x={496} y={196} w={60} h={44} label="Phone" tone="green" />

        {!compact && (
          <text
            x={624}
            y={262}
            textAnchor="middle"
            className="font-mono"
            fontSize="8"
            fill={DIAGRAM.inkFaint}
          >
            losing this costs visibility, never control
          </text>
        )}
      </svg>
    </DiagramFrame>
  )
}
