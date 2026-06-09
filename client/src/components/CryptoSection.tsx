import type { NewsArticle } from "@shared/types"
import { NewsSection } from "./NewsSection"

interface Props {
  articles: NewsArticle[]
  maxArticles?: number
  viewAllLink?: string
}

export function CryptoSection({ articles, maxArticles, viewAllLink }: Props) {
  const cryptoArticles = articles.filter(
    a => a.subCategory === "crypto" || a.assetClass === "crypto"
  )
  return (
    <NewsSection
      title="Crypto News"
      articles={cryptoArticles}
      maxArticles={maxArticles}
      viewAllLink={viewAllLink}
    />
  )
}
