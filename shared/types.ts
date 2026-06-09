export interface NewsArticle {
  id: string
  title: string
  url: string
  source: string
  snippet: string
  region: string
  assetClass: string
  subCategory: string
  publishedAt: string
}

export interface BreakingNews {
  region: string
  articles: NewsArticle[]
}

export interface MarketPrice {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  assetType: "crypto" | "commodity" | "stock"
}

export interface NewsBriefing {
  url: string
  title: string
  whatHappened: string
  marketContext: string
  keyTakeaways: string[]
}

export interface ArticleSummary {
  url: string
  title: string
  summary: string
}
