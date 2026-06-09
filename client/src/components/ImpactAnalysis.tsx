import { useQuery } from "@tanstack/react-query"

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

const SCORE_COLORS = [
  { max: 100, color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
  { max: 80, color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  { max: 60, color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
  { max: 0, color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
]

function scoreStyle(score: number) {
  const s = SCORE_COLORS.find(c => score >= (c.max - 20) || c.max === 100) ?? SCORE_COLORS[3]
  return { color: s.color, background: s.bg }
}

export function ImpactAnalysis() {
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
      <div className="mac-panel">
        <h3 className="mac-side-title">Market Impact Analysis</h3>
        <div style={{ height: "6rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "0.65rem", color: "var(--text-tertiary)" }}>Analyzing news data...</span>
        </div>
      </div>
    )
  }

  if (!data?.categories?.length) return null

  return (
    <div className="mac-panel">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <h3 className="mac-side-title" style={{ margin: 0 }}>Market Impact</h3>
        <span style={{ fontSize: "0.5rem", color: "var(--text-tertiary)", fontFamily: "'JetBrains Mono', monospace" }}>
          {data.totalArticles} articles
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
        {data.categories.map((cat) => (
          <div key={cat.id}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", minWidth: 0 }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: VOL_COLORS[cat.vol] ?? "#6b7280", flexShrink: 0 }} />
                <span style={{ fontSize: "0.68rem", fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {cat.label}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexShrink: 0 }}>
                <span style={{ fontSize: "0.48rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", padding: "0.08rem 0.3rem", borderRadius: "3px", background: `${VOL_COLORS[cat.vol]}15`, border: `1px solid ${VOL_COLORS[cat.vol]}30`, color: VOL_COLORS[cat.vol] }}>
                  {cat.short}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ flex: 1, height: "5px", borderRadius: "9999px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div style={{ width: `${cat.score}%`, height: "100%", borderRadius: "9999px", background: cat.score > 70 ? "linear-gradient(90deg, #f59e0b, #ef4444)" : cat.score > 40 ? "linear-gradient(90deg, #22c55e, #f59e0b)" : "linear-gradient(90deg, #6b7280, #22c55e)", transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)" }} />
              </div>
              <span style={{ fontSize: "0.6rem", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: cat.score > 70 ? "#ef4444" : cat.score > 40 ? "#f59e0b" : "#22c55e", width: "2.2rem", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                {cat.score}%
              </span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "0.6rem", paddingTop: "0.5rem", borderTop: "1px solid var(--glass-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.5rem", color: "var(--text-tertiary)" }}>
          Learning from {data.categories.reduce((s, c) => s + c.articleCount, 0)} tagged articles
        </span>
        <span style={{ fontSize: "0.5rem", color: "var(--text-tertiary)" }}>
          ⟳ auto
        </span>
      </div>
    </div>
  )
}
