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
        <div style={{ padding: "2rem", textAlign: "center", maxWidth: "24rem" }}>
          <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", marginBottom: "1rem" }}>Article not found.</p>
          <button onClick={() => navigate("/")} className="view-all-link">← Back to Home</button>
        </div>
      </div>
    )
  }

  const regionColors: Record<string, string> = {
    USA: "#60a5fa", Europe: "#22d3ee", China: "#f59e0b",
    Japan: "#f59e0b", India: "#22c55e", Korea: "#86868b", Australia: "#86868b",
  }

  return (
    <div className="container-main" style={{ paddingTop: "1.5rem" }}>
      <button onClick={() => navigate(-1)} className="view-all-link" style={{ marginBottom: "1rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
        ← Back
      </button>

      <div className="article-page">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <span className="article-card-category">{article.source}</span>
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
              background: "var(--color-surface-muted)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-tertiary)", letterSpacing: "0.04em",
            }}>{article.impactCategory}</span>
          )}
          <span style={{ fontSize: "0.6rem", fontWeight: 600, color: regionColors[article.region] ?? "var(--color-text-tertiary)" }}>{article.region}</span>
          <span style={{ fontSize: "0.6rem", color: "var(--color-text-tertiary)", fontFamily: "'Chivo Mono', monospace" }}>{fmtTime(article.publishedAt)}</span>
        </div>
        <h1 className="article-h1">{article.title}</h1>
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

      <div className="flex justify-center pb-6" style={{ marginTop: "2rem" }}>
        <button onClick={() => navigate("/")} className="view-all-link">← Back to Home</button>
      </div>
    </div>
  )
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
}
