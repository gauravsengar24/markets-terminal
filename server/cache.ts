import pg from "pg"
import type { QueryResultRow } from "pg"

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  max: 5,
  idleTimeoutMillis: 5000,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined,
})

let dbReady = false

export async function initCache(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.log("Cache: no DATABASE_URL, using in-memory only")
    return
  }
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cache_store (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL
      )
    `)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_expires ON cache_store(expires_at)`)
    await pool.query(`DELETE FROM cache_store WHERE expires_at < NOW()`)
    dbReady = true
    console.log("Cache: Postgres connected, table ready")
  } catch (e) {
    console.warn("Cache: Postgres connection failed, using in-memory only:", (e as Error).message)
    dbReady = false
  }
}

const memStore = new Map<string, { data: unknown; expires: number }>()

export async function get<T>(key: string, ttl = 30_000): Promise<T | null> {
  const mem = memStore.get(key)
  if (mem) {
    if (Date.now() <= mem.expires) return mem.data as T
    memStore.delete(key)
  }

  if (!dbReady) return null

  try {
    const res = await pool.query(`SELECT value FROM cache_store WHERE key = $1 AND expires_at > NOW()`, [key])
    if (res.rows.length) {
      const data = res.rows[0].value as T
      memStore.set(key, { data, expires: Date.now() + Math.min(ttl, 60000) })
      return data
    }
  } catch {}
  return null
}

export async function set(key: string, data: unknown, ttl = 30_000): Promise<void> {
  memStore.set(key, { data, expires: Date.now() + ttl })

  if (!dbReady) return

  const expires = new Date(Date.now() + ttl).toISOString()
  try {
    await pool.query(
      `INSERT INTO cache_store (key, value, expires_at) VALUES ($1, $2, $3)
       ON CONFLICT (key) DO UPDATE SET value = $2, expires_at = $3`,
      [key, JSON.stringify(data), expires]
    )
  } catch {}
}
