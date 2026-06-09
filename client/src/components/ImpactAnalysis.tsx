import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { IMPACT_REASONING } from "@shared/impact-reasoning"

const BASE = "/api"

async function fetchImpactAnalysis() {
  const res = await fetch(`${BASE}/impact-analysis`)
  if (!res.ok) throw new Error("Failed to fetch impact analysis")
  return res.json()
}

const VOL_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
}

function barGradient(score: number) {
  if (score > 70) return "linear-gradient(90deg, #f97316, #ef4444)"
  if (score > 40) return "linear-gradient(90deg, #22c55e, #f59e0b)"
  return "linear-gradient(90deg, #6b7280, #22c55e)"
}

function scoreColor(score: number) {
  if (score > 70) return "#ef4444"
  if (score > 40) return "#f59e0b"
  return "#22c55e"
}

export function ImpactAnalysis() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ["impact-analysis"],
    queryFn: fetchImpactAnalysis,
    staleTime: 300_000,
    refetchInterval: 300_000,
  })

  const data = query.data as {
    categories: Array<{ id: string; label: string; short: string; vol: string; articleCount: number; score: number }>
    totalArticles: number
  } | null

  if (query.isLoading) {
    return (
      <div className="impact-left-panel">
        <div className="impact-left-glow" />
        <div className="impact-left-header">
          <div className="impact-left-title-row">
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(239,68,68,0.6)", boxShadow: "0 0 8px rgba(239,68,68,0.3)" }} />
            <h3 className="impact-left-title">Market Impact</h3>
          </div>
        </div>
        <div className="impact-left-loading">
          <div className="impact-left-shimmer" />
        </div>
      </div>
    )
  }

  if (!data?.categories?.length) return null

  const totalTagged = data.categories.reduce((s, c) => s + c.articleCount, 0)

  function toggleRow(id: string) {
    setExpandedId(prev => prev === id ? null : id)
  }

  return (
    <div className="impact-left-panel">
      <div className="impact-left-glow" />
      <div className="impact-left-header">
        <div className="impact-left-title-row">
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(239,68,68,0.6)", boxShadow: "0 0 8px rgba(239,68,68,0.3)" }} />
          <h3 className="impact-left-title">Market Impact</h3>
          <span className="impact-left-badge">{data.totalArticles}</span>
        </div>
        <span className="impact-left-subtitle">Tap a category to see reasoning</span>
      </div>

      <div className="impact-left-list">
        {data.categories.map((cat, i) => {
          const volColor = VOL_COLORS[cat.vol] ?? "#6b7280"
          const isOpen = expandedId === cat.id
          const reasoning = IMPACT_REASONING[cat.id]

          return (
            <div key={cat.id} className="impact-left-row" style={{ "--idx": i } as React.CSSProperties}>
              <button
                className="impact-left-row-btn"
                onClick={() => toggleRow(cat.id)}
                aria-expanded={isOpen}
              >
                <div className="impact-left-row-inner">
                  <div className="impact-left-row-top">
                    <div className="impact-left-row-label">
                      <span className="impact-left-dot" style={{ background: volColor, boxShadow: `0 0 6px ${volColor}60` }} />
                      <span className="impact-left-cat-name">{cat.label}</span>
                    </div>
                    <div className="impact-left-right">
                      <span className="impact-left-tag" style={{ color: volColor, borderColor: `${volColor}40` }}>
                        {cat.short}
                      </span>
                      <span className={`impact-left-chevron ${isOpen ? "open" : ""}`}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M3 3.5L5 6L7 3.5" />
                        </svg>
                      </span>
                    </div>
                  </div>
                  <div className="impact-left-bar-track">
                    <div
                      className="impact-left-bar-fill"
                      style={{
                        width: `${cat.score}%`,
                        background: barGradient(cat.score),
                        "--delay": `${i * 0.06}s`,
                      } as React.CSSProperties}
                    />
                  </div>
                  <div className="impact-left-row-bottom">
                    <span className="impact-left-articles">{cat.articleCount} articles</span>
                    <span className="impact-left-score" style={{ color: scoreColor(cat.score) }}>
                      {cat.score}%
                    </span>
                  </div>
                </div>
              </button>

              <div className={`impact-left-dropdown ${isOpen ? "open" : ""}`}>
                {reasoning ? (
                  <ul className="impact-left-reasoning-list">
                    {reasoning.map((r, ri) => (
                      <li key={ri} className="impact-left-reasoning-item" style={{"--ri": ri} as React.CSSProperties}>{r}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="impact-left-reasoning-empty">No reasoning data available.</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="impact-left-footer">
        <span>Auto-refreshes every 5 min</span>
        <span>⟳ live</span>
      </div>
    </div>
  )
}
