import { useOutletContext } from "react-router-dom"
import type { NewsArticle } from "@shared/types"
import { CryptoSection } from "../components/CryptoSection"
import { StockSection } from "../components/StockSection"
import { CommoditySection } from "../components/CommoditySection"
import { IPOSection } from "../components/IPOSection"

export function HomePage() {
  const { articles } = useOutletContext<{ articles: NewsArticle[] }>()

  if (!articles.length) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '50vh' }}>
        <div className="vibrant-glass-card" style={{ padding: '2rem', textAlign: 'center', maxWidth: '24rem' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No articles match the current filters.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0.5rem 0' }}>
      <CryptoSection articles={articles} maxArticles={5} viewAllLink="/crypto" />
      <StockSection articles={articles} maxArticles={5} viewAllLink="/stocks" />
      <CommoditySection articles={articles} maxArticles={5} viewAllLink="/commodities" />
      <IPOSection articles={articles} maxArticles={5} viewAllLink="/ipo" />
    </div>
  )
}
