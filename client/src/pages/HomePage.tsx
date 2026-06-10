import { useMemo } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import type { NewsArticle, LayoutContext } from "@shared/types"
import { CryptoSection } from "../components/CryptoSection"
import { StockSection } from "../components/StockSection"
import { CommoditySection } from "../components/CommoditySection"
import { IPOSection } from "../components/IPOSection"
import { SectionHeading } from "../components/SectionHeading"
import { ImpactAnalysis } from "../components/ImpactAnalysis"

const SIDEBAR_SECTIONS = [
  { label: "Crypto", link: "/crypto", color: "rgba(6, 182, 212, 0.6)" },
  { label: "Stocks", link: "/stocks", color: "rgba(47, 128, 237, 0.6)" },
  { label: "Commodities", link: "/commodities", color: "rgba(240, 180, 41, 0.6)" },
  { label: "IPO", link: "/ipo", color: "rgba(168, 85, 247, 0.6)" },
]

const VOLATILITY_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
}

const IMPACT_LABELS: Record<string, string> = {
  "central-bank": "Central Bank",
  geopolitical: "Geopolitical",
  crisis: "Crisis",
  pandemic: "Pandemic",
  trade: "Trade",
  election: "Election",
  currency: "Currency",
}

export function HomePage() {
  const navigate = useNavigate()
  const { articles, selectedImpact } = useOutletContext<LayoutContext>()

  const filtered = useMemo(() => {
    if (selectedImpact === "all") return articles
    return articles.filter(a => a.impactCategory === selectedImpact)
  }, [articles, selectedImpact])

  if (!articles.length) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '50vh' }}>
        <div className="mac-panel" style={{ padding: '2.5rem', textAlign: 'center', maxWidth: '24rem' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Loading markets...</p>
        </div>
      </div>
    )
  }

  const topArticles = filtered.slice(0, 3)

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0.5rem 0' }}>
      <div className="home-layout">
        <div className="home-left">
          <ImpactAnalysis />
        </div>
        <div className="home-main">
          <div className="mb-5">
            <div className="flex items-center gap-2 px-2 md:px-5 mb-2">
              <div className="mac-dot" style={{ background: 'rgba(6, 182, 212, 0.8)' }} />
              <h2 className="mac-section-title">
                {selectedImpact === "all" ? "Top Stories" : `${IMPACT_LABELS[selectedImpact] ?? "Top"} Stories`}
              </h2>
              <span className="mac-count-badge">{filtered.length}</span>
            </div>
            <div className="px-2 md:px-5 grid gap-2">
              {topArticles.map((a) => (
                <button
                  key={a.id}
                  onClick={() => navigate(`/article/${a.id}`)}
                  className="mac-card w-full text-left cursor-pointer"
                >
                  <div className="mac-card-body">
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
                      <span className="mac-meta">{fmtShort(a.publishedAt)}</span>
                    </div>
                    <div className="mac-title">{a.title}</div>
                    {a.snippet && (
                      <div className="mac-snippet">{a.snippet}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <CryptoSection articles={filtered} maxArticles={4} viewAllLink="/crypto" />
          <StockSection articles={filtered} maxArticles={4} viewAllLink="/stocks" />
          <CommoditySection articles={filtered} maxArticles={4} viewAllLink="/commodities" />
          <IPOSection articles={filtered} maxArticles={4} viewAllLink="/ipo" />
        </div>

        <div className="home-sidebar">
          <div className="mac-panel">
            <h3 className="mac-side-title">Sections</h3>
            <div className="flex flex-col gap-1">
              {SIDEBAR_SECTIONS.map((s) => (
                <button
                  key={s.link}
                  onClick={() => navigate(s.link)}
                  className="mac-side-link"
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.color, display: 'inline-block', flexShrink: 0 }} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mac-panel">
            <h3 className="mac-side-title">Sources</h3>
            <div className="flex flex-col gap-1">
              {[...new Set(filtered.map(a => a.source))].slice(0, 6).map(src => (
                <div key={src} className="mac-side-stat">
                  <span className="mac-side-stat-label">{src}</span>
                  <span className="mac-side-stat-count">{filtered.filter(a => a.source === src).length}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mac-panel">
            <h3 className="mac-side-title">Regions</h3>
            <div className="flex flex-col gap-1">
              {[...new Set(filtered.map(a => a.region))].slice(0, 5).map(region => (
                <div key={region} className="mac-side-stat">
                  <span className="mac-side-stat-label">{region}</span>
                  <span className="mac-side-stat-count">{filtered.filter(a => a.region === region).length}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function fmtShort(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
