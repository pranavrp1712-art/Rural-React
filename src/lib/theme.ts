import { useSyncExternalStore } from 'react'

/**
 * One theme state for the whole site (md/improve.md §1B): the public
 * navbar and the portal sidebar read and write the same store. The
 * inline script in index.html applies it before first paint; this
 * module keeps it in step afterwards, including OS changes while the
 * preference is "system".
 */

export type ThemePreference = 'system' | 'light' | 'dark'

const KEY = 'rr-theme'
const media = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null
const listeners = new Set<() => void>()

function readPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

let preference: ThemePreference = readPreference()

function apply() {
  const dark = preference === 'dark' || (preference === 'system' && Boolean(media?.matches))
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
}

media?.addEventListener('change', () => {
  if (preference === 'system') {
    apply()
    listeners.forEach((l) => l())
  }
})

export function setThemePreference(next: ThemePreference) {
  preference = next
  try {
    if (next === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, next)
  } catch {
    // Storage blocked: the choice still applies for this page view.
  }
  apply()
  listeners.forEach((l) => l())
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useTheme() {
  const pref = useSyncExternalStore(subscribe, () => preference, () => 'system' as ThemePreference)
  const resolved = useSyncExternalStore(
    subscribe,
    () => (document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'),
    () => 'light',
  )
  return { preference: pref, resolved, setPreference: setThemePreference }
}
