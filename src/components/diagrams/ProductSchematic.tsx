import { DIAGRAM, DeviceBox, DiagramDefs, DiagramFrame, InstrumentBubble, Pump, Run, Vessel } from './kit'

/**
 * A working-principle schematic per product, so a product page opens
 * with the thing itself rather than with three paragraphs.
 *
 * Each one draws the actual mechanism the page then describes: what is
 * measured, what is driven, and where the controller sits.
 */

function SolarDryer() {
  return (
    <svg viewBox="0 0 520 250" className="h-auto w-full select-none" aria-hidden="true">
      <DiagramDefs />
      {/* Sun and collector */}
      <circle cx="60" cy="42" r="16" fill={DIAGRAM.amber} opacity="0.25" />
      <circle cx="60" cy="42" r="9" fill={DIAGRAM.amber} opacity="0.7" />
      {[0, 45, 90, 135].map((a) => (
        <line
          key={a}
          x1={60 + 20 * Math.cos((a * Math.PI) / 180)}
          y1={42 + 20 * Math.sin((a * Math.PI) / 180)}
          x2={60 + 26 * Math.cos((a * Math.PI) / 180)}
          y2={42 + 26 * Math.sin((a * Math.PI) / 180)}
          stroke={DIAGRAM.amber}
          strokeWidth="1.5"
          opacity="0.6"
        />
      ))}
      <InstrumentBubble x={122} y={42} tag="RIT-01" />
      <text x={122} y={72} textAnchor="middle" className="font-mono" fontSize="8" fill={DIAGRAM.inkFaint}>
        irradiance
      </text>

      {/* Collector plate feeding the chamber */}
      <path d="M30 92 L110 72 L110 90 L30 110 Z" fill={DIAGRAM.orange} opacity="0.2" stroke={DIAGRAM.orange} strokeWidth="1.2" />
      <text x={70} y={126} textAnchor="middle" className="font-mono" fontSize="8" fill={DIAGRAM.inkFaint}>
        SOLAR COLLECTOR
      </text>

      {/* Chamber with trays */}
      <rect x="180" y="70" width="140" height="110" rx="4" fill={DIAGRAM.band} stroke={DIAGRAM.ruleStrong} strokeWidth="1.5" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x="190" y={84 + i * 24} width="120" height="4" rx="2" fill={DIAGRAM.rule} />
          <rect x="194" y={78 + i * 24} width="112" height="6" rx="2" fill={DIAGRAM.green} opacity="0.3" />
        </g>
      ))}
      <text x={250} y={196} textAnchor="middle" className="font-mono" fontSize="8" fill={DIAGRAM.inkFaint}>
        DRYING CHAMBER
      </text>

      {/* Warm air in, moist air out */}
      <Run d="M110 90 H176" kind="pipe" />
      <text x={143} y={84} textAnchor="middle" className="font-mono" fontSize="7" fill={DIAGRAM.amber}>
        warm air
      </text>
      <Run d="M320 110 H368" kind="pipe" />
      <text x={344} y={104} textAnchor="middle" className="font-mono" fontSize="7" fill={DIAGRAM.cyan}>
        moist air
      </text>

      {/* Chamber instruments */}
      <InstrumentBubble x={214} y={44} tag="TIT-02" leaderTo={70} />
      <InstrumentBubble x={286} y={44} tag="MIT-03" leaderTo={70} />

      {/* Fan and controller */}
      <circle cx="388" cy="110" r="14" fill={DIAGRAM.band} stroke={DIAGRAM.ruleStrong} strokeWidth="1.4" />
      <path d="M388 100 a10 10 0 0 1 8 14 a10 10 0 0 1 -16 0 a10 10 0 0 1 8 -14" fill={DIAGRAM.cyan} opacity="0.5" />
      <text x={388} y={136} textAnchor="middle" className="font-mono" fontSize="7" fill={DIAGRAM.inkFaint}>
        FAN
      </text>

      <DeviceBox x={420} y={72} w={84} h={58} label="Controller" tag="PROFILE" tone="orange" />
      <Run d="M214 29 H420 V86" kind="signal" arrow={false} />
      <Run d="M286 29 H420" kind="signal" arrow={false} />
      <Run d="M122 27 V18 H420" kind="signal" arrow={false} />
      <Run d="M420 118 H402" kind="signal" />
      <text x={462} y={148} textAnchor="middle" className="font-mono" fontSize="7" fill={DIAGRAM.green}>
        holds the batch profile
      </text>
    </svg>
  )
}

