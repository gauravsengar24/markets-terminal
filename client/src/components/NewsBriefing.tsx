import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { fetchBriefing, submitFeedback } from "../lib/api"

interface Props {
  url: string | null
  fullPage?: boolean
  articleTitle?: string
  source?: string
  region?: string
  impactCategory?: string
  volatility?: string
}

export function NewsBriefing({ url, fullPage, articleTitle, source, region, impactCategory, volatility }: Props) {
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const query = useQuery({
    queryKey: ["briefing", url],
    queryFn: () => fetchBriefing(url!),
    enabled: !!url,
    staleTime: 600_000,
  })

  const wrapper = fullPage ? "max-w-3xl mx-auto" : ""

  async function handleFeedback(rating: 1 | -1) {
    if (!url || submitting || feedback) return
    setSubmitting(true)
    try {
      await submitFeedback({
        url,
        rating,
        articleTitle: articleTitle || query.data?.title,
        source,
        region,
        category: impactCategory,
        volatility,
      })
      setFeedback(rating === 1 ? "up" : "down")
    } catch {} finally {
      setSubmitting(false)
    }
  }

  if (!url) {
    return (
      <div className={`p-4 md:p-5 ${wrapper}`}>
        <div className="mac-panel" style={{ textAlign: "center" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--electric-blue)", marginBottom: "0.75rem" }}>News Briefing</h3>
          <p style={{ fontSize: "1.1rem", color: "var(--text-secondary)" }}>Select a headline to view a comprehensive briefing.</p>
        </div>
      </div>
    )
  }

  if (query.isLoading) {
    return (
      <div className={`p-4 md:p-5 ${wrapper}`}>
        <div className="mac-panel">
          <div className="animate-pulse space-y-3">
            <div style={{ height: "0.75rem", background: "var(--glass-border)", borderRadius: "4px", width: "60%" }} />
            <div style={{ height: "0.5rem", background: "var(--glass-border)", borderRadius: "4px", width: "100%" }} />
            <div style={{ height: "0.5rem", background: "var(--glass-border)", borderRadius: "4px", width: "80%" }} />
          </div>
        </div>
      </div>
    )
  }

  if (query.data) {
    const d = query.data
    return (
      <div className={`p-4 md:p-5 ${wrapper}`}>
        <div className="mac-panel" style={{ padding: fullPage ? "1.75rem" : "1.25rem" }}>
          <div className="space-y-4">
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--electric-blue)", marginBottom: "0.5rem" }}>News Briefing</h3>
              <h4 className="article-title" style={{ fontWeight: 600 }}>{d.title}</h4>
            </div>

            <div>
                <h5 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--color-accent)", marginBottom: "0.35rem" }}>What Happened</h5>
                <ul style={{ paddingLeft: "1.2rem" }}>
                  {d.whatHappened.map((t: string, i: number) => (
                    <li key={i} style={{ fontSize: "1.05rem", lineHeight: 1.6, color: "var(--text-secondary)", marginBottom: "0.4rem", listStyle: "disc" }}>{t}</li>
                  ))}
                </ul>
              </div>

            {d.marketContext && d.marketContext.length > 0 && (
              <div>
                <h5 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--color-accent)", marginBottom: "0.35rem" }}>Market Context</h5>
                <ul style={{ paddingLeft: "1.2rem" }}>
                  {d.marketContext.map((t: string, i: number) => (
                    <li key={i} style={{ fontSize: "1.05rem", lineHeight: 1.6, color: "var(--text-secondary)", marginBottom: "0.4rem", listStyle: "disc" }}>{t}</li>
                  ))}
                </ul>
              </div>
            )}

            {d.keyTakeaways && d.keyTakeaways.length > 0 && (
              <div>
                <h5 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--color-accent)", marginBottom: "0.35rem" }}>Key Takeaways</h5>
                <ul style={{ paddingLeft: "1.2rem" }}>
                  {d.keyTakeaways.map((t: string, i: number) => (
                    <li key={i} style={{ fontSize: "1.05rem", lineHeight: 1.6, color: "var(--text-secondary)", marginBottom: "0.4rem", listStyle: "disc" }}>{t}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1.25rem", paddingTop: "0.75rem", borderTop: "1px solid var(--glass-border)" }}>
            <a href={d.url} target="_blank" rel="noopener noreferrer" className="action-link text-xs">
              Read full article ↗
            </a>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Helpful?</span>
              <button
                onClick={() => handleFeedback(1)}
                disabled={!!feedback || submitting}
                style={{
                  background: feedback === "up" ? "rgba(34, 197, 94, 0.15)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${feedback === "up" ? "rgba(34, 197, 94, 0.3)" : "var(--glass-border)"}`,
                  borderRadius: "9999px",
                  padding: "0.3rem 0.85rem",
                  fontSize: "0.88rem",
                  fontWeight: 500,
                  color: feedback === "up" ? "var(--color-positive)" : "var(--text-secondary)",
                  cursor: feedback ? "default" : "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s var(--ease-out-expo)",
                  opacity: feedback && feedback !== "up" ? 0.4 : 1,
                }}
              >
                +1
              </button>
              <button
                onClick={() => handleFeedback(-1)}
                disabled={!!feedback || submitting}
                style={{
                  background: feedback === "down" ? "rgba(239, 68, 68, 0.15)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${feedback === "down" ? "rgba(239, 68, 68, 0.3)" : "var(--glass-border)"}`,
                  borderRadius: "9999px",
                  padding: "0.3rem 0.85rem",
                  fontSize: "0.88rem",
                  fontWeight: 500,
                  color: feedback === "down" ? "var(--color-negative)" : "var(--text-secondary)",
                  cursor: feedback ? "default" : "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s var(--ease-out-expo)",
                  opacity: feedback && feedback !== "down" ? 0.4 : 1,
                }}
              >
                -1
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-4 md:p-5 ${wrapper}`}>
      <div className="mac-panel">
        <p style={{ fontSize: "0.85rem", color: "var(--color-negative)" }}>Failed to load briefing.</p>
      </div>
    </div>
  )
}
