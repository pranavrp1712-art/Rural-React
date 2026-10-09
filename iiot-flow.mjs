/**
 * End-to-end check of the IIoT dashboard hand-off:
 *   customer requests → engineering marks "needs attention" → engineering
 *   provisions → customer's dashboard goes live, with admin watching.
 *
 * All three roles are signed in at once, one tab each, in the same browser
 * context: records live in localStorage (shared), sessions in
 * sessionStorage (per tab). So this also checks that the other tabs update
 * live, without a reload.
 *
 * Run against `vite preview`:  npm run build && npx vite preview
 *   node iiot-flow.mjs              headless
 *   HEADED=1 node iiot-flow.mjs     watch it (SLOWMO=ms to slow down)
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE ?? 'http://localhost:4173'
const PASSWORD = 'Demo@2026'
const SITE = 'ETP at Plant 2'
const ORG = 'Demo Process Industries'

const browser = await chromium.launch({ headless: !process.env.HEADED, slowMo: Number(process.env.SLOWMO ?? 0) })
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const checks = []
const errors = []
const check = (name, actual, expected) => {
  const ok = String(actual) === String(expected)
  checks.push({ name, ok })
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name.padEnd(62)} got=${actual} want=${expected}`)
}
/** Waits for a locator; records a failed check instead of throwing. */
const sees = async (name, locator, timeout = 5000) => {
  const ok = await locator.first().waitFor({ timeout }).then(() => true, () => false)
  check(name, ok, true)
}

async function tab(role, email) {
  const page = await context.newPage()
  page.on('pageerror', (e) => errors.push(`[${role}] ${e.message}`))
  page.on('console', (m) => m.type() === 'error' && errors.push(`[${role}] ${m.text()}`))
  await page.goto(`${BASE}/login/${role}`, { waitUntil: 'networkidle' })
  await page.locator('input[autocomplete="username"]').fill(email)
  await page.locator('input[autocomplete="current-password"]').fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await page.waitForURL(`**/portal/${role}`)
  return page
}

// Start from an empty store so the run is repeatable.
{
  const p = await context.newPage()
  await p.goto(BASE)
  await p.evaluate(() => localStorage.clear())
  await p.close()
}

const customer = await tab('customer', 'customer@example.demo')
const engineer = await tab('engineering', 'engineer@ruralreact.demo')
const admin = await tab('admin', 'owner@ruralreact.demo')

/* ---- 1. Customer requests monitoring ------------------------------ */
await customer.bringToFront()
await customer.goto(`${BASE}/portal/customer/iiot`, { waitUntil: 'networkidle' })
await sees('customer: dashboard locked by default', customer.getByText('Locked until your site is connected'))
await sees('customer: sidebar pill says Locked', customer.locator('nav [title^="Locked"]'))
await customer.getByRole('button', { name: 'Request IIoT Monitoring' }).click()
await sees('customer: empty form is refused (site)', customer.getByText('Name the site or equipment to monitor.'))
await sees('customer: empty form is refused (measures)', customer.getByText('Choose at least one thing to monitor.'))
await customer.getByLabel(/^Site or equipment/).fill(SITE)
for (const m of ['pH', 'Flow', 'Level']) await customer.getByLabel(m, { exact: true }).check()
await customer.getByLabel('Yes', { exact: true }).check()
await customer.getByLabel(/^Anything else/).fill('Outlet pH trips the discharge permit.')
await customer.getByRole('button', { name: 'Request IIoT Monitoring' }).click()
await sees('customer: status is Requested — Pending Provisioning', customer.getByText('Requested — Pending Provisioning'))
await sees('customer: sidebar pill says Requested', customer.locator('nav [title="Requested — Pending Provisioning"]'))
const reqId = (await customer.locator('main .font-mono').first().innerText()).trim()
check('customer: request gets an IIOT id', /^IIOT-\d+$/.test(reqId), true)

/* ---- 2. Admin sees it arrive (no reload) -------------------------- */
await admin.bringToFront()
await admin.goto(`${BASE}/portal/admin/team-engineering`, { waitUntil: 'networkidle' })
const pendingTile = admin.locator('main').getByText('IIoT requests pending').locator('..')
await sees('admin: engineering overview shows IIoT pending tile', pendingTile)
check('admin: IIoT requests pending = 1', /\b1\b/.test(await pendingTile.innerText()), true)
await admin.goto(`${BASE}/portal/admin/customers`, { waitUntil: 'networkidle' })
await admin.getByRole('link', { name: ORG }).first().click()
await sees('admin: customer record shows request pending', admin.getByText('Requested — pending provisioning'))
await sees('admin: customer record shows site and measures', admin.getByText(`${SITE} · pH, Flow, Level`))
await admin.goto(`${BASE}/portal/admin/notifications`, { waitUntil: 'networkidle' })
await sees('admin: notified "IIoT monitoring requested"', admin.getByText('IIoT monitoring requested'))

