import { useEffect, useState } from "react"

/**
 * Returns `value` only after it has stopped changing for `delay` ms. Keeps a
 * search input responsive (immediate `value`) while the derived value triggers
 * the expensive server query only after the typing pause, not per keystroke.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}
