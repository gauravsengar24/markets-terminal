import { useState, useMemo } from "react"
import { useParams, useNavigate, useOutletContext } from "react-router-dom"
import type { NewsArticle } from "@shared/types"
import { SectionHeading } from "../components/SectionHeading"
import { Pagination } from "../components/Pagination"

const PER_PAGE = 10

const SECTION_LABELS: Record<string, string> = {
  crypto: "Crypto News",
  stocks: "Global Stock Market News",
  commodities: "Commodity News",
  ipo: "IPO",
}

const SECTION_FILTERS: Record<string, (a: NewsArticle) => boolean> = {
  crypto: (a) => a.subCategory === "crypto" || a.assetClass === "crypto",
  stocks: (a) => a.subCategory === "stocks" && a.assetClass !== "crypto",
  commodities: (a) => a.subCategory === "commodities" || a.assetClass === "commodities" || a.assetClass === "oil",
  ipo: (a) => a.subCategory === "ipo",
}

const REGION_COLORS: Record<string, string> = {
  USA: "#60a5fa", Europe: "#22d3ee", China: "#f59e0b",
  Japan: "#f59e0b", India: "#22c55e", Korea: "#86868b", Australia: "#86868b",
}

export function SectionPage() {
  const { section } = useParams<{ section: string }>()
  const navigate = useNavigate()
  const { articles } = useOutletContext<{ articles: NewsArticle[] }>()
  const [page, setPage] = useState(1)

  const filter = SECTION_FILTERS[section ?? ""]
  const label = SECTION_LABELS[section ?? ""] ?? "News"

  const filtered = useMemo(() => {
    return filter ? articles.filter(filter) : []
  }, [articles, filter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const display = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0.5rem 0' }}>
      <div style={{ borderBottom: '1px solid var(--glass-border)' }}>
        <SectionHeading>{label}</SectionHeading>
        <div className="px-3 md:px-5 py-3 space-y-3">
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
                    <span className="mono" style={{ fontSize: '0.65rem', color: REGION_COLORS[a.region] ?? 'var(--text-muted)' }}>{a.region}</span>
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
      </div>
      <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
}
