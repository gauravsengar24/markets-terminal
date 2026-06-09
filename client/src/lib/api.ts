const BASE = "/api"

export async function fetchNews() {
  const res = await fetch(`${BASE}/news`)
  if (!res.ok) throw new Error(await res.text().catch(() => `News fetch failed: ${res.status}`))
  return res.json()
}

export async function fetchSummary(url: string) {
  const res = await fetch(`${BASE}/summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  })
  if (!res.ok) throw new Error(`Summary fetch failed: ${res.status}`)
  return res.json()
}
