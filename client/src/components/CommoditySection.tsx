import type { NewsArticle } from "@shared/types"
import { NewsSection } from "./NewsSection"

interface Props {
  articles: NewsArticle[]
  maxArticles?: number
  viewAllLink?: string
}

export function CommoditySection({ articles, maxArticles, viewAllLink }: Props) {
  const commodityArticles = articles.filter(
    a => a.subCategory === "commodities" || a.assetClass === "commodities" || a.assetClass === "oil"
  )
  return (
    <NewsSection
      title="Commodity News"
      articles={commodityArticles}
      maxArticles={maxArticles}
      viewAllLink={viewAllLink}
    />
  )
}
