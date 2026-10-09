import { useEffect, useRef, useState } from 'react'

/**
 * Shared motion helpers. Every effect here is transform or opacity
 * only, triggered once by IntersectionObserver (never a scroll
 * listener), and resolves to its final state immediately when the
 * visitor prefers reduced motion.
 */

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** True once the element has entered the viewport. It never goes back. */
export function useInView<T extends Element>(rootMargin = '0px 0px -10% 0px') {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin, threshold: 0.12 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [rootMargin])

  return [ref, inView] as const
}

/**
 * Cursor spotlight for elements marked `.spotlight`: one delegated
 * pointer listener for the whole document writes the pointer position
 * into --mx / --my on the hovered element. Fine pointers only.
 */
export function installSpotlight() {
  if (typeof window === 'undefined' || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return () => {}
  let frame = 0
  const onMove = (e: PointerEvent) => {
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      const el = (e.target as Element | null)?.closest?.('.spotlight') as HTMLElement | null
      if (!el) return
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - r.left}px`)
      el.style.setProperty('--my', `${e.clientY - r.top}px`)
    })
  }
  document.addEventListener('pointermove', onMove, { passive: true })
  return () => document.removeEventListener('pointermove', onMove)
}
