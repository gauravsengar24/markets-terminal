import FirecrawlApp from "firecrawl"

let client: FirecrawlApp | null = null

export function getClient(): FirecrawlApp {
  if (client) return client
  const key = process.env.FIRECRAWL_API_KEY
  if (!key) throw new Error("FIRECRAWL_API_KEY not set")
  client = new FirecrawlApp({ apiKey: key })
  return client
}
