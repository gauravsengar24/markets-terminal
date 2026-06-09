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
  if (regions.length && assets.length) {
    const result: { q: string; region: string; assetClass: string }[] = []
    for (const r of regions) {
      for (const a of assets) {
        const term = ASSET_QUERIES[a]?.[0]
        if (term) result.push({ q: `${REGION_SEARCH[r]} ${term}`, region: r, assetClass: a })
      }
    }
    return result
  }
  if (regions.length) {
    return regions.map(r => ({ q: REGION_SEARCH[r], region: r, assetClass: "stocks" }))
  }
  if (assets.length) {
    const result: { q: string; region: string; assetClass: string }[] = []
    for (const a of assets) {
      for (const q of ASSET_QUERIES[a] ?? []) {
        result.push({ q, region: "USA", assetClass: a })
      }
    }
    return result
  }
  return DEFAULT_ASSET_QUERIES.map(q => ({ q, region: "USA", assetClass: "stocks" }))
}

// ── News via NewsData.io ──────────────────────────────────────────
app.get("/api/news", async (req, res) => {
  try {
    const rawRegions = (req.query.regions as string)?.split(",").filter(Boolean) ?? []
    const rawAssets = (req.query.assetClasses as string)?.split(",").filter(Boolean) ?? []
    const selectedRegions = rawRegions.length ? rawRegions : [...REGIONS]
    const selectedAssets = rawAssets.length ? rawAssets : [...ASSET_CLASSES]

    const cacheKey = `news:${selectedRegions.join(",")}:${selectedAssets.join(",")}`
    const cached = get<NewsArticle[]>(cacheKey)
    if (cached) return res.json(cached)

    const queries = buildQueries(rawRegions, rawAssets)
    const articles: NewsArticle[] = []
    const seen = new Set<string>()

    const apiKey = process.env.NEWSDATA_API_KEY
    if (!apiKey) return res.status(500).json({ error: "NEWSDATA_API_KEY not set in environment" })

    let lastError: string | null = null

    for (const { q, region, assetClass } of queries) {
      try {
        const resp = await fetch(
          `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${encodeURIComponent(q)}&language=en&size=3`
        )
        if (!resp.ok) {
          lastError = `NewsData returned ${resp.status} for query "${q}"`
          continue
        }
        const json = await resp.json() as any
        if (json.status !== "success") {
          lastError = `NewsData error: ${json.status} - ${json.results?.message ?? "unknown"}`
          continue
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
      } catch (e: any) {
        lastError = `Fetch error for "${q}": ${e.message}`
      }
    }

    if (articles.length === 0) {
      console.error("News fetch returned no articles. Last error:", lastError)
      return res.status(502).json({
        error: "No news articles returned from NewsData.io",
        detail: lastError ?? "Unknown error",
        hint: "The free NewsData.io plan has a 200 req/day limit. Check your key or try again tomorrow.",
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

    const resp = await fetch(`https://r.jina.ai/${url}`, {
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
