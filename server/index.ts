import express from "express"
import path from "path"
import { fileURLToPath } from "url"
import { initCache, get, set } from "./cache.js"
import { RSS_FEEDS, BREAKING_RSS_FEEDS } from "../shared/constants.js"
import type { RssFeed } from "../shared/constants.js"
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

function runConcurrent<T>(items: T[], fn: (item: T) => Promise<void>, limit = 5): Promise<void> {
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

function parseRSSXml(xml: string): Array<{ title: string; link: string; description: string; pubDate: string }> {
  const items: Array<{ title: string; link: string; description: string; pubDate: string }> = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi
  let match
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]
    const getTag = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
      return m ? m[1].trim() : ''
    }
    const getCDATA = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'))
      return m ? m[1].trim() : getTag(tag)
    }
    items.push({
      title: getCDATA('title'),
      link: getTag('link'),
      description: getCDATA('description'),
      pubDate: getTag('pubDate'),
    })
  }
  return items
}

function parseAtomXml(xml: string): Array<{ title: string; link: string; description: string; pubDate: string }> {
  const items: Array<{ title: string; link: string; description: string; pubDate: string }> = []
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi
  let match
  while ((match = entryRegex.exec(xml)) !== null) {
    const block = match[1]
    const getTag = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
      return m ? m[1].trim() : ''
    }
    const linkMatch = block.match(/<link[^>]*href=["']([^"']+)["']/)
    items.push({
      title: getTag('title'),
      link: linkMatch?.[1] ?? '',
      description: getTag('summary') || getTag('content') || '',
      pubDate: getTag('published') || getTag('updated'),
    })
  }
  return items
}

async function fetchRSS(feeds: RssFeed[], seen: Set<string>): Promise<NewsArticle[]> {
  const articles: NewsArticle[] = []
  await runConcurrent(feeds, async (feed) => {
    try {
      const resp = await fetchWithTimeout(feed.url, {
        timeout: 10000,
        headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
      })
      if (!resp.ok) return
      const xml = await resp.text()
      let items = parseRSSXml(xml)
      if (!items.length) items = parseAtomXml(xml)
      for (const item of items) {
        const url = item.link
        if (!url || seen.has(url)) continue
        seen.add(url)
        const snippet = item.description.replace(/<[^>]+>/g, "").slice(0, 280)
        const sub = feed.subCategory === "stocks" ? detectSubCategory(item.title, snippet) : feed.subCategory
        articles.push({
          id: id(),
          title: item.title.slice(0, 200),
          url,
          source: new URL(url).hostname.replace("www.", ""),
          snippet,
          region: feed.region,
          assetClass: sub === "crypto" ? "crypto" : sub === "commodities" ? "commodities" : "stocks",
          subCategory: sub,
          publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        })
      }
    } catch (_) {}
  })
  return articles
}

// ════════════════════════════════════════════════════════════════
//  MARKET SNAPSHOT — Crypto movers, S&P 500 movers, Nifty 50 movers
// ════════════════════════════════════════════════════════════════

async function fetchCryptoTicker(): Promise<MarketPrice[]> {
  try {
    const resp = await fetchWithTimeout(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=100&page=1&price_change_percentage=24h",
      { timeout: 8000 }
    )
    if (!resp.ok) return []
    const json = await resp.json() as any[]
    const sorted = [...json].sort((a, b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0))
    const gainers = sorted.slice(0, 10)
    const losers = sorted.slice(-5).reverse()
    return [...gainers, ...losers].map(coin => ({
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      change: coin.price_change_24h ?? 0,
      changePercent: coin.price_change_percentage_24h ?? 0,
      assetType: "crypto" as const,
    }))
  } catch { return [] }
}

async function fetchYahooMovers(region: string, scrId: string, count: number): Promise<MarketPrice[]> {
  try {
    const resp = await fetchWithTimeout(
      `https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=true&lang=en-US&region=${region}&scrIds=${scrId}&count=${count}`,
      { timeout: 12000, headers: { "User-Agent": "Mozilla/5.0" } }
    )
    if (!resp.ok) return []
    const json = await resp.json() as any
    const quotes: any[] = json?.finance?.result?.[0]?.quotes ?? []
    if (!quotes.length) return []
    return quotes.map(q => ({
      symbol: q.symbol,
      name: q.shortName ?? q.symbol,
      price: q.regularMarketPrice?.raw ?? q.regularMarketPrice ?? 0,
      change: q.regularMarketChange?.raw ?? q.regularMarketChange ?? 0,
      changePercent: q.regularMarketChangePercent?.raw ?? q.regularMarketChangePercent ?? 0,
      assetType: "stock" as const,
    }))
  } catch { return [] }
}

