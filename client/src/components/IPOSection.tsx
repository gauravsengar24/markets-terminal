import type { NewsArticle } from "@shared/types"
import { NewsSection } from "./NewsSection"

interface Props {
  articles: NewsArticle[]
  maxArticles?: number
  viewAllLink?: string
}

export function IPOSection({ articles, maxArticles, viewAllLink }: Props) {
  const ipoArticles = articles.filter(a => a.subCategory === "ipo")
  if (!ipoArticles.length) return null

  return (
    <div className="mb-5">
      <div className="flex items-center gap-3 px-3 md:px-5 py-1.5">
        <span className="mac-chip" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--color-positive)', borderColor: 'rgba(34, 197, 94, 0.2)' }}>
          Stock IPO
        </span>
        <span style={{ color: 'var(--glass-border)', fontSize: '0.6rem' }}>/</span>
        <span className="mac-chip" style={{ background: 'rgba(168, 85, 247, 0.1)', color: 'rgba(168, 85, 247, 0.9)', borderColor: 'rgba(168, 85, 247, 0.2)' }}>
          Crypto ICO
        </span>
      </div>
      <NewsSection
        title="IPO"
        articles={ipoArticles}
        maxArticles={maxArticles}
        viewAllLink={viewAllLink}
      />
    </div>
  )
}
