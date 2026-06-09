import express from "express"
import path from "path"
import { fileURLToPath } from "url"
import { initCache, get, set } from "./cache.js"
import {
  REGIONS, ASSET_QUERIES, DEFAULT_ASSET_QUERIES, REGION_SEARCH,
  CRYPTO_QUERIES, IPO_QUERIES, BREAKING_NEWS_QUERIES, RSS_FEEDS,
} from "../shared/constants.js"
import type { NewsArticle, BreakingNews, MarketPrice } from "../shared/types.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = parseInt(process.env.PORT || "3001")

app.use(express.json())

function id() { return Math.random().toString(36).slice(2, 10) }

function detectSubCategory(title: string, snippet: string): string {
  const t = (title + " " + snippet).toLowerCase()
  if (/bitcoin|ethereum|crypto|blockchain|altcoin|defi|token|ico|web3/i.test(t)) return "crypto"
  if (/ipo|initial public offering|listing|prospectus|filing/i.test(t)) return "ipo"
  if (/crude.?oil|wti|brent|gold|silver|copper|commodity/i.test(t)) return "commodities"
  if (/stock|market|index|equity|nifty|sensex|dow|nasdaq|s&p|ftse|dax|nikkei|shanghai|kospi|asx/i.test(t)) return "stocks"
  return "stocks"
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
  const t = setTimeout(() => controller.abort(), timeout)
  try {
    const resp = await fetch(url, { ...fetchInit, signal: controller.signal })
    return resp
  } finally {
    clearTimeout(t)
  }
}

const ONE_HOUR = 3_600_000
const TEN_MIN = 600_000
const FIVE_MIN = 300_000

async function fetchRSS(feeds: string[], seen: Set<string>): Promise<NewsArticle[]> {
  const jinaKey = process.env.JINA_API_KEY
  if (!jinaKey) return []
  const articles: NewsArticle[] = []
  await runConcurrent(feeds.slice(0, 6), async (feedUrl) => {
    try {
      const resp = await fetchWithTimeout(`https://r.jina.ai/${encodeURIComponent(feedUrl)}`, {
        timeout: 10000,
        headers: { Authorization: `Bearer ${jinaKey}`, Accept: "text/plain" },
      })
      if (!resp.ok) return
      const text = await resp.text()
      const items = text.split("\n\n").filter(b => b.includes("Title:") && b.includes("URL Source:"))
      for (const item of items) {
        const titleMatch = item.match(/Title:\s*(.+)/)
        const urlMatch = item.match(/URL Source:\s*(\S+)/)
        const descMatch = item.match(/Description:\s*(.+?)(?=\n|$)/)
        const title = titleMatch?.[1]?.trim()
        const url = urlMatch?.[1]?.trim()
        if (!title || !url || seen.has(url)) continue
        seen.add(url)
        const snippet = (descMatch?.[1] ?? "").trim().slice(0, 280)
        const sub = detectSubCategory(title, snippet)
        articles.push({
          id: id(), title, url, source: "RSS",
          snippet, region: "USA",
          assetClass: sub === "crypto" ? "crypto" : sub === "commodities" ? "commodities" : "stocks",
          subCategory: sub,
          publishedAt: new Date().toISOString(),
        })
      }
    } catch (_) {}
  })
  return articles
}

async function fetchNewsData(queries: { q: string; region: string; assetClass: string }[], seen: Set<string>): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWSDATA_API_KEY
  if (!apiKey) return []
  const articles: NewsArticle[] = []
  await runConcurrent(queries.slice(0, 7), async ({ q, region, assetClass }) => {
    try {
      const resp = await fetchWithTimeout(
        `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${encodeURIComponent(q)}&language=en&size=4`,
        { timeout: 8000 }
      )
      if (!resp.ok) return
      const json = await resp.json() as any
      if (json.status !== "success") return
      for (const item of json.results ?? []) {
        const url = item.link
        if (!url || seen.has(url)) continue
        seen.add(url)
        const snippet = (item.description ?? "").slice(0, 280)
        const sub = detectSubCategory(item.title ?? "", snippet)
        articles.push({
          id: id(), title: item.title ?? "Untitled", url,
          source: item.source_id ?? "NewsData",
          snippet, region, assetClass,
          subCategory: sub,
          publishedAt: item.pubDate ?? new Date().toISOString(),
        })
      }
    } catch (_) {}
  })
  return articles
}

