import express from "express"
import path from "path"
import { fileURLToPath } from "url"
import { get, set } from "./cache.js"
import { REGIONS, ASSET_CLASSES, REGION_SEARCH, ASSET_QUERIES, DEFAULT_ASSET_QUERIES } from "../shared/constants.js"
import type { NewsArticle, ArticleSummary } from "../shared/types.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = parseInt(process.env.PORT || "3001")

app.use(express.json())

function id() { return Math.random().toString(36).slice(2, 10) }

function buildQueries(regions: string[], assets: string[]): { q: string; region: string; assetClass: string }[] {
  const result: { q: string; region: string; assetClass: string }[] = []
  if (regions.length && assets.length) {
    for (const rv of regions) {
      for (const av of assets) {
        const term = ASSET_QUERIES[av]?.[0]
        if (term) result.push({ q: `${REGION_SEARCH[rv]} ${term}`, region: rv, assetClass: av })
      }
    }
  } else if (regions.length) {
    for (const rv of regions) {
      result.push({ q: REGION_SEARCH[rv], region: rv, assetClass: "stocks" })
    }
  } else if (assets.length) {
    for (const av of assets) {
      for (const q of ASSET_QUERIES[av] ?? []) {
        result.push({ q, region: "USA", assetClass: av })
      }
    }
  } else {
    for (const rv of REGIONS) {
      result.push({ q: `${DEFAULT_ASSET_QUERIES[0]} ${rv}`, region: rv, assetClass: "stocks" })
    }
  }
  return result
}

function runConcurrent<T>(items: T[], fn: (item: T) => Promise<void>, limit = 4): Promise<void> {
  let i = 0
  const next = async (): Promise<void> => {
    while (i < items.length) {
      const idx = i++
      await fn(items[idx])
    }
  }
  return Promise.allSettled(Array.from({ length: limit }, () => next())).then(() => {})
}

async function fetchWithTimeout(url: string, init: RequestInit & { timeout?: number } = {}): Promise<Response> {
  const { timeout = 10000, ...fetchInit } = init
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    const resp = await fetch(url, { ...fetchInit, signal: controller.signal })
    return resp
  } finally {
    clearTimeout(id)
  }
}

const ONE_HOUR = 3_600_000

async function fetchNewsData(queries: { q: string; region: string; assetClass: string }[], seen: Set<string>): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWSDATA_API_KEY
  if (!apiKey) return []
  const articles: NewsArticle[] = []
  let lastErr: string | null = null
  await runConcurrent(queries.slice(0, 7), async ({ q, region, assetClass }) => {
    try {
      const resp = await fetchWithTimeout(
        `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${encodeURIComponent(q)}&language=en&size=3`,
        { timeout: 8000 }
      )
      if (!resp.ok) { lastErr = `NewsData returned ${resp.status}`; return }
      const json = await resp.json() as any
      if (json.status !== "success") { lastErr = `NewsData error: ${json.status}`; return }
      for (const item of json.results ?? []) {
        const url = item.link
        if (!url || seen.has(url)) continue
        seen.add(url)
        articles.push({
          id: id(), title: item.title ?? "Untitled", url, source: item.source_id ?? "NewsData",
          snippet: (item.description ?? "").slice(0, 280), region, assetClass,
          publishedAt: item.pubDate ?? new Date().toISOString(),
        })
      }
    } catch (e: any) { lastErr = `NewsData error: ${e.message}` }
  })
  if (lastErr) console.error("NewsData warn:", lastErr)
  return articles
}

async function fetchSpiderCloud(queries: string[], seen: Set<string>): Promise<NewsArticle[]> {
  const apiKey = process.env.SPIDER_CLOUD_API_KEY
  if (!apiKey) return []
  const articles: NewsArticle[] = []
  await runConcurrent(queries, async (q) => {
    try {
      const resp = await fetchWithTimeout("https://api.spider.cloud/v1/search", {
        method: "POST", timeout: 10000,
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ search: q, search_limit: 5, fetch_page_content: false, return_format: "markdown" }),
      })
      if (!resp.ok) return
      const json = await resp.json() as any
      for (const item of json?.content ?? []) {
        const url = item.url
        if (!url || seen.has(url)) continue
        seen.add(url)
        articles.push({
          id: id(), title: item.title ?? "Untitled", url, source: "Spider Cloud",
          snippet: (item.description ?? "").slice(0, 280),
          region: guessRegion(item.title, item.description),
          assetClass: guessAsset(item.title, item.description),
          publishedAt: new Date().toISOString(),
        })
      }
    } catch (_) {}
  })
  return articles
}

async function fetchCrawl4AI(queries: string[], seen: Set<string>): Promise<NewsArticle[]> {
  const jinaKey = process.env.JINA_API_KEY
  if (!jinaKey) return []
  const articles: NewsArticle[] = []
  await runConcurrent(queries, async (q) => {
    try {
      const resp = await fetchWithTimeout(`https://s.jina.ai/${encodeURIComponent(q)}`, {
        timeout: 10000,
        headers: { Authorization: `Bearer ${jinaKey}`, "Accept": "text/plain" },
      })
      if (!resp.ok) return
      const text = await resp.text()
      const matches = [...text.matchAll(/\[\d+\]\s*Title:\s*(.+)\n\[\d+\]\s*URL Source:\s*(\S+)(?:\n\[\d+\]\s*Description:\s*(.+?))?(?=\n\[\d+\]|\n\n|$)/g)]
      if (!matches.length) {
        const m = text.match(/^\[1\]\s*Title:\s*(.+)\n\[1\]\s*URL Source:\s*(\S+)(?:\n\[1\]\s*Description:\s*(.+?))?(?=\n|$)/m)
        if (m) matches.push(m as any)
      }
      for (const m of matches) {
        const url = m[2].trim()
        if (!url || seen.has(url)) continue
        seen.add(url)
        articles.push({
          id: id(), title: m[1].trim().slice(0, 200), url, source: "Crawl4AI",
          snippet: (m[3] ?? "").trim().slice(0, 280),
          region: guessRegion(m[1], m[3]),
          assetClass: guessAsset(m[1], m[3]),
          publishedAt: new Date().toISOString(),
        })
      }
    } catch (_) {}
  })
  return articles
}

