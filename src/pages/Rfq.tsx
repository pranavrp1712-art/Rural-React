import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { DownloadSimple, Printer, PaperPlaneTilt, ChatCircleDots } from '@phosphor-icons/react'
import {
  NO_PRICE,
  PRELIMINARY_LABEL,
  bomCategories,
  bomGroups,
  quotationStages,
  quoteStructure,
  rfqTracker,
} from '../data/rfq'
import { cardCount, moduleSize } from '../data/configurators'
import { NOT_SURE } from '../data/sensors'
import { Notice, PageHeader, PageSection } from '../components/pageKit'
import { Reveal } from '../components/primitives'
import { usePageMeta } from '../lib/usePageMeta'
import { draftToText, useRequirement } from '../lib/requirementContext'
import { useAuth } from '../lib/auth'
import { submitRfq } from '../lib/db'

type SubmitState = 'idle' | 'sending' | 'sent' | 'error'

export default function Rfq() {
  const { draft, progress, io, enclosure, hasDraft } = useRequirement()
  const { session } = useAuth()
  const customer = session?.role === 'customer' ? session : null
  const [submit, setSubmit] = useState<SubmitState>('idle')
  const [sentId, setSentId] = useState<string>()
  const [contact, setContact] = useState({ name: '', company: '', email: '' })
  const [contactErrors, setContactErrors] = useState<Record<string, string | undefined>>({})

  usePageMeta({
    title: 'RFQ summary and preliminary bill of materials',
    description:
      'Your preliminary automation requirement: scope summary, completeness score, missing information and a preliminary bill of materials. No pricing is shown and nothing is engineering approved.',
    path: '/rfq',
  })

  const selectedSensors = (draft.answers.sensors ?? '').split(',').filter(Boolean)

  /**
   * Quantities for the BOM come from the configurator state, not from a
   * second set of inputs. Where a quantity cannot be derived it shows
   * as "To be configured" rather than as zero, because zero reads as a
   * decision and this is an absence of one.
   */
  const bomQuantities = useMemo(() => {
    const q = draft.quantities
    const totalIoCards =
      cardCount(io.recommended.di, moduleSize.di) +
      cardCount(io.recommended.do, moduleSize.do) +
      cardCount(io.recommended.ai, moduleSize.ai) +
      cardCount(io.recommended.ao, moduleSize.ao) +
      cardCount(io.recommended.relay, moduleSize.relay)

    const fieldPoints =
      io.recommended.di + io.recommended.do + io.recommended.ai + io.recommended.ao

    const map: Record<string, string> = {
      sensors: selectedSensors.length ? String(selectedSensors.length) : NO_PRICE,
      transmitters: selectedSensors.length ? String(selectedSensors.length) : NO_PRICE,
      plc: draft.answers.existingPlc === 'Yes' ? 'Existing — reused' : '1',
      ioModules: totalIoCards > 0 ? String(totalIoCards) : NO_PRICE,
      hmi: draft.answers.hmiRequired === 'Yes' ? '1' : draft.answers.hmiRequired === 'No' ? 'Not required' : NO_PRICE,
      smps: draft.panelComponents.includes('smps') ? '1' : NO_PRICE,
      mcb: NO_PRICE,
      mccb: draft.panelComponents.includes('mccb') ? '1' : NO_PRICE,
      relays: io.recommended.relay > 0 ? String(io.recommended.relay) : NO_PRICE,
      contactors: (q.pump ?? 0) + (q.blower ?? 0) > 0 ? String((q.pump ?? 0) + (q.blower ?? 0)) : NO_PRICE,
      vfd: (q.vfdMotor ?? 0) > 0 ? String(q.vfdMotor) : NO_PRICE,
      terminals: fieldPoints > 0 ? `~${Math.ceil((fieldPoints * 1.6) / 10) * 10}` : NO_PRICE,
      enclosure: draft.answers.panelRequired === 'Yes' ? `1 (~${enclosure.width}×${enclosure.height}×${enclosure.depth} mm)` : NO_PRICE,
      switch: draft.panelComponents.includes('switch') ? '1' : NO_PRICE,
      gateway: draft.answers.remoteMonitoring === 'Yes' ? '1' : NO_PRICE,
      pcb: NO_PRICE,
      cables: NO_PRICE,
      connectors: NO_PRICE,
      software: 'Scope item',
      cloud: draft.answers.remoteMonitoring === 'Yes' ? 'Scope item' : NO_PRICE,
      engineering: 'Scope item',
      installation: draft.answers.installation === 'Yes' ? 'Scope item' : NO_PRICE,
      commissioning: draft.answers.commissioning === 'Yes' ? 'Scope item' : NO_PRICE,
      calibration: selectedSensors.length ? `${selectedSensors.length} instruments` : NO_PRICE,
      amc: draft.answers.amc === 'Yes' ? 'Scope item' : NO_PRICE,
    }
    return map
  }, [draft, io, enclosure, selectedSensors.length])

  const download = () => {
    const text = draftToText(draft, progress)
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `ruralreact-requirement-${new Date().toISOString().slice(0, 10)}.txt`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  /**
   * Sends the requirement to the engineering queue as an RFQ. A signed-in
   * customer's RFQ is attached to their account; anyone else gives a
   * name, company and email. The prototype stores it in this browser
   * and no email is sent yet.
   */
  const onSend = (event: FormEvent) => {
    event.preventDefault()
    const who = customer
      ? { name: customer.name, company: customer.organisation, email: customer.email }
      : { name: contact.name.trim(), company: contact.company.trim(), email: contact.email.trim() }
    if (!customer) {
      const next = {
        name: who.name ? undefined : 'Enter your name.',
        company: who.company ? undefined : 'Enter your company or organisation.',
        email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(who.email) ? undefined : 'Enter a complete work email.',
      }
      setContactErrors(next)
      if (Object.values(next).some(Boolean)) return
    }
    setSubmit('sending')
    const rfq = submitRfq({
      customer: who.company,
      customerEmail: who.email,
      contact: who.name,
      industry: draft.answers.application || 'Other',
      scope: [draft.answers.goal, draft.answers.application].filter(Boolean).join(' · ') || 'Automation requirement',
      details: draftToText(draft, progress),
      via: customer ? 'Portal' : 'Website',
      missing: progress.missing,
      io: { di: io.recommended.di, do: io.recommended.do, ai: io.recommended.ai, ao: io.recommended.ao },
      bom: bomCategories
        .filter((c) => /^\d+$/.test(bomQuantities[c.id] ?? ''))
        .map((c) => ({ item: c.label, qty: Number(bomQuantities[c.id]), basis: c.basis })),
      page: '/rfq',
    })
    setSentId(rfq.id)
    window.setTimeout(() => setSubmit('sent'), 400)
  }

  return (
    <>
      <PageHeader
        label="RFQ SUMMARY"
        title="Preliminary automation requirement"
        intro="Built from your wizard answers and configurator results. It shows what you told us, what is still missing, and what that implies as a bill of materials. It shows no prices, because none have been supplied."
        trail={[{ label: 'Home', to: '/' }, { label: 'RFQ summary' }]}
        aside={
          <div className="rounded-lg border border-band-rule bg-band-raised/70 p-5 text-center">
            <p className="font-mono text-[11px] tracking-wide text-band-ink-faint">COMPLETENESS</p>
            <p className="readout mt-1 font-mono text-4xl font-bold text-signal-ink">{progress.percent}%</p>
            <p className="mt-1 font-mono text-[10px] text-band-ink-faint">
              {progress.answered} / {progress.total} REQUIRED FIELDS
            </p>
          </div>
        }
      />

      {!hasDraft && (
        <PageSection>
          <div className="rounded-xl border border-dashed border-rule bg-card p-8 text-center md:p-12">
            <h2 className="text-xl font-bold text-ink">Nothing configured yet</h2>
            <p className="mx-auto mt-2.5 max-w-[480px] text-sm text-ink-muted">
              This page is built from your requirement draft. Start the wizard or use a configurator
              and the summary fills in as you go.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/configure"
                className="inline-flex min-h-11 items-center rounded-sm bg-signal-orange px-5 py-2.5 text-sm font-semibold text-on-signal transition-colors hoverable:hover:bg-signal-orange-hover"
              >
                Start the wizard
              </Link>
              <Link
                to="/configurators"
                className="inline-flex min-h-11 items-center rounded-sm border border-rule-strong bg-card px-5 py-2.5 text-sm font-semibold text-ink transition-colors hoverable:hover:bg-hover"
              >
                Open configurators
              </Link>
            </div>
          </div>
        </PageSection>
      )}

      <PageSection>
        <div className="mb-8">
          <Notice tone="caution" title={PRELIMINARY_LABEL.toUpperCase()}>
            This summary is produced by a rule based configurator from the answers you gave. It has
            not been checked by an engineer, it carries no commercial commitment, and it is not a
            quotation.
          </Notice>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
          {/* Requirement summary */}
          <div className="overflow-hidden rounded-xl border border-rule bg-card shadow-(--shadow-e1)">
            <div className="border-b border-rule bg-sunk/80 px-5 py-3 font-mono text-xs font-semibold tracking-wide text-ink-faint">
              PRELIMINARY AUTOMATION REQUIREMENT
            </div>
            <dl>
              {[
                { label: 'Industry / application', value: draft.answers.application },
                { label: 'Goal', value: draft.answers.goal },
                { label: 'Process stages', value: draft.answers.stages },
                { label: 'Capacity', value: draft.answers.capacity },
                { label: 'Flow rate', value: draft.answers.flowRate },
                { label: 'Sensors', value: selectedSensors.length ? selectedSensors.join(', ') : undefined },
                { label: 'Ranges', value: draft.answers.range },
                { label: 'Accuracy', value: draft.answers.accuracy },
                { label: 'PLC', value: draft.answers.existingPlc === 'Yes' ? 'Existing, reused' : draft.answers.plcBrand },
                {
                  label: 'I/O',
                  value:
                    io.recommended.di + io.recommended.do + io.recommended.ai + io.recommended.ao > 0
                      ? `DI ${io.recommended.di} · DO ${io.recommended.do} · AI ${io.recommended.ai} · AO ${io.recommended.ao} · Relay ${io.recommended.relay}`
                      : undefined,
                },
                { label: 'HMI', value: draft.answers.hmiRequired === 'Yes' ? draft.answers.hmiSize ?? 'Required' : draft.answers.hmiRequired },
                { label: 'Panel', value: draft.answers.panelRequired === 'Yes' ? `${enclosure.width}×${enclosure.height}×${enclosure.depth} mm (estimate)` : draft.answers.panelRequired },
                { label: 'Communication', value: draft.answers.plcProtocols?.split(',').join(', ') },
                { label: 'IIoT', value: draft.answers.remoteMonitoring === 'Yes' ? 'Remote monitoring in scope' : draft.answers.remoteMonitoring },
                { label: 'Cloud', value: draft.answers.dataRetention },
                { label: 'Installation', value: draft.answers.installation },
                { label: 'Commissioning', value: draft.answers.commissioning },
                { label: 'AMC', value: draft.answers.amc },
              ].map((row) => {
                const missing = !row.value || row.value === NOT_SURE
                return (
                  <div
                    key={row.label}
                    className="grid gap-1 border-b border-rule px-5 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] sm:gap-4"
                  >
                    <dt className="font-mono text-xs tracking-wide text-ink-faint">
                      {row.label.toUpperCase()}
                    </dt>
                    <dd className={`text-sm ${missing ? 'font-mono text-xs text-amber-glow' : 'font-semibold text-ink'}`}>
                      {missing ? 'To be configured' : row.value}
                    </dd>
                  </div>
                )
              })}
            </dl>
          </div>

          {/* Actions and gaps */}
          <div className="space-y-6 lg:sticky lg:top-24">
            {progress.missing.length > 0 && (
              <div className="rounded-xl border border-amber-glow/30 bg-amber-glow/8 p-5">
                <h2 className="font-mono text-xs font-bold tracking-wide text-amber-glow">
                  MISSING INFORMATION ({progress.missing.length})
                </h2>
                <ol className="mt-3.5 space-y-1.5 text-sm text-ink-muted">
                  {progress.missing.map((item, i) => (
                    <li key={item} className="flex gap-2.5">
                      <span className="font-mono text-xs text-amber-glow">{i + 1}.</span>
                      {item}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className="rounded-xl border border-rule bg-card p-5 shadow-(--shadow-e1)">
              <h2 className="font-mono text-xs font-bold tracking-wide text-ink-faint">ACTIONS</h2>
              <div className="mt-4 space-y-2.5">
                <button
                  type="button"
                  onClick={download}
                  className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-rule-strong bg-sunk px-4 py-2.5 text-sm font-semibold text-ink transition-colors duration-150 hoverable:hover:border-ink-faint hoverable:hover:bg-hover"
                >
                  <DownloadSimple size={16} weight="bold" aria-hidden="true" />
                  Save requirement
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-rule-strong bg-sunk px-4 py-2.5 text-sm font-semibold text-ink transition-colors duration-150 hoverable:hover:border-ink-faint hoverable:hover:bg-hover"
                >
                  <Printer size={16} weight="bold" aria-hidden="true" />
                  Generate RFQ (print)
                </button>
                <form onSubmit={onSend} noValidate className="space-y-2.5">
                  {!customer && submit !== 'sent' && (
                    <div className="space-y-2.5 rounded-md border border-rule bg-sunk p-3">
                      <p className="text-xs text-ink-muted">
                        Who should the engineer reply to?{' '}
                        <Link to="/login/customer?next=/rfq" className="font-semibold text-signal-ink hoverable:hover:underline">Sign in</Link> to attach it to your account instead.
                      </p>
                      {(
                        [
                          ['name', 'Your name', 'name', 'text'],
                          ['company', 'Company', 'organization', 'text'],
                          ['email', 'Work email', 'email', 'email'],
                        ] as const
                      ).map(([key, label, auto, type]) => (
                        <div key={key}>
                          <label htmlFor={`rfq-${key}`} className="block text-xs font-semibold text-ink">{label}</label>
                          <input
                            id={`rfq-${key}`}
                            type={type}
                            autoComplete={auto}
                            value={contact[key]}
                            onChange={(e) => setContact({ ...contact, [key]: e.target.value })}
                            aria-invalid={Boolean(contactErrors[key])}
                            aria-describedby={contactErrors[key] ? `rfq-${key}-error` : undefined}
                            className="mt-1 min-h-11 w-full rounded-sm border border-rule-strong bg-card px-3 text-base text-ink"
                          />
                          {contactErrors[key] && <p id={`rfq-${key}-error`} className="mt-1 text-xs font-medium text-danger">{contactErrors[key]}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={submit === 'sending' || submit === 'sent'}
                    className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-signal-orange px-4 py-2.5 text-sm font-semibold text-on-signal transition-colors duration-150 hoverable:hover:bg-signal-orange-hover disabled:opacity-60"
                  >
                    <PaperPlaneTilt size={16} weight="bold" aria-hidden="true" />
                    {submit === 'sending' ? 'Sending…' : submit === 'sent' ? `Sent as ${sentId}` : 'Request quotation'}
                  </button>
                </form>
                <a
                  href="#talk"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-rule-strong bg-sunk px-4 py-2.5 text-sm font-semibold text-ink transition-colors duration-150 hoverable:hover:border-ink-faint hoverable:hover:bg-hover"
                >
                  <ChatCircleDots size={16} weight="bold" aria-hidden="true" />
                  Talk to an engineer
                </a>
              </div>

              <p aria-live="polite" className="mt-4 text-xs leading-relaxed text-ink-faint">
                {submit === 'sent'
                  ? `${sentId} is in the engineering queue.${customer ? ' Track it under My RFQs in your portal.' : ''} This prototype keeps it in this browser and sends no email yet.`
                  : 'Saving and printing happen entirely in your browser.'}
              </p>
            </div>
          </div>
        </div>
      </PageSection>

      {/* Preliminary BOM */}
      <PageSection
        tone="card"
        id="bom"
        label="PRELIMINARY BOM"
        title="Every line, and where its quantity came from"
        intro="Quantities are derived from the configurators. No prices and no internal margins are shown, because no price data has been supplied to this site."
      >
        <div className="space-y-8">
          {bomGroups.map((group) => (
            <div key={group}>
              <h3 className="mb-3 font-mono text-xs font-bold tracking-wide text-signal-ink">
                {group.toUpperCase()}
              </h3>
              <div className="overflow-x-auto rounded-xl border border-rule bg-card shadow-(--shadow-e1)">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <caption className="sr-only">Preliminary bill of materials, {group} items</caption>
                  <thead>
                    <tr className="border-b border-rule bg-sunk/80 font-mono text-[11px] tracking-wide text-ink-faint">
                      <th scope="col" className="px-5 py-2.5 font-semibold">Item</th>
                      <th scope="col" className="px-5 py-2.5 font-semibold">Quantity</th>
                      <th scope="col" className="px-5 py-2.5 font-semibold">How it was derived</th>
                      <th scope="col" className="px-5 py-2.5 text-right font-semibold">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bomCategories
                      .filter((category) => category.group === group)
                      .map((category) => {
                        const quantity = bomQuantities[category.id] ?? NO_PRICE
                        const pending = quantity === NO_PRICE
                        return (
                          <tr
                            key={category.id}
                            className="border-b border-rule transition-colors last:border-b-0 hoverable:hover:bg-hover/50"
                          >
                            <th scope="row" className="px-5 py-3 text-left font-semibold text-ink">
                              {category.label}
                            </th>
                            <td className={`px-5 py-3 font-mono text-xs ${pending ? 'text-amber-glow' : 'font-bold text-process-ink'}`}>
                              {quantity}
                            </td>
                            <td className="px-5 py-3 text-xs text-ink-faint">{category.basis}</td>
                            <td className="px-5 py-3 text-right font-mono text-xs text-ink-faint">
                              {NO_PRICE}
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </PageSection>

      {/* Quotation stages */}
      <PageSection
        id="stages"
        label="QUOTATION STAGES"
        title="Two stages, and only one of them means anything"
      >
        <div className="grid gap-6 md:grid-cols-2">
          {quotationStages.map((stage, index) => (
            <Reveal
              key={stage.stage}
              delay={index * 80}
              variant="scale"
              className={`rounded-xl border p-6 shadow-(--shadow-e1) md:p-7 ${
                index === 0 ? 'border-amber-glow/30 bg-amber-glow/8' : 'border-process-green/40 bg-process-green/8'
              }`}
            >
              <span
                className={`font-mono text-xs font-bold tracking-wide ${
                  index === 0 ? 'text-amber-glow' : 'text-process-ink'
                }`}
              >
                {stage.stage}
              </span>
              <h3 className="mt-2 text-xl font-bold text-ink">{stage.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{stage.body}</p>
              <p className="mt-4 border-t border-rule/60 pt-3.5 font-mono text-[11px] text-ink-faint">
                {stage.authority}
              </p>
            </Reveal>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-rule bg-card p-6 shadow-(--shadow-e1)">
          <h3 className="font-mono text-xs font-bold tracking-wide text-ink-faint">
            WHAT A QUOTATION CONTAINS
          </h3>
          <ul className="mt-4 flex flex-wrap gap-2" role="list">
            {quoteStructure.map((line) => (
              <li
                key={line}
                className="inline-flex items-center gap-1.5 rounded-md border border-rule bg-sunk px-2.5 py-1.5 font-mono text-xs text-ink-muted"
              >
                {line}
              </li>
            ))}
          </ul>
        </div>
      </PageSection>

      {/* Status tracker */}
      <PageSection
        tone="card"
        id="talk"
        label="AFTER YOU SUBMIT"
        title="Sixteen stages from draft to AMC"
        intro="This is a process explainer, not a live status. It is not tied to a customer account, because there are no accounts on this site."
      >
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="list">
          {rfqTracker.map((stage, index) => (
            <Reveal
              key={stage.label}
              as="li"
              delay={index * 30}
              variant="fade"
              className="rounded-lg border border-rule bg-card p-4 shadow-(--shadow-e1)"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-[11px] text-ink-faint">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span
                  className={`rounded-sm px-2 py-0.5 font-mono text-[10px] font-semibold ${
                    stage.owner === 'You'
                      ? 'bg-process-cyan/15 text-cyan-ink'
                      : stage.owner === 'RuralReact'
                        ? 'bg-orange-500/15 text-signal-ink'
                        : 'bg-process-green/15 text-process-ink'
                  }`}
                >
                  {stage.owner}
                </span>
              </div>
              <p className="mt-2 text-sm font-bold text-ink">{stage.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-faint">{stage.note}</p>
            </Reveal>
          ))}
        </ol>
      </PageSection>
    </>
  )
}
