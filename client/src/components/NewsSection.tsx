import type { NewsArticle } from "@shared/types"
import { useNavigate } from "react-router-dom"
import { SectionHeading } from "./SectionHeading"

function cleanImgUrl(url: string | undefined): string | undefined {
  if (!url) return undefined
  return url.replace(/&amp;/g, "&")
}

interface Props {
  title: string
  articles: NewsArticle[]
  selectedUrl?: string | null
  onSelect?: (url: string | null) => void
  maxArticles?: number
  viewAllLink?: string
}

const FALLBACK_COLORS: Record<string, string> = {
  crypto: "#f7931a",
  stocks: "#22c55e",
  commodities: "#f59e0b",
  ipo: "#a855f7",
  oil: "#f59e0b",
}

function fallbackIcon(assetClass: string) {
  switch (assetClass) {
    case "crypto": return "⟠"
    case "commodities":
    case "oil": return "◇"
    case "ipo": return "◆"
    default: return "▤"
  }
}

export function NewsSection({ title, articles, maxArticles, viewAllLink }: Props) {
  const navigate = useNavigate()
  const display = maxArticles ? articles.slice(0, maxArticles) : articles

  if (!display.length) return null

  return (
    <div className="mb-4 md:mb-5 mac-section">
      <SectionHeading count={articles.length}>{title}</SectionHeading>
      <div className="px-2 md:px-5 grid gap-1.5 md:gap-2.5">
        {display.map((a, i) => (
          <button
            key={a.id}
            onClick={() => navigate(`/article/${a.id}`)}
            className="news-card w-full text-left cursor-pointer"
          >
            <div className="news-card-img-wrap" style={{ width: 72, minWidth: 72, height: 72 }}>
              {cleanImgUrl(a.imageUrl) ? (
                <img src={cleanImgUrl(a.imageUrl)} alt="" className="news-card-img" loading="lazy" />
              ) : (
                <div className="news-card-fallback" style={{ background: FALLBACK_COLORS[a.assetClass] ?? "#64748b" }}>
                  <span className="news-card-fallback-icon">{fallbackIcon(a.assetClass)}</span>
                </div>
              )}
            </div>
            <div className="news-card-body">
              <div className="flex items-center gap-2 mb-1">
                <span className="mac-source">{a.source}</span>
                <span className="mac-meta">{fmtRelative(a.publishedAt)}</span>
              </div>
              <div className="news-card-title">{a.title}</div>
              {a.snippet && (
                <div className="news-card-snippet">{a.snippet}</div>
              )}
            </div>
          </button>
        ))}
      </div>
      {viewAllLink && articles.length > (maxArticles ?? Infinity) && (
        <div className="px-3 md:px-5 mt-2.5">
          <button
            onClick={() => navigate(viewAllLink)}
            className="mac-view-all"
          >
            View all in {title.toLowerCase()}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft: '0.35rem' }}>
              <path d="M3.5 1.5L7 5L3.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