function TreatmentUnit() {
  /* Vessels sit on one line with the instruments in the gaps between
     them, so every signal drop runs down clear space to the bus rather
     than across a vessel or through a label. */
  const vessels = [
    { x: 50, label: 'Equalization', fill: 0.55 },
    { x: 160, label: 'pH correction', fill: 0.5, active: true },
    { x: 270, label: 'Clarification', fill: 0.45 },
    { x: 380, label: 'Outlet', fill: 0.3 },
  ]
  const VY = 120
  const VH = 58
  const VW = 64
  const LINE = VY + VH / 2
  const BUS = 216

  const taps = [
    { x: 24, tag: 'FIT-101' },
    { x: 137, tag: 'AIT-103', active: true },
    { x: 247, tag: 'LIT-106' },
    { x: 357, tag: 'AIT-109' },
  ]

  return (
    <svg viewBox="0 0 520 300" className="h-auto w-full select-none" aria-hidden="true">
      <DiagramDefs />

      {/* Dosing skid, above the stage it doses into */}
      <rect x="136" y="12" width="64" height="26" rx="3" fill={DIAGRAM.band} stroke={DIAGRAM.ruleStrong} strokeWidth="1.2" />
      <text x={168} y={28} textAnchor="middle" className="font-mono" fontSize="7" fill={DIAGRAM.inkFaint}>
        CHEMICAL
      </text>
      <Pump x={222} y={25} active />
      <Run d="M200 25 H210" kind="pipe" active arrow={false} />
      <Run d={`M222 36 V70 H192 V${VY}`} kind="pipe" active />
      <text x={168} y={54} textAnchor="middle" className="font-mono" fontSize="7" fill={DIAGRAM.orange}>
        DOSING SKID
      </text>

      {/* The main line */}
      <Run d={`M10 ${LINE} H${vessels[0].x}`} kind="pipe" />
      <text x={14} y={LINE - 10} className="font-mono" fontSize="7" fill={DIAGRAM.inkFaint}>IN</text>
      {vessels.slice(0, -1).map((v, i) => (
        <Run key={v.label} d={`M${v.x + VW} ${LINE} H${vessels[i + 1].x}`} kind="pipe" active={v.active || vessels[i + 1].active} />
      ))}
      <Run d={`M${vessels[3].x + VW} ${LINE} H505`} kind="pipe" />
      <text x={470} y={LINE - 10} className="font-mono" fontSize="7" fill={DIAGRAM.green}>OUT</text>

      {vessels.map((v) => (
        <g key={v.label}>
          <Vessel x={v.x} y={VY} w={VW} h={VH} label="" active={v.active} fillLevel={v.fill} />
          <text
            x={v.x + VW / 2}
            y={VY + VH + 18}
            textAnchor="middle"
            fontSize="10"
            fontWeight="600"
            fill={v.active ? DIAGRAM.ink : DIAGRAM.inkMuted}
          >
            {v.label}
          </text>
        </g>
      ))}

      {/* Instruments on the line, each dropping to the signal bus */}
      {taps.map((tap) => (
        <g key={tap.tag}>
          <InstrumentBubble x={tap.x} y={78} tag={tap.tag} active={tap.active} leaderTo={LINE} />
          <path
            d={`M${tap.x} 93 V${BUS}`}
            fill="none"
            stroke={tap.active ? DIAGRAM.orange : DIAGRAM.ruleStrong}
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        </g>
      ))}

      {/* Signal bus into the controller */}
      <path d={`M24 ${BUS} H357`} fill="none" stroke={DIAGRAM.ruleStrong} strokeWidth="1.2" strokeDasharray="3 3" />
      <path d={`M200 ${BUS} V238`} fill="none" stroke={DIAGRAM.ruleStrong} strokeWidth="1.2" strokeDasharray="3 3" />
      <DeviceBox x={130} y={238} w={140} h={44} label="PLC" tag="DOSING LOGIC + INTERLOCKS" tone="orange" />

      {/* The dosing pump is an output on the same bus as the inputs,
          so it drops into it the same way rather than looping back
          across the drawing. */}
      <path d="M233 25 H262" fill="none" stroke={DIAGRAM.orange} strokeWidth="1.2" strokeDasharray="3 3" />
      <path
        d="M262 14 H306 L316 25 L306 36 H262 Z"
        fill={DIAGRAM.band}
        stroke={DIAGRAM.orange}
        strokeWidth="1.2"
      />
      <text x={284} y={28} textAnchor="middle" className="font-mono" fontSize="7" fill={DIAGRAM.orange}>
        PLC AO
      </text>
    </svg>
  )
}