async function fetchSpiderCloud(queries: { q: string; region: string; assetClass: string }[], seen: Set<string>): Promise<NewsArticle[]> {
  const apiKey = process.env.SPIDER_CLOUD_API_KEY
  if (!apiKey) return []
  const articles: NewsArticle[] = []
  await runConcurrent(queries, async ({ q, region, assetClass }) => {
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
        const snippet = (item.description ?? "").slice(0, 280)
        const sub = detectSubCategory(item.title ?? "", snippet)
        articles.push({
          id: id(), title: item.title ?? "Untitled", url,
          source: "Spider Cloud",
          snippet, region, assetClass,
          subCategory: sub,
          publishedAt: new Date().toISOString(),
        })
      }
    } catch (_) {}
  })
  return articles
}

async function fetchJina(queries: { q: string; region: string; assetClass: string }[], seen: Set<string>): Promise<NewsArticle[]> {
  const jinaKey = process.env.JINA_API_KEY
  if (!jinaKey) return []
  const articles: NewsArticle[] = []
  await runConcurrent(queries, async ({ q, region, assetClass }) => {
    try {
      const resp = await fetchWithTimeout(`https://s.jina.ai/${encodeURIComponent(q)}`, {
        timeout: 10000,
        headers: { Authorization: `Bearer ${jinaKey}`, Accept: "text/plain" },
      })
      if (!resp.ok) return
      const text = await resp.text()
      const matches = [...text.matchAll(/\[\d+\]\s*Title:\s*(.+)\n\[\d+\]\s*URL Source:\s*(\S+)(?:\n\[\d+\]\s*Description:\s*(.+?))?(?=\n\[\d+\]|\n\n|$)/g)]
      for (const m of matches) {
        const url = m[2].trim()
        if (!url || seen.has(url)) continue
        seen.add(url)
        const snippet = (m[3] ?? "").trim().slice(0, 280)
        const sub = detectSubCategory(m[1] ?? "", snippet)
        articles.push({
          id: id(), title: m[1].trim().slice(0, 200), url,
          source: "Jina AI",
          snippet, region, assetClass,
          subCategory: sub,
          publishedAt: new Date().toISOString(),
        })
      }
    } catch (_) {}
  })
  return articles
}

async function fetchSpecificQueries(
  queries: string[], region: string, assetClass: string, subCategory: string,
  seen: Set<string>, provider: "newsdata" | "jina" = "jina"
): Promise<NewsArticle[]> {
  const articles: NewsArticle[] = []
  const jinaKey = process.env.JINA_API_KEY
  if (provider !== "jina" || !jinaKey) return articles
  await runConcurrent(queries, async (q) => {
    try {
      const resp = await fetchWithTimeout(`https://s.jina.ai/${encodeURIComponent(q + " news")}`, {
        timeout: 10000,
        headers: { Authorization: `Bearer ${jinaKey}`, Accept: "text/plain" },
      })
      if (!resp.ok) return
      const text = await resp.text()
      const matches = [...text.matchAll(/\[\d+\]\s*Title:\s*(.+)\n\[\d+\]\s*URL Source:\s*(\S+)(?:\n\[\d+\]\s*Description:\s*(.+?))?(?=\n\[\d+\]|\n\n|$)/g)]
      for (const m of matches) {
        const url = m[2].trim()
        if (!url || seen.has(url)) continue
        seen.add(url)
        articles.push({
          id: id(), title: m[1].trim().slice(0, 200), url,
          source: "Jina AI",
          snippet: (m[3] ?? "").trim().slice(0, 280),
          region, assetClass, subCategory,
          publishedAt: new Date().toISOString(),
        })
      }
    } catch (_) {}
  })
  return articles
}

function buildBriefing(title: string, content: string, url: string) {
  const clean = content
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim()

  const sentences = clean.split(/[.!?]+/).filter(s => s.trim().length > 20)
  const whatHappened = sentences.slice(0, 3).map(s => s.trim() + ".").join(" ") || "No summary available."
  const contextSentences = sentences.filter(s =>
    /market|price|percent|dollar|billion|million|index|share|economy|trade|growth|inflation|rate|fed|central bank|impact/i.test(s)
  )
  const marketContext = contextSentences.slice(0, 4).map(s => s.trim() + ".").join(" ") || ""
  const takeawaySentences = sentences.filter(s =>
    /will|could|expected|forecast|outlook|next|future|ahead|plan|aim|goal|target|strategy|opportunity|risk/i.test(s)
  )
  const keyTakeaways = takeawaySentences.slice(0, 5).map(s => s.trim() + ".")
  if (!keyTakeaways.length) keyTakeaways.push("More details available in the full article.")

  return { url, title, whatHappened, marketContext, keyTakeaways }
}

