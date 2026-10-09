/**
 * Transactional email templates for the portal (md/login.md §1).
 *
 * Designed from the site's own tokens because no separate email design
 * file exists yet: panel-navy header, enclosure-white canvas, a white
 * card, one signal-orange button with navy text (AA contrast), Plex
 * type with safe fallbacks.
 *
 * Email clients ignore <style> blocks and flexbox unevenly, so layout
 * is tables and every style is inline. Width is 600px, fluid below it.
 */

const C = {
  canvas: '#F4F6F7',
  card: '#FFFFFF',
  navy: '#0E1D31',
  ink: '#0E1D31',
  muted: '#4A5660',
  faint: '#5D6975',
  rule: '#D6DDE4',
  orange: '#F26A1D',
  orangeInk: '#B5470C',
  green: '#137A52',
  amberBg: '#FBF3E4',
  amberInk: '#8A5500',
}

const SANS = "'IBM Plex Sans', Arial, Helvetica, sans-serif"
const HEAD = "'Barlow Semi Condensed', 'Arial Narrow', Arial, sans-serif"
const MONO = "'IBM Plex Mono', 'Courier New', monospace"

const esc = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/* ------------------------------------------------------------------
   Building blocks
   ------------------------------------------------------------------ */

function button(label: string, href: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px">
  <tr><td bgcolor="${C.orange}" style="border-radius:2px">
    <a href="${esc(href)}" style="display:inline-block;padding:13px 22px;font-family:${SANS};font-size:15px;font-weight:600;color:${C.navy};text-decoration:none;border-radius:2px">${esc(label)}</a>
  </td></tr></table>`
}

function p(text: string) {
  return `<p style="margin:0 0 14px;font-family:${SANS};font-size:15px;line-height:24px;color:${C.muted}">${text}</p>`
}

function h1(text: string) {
  return `<h1 style="margin:0 0 14px;font-family:${HEAD};font-size:28px;line-height:32px;font-weight:700;color:${C.ink}">${esc(text)}</h1>`
}

function label(text: string) {
  return `<p style="margin:0 0 10px;padding-left:9px;border-left:2px solid ${C.orange};font-family:${MONO};font-size:11px;letter-spacing:.04em;color:${C.faint};text-transform:uppercase">${esc(text)}</p>`
}

/** A spec-sheet style key/value table, the site's nameplate idiom. */
function facts(rows: [string, string][]) {
  const body = rows
    .map(
      ([k, v], i) => `<tr>
  <td style="padding:10px 14px;${i ? `border-top:1px solid ${C.rule};` : ''}font-family:${MONO};font-size:12px;color:${C.faint};width:38%;vertical-align:top">${esc(k)}</td>
  <td style="padding:10px 14px;${i ? `border-top:1px solid ${C.rule};` : ''}font-family:${SANS};font-size:14px;color:${C.ink};font-weight:500">${esc(v)}</td>
</tr>`,
    )
    .join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 8px;border:1px solid ${C.rule};border-radius:3px;background:${C.canvas}">${body}</table>`
}

function notice(text: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0 4px"><tr>
  <td style="padding:12px 14px;background:${C.amberBg};border-left:3px solid ${C.amberInk};font-family:${SANS};font-size:13px;line-height:20px;color:${C.amberInk}">${text}</td>
</tr></table>`
}

function linkFallback(href: string) {
  return `<p style="margin:14px 0 0;font-family:${SANS};font-size:12px;line-height:18px;color:${C.faint}">If the button does not work, paste this link into your browser:<br><a href="${esc(href)}" style="color:${C.orangeInk};word-break:break-all">${esc(href)}</a></p>`
}

function layout({ preheader, body, reason }: { preheader: string; body: string; reason: string }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>RuralReact</title></head>
<body style="margin:0;padding:0;background:${C.canvas}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.canvas}"><tr><td align="center" style="padding:24px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">
    <tr><td bgcolor="${C.navy}" style="padding:18px 28px;border-radius:4px 4px 0 0">
      <span style="font-family:${HEAD};font-size:22px;font-weight:700;color:#F4F6F7;letter-spacing:-.01em">Rural<span style="color:${C.orange}">React</span></span>
    </td></tr>
    <tr><td style="height:4px;background:${C.orange};font-size:0;line-height:0">&nbsp;</td></tr>
    <tr><td bgcolor="${C.card}" style="padding:32px 28px 28px;border:1px solid ${C.rule};border-top:0;border-radius:0 0 4px 4px">${body}</td></tr>
    <tr><td style="padding:18px 28px 0;font-family:${SANS};font-size:12px;line-height:18px;color:${C.faint}">
      ${esc(reason)}<br>RuralReact · Industrial automation, configured for your process.
    </td></tr>
  </table>
</td></tr></table>
</body></html>`
}

/* ------------------------------------------------------------------
   Templates
   ------------------------------------------------------------------ */

export interface EmailTemplate {
  id: string
  name: string
  audience: string
  trigger: string
  subject: string
  render: () => string
}

const SITE = 'https://ruralreact.in'

/** Sample values used for previews. A real sender fills these per message. */
const sample = {
  name: 'Demo Customer',
  email: 'customer@example.demo',
  when: '25 Sep 2026, 10:42 IST',
  device: 'Chrome on Windows',
  location: 'Approximate location withheld in demo',
  rfq: 'RFQ-0001',
}

