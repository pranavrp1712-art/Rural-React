/**
 * Exercises the stateful parts: the I/O calculator maths, the wizard's
 * conditional steps and completeness score, and whether the draft
 * actually survives a navigation via local storage.
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE ?? 'http://localhost:4173'
const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
const page = await context.newPage()

const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

const checks = []
const check = (name, actual, expected) => {
  const ok = String(actual) === String(expected)
  checks.push({ name, ok, actual, expected })
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name.padEnd(52)} got=${actual} want=${expected}`)
}

/* ---- I/O calculator -------------------------------------------- */
await page.goto(`${BASE}/configurators`, { waitUntil: 'networkidle' })
await page.waitForTimeout(500)

// 3 pH sensors  -> 3 AI
// 2 dosing pumps -> 2 DI, 2 DO, 2 AO
// 1 VFD motor    -> 1 DI, 1 DO, 1 AO, 1 comms
// Totals: DI 3, DO 3, AI 3, AO 3, comms 1
await page.fill('#qty-phSensor', '3')
await page.fill('#qty-dosingPump', '2')
await page.fill('#qty-vfdMotor', '1')
await page.waitForTimeout(400)

const readRow = async (label) =>
  page.evaluate((l) => {
    const th = [...document.querySelectorAll('th[scope="row"]')].find(
      (n) => n.textContent.trim() === l,
    )
    if (!th) return null
    const cells = [...th.parentElement.querySelectorAll('td')].map((c) => c.textContent.trim())
    return cells.join('|')
  }, label)

// Required | Recommended | Diff | Cards.
// Spare is 20%: ceil(3*1.2)=4, rounded up to one 16pt DI card = 16.
check('I/O: Digital Inputs row', await readRow('Digital Inputs'), '3|16|+13|1')
// AI cards are 8pt: ceil(3*1.2)=4 -> rounds to 8.
check('I/O: Analog Inputs row', await readRow('Analog Inputs'), '3|8|+5|1')
// AO cards are 4pt: ceil(3*1.2)=4 -> stays 4.
check('I/O: Analog Outputs row', await readRow('Analog Outputs'), '3|4|+1|1')
check('I/O: Comm nodes row', await readRow('Comm. nodes'), '1|1|—|—')

// Spare at 0% must collapse required and recommended to the same module rounding.
await page.evaluate(() => {
  const slider = document.querySelector('#spare')
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
  setter.call(slider, '0')
  slider.dispatchEvent(new Event('input', { bubbles: true }))
})
await page.waitForTimeout(400)
check('I/O: AO row at 0% spare', await readRow('Analog Outputs'), '3|4|+1|1')

/* ---- Draft persists across a route change ----------------------- */
await page.goto(`${BASE}/rfq`, { waitUntil: 'networkidle' })
await page.waitForTimeout(600)
const rfqHasIo = await page.evaluate(() => document.body.innerText.includes('AI 8'))
check('RFQ picks up I/O from the calculator', rfqHasIo, 'true')

const bomShowsNoPrice = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('tbody tr')]
  return rows.length > 0 && rows.every((r) => r.lastElementChild.textContent.includes('To be configured'))
})
check('BOM shows no prices anywhere', bomShowsNoPrice, 'true')

/* ---- Wizard: conditional steps and completeness ----------------- */
await page.goto(`${BASE}/configure`, { waitUntil: 'networkidle' })
await page.waitForTimeout(500)

const pct = () =>
  page.evaluate(() => {
    const m = document.body.innerText.match(/COMPLETENESS\s+(\d+)%/)
    return m ? Number(m[1]) : -1
  })

const before = await pct()
await page.getByRole('button', { name: 'Monitor', exact: true }).click()
await page.waitForTimeout(300)
const after = await pct()
check('Completeness rises when a required field is answered', after > before, 'true')

// Goal = Monitor, so the dosing/pump questions must not be asked.
await page.getByRole('button', { name: 'Next' }).click()
await page.waitForTimeout(200)
await page.getByRole('button', { name: 'Next' }).click()
await page.waitForTimeout(200)
await page.getByRole('button', { name: 'Next' }).click()
await page.waitForTimeout(400)
const controlStepHidden = await page.evaluate(
  () => !document.body.innerText.includes('Number of dosing pumps'),
)
check('Control step is skipped for a Monitor goal', controlStepHidden, 'true')

// And is asked for a Control goal.
await page.goto(`${BASE}/configure`, { waitUntil: 'networkidle' })
await page.waitForTimeout(400)
await page.getByRole('button', { name: 'Control', exact: true }).click()
await page.waitForTimeout(300)
for (let i = 0; i < 3; i += 1) {
  await page.getByRole('button', { name: 'Next' }).click()
  await page.waitForTimeout(250)
}
const controlStepShown = await page.evaluate(() =>
  document.body.innerText.includes('Number of dosing pumps'),
)
check('Control step appears for a Control goal', controlStepShown, 'true')

/* ---- Pause control on the dashboard ----------------------------- */
await page.goto(`${BASE}/iiot`, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
await page.getByRole('button', { name: /Pause updates/ }).click()
const frozen = await page.evaluate(() => document.body.innerText.match(/(\d+\.\d+)\s*pH/)?.[1])
await page.waitForTimeout(2200)
const still = await page.evaluate(() => document.body.innerText.match(/(\d+\.\d+)\s*pH/)?.[1])
check('Pause actually stops the demo stream', frozen === still, 'true')

await browser.close()

if (errors.length) {
  console.log(`\nRuntime errors:\n${errors.slice(0, 5).join('\n')}`)
}
const failed = checks.filter((c) => !c.ok).length
console.log(failed === 0 && !errors.length ? '\nAll interaction checks passed.' : `\n${failed} failed, ${errors.length} runtime errors.`)
process.exit(failed === 0 && errors.length === 0 ? 0 : 1)
