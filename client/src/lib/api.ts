const BASE = "/api"

export async function fetchNews() {
  const res = await fetch(`${BASE}/news`)
  if (!res.ok) throw new Error(await res.text().catch(() => `News fetch failed: ${res.status}`))
  return res.json()
}

export async function fetchBreakingNews() {
  const res = await fetch(`${BASE}/breaking-news`)
  if (!res.ok) throw new Error(await res.text().catch(() => `Breaking news fetch failed: ${res.status}`))
  return res.json()
}

export async function fetchMarketSnapshot() {
  const res = await fetch(`${BASE}/market-snapshot`)
  if (!res.ok) throw new Error(await res.text().catch(() => `Market snapshot fetch failed: ${res.status}`))
  return res.json()
}

export async function fetchBriefing(url: string, snippet?: string) {
  const res = await fetch(`${BASE}/briefing`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, snippet }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    const detail = body ? JSON.parse(body).error || body : res.statusText
    throw new Error(detail)
  }
  return res.json()
}

export async function fetchSummary(url: string) {
  const res = await fetch(`${BASE}/summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    const detail = body ? JSON.parse(body).error || body : res.statusText
    throw new Error(detail)
  }
  return res.json()
}

export async function submitFeedback(payload: {
  url: string
  articleTitle?: string
  source?: string
  region?: string
  category?: string
  volatility?: string
  rating: 1 | -1
}) {
  const res = await fetch(`${BASE}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error("Failed to submit feedback")
  return res.json()
}
