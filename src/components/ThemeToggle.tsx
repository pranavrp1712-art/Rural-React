import { Desktop, Moon, Sun } from '@phosphor-icons/react'
import { useTheme, type ThemePreference } from '../lib/theme'

const options: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: 'system', label: 'System', Icon: Desktop },
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
]

/**
 * The one theme control, used in the public navbar and the portal
 * sidebar footer. `segmented` shows all three choices; `cycle` is a
 * single icon button for tight spaces (nav bar, collapsed sidebar).
 */
export function ThemeToggle({
  variant = 'segmented',
  tone = 'surface',
  className = '',
}: {
  variant?: 'segmented' | 'cycle'
  /** `band` for navy backgrounds (hero nav, sidebar). */
  tone?: 'surface' | 'band'
  className?: string
}) {
  const { preference, resolved, setPreference } = useTheme()

  if (variant === 'cycle') {
    const i = options.findIndex((o) => o.value === preference)
    const next = options[(i + 1) % options.length]
    const Icon = preference === 'system' ? Desktop : resolved === 'dark' ? Moon : Sun
    return (
      <button
        type="button"
        onClick={() => setPreference(next.value)}
        aria-label={`Theme: ${options[i].label}. Switch to ${next.label}.`}
        title={`Theme: ${options[i].label}`}
        className={`inline-flex size-10 shrink-0 items-center justify-center rounded-sm transition-[background-color,color] duration-150 ${
          tone === 'band'
            ? 'text-band-ink-muted hoverable:hover:bg-band-ink/10 hoverable:hover:text-band-ink'
            : 'text-ink-muted hoverable:hover:bg-hover hoverable:hover:text-ink'
        } ${className}`}
      >
        <Icon size={20} aria-hidden="true" />
      </button>
    )
  }

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={`inline-flex w-full rounded-sm border p-0.5 ${tone === 'band' ? 'border-band-rule bg-band' : 'border-rule bg-sunk'} ${className}`}
    >
      {options.map(({ value, label, Icon }) => {
        const active = preference === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setPreference(value)}
            className={`inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-sm px-2 text-xs font-semibold transition-[background-color,color] duration-150 ${
              active
                ? tone === 'band'
                  ? 'bg-band-high text-band-ink'
                  : 'bg-card text-ink shadow-(--shadow-e1)'
                : tone === 'band'
                  ? 'text-band-ink-muted hoverable:hover:text-band-ink'
                  : 'text-ink-muted hoverable:hover:text-ink'
            }`}
          >
            <Icon size={14} aria-hidden="true" />
            {label}
          </button>
        )
      })}
    </div>
  )
}