function GatewayPcb() {
  return (
    <svg viewBox="0 0 520 230" className="h-auto w-full select-none" aria-hidden="true">
      <DiagramDefs />
      {/* Field side */}
      <DeviceBox x={16} y={38} w={86} h={36} label="PLC" tag="MODBUS" tone="cyan" />
      <DeviceBox x={16} y={92} w={86} h={36} label="Meters" tag="RS485" tone="cyan" />
      <DeviceBox x={16} y={146} w={86} h={36} label="Sensors" tag="4-20 mA" tone="cyan" />
      <Run d="M102 56 H146 V96" kind="signal" />
      <Run d="M102 110 H146" kind="signal" />
      <Run d="M102 164 H146 V124" kind="signal" />

      {/* The board itself, drawn as a PCB */}
      <rect x="146" y="60" width="168" height="100" rx="5" fill="#0d2a1e" stroke={DIAGRAM.green} strokeWidth="1.5" />
      {/* Copper traces */}
      {[74, 86, 98, 110, 122, 134, 146].map((y, i) => (
        <path
          key={y}
          d={`M154 ${y} H${190 + (i % 3) * 18} V${y + (i % 2 ? 8 : -8)} H302`}
          fill="none"
          stroke={DIAGRAM.green}
          strokeWidth="0.8"
          opacity="0.35"
        />
      ))}
      {/* MCU and modules */}
      <rect x="206" y="88" width="46" height="44" rx="3" fill="#07150f" stroke={DIAGRAM.green} strokeWidth="1.2" />
      <text x={229} y={114} textAnchor="middle" className="font-mono" fontSize="8" fill={DIAGRAM.green}>MCU</text>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={`l${i}`} x1="202" y1={92 + i * 8} x2="206" y2={92 + i * 8} stroke={DIAGRAM.green} strokeWidth="1" />
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={`r${i}`} x1="252" y1={92 + i * 8} x2="256" y2={92 + i * 8} stroke={DIAGRAM.green} strokeWidth="1" />
      ))}
      <rect x="266" y="70" width="38" height="20" rx="2" fill="#07150f" stroke={DIAGRAM.green} strokeWidth="1" />
      <text x={285} y={84} textAnchor="middle" className="font-mono" fontSize="6.5" fill={DIAGRAM.green}>BUFFER</text>
      <rect x="266" y="130" width="38" height="20" rx="2" fill="#07150f" stroke={DIAGRAM.green} strokeWidth="1" />
      <text x={285} y={144} textAnchor="middle" className="font-mono" fontSize="6.5" fill={DIAGRAM.green}>RADIO</text>
      <text x={230} y={174} textAnchor="middle" className="font-mono" fontSize="8" fill={DIAGRAM.inkFaint}>
        EDGE GATEWAY / CUSTOM PCB
      </text>

      {/* Outbound only */}
      <path d="M314 100 H396" fill="none" stroke={DIAGRAM.green} strokeWidth="2" markerEnd="url(#arrow-out)" />
      <text x={355} y={92} textAnchor="middle" className="font-mono" fontSize="8" fill={DIAGRAM.green}>
        OUTBOUND ONLY
      </text>
      <path d="M396 130 H322" fill="none" stroke={DIAGRAM.rule} strokeWidth="2" strokeDasharray="4 3" />
      <line x1="366" y1="122" x2="352" y2="138" stroke={DIAGRAM.orange} strokeWidth="2" />
      <line x1="352" y1="122" x2="366" y2="138" stroke={DIAGRAM.orange} strokeWidth="2" />
      <text x={359} y={152} textAnchor="middle" className="font-mono" fontSize="7" fill={DIAGRAM.inkFaint}>
        no inbound
      </text>

      <DeviceBox x={396} y={78} w={100} h={44} label="Cloud" tag="MQTT / TLS" tone="green" />
    </svg>
  )
}

