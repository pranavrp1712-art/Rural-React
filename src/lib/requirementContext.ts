import { createContext, useContext } from 'react'
import type { Answers, completeness } from '../data/sensors'
import type { estimateEnclosure, IoTotals } from '../data/configurators'

/**
 * The shape of the shared requirement draft, plus the context and hook
 * that expose it.
 *
 * This lives apart from the provider component so that the provider
 * file exports nothing but a component, which is what keeps React Fast
 * Refresh working there. Same reason `tones.ts` sits outside
 * `primitives.tsx`.
 */

export const STORAGE_KEY = 'ruralreact.requirement.v1'

export interface RequirementDraft {
  answers: Answers
  /** Device quantities for the I/O calculator, keyed by ioRules id. */
  quantities: Record<string, number>
  sparePercent: number
  /** Panel configurator selections. */
  panel: Record<string, string>
  panelComponents: string[]
  /** HMI screen ids. */
  hmiScreens: string[]
  /** Process stages the user kept, per industry slug. */
  stages: Record<string, string[]>
  updatedAt: string
}

export const emptyDraft: RequirementDraft = {
  answers: {},
  quantities: {},
  sparePercent: 20,
  panel: {},
  panelComponents: [],
  hmiScreens: [],
  stages: {},
  updatedAt: '',
}

export interface RequirementContextValue {
  draft: RequirementDraft
  setAnswer: (id: string, value: string) => void
  setAnswers: (patch: Answers) => void
  setQuantity: (id: string, value: number) => void
  setSparePercent: (value: number) => void
  setPanelField: (id: string, value: string) => void
  togglePanelComponent: (id: string) => void
  toggleHmiScreen: (id: string) => void
  setStages: (industry: string, stages: string[]) => void
  reset: () => void
  /** Derived, recomputed on every change. */
  io: { required: IoTotals; recommended: IoTotals }
  enclosure: ReturnType<typeof estimateEnclosure>
  progress: ReturnType<typeof completeness>
  hasDraft: boolean
}

export const RequirementContext = createContext<RequirementContextValue | null>(null)

export function useRequirement() {
  const context = useContext(RequirementContext)
  if (!context) throw new Error('useRequirement must be used inside RequirementProvider')
  return context
}

/**
 * Reads the stored draft. A storage read can throw in private mode or
 * return something written by an older version, so it merges onto the
 * empty draft rather than trusting what it finds.
 */
export function readStoredDraft(): RequirementDraft {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyDraft
    const parsed = JSON.parse(raw) as Partial<RequirementDraft>
    return { ...emptyDraft, ...parsed }
  } catch {
    return emptyDraft
  }
}

/** Serialises the draft for the download-a-copy action on the RFQ page. */
export function draftToText(
  draft: RequirementDraft,
  progress: ReturnType<typeof completeness>,
) {
  const lines: string[] = []
  lines.push('RURALREACT — PRELIMINARY AUTOMATION REQUIREMENT')
  lines.push('Preliminary Configuration — not engineering approved')
  lines.push(`Generated: ${new Date().toLocaleString()}`)
  lines.push('')
  lines.push(
    `REQUIREMENT COMPLETENESS: ${progress.percent}%  (${progress.answered} of ${progress.total} required fields)`,
  )
  lines.push('')

  lines.push('--- ANSWERS ---')
  for (const [key, value] of Object.entries(draft.answers)) {
    if (!value) continue
    lines.push(`${key.padEnd(22)} ${value}`)
  }

  const devices = Object.entries(draft.quantities).filter(([, q]) => q > 0)
  if (devices.length) {
    lines.push('')
    lines.push('--- DEVICE COUNTS ---')
    for (const [key, qty] of devices) lines.push(`${key.padEnd(22)} ${qty}`)
    lines.push(`${'engineering spare'.padEnd(22)} ${draft.sparePercent}%`)
  }

  if (draft.panelComponents.length) {
    lines.push('')
    lines.push('--- PANEL COMPONENTS ---')
    lines.push(draft.panelComponents.join(', '))
  }

  if (draft.hmiScreens.length) {
    lines.push('')
    lines.push('--- HMI SCREENS ---')
    lines.push(draft.hmiScreens.join(', '))
  }

  if (progress.missing.length) {
    lines.push('')
    lines.push('--- MISSING INFORMATION ---')
    progress.missing.forEach((m, i) => lines.push(`${i + 1}. ${m}`))
  }

  lines.push('')
  lines.push('This document is a preliminary configuration produced by a rule based')
  lines.push('configurator. It is not an engineering approved design and carries no')
  lines.push('commercial commitment. Only authorised RuralReact personnel can approve')
  lines.push('a final quotation.')

  return lines.join('\n')
}
