import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { fetchFullArticle, fetchBriefing, submitFeedback } from "../lib/api"

interface Props {
  url: string | null
  fullPage?: boolean
  articleTitle?: string
  source?: string
  region?: string
  impactCategory?: string
  volatility?: string
  snippet?: string
}

export function NewsBriefing({ url, fullPage, articleTitle, source, region, impactCategory, volatility, snippet }: Props) {
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const query = useQuery({
    queryKey: ["article", url],
    queryFn: () => fetchFullArticle(url!, snippet).catch(() => fetchBriefing(url!, snippet)),
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
      <div className={`p-3 md:p-5 ${wrapper}`}>
        <div className="mac-panel" style={{ textAlign: "center", padding: fullPage ? "1.5rem" : "1rem" }}>
          <p style={{ fontSize: "1rem", color: "var(--text-secondary)" }}>Select a headline to view the full article.</p>
        </div>
      </div>
    )
  }

  if (query.isLoading) {
    return (
      <div className={`p-3 md:p-5 ${wrapper}`}>
        <div className="mac-panel" style={{ padding: fullPage ? "1.5rem" : "1rem" }}>
          <div className="animate-pulse space-y-3">
            <div style={{ height: "0.7rem", background: "var(--glass-border)", borderRadius: "4px", width: "60%" }} />
            <div style={{ height: "0.5rem", background: "var(--glass-border)", borderRadius: "4px", width: "100%" }} />
            <div style={{ height: "0.5rem", background: "var(--glass-border)", borderRadius: "4px", width: "95%" }} />
            <div style={{ height: "0.5rem", background: "var(--glass-border)", borderRadius: "4px", width: "80%" }} />
            <div style={{ height: "0.5rem", background: "var(--glass-border)", borderRadius: "4px", width: "90%" }} />
            <div style={{ height: "0.5rem", background: "var(--glass-border)", borderRadius: "4px", width: "70%" }} />
          </div>
        </div>
      </div>
    )
  }

  if (query.data) {
    const d = query.data as {
      whatHappened?: string[]
      marketContext?: string[]
      keyTakeaways?: string[]
      summary?: string
      fullContent?: string
      keyDataPoints?: { fact: string; source: string; confidence: string }[]
      crossReferences?: { source: string; url: string; keyPoints: string[] }[]
      verificationNotes?: string
      url: string
      title?: string
    }

    const hasFullContent = !!d.fullContent
    const dataPoints = d.keyDataPoints ?? []
    const crossRefs = d.crossReferences ?? []
    const wh = d.whatHappened ?? []
    const mc = d.marketContext ?? []
    const kt = d.keyTakeaways ?? []
    const title = d.title || ""

    return (
      <div className={`p-3 md:p-5 ${wrapper}`}>
        <div className="mac-panel" style={{ padding: fullPage ? "1.5rem 1.75rem 1.25rem" : "1rem 1.15rem" }}>
          {(hasFullContent || wh.length > 0) && (
            <>
              <div className="briefing-section">
                <div className="briefing-section-label">Full Article</div>
                <div style={{ fontSize: "0.85rem", lineHeight: 1.7, color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
                  {d.fullContent || wh.join(". ")}
                </div>
              </div>

              {dataPoints.length > 0 && (
                <div className="briefing-section">
                  <div className="briefing-section-label">Key Data Points</div>
                  {dataPoints.map((dp, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "flex-start", gap: "0.5rem",
                      padding: "0.4rem 0", borderBottom: i < dataPoints.length - 1 ? "1px solid var(--glass-border)" : "none",
                    }}>
                      <span style={{
                        fontSize: "0.55rem", fontWeight: 600, textTransform: "uppercase", whiteSpace: "nowrap",
                        padding: "0.1rem 0.3rem", borderRadius: "3px", marginTop: "0.15rem",
                        background: dp.confidence === "high" ? "rgba(34,197,94,0.15)" : dp.confidence === "medium" ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)",
                        color: dp.confidence === "high" ? "#22c55e" : dp.confidence === "medium" ? "#f59e0b" : "#ef4444",
                      }}>
                        {dp.confidence}
                      </span>
                      <div>
                        <span style={{ fontSize: "0.8rem", lineHeight: 1.5 }}>{dp.fact}</span>
                        <span style={{ fontSize: "0.65rem", color: "var(--text-tertiary)", display: "block" }}>Source: {dp.source}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {crossRefs.length > 0 && (
                <div className="briefing-section">
                  <div className="briefing-section-label">Cross-Referenced Sources</div>
                  {crossRefs.map((cr, i) => (
                    <div key={i} style={{ padding: "0.4rem 0", borderBottom: i < crossRefs.length - 1 ? "1px solid var(--glass-border)" : "none" }}>
                      <a href={cr.url} target="_blank" rel="noopener noreferrer" className="action-link" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                        {cr.source} ↗
                      </a>
                      {cr.keyPoints.map((kp, j) => (
                        <p key={j} style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "0.2rem 0 0", lineHeight: 1.5 }}>{kp}</p>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {d.verificationNotes && (
                <div className="briefing-section">
                  <div className="briefing-section-label">Verification Notes</div>
                  <p style={{ fontSize: "0.78rem", lineHeight: 1.6, color: "var(--text-secondary)", fontStyle: "italic", margin: 0 }}>
                    {d.verificationNotes}
                  </p>
                </div>
              )}
            </>
          )}

          <div className="briefing-footer">
            <a href={d.url} target="_blank" rel="noopener noreferrer" className="action-link text-xs">
              Read original article ↗
            </a>
            <div className="briefing-feedback">
              <span className="briefing-feedback-label">Helpful?</span>
              <button
                onClick={() => handleFeedback(1)}
                disabled={!!feedback || submitting}
                className={`briefing-btn ${feedback === "up" ? "active-up" : ""}`}
              >
                +1
              </button>
              <button
                onClick={() => handleFeedback(-1)}
                disabled={!!feedback || submitting}
                className={`briefing-btn ${feedback === "down" ? "active-down" : ""}`}
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
    <div className={`p-3 md:p-5 ${wrapper}`}>
      <div className="mac-panel" style={{ textAlign: "center", padding: fullPage ? "1.5rem" : "1rem" }}>
        <p style={{ fontSize: "1rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>No article available.</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="action-link text-xs">Read original article ↗</a>
      </div>
    </div>
  )
}
