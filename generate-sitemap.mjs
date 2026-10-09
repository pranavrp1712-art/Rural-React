/**
 * Generates public/sitemap.xml from the route list, so adding an
 * industry or a product cannot silently leave the sitemap stale.
 * Run via `npm run sitemap`; the build runs it first.
 */
import { writeFileSync } from 'node:fs'

const SITE = 'https://ruralreact.in'

// Kept in step with src/App.tsx and the two data files by hand, which
// is fine while the route table is this small and explicit.
const industrySlugs = [
  'water-and-wastewater', 'chemical-and-process', 'manufacturing-and-msme',
  'agriculture-and-cold-chain', 'waste-management', 'solar-and-energy',
  'mining-and-heavy-industry', 'other-and-custom',
]
const productSlugs = [
  'solar-dryer', 'wastewater-and-purification-unit', 'chemical-and-water-testing-lab-kit',
  'iot-gateway-and-custom-pcb', 'custom-industrial-control-panel',
  'sensor-transmitter', 'plc-and-microcontroller', 'control-system',
]

const routes = [
  { path: '/', priority: '1.0', freq: 'weekly' },
  { path: '/industries', priority: '0.9', freq: 'monthly' },
  { path: '/products', priority: '0.9', freq: 'monthly' },
  { path: '/control-panels', priority: '0.9', freq: 'monthly' },
  { path: '/configure', priority: '0.9', freq: 'monthly' },
  { path: '/configurators', priority: '0.8', freq: 'monthly' },
  { path: '/iiot', priority: '0.7', freq: 'monthly' },
  { path: '/rfq', priority: '0.6', freq: 'monthly' },
  { path: '/standards', priority: '0.6', freq: 'yearly' },
  { path: '/case-studies', priority: '0.5', freq: 'monthly' },
  ...industrySlugs.map((s) => ({ path: `/industries/${s}`, priority: '0.8', freq: 'monthly' })),
  ...productSlugs.map((s) => ({ path: `/products/${s}`, priority: '0.8', freq: 'monthly' })),
]

const today = new Date().toISOString().slice(0, 10)
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (r) => `  <url>
    <loc>${SITE}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.freq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`

writeFileSync(new URL('./public/sitemap.xml', import.meta.url), xml)
console.log(`sitemap.xml written with ${routes.length} routes`)
