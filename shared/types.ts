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
  imageUrl?: string
}

export interface LayoutContext {
  articles: NewsArticle[]
  selectedImpact: string
  setSelectedImpact: (cat: string) => void
  scrollProgress?: number
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
  assetType: "crypto" | "commodity" | "stock" | "index" | "forex"
}

export interface MarketSnapshotResponse {
  commodities: MarketPrice[]
  crypto: MarketPrice[]
  usIndices: MarketPrice[]
  europeIndices: MarketPrice[]
  indiaIndices: MarketPrice[]
  ausIndices: MarketPrice[]
  asiaIndices: MarketPrice[]
  forex: MarketPrice[]
  usGainers: MarketPrice[]
  usLosers: MarketPrice[]
  niftyGainers: MarketPrice[]
  niftyLosers: MarketPrice[]
}

export interface CuratedArticle {
  id: string
  title: string
  url: string
  source: string
  snippet: string
  region: string
  publishedAt: string
  imageUrl?: string
  score: number
  topics: string[]
  reasoning: string
}

export interface CuratedBreakingNews {
  articles: CuratedArticle[]
  generatedAt: string
  totalAnalyzed: number
}

export interface NewsBriefing {
  url: string
  title: string
  bullets: string[]
}

export interface DataPoint {
  fact: string
  source: string
  confidence: "high" | "medium" | "low"
}

export interface ArticleCrossReference {
  source: string
  url: string
  title: string
  snippet: string
  similarity: number
}

export interface CrossReferenceEntry {
  source: string
  url: string
  keyPoints: string[]
}

export interface FullArticleResponse {
  url: string
  title: string
  source: string
  publishedAt: string
  summary: string
  fullContent: string
  keyDataPoints: DataPoint[]
  crossReferences: CrossReferenceEntry[]
  verificationNotes: string
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
