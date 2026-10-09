/**
 * Exercises the sign-in prototype (md/login.md): every role reaches only
 * its own dashboard, the guard refuses by URL, and each error state and
 * account flow behaves. Run against `vite preview` (npm run portal).
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE ?? 'http://localhost:4173'
const PASSWORD = 'Demo@2026'

const browser = await chromium.launch()
const checks = []
const errors = []
const check = (name, actual, expected) => {
  const ok = String(actual) === String(expected)
  checks.push({ name, ok })
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name.padEnd(58)} got=${actual} want=${expected}`)
}

/** Fresh browser context per scenario, so storage never leaks between them. */
async function fresh() {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  return { context, page }
}

async function signIn(page, role, email, password = PASSWORD) {
  await page.goto(`${BASE}/login/${role}`, { waitUntil: 'networkidle' })
  await page.locator('input[autocomplete="username"]').fill(email)
  await page.locator('input[autocomplete="current-password"]').fill(password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await page.waitForTimeout(700)
}

const h1 = (page) => page.locator('h1').first().innerText()

/** Sign out of the current account (same tab) and in as another. */
async function switchTo(page, role, email, password = PASSWORD) {
  await page.evaluate(() => sessionStorage.removeItem('rr-demo-session'))
  await signIn(page, role, email, password)
}

/** The headline numbers in the KPI tiles on the current page. */
const kpiValues = (page) => page.locator('main .readout.font-display').allInnerTexts()

/* ---- Each role lands on its own dashboard ------------------------ */
for (const [role, email, landing] of [
  ['customer', 'customer@example.demo', 'Welcome, Demo'],
  ['engineering', 'engineer@ruralreact.demo', 'My assigned RFQs'],
  ['marketing', 'marketing@ruralreact.demo', 'Marketing overview'],
]) {
  const { context, page } = await fresh()
  await signIn(page, role, email)
  check(`${role}: lands on /portal/${role}`, new URL(page.url()).pathname, `/portal/${role}`)
  check(`${role}: dashboard heading`, (await h1(page)).trim(), landing)
  await context.close()
}

/* ---- Super Admin: single-step sign-in, audit entry, guard -------- */
{
  const { context, page } = await fresh()
  await signIn(page, 'admin', 'owner@ruralreact.demo')
  check('admin: no second step, lands on command center', (await h1(page)).trim(), 'Command center')
  check('admin: no verification code field anywhere', await page.getByLabel('Verification code').count(), 0)

  await page.goto(`${BASE}/portal/admin/audit`, { waitUntil: 'networkidle' })
  check('admin: audit log records the sign-in', await page.getByRole('cell', { name: 'Signed in' }).count() > 0, true)

  await page.goto(`${BASE}/portal/customer`, { waitUntil: 'networkidle' })
  check('admin → /portal/customer is refused (403)', await page.getByText('This workspace belongs to another role').isVisible(), true)

  // A fresh install has no records: every figure starts at zero.
  await page.goto(`${BASE}/portal/admin`, { waitUntil: 'networkidle' })
  await page.getByText('Unassigned RFQs').waitFor()
  check('admin: every command-center KPI starts at zero', (await kpiValues(page)).every((v) => /^(₹)?0$/.test(v.trim())), true)
  check('admin: no invented system health', await page.getByText('Monitoring not connected').isVisible(), true)
  await page.goto(`${BASE}/portal/admin/team-marketing/leads`, { waitUntil: 'networkidle' })
  check('admin: marketing drill-down reuses Leads', (await h1(page)).trim(), 'Leads')
  await page.getByText('No leads yet').waitFor()
  check('admin: no seeded leads', true, true)
  await page.goto(`${BASE}/portal/admin/rfqs`, { waitUntil: 'networkidle' })
  await page.getByText('No RFQs yet').waitFor()
  check('admin: no seeded RFQs', true, true)
  await context.close()
}

/* ---- Guard: signed out, wrong role, unknown section -------------- */
{
  const { context, page } = await fresh()
  await page.goto(`${BASE}/portal/engineering/queue`, { waitUntil: 'networkidle' })
  const url = new URL(page.url())
  check('signed out → role login', url.pathname, '/login/engineering')
  check('signed out → keeps next=', url.searchParams.get('next'), '/portal/engineering/queue')

  await signIn(page, 'engineering', 'engineer@ruralreact.demo')
  // The login page was opened with ?next=, but signIn navigates fresh, so land on home.
  await page.goto(`${BASE}/portal/marketing`, { waitUntil: 'networkidle' })
  check('engineer → /portal/marketing is refused', await page.getByText('This workspace belongs to another role').isVisible(), true)
  await page.goto(`${BASE}/portal/engineering/pricing`, { waitUntil: 'networkidle' })
  check('engineer → pricing section not available', await page.getByText('That page is not part of your workspace').isVisible(), true)
  await page.goto(`${BASE}/portal/engineering/queue`, { waitUntil: 'networkidle' })
  await page.getByText('The queue is empty').waitFor()
  check('engineer: queue starts empty', true, true)
  await context.close()
}

/* ---- Customer never sees another customer or internal data ------ */
{
  const { context, page } = await fresh()
  await signIn(page, 'customer', 'customer@example.demo')
  await page.getByText('No projects yet').waitFor()
  await page.getByText('No RFQs yet').waitFor()
  check('demo customer: starts with no projects or RFQs', true, true)
  const text = await page.locator('main').innerText()
  check('customer: no internal margin/cost shown', /margin|internal cost/i.test(text), false)
  await context.close()
}

/* ---- Error states ------------------------------------------------ */
{
  const { context, page } = await fresh()
  await signIn(page, 'customer', 'customer@example.demo', 'wrong-password')
  check('wrong password → error', await page.getByText("That email and password don't match").isVisible(), true)

  await signIn(page, 'customer', 'engineer@ruralreact.demo')
  check('team account at customer login → redirect hint', await page.getByText('This account signs in somewhere else').isVisible(), true)

  await signIn(page, 'customer', 'locked@example.demo')
  check('locked account → locked message', await page.getByText('This account is locked').isVisible(), true)

  await signIn(page, 'customer', 'unverified@example.demo')
  check('unverified account → confirm email message', await page.getByText('Confirm your email first').isVisible(), true)

  await page.goto(`${BASE}/login/customer`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  check('empty submit → field errors', await page.getByText('Enter the email you sign in with.').isVisible(), true)
  await context.close()
}

/* ---- Lockout after five failures, unlocked by a reset ----------- */
{
  const { context, page } = await fresh()
  for (let i = 0; i < 5; i++) await signIn(page, 'marketing', 'marketing@ruralreact.demo', `bad-${i}`)
  check('five failures lock the account', await page.getByText('This account is locked').isVisible(), true)

  await page.goto(`${BASE}/forgot-password?role=marketing&email=marketing@ruralreact.demo`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Send reset link' }).click()
  await page.waitForTimeout(700)
  check('reset: neutral "check your inbox" message', await page.getByText('If an account exists for').isVisible(), true)
  await page.getByRole('link', { name: 'Open the reset link (demo)' }).click()
  await page.waitForTimeout(300)
  await page.getByLabel(/^New password/).fill('NewPass2026x')
  await page.getByLabel(/^Confirm new password/).fill('NewPass2026x')
  await page.getByRole('button', { name: 'Save new password' }).click()
  await page.waitForTimeout(300)
  await signIn(page, 'marketing', 'marketing@ruralreact.demo', 'NewPass2026x')
  check('reset unlocks and new password works', new URL(page.url()).pathname, '/portal/marketing')
  await context.close()
}

/* ---- Customer self sign-up with email verification -------------- */
{
  const { context, page } = await fresh()
  await page.goto(`${BASE}/signup`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Create account' }).click()
  check('signup: empty submit shows error summary', await page.getByText(/Fix these \d to continue/).isVisible(), true)
  await page.getByLabel(/^Your name/).fill('New Customer')
  await page.getByLabel(/^Company or organisation/).fill('New Plant Pvt Ltd')
  await page.getByLabel(/^Work email/).fill('new@plant.demo')
  await page.getByLabel(/^Password/).fill('Plant2026pass')
  await page.getByLabel(/^Confirm password/).fill('Plant2026pass')
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.waitForTimeout(800)
  check('signup → verify-email screen', new URL(page.url()).pathname, '/verify-email')

  await signIn(page, 'customer', 'new@plant.demo', 'Plant2026pass')
  check('unverified signup cannot sign in yet', await page.getByText('Confirm your email first').isVisible(), true)

  await page.goto(`${BASE}/verify-email?email=new@plant.demo`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Preview the email (demo)' }).click()
  check('verification email preview renders', await page.frameLocator('iframe').getByText('Confirm your email address').isVisible(), true)
  await page.getByRole('button', { name: 'Confirm my email (demo)' }).click()
  await page.waitForTimeout(300)
  await signIn(page, 'customer', 'new@plant.demo', 'Plant2026pass')
  check('verified signup lands on customer dashboard', new URL(page.url()).pathname, '/portal/customer')

  // Sign out of all sessions ends this one too.
  await page.goto(`${BASE}/portal/customer/logins`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Sign out of all sessions' }).click()
  await page.getByRole('button', { name: 'Yes, sign out of all sessions' }).click()
  await page.waitForTimeout(300)
  await page.goto(`${BASE}/portal/customer`, { waitUntil: 'networkidle' })
  check('after sign-out-all, portal needs sign-in', new URL(page.url()).pathname, '/login/customer')
  await context.close()
}

/* ---- IIoT: locked → requested → provisioned, never sample values -- */
{
  const { context, page } = await fresh()
  await signIn(page, 'customer', 'customer@example.demo')
  await page.goto(`${BASE}/portal/customer/iiot`, { waitUntil: 'networkidle' })
  await page.getByText('Locked until your site is connected').waitFor()
  check('iiot: locked by default', true, true)
  await page.getByRole('button', { name: 'Request IIoT Monitoring' }).click()
  check('iiot: request validates', await page.getByText('Name the site or equipment to monitor.').isVisible(), true)
  await page.getByLabel(/^Site or equipment/).fill('ETP at Plant 2')
  await page.getByLabel('pH', { exact: true }).check()
  await page.getByLabel('Flow', { exact: true }).check()
  await page.getByRole('button', { name: 'Request IIoT Monitoring' }).click()
  await page.getByText('Requested — Pending Provisioning').first().waitFor()
  check('iiot: status becomes Requested — Pending Provisioning', true, true)
  await page.locator('nav [title="Requested — Pending Provisioning"]').waitFor({ timeout: 5000 })
  check('iiot: sidebar item shows Requested pill', await page.locator('nav [title="Requested — Pending Provisioning"]').isVisible(), true)
  await page.getByRole('button', { name: 'Log out' }).first().click()
  await page.waitForTimeout(300)

  await signIn(page, 'engineering', 'engineer@ruralreact.demo')
  await page.getByText('IIoT dashboard requests').first().waitFor()
  await page.waitForTimeout(600)
  const tile = await page.getByRole('link', { name: /IIoT dashboard requests/ }).innerText()
  check('engineer: IIoT request badge counts 1', /\b1\b/.test(tile), true)
  await page.goto(`${BASE}/portal/engineering/iiot-requests`, { waitUntil: 'networkidle' })
  await page.getByText('Demo Process Industries · ETP at Plant 2').waitFor()
  await page.getByRole('button', { name: 'Provision and unlock for customer' }).click()
  check('engineer: provisioning requires confirmation', await page.getByText('Confirm the data pipeline before unlocking the customer.').isVisible(), true)
  await page.getByLabel(/^Gateway ID/).fill('GW-DEMO-07')
  await page.getByLabel(/^Connected devices/).fill('AIT-101 pH, FIT-102 flow')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Provision and unlock for customer' }).click()
  await page.getByText('Provisioned', { exact: true }).first().waitFor()
  check('engineer: request provisioned', true, true)
  await page.getByRole('button', { name: 'Log out' }).first().click()
  await page.waitForTimeout(300)

  await signIn(page, 'customer', 'customer@example.demo')
  await page.goto(`${BASE}/portal/customer/iiot`, { waitUntil: 'networkidle' })
  await page.getByText('Connected: ETP at Plant 2').waitFor()
  check('iiot: provisioned dashboard unlocks', true, true)
  const body = await page.locator('main').innerText()
  check('iiot: shows "No data received yet", not sample values', body.includes('No data received yet') && !/\d+\.\d+\s*(pH|m3)/.test(body), true)
  await context.close()
}

/* ---- Loading, error and retry states ----------------------------- */
{
  const { context, page } = await fresh()
  await signIn(page, 'customer', 'customer@example.demo')
  await page.evaluate(() => localStorage.setItem('rr-demo-fail', '1'))
  await page.goto(`${BASE}/portal/customer/quotes`, { waitUntil: 'networkidle' })
  await page.getByText("Couldn't load this").first().waitFor()
  check('error state with retry when the API fails', await page.getByRole('button', { name: 'Try again' }).first().isVisible(), true)
  await page.evaluate(() => localStorage.removeItem('rr-demo-fail'))
  await page.getByRole('button', { name: 'Try again' }).first().click()
  await page.getByText('No quotations yet').first().waitFor()
  check('retry recovers and loads data', true, true)
  await context.close()
}

/* ---- New customer sees empty states, never sample rows ----------- */
{
  const { context, page } = await fresh()
  await page.goto(`${BASE}/signup`, { waitUntil: 'networkidle' })
  await page.getByLabel(/^Your name/).fill('Empty Org')
  await page.getByLabel(/^Company or organisation/).fill('Empty Org Pvt Ltd')
  await page.getByLabel(/^Work email/).fill('empty@org.demo')
  await page.getByLabel(/^Password/).fill('Empty2026pass')
  await page.getByLabel(/^Confirm password/).fill('Empty2026pass')
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.getByRole('button', { name: 'Confirm my email (demo)' }).click()
  await page.waitForTimeout(300)
  await signIn(page, 'customer', 'empty@org.demo', 'Empty2026pass')
  await page.getByText('No projects yet').waitFor()
  check('new customer: empty projects state', true, true)
  check('new customer: no RFQs from anyone else', await page.getByText(/RFQ-\d/).count(), 0)
  await context.close()
}

/* ---- Shell: search, collapse persistence, theme ------------------ */
{
  const { context, page } = await fresh()
  await signIn(page, 'engineering', 'engineer@ruralreact.demo')
  await page.getByRole('combobox', { name: /Search/ }).fill('queue')
  await page.getByRole('option').first().waitFor()
  await page.keyboard.press('Enter')
  await page.getByRole('heading', { name: 'Engineering queue' }).waitFor()
  check('search: scoped result opens the page', new URL(page.url()).pathname, '/portal/engineering/queue')
  check('search: another role\'s pages are not offered', await (async () => {
    await page.getByRole('combobox', { name: /Search/ }).fill('pricing')
    await page.waitForTimeout(700)
    return page.getByRole('option').count()
  })(), 0)

  await page.getByRole('button', { name: 'Collapse sidebar' }).click()
  await page.reload({ waitUntil: 'networkidle' })
  check('sidebar: collapsed state persists', await page.getByRole('button', { name: 'Expand sidebar' }).isVisible(), true)

  await page.getByRole('radio', { name: 'Dark' }).count() // segmented hidden when collapsed
  await page.getByRole('button', { name: /^Theme:/ }).first().click() // system → light
  await page.getByRole('button', { name: /^Theme:/ }).first().click() // light → dark
  check('theme: toggled to dark', await page.evaluate(() => document.documentElement.dataset.theme), 'dark')
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
  check('theme: choice persists to the public site', await page.evaluate(() => document.documentElement.dataset.theme), 'dark')
  await context.close()

  const dark = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' })
  const p2 = await dark.newPage()
  await p2.goto(`${BASE}/`, { waitUntil: 'commit' })
  await p2.waitForSelector('html[data-theme]')
  check('theme: follows OS dark preference before paint', await p2.evaluate(() => document.documentElement.dataset.theme), 'dark')
  await dark.close()
}

/* ---- From zero: website → RFQ → engineering → quote → project ---- */
{
  const { context, page } = await fresh()

  // Public site: a tagged visit, a product page and the enquiry form.
  await page.goto(`${BASE}/?utm_source=linkedin&utm_medium=social&utm_campaign=launch`, { waitUntil: 'networkidle' })
  await page.goto(`${BASE}/products/solar-dryer`, { waitUntil: 'networkidle' })
  await page.goto(`${BASE}/#quote`, { waitUntil: 'networkidle' })
  await page.locator('#cta-email').fill('buyer@plant.example')
  await page.locator('#cta-requirement').fill('pH dosing for a 20 m3/h effluent plant')
  await page.getByRole('button', { name: 'Send requirement' }).click()
  await page.getByText('REQUIREMENT STUDY RECEIVED').waitFor()

  await signIn(page, 'marketing', 'marketing@ruralreact.demo')
  await page.getByText('Page views').first().waitFor()
  const views = Number((await kpiValues(page))[0])
  check('marketing: page views counted from real visits', views >= 3, true)
  await page.goto(`${BASE}/portal/marketing/leads`, { waitUntil: 'networkidle' })
  await page.getByText('L-0001').waitFor()
  check('marketing: enquiry arrives as lead L-0001, campaign kept', await page.getByText('launch').first().isVisible(), true)

  // Customer submits an RFQ from their portal.
  await switchTo(page, 'customer', 'customer@example.demo')
  await page.goto(`${BASE}/portal/customer/rfqs`, { waitUntil: 'networkidle' })
  await page.getByLabel(/^Requirement/).fill('Solar dryer control and energy logging')
  await page.getByLabel(/^Industry/).selectOption({ index: 1 })
  await page.getByRole('button', { name: 'Submit RFQ' }).click()
  await page.getByText('RFQ-0001 submitted').waitFor()
  await page.getByRole('cell', { name: 'RFQ-0001', exact: true }).waitFor()
  check('customer: RFQ-0001 submitted and listed', true, true)

  // Engineer picks it up, configures, asks, submits.
  await switchTo(page, 'engineering', 'engineer@ruralreact.demo')
  await page.goto(`${BASE}/portal/engineering/queue`, { waitUntil: 'networkidle' })
  await page.getByRole('link', { name: 'RFQ-0001' }).click()
  await page.getByRole('button', { name: 'Assign to me' }).click()
  await page.getByText('RFQ-0001 is now assigned to you').waitFor()
  await page.getByLabel('Analog inputs points').fill('4')
  await page.getByRole('button', { name: '+ Add line' }).click()
  await page.getByLabel('Item for line 1').fill('Solar dryer controller')
  await page.getByRole('button', { name: 'Save configuration' }).click()
  await page.getByText('Configuration saved').waitFor()
  await page.getByLabel('Ask the customer').fill('What is the highest chamber temperature?')
  await page.getByRole('button', { name: 'Send question' }).click()
  await page.getByText('Question sent to the customer').waitFor()
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByLabel('Item for line 1').waitFor()
  check('engineer: configuration persists after reload', await page.getByLabel('Item for line 1').inputValue(), 'Solar dryer controller')
  await page.getByRole('button', { name: 'Submit for technical owner approval' }).click()
  await page.getByRole('button', { name: 'Submit for approval' }).click()
  await page.getByText('Submitted for technical owner approval').first().waitFor()
  check('engineer: submitted for approval', true, true)

  // Customer sees the question and answers it.
  await switchTo(page, 'customer', 'customer@example.demo')
  await page.goto(`${BASE}/portal/customer/discussions`, { waitUntil: 'networkidle' })
  await page.getByText('What is the highest chamber temperature?').waitFor()
  check('customer: engineer question reaches discussions', true, true)

  // Super Admin issues the quotation.
  await switchTo(page, 'admin', 'owner@ruralreact.demo')
  await page.goto(`${BASE}/portal/admin/quotes`, { waitUntil: 'networkidle' })
  await page.getByLabel(/^Amount/).fill('480000')
  await page.getByRole('button', { name: 'Approve and issue quotation' }).click()
  await page.getByRole('cell', { name: 'Q-0001', exact: true }).waitFor()
  check('admin: quotation Q-0001 issued', true, true)

  // Customer accepts; a project starts.
  await switchTo(page, 'customer', 'customer@example.demo')
  await page.goto(`${BASE}/portal/customer/quotes`, { waitUntil: 'networkidle' })
  await page.getByText('₹4,80,000').waitFor()
  await page.getByRole('button', { name: 'Accept quotation' }).click()
  await page.getByRole('button', { name: 'Yes, accept' }).click()
  await page.goto(`${BASE}/portal/customer/projects`, { waitUntil: 'networkidle' })
  await page.getByText('PRJ-0001').waitFor()
  check('customer: accepting starts project PRJ-0001', true, true)

  // Super Admin sees it all, then erases back to zero.
  await switchTo(page, 'admin', 'owner@ruralreact.demo')
  await page.goto(`${BASE}/portal/admin/customers`, { waitUntil: 'networkidle' })
  await page.getByRole('link', { name: 'Demo Process Industries' }).waitFor()
  check('admin: customer now shows Active project', await page.getByRole('row', { name: /Demo Process Industries/ }).getByText('Active project').isVisible(), true)
  await page.goto(`${BASE}/portal/admin/settings`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Erase all records' }).click()
  await page.getByRole('button', { name: 'Yes, erase everything' }).click()
  await page.goto(`${BASE}/portal/admin`, { waitUntil: 'networkidle' })
  await page.getByText('Unassigned RFQs').waitFor()
  check('admin: erase returns every KPI to zero', (await kpiValues(page)).every((v) => /^(₹)?0$/.test(v.trim())), true)
  await context.close()
}

/* ---- Home page entry paths and consultation (md/main.md) --------- */
{
  const { context, page } = await fresh()
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  check('home: vendor-neutral positioning near the top', await page.getByRole('heading', { name: 'Vendor-neutral automation engineering and system integration partner.' }).isVisible(), true)
  check('home: three entry paths', await page.locator('#start li > div').count(), 3)
  await page.getByRole('link', { name: 'Consult an Automation Engineer' }).first().click()
  await page.waitForURL('**/consult')
  await page.getByRole('button', { name: 'Request a consultation' }).click()
  check('consult: validation moves focus to first error', await page.evaluate(() => document.activeElement?.id), 'c-name')
  await page.locator('#c-name').fill('Plant Engineer')
  await page.locator('#c-company').fill('Riverside Dairy')
  await page.locator('#c-email').fill('eng@riverside.example')
  await page.locator('#c-message').fill('Cold room temperatures drift overnight and nobody is alerted.')
  await page.getByRole('button', { name: 'Request a consultation' }).click()
  await page.getByText(/CONSULTATION REQUEST RECORDED · L-0001/).waitFor()
  check('consult: request recorded as lead L-0001', true, true)
  await signIn(page, 'engineering', 'engineer@ruralreact.demo')
  await page.goto(`${BASE}/portal/engineering/notifications`, { waitUntil: 'networkidle' })
  await page.getByText('Consultation requested').waitFor()
  check('consult: engineering is notified', true, true)
  await context.close()
}

await browser.close()

const failed = checks.filter((c) => !c.ok)
if (errors.length) console.log('\nPage errors:\n' + [...new Set(errors)].join('\n'))
if (failed.length || errors.length) {
  console.log(`\n${failed.length} check(s) failed.`)
  process.exit(1)
}
console.log('\nAll portal checks passed.')
