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

export function NewsSection({ title, articles, maxArticles, viewAllLink }: Props) {
  const navigate = useNavigate()
  const display = maxArticles ? articles.slice(0, maxArticles) : articles

  if (!display.length) return null

  return (
    <div className="mb-5">
      <SectionHeading count={articles.length}>{title}</SectionHeading>
      <div className="px-3 md:px-5 grid gap-2.5">
        {display.map((a, i) => (
          <button
            key={a.id}
            onClick={() => navigate(`/article/${a.id}`)}
            className="mac-card w-full text-left cursor-pointer"
          >
            <div className="mac-card-body">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="mac-source">{a.source}</span>
                <span className="mac-meta">{fmtRelative(a.publishedAt)}</span>
              </div>
              <div className="mac-title">{a.title}</div>
              {a.snippet && (
                <div className="mac-snippet">{a.snippet}</div>
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
