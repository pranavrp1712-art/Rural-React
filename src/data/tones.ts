/**
 * The three brand accents, packaged as a cycle so icon badges rotate
 * through the palette instead of defaulting to orange everywhere.
 * Kept out of primitives.tsx so that file exports components only,
 * which is what keeps React Fast Refresh working there.
 */
export type AccentTone = 'orange' | 'teal' | 'blue' | 'cyan' | 'amber'

export const toneCycle: AccentTone[] = ['orange', 'teal', 'blue', 'cyan', 'amber']

export const toneStyles: Record<AccentTone, { bg: string; fg: string; ring: string }> = {
  orange: { bg: 'bg-signal-orange/10', fg: 'text-signal-ink', ring: 'ring-signal-orange/25' },
  teal: { bg: 'bg-process-green/10', fg: 'text-process-ink', ring: 'ring-process-green/25' },
  blue: { bg: 'bg-deep-blue/10', fg: 'text-deep-blue', ring: 'ring-deep-blue/20' },
  cyan: { bg: 'bg-process-cyan/10', fg: 'text-cyan-ink', ring: 'ring-process-cyan/25' },
  amber: { bg: 'bg-amber-glow/10', fg: 'text-amber-glow', ring: 'ring-amber-glow/25' },
}

export const badgeSize = { sm: 36, md: 44, lg: 56 } as const