function ControlPanel() {
  return (
    <svg viewBox="0 0 520 250" className="h-auto w-full select-none" aria-hidden="true">
      <DiagramDefs />
      {/* Supply in at the top, loads out at the bottom: a single line. */}
      <text x={20} y={26} className="font-mono" fontSize="8" fill={DIAGRAM.inkFaint}>SUPPLY 415 V</text>
      <path d="M40 34 V56" fill="none" stroke={DIAGRAM.orange} strokeWidth="2" />

      {/* Incomer */}
      <rect x="22" y="56" width="36" height="26" rx="2" fill={DIAGRAM.band} stroke={DIAGRAM.orange} strokeWidth="1.4" />
      <path d="M30 62 L50 76" fill="none" stroke={DIAGRAM.orange} strokeWidth="1.4" />
      <text x={66} y={72} className="font-mono" fontSize="7.5" fill={DIAGRAM.inkFaint}>MCCB INCOMER</text>

      {/* Busbar */}
      <path d="M40 82 V104 H460" fill="none" stroke={DIAGRAM.orange} strokeWidth="3" opacity="0.8" />
      <text x={410} y={98} className="font-mono" fontSize="7.5" fill={DIAGRAM.orange}>BUSBAR</text>

      {/* Feeders dropping off the bus */}
      {[
        { x: 96, label: 'SMPS', sub: '24 V DC', tone: DIAGRAM.cyan, load: 'none' },
        { x: 180, label: 'VFD', sub: 'MOTOR 1', tone: DIAGRAM.amber, load: 'motor' },
        { x: 264, label: 'DOL', sub: 'PUMP 1', tone: DIAGRAM.green, load: 'motor' },
        { x: 348, label: 'DOL', sub: 'PUMP 2', tone: DIAGRAM.green, load: 'motor' },
        { x: 432, label: 'AUX', sub: 'LIGHT/FAN', tone: DIAGRAM.ruleStrong, load: 'aux' },
      ].map((feeder) => (
        <g key={feeder.x}>
          <path d={`M${feeder.x} 104 V124`} fill="none" stroke={DIAGRAM.ruleStrong} strokeWidth="1.5" />
          <rect x={feeder.x - 22} y="124" width="44" height="30" rx="3" fill={DIAGRAM.card} stroke={feeder.tone} strokeWidth="1.3" />
          <text x={feeder.x} y={138} textAnchor="middle" className="font-mono" fontSize="8" fontWeight="700" fill={feeder.tone}>
            {feeder.label}
          </text>
          <text x={feeder.x} y={148} textAnchor="middle" className="font-mono" fontSize="6.5" fill={DIAGRAM.inkFaint}>
            {feeder.sub}
          </text>
          {feeder.load !== 'none' && (
            <>
              <path d={`M${feeder.x} 154 V176`} fill="none" stroke={DIAGRAM.ruleStrong} strokeWidth="1.2" />
              {feeder.load === 'motor' ? (
                <>
                  <circle cx={feeder.x} cy="182" r="6" fill="none" stroke={DIAGRAM.ruleStrong} strokeWidth="1.2" />
                  <text x={feeder.x} y={185} textAnchor="middle" className="font-mono" fontSize="6" fill={DIAGRAM.inkFaint}>M</text>
                </>
              ) : (
                <>
                  <circle cx={feeder.x} cy="182" r="5" fill="none" stroke={DIAGRAM.ruleStrong} strokeWidth="1.2" />
                  <path
                    d={`M${feeder.x - 3.5} 178.5 L${feeder.x + 3.5} 185.5 M${feeder.x + 3.5} 178.5 L${feeder.x - 3.5} 185.5`}
                    fill="none"
                    stroke={DIAGRAM.ruleStrong}
                    strokeWidth="1"
                  />
                </>
              )}
            </>
          )}
        </g>
      ))}

      {/* Control section fed from the SMPS */}
      <path d="M96 154 V206 H186" fill="none" stroke={DIAGRAM.cyan} strokeWidth="1.4" strokeDasharray="4 3" />
      <DeviceBox x={186} y={190} w={80} h={36} label="PLC" tag="24 V DC" tone="orange" />
      <path d="M266 208 H300" fill="none" stroke={DIAGRAM.ruleStrong} strokeWidth="1.2" />
      <DeviceBox x={300} y={190} w={72} h={36} label="HMI" tone="cyan" />

      {/* E-stop chain, drawn separately because it is hardwired */}
      <circle cx="430" cy="208" r="11" fill={DIAGRAM.band} stroke={DIAGRAM.orange} strokeWidth="1.6" />
      <circle cx="430" cy="208" r="5" fill={DIAGRAM.orange} opacity="0.8" />
      <text x={430} y={234} textAnchor="middle" className="font-mono" fontSize="7" fill={DIAGRAM.orange}>
        E-STOP
      </text>
      <path d="M419 208 H372" fill="none" stroke={DIAGRAM.orange} strokeWidth="1.4" strokeDasharray="3 2" />
    </svg>
  )
}