async function fetchStockMoversViaJina(): Promise<MarketPrice[]> {
  const jinaKey = process.env.JINA_API_KEY
  if (!jinaKey) return []
  const results: MarketPrice[] = []
  const queries = [
    "top stock market gainers today S&P 500",
    "top stock market losers today S&P 500",
  ]
  for (const q of queries) {
    try {
      const resp = await fetchWithTimeout(
        `https://s.jina.ai/${encodeURIComponent(q)}`,
        { timeout: 10000, headers: { Authorization: `Bearer ${jinaKey}`, Accept: "text/plain" } }
      )
      if (!resp.ok) continue
      const text = await resp.text()
      const matches = text.matchAll(/([A-Z]{1,5})\s*[:\s]*\$?([0-9,]+(?:\.[0-9]+)?)\s*[^0-9]*([+-]?\d+\.?\d*)\s*%/g)
      for (const m of matches) {
        const price = parseFloat(m[2].replace(/,/g, ""))
        const changePct = parseFloat(m[3])
        if (price > 0 && results.length < 20) {
          results.push({
            symbol: m[1].toUpperCase(),
            name: m[1].toUpperCase(),
            price,
            change: 0,
            changePercent: changePct,
            assetType: "stock",
          })
        }
      }
    } catch {}
  }
  return results
}

async function fetchNiftyViaJina(): Promise<MarketPrice[]> {
  const jinaKey = process.env.JINA_API_KEY
  if (!jinaKey) return []
  try {
    const resp = await fetchWithTimeout(
      "https://s.jina.ai/top gainers and losers nifty 50 today stock market",
      { timeout: 10000, headers: { Authorization: `Bearer ${jinaKey}`, Accept: "text/plain" } }
    )
    if (!resp.ok) return []
    const text = await resp.text()
    const results: MarketPrice[] = []
    const lines = text.split("\n")
    for (const line of lines) {
      const m = line.match(/([A-Z]{1,10})\s*(?:\([^)]*\))?[:\s]*₹?\s*([0-9,]+(?:\.[0-9]+)?)\s*[^0-9]*([+-]?\d+\.?\d*)\s*%/i)
      if (m) {
        const price = parseFloat(m[2].replace(/,/g, ""))
        const changePct = parseFloat(m[3])
        if (price > 0) {
          results.push({
            symbol: m[1].toUpperCase(),
            name: m[1].toUpperCase(),
            price,
            change: 0,
            changePercent: changePct,
            assetType: "stock",
          })
        }
      }
    }
    return results.slice(0, 10)
  } catch { return [] }
}

app.get("/api/market-snapshot", async (_req, res) => {
  try {
    const cached = await get<MarketPrice[]>("market:snapshot")
    if (cached) return res.json(cached)

    const [crypto, spGainers, spLosers, stockJina, nifty] = await Promise.all([
      fetchCryptoTicker(),
      fetchYahooMovers("US", "day_gainers", 5),
      fetchYahooMovers("US", "day_losers", 5),
      fetchStockMoversViaJina(),
      fetchNiftyViaJina(),
    ])

    const stocks = spGainers.length + spLosers.length >= 4
      ? [...spGainers, ...spLosers]
      : stockJina

    const prices: MarketPrice[] = [...crypto, ...stocks, ...nifty]

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
      } catch {}
    }

    await set("market:snapshot", prices, FIVE_MIN)
    res.json(prices)
  } catch (err: any) {
    console.error("Market snapshot error:", err)
    res.status(500).json({ error: "Failed to fetch market snapshot" })
  }
})

// ════════════════════════════════════════════════════════════════
//  BREAKING NEWS — one top story per region from key RSS feeds
// ════════════════════════════════════════════════════════════════

app.get("/api/breaking-news", async (_req, res) => {
  try {
    const cached = await get<BreakingNews[]>("news:breaking")
    if (cached) return res.json(cached)

    const seen = new Set<string>()
    const articles = await fetchRSS(BREAKING_RSS_FEEDS, seen)

    const byRegion = new Map<string, NewsArticle[]>()
    for (const a of articles) {
      if (!byRegion.has(a.region)) byRegion.set(a.region, [])
      byRegion.get(a.region)!.push(a)
    }

    const result: BreakingNews[] = []
    for (const [region, arts] of byRegion) {
      arts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      result.push({ region, articles: arts.slice(0, 1) })
    }

    await set("news:breaking", result, TEN_MIN)
    res.json(result)
  } catch (err: any) {
    console.error("Breaking news error:", err)
    res.status(500).json({ error: "Failed to fetch breaking news" })
  }
})

// ════════════════════════════════════════════════════════════════
//  MERGED NEWS — all RSS feeds, no paid APIs
// ════════════════════════════════════════════════════════════════

app.get("/api/news", async (_req, res) => {
  try {
    const cached = await get<NewsArticle[]>("news:merged")
    if (cached) return res.json(cached)

    const seen = new Set<string>()
    const articles = await fetchRSS(RSS_FEEDS, seen)

    const valid = articles.filter(a => a.title && a.title.trim() && a.url && a.url.trim())
    if (!valid.length) {
      return res.status(502).json({
        error: "No articles returned from any RSS feed",
        detail: "Check network connectivity.",
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
