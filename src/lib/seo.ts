/**
 * Per route document metadata. The brief asks for Next.js metadata, but
 * this is a Vite SPA, so the same fields are written into the live
 * document head on navigation and torn down on unmount. Anything a
 * crawler needs that cannot be set this way (sitemap, robots) ships as
 * a static file in `public/`.
 */

const SITE = 'https://ruralreact.in'
const SUFFIX = 'RuralReact'

export interface SeoInput {
  title: string
  description: string
  /** Route path, leading slash. Used for canonical and og:url. */
  path: string
  /** Absolute or root relative image for social cards. */
  image?: string
  /** JSON-LD, serialised into a script tag that is removed on unmount. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

/** Upsert a meta tag, remembering whether we created it so we can undo. */
function setMeta(selector: string, attr: 'name' | 'property', key: string, value: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(selector)
  let created = false
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, key)
    document.head.appendChild(tag)
    created = true
  }
  const previous = tag.getAttribute('content')
  tag.setAttribute('content', value)
  return () => {
    if (created) tag.remove()
    else if (previous !== null) tag.setAttribute('content', previous)
  }
}

export function applySeo({ title, description, path, image = '/hero-plant.png', jsonLd }: SeoInput) {
  const url = `${SITE}${path}`
  const fullTitle = title.includes(SUFFIX) ? title : `${title} — ${SUFFIX}`
  const undo: Array<() => void> = []

  const previousTitle = document.title
  document.title = fullTitle
  undo.push(() => {
    document.title = previousTitle
  })

  undo.push(setMeta('meta[name="description"]', 'name', 'description', description))
  undo.push(setMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle))
  undo.push(setMeta('meta[property="og:description"]', 'property', 'og:description', description))
  undo.push(setMeta('meta[property="og:url"]', 'property', 'og:url', url))
  undo.push(setMeta('meta[property="og:image"]', 'property', 'og:image', `${SITE}${image}`))
  undo.push(setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle))
  undo.push(setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description))

  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.appendChild(canonical)
  }
  const previousCanonical = canonical.href
  canonical.href = url
  undo.push(() => {
    if (canonical) canonical.href = previousCanonical
  })

  if (jsonLd) {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.dataset.route = path
    script.textContent = JSON.stringify(jsonLd)
    document.head.appendChild(script)
    undo.push(() => script.remove())
  }

  return () => undo.forEach((fn) => fn())
}

/** The organisation card, reused as the base node of every page's JSON-LD. */
export const organisationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'RuralReact',
  url: SITE,
  description:
    'Industrial automation and IIoT engineering: sensors, PLC, control panels, gateways and cloud monitoring, configured for the process.',
  areaServed: 'IN',
  knowsAbout: [
    'Industrial automation',
    'PLC programming',
    'Control panel manufacturing',
    'Water and wastewater automation',
    'Industrial IoT',
  ],
}

export { SITE }
