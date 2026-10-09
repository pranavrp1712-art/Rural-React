import {
  Broadcast,
  Cpu,
  Drop,
  Flask,
  Gauge,
  Gear,
  Package,
  SunHorizon,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react'
import { products } from '../data/content'
import {
  Container,
  IconBadge,
  Reveal,
  SectionHeading,
  StatusLed,
} from './primitives'
import { toneCycle } from '../data/tones'

const productIcon: Record<string, PhosphorIcon> = {
  'solar-dryer': SunHorizon,
  'wwt-unit': Drop,
  'lab-kit': Flask,
  'gateway-pcb': Broadcast,
  panel: Package,
  transmitter: Gauge,
  'plc-mcu': Cpu,
  'control-system': Gear,
}

export function Products() {
  return (
    <section
      id="products"
      className="border-t border-rule bg-card/70 py-20 md:py-24"
    >
      <Container>
        <Reveal>
          <SectionHeading
            label="PRODUCTS"
            title="What we build, and how far along each one is"
            intro="Read this as a spec sheet rather than a catalogue. The status lamp on each row says whether it can be ordered today, is running as a pilot, or is still on the bench."
          />
        </Reveal>

        <div className="mt-12">
          <div className="overflow-hidden rounded-xl border border-rule bg-card shadow-(--shadow-e1)">
            {/* Column header, styled like a nameplate strip */}
            <div className="hidden grid-cols-[44px_minmax(0,1.5fr)_minmax(0,1.6fr)_140px] gap-4 border-b border-rule bg-sunk/80 px-6 py-3.5 font-mono text-xs font-semibold tracking-wide text-ink-faint lg:grid">
              <span aria-hidden="true" />
              <span>PRODUCT & HARDWARE</span>
              <span>ENGINEERING SPECIFICATION</span>
              <span>DEPLOYMENT STATUS</span>
            </div>

            <ul role="list">
              {products.map((product, index) => (
                <Reveal
                  as="li"
                  key={product.id}
                  delay={index * 40}
                  className="spotlight relative grid gap-4 border-b border-rule bg-card px-5 py-5 transition-[border-color,background-color,color,box-shadow,transform] duration-200 last:border-b-0 hoverable:hover:bg-hover/50 md:px-7 lg:grid-cols-[44px_minmax(0,1.5fr)_minmax(0,1.6fr)_140px] lg:items-start group"
                >
                  <div className="hidden lg:block pt-1">
                    <IconBadge
                      icon={productIcon[product.id] ?? Package}
                      tone={toneCycle[index % toneCycle.length]}
                      size="sm"
                    />
                  </div>

                  <div className="flex gap-3">
                    <div className="lg:hidden">
                      <IconBadge
                        icon={productIcon[product.id] ?? Package}
                        tone={toneCycle[index % toneCycle.length]}
                        size="sm"
                      />
                    </div>
                    <div>
                      <span className="font-mono text-xs font-bold text-signal-ink">
                        {product.tag}
                      </span>
                      <h3 className="text-base font-bold text-ink group-hover:text-signal-ink transition-colors">
                        {product.name}
                      </h3>
                      <p className="mt-1 max-w-[520px] text-sm leading-relaxed text-ink-muted">
                        {product.line}
                      </p>
                    </div>
                  </div>

                  <dl className="space-y-1.5 bg-sunk/40 rounded-lg p-3 border border-rule/50">
                    {product.specs.map((spec) => (
                      <div key={spec.label} className="flex items-center gap-3 text-xs">
                        <dt className="w-28 shrink-0 font-mono font-medium text-ink-faint">
                          {spec.label}:
                        </dt>
                        <dd className="font-medium text-ink">{spec.value}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="lg:pt-2">
                    <StatusLed status={product.status} />
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>

          <p className="mt-4 text-sm text-ink-faint">
            Specifications marked to be verified are confirmed during the
            requirement study rather than published ahead of it.
          </p>
        </div>
      </Container>
    </section>
  )
}
