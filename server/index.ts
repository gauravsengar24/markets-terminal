import express from "express"
import path from "path"
import { fileURLToPath } from "url"
import { initCache, get, set, del } from "./cache.js"
import { RSS_FEEDS, BREAKING_RSS_FEEDS } from "../shared/constants.js"
import type { RssFeed } from "../shared/constants.js"
import type { NewsArticle, BreakingNews, MarketPrice, LearningPreferences } from "../shared/types.js"

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

const IMPACT_RULES: { regex: RegExp; category: string; volatility: string }[] = [
  { regex: /fed|federal reserve|ecb|central bank|interest rate|rate hike|rate cut|monetary policy|inflation|cpi|ppi|quantitative easing|tightening|macroeconomic|core inflation|inflation data|consumer price|producer price/i, category: "central-bank", volatility: "high" },
  { regex: /war|conflict|sanctions|military|invasion|nuclear|missile|geopolitical|tension|defense|espionage|troop|mobilization|ceasefire|hostility|military aid|arms|navy/i, category: "geopolitical", volatility: "high" },
  { regex: /crisis|crash|collapse|bankruptcy|default|bailout|recession|depression|liquidity|contagion|systemic|bank run|fdic|credit crunch|debt ceiling|downgrade/i, category: "crisis", volatility: "high" },
  { regex: /pandemic|epidemic|outbreak|virus|covid|quarantine|lockdown|health emergency|vaccine mandate|health crisis|who declared|public health|hospitalization/i, category: "pandemic", volatility: "high" },
  { regex: /crude.?oil|wti|brent|energy|gas|natural gas|petrol|oil price|oil production|opec|commodity|supply shock|energy crisis|fossil fuel|refining/i, category: "energy", volatility: "high" },
  { regex: /tariff|trade war|trade deal|import|export|wto|trade dispute|dumping|protectionism|reciprocal|trade balance|trade deficit|export ban/i, category: "trade", volatility: "medium" },
  { regex: /election|vote|electoral|polling|presidency|parliament|campaign|runoff|swing state|midterm|voter|ballot|governor|senate|congress|landslide|referendum|regime change/i, category: "election", volatility: "medium" },
  { regex: /currency|forex|exchange rate|dollar index|devaluation|appreciation|stablecoin|peg|reserve currency|fx|currency crisis|central bank digital|crypto regulation|bitcoin etf/i, category: "currency", volatility: "medium" },
  { regex: /earnings|quarterly result|revenue|profit|loss|scandal|fraud|whistleblower|class action|securities fraud|insider trading|corporate governance|ceo resign|board seat|activist investor|proxy fight|dividend|buyback/i, category: "corporate", volatility: "medium" },
  { regex: /ai|artificial intelligence|machine learning|chatgpt|deep learning|neural|breakthrough|quantum|semiconductor|chip|nvidia|innovation|patent|startup|unicorn|disrupt|blockchain|metaverse/i, category: "tech", volatility: "medium" },
  { regex: /climate|natural disaster|hurricane|earthquake|flood|wildfire|drought|tornado|tsunami|extreme weather|global warming|emission|renewable|solar|wind|net zero|carbon|cop\d+/i, category: "climate", volatility: "medium" },
]

export const IMPACT_CATEGORIES_CONFIG: { id: string; label: string; short: string; vol: string }[] = [
  { id: "geopolitical", label: "Geopolitical Conflict & War", short: "Geopolitical", vol: "high" },
  { id: "central-bank", label: "Central Bank & Monetary Policy", short: "Monetary", vol: "high" },
  { id: "crisis", label: "Financial System & Banking Crises", short: "Financial", vol: "high" },
  { id: "pandemic", label: "Pandemic & Health Crisis", short: "Health", vol: "high" },
  { id: "energy", label: "Energy & Commodity Shocks", short: "Commodities", vol: "high" },
  { id: "trade", label: "Trade Wars & Tariffs", short: "Trade", vol: "medium" },
  { id: "election", label: "Political Elections & Policy Shifts", short: "Political", vol: "medium" },
  { id: "currency", label: "Currency & FX Events", short: "FX", vol: "medium" },
  { id: "corporate", label: "Corporate Earnings & Scandals", short: "Corporate", vol: "medium" },
  { id: "tech", label: "Technology & AI Breakthroughs", short: "Tech", vol: "medium" },
  { id: "climate", label: "Climate & Natural Disasters", short: "Climate", vol: "medium" },
]

