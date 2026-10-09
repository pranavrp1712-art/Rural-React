import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Answers } from '../data/sensors'
import { completeness } from '../data/sensors'
import { calculateIo, estimateEnclosure } from '../data/configurators'
import {
  emptyDraft,
  readStoredDraft,
  RequirementContext,
  STORAGE_KEY,
  type RequirementDraft,
} from './requirementContext'

/**
 * Holds the one requirement draft that the wizard, the configurators
 * and the RFQ summary all read and write, persisted to browser storage
 * so a half finished configuration survives a closed tab.
 *
 * Nothing here is sent anywhere. There is no backend; the submit
 * handler on the RFQ page is a placeholder.
 *
 * This file exports only the provider component. Everything else lives
 * in `requirementContext.ts` so Fast Refresh keeps working here.
 */
export function RequirementProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<RequirementDraft>(readStoredDraft)

  // Persist on change. A storage failure must never break the page, so
  // the write is best effort and the draft stays in memory regardless.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
    } catch {
      /* quota, private mode or blocked storage: keep going in memory */
    }
  }, [draft])

  const stamp = () => new Date().toISOString()

  const setAnswer = useCallback((id: string, value: string) => {
    setDraft((current) => ({
      ...current,
      answers: { ...current.answers, [id]: value },
      updatedAt: stamp(),
    }))
  }, [])

  const setAnswers = useCallback((next: Answers) => {
    setDraft((current) => ({
      ...current,
      answers: { ...current.answers, ...next },
      updatedAt: stamp(),
    }))
  }, [])

  const setQuantity = useCallback((id: string, value: number) => {
    setDraft((current) => ({
      ...current,
      quantities: { ...current.quantities, [id]: Math.max(0, Math.min(999, value)) },
      updatedAt: stamp(),
    }))
  }, [])

  const setSparePercent = useCallback((value: number) => {
    setDraft((current) => ({
      ...current,
      sparePercent: Math.max(0, Math.min(100, value)),
      updatedAt: stamp(),
    }))
  }, [])

  const setPanelField = useCallback((id: string, value: string) => {
    setDraft((current) => ({
      ...current,
      panel: { ...current.panel, [id]: value },
      updatedAt: stamp(),
    }))
  }, [])

  const togglePanelComponent = useCallback((id: string) => {
    setDraft((current) => ({
      ...current,
      panelComponents: current.panelComponents.includes(id)
        ? current.panelComponents.filter((c) => c !== id)
        : [...current.panelComponents, id],
      updatedAt: stamp(),
    }))
  }, [])

  const toggleHmiScreen = useCallback((id: string) => {
    setDraft((current) => ({
      ...current,
      hmiScreens: current.hmiScreens.includes(id)
        ? current.hmiScreens.filter((c) => c !== id)
        : [...current.hmiScreens, id],
      updatedAt: stamp(),
    }))
  }, [])

  const setStages = useCallback((industry: string, stages: string[]) => {
    setDraft((current) => ({
      ...current,
      stages: { ...current.stages, [industry]: stages },
      updatedAt: stamp(),
    }))
  }, [])

  const reset = useCallback(() => {
    setDraft({ ...emptyDraft, updatedAt: stamp() })
  }, [])

  const io = useMemo(
    () => calculateIo(draft.quantities, draft.sparePercent),
    [draft.quantities, draft.sparePercent],
  )

  const enclosure = useMemo(() => {
    const points = io.recommended.di + io.recommended.do + io.recommended.ai + io.recommended.ao
    return estimateEnclosure({
      ioPoints: points,
      motorCount: (draft.quantities.pump ?? 0) + (draft.quantities.blower ?? 0),
      vfdCount: draft.quantities.vfdMotor ?? 0,
      hasHmi: draft.answers.hmiRequired === 'Yes' || draft.panelComponents.includes('hmi'),
      hasUps: draft.panelComponents.includes('ups'),
    })
  }, [io, draft.quantities, draft.answers.hmiRequired, draft.panelComponents])

  const progress = useMemo(() => completeness(draft.answers), [draft.answers])

  const hasDraft = useMemo(
    () =>
      Object.keys(draft.answers).length > 0 ||
      Object.values(draft.quantities).some((q) => q > 0) ||
      draft.panelComponents.length > 0 ||
      draft.hmiScreens.length > 0,
    [draft],
  )

  const value = useMemo(
    () => ({
      draft,
      setAnswer,
      setAnswers,
      setQuantity,
      setSparePercent,
      setPanelField,
      togglePanelComponent,
      toggleHmiScreen,
      setStages,
      reset,
      io,
      enclosure,
      progress,
      hasDraft,
    }),
    [
      draft,
      setAnswer,
      setAnswers,
      setQuantity,
      setSparePercent,
      setPanelField,
      togglePanelComponent,
      toggleHmiScreen,
      setStages,
      reset,
      io,
      enclosure,
      progress,
      hasDraft,
    ],
  )

  return <RequirementContext.Provider value={value}>{children}</RequirementContext.Provider>
}
