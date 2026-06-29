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
      <div className={`${wrapper}`} style={{ padding: fullPage ? "1rem" : "0" }}>
        <div style={{ textAlign: "center", padding: fullPage ? "1.5rem" : "1rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", background: "var(--color-surface)" }}>
          <p style={{ fontSize: "1rem", color: "var(--color-text-secondary)" }}>Select a headline to view the full article.</p>
        </div>
      </div>
    )
  }

  if (query.isLoading) {
    return (
      <div className={`${wrapper}`} style={{ padding: fullPage ? "1rem" : "0" }}>
        <div style={{ padding: fullPage ? "1.5rem" : "1rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", background: "var(--color-surface)" }}>
          <div className="animate-pulse" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div className="skeleton" style={{ height: "0.7rem", width: "60%" }} />
            <div className="skeleton" style={{ height: "0.5rem", width: "100%" }} />
            <div className="skeleton" style={{ height: "0.5rem", width: "95%" }} />
            <div className="skeleton" style={{ height: "0.5rem", width: "80%" }} />
            <div className="skeleton" style={{ height: "0.5rem", width: "90%" }} />
            <div className="skeleton" style={{ height: "0.5rem", width: "70%" }} />
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

    return (
      <div className={`${wrapper}`} style={{ padding: fullPage ? "1rem" : "0" }}>
        <div style={{ padding: fullPage ? "1.5rem 1.75rem 1.25rem" : "1rem 1.15rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", background: "var(--color-surface)" }}>
          {(hasFullContent || wh.length > 0) && (
            <>
              {kt.length > 0 && (
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-primary-100)", marginBottom: "0.5rem" }}>Key Takeaways</div>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                    {kt.map((k, i) => (
                      <li key={i} style={{ position: "relative", paddingLeft: "0.9rem", fontSize: "0.9rem", lineHeight: 1.6, color: "var(--color-text-secondary)", marginBottom: "0.25rem" }}>
                        <span style={{ position: "absolute", left: 0, top: "0.55em", width: "5px", height: "5px", borderRadius: "50%", background: "var(--color-primary-100)" }} />
                        {k}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-primary-100)", marginBottom: "0.5rem" }}>Full Article</div>
                <div style={{ fontSize: "0.95rem", lineHeight: 1.7, color: "var(--color-text-primary)", whiteSpace: "pre-wrap" }}>
                  {d.fullContent || wh.join(". ")}
                </div>
              </div>

              {dataPoints.length > 0 && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-primary-100)", marginBottom: "0.5rem" }}>Key Data Points</div>
                  {dataPoints.map((dp, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", padding: "0.4rem 0", borderBottom: i < dataPoints.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                      <span style={{ fontSize: "0.55rem", fontWeight: 600, textTransform: "uppercase", whiteSpace: "nowrap", padding: "0.1rem 0.3rem", borderRadius: "3px", marginTop: "0.15rem", background: dp.confidence === "high" ? "rgba(34,197,94,0.15)" : dp.confidence === "medium" ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)", color: dp.confidence === "high" ? "#22c55e" : dp.confidence === "medium" ? "#f59e0b" : "#ef4444" }}>
                        {dp.confidence}
                      </span>
                      <div>
                        <span style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>{dp.fact}</span>
                        <span style={{ fontSize: "0.65rem", color: "var(--color-text-tertiary)", display: "block" }}>Source: {dp.source}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {crossRefs.length > 0 && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-primary-100)", marginBottom: "0.5rem" }}>Cross-Referenced Sources</div>
                  {crossRefs.map((cr, i) => (
                    <div key={i} style={{ padding: "0.4rem 0", borderBottom: i < crossRefs.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                      <a href={cr.url} target="_blank" rel="noopener noreferrer" className="view-all-link" style={{ fontSize: "0.8rem", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: "2px" }}>
                        {cr.source} ↗
                      </a>
                      {cr.keyPoints.map((kp, j) => (
                        <p key={j} style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", margin: "0.2rem 0 0", lineHeight: 1.5 }}>{kp}</p>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {d.verificationNotes && (
                <div style={{ marginBottom: "0.5rem" }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-primary-100)", marginBottom: "0.35rem" }}>Verification Notes</div>
                  <p style={{ fontSize: "0.78rem", lineHeight: 1.6, color: "var(--color-text-secondary)", fontStyle: "italic", margin: 0 }}>
                    {d.verificationNotes}
                  </p>
                </div>
              )}
            </>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1rem", paddingTop: "0.65rem", borderTop: "1px solid var(--color-border)" }}>
            <a href={d.url} target="_blank" rel="noopener noreferrer" className="view-all-link" style={{ fontSize: "0.85rem" }}>
              Read original article ↗
            </a>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-tertiary)" }}>Helpful?</span>
              <button onClick={() => handleFeedback(1)} disabled={!!feedback || submitting} style={{ fontSize: "0.75rem", fontWeight: 600, padding: "0.15rem 0.5rem", borderRadius: "var(--radius-sm)", border: feedback === "up" ? "1px solid var(--color-primary-100)" : "1px solid var(--color-border)", background: feedback === "up" ? "rgba(65,105,225,0.08)" : "transparent", color: feedback === "up" ? "var(--color-primary-100)" : "var(--color-text-secondary)", cursor: feedback ? "default" : "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                +1
              </button>
              <button onClick={() => handleFeedback(-1)} disabled={!!feedback || submitting} style={{ fontSize: "0.75rem", fontWeight: 600, padding: "0.15rem 0.5rem", borderRadius: "var(--radius-sm)", border: feedback === "down" ? "1px solid var(--color-red-400)" : "1px solid var(--color-border)", background: feedback === "down" ? "rgba(255,101,104,0.08)" : "transparent", color: feedback === "down" ? "var(--color-red-400)" : "var(--color-text-secondary)", cursor: feedback ? "default" : "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                -1
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${wrapper}`} style={{ padding: fullPage ? "1rem" : "0" }}>
      <div style={{ textAlign: "center", padding: fullPage ? "1.5rem" : "1rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", background: "var(--color-surface)" }}>
        <p style={{ fontSize: "1rem", color: "var(--color-text-secondary)", marginBottom: "0.5rem" }}>No article available.</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="view-all-link">Read original article ↗</a>
      </div>
    </div>
  )
}
