import { useParams, useNavigate, useOutletContext } from "react-router-dom"
import type { NewsArticle } from "@shared/types"
import { NewsBriefing } from "../components/NewsBriefing"

export function ArticlePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { articles } = useOutletContext<{ articles: NewsArticle[] }>()

  const article = articles.find(a => a.id === id)

  if (!article) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '50vh' }}>
        <div className="vibrant-glass-card" style={{ padding: '2rem', textAlign: 'center', maxWidth: '24rem' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Article not found.</p>
          <button onClick={() => navigate("/")} className="action-link text-xs">
            ← Back to Home
          </button>
        </div>
      </div>
    )
  }

  const regionColors: Record<string, string> = {
    USA: "#60a5fa", Europe: "#22d3ee", China: "#f59e0b",
    Japan: "#f59e0b", India: "#22c55e", Korea: "#86868b", Australia: "#86868b",
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0.75rem' }}>
      <button
        onClick={() => navigate(-1)}
        className="action-link text-xs mb-4"
      >
        ← Back
      </button>

      <div className="vibrant-glass-card" style={{ padding: '1.25rem', marginBottom: '0.75rem' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="card-source">{article.source}</span>
          <span className="mono" style={{ fontSize: '0.6rem', color: regionColors[article.region] ?? 'var(--text-muted)' }}>{article.region}</span>
          <span className="mono" style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{fmtTime(article.publishedAt)}</span>
          <span style={{ fontSize: '0.55rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            {article.subCategory}
          </span>
        </div>
        <h1 className="article-title" style={{ fontSize: '1.1rem', fontWeight: 600, lineHeight: 1.4 }}>{article.title}</h1>
      </div>

      <NewsBriefing url={article.url} fullPage />

      <div className="flex justify-center mt-4 pb-6">
        <button onClick={() => navigate("/")} className="action-link text-xs">
          ← Back to Home
        </button>
      </div>
    </div>
  )
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
}
