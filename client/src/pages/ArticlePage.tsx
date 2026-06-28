import { useParams, useNavigate, useOutletContext } from "react-router-dom"
import type { NewsArticle, LayoutContext } from "@shared/types"
import { NewsBriefing } from "../components/NewsBriefing"

const VOLATILITY_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
}

export function ArticlePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { articles } = useOutletContext<LayoutContext>()

  const article = articles.find(a => a.id === id)

  if (!article) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "50vh" }}>
        <div className="mac-panel" style={{ padding: "2rem", textAlign: "center", maxWidth: "24rem" }}>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>Article not found.</p>
          <button onClick={() => navigate("/")} className="action-link text-xs">← Back to Home</button>
        </div>
      </div>
    )
  }

  const regionColors: Record<string, string> = {
    USA: "#60a5fa", Europe: "#22d3ee", China: "#f59e0b",
    Japan: "#f59e0b", India: "#22c55e", Korea: "#86868b", Australia: "#86868b",
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0.75rem" }}>
      <button onClick={() => navigate(-1)} className="action-link text-xs mb-4">← Back</button>

      <div className="mac-panel" style={{ padding: "1.25rem", marginBottom: "0.75rem" }}>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="mac-source">{article.source}</span>
          {article.volatility && (
            <span style={{
              fontSize: "0.5rem", fontWeight: 600, textTransform: "uppercase",
              padding: "0.1rem 0.35rem", borderRadius: "4px",
              background: `${VOLATILITY_COLORS[article.volatility]}15`,
              border: `1px solid ${VOLATILITY_COLORS[article.volatility]}30`,
              color: VOLATILITY_COLORS[article.volatility], letterSpacing: "0.06em",
            }}>{article.volatility}</span>
          )}
          {article.impactCategory && (
            <span style={{
              fontSize: "0.5rem", fontWeight: 600, textTransform: "uppercase",
              padding: "0.1rem 0.35rem", borderRadius: "4px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--glass-border)",
              color: "var(--text-tertiary)", letterSpacing: "0.04em",
            }}>{article.impactCategory}</span>
          )}
          <span className="mono" style={{ fontSize: "0.6rem", color: regionColors[article.region] ?? "var(--text-tertiary)" }}>{article.region}</span>
          <span className="mono" style={{ fontSize: "0.6rem", color: "var(--text-tertiary)" }}>{fmtTime(article.publishedAt)}</span>
        </div>
        <h1 className="article-title" style={{ fontSize: "1.15rem", fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.02em" }}>{article.title}</h1>
      </div>

      <NewsBriefing
        url={article.url}
        fullPage
        articleTitle={article.title}
        source={article.source}
        region={article.region}
        impactCategory={article.impactCategory}
        volatility={article.volatility}
        snippet={article.snippet}
      />

      <div className="flex justify-center mt-4 pb-6">
        <button onClick={() => navigate("/")} className="action-link text-xs">← Back to Home</button>
      </div>
    </div>
  )
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
}
