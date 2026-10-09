import { DIAGRAM } from './kit'

/**
 * Wireframe previews of the HMI screens, so picking screens is a visual
 * choice rather than reading thirteen list items. Each is a miniature
 * of the real layout: where the values sit, where the alarm banner
 * goes, what the operator actually looks at.
 */

type ScreenId =
  | 'overview' | 'pid' | 'pumps' | 'valves' | 'sensors' | 'trends' | 'alarms'
  | 'manual' | 'setpoints' | 'recipes' | 'users' | 'reports' | 'history'

const W = 132
const H = 88

function Frame({ children, active }: { children: React.ReactNode; active: boolean }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" aria-hidden="true">
      <rect
        x="1"
        y="1"
        width={W - 2}
        height={H - 2}
        rx="4"
        fill={DIAGRAM.band}
        stroke={active ? DIAGRAM.orange : DIAGRAM.rule}
        strokeWidth="1.5"
      />
      {/* Status strip every screen carries */}
      <rect x="1" y="1" width={W - 2} height="10" rx="4" fill={active ? DIAGRAM.orange : DIAGRAM.rule} opacity="0.35" />
      <circle cx="8" cy="6" r="2" fill={DIAGRAM.green} />
      <rect x="14" y="4" width="26" height="4" rx="2" fill={DIAGRAM.inkFaint} opacity="0.5" />
      {children}
    </svg>
  )
}

const bar = (x: number, y: number, w: number, h: number, color: string, opacity = 1) => (
  <rect x={x} y={y} width={w} height={h} rx="1.5" fill={color} opacity={opacity} />
)

