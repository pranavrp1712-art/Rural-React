import { useCallback, useEffect, useRef, useState } from 'react'
import { onInvalidate } from './db'

export type QueryState<T> =
  | { status: 'loading'; data?: undefined; error?: undefined }
  | { status: 'error'; data?: undefined; error: string }
  | { status: 'success'; data: T; error?: undefined }

/**
 * Fetch on mount and whenever `key` changes. A write elsewhere that
 * invalidates a matching key prefix refetches quietly, keeping the
 * current data on screen instead of flashing a skeleton. `retry`
 * after an error goes back to the loading state.
 */
export function useQuery<T>(key: string, fetcher: () => Promise<T>) {
  const [state, setState] = useState<QueryState<T>>({ status: 'loading' })
  const [nonce, setNonce] = useState(0)
  const fetcherRef = useRef(fetcher)
  const quiet = useRef(false)

  useEffect(() => {
    fetcherRef.current = fetcher
  })

  useEffect(() => {
    let alive = true
    if (!quiet.current) setState({ status: 'loading' })
    quiet.current = false
    fetcherRef.current().then(
      (data) => alive && setState({ status: 'success', data }),
      (err: unknown) => alive && setState({ status: 'error', error: err instanceof Error ? err.message : 'Something went wrong.' }),
    )
    return () => {
      alive = false
    }
  }, [key, nonce])

  useEffect(
    () =>
      onInvalidate((prefix) => {
        if (key.startsWith(prefix)) {
          quiet.current = true
          setNonce((n) => n + 1)
        }
      }),
    [key],
  )

  const retry = useCallback(() => setNonce((n) => n + 1), [])
  return { ...state, retry }
}