// ════════════════════════════════════════════════════════════════
//  MARKET SNAPSHOT
// ════════════════════════════════════════════════════════════════

app.get("/api/market-snapshot", async (_req, res) => {
  try {
    const cached = await get<MarketPrice[]>("market:snapshot")
    if (cached) return res.json(cached)

    const prices: MarketPrice[] = []
    const jinaKey = process.env.JINA_API_KEY

    if (jinaKey) {
      try {
        const resp = await fetchWithTimeout("https://s.jina.ai/bitcoin price today USD", {
          timeout: 8000,
          headers: { Authorization: `Bearer ${jinaKey}`, Accept: "text/plain" },
        })
        if (resp.ok) {
          const text = await resp.text()
          const priceMatch = text.match(/\$?([0-9,]+(?:\.[0-9]+)?)\s*(?:USD|usd)?/)
          const changeMatch = text.match(/([+-]?\d+\.?\d*)\s*%/);
          (changeMatch)
          if (priceMatch) {
            prices.push({
              symbol: "BTC", name: "Bitcoin",
              price: parseFloat(priceMatch[1].replace(/,/g, "")),
              change: 0, changePercent: changeMatch ? parseFloat(changeMatch[1]) : 0,
              assetType: "crypto",
            })
          }
        }
      } catch (_) {}
    }

    try {
      const resp = await fetchWithTimeout("https://s.jina.ai/gold price spot today USD", {
        timeout: 8000,
        headers: { Authorization: `Bearer ${jinaKey}`, Accept: "text/plain" },
      })
      if (resp.ok) {
        const text = await resp.text()
        const priceMatch = text.match(/\$?([0-9,]+(?:\.[0-9]+)?)\s*(?:USD|usd)?/)
        const changeMatch = text.match(/([+-]?\d+\.?\d*)\s*%/);
        (changeMatch)
        if (priceMatch) {
          prices.push({
            symbol: "XAU", name: "Gold",
            price: parseFloat(priceMatch[1].replace(/,/g, "")),
            change: 0, changePercent: changeMatch ? parseFloat(changeMatch[1]) : 0,
            assetType: "commodity",
          })
        }
      }
    } catch (_) {}

    try {
      const resp = await fetchWithTimeout("https://s.jina.ai/silver price spot today USD", {
        timeout: 8000,
        headers: { Authorization: `Bearer ${jinaKey}`, Accept: "text/plain" },
      })
      if (resp.ok) {
        const text = await resp.text()
        const priceMatch = text.match(/\$?([0-9,]+(?:\.[0-9]+)?)\s*(?:USD|usd)?/)
        const changeMatch = text.match(/([+-]?\d+\.?\d*)\s*%/);
        (changeMatch)
        if (priceMatch) {
          prices.push({
            symbol: "XAG", name: "Silver",
            price: parseFloat(priceMatch[1].replace(/,/g, "")),
            change: 0, changePercent: changeMatch ? parseFloat(changeMatch[1]) : 0,
            assetType: "commodity",
          })
        }
      }
    } catch (_) {}

    try {
      const resp = await fetchWithTimeout("https://s.jina.ai/top stock market gainers today", {
        timeout: 8000,
        headers: { Authorization: `Bearer ${jinaKey}`, Accept: "text/plain" },
      })
      if (resp.ok) {
        const text = await resp.text()
        const gainerMatch = text.match(/([A-Z]{1,5})\s*(?:\([^)]*\))?[:\s]*\$?([0-9,]+(?:\.[0-9]+)?)[^0-9]*([+-]?\d+\.?\d*)\s*%/)
        if (gainerMatch) {
          prices.push({
            symbol: gainerMatch[1], name: gainerMatch[1],
            price: parseFloat(gainerMatch[2].replace(/,/g, "")),
            change: 0, changePercent: parseFloat(gainerMatch[3]),
            assetType: "stock",
          })
        }
      }
    } catch (_) {}

    if (!prices.length) {
      try {
        const resp = await fetchWithTimeout(
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true",
          { timeout: 5000 }
        )
        if (resp.ok) {
          const json = await resp.json() as any
          if (json.bitcoin) {
            prices.push({
              symbol: "BTC", name: "Bitcoin",
              price: json.bitcoin.usd,
              change: 0, changePercent: json.bitcoin.usd_24h_change ?? 0,
              assetType: "crypto",
            })
          }
        }
      } catch (_) {}
    }

    await set("market:snapshot", prices, FIVE_MIN)
    res.json(prices)
  } catch (err: any) {
    console.error("Market snapshot error:", err)
    res.status(500).json({ error: "Failed to fetch market snapshot" })
  }
})

