/**
 * Which products have a hand drawn working-principle schematic.
 *
 * Kept as a plain list rather than derived from the component file's
 * registry, so that file can export components only and keep React
 * Fast Refresh working. `ProductSchematic` asserts the two agree.
 */
export const schematicSlugs = [
  'solar-dryer',
  'wastewater-and-purification-unit',
  'iot-gateway-and-custom-pcb',
  'custom-industrial-control-panel',
  'chemical-and-water-testing-lab-kit',
] as const

export const hasSchematic = (slug: string) =>
  (schematicSlugs as readonly string[]).includes(slug)
