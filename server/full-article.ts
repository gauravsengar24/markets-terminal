import { GoogleGenAI } from "@google/genai"
import type { NewsArticle, FullArticleResponse, ArticleCrossReference } from "../shared/types.js"
import { cleanJsonResponse } from "./util.js"
import { get } from "./cache.js"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ""

let ai: GoogleGenAI | null = null
if (GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
}

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ").replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
}

function cleanArticleContent(raw: string): string {
  let text = raw
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
  text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
  text = text.replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "")
  text = text.replace(/<[^>]+>/g, "")
  text = text.replace(/https?:\/\/\S+/g, "")
  text = text.replace(/&#?\w+;/g, (m) => {
    const entities: Record<string, string> = {
      "&#x27;": "'", "&#39;": "'", "&apos;": "'", "&amp;": "&", "&quot;": '"',
      "&lt;": "<", "&gt;": ">", "&nbsp;": " ", "&#8217;": "'", "&#8216;": "'",
      "&#8220;": '"', "&#8221;": '"', "&#8211;": "-", "&#8212;": "-",
      "&ndash;": "-", "&mdash;": "-", "&hellip;": "...", "&rsquo;": "'", "&lsquo;": "'",
      "&ldquo;": '"', "&rdquo;": '"', "&bull;": " * ", "&middot;": " * ",
    }
    return entities[m.toLowerCase()] || m
  })
  text = text.replace(/\s{2,}/g, " ").trim()
  return text.slice(0, 8000)
}

async function fetchWithTimeout(url: string, init: RequestInit & { timeout?: number } = {}): Promise<Response> {
  const { timeout = 10000, ...fetchInit } = init
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), timeout)
  try {
    return await fetch(url, { ...fetchInit, signal: controller.signal })
  } finally {
    clearTimeout(t)
  }
}

function computeTopicSignature(title: string, snippet: string): string {
  const words = (title + " " + snippet).toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 3 && !["this","that","with","from","have","been","were","will","would","could","should","about","their","there","which","after","before","other","still","more","than","also","very","just","what","when","where","then","each","much","many","some","such","only","into","over","between","under","while","since","until","upon","within","without","across","through","during","before","after","above","below","again","further","once","here","there","why","how","all","both","each","few","more","most","other","some","such","no","nor","not","only","own","same","so","than","too","very","just","because","as","until","while","of","at","by","for","with","about","against","between","into","through","during","before","after","above","below","from","up","down","in","out","on","off","over","under","again","further","then","once","here","there","when","where","why","how","all","both","each","few","more","most","other","some","such","no","nor","not","only","own","same","so","than","too","very","just","because","as","until","while"].includes(w))
    .filter(w => w.length > 3)
  const unique = [...new Set(words)].slice(0, 8)
  return unique.sort().join(" ")
}

function computeSimilarity(sig1: string, sig2: string): number {
  if (!sig1 || !sig2) return 0
  const s1 = sig1.split(" ").filter(Boolean)
  const s2 = sig2.split(" ").filter(Boolean)
  if (!s1.length || !s2.length) return 0
  const intersection = s1.filter(w => s2.includes(w)).length
  const union = new Set([...s1, ...s2]).size
  return intersection / (union || 1)
}

async function findCrossReferences(
  title: string,
  snippet: string,
  sourceUrl: string,
  sourceName: string
): Promise<ArticleCrossReference[]> {
  try {
    const allNews = await get<NewsArticle[]>("news:merged")
    if (!allNews || !allNews.length) return []

    const targetSig = computeTopicSignature(title, snippet)
    const scored = allNews
      .filter(a => a.url !== sourceUrl && a.title && a.snippet)
      .map(a => ({
        article: a,
        similarity: computeSimilarity(targetSig, computeTopicSignature(a.title, a.snippet)),
      }))
      .filter(s => s.similarity > 0.25)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 4)

    return scored.map(s => ({
      source: s.article.source,
      url: s.article.url,
      title: s.article.title,
      snippet: s.article.snippet.slice(0, 200),
      similarity: Math.round(s.similarity * 100),
    }))
  } catch {
    return []
  }
}

