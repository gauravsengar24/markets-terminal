import express from "express"
import path from "path"
import { fileURLToPath } from "url"
import { getClient } from "./firecrawl.js"
import { get, set } from "./cache.js"
import {
  REGIONS,
  ASSET_CLASSES,
  REGION_SEARCH,
  ASSET_QUERIES,
  TICKERS,
} from "../shared/constants.js"
import type { NewsArticle, MarketSnapshot, Quote, ArticleSummary } from "../shared/types.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = parseInt(process.env.PORT || "3001")

app.use(express.json())

function id() {
  return Math.random().toString(36).slice(2, 10)
}

// GET /api/news?regions=USA,China&assetClasses=oil,stocks
app.get("/api/news", async (req, res) => {
  try {
    const rawRegions = (req.query.regions as string)?.split(",").filter(Boolean) ?? []
    const rawAssets = (req.query.assetClasses as string)?.split(",").filter(Boolean) ?? []
    const selectedRegions = rawRegions.length ? rawRegions : [...REGIONS]
    const selectedAssets = rawAssets.length ? rawAssets : [...ASSET_CLASSES]

    const cacheKey = `news:${selectedRegions.join(",")}:${selectedAssets.join(",")}`
    const cached = get<NewsArticle[]>(cacheKey)
    if (cached) return res.json(cached)

    const queries: string[] = []
    for (const r of selectedRegions) queries.push(REGION_SEARCH[r] ?? r)
    for (const ac of selectedAssets) {
      const qs = ASSET_QUERIES[ac]
      if (qs) queries.push(...qs)
    }

    const firecrawl = getClient()
    const articles: NewsArticle[] = []
    const seen = new Set<string>()

    for (let i = 0; i < queries.length; i += 4) {
      const batch = queries.slice(i, i + 4)
      const results = await Promise.allSettled(
        batch.map((q) =>
          firecrawl.search(q, { scrapeOptions: { formats: ["markdown"] }, limit: 6 })
        )
      )

      for (let j = 0; j < results.length; j++) {
        const r = results[j]
        if (r.status === "rejected") continue

        const q = batch[j]
        let region = selectedRegions.find((rg) =>
          q.toLowerCase().includes((REGION_SEARCH[rg] ?? rg).split(" ")[0]!.toLowerCase())
        ) ?? "USA"
        let assetClass = selectedAssets.find((ac) =>
          (ASSET_QUERIES[ac] ?? []).some((aq) =>
            q.toLowerCase().includes(aq.split(" ")[0]!.toLowerCase())
          )
        ) ?? "stocks"

        for (const doc of r.value.data ?? []) {
          const url = doc.url
          if (!url || seen.has(url)) continue
          seen.add(url)
          articles.push({
            id: id(),
            title: doc.title ?? doc.metadata?.title ?? doc.metadata?.ogTitle ?? "Untitled",
            url,
            source: new URL(url).hostname.replace("www.", ""),
            snippet: (doc.description ?? doc.markdown ?? "").slice(0, 280),
            region,
            assetClass,
            publishedAt: doc.metadata?.publishedTime ?? new Date().toISOString(),
          })
        }
      }
    }

    articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    set(cacheKey, articles, 25_000)
    res.json(articles)
  } catch (err: any) {
    if (err.message?.includes("402") || err.status?.toString() === "402") {
      return res.status(402).json({ error: "Firecrawl credits exhausted" })
    }
    console.error("News fetch error:", err)
    res.status(500).json({ error: "Failed to fetch news" })
  }
})

// GET /api/snapshot
app.get("/api/snapshot", async (_req, res) => {
  try {
    const cached = get<MarketSnapshot>("snapshot")
    if (cached) return res.json(cached)

    const firecrawl = getClient()

    const prompt = TICKERS.map((t) => t.name).join(", ")
    const symbols = TICKERS.map((t) => t.symbol)

    const result = await firecrawl.scrapeUrl("https://www.google.com/finance", {
      formats: ["extract"],
      extract: {
        prompt: `Extract current price, change and percentage change for: ${prompt}. Return a JSON object where keys are the symbol codes and values are {price, change, changePercent}. Symbol codes to use: ${symbols.join(", ")}. Only include values you can find on the page.`,
      },
    })

    const extractMap: Record<string, { price?: number; change?: number; changePercent?: number }> = {}
    if (result.success && result.extract) {
      const raw = result.extract
      if (typeof raw === "object" && raw !== null) {
        for (const [k, v] of Object.entries(raw)) {
          const match = TICKERS.find((t) => k.toLowerCase().includes(t.symbol.toLowerCase()) || t.name.toLowerCase().includes(k.toLowerCase()))
          if (match && typeof v === "object" && v !== null) {
            extractMap[match.symbol] = v as any
          }
        }
      }
    }

    const quotes: Quote[] = TICKERS.map((t) => {
      const e = extractMap[t.symbol]
      return {
        symbol: t.symbol,
        name: t.name,
        price: e?.price ?? 0,
        change: e?.change ?? 0,
        changePercent: e?.changePercent ?? 0,
      }
    })

    const snapshot: MarketSnapshot = { quotes, updatedAt: new Date().toISOString() }
    set("snapshot", snapshot, 25_000)
    res.json(snapshot)
  } catch (err) {
    console.error("Snapshot error:", err)
    res.status(500).json({ error: "Failed to fetch snapshot" })
  }
})

// POST /api/summary
app.post<{}, {}, { url: string }>("/api/summary", async (req, res) => {
  try {
    const { url } = req.body
    if (!url) return res.status(400).json({ error: "url required" })

    const cached = get<ArticleSummary>(`summary:${url}`, 120_000)
    if (cached) return res.json(cached)

    const firecrawl = getClient()
    const result = await firecrawl.scrapeUrl(url, {
      formats: ["markdown", "extract"],
      extract: { prompt: "Summarize this article in 2-3 sentences about market impact." },
    })

    if (result.success) {
      const summary: ArticleSummary = {
        url,
        title: result.metadata?.title ?? "Article",
        summary: typeof result.extract === "string"
          ? result.extract
          : result.markdown?.slice(0, 500) ?? "No summary available.",
      }
      set(`summary:${url}`, summary, 120_000)
      return res.json(summary)
    }

    res.json({ url, title: "Unavailable", summary: "Could not generate summary." })
  } catch (err) {
    console.error("Summary error:", err)
    res.status(500).json({ error: "Failed to generate summary" })
  }
})

// Serve static files in production
const distClient = path.join(__dirname, "../client")
app.use(express.static(distClient))
app.get("/{*splat}", (_req, res) => {
  res.sendFile(path.join(distClient, "index.html"))
})

app.listen(PORT, () => {
  console.log(`Markets Terminal server running on http://localhost:${PORT}`)
})