/* ---- 3. Engineering can't connect yet → customer is told ---------- */
await engineer.bringToFront()
await engineer.goto(`${BASE}/portal/engineering/notifications`, { waitUntil: 'networkidle' })
await sees('engineer: notified "New IIoT dashboard request"', engineer.getByText('New IIoT dashboard request'))
await engineer.goto(`${BASE}/portal/engineering/iiot-requests`, { waitUntil: 'networkidle' })
await sees('engineer: request listed with org · site', engineer.getByText(`${ORG} · ${SITE}`))
await sees('engineer: shows the customer notes', engineer.getByText('Outlet pH trips the discharge permit.'))
await sees('engineer: gateway on site = Yes', engineer.getByText('Yes', { exact: true }))
await engineer.getByRole('button', { name: "Can't connect yet" }).click()
await engineer.getByRole('button', { name: 'Mark as needs attention' }).click()
await sees('engineer: failing needs a reason', engineer.getByText('Say what is blocking the connection'))
await engineer.getByLabel(/^What is blocking the connection/).fill('Gateway SIM has no data plan yet.')
await engineer.getByRole('button', { name: 'Mark as needs attention' }).click()
await sees('engineer: badge becomes Needs attention', engineer.getByText('Needs attention', { exact: true }))

await customer.bringToFront()
await sees('customer (live, no reload): sees Provisioning needs attention', customer.getByText('Provisioning needs attention'))
await sees('customer: sees the reason', customer.getByText('Gateway SIM has no data plan yet.'))
await sees('customer: sidebar pill says Attention', customer.locator('nav [title="Provisioning needs attention"]'))
check('customer: dashboard still locked (no widgets)', await customer.getByText('No data received yet').count(), 0)

/* ---- 4. Engineering provisions → dashboard goes live -------------- */
await engineer.bringToFront()
await engineer.getByRole('button', { name: 'Provision and unlock for customer' }).click()
await sees('engineer: gateway ID required', engineer.getByText('Enter the gateway ID you commissioned.'))
await sees('engineer: pipeline confirmation required', engineer.getByText('Confirm the data pipeline before unlocking the customer.'))
await engineer.getByLabel(/^Gateway ID/).fill('GW-DEMO-07')
await engineer.getByLabel(/^Connected devices/).fill('AIT-101 pH, FIT-102 flow, LT-103 level')
await engineer.getByRole('checkbox').check()
await engineer.getByRole('button', { name: 'Provision and unlock for customer' }).click()
await sees('engineer: badge becomes Provisioned', engineer.getByText('Provisioned', { exact: true }))
await sees('engineer: form gone, summary shows gateway', engineer.getByText('GW-DEMO-07'))
check('engineer: provision form no longer offered', await engineer.getByRole('button', { name: 'Provision and unlock for customer' }).count(), 0)

await customer.bringToFront()
await sees(`customer (live, no reload): Connected: ${SITE}`, customer.getByText(`Connected: ${SITE}`))
await sees('customer: shows gateway id', customer.getByText('GW-DEMO-07'))
await sees('customer: sidebar pill says Live', customer.locator('nav [title="Provisioned and live"]'))
const widgets = await customer.locator('main ul[role="list"] > li > p').allInnerTexts()
check('customer: one widget per chosen measure + device health', widgets.join(', '), 'pH, Flow, Level, Device health')
const body = await customer.locator('main').innerText()
check('customer: "No data received yet", no fake readings', body.includes('No data received yet') && !/\d+\.\d+\s*(pH|m3|%)/.test(body), true)
for (const r of ['24 hours', '7 days', 'Historical']) {
  await customer.getByRole('button', { name: r, exact: true }).click()
  check(`customer: range "${r}" selectable`, await customer.getByRole('button', { name: r, exact: true }).getAttribute('aria-pressed'), 'true')
}
await sees('customer: historical range says no history yet', customer.getByText('No historical history yet.'))
await customer.goto(`${BASE}/portal/customer/notifications`, { waitUntil: 'networkidle' })
await sees('customer: notified "IIoT connection needs attention"', customer.getByText('IIoT connection needs attention'))
await sees('customer: notified "Your IIoT dashboard is unlocked"', customer.getByText('Your IIoT dashboard is unlocked'))

/* ---- 5. Admin sees the final state -------------------------------- */
await admin.bringToFront()
await admin.goto(`${BASE}/portal/admin/customers`, { waitUntil: 'networkidle' })
await admin.getByRole('link', { name: ORG }).first().click()
await sees('admin: customer record shows Provisioned', admin.locator('main').getByText('Provisioned', { exact: true }))
await admin.goto(`${BASE}/portal/admin/team-engineering`, { waitUntil: 'networkidle' })
check('admin: IIoT requests pending back to 0', /\b0\b/.test(await admin.locator('main').getByText('IIoT requests pending').locator('..').innerText()), true)

/* ---- 6. Access control -------------------------------------------- */
await admin.goto(`${BASE}/portal/engineering/iiot-requests`, { waitUntil: 'networkidle' })
check('admin cannot open engineering provisioning (403)', await admin.getByText('This workspace belongs to another role').isVisible(), true)
await customer.goto(`${BASE}/portal/engineering/iiot-requests`, { waitUntil: 'networkidle' })
check('customer cannot open engineering provisioning (403)', await customer.getByText('This workspace belongs to another role').isVisible(), true)

if (process.env.HEADED) await customer.waitForTimeout(3000)
await browser.close()

const failed = checks.filter((c) => !c.ok)
if (errors.length) console.log('\nPage errors:\n' + [...new Set(errors)].join('\n'))
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed.`)
if (failed.length || errors.length) process.exit(1)
