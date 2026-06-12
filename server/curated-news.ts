import { GoogleGenAI } from "@google/genai"
import type { NewsArticle, CuratedArticle } from "../shared/types.js"
import { TOPIC_KEYWORDS } from "../shared/constants.js"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ""
let ai: GoogleGenAI | null = null
if (GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
}

const TOPIC_WEIGHTS: Record<string, number> = {
  "crypto-defi": 18,
  "ipo": 17,
  "crypto-regulation": 16,
  "tech-founder": 15,
  "trending": 13,
  "politics-leader": 8,
  "war-conflict": 6,
}

const LOW_QUALITY_SOURCES = ["rediff.com", "u.today", "newsbtc.com", "zerohedge.com", "france24.com", "aljazeera.com"]

function keywordScore(article: NewsArticle): { score: number; topics: string[]; reasoning: string } {
  const text = `${article.title} ${article.snippet}`.toLowerCase()
  const matched: string[] = []
  let score = 0
  const reasons: string[] = []

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    for (const kw of keywords) {
      if (text.includes(kw.toLowerCase())) {
        matched.push(topic)
        const base = TOPIC_WEIGHTS[topic] ?? 5
        const bonus = kw.split(" ").length > 1 ? 3 : 0
        score += base + bonus
        reasons.push(`matched "${kw}" → ${topic}`)
        break
      }
    }
  }

  const ageHours = (Date.now() - new Date(article.publishedAt).getTime()) / 3600000
  const recencyBonus = Math.max(0, 10 - ageHours * 0.3)
  score += recencyBonus

  if (article.snippet && article.snippet.length > 100) score += 3
  if (article.imageUrl) score += 2
  if (article.source && LOW_QUALITY_SOURCES.includes(article.source)) score -= 10

  return {
    score: Math.round(score * 10) / 10,
    topics: [...new Set(matched)],
    reasoning: reasons.slice(0, 3).join("; ") || "no topic match",
  }
}

async function geminiScoreBatch(articles: NewsArticle[]): Promise<Map<string, { score: number; topics: string[]; reasoning: string }>> {
  const result = new Map<string, { score: number; topics: string[]; reasoning: string }>()
  if (!ai || !articles.length) return result

  const batchSize = 10
  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize)
    try {
      const prompt = `You are a markets terminal AI. Score only financial-market-relevant news (crypto, stocks, IPOs, commodities, earnings, M&A, macro, regulation). Score 0-100. Penalize generic politics, war, or entertainment news by scoring below 20. Prefer:
- Crypto/DeFi: 80-100
- IPOs/stock markets/earnings: 70-90  
- Commodities/macro: 60-80
- General business: 40-60
- Everything else (politics, war, gossip): 0-20

Return JSON array: [{"index":0,"score":45,"topics":["crypto-defi","markets"],"reasoning":"..."}]

Headlines:
${batch.map((a, j) => `[${j}] ${a.title} (${a.source})`).join("\n")}

Return ONLY valid JSON array.`

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-live-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { temperature: 0.2, responseMimeType: "application/json" },
      })

      const text = response.text
      if (!text) continue

      const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*$/gm, "").trim()
      const parsed = JSON.parse(cleaned)
      if (!Array.isArray(parsed)) continue

      for (const item of parsed) {
        if (typeof item.score !== "number") continue
        const idx = item.index
        if (idx < 0 || idx >= batch.length) continue
        result.set(batch[idx].url, {
          score: item.score,
          topics: Array.isArray(item.topics) ? item.topics : [],
          reasoning: item.reasoning || "gemini analyzed",
        })
      }
    } catch (err) {
      console.error("Gemini curation batch error:", err instanceof Error ? err.message : err)
    }
  }
  return result
}

export async function curateArticles(articles: NewsArticle[]): Promise<CuratedArticle[]> {
  if (!articles.length) return []

  articles = articles.filter(a => !a.source?.includes("cnbc"))
  if (!articles.length) return []

  const keywordResults = new Map<string, { score: number; topics: string[]; reasoning: string }>()
  for (const a of articles) {
    keywordResults.set(a.url, keywordScore(a))
  }

  const geminiResults = await geminiScoreBatch(articles)

  const curated: CuratedArticle[] = articles.map(a => {
    const kw = keywordResults.get(a.url) || { score: 0, topics: [], reasoning: "" }
    const gm = geminiResults.get(a.url)

    let finalScore: number
    let topics: string[]
    let reasoning: string

    const ageHours = (Date.now() - new Date(a.publishedAt).getTime()) / 3600000
    const recencyMult = Math.max(0.3, 1 - ageHours / 48)

    if (gm) {
      finalScore = Math.round((kw.score * 0.4 + gm.score * 0.6) * recencyMult * 10) / 10
      topics = [...new Set([...kw.topics, ...gm.topics])]
      reasoning = `AI: ${gm.reasoning} | Keywords: ${kw.reasoning}`
    } else {
      finalScore = Math.round(kw.score * recencyMult * 10) / 10
      topics = kw.topics
      reasoning = kw.reasoning
    }

    return {
      id: a.id,
      title: a.title,
      url: a.url,
      source: a.source,
      snippet: a.snippet,
      region: a.region,
      publishedAt: a.publishedAt,
      imageUrl: a.imageUrl,
      score: finalScore,
      topics,
      reasoning,
    }
  })

  curated.sort((a, b) => b.score - a.score)

  const seen = new Set<string>()
  const deduped: CuratedArticle[] = []
  for (const c of curated) {
    const key = c.title.toLowerCase().slice(0, 60)
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(c)
    if (deduped.length >= 60) break
  }

  return deduped
}
