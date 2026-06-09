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
      <SectionHeading count={filtered.length}>{label}</SectionHeading>
      <div className="px-3 md:px-5 grid gap-2.5 pb-1">
        {display.map((a) => (
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
      <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
