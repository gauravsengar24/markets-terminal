const PREFIX = "markets_terminal_"

export function getPersisted<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed.expires && Date.now() > parsed.expires) {
      localStorage.removeItem(PREFIX + key)
      return null
    }
    return parsed.data as T
  } catch {
    return null
  }
}

export function setPersisted<T>(key: string, data: T, ttlMs: number) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({
      data,
      expires: Date.now() + ttlMs,
    }))
  } catch {}
}

export const STORAGE_KEYS = {
  NEWS: "news",
  BREAKING: "breaking",
  SECTIONS: "sections",
} as const