// ════════════════════════════════════════════════════════════════
//  BREAKING NEWS
// ════════════════════════════════════════════════════════════════

app.get("/api/breaking-news", async (_req, res) => {
  try {
    const cached = await get<BreakingNews[]>("news:breaking")
    if (cached) return res.json(cached)

    const seen = new Set<string>()
    const all: BreakingNews[] = []
    const jinaKey = process.env.JINA_API_KEY
    const apiKey = process.env.NEWSDATA_API_KEY

    await runConcurrent(Object.entries(BREAKING_NEWS_QUERIES), async ([region, q]) => {
      let articles: NewsArticle[] = []

      if (apiKey) {
        try {
          const resp = await fetchWithTimeout(
            `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${encodeURIComponent(q)}&language=en&size=1`,
            { timeout: 6000 }
          )
          if (resp.ok) {
            const json = await resp.json() as any
            for (const item of json.results ?? []) {
              const url = item.link
              if (!url || seen.has(url)) continue
              seen.add(url)
              articles.push({
                id: id(), title: item.title ?? "Untitled", url,
                source: item.source_id ?? "NewsData",
                snippet: (item.description ?? "").slice(0, 200),
                region, assetClass: "stocks", subCategory: "stocks",
                publishedAt: item.pubDate ?? new Date().toISOString(),
              })
            }
          }
        } catch (_) {}
      }

      if (!articles.length && jinaKey) {
        try {
          const resp = await fetchWithTimeout(`https://s.jina.ai/${encodeURIComponent(q)}`, {
            timeout: 6000,
            headers: { Authorization: `Bearer ${jinaKey}`, Accept: "text/plain" },
          })
          if (resp.ok) {
            const text = await resp.text()
            const m = text.match(/\[1\]\s*Title:\s*(.+)\n\[1\]\s*URL Source:\s*(\S+)/)
            if (m) {
              const url = m[2].trim()
              if (!seen.has(url)) {
                seen.add(url)
                articles.push({
                  id: id(), title: m[1].trim().slice(0, 200), url,
                  source: "Jina AI",
                  snippet: "", region, assetClass: "stocks", subCategory: "stocks",
                  publishedAt: new Date().toISOString(),
                })
              }
            }
          }
        } catch (_) {}
      }

      all.push({ region, articles })
    })

    const result = all.filter(b => b.articles.length > 0)
    await set("news:breaking", result, TEN_MIN)
    res.json(result)
  } catch (err: any) {
    console.error("Breaking news error:", err)
    res.status(500).json({ error: "Failed to fetch breaking news" })
  }
})

// ════════════════════════════════════════════════════════════════
//  MERGED NEWS
// ════════════════════════════════════════════════════════════════

app.get("/api/news", async (req, res) => {
  try {
    const cached = await get<NewsArticle[]>("news:merged")
    if (cached) return res.json(cached)

    const seen = new Set<string>()
    const regionQueries = REGIONS.map(r => ({ q: REGION_SEARCH[r], region: r, assetClass: "stocks" }))

    const [rss, nd, sc, jn] = await Promise.allSettled([
      fetchRSS(RSS_FEEDS, seen),
      fetchNewsData(regionQueries, seen),
      fetchSpiderCloud(regionQueries, seen),
      fetchJina(regionQueries, seen),
    ])

    const cryptoArticles = await fetchSpecificQueries(CRYPTO_QUERIES, "USA", "crypto", "crypto", seen, "jina")
    const ipoStock = await fetchSpecificQueries(IPO_QUERIES.ipo, "USA", "stocks", "ipo", seen, "jina")
    const icoCrypto = await fetchSpecificQueries(IPO_QUERIES.ico, "USA", "crypto", "ipo", seen, "jina")
    const ipoArticles = [...ipoStock, ...icoCrypto]

    const all = [
      ...(rss.status === "fulfilled" ? rss.value : []),
      ...(nd.status === "fulfilled" ? nd.value : []),
      ...(sc.status === "fulfilled" ? sc.value : []),
      ...(jn.status === "fulfilled" ? jn.value : []),
      ...cryptoArticles,
      ...ipoArticles,
    ]

    const valid = all.filter(a => a.title && a.title.trim() && a.url && a.url.trim())
    if (!valid.length) {
      return res.status(502).json({
        error: "No articles returned from any provider",
        detail: "Check API keys.",
      })
    }

    valid.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    await set("news:merged", valid, 1800_000)
    res.json(valid)
  } catch (err: any) {
    console.error("News fetch error:", err)
    res.status(500).json({ error: "Failed to fetch news" })
  }
})

