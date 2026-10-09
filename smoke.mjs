/**
 * Renders every route in a real browser and reports console errors,
 * failed requests, missing headings and horizontal overflow at phone
 * width. Run against `vite preview` (see npm run smoke).
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE ?? 'http://localhost:4173'

const routes = [
  '/',
  '/industries',
  '/industries/water-and-wastewater',
  '/industries/solar-and-energy',
  '/products',
  '/products/custom-industrial-control-panel',
  '/products/iot-gateway-and-custom-pcb',
  '/control-panels',
  '/configure',
  '/configurators',
  '/iiot',
  '/rfq',
  '/standards',
  '/case-studies',
  '/consult',
  '/this-route-does-not-exist',
]

const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'desktop', width: 1440, height: 900 },
]

const browser = await chromium.launch()
let failures = 0

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport })

  for (const route of routes) {
    const page = await context.newPage()
    const errors = []
    const failed = []

    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
    page.on('requestfailed', (request) => {
      failed.push(`${request.url()} — ${request.failure()?.errorText}`)
    })

    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' })
    // Give lazy route chunks and the reveal observers a beat.
    await page.waitForTimeout(400)

    const info = await page.evaluate(() => {
      const h1 = document.querySelector('h1')
      return {
        title: document.title,
        h1: h1 ? h1.textContent.trim().slice(0, 60) : null,
        h1Count: document.querySelectorAll('h1').length,
        description:
          document.querySelector('meta[name="description"]')?.getAttribute('content')?.slice(0, 40) ?? null,
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
        // Horizontal overflow is the classic mobile layout bug.
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        bodyText: document.body.innerText.length,
      }
    })

    const problems = []
    if (errors.length) problems.push(`console: ${errors.slice(0, 2).join(' | ')}`)
    if (failed.length) problems.push(`requests: ${failed.slice(0, 2).join(' | ')}`)
    if (!info.h1) problems.push('no <h1>')
    if (info.h1Count > 1) problems.push(`${info.h1Count} <h1> elements`)
    if (!info.description) problems.push('no meta description')
    if (info.overflow > 1) problems.push(`horizontal overflow ${info.overflow}px`)
    if (info.bodyText < 400) problems.push(`thin content (${info.bodyText} chars)`)

    const ok = problems.length === 0
    if (!ok) failures += 1
    console.log(
      `${ok ? 'PASS' : 'FAIL'} [${viewport.name}] ${route.padEnd(44)} ${
        ok ? `h1="${info.h1}"` : problems.join(' ;; ')
      }`,
    )

    await page.close()
  }

  await context.close()
}

await browser.close()
console.log(failures === 0 ? '\nAll routes passed.' : `\n${failures} route/viewport checks failed.`)
process.exit(failures === 0 ? 0 : 1)
