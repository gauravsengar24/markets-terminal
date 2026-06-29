import { useState, useMemo } from "react"
import { useParams, useNavigate, useOutletContext } from "react-router-dom"
import type { NewsArticle, LayoutContext } from "@shared/types"
import { Pagination } from "../components/Pagination"
import { decodeEntities } from "../lib/format"

const PER_PAGE = 12

const SECTION_LABELS: Record<string, string> = {
  crypto: "Crypto News",
  stocks: "Stock Market News",
  commodities: "Commodity News",
  "market-updates": "Market Updates",
  finance: "Finance",
  learn: "Learn",
  research: "Research",
  podcast: "Podcast",
  news: "All News",
}

const SECTION_FILTERS: Record<string, (a: NewsArticle) => boolean> = {
  crypto: (a) => a.subCategory === "crypto" || a.assetClass === "crypto",
  stocks: (a) => a.subCategory === "stocks" && a.assetClass !== "crypto",
  commodities: (a) => a.subCategory === "commodities" || a.assetClass === "commodities" || a.assetClass === "oil",
}

export function SectionPage() {
  const { section } = useParams<{ section: string }>()
  const navigate = useNavigate()
  const { articles } = useOutletContext<LayoutContext>()
  const [page, setPage] = useState(1)

  const filter = SECTION_FILTERS[section ?? ""]
  const label = SECTION_LABELS[section ?? ""] ?? "All News"

  const THREE_DAYS = 72 * 60 * 60 * 1000
  const filtered = useMemo(() => {
    let result = filter ? articles.filter(filter) : articles
    result = result.filter(a => Date.now() - new Date(a.publishedAt).getTime() < THREE_DAYS)
    return result
  }, [articles, filter])

  const sorted = [...filtered].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const display = sorted.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const handleClick = (url: string) => {
    const found = articles.find(a => a.url === url)
    if (found) navigate(`/article/${found.id}`)
    else window.open(url, "_blank", "noopener")
  }

  return (
    <div className="container-main" style={{ paddingTop: "1.5rem", paddingBottom: "2rem" }}>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="page-title">{label}</h1>
        <span className="article-card-meta">({filtered.length})</span>
      </div>

      <div className="article-grid-3">
        {display.map((a) => (
          <button key={a.id} onClick={() => handleClick(a.url)} className="article-card">
            <div className="article-card-img">
              {a.imageUrl ? (
                <img src={a.imageUrl.replace(/&amp;/g, "&")} alt="" className="article-card-img-inner" loading="lazy" />
              ) : (
                <div style={{ width: "100%", height: "100%", background: "var(--color-shades-extra-light)" }} />
              )}
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="article-card-category">{a.source}</span>
              <span className="article-card-meta" style={{ margin: 0 }}>{fmtRelative(a.publishedAt)}</span>
            </div>
            <h3 className="article-card-title">{decodeEntities(a.title)}</h3>
            {a.snippet && (
              <p style={{ fontSize: "0.85rem", lineHeight: "1.5", color: "var(--color-text-secondary)", marginTop: "0.35rem" }}>
                {decodeEntities(a.snippet)}
              </p>
            )}
          </button>
        ))}
      </div>

      <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return "Just now"
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