/** Each screen's distinguishing layout, drawn as a wireframe. */
function ScreenArt({ id }: { id: ScreenId }) {
  switch (id) {
    case 'overview':
      return (
        <>
          {/* Process mimic: two vessels, a pump and a flow line */}
          <rect x="10" y="26" width="22" height="24" rx="2" fill="none" stroke={DIAGRAM.cyan} strokeWidth="1" />
          <rect x="11" y="38" width="20" height="11" fill={DIAGRAM.cyan} opacity="0.25" />
          <line x1="32" y1="38" x2="52" y2="38" stroke={DIAGRAM.cyan} strokeWidth="1.5" />
          <circle cx="58" cy="38" r="6" fill="none" stroke={DIAGRAM.green} strokeWidth="1" />
          <line x1="64" y1="38" x2="84" y2="38" stroke={DIAGRAM.cyan} strokeWidth="1.5" />
          <rect x="84" y="26" width="22" height="24" rx="2" fill="none" stroke={DIAGRAM.cyan} strokeWidth="1" />
          <rect x="85" y="34" width="20" height="15" fill={DIAGRAM.cyan} opacity="0.25" />
          {bar(10, 60, 30, 8, DIAGRAM.orange, 0.5)}
          {bar(44, 60, 30, 8, DIAGRAM.green, 0.4)}
          {bar(78, 60, 30, 8, DIAGRAM.rule, 0.8)}
          {bar(10, 74, 112, 5, DIAGRAM.rule, 0.6)}
        </>
      )
    case 'pid':
      return (
        <>
          <circle cx="24" cy="34" r="7" fill="none" stroke={DIAGRAM.ruleStrong} strokeWidth="1" />
          <line x1="17" y1="34" x2="31" y2="34" stroke={DIAGRAM.ruleStrong} strokeWidth="0.8" />
          <circle cx="66" cy="34" r="7" fill="none" stroke={DIAGRAM.orange} strokeWidth="1" />
          <line x1="59" y1="34" x2="73" y2="34" stroke={DIAGRAM.orange} strokeWidth="0.8" />
          <circle cx="108" cy="34" r="7" fill="none" stroke={DIAGRAM.ruleStrong} strokeWidth="1" />
          <line x1="101" y1="34" x2="115" y2="34" stroke={DIAGRAM.ruleStrong} strokeWidth="0.8" />
          <path d="M24 41 V56 H108 V41" fill="none" stroke={DIAGRAM.cyan} strokeWidth="1.5" />
          <path d="M66 41 V56" fill="none" stroke={DIAGRAM.cyan} strokeWidth="1.5" />
          {bar(10, 66, 112, 5, DIAGRAM.rule, 0.6)}
          {bar(10, 74, 70, 5, DIAGRAM.rule, 0.4)}
        </>
      )
    case 'pumps':
    case 'valves':
      return (
        <>
          {[0, 1, 2].map((row) => (
            <g key={row}>
              <circle cx="16" cy={26 + row * 17} r="5" fill="none" stroke={row === 0 ? DIAGRAM.green : DIAGRAM.ruleStrong} strokeWidth="1" />
              {bar(26, 22 + row * 17, 44, 7, DIAGRAM.rule, 0.7)}
              {bar(74, 22 + row * 17, 20, 7, row === 0 ? DIAGRAM.green : DIAGRAM.rule, row === 0 ? 0.6 : 0.4)}
              {bar(98, 22 + row * 17, 24, 7, DIAGRAM.rule, 0.4)}
            </g>
          ))}
          {bar(10, 74, 112, 5, DIAGRAM.rule, 0.5)}
        </>
      )
    case 'sensors':
      return (
        <>
          {[0, 1, 2, 3].map((i) => {
            const cx = 12 + (i % 2) * 58
            const cy = 20 + Math.floor(i / 2) * 30
            return (
              <g key={i}>
                <rect x={cx} y={cy} width="52" height="24" rx="2" fill="none" stroke={DIAGRAM.rule} strokeWidth="1" />
                {bar(cx + 4, cy + 4, 18, 4, DIAGRAM.inkFaint, 0.5)}
                {bar(cx + 4, cy + 12, 30, 8, i === 0 ? DIAGRAM.orange : DIAGRAM.cyan, 0.55)}
              </g>
            )
          })}
        </>
      )
    case 'trends':
    case 'history':
      return (
        <>
          <line x1="12" y1="66" x2="122" y2="66" stroke={DIAGRAM.rule} strokeWidth="1" />
          <line x1="12" y1="20" x2="12" y2="66" stroke={DIAGRAM.rule} strokeWidth="1" />
          <path
            d="M12 56 L28 50 L42 54 L56 40 L70 44 L84 30 L98 36 L122 26"
            fill="none"
            stroke={DIAGRAM.green}
            strokeWidth="1.5"
          />
          <path
            d="M12 56 L28 50 L42 54 L56 40 L70 44 L84 30 L98 36 L122 26 V66 H12 Z"
            fill={DIAGRAM.green}
            opacity="0.12"
          />
          <line x1="12" y1="34" x2="122" y2="34" stroke={DIAGRAM.amber} strokeWidth="0.8" strokeDasharray="3 2" />
          {bar(12, 72, 40, 5, DIAGRAM.rule, 0.5)}
        </>
      )
    case 'alarms':
      return (
        <>
          {[
            DIAGRAM.orange,
            DIAGRAM.amber,
            DIAGRAM.rule,
            DIAGRAM.rule,
          ].map((color, row) => (
            <g key={row}>
              <rect x="10" y={20 + row * 14} width={112} height="11" rx="2" fill={color} opacity={row < 2 ? 0.2 : 0.35} />
              <circle cx="17" cy={25.5 + row * 14} r="3" fill={color} opacity={row < 2 ? 1 : 0.5} />
              {bar(25, 23 + row * 14, 44, 5, DIAGRAM.inkFaint, 0.55)}
              {bar(76, 23 + row * 14, 40, 5, DIAGRAM.inkFaint, 0.3)}
            </g>
          ))}
        </>
      )
    case 'manual':
      return (
        <>
          <rect x="12" y="20" width="52" height="22" rx="3" fill={DIAGRAM.green} opacity="0.25" stroke={DIAGRAM.green} strokeWidth="1" />
          <rect x="70" y="20" width="52" height="22" rx="3" fill="none" stroke={DIAGRAM.rule} strokeWidth="1" />
          {bar(24, 28, 28, 6, DIAGRAM.green, 0.7)}
          {bar(82, 28, 28, 6, DIAGRAM.inkFaint, 0.4)}
          {[0, 1].map((row) => (
            <g key={row}>
              {bar(12, 50 + row * 14, 70, 9, DIAGRAM.rule, 0.6)}
              <rect x="88" y={50 + row * 14} width="34" height="9" rx="4.5" fill={DIAGRAM.rule} opacity="0.8" />
              <circle cx={row === 0 ? 116 : 94} cy={54.5 + row * 14} r="3.5" fill={row === 0 ? DIAGRAM.green : DIAGRAM.inkFaint} />
            </g>
          ))}
        </>
      )
    case 'setpoints':
    case 'recipes':
      return (
        <>
          {[0, 1, 2].map((row) => (
            <g key={row}>
              {bar(12, 22 + row * 16, 52, 9, DIAGRAM.rule, 0.6)}
              <rect x="70" y={22 + row * 16} width="52" height="10" rx="2" fill="none" stroke={row === 0 ? DIAGRAM.orange : DIAGRAM.rule} strokeWidth="1" />
              {bar(74, 25 + row * 16, 22, 4, row === 0 ? DIAGRAM.orange : DIAGRAM.inkFaint, 0.7)}
            </g>
          ))}
          <rect x="70" y="72" width="52" height="10" rx="2" fill={DIAGRAM.orange} opacity="0.5" />
        </>
      )
    case 'users':
      return (
        <>
          {[0, 1, 2].map((row) => (
            <g key={row}>
              <circle cx="20" cy={28 + row * 17} r="6" fill="none" stroke={DIAGRAM.cyan} strokeWidth="1" />
              <circle cx="20" cy={26 + row * 17} r="2" fill={DIAGRAM.cyan} opacity="0.7" />
              {bar(32, 24 + row * 17, 42, 5, DIAGRAM.inkFaint, 0.5)}
              <rect x="80" y={23 + row * 17} width="42" height="8" rx="4" fill={row === 0 ? DIAGRAM.orange : DIAGRAM.rule} opacity={row === 0 ? 0.4 : 0.6} />
            </g>
          ))}
        </>
      )
    case 'reports':
      return (
        <>
          <rect x="14" y="18" width="104" height="60" rx="2" fill="none" stroke={DIAGRAM.rule} strokeWidth="1" />
          {bar(20, 24, 50, 5, DIAGRAM.inkFaint, 0.6)}
          {[0, 1, 2, 3].map((row) => (
            <g key={row}>
              {bar(20, 36 + row * 10, 40, 4, DIAGRAM.inkFaint, 0.3)}
              {bar(66, 36 + row * 10, 20, 4, DIAGRAM.green, 0.4)}
              {bar(92, 36 + row * 10, 20, 4, DIAGRAM.inkFaint, 0.25)}
            </g>
          ))}
        </>
      )
    default:
      return null
  }
}

export function HmiScreenPreview({ id, active }: { id: string; active: boolean }) {
  return (
    <Frame active={active}>
      <ScreenArt id={id as ScreenId} />
    </Frame>
  )
}
