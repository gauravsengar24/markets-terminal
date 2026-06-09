const BASE = "/api"

export async function fetchNews(regions?: string[], assetClasses?: string[]) {
  const params = new URLSearchParams()
  if (regions?.length) params.set("regions", regions.join(","))
  if (assetClasses?.length) params.set("assetClasses", assetClasses.join(","))
  const res = await fetch(`${BASE}/news?${params}`)
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