function detectImpactCategory(title: string, snippet: string): { impactCategory: string; volatility: string } | null {
  const t = (title + " " + snippet).toLowerCase()
  for (const rule of IMPACT_RULES) {
    if (rule.regex.test(t)) return { impactCategory: rule.category, volatility: rule.volatility }
  }
  return null
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
        const cleanTitle = (item.title || "").replace(/<[^>]+>/g, "").trim()
        if (!cleanTitle || cleanTitle.length < 10) continue
        const lowerUrl = url.toLowerCase()
        if (/seekingalpha|seeking.?alpha|etfreplay|barrons\.com|investopedia\.com|fool\.com|zacks|kiplinger/i.test(lowerUrl)) continue
        const alphaRatio = (snippet.match(/[a-zA-Z]/g) || []).length / (snippet.length || 1)
        if (snippet.length > 0 && (alphaRatio < 0.3 || snippet.length < 20)) continue
        const sub = feed.subCategory === "stocks" ? detectSubCategory(cleanTitle, snippet) : feed.subCategory
        const impact = detectImpactCategory(cleanTitle, snippet)
        articles.push({
          id: id(),
          title: cleanTitle.slice(0, 200),
          url,
          source: new URL(url).hostname.replace("www.", ""),
          snippet,
          region: feed.region,
          assetClass: sub === "crypto" ? "crypto" : sub === "commodities" ? "commodities" : "stocks",
          subCategory: sub,
          publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          impactCategory: impact?.impactCategory,
          volatility: impact?.volatility,
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

function cleanArticleContent(raw: string): string {
  let text = raw
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
  text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
  text = text.replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "")
  text = text.replace(/!\[.*?\]\(.*?\)/g, "")
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
  text = text.replace(/<[^>]+>/g, "")
  text = text.replace(/\{[^{}]*"@context"[^{}]*\}[^{}]*\}/g, "")
  text = text.replace(/\{[^}]*\}/g, "")
  text = text.replace(/https?:\/\/\S+/g, "")
  text = text.replace(/&#?\w+;/g, (m) => {
    const entities: Record<string, string> = { "&#x27;": "'", "&#39;": "'", "&apos;": "'", "&amp;": "&", "&quot;": '"', "&#34;": '"', "&lt;": "<", "&#60;": "<", "&gt;": ">", "&#62;": ">", "&nbsp;": " ", "&#8217;": "'", "&#8216;": "'", "&#8220;": '"', "&#8221;": '"', "&#8211;": "-", "&#8212;": "-", "&ndash;": "-", "&mdash;": "-", "&hellip;": "...", "&rsquo;": "'", "&lsquo;": "'", "&ldquo;": '"', "&rdquo;": '"', "&bull;": " * ", "&middot;": " * " }
    return entities[m.toLowerCase()] || m
  })
  text = text.replace(/ShareSaveAdd.*?(?=[A-Z]|$)/g, "")
  text = text.replace(/ShareSavePlay.*?(?=[A-Z]|$)/gi, "")
  text = text.replace(/FollowFollow\d*/g, "")
  text = text.replace(/Followers?\d*/gi, "")
  text = text.replace(/(\d+\s*)?(min|hr|hrs|sec)\s*(read|play|ago)/gi, "")
  text = text.replace(/Summary/i, "")
  text = text.replace(/Comments?\d*/gi, "")
  text = text.replace(/\b\d+\s*(m|h|min)\s*ago\b/gi, "")
  text = text.replace(/Getty Images/i, "")
  text = text.replace(/Reuters\s*/gi, "")
  text = text.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+[A-Z][a-z]+\b/g, "")
  text = text.replace(/([a-zA-Z])\d{2,}(?=[A-Za-z])/g, "$1 ") // "Management53Follow" → "Management Follow"
  text = text.replace(/([a-zA-Z])\d{2,}(?=\s|$)/g, "$1") // "Management53" → "Management"
  text = text.replace(/\(?(\d+min)\)/gi, "") // "(5min)" or "5min)"
  text = text.replace(/\)(?=[A-Z][a-z])/g, ") ") // ")T" → ") T"
  text = text.replace(/\s{2,}/g, " ")
  text = text.replace(/^.*?(?=[A-Z][a-z]{4,}\s)/, "") // strip leading junk before a real word
  text = text.split("\n")
    .map(l => l.trim())
    .filter(l => {
      if (!l) return false
      const alpha = (l.match(/[a-zA-Z]/g) || []).length
      if (alpha < 7) return false
      if (alpha < l.length * 0.25) return false
      if (/^(just now|earlier|minutes? ago|hours? ago|today|yesterday|reuters|ap news|bbc news|cnn|the guardian|the .+post)$/i.test(l)) return false
      if (/^[A-Z][a-z]+ [A-Z][a-z]+$/i.test(l) && alpha === l.replace(/\s/g, "").length) return false
      if (/^(by|from|in|at|on|updated|published|posted|share|save|add)/i.test(l)) return false
      return true
    }).join(" ")
  text = text.replace(/\s+/g, " ").trim()
  return text.slice(0, 6000)
}