function LabKit() {
  return (
    <svg viewBox="0 0 520 210" className="h-auto w-full select-none" aria-hidden="true">
      <DiagramDefs />
      {/* Bench */}
      <rect x="20" y="150" width="480" height="6" rx="2" fill={DIAGRAM.rule} />

      {/* Sample from the plant */}
      <path d="M30 60 q0 -18 18 -18 h24" fill="none" stroke={DIAGRAM.cyan} strokeWidth="1.4" strokeDasharray="4 3" />
      <text x={34} y={36} className="font-mono" fontSize="7.5" fill={DIAGRAM.cyan}>GRAB SAMPLE</text>

      {[
        { x: 60, label: 'pH', color: DIAGRAM.orange },
        { x: 160, label: 'COND', color: DIAGRAM.cyan },
        { x: 260, label: 'TURB', color: DIAGRAM.green },
        { x: 360, label: 'CL₂', color: DIAGRAM.amber },
      ].map((item) => (
        <g key={item.label}>
          {/* Beaker */}
          <path
            d={`M${item.x} 96 v40 a10 10 0 0 0 10 10 h20 a10 10 0 0 0 10 -10 v-40 z`}
            fill={item.color}
            fillOpacity="0.12"
            stroke={DIAGRAM.ruleStrong}
            strokeWidth="1.3"
          />
          <path d={`M${item.x + 2} 122 h36`} fill="none" stroke={item.color} strokeWidth="1.5" opacity="0.7" />
          <path d={`M${item.x - 4} 96 h48`} fill="none" stroke={DIAGRAM.ruleStrong} strokeWidth="1.5" />
          {/* Meter */}
          <rect x={item.x - 2} y="54" width="44" height="30" rx="3" fill={DIAGRAM.band} stroke={item.color} strokeWidth="1.3" />
          <rect x={item.x + 2} y="58" width="36" height="13" rx="1.5" fill={item.color} opacity="0.25" />
          <text x={item.x + 20} y={80} textAnchor="middle" className="font-mono" fontSize="7" fill={item.color}>
            {item.label}
          </text>
          <path d={`M${item.x + 20} 84 V96`} fill="none" stroke={DIAGRAM.ruleStrong} strokeWidth="1" strokeDasharray="2 2" />
        </g>
      ))}

      {/* The comparison that is the whole point */}
      <path d="M440 70 H470 V132 H410" fill="none" stroke={DIAGRAM.green} strokeWidth="1.4" markerEnd="url(#arrow-out)" />
      <text x={486} y={100} textAnchor="middle" className="font-mono" fontSize="7" fill={DIAGRAM.green}>
        vs
      </text>
      <text x={486} y={112} textAnchor="middle" className="font-mono" fontSize="7" fill={DIAGRAM.green}>
        inline
      </text>
      <text x={250} y={180} textAnchor="middle" className="font-mono" fontSize="8" fill={DIAGRAM.inkFaint}>
        BENCH RESULT COMPARED AGAINST THE INLINE PROBE — THE DIFFERENCE IS THE DRIFT
      </text>
    </svg>
  )
}

