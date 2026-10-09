import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Route changes start at the top; a route change that carries a hash
 * scrolls to that element instead. Without this, react-router leaves
 * the new page scrolled to wherever the old one was.
 */
export function useScrollToHash() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      // The target belongs to the route that is mounting now, so wait
      // for paint before looking for it.
      const id = hash.slice(1)
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ block: 'start' })
      })
      return
    }
    window.scrollTo({ top: 0 })
  }, [pathname, hash])
}
