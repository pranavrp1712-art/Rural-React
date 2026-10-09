import { useEffect } from 'react'
import { applySeo, type SeoInput } from './seo'

/**
 * Applies document metadata for the life of the mounted route and
 * restores the previous values on unmount, so a back navigation does
 * not leave the last page's title in the tab.
 */
export function usePageMeta(input: SeoInput) {
  const { title, description, path, image, jsonLd } = input
  useEffect(
    () => applySeo({ title, description, path, image, jsonLd }),
    // jsonLd is a literal at every call site; serialising keeps the
    // effect from re-running on every render without a memo at each one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [title, description, path, image, JSON.stringify(jsonLd ?? null)],
  )
}
