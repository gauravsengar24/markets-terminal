import type { NewsArticle } from "@shared/types"
import { useNavigate } from "react-router-dom"
import { SectionHeading } from "./SectionHeading"

interface Props {
  title: string
  articles: NewsArticle[]
  selectedUrl?: string | null
  onSelect?: (url: string | null) => void
  maxArticles?: number
  viewAllLink?: string
}

const regionColors: Record<string, string> = {
  USA: "#60a5fa", Europe: "#22d3ee", China: "#f59e0b",
  Japan: "#f59e0b", India: "#22c55e", Korea: "#86868b", Australia: "#86868b",
}

export function NewsSection({ title, articles, maxArticles, viewAllLink }: Props) {
  const navigate = useNavigate()
  const display = maxArticles ? articles.slice(0, maxArticles) : articles

  if (!display.length) return null

  return (
    <div style={{ borderBottom: '1px solid var(--glass-border)' }}>
      <SectionHeading>{title}</SectionHeading>
      <div className="px-3 md:px-5 py-3 md:py-4 space-y-3">
        {display.map((a) => (
          <button
            key={a.id}
            onClick={() => navigate(`/article/${a.id}`)}
            className="vibrant-glass-card w-full text-left cursor-pointer"
            style={{ padding: '0.75rem 1rem' }}
          >
            <div className="flex items-start gap-2">
              <span className="card-source" style={{ minWidth: '4rem' }}>{a.source}</span>
              <div className="flex-1 min-w-0">
                <div className="article-title">{a.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="mono" style={{ fontSize: '0.65rem', color: regionColors[a.region] ?? 'var(--text-muted)' }}>{a.region}</span>
                  <span className="mono" style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{fmtTime(a.publishedAt)}</span>
                </div>
                {a.snippet && (
                  <div className="article-snippet mt-1 line-clamp-2">{a.snippet}</div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
      {viewAllLink && articles.length > (maxArticles ?? Infinity) && (
        <div className="px-3 md:px-5 pb-4">
          <button onClick={() => navigate(viewAllLink)} className="action-link text-xs">
            View all {articles.length} articles →
          </button>
        </div>
      )}
    </div>
  )
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
}