async function fetchFullContent(url: string, snippet: string): Promise<{ title: string; content: string }> {
  let title = ""
  let rawContent = ""
  const jinaKey = process.env.JINA_API_KEY
  let fallbackSnippet = snippet || ""

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
        timeout: 20000,
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
        },
      })
      if (resp.ok) {
        const html = await resp.text()
        const tMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
        if (tMatch && !title) title = tMatch[1].trim().slice(0, 200)
        for (const sel of [
          /<article[^>]*>([\s\S]*?)<\/article>/i,
          /<div[^>]*class=["'][^"']*article-body[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
          /<div[^>]*class=["'][^"']*story-body[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
          /<div[^>]*class=["'][^"']*post-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
          /<div[^>]*class=["'][^"']*entry-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
          /<div[^>]*class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
          /<main[^>]*>([\s\S]*?)<\/main>/i,
        ]) {
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

  return { title, content }
}

async function generateVerifiedArticle(
  url: string,
  title: string,
  content: string,
  crossRefs: ArticleCrossReference[]
): Promise<FullArticleResponse | null> {
  if (!ai) return null

  const crossRefSection = crossRefs.length > 0
    ? `\n\nCross-referenced from other sources:\n${crossRefs.map(r =>
        `- ${r.source}: "${r.title}" (similarity: ${r.similarity}%)\n  Key excerpt: ${r.snippet}`
      ).join("\n")}`
    : ""

  try {
    const prompt = `You are a financial research analyst. Analyze this news article and return a JSON object with verified data.

Article Title: "${title}"
${content.slice(0, 6000)}${crossRefSection}

Return ONLY valid JSON (no markdown, no backticks):
{
  "summary": "2-3 sentence comprehensive summary covering the key event and its significance",
  "fullContent": "The complete article rewritten as well-structured readable prose with multiple paragraphs. Include ALL important details, numbers, quotes, and context. Write 300-800 words covering: what happened, who was involved, key numbers/stats, timeline, and significance.",
  "keyDataPoints": [
    {
      "fact": "Specific fact or data point",
      "source": "Where this fact comes from (article source)",
      "confidence": "high/medium/low based on verification across sources"
    }
  ],
  "crossReferences": [
    {
      "source": "Name of the cross-referenced source",
      "url": "URL of the related article",
      "keyPoints": ["Bullet points of additional context or confirming data from this source"]
    }
  ],
  "verificationNotes": "Analysis of data consistency across sources. Note any discrepancies, confirmations, or unique angles found when cross-referencing."
}

RULES:
- fullContent must be comprehensive (300-800 words), not a summary
- Extract every important number, percentage, dollar amount
- If the same event is covered by multiple sources, note the agreement or differences
- keyDataPoints should extract 3-6 specific factual claims with verification
- crossReferences should reference the articles provided and explain what they add
- verificationNotes should analyze data consistency across all sources`

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-live-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }],
      },
    })

    const text = response.text
    if (!text) return null

    const cleaned = cleanJsonResponse(text)
    const parsed = JSON.parse(cleaned)

    return {
      url,
      title: parsed.title || title,
      source: new URL(url).hostname.replace("www.", ""),
      publishedAt: new Date().toISOString(),
      summary: parsed.summary || "",
      fullContent: parsed.fullContent || content.slice(0, 2000),
      keyDataPoints: Array.isArray(parsed.keyDataPoints) ? parsed.keyDataPoints.slice(0, 8) : [],
      crossReferences: Array.isArray(parsed.crossReferences) ? parsed.crossReferences : crossRefs.map(r => ({ source: r.source, url: r.url, keyPoints: [r.snippet] })),
      verificationNotes: parsed.verificationNotes || "",
    }
  } catch (err) {
    console.error("Verified article generation error:", err instanceof Error ? err.message : err)
    return null
  }
}

function buildFallbackArticle(
  url: string,
  title: string,
  content: string,
  snippet: string,
  crossRefs: ArticleCrossReference[]
): FullArticleResponse {
  const bodies = content.split("\n").filter(p => p.trim().length > 40)
  const displayContent = bodies.length > 1
    ? bodies.join("\n\n")
    : (snippet && snippet.length > 60 ? snippet : (content || title))

  return {
    url,
    title,
    source: new URL(url).hostname.replace("www.", ""),
    publishedAt: new Date().toISOString(),
    summary: "",
    fullContent: displayContent,
    keyDataPoints: [],
    crossReferences: crossRefs.map(r => ({
      source: r.source,
      url: r.url,
      keyPoints: [r.snippet],
    })),
    verificationNotes: "",
  }
}

export async function getFullArticle(url: string, snippet?: string): Promise<FullArticleResponse> {
  const { title, content } = await fetchFullContent(url, snippet || "")
  const crossRefs = await findCrossReferences(title, content || snippet || "", url, new URL(url).hostname.replace("www.", ""))

  let article: FullArticleResponse | null = null
  if (ai && content) {
    article = await generateVerifiedArticle(url, title, content, crossRefs)
  }
  if (!article) {
    article = buildFallbackArticle(url, title, content, snippet || "", crossRefs)
  }

  return article
}
