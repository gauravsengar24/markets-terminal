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

// ── News ──────────────────────────────────────────────────────────
app.get("/api/news", async (req, res) => {
  try {
    const rawRegions = (req.query.regions as string)?.split(",").filter(Boolean) ?? []
    const rawAssets = (req.query.assetClasses as string)?.split(",").filter(Boolean) ?? []
    const provider = (req.query.provider as string) || "newsdata"
    const selectedRegions = rawRegions.length ? rawRegions : [...REGIONS]
    const selectedAssets = rawAssets.length ? rawAssets : [...ASSET_CLASSES]

    const cacheKey = `news:${provider}:${selectedRegions.join(",")}:${selectedAssets.join(",")}`
    const cached = get<NewsArticle[]>(cacheKey)
    if (cached) return res.json(cached)

    const queries = buildQueries(rawRegions, rawAssets)
    const articles: NewsArticle[] = []
    const seen = new Set<string>()

    let lastError: string | null = null

    // ── NewsData.io ────────────────────────────────────────────────
    if (provider === "newsdata") {
      const apiKey = process.env.NEWSDATA_API_KEY
      if (!apiKey) return res.status(500).json({ error: "NEWSDATA_API_KEY not set" })

      await runConcurrent(queries, async ({ q, region, assetClass }) => {
        try {
          const resp = await fetchWithTimeout(
            `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${encodeURIComponent(q)}&language=en&size=3`,
            { timeout: 8000 }
          )
          if (!resp.ok) {
            const body = await resp.text().catch(() => "")
            lastError = `NewsData returned ${resp.status} for "${q}": ${body.slice(0, 200)}`
            return
          }
          const json = await resp.json() as any
          if (json.status !== "success") {
            lastError = `NewsData error: ${json.status} - ${json.results?.message ?? json.message ?? ""}`
            return
          }
          for (const item of json.results ?? []) {
            const url = item.link
            if (!url || seen.has(url)) continue
            seen.add(url)
            articles.push({
              id: id(),
              title: item.title ?? "Untitled",
              url,
              source: item.source_id ?? "NewsData",
              snippet: (item.description ?? "").slice(0, 280),
              region,
              assetClass,
              publishedAt: item.pubDate ?? new Date().toISOString(),
            })
          }
        } catch (e: any) { lastError = `Fetch error for "${q}": ${e.message}` }
      })
    }

    // ── Spider Cloud ───────────────────────────────────────────────
    if (provider === "spidercloud") {
      const apiKey = process.env.SPIDER_CLOUD_API_KEY
      if (!apiKey) return res.status(500).json({ error: "SPIDER_CLOUD_API_KEY not set" })

      await runConcurrent(queries, async ({ q, region, assetClass }) => {
        try {
          const resp = await fetchWithTimeout("https://api.spider.cloud/v1/search", {
            method: "POST",
            timeout: 10000,
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              search: q,
              search_limit: 3,
              fetch_page_content: false,
              return_format: "markdown",
            }),
          })
          if (!resp.ok) { lastError = `Spider Cloud returned ${resp.status} for "${q}"`; return }
          const json = await resp.json() as any
          const results = json?.content ?? []
          for (const item of results) {
            const url = item.url
            if (!url || seen.has(url)) continue
            seen.add(url)
            articles.push({
              id: id(),
              title: item.title ?? "Untitled",
              url,
              source: item.domain ?? "Spider Cloud",
              snippet: (item.description ?? "").slice(0, 280),
              region,
              assetClass,
              publishedAt: new Date().toISOString(),
            })
          }
        } catch (e: any) { lastError = `Spider error for "${q}": ${e.message}` }
      })
    }

    // ── Crawl4AI ────────────────────────────────────────────────────
    if (provider === "crawl4ai") {
      const jinaKey = process.env.JINA_API_KEY
      if (!jinaKey) return res.status(500).json({ error: "JINA_API_KEY not set" })

      await runConcurrent(queries, async ({ q, region, assetClass }) => {
        try {
          const resp = await fetchWithTimeout(
            `https://s.jina.ai/${encodeURIComponent(q)}`,
            {
              timeout: 10000,
              headers: {
                Authorization: `Bearer ${jinaKey}`,
                "Accept": "text/plain",
              },
            }
          )
          if (!resp.ok) { lastError = `Crawl4AI returned ${resp.status} for "${q}"`; return }
          const text = await resp.text()
          const allResults = text.match(/\[\d+\]\s*Title:\s*(.+)\n\[\d+\]\s*URL Source:\s*(\S+)(?:\n\[\d+\]\s*Description:\s*(.+?))?(?=\n\[\d+\]|\n\n|$)/g)
          if (!allResults) {
            const firstResult = text.match(/^\[1\]\s*Title:\s*(.+)\n\[1\]\s*URL Source:\s*(\S+)(?:\n\[1\]\s*Description:\s*(.+?))?(?=\n|$)/m)
            if (firstResult) {
              const url = firstResult[2].trim()
              if (url && !seen.has(url)) {
                seen.add(url)
                articles.push({
                  id: id(),
                  title: firstResult[1].trim().slice(0, 200),
                  url,
                  source: q,
                  snippet: (firstResult[3] ?? "").trim().slice(0, 280),
                  region,
                  assetClass,
                  publishedAt: new Date().toISOString(),
                })
              }
            }
            return
          }
          for (const result of allResults) {
            const m = result.match(/\[\d+\]\s*Title:\s*(.+)\n\[\d+\]\s*URL Source:\s*(\S+)(?:\n\[\d+\]\s*Description:\s*(.+?))?/)
            if (!m) continue
            const url = m[2].trim()
            if (!url || seen.has(url)) continue
            seen.add(url)
            articles.push({
              id: id(),
              title: m[1].trim().slice(0, 200),
              url,
              source: q,
              snippet: (m[3] ?? "").trim().slice(0, 280),
              region,
              assetClass,
              publishedAt: new Date().toISOString(),
            })
          }
        } catch (e: any) { lastError = `Crawl4AI error for "${q}": ${e.message}` }
      })
    }

    if (articles.length === 0) {
      console.error(`[${provider}] No articles. Last error:`, lastError)
      return res.status(502).json({
        error: `No articles returned from ${provider}`,
        detail: lastError ?? "Unknown error",
        hint: provider === "newsdata"
          ? "NewsData free plan: 200 req/day limit. Try Spider Cloud."
          : provider === "crawl4ai"
          ? "Crawl4AI uses Jina Reader search. Make sure JINA_API_KEY is set."
          : undefined,
      })
    }

    articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    set(cacheKey, articles, 25_000)
    res.json(articles)
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
