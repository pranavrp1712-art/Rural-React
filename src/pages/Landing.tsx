import { Faqs, FinalCta } from '../components/Closing'
import { HowItWorks } from '../components/Configurator'
import { Hero } from '../components/Hero'
import { About, PanelWorkflow } from '../components/PanelWorkflow'
import { PlatformLayers } from '../components/PlatformLayers'
import { Products } from '../components/Products'
import { Industries } from '../components/Industries'
import { EntryPaths, NotSureBand, Positioning } from '../components/StartPaths'
import { usePageMeta } from '../lib/usePageMeta'
import { organisationJsonLd } from '../lib/seo'

/**
 * The home page tells one story, top to bottom: what we are, how to
 * start, who we serve, what we supply, how it fits together, how a job
 * runs, who we are, questions, and the ask. The deep tools (I/O
 * calculator, IIoT demo, standards) live on their own pages and are
 * linked from the nav and from the sections here, not repeated.
 */
export default function Landing() {
  usePageMeta({
    title: 'RuralReact — Industrial automation configured for your process',
    description:
      'Tell RuralReact what you want to measure, control, automate or monitor. We convert your requirement into a configurable industrial automation solution: sensors, PLC, control panel, IIoT gateway and cloud.',
    path: '/',
    jsonLd: [
      organisationJsonLd,
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'RuralReact',
        url: 'https://ruralreact.in',
      },
    ],
  })

  return (
    <>
      <Hero />
      <Positioning />
      <EntryPaths />
      <Industries />
      <Products />
      <PlatformLayers />
      <HowItWorks />
      <PanelWorkflow />
      <About />
      <NotSureBand compact />
      <Faqs />
      <FinalCta />
    </>
  )
}
