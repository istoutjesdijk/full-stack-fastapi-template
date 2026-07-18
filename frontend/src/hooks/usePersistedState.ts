import { useEffect, useState } from "react"

type StorageArea = "session" | "local"

function getStore(area: StorageArea): Storage | null {
  try {
    return area === "local" ? localStorage : sessionStorage
  } catch {
    return null
  }
}

/**
 * useState that persists its value per `key`. Defaults to sessionStorage
 * (remembered for the tab session); pass `storage: "local"` for persistence
 * that survives a tab/browser restart (e.g. table filters/sort/columns).
 * Drop-in replacement for useState.
 */
export function usePersistedState<T>(
  key: string,
  initial: T,
  storage: StorageArea = "session",
) {
  const [value, setValue] = useState<T>(() => {
    const raw = getStore(storage)?.getItem(key)
    try {
      return raw != null ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      getStore(storage)?.setItem(key, JSON.stringify(value))
    } catch {
      // storage unavailable -> silently ignore
    }
  }, [key, storage, value])
  return [value, setValue] as const
}