function guessRegion(title: string, desc: string | null): string {
  const t = `${title} ${desc ?? ""}`.toLowerCase()
  if (/\b(europe|ftse|dax|euro|uk |london|paris|frankfurt)\b/i.test(t)) return "Europe"
  if (/\b(china|shanghai|shenzhen|beijing|hong kong|hang seng)\b/i.test(t)) return "China"
  if (/\b(japan|nikkei|tokyo|jpy|yen)\b/i.test(t)) return "Japan"
  if (/\b(india|nifty|sensex|mumbai|bse|nse|rupee)\b/i.test(t)) return "India"
  if (/\b(korea|kospi|seoul|won)\b/i.test(t)) return "Korea"
  if (/\b(australia|asx|sydney|australian|aussie)\b/i.test(t)) return "Australia"
  if (/\b(usa?|united states|wall street|dow jones|s&p |nasdaq|nyse|dollar|federal reserve|treasury)\b/i.test(t)) return "USA"
  return "USA"
}

function guessAsset(title: string, desc: string | null): string {
  const t = `${title} ${desc ?? ""}`.toLowerCase()
  if (/\b(bitcoin|ethereum|crypto|cryptocurrency|blockchain|defi|ico|altcoin|token)\b/i.test(t)) return "crypto"
  if (/\b(crude oil|oil |petroleum|opec|gasoline)\b/i.test(t)) return "oil"
  if (/\b(gold |silver|copper|platinum|commodit)\b/i.test(t)) return "commodities"
  if (/\betf\b/i.test(t)) return "ETFs"
  if (/\bmutual fund\b/i.test(t)) return "mutual_funds"
  if (/\b(stock |equit|share|market|index|ipo|trading|rally|bull |bear )\b/i.test(t)) return "stocks"
  return "stocks"
}

// ── Merged News (all providers) ───────────────────────────────────
app.get("/api/news", async (req, res) => {
  try {
    const cached = get<NewsArticle[]>("news:merged")
    if (cached) return res.json(cached)

    const seen = new Set<string>()
    const regionQueries = REGIONS.map(r => ({ q: REGION_SEARCH[r], region: r, assetClass: "stocks" }))

    const [nd, sc, c4] = await Promise.allSettled([
      fetchNewsData(regionQueries, seen),
      fetchSpiderCloud(["stock market today global", "cryptocurrency bitcoin economy", "world business finance news"], seen),
      fetchCrawl4AI(["stock market today global", "cryptocurrency bitcoin economy", "world business finance news"], seen),
    ])

    const all = [
      ...(nd.status === "fulfilled" ? nd.value : []),
      ...(sc.status === "fulfilled" ? sc.value : []),
      ...(c4.status === "fulfilled" ? c4.value : []),
    ]

    if (!all.length) {
      return res.status(502).json({
        error: "No articles returned from any provider",
        detail: "All news providers failed to return results. Check API keys.",
      })
    }

    all.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    set("news:merged", all, ONE_HOUR)
    res.json(all)
  } catch (err: any) {
    console.error("News fetch error:", err)
    res.status(500).json({ error: "Failed to fetch news" })
  }
})

// ── Article Summary via Jina Reader ───────────────────────────────
app.post("/api/summary", async (req, res) => {
  try {
    const { url } = req.body
    if (!url) return res.status(400).json({ error: "url required" })

    const cached = get<ArticleSummary>(`summary:${url}`, 120_000)
    if (cached) return res.json(cached)

    const jinaKey = process.env.JINA_API_KEY
    if (!jinaKey) return res.status(500).json({ error: "JINA_API_KEY not set" })

    const resp = await fetchWithTimeout(`https://r.jina.ai/${url}`, {
      timeout: 15000,
      headers: {
        Authorization: `Bearer ${jinaKey}`,
        "X-Return-Format": "markdown",
        "X-With-Generated-Alt": "true",
      },
    })
    if (!resp.ok) throw new Error(`Jina returned ${resp.status}`)

    const text = await resp.text()
    const title = text.split("\n")[0]?.replace(/^#+\s*/, "").slice(0, 200) ?? "Article"
    const summary = text.slice(0, 1000).trim()

    const result: ArticleSummary = { url, title, summary }
    set(`summary:${url}`, result, 120_000)
    res.json(result)
  } catch (err) {
    console.error("Summary error:", err)
    res.status(500).json({ error: "Failed to fetch article" })
  }
})

// ── Static files ──────────────────────────────────────────────────
const distClient = path.join(__dirname, "../client")
app.use(express.static(distClient))
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    res.sendFile(path.join(distClient, "index.html"))
  } else {
    next()
  }
})

app.listen(PORT, () => {
  console.log(`Markets Terminal running on http://localhost:${PORT}`)
})
