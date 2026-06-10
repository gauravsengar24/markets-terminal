import { GoogleGenAI } from "@google/genai"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ""

let ai: GoogleGenAI | null = null
if (GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
}

export interface GeminiBriefing {
  whatHappened: string[]
  marketContext: string[]
  keyTakeaways: string[]
}

export async function generateBriefing(title: string, snippet: string, url: string): Promise<GeminiBriefing | null> {
  if (!ai) return null

  try {
    const prompt = `You are NeuraBrain, a market intelligence AI. Analyze this news and return a JSON object with exactly three arrays:

News: "${title}"
Details: ${snippet.slice(0, 2000)}

Return ONLY valid JSON (no markdown, no backticks):
{
  "whatHappened": ["2-3 concise factual bullet points about what happened"],
  "marketContext": ["1-2 bullet points about the market/economic context"],
  "keyTakeaways": ["1-3 bullet points about implications and what to watch"]
}

Each bullet must be 10-30 words, specific to this news, and include relevant numbers/percentages.`

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-live-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.3,
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }],
      },
    })

    const text = response.text
    if (!text) return null

    const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*$/gm, "").trim()
    const parsed = JSON.parse(cleaned)

    return {
      whatHappened: Array.isArray(parsed.whatHappened) ? parsed.whatHappened.slice(0, 3) : [],
      marketContext: Array.isArray(parsed.marketContext) ? parsed.marketContext.slice(0, 2) : [],
      keyTakeaways: Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways.slice(0, 3) : [],
    }
  } catch (err) {
    console.error("Gemini briefing error:", err instanceof Error ? err.message : err)
    return null
  }
}
