const store = new Map<string, { data: unknown; expires: number }>()

export function get<T>(key: string, ttl = 30_000): T | null {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() > entry.expires) {
    store.delete(key)
    return null
  }
  return entry.data as T
}

export function set(key: string, data: unknown, ttl = 30_000) {
  store.set(key, { data, expires: Date.now() + ttl })
}
