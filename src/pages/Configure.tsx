import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, ArrowCounterClockwise } from '@phosphor-icons/react'
import {
  NOT_SURE,
  NOT_SURE_LABEL,
  sensorTypes,
  visibleFields,
  wizardSteps,
  type WizardField,
} from '../data/sensors'
import { PRELIMINARY_LABEL } from '../data/rfq'
import { Notice, PageHeader, PageSection } from '../components/pageKit'
import { Container } from '../components/primitives'
import { usePageMeta } from '../lib/usePageMeta'
import { useRequirement } from '../lib/requirementContext'
import { NotSureBand } from '../components/StartPaths'

/* ------------------------------------------------------------------
   One field. Every input carries a real <label>, because a placeholder
   disappears the moment somebody starts typing and then the field has
   no accessible name at all.
   ------------------------------------------------------------------ */

function Field({
  field,
  value,
  onChange,
  multi,
}: {
  field: WizardField
  value: string
  onChange: (value: string) => void
  multi?: boolean
}) {
  const inputId = `field-${field.id}`
  const helpId = field.help ? `${inputId}-help` : undefined
  const notSure = value === NOT_SURE

  // The measured-variables question is the one place a user genuinely
  // needs several answers, so it stores a comma separated list.
  const selected = multi ? value.split(',').filter(Boolean) : []
  const toggle = (option: string) => {
    const next = selected.includes(option)
      ? selected.filter((s) => s !== option)
      : [...selected, option]
    onChange(next.join(','))
  }

  return (
    <div className="border-b border-rule py-5 last:border-b-0">
      <label htmlFor={inputId} className="block text-base font-bold text-ink">
        {field.label}
        {field.required && (
          <span className="ml-1.5 font-mono text-xs font-medium text-signal-ink" aria-hidden="true">
            *
          </span>
        )}
        {field.required && <span className="sr-only"> (required)</span>}
      </label>
      {field.help && (
        <p id={helpId} className="mt-1 text-sm text-ink-faint">
          {field.help}
        </p>
      )}

      <div className="mt-3.5">
        {field.kind === 'choice' && field.options ? (
          <div className="flex flex-wrap gap-2" role={multi ? 'group' : undefined} aria-labelledby={multi ? inputId : undefined}>
            {field.options.map((option) => {
              const on = multi ? selected.includes(option) : value === option
              return (
                <button
                  key={option}
                  type="button"
                  id={option === field.options?.[0] ? inputId : undefined}
                  aria-pressed={on}
                  onClick={() => (multi ? toggle(option) : onChange(on ? '' : option))}
                  className={`min-h-11 cursor-pointer rounded-md border px-3.5 py-2 text-sm font-medium transition-[border-color,background-color,color,box-shadow] duration-150 ease-(--ease-out) active:scale-[0.97] ${
                    on
                      ? 'border-signal-orange bg-signal-orange/15 text-ink ring-1 ring-signal-orange/30'
                      : 'border-rule bg-sunk/70 text-ink-muted hoverable:hover:border-rule-strong hoverable:hover:bg-hover hoverable:hover:text-ink'
                  }`}
                >
                  {on && <Check size={13} weight="bold" aria-hidden="true" className="mr-1.5 inline text-signal-ink" />}
                  {option}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              id={inputId}
              type={field.kind === 'number' ? 'number' : 'text'}
              inputMode={field.kind === 'number' ? 'numeric' : undefined}
              min={field.kind === 'number' ? 0 : undefined}
              value={notSure ? '' : value}
              aria-describedby={helpId}
              disabled={notSure}
              onChange={(event) => onChange(event.target.value)}
              className="min-h-11 w-full max-w-[320px] rounded-md border border-rule bg-sunk px-3.5 py-2 text-base text-ink transition-colors placeholder:text-ink-faint focus:border-signal-orange disabled:opacity-40"
            />
            {field.unit && <span className="font-mono text-sm text-ink-faint">{field.unit}</span>}
          </div>
        )}
      </div>

      {/* Every field can be declined. An explicit unknown is worth more
          than a guess, and it feeds the missing information list. */}
      <button
        type="button"
        aria-pressed={notSure}
        onClick={() => onChange(notSure ? '' : NOT_SURE)}
        className={`mt-3 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-xs transition-[border-color,background-color,color,box-shadow] duration-150 active:scale-[0.97] ${
          notSure
            ? 'border-amber-glow/40 bg-amber-glow/10 text-amber-glow'
            : 'border-rule bg-transparent text-ink-faint hoverable:hover:border-rule-strong hoverable:hover:text-ink-muted'
        }`}
      >
        {notSure && <Check size={12} weight="bold" aria-hidden="true" />}
        {NOT_SURE_LABEL}
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------
   The wizard
   ------------------------------------------------------------------ */

export default function Configure() {
  const { draft, setAnswer, progress, reset } = useRequirement()
  const [index, setIndex] = useState(0)

  usePageMeta({
    title: 'Configure my solution — industrial automation requirement wizard',
    description:
      'A guided, rule based requirement wizard for industrial automation. Answer what you know, mark the rest for engineering review, and get a preliminary configuration with a completeness score.',
    path: '/configure',
  })

  const step = wizardSteps[index]
  const fields = useMemo(() => visibleFields(step, draft.answers), [step, draft.answers])

  // A step whose every field is conditional can end up empty; skip it
  // rather than showing a card with nothing on it.
  const isLast = index === wizardSteps.length - 1
  const goNext = () => setIndex((i) => Math.min(wizardSteps.length - 1, i + 1))
  const goBack = () => setIndex((i) => Math.max(0, i - 1))

  const selectedSensors = (draft.answers.sensors ?? '').split(',').filter(Boolean)

  return (
    <>
      <PageHeader
        label="REQUIREMENT WIZARD"
        title="Tell us what you want to measure, control, automate or monitor"
        intro="A guided set of engineering questions, not a chatbot. Answer what you know and mark the rest for review — an honest gap is more useful to an engineer than a confident guess."
        trail={[{ label: 'Home', to: '/' }, { label: 'Configure' }]}
      />

      {/* Progress. Sticky, because on a phone the step indicator is the
          only thing telling you how much is left. */}
      <div className="sticky top-[88px] z-30 border-b border-rule bg-page">
        <Container className="py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-xs font-semibold text-ink">
              STEP {index + 1} OF {wizardSteps.length}
              <span className="ml-2 font-normal text-ink-faint">{step.title}</span>
            </p>
            <p className="font-mono text-xs text-ink-faint">
              COMPLETENESS{' '}
              <span className="font-bold text-signal-ink">{progress.percent}%</span>
            </p>
          </div>
          <div
            className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-sunk"
            role="progressbar"
            aria-valuenow={index + 1}
            aria-valuemin={1}
            aria-valuemax={wizardSteps.length}
            aria-label="Wizard progress"
          >
            <div
              className="h-full rounded-full bg-signal-orange transition-[width] duration-300 ease-(--ease-out)"
              style={{ width: `${((index + 1) / wizardSteps.length) * 100}%` }}
            />
          </div>
        </Container>
      </div>

      <PageSection>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
          {/* One card per step. On mobile this is the whole screen. */}
          <div className="rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e2) md:p-8">
            <span className="font-mono text-xs font-bold tracking-wide text-signal-ink">
              {String(index + 1).padStart(2, '0')} / {String(wizardSteps.length).padStart(2, '0')}
            </span>
            <h2 className="display mt-2 text-2xl font-bold text-ink md:text-3xl">{step.title}</h2>
            <p className="mt-2.5 text-base leading-relaxed text-ink-muted">{step.intro}</p>

            <div className="mt-6">
              {fields.length === 0 ? (
                <p className="py-8 text-sm text-ink-muted">
                  Nothing to ask here based on your earlier answers. Continue to the next step.
                </p>
              ) : (
                fields.map((field) => (
                  <Field
                    key={field.id}
                    field={field}
                    multi={field.id === 'sensors'}
                    value={draft.answers[field.id] ?? ''}
                    onChange={(value) => setAnswer(field.id, value)}
                  />
                ))
              )}
            </div>

            {/* Navigation. Back is always available; there is no trap. */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-rule pt-6">
              <button
                type="button"
                onClick={goBack}
                disabled={index === 0}
                className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-sm border border-rule-strong bg-card px-4 py-2 text-sm font-semibold text-ink transition-colors duration-150 hoverable:hover:border-ink-faint hoverable:hover:bg-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft size={16} weight="bold" aria-hidden="true" />
                Back
              </button>

              {isLast ? (
                <Link
                  to="/rfq"
                  className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-signal-orange px-5 py-2 text-sm font-semibold text-on-signal transition-[gap,background-color] duration-150 hoverable:hover:gap-3 hoverable:hover:bg-signal-orange-hover"
                >
                  Complete requirement
                  <ArrowRight size={16} weight="bold" aria-hidden="true" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-sm bg-signal-orange px-5 py-2 text-sm font-semibold text-on-signal transition-[gap,background-color] duration-150 hoverable:hover:gap-3 hoverable:hover:bg-signal-orange-hover"
                >
                  Next
                  <ArrowRight size={16} weight="bold" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {/* Live summary. It updates as you answer, so the effect of an
              answer on the configuration is visible immediately. */}
          <aside className="space-y-5 lg:sticky lg:top-32">
            <div className="rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1)">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-mono text-xs font-bold tracking-wide text-ink-faint">
                  PRELIMINARY CONFIGURATION
                </h2>
                <span className="font-mono text-2xl font-bold text-signal-ink readout">
                  {progress.percent}%
                </span>
              </div>
              <p className="mt-1 font-mono text-[11px] text-amber-glow">{PRELIMINARY_LABEL}</p>

              <dl className="mt-5 space-y-2.5 border-t border-rule pt-5 text-sm">
                <SummaryRow label="GOAL" value={draft.answers.goal} />
                <SummaryRow label="APPLICATION" value={draft.answers.application} />
                <SummaryRow label="SENSORS" value={selectedSensors.length ? `${selectedSensors.length} selected` : undefined} />
                <SummaryRow label="CONTROL" value={draft.answers.goal === 'Control' || draft.answers.goal === 'Automate' ? 'PLC based' : undefined} />
                <SummaryRow label="HMI" value={draft.answers.hmiRequired} />
                <SummaryRow label="PANEL" value={draft.answers.panelRequired} />
                <SummaryRow label="IIOT" value={draft.answers.remoteMonitoring === 'Yes' ? 'Remote monitoring' : draft.answers.remoteMonitoring} />
                <SummaryRow label="AMC" value={draft.answers.amc} />
              </dl>

              {selectedSensors.length > 0 && (
                <div className="mt-5 border-t border-rule pt-5">
                  <p className="font-mono text-[11px] text-ink-faint">MEASURED VARIABLES</p>
                  <ul className="mt-2.5 flex flex-wrap gap-1.5" role="list">
                    {selectedSensors.map((name) => {
                      const sensor = sensorTypes.find((s) => s.name === name)
                      return (
                        <li
                          key={name}
                          className="inline-flex items-center gap-1.5 rounded border border-rule bg-sunk px-2 py-1 font-mono text-[11px] text-ink-muted"
                        >
                          <span className="text-signal-ink">{sensor?.tag ?? 'XIT'}</span>
                          {name}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>

            {progress.missing.length > 0 && (
              <div className="rounded-xl border border-amber-glow/30 bg-amber-glow/8 p-5">
                <h2 className="font-mono text-xs font-bold tracking-wide text-amber-glow">
                  MISSING INFORMATION ({progress.missing.length})
                </h2>
                <p className="mt-1.5 text-xs text-ink-faint">
                  Listed automatically from unanswered required fields. These become the
                  clarification questions during engineering review.
                </p>
                <ol className="mt-3.5 space-y-1.5 text-sm text-ink-muted">
                  {progress.missing.slice(0, 8).map((item, i) => (
                    <li key={item} className="flex gap-2.5">
                      <span className="font-mono text-xs text-amber-glow">{i + 1}.</span>
                      {item}
                    </li>
                  ))}
                  {progress.missing.length > 8 && (
                    <li className="font-mono text-xs text-ink-faint">
                      and {progress.missing.length - 8} more
                    </li>
                  )}
                </ol>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                reset()
                setIndex(0)
              }}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-rule px-3.5 py-2 font-mono text-xs text-ink-faint transition-colors duration-150 hoverable:hover:border-rule-strong hoverable:hover:text-ink-muted"
            >
              <ArrowCounterClockwise size={14} weight="bold" aria-hidden="true" />
              Start over
            </button>
          </aside>
        </div>
      </PageSection>

      <PageSection tone="card">
        <Notice tone="info" title="YOUR DRAFT STAYS IN YOUR BROWSER">
          Nothing on this page is sent anywhere. The configuration is kept in your browser's local
          storage so you can close the tab and come back to it. It leaves your machine only when you
          choose to send it from the RFQ page, and that submit handler is a placeholder pending a
          backend.
        </Notice>
      </PageSection>
      <NotSureBand compact />
    </>
  )
}

function SummaryRow({ label, value }: { label: string; value?: string }) {
  const shown = !value || value === NOT_SURE ? 'To be configured' : value
  const pending = !value || value === NOT_SURE
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="font-mono text-[11px] text-ink-faint">{label}</dt>
      <dd className={`text-right font-mono text-xs ${pending ? 'text-ink-faint' : 'font-semibold text-ink'}`}>
        {shown}
      </dd>
    </div>
  )
}
