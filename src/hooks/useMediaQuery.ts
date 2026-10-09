import { useEffect, useState } from 'react'

/**
 * Tracks a media query so a component can change its layout rather than
 * only its styling. Used by the diagrams, which have to reflow to fewer
 * columns on a narrow screen instead of shrinking their labels to
 * nothing.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )

  useEffect(() => {
    const list = window.matchMedia(query)
    const onChange = () => setMatches(list.matches)
    onChange()
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [query])

  return matches
}
