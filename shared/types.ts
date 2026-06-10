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
  impactCategory?: string
  volatility?: string
}

export interface LayoutContext {
  articles: NewsArticle[]
  selectedImpact: string
  setSelectedImpact: (cat: string) => void
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
  bullets: string[]
}

export interface LearningPreferences {
  totalFeedback: number
  totalUp: number
  totalDown: number
  preferredStyle: "bullet"
  topSources: string[]
  topCategories: string[]
}

export interface ArticleSummary {
  url: string
  title: string
  summary: string
}

export interface FeedbackPayload {
  url: string
  articleTitle?: string
  source?: string
  region?: string
  category?: string
  volatility?: string
  rating: 1 | -1
}
