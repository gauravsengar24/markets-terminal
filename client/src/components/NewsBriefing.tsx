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
  snippet?: string
}

export function NewsBriefing({ url, fullPage, articleTitle, source, region, impactCategory, volatility, snippet }: Props) {
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const query = useQuery({
    queryKey: ["briefing", url],
    queryFn: () => fetchBriefing(url!, snippet),
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
          <p style={{ fontSize: "1rem", color: "var(--text-secondary)" }}>Select a headline to view a briefing.</p>
        </div>
      </div>
    )
  }

  if (query.isLoading) {
    return (
      <div className={`p-3 md:p-5 ${wrapper}`}>
        <div className="mac-panel" style={{ padding: fullPage ? "1.5rem" : "1rem" }}>
          <div className="animate-pulse space-y-2">
            <div style={{ height: "0.7rem", background: "var(--glass-border)", borderRadius: "4px", width: "50%" }} />
            <div style={{ height: "0.5rem", background: "var(--glass-border)", borderRadius: "4px", width: "90%" }} />
            <div style={{ height: "0.5rem", background: "var(--glass-border)", borderRadius: "4px", width: "70%" }} />
          </div>
        </div>
      </div>
    )
  }

  if (query.data) {
    const d = query.data as {
      whatHappened?: string[]; marketContext?: string[]; keyTakeaways?: string[]; url: string
    }
    const wh = d.whatHappened ?? []
    const mc = d.marketContext ?? []
    const kt = d.keyTakeaways ?? []
    return (
      <div className={`p-3 md:p-5 ${wrapper}`}>
        <div className="mac-panel" style={{ padding: fullPage ? "1.5rem 1.75rem 1.25rem" : "1rem 1.15rem" }}>
          {wh.length > 0 && (
            <div className="briefing-section">
              <div className="briefing-section-label">What Happened</div>
              <ul className="briefing-list">{wh.map((t, i) => <li key={i} className="briefing-item">{t}</li>)}</ul>
            </div>
          )}
          {mc.length > 0 && (
            <div className="briefing-section">
              <div className="briefing-section-label">Market Context</div>
              <ul className="briefing-list">{mc.map((t, i) => <li key={i} className="briefing-item">{t}</li>)}</ul>
            </div>
          )}
          {kt.length > 0 && (
            <div className="briefing-section">
              <div className="briefing-section-label">Key Takeaways</div>
              <ul className="briefing-list">{kt.map((t, i) => <li key={i} className="briefing-item">{t}</li>)}</ul>
            </div>
          )}
          <div className="briefing-footer">
            <a href={d.url} target="_blank" rel="noopener noreferrer" className="action-link text-xs">
              Read full article ↗
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
        <p style={{ fontSize: "1rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>No briefing available.</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="action-link text-xs">Read full article ↗</a>
      </div>
    </div>
  )
}