export const emailTemplates: EmailTemplate[] = [
  {
    id: 'verify-email',
    name: 'Verify email',
    audience: 'Customer',
    trigger: 'Self-service sign up',
    subject: 'Confirm your email to open your RuralReact account',
    render: () =>
      layout({
        preheader: 'One step left: confirm this address and your account opens.',
        reason: `You received this because someone signed up with ${sample.email}. If it was not you, ignore this email and no account will be opened.`,
        body:
          label('Account') +
          h1('Confirm your email address') +
          p(`Hello ${esc(sample.name)},`) +
          p('Confirm this is your address and your customer account opens. From there you can track your RFQs, quotations and projects in one place.') +
          button('Confirm my email', `${SITE}/verify-email?token=demo`) +
          p('This link works once and expires in 24 hours.') +
          linkFallback(`${SITE}/verify-email?token=demo`),
      }),
  },
  {
    id: 'welcome',
    name: 'Welcome',
    audience: 'Customer',
    trigger: 'Email verified',
    subject: 'Your RuralReact account is open',
    render: () =>
      layout({
        preheader: 'Submit a requirement, upload site photos, track the project.',
        reason: `You received this because an account was opened for ${sample.email}.`,
        body:
          label('Welcome') +
          h1('Your account is open') +
          p(`Hello ${esc(sample.name)}, your email is confirmed. Here is what you can do from your dashboard:`) +
          facts([
            ['Submit an RFQ', 'Describe the process; an engineer reads it'],
            ['Upload', 'Drawings, site photos and datasheets'],
            ['Review', 'Technical proposal and quotation'],
            ['Track', 'Project stages, from drawings to commissioning'],
          ]) +
          button('Open my dashboard', `${SITE}/portal/customer`),
      }),
  },
  {
    id: 'password-reset',
    name: 'Password reset',
    audience: 'All roles',
    trigger: 'Forgot password request',
    subject: 'Reset your RuralReact password',
    render: () =>
      layout({
        preheader: 'Use this link within 30 minutes to choose a new password.',
        reason: `You received this because a password reset was requested for ${sample.email}. If you did not ask for it, you can ignore this email; your password has not changed.`,
        body:
          label('Security') +
          h1('Reset your password') +
          p('We received a request to reset the password for your account. Choose a new one with the button below.') +
          button('Choose a new password', `${SITE}/reset-password?token=demo`) +
          p('The link expires in 30 minutes and works once. Resetting signs you out of every other session.') +
          linkFallback(`${SITE}/reset-password?token=demo`),
      }),
  },
  {
    id: 'suspicious-login',
    name: 'New device / location alert',
    audience: 'All roles',
    trigger: 'Sign-in from a device or location not seen on this account',
    subject: 'New sign-in to your RuralReact account',
    render: () =>
      layout({
        preheader: 'Was this you? Check the device and time.',
        reason: `You received this security alert for ${sample.email}. Alerts cannot be turned off.`,
        body:
          label('Security alert') +
          h1('New sign-in to your account') +
          p('Your account was signed in to from a device or location we have not seen before. Sign-in needs only your password, so this alert is how you find out if someone else has it.') +
          facts([
            ['When', sample.when],
            ['Device', sample.device],
            ['Location', sample.location],
          ]) +
          notice('<strong>Not you?</strong> Reset your password now. It signs every session out, including this one.') +
          button('Secure my account', `${SITE}/forgot-password`),
      }),
  },
  {
    id: 'rfq-assigned',
    name: 'New RFQ assigned',
    audience: 'Engineering Team',
    trigger: 'An RFQ is assigned to an engineer',
    subject: `${sample.rfq} has been assigned to you`,
    render: () =>
      layout({
        preheader: 'Water & wastewater · pH dosing · preliminary configuration attached.',
        reason: 'You received this because RFQ assignment notifications are on for your engineering account.',
        body:
          label('Engineering') +
          h1('New RFQ assigned to you') +
          facts([
            ['RFQ', sample.rfq],
            ['Industry', 'Water & wastewater'],
            ['Scope', 'pH correction and chemical dosing'],
            ['Configuration', 'Preliminary, not engineering approved'],
            ['Missing information', '3 items'],
          ]) +
          p('Review the preliminary configuration, confirm the I/O and raise questions for the customer before the technical review.') +
          button('Open the RFQ', `${SITE}/portal/engineering`),
      }),
  },
  {
    id: 'new-lead',
    name: 'New lead',
    audience: 'Marketing Team',
    trigger: 'A lead arrives from a form, chatbot or QR code',
    subject: 'New lead from the website',
    render: () =>
      layout({
        preheader: 'Source: exhibition QR code · Industry: solar & energy.',
        reason: 'You received this because new-lead notifications are on for your marketing account.',
        body:
          label('Marketing') +
          h1('A new lead came in') +
          facts([
            ['Source', 'Exhibition QR code'],
            ['Campaign', 'utm_campaign=expo-demo'],
            ['Interest', 'Solar & energy'],
            ['Landing page', '/industries/solar-and-energy'],
          ]) +
          p('Contact details are available in the portal to team members with lead access.') +
          button('View lead', `${SITE}/portal/marketing/leads`),
      }),
  },
  {
    id: 'digest',
    name: 'Daily notification digest',
    audience: 'All staff roles',
    trigger: 'Once a day, when there is unread activity',
    subject: 'Your RuralReact summary for today',
    render: () =>
      layout({
        preheader: '2 RFQs assigned · 1 review requested · 1 customer reply.',
        reason: 'You received this because daily digests are on. Change it under Profile → Notifications.',
        body:
          label('Daily digest') +
          h1('What changed today') +
          facts([
            ['RFQs assigned', '2'],
            ['Technical reviews requested', '1'],
            ['Customer clarifications', '1'],
            ['Tasks due this week', '4'],
          ]) +
          button('Open notifications', `${SITE}/portal`),
      }),
  },
]

export const emailById = (id: string) => emailTemplates.find((t) => t.id === id)