// ════════════════════════════════════════════════════════════════
//  BRIEFING
// ════════════════════════════════════════════════════════════════

app.post("/api/briefing", async (req, res) => {
  try {
    const { url } = req.body
    if (!url) return res.status(400).json({ error: "url required" })

    const cached = await get<any>(`briefing:${url}`)
    if (cached) return res.json(cached)

    let title = "Article"
    let content = ""
    const jinaKey = process.env.JINA_API_KEY

    if (jinaKey) {
      try {
        const resp = await fetchWithTimeout(`https://r.jina.ai/${encodeURIComponent(url)}`, {
          timeout: 15000,
          headers: { Authorization: `Bearer ${jinaKey}`, Accept: "text/plain", "X-Return-Format": "markdown" },
        })
        if (resp.ok) {
          const text = await resp.text()
          const titleMatch = text.match(/^Title:\s*(.+)/m)
          if (titleMatch) title = titleMatch[1].trim().slice(0, 200)
          content = text
            .replace(/^Title:.*\n/m, "")
            .replace(/^URL Source:.*\n/m, "")
            .replace(/^Description:.*\n/m, "")
            .replace(/^Markdown Content:.*\n/m, "")
            .replace(/!\[.*?\]\(.*?\)/g, "")
            .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
            .trim()
        }
      } catch (_) {}
    }

    if (!content) {
      try {
        const resp = await fetchWithTimeout(url, {
          timeout: 10000,
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            Accept: "text/html,application/xhtml+xml",
          },
        })
        if (resp.ok) {
          const html = await resp.text()
          const tMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
          if (tMatch) title = tMatch[1].trim().slice(0, 200)
          const bodyMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
          const bodyText = bodyMatch?.[1]?.replace(/<[^>]+>/g, "").trim() ?? ""
          content = bodyText.slice(0, 3000)
          if (!content) {
            const desc = html.match(/<meta[^>]+(?:name|property)=["'](?:og:)?description["'][^>]+content=["']([^"']+)["']/i)
            content = desc?.[1]?.trim()?.slice(0, 1500) ?? ""
          }
        }
      } catch (_) {}
    }

    if (!content) {
      return res.status(404).json({ error: "Could not fetch article content" })
    }

    const briefing = buildBriefing(title, content, url)
    await set(`briefing:${url}`, briefing, TEN_MIN)
    res.json(briefing)
  } catch (err) {
    console.error("Briefing error:", err)
    res.status(500).json({ error: "Failed to generate briefing" })
  }
})

// ════════════════════════════════════════════════════════════════
//  LEGACY SUMMARY
// ════════════════════════════════════════════════════════════════

app.post("/api/summary", async (req, res) => {
  try {
    const { url } = req.body
    if (!url) return res.status(400).json({ error: "url required" })

    const cached = await get<any>(`legacy-summary:${url}`)
    if (cached) return res.json(cached)

    let title = "Article"
    let summary = ""

    try {
      const resp = await fetchWithTimeout(url, {
        timeout: 10000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          Accept: "text/html",
        },
      })
      if (resp.ok) {
        const html = await resp.text()
        title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim()?.slice(0, 200) ?? "Article"
        const desc = html.match(/<meta[^>]+(?:name|property)=["'](?:og:)?description["'][^>]+content=["']([^"']+)["']/i)
        summary = desc?.[1]?.trim()?.slice(0, 1500) ?? ""
      }
    } catch (_) {}

    if (!summary) throw new Error("Could not fetch article content")
    const result = { url, title, summary }
    await set(`legacy-summary:${url}`, result, 120_000)
    res.json(result)
  } catch (err) {
    console.error("Summary error:", err)
    res.status(500).json({ error: "Failed to fetch article summary" })
  }
})

// ════════════════════════════════════════════════════════════════
//  STATIC FILES
// ════════════════════════════════════════════════════════════════

const distClient = path.join(__dirname, "../client")
app.use(express.static(distClient, { maxAge: 0, etag: false }))
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    res.set("Cache-Control", "no-cache, no-store, must-revalidate")
    res.sendFile(path.join(distClient, "index.html"))
  } else {
    next()
  }
})

initCache().then(() => {
  app.listen(PORT, () => {
    console.log(`Markets Terminal running on http://localhost:${PORT}`)
  })
})
