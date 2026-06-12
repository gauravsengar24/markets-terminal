import { useState, useMemo } from "react"
import { useParams, useNavigate, useOutletContext } from "react-router-dom"
import type { NewsArticle, LayoutContext } from "@shared/types"
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

const VOLATILITY_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
}

const FALLBACK_COLORS: Record<string, string> = {
  crypto: "#f7931a", stocks: "#22c55e", commodities: "#f59e0b", ipo: "#a855f7", oil: "#f59e0b",
}

function fallbackIcon(assetClass: string) {
  switch (assetClass) {
    case "crypto": return "⟠"
    case "commodities": case "oil": return "◇"
    case "ipo": return "◆"
    default: return "▤"
  }
}

export function SectionPage() {
  const { section } = useParams<{ section: string }>()
  const navigate = useNavigate()
  const { articles, selectedImpact } = useOutletContext<LayoutContext>()
  const [page, setPage] = useState(1)

  const filter = SECTION_FILTERS[section ?? ""]
  const label = SECTION_LABELS[section ?? ""] ?? "News"

  const THREE_DAYS = 72 * 60 * 60 * 1000
  const filtered = useMemo(() => {
    let result = filter ? articles.filter(filter) : []
    result = result.filter(a => Date.now() - new Date(a.publishedAt).getTime() < THREE_DAYS)
    if (selectedImpact !== "all") {
      result = result.filter(a => a.impactCategory === selectedImpact)
    }
    return result
  }, [articles, filter, selectedImpact])

  const sorted = [...filtered].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const display = sorted.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0.5rem 0' }}>
      <SectionHeading count={filtered.length}>{label}</SectionHeading>
      <div className="px-3 md:px-5 grid gap-2.5 pb-1">
        {display.map((a) => (
          <button
            key={a.id}
            onClick={() => navigate(`/article/${a.id}`)}
            className="mac-card w-full text-left cursor-pointer"
            style={{ display: "flex", alignItems: "stretch" }}
          >
            <div style={{ width: 72, minWidth: 72, height: 72, borderRadius: 8, overflow: "hidden", flexShrink: 0, position: "relative", margin: "0.65rem 0 0.65rem 0.75rem" }}>
              {a.imageUrl ? (
                <img src={a.imageUrl.replace(/&amp;/g, "&")} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} loading="lazy" />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: FALLBACK_COLORS[a.assetClass] ?? "#64748b" }}>
                  <span style={{ fontSize: 18, opacity: 0.6, color: "rgba(255,255,255,0.8)" }}>{fallbackIcon(a.assetClass)}</span>
                </div>
              )}
            </div>
            <div className="mac-card-body" style={{ flex: 1, minWidth: 0, padding: "0.65rem 0.75rem" }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="mac-source">{a.source}</span>
                {a.volatility && (
                  <span
                    style={{
                      fontSize: "0.5rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      padding: "0.1rem 0.35rem",
                      borderRadius: "4px",
                      background: `${VOLATILITY_COLORS[a.volatility]}15`,
                      border: `1px solid ${VOLATILITY_COLORS[a.volatility]}30`,
                      color: VOLATILITY_COLORS[a.volatility],
                      letterSpacing: "0.06em",
                    }}
                  >
                    {a.volatility}
                  </span>
                )}
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
