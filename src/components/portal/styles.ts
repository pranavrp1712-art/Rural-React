import type { RfqStage } from '../../data/portalTypes'

/** Button class sets for the portal, kept out of component files for Fast Refresh. */
export const btn = {
  primary:
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-signal-orange px-4 py-2 text-sm font-semibold text-on-signal transition-[background-color,transform] duration-150 ease-(--ease-out) hoverable:hover:bg-signal-orange-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50',
  secondary:
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-rule-strong bg-card px-4 py-2 text-sm font-semibold text-ink transition-[background-color,border-color,transform] duration-150 ease-(--ease-out) hoverable:hover:border-ink hoverable:hover:bg-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50',
  ghost:
    'inline-flex min-h-10 items-center justify-center gap-2 rounded-sm px-3 py-2 text-sm font-semibold text-ink-muted transition-[background-color,color] duration-150 hoverable:hover:bg-hover hoverable:hover:text-ink',
  danger:
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-danger/40 bg-card px-4 py-2 text-sm font-semibold text-danger transition-[background-color] duration-150 hoverable:hover:bg-danger/5',
}

/** Status tones. Every badge pairs the tone with an icon and a word. */
export type Tone = 'good' | 'warn' | 'bad' | 'neutral' | 'info'

export const stageTone: Record<RfqStage, Tone> = {
  Preliminary: 'neutral',
  'Technical review': 'info',
  'Awaiting customer': 'warn',
  'Approval pending': 'info',
  Quoted: 'good',
}
