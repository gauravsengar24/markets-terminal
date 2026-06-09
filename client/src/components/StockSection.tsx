import type { NewsArticle } from "@shared/types"
import { NewsSection } from "./NewsSection"

interface Props {
  articles: NewsArticle[]
  maxArticles?: number
  viewAllLink?: string
}

export function StockSection({ articles, maxArticles, viewAllLink }: Props) {
  const stockArticles = articles.filter(
    a => a.subCategory === "stocks" && a.assetClass !== "crypto"
  )
  return (
    <NewsSection
      title="Global Stock Market News"
      articles={stockArticles}
      maxArticles={maxArticles}
      viewAllLink={viewAllLink}
    />
  )
}