const schematics: Record<string, { art: () => React.ReactElement; sheet: string; caption: string }> = {
  'solar-dryer': {
    art: SolarDryer,
    sheet: 'SCH-01',
    caption:
      'Solar dryer schematic: a solar collector feeds warm air into a tray drying chamber; irradiance, chamber temperature and humidity are measured and reported to a controller, which stages the extract fan to hold the batch profile.',
  },
  'wastewater-and-purification-unit': {
    art: TreatmentUnit,
    sheet: 'P&ID-01',
    caption:
      'Treatment unit schematic: inlet flow is measured, then passes through equalization, pH correction with chemical dosing, clarification and outlet. Every instrument reports to a PLC that holds the dosing logic and interlocks.',
  },
  'iot-gateway-and-custom-pcb': {
    art: GatewayPcb,
    sheet: 'SCH-02',
    caption:
      'Gateway schematic: a PLC, meters and sensors connect to the edge gateway board over Modbus, RS485 and 4 to 20 mA. The board buffers locally and publishes outbound to the cloud over MQTT with TLS; no inbound connection is possible.',
  },
  'custom-industrial-control-panel': {
    art: ControlPanel,
    sheet: 'SLD-01',
    caption:
      'Control panel single line: a 415 V supply enters through an MCCB incomer onto a busbar, feeding an SMPS, a VFD, two direct on line pump starters and auxiliaries. The SMPS supplies the PLC and HMI; the emergency stop chain is hardwired separately.',
  },
  'chemical-and-water-testing-lab-kit': {
    art: LabKit,
    sheet: 'SCH-03',
    caption:
      'Lab kit schematic: a grab sample from the plant is measured on the bench for pH, conductivity, turbidity and chlorine. The bench result is compared against the inline probe, and the difference is the drift that drives the calibration schedule.',
  },
}

export function ProductSchematic({ slug }: { slug: string }) {
  const entry = schematics[slug]
  if (!entry) return null
  const Art = entry.art
  return (
    <DiagramFrame title="WORKING PRINCIPLE" sheet={entry.sheet} minWidth={520} caption={entry.caption}>
      <Art />
    </DiagramFrame>
  )
}

