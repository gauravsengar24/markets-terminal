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
    <div>
      <div className="flex items-center gap-3 px-3 md:px-5 py-1.5" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)' }}>
        <span style={{ fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-positive)' }}>Stock IPO</span>
        <span style={{ color: 'var(--glass-border)' }}>|</span>
        <span style={{ fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(168, 85, 247, 0.9)' }}>Crypto ICO</span>
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
