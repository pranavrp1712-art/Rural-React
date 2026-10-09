import { Link } from 'react-router-dom'
import { PageHeader, PageSection } from '../components/pageKit'
import { usePageMeta } from '../lib/usePageMeta'

const routes = [
  { to: '/industries', label: 'Industries', blurb: 'Water, chemical, manufacturing, cold chain, waste, energy and mining.' },
  { to: '/products', label: 'Products', blurb: 'Control panels, gateways, dryers, treatment units and development categories.' },
  { to: '/configure', label: 'Configure my solution', blurb: 'The requirement wizard, start to finish.' },
  { to: '/configurators', label: 'Configurators', blurb: 'PLC, I/O calculator, control panel and HMI.' },
  { to: '/iiot', label: 'IIoT demo dashboard', blurb: 'A live looking dashboard running on demo data.' },
  { to: '/standards', label: 'Standards and OT security', blurb: 'What we design with reference to, and how the boundary works.' },
]

export default function NotFound() {
  usePageMeta({
    title: 'Page not found',
    description: 'That page does not exist on ruralreact.in. Here is where everything else lives.',
    path: '/404',
  })

  return (
    <>
      <PageHeader
        label="ERROR 404"
        title="That page is not here"
        intro="The address did not match anything on this site. Nothing has broken; the link was probably just wrong or out of date."
        trail={[{ label: 'Home', to: '/' }, { label: 'Not found' }]}
      />
      <PageSection label="WHERE TO GO" title="Everything on this site">
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" role="list">
          {routes.map((route) => (
            <li key={route.to}>
              <Link
                to={route.to}
                className="group flex h-full flex-col rounded-xl border border-rule bg-card p-5 shadow-(--shadow-e1) transition-[border-color,background-color,color,box-shadow] duration-200 hoverable:hover:border-signal-orange/40"
              >
                <span className="text-base font-bold text-ink">{route.label}</span>
                <span className="mt-1.5 text-sm text-ink-muted">{route.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </PageSection>
    </>
  )
}