function buildBriefing(title: string, content: string, url: string, snippet?: string) {
  const textWithMarkers = content.replace(/\$(\d+)\.(\d+)/g, "__DLR__$1__PT__$2")
  const sentences = textWithMarkers.split(/[.!?]+(?:\s|$)/).filter(s => {
    const t = s.trim().replace(/__DLR__/g, "$").replace(/__PT__/g, ".")
    if (t.length < 25 || t.length > 600) return false
    if (/^[{\["]/.test(t)) return false
    if ((t.match(/[a-zA-Z]/g) || []).length < t.length * 0.35) return false
    if (/(seeking alpha|disclaimer|this account|not managed|not monitored|follow us|subscribe|sign up|all rights reserved|terms of service|privacy policy|past performance|investment advice|for informational|nomura asset|form 144|form def)/i.test(t)) return false
    if (t.split(/\s+/).length < 5) return false
    if (/^\d/.test(t.trim())) return false
    return true
  })

  const restore = (s: string) => s.replace(/__DLR__/g, "$").replace(/__PT__/g, ".")

  const used = new Set<string>()
  function addUnique(arr: string[], max: number, filter?: (s: string) => boolean): string[] {
    const result: string[] = []
    for (const s of arr) {
      if (result.length >= max) break
      const restored = restore(s.trim())
      const deduped = restored + "."
      if (used.has(deduped)) continue
      if (filter && !filter(restored)) continue
      used.add(deduped)
      result.push(deduped)
    }
    return result
  }

  const makeFallback = (text: string) => {
    const mt = text.replace(/\$(\d+)\.(\d+)/g, "__DLR__$1__PT__$2")
    const parts = mt.split(/[.!?]+/).filter(s => s.trim().length > 15)
    return addUnique(parts, 3)
  }

  const whatHappened = addUnique(sentences, 2)
  const marketCtx = addUnique(sentences, 2, s =>
    /market|price|percent|dollar|billion|million|index|share|economy|trade|growth|inflation|rate|fed|central bank|impact|revenue|profit|loss|volatile|surge|decline|fell|rose/i.test(s)
  )
  const takeawayFilter = (s: string) =>
    /will|could|expected|forecast|outlook|next|future|ahead|plan|aim|goal|target|strategy|opportunity|risk|according|said|added|noted/i.test(s)
  const takeaways = addUnique(sentences, 3, takeawayFilter)

  let bullets = [...whatHappened, ...marketCtx, ...takeaways]
  if (!bullets.length && snippet) {
    const mt = snippet.replace(/\$(\d+)\.(\d+)/g, "__DLR__$1__PT__$2")
    bullets = mt.split(/[.!?]+/).filter(s => restore(s).trim().length > 20).map(s => restore(s.trim()) + ".").slice(0, 3)
  }
  if (!bullets.length) bullets = [`${title}.`]
  bullets = bullets.slice(0, 3)

  return { url, title, bullets }
}

async function getLearningPreferences(): Promise<LearningPreferences> {
  const empty = { totalFeedback: 0, totalUp: 0, totalDown: 0, preferredStyle: "bullet" as const, topSources: [], topCategories: [] }
  try {
    const store = await get<FeedbackStore>("feedback:data")
    if (!store || store.totalFeedback < 1) return empty
    const totalUp = store.recent.filter(e => e.rating === 1).length
    const totalDown = store.recent.filter(e => e.rating === -1).length
    const sources = Object.entries(store.sourceScores)
      .map(([k, v]) => ({ k, score: v.up / (v.up + v.down || 1) }))
      .sort((a, b) => b.score - a.score).slice(0, 5).map(s => s.k)
    const categories = Object.entries(store.categoryScores)
      .map(([k, v]) => ({ k, score: v.up / (v.up + v.down || 1) }))
      .sort((a, b) => b.score - a.score).slice(0, 5).map(s => s.k)
    return { totalFeedback: store.totalFeedback, totalUp, totalDown, preferredStyle: "bullet", topSources: sources, topCategories: categories }
  } catch {
    return empty
  }
}

async function generateAIBriefing(title: string, content: string, url: string): Promise<any | null> {
  const jinaKey = process.env.JINA_API_KEY
  if (!jinaKey) return null
  try {
    const learning = await getLearningPreferences()
    const learningHint = learning.totalFeedback > 10
      ? `\nUser feedback so far: ${learning.totalUp} up, ${learning.totalDown} down. Top categories: ${learning.topCategories.slice(0, 3).join(", ")}. Focus on clear, concise bullet points that match what users found helpful.`
      : ""

    const resp = await fetchWithTimeout("https://api.jina.ai/v1/chat/completions", {
      method: "POST",
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${jinaKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "jina-deepsearch-v1",
        messages: [
          {
            role: "system",
            content: `You are NeuraBrain, a self-learning financial AI that generates precise article briefings. Always respond in JSON with three keys:

- whatHappened: array of 3-4 bullet point strings summarizing what happened
- marketContext: array of 1-2 bullet point strings with market/financial context (empty array if none)
- keyTakeaways: array of 3-5 bullet point strings with forward-looking implications

Rules:
- EVERY field must be an array of strings (bullet points). Never use paragraphs.
- Each bullet point should be a complete, concise sentence.
- marketContext must be empty array [] if the article has no clear market impact.
- Do not fabricate data. Use only what is in the article.
- CRITICAL: Never repeat the same information across sections. whatHappened, marketContext, and keyTakeaways must all contain distinct content.${learningHint}`,
          },
          {
            role: "user",
            content: `Title: ${title}\n\nArticle:\n${content.slice(0, 8000)}`,
          },
        ],
        temperature: 0.1,
      }),
    })
    if (!resp.ok) return null
    const json = await resp.json() as any
    const text = json?.choices?.[0]?.message?.content
    if (!text) return null
    const parsed = JSON.parse(text.replace(/```json\s*/gi, "").replace(/```\s*$/g, "").trim())
    const wh = Array.isArray(parsed.whatHappened) ? parsed.whatHappened.slice(0, 5) : ["No summary available."]
    const mc = Array.isArray(parsed.marketContext) ? parsed.marketContext.slice(0, 3) : []
    const kt = Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways.slice(0, 5) : ["More details in the full article."]
    return { url, title, whatHappened: wh, marketContext: mc, keyTakeaways: kt }
  } catch {
    return null
  }
}

app.post("/api/briefing", async (req, res) => {
  try {
    const { url, snippet } = req.body
    if (!url) return res.status(400).json({ error: "url required" })

    const cached = await get<any>(`briefing:${url}`)
    if (cached) return res.json(cached)

    let title = ""
    let rawContent = ""
    let fallbackSnippet = snippet || ""
    const jinaKey = process.env.JINA_API_KEY

    if (!fallbackSnippet) {
      try {
        const news = await get<NewsArticle[]>("news:merged")
        if (news) {
          const article = news.find(a => a.url === url)
          if (article) {
            fallbackSnippet = article.snippet || ""
            if (!title) title = article.title
          }
        }
      } catch {}
    }

    if (jinaKey) {
      try {
        const resp = await fetchWithTimeout(`https://r.jina.ai/${encodeURIComponent(url)}`, {
          timeout: 15000,
          headers: {
            Authorization: `Bearer ${jinaKey}`,
            Accept: "text/plain",
            "X-Return-Format": "markdown",
            "X-Exclude": "script, style, nav, footer, header, .sidebar, .ad, .advertisement, .related, .comments, .social",
          },
        })
        if (resp.ok) {
          const text = await resp.text()
          const titleMatch = text.match(/^Title:\s*(.+)/m)
          if (titleMatch) title = titleMatch[1].trim().slice(0, 200)
          rawContent = text
            .replace(/^Title:.*\n/m, "")
            .replace(/^URL Source:.*\n/m, "")
            .replace(/^Description:.*\n/m, "")
            .replace(/^Markdown Content:.*\n/m, "")
        }
      } catch {}
    }

    if (!rawContent) {
      try {
        const resp = await fetchWithTimeout(url, {
          timeout: 10000,
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
        })
        if (resp.ok) {
          const html = await resp.text()
          const tMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
          if (tMatch && !title) title = tMatch[1].trim().slice(0, 200)
          for (const sel of [/<article[^>]*>([\s\S]*?)<\/article>/i, /<div[^>]*class=["'][^"']*article-body[^"']*["'][^>]*>([\s\S]*?)<\/div>/i, /<div[^>]*class=["'][^"']*story-body[^"']*["'][^>]*>([\s\S]*?)<\/div>/i, /<div[^>]*class=["'][^"']*post-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i]) {
            const m = html.match(sel)
            if (m) { rawContent = m[1]; break }
          }
          if (!rawContent) {
            const desc = html.match(/<meta[^>]+(?:name|property)=["'](?:og:)?description["'][^>]+content=["']([^"']+)["']/i)
            rawContent = desc?.[1] ?? ""
          }
        }
      } catch {}
    }

    const content = cleanArticleContent(rawContent || fallbackSnippet || title)
    if (!title) title = url.split("/").pop()?.replace(/-/g, " ") || "Article"

    let briefing = null
    if (jinaKey && rawContent) briefing = await generateAIBriefing(title, content, url)
    if (!briefing) briefing = buildBriefing(title, content || title, url, fallbackSnippet)

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
//  FEEDBACK & SELF-LEARNING
// ════════════════════════════════════════════════════════════════

interface FeedbackEntry {
  url: string
  articleTitle: string
  source: string
  region: string
  category: string
  volatility: string
  rating: 1 | -1
  timestamp: string
}

interface FeedbackStore {
  sourceScores: Record<string, { up: number; down: number }>
  categoryScores: Record<string, { up: number; down: number }>
  volatilityScores: Record<string, { up: number; down: number }>
  totalFeedback: number
  recent: FeedbackEntry[]
}

function emptyFeedbackStore(): FeedbackStore {
  return { sourceScores: {}, categoryScores: {}, volatilityScores: {}, totalFeedback: 0, recent: [] }
}

app.post("/api/feedback", async (req, res) => {
  try {
    const { url, articleTitle, source, region, category, volatility, rating } = req.body
    if (!url || !rating || ![1, -1].includes(rating)) {
      return res.status(400).json({ error: "url and rating (1 or -1) required" })
    }

    const store = (await get<FeedbackStore>("feedback:data")) ?? emptyFeedbackStore()

    const entry: FeedbackEntry = {
      url, articleTitle: articleTitle ?? "Untitled", source: source ?? "unknown",
      region: region ?? "", category: category ?? "", volatility: volatility ?? "",
      rating, timestamp: new Date().toISOString(),
    }

    store.totalFeedback++
    store.recent.unshift(entry)
    if (store.recent.length > 500) store.recent.pop()

    if (source) {
      if (!store.sourceScores[source]) store.sourceScores[source] = { up: 0, down: 0 }
      if (rating === 1) store.sourceScores[source].up++
      else store.sourceScores[source].down++
    }
    if (category) {
      if (!store.categoryScores[category]) store.categoryScores[category] = { up: 0, down: 0 }
      if (rating === 1) store.categoryScores[category].up++
      else store.categoryScores[category].down++
    }
    if (volatility) {
      if (!store.volatilityScores[volatility]) store.volatilityScores[volatility] = { up: 0, down: 0 }
      if (rating === 1) store.volatilityScores[volatility].up++
      else store.volatilityScores[volatility].down++
    }

    await set("feedback:data", store, ONE_HOUR * 24)
    res.json({ ok: true, totalFeedback: store.totalFeedback })
  } catch (err: any) {
    console.error("Feedback error:", err)
    res.status(500).json({ error: "Failed to store feedback" })
  }
})

app.get("/api/learning/stats", async (_req, res) => {
  try {
    const store = (await get<FeedbackStore>("feedback:data")) ?? emptyFeedbackStore()
    const totalUp = store.recent.filter(e => e.rating === 1).length
    const totalDown = store.recent.filter(e => e.rating === -1).length
    res.json({
      name: "NeuraBrain",
      totalFeedback: store.totalFeedback,
      totalUp,
      totalDown,
      sources: Object.entries(store.sourceScores)
        .map(([k, v]) => ({ source: k, up: v.up, down: v.down, score: v.up / (v.up + v.down || 1) }))
        .sort((a, b) => b.score - a.score),
      categories: Object.entries(store.categoryScores)
        .map(([k, v]) => ({ category: k, up: v.up, down: v.down, score: v.up / (v.up + v.down || 1) }))
        .sort((a, b) => b.score - a.score),
    })
  } catch {
    res.json({ name: "NeuraBrain", totalFeedback: 0, totalUp: 0, totalDown: 0, sources: [], categories: [] })
  }
})

app.get("/api/learning/preferences", async (_req, res) => {
  const prefs = await getLearningPreferences()
  res.json(prefs)
})

// ════════════════════════════════════════════════════════════════
//  IMPACT ANALYSIS — dynamic category scores from live news data
// ════════════════════════════════════════════════════════════════

app.get("/api/impact-analysis", async (_req, res) => {
  try {
    const cached = await get<any>("analysis:impact")
    let articles = await get<NewsArticle[]>("news:merged")
    
    if (cached && articles && articles.length > 0 && cached.totalArticles === articles.length) {
      return res.json(cached)
    }

    if (!articles || !articles.length) {
      const seen = new Set<string>()
      articles = await fetchRSS(RSS_FEEDS, seen)
      const valid = articles.filter(a => a.title && a.title.trim() && a.url && a.url.trim())
      if (valid.length) {
        valid.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        await set("news:merged", valid, 1800_000)
        articles = valid
      }
    }

    if (!articles || !articles.length) {
      return res.json({ categories: [], totalArticles: 0 })
    }

    const now = Date.now()
    const counts = new Map<string, { count: number; recencySum: number }>()
    const volMap = new Map<string, string>()

    for (const a of articles) {
      const cat = a.impactCategory
      if (!cat) continue
      if (!counts.has(cat)) { counts.set(cat, { count: 0, recencySum: 0 }); volMap.set(cat, a.volatility || "medium") }
      const entry = counts.get(cat)!
      entry.count++
      const ageHours = (now - new Date(a.publishedAt).getTime()) / 3600000
      if (ageHours < 48) entry.recencySum += Math.max(0, 1 - ageHours / 48)
    }

    const totalTagged = [...counts.values()].reduce((s, c) => s + c.count, 0) || 1
    const maxCount = Math.max(...[...counts.values()].map(c => c.count), 1)

    const categories = IMPACT_CATEGORIES_CONFIG.map((cfg) => {
      const data = counts.get(cfg.id)
      if (!data || data.count < 1) {
        return { id: cfg.id, label: cfg.label, short: cfg.short, vol: cfg.vol, articleCount: 0, score: 0 }
      }
      const volMult = cfg.vol === "high" ? 1.3 : 1.0
      const freq = data.count / totalTagged
      const recencyBoost = data.recencySum / data.count
      const dominance = data.count / maxCount
      const raw = (freq * 50 + dominance * 30 + recencyBoost * 20) * volMult
      const score = Math.min(98, Math.max(3, Math.round(raw)))
      return { id: cfg.id, label: cfg.label, short: cfg.short, vol: cfg.vol, articleCount: data.count, score }
    }).sort((a, b) => b.score - a.score)

    const result = { categories, totalArticles: articles.length, generatedAt: new Date().toISOString() }
    await set("analysis:impact", result, FIVE_MIN)
    res.json(result)
  } catch (err: any) {
    console.error("Impact analysis error:", err)
    res.status(500).json({ error: "Failed to compute impact analysis" })
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

// ─── Flush cached briefings from blocked / removed domains ───

const BLOCKED_DOMAINS = ["seekingalpha", "seeking.?alpha", "barrons\\.com", "fool\\.com"]

async function flushDomainCache(): Promise<number> {
  let total = 0
  const news = await get<any[]>("news:merged")
  if (news) {
    for (const a of news) {
      if (BLOCKED_DOMAINS.some(d => new RegExp(d, "i").test(a.url))) {
        total += await del(`briefing:${a.url}`)
      }
    }
  }
  return total
}

initCache().then(async () => {
  try {
    const flushed = await flushDomainCache()
    if (flushed > 0) console.log(`Flushed ${flushed} cached briefings from blocked domains`)
  } catch {}
  app.listen(PORT, () => {
    console.log(`Markets Terminal running on http://localhost:${PORT}`)
  })
})
