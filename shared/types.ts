export interface NewsArticle {
  id: string
  title: string
  url: string
  source: string
  snippet: string
  region: string
  assetClass: string
  publishedAt: string
}

export interface Quote {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
}

export interface MarketSnapshot {
  quotes: Quote[]
  updatedAt: string
}

export interface ArticleSummary {
  url: string
  title: string
  summary: string
}
