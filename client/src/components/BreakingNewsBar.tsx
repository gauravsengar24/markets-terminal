import { useQuery } from "@tanstack/react-query"
import { fetchCuratedBreakingNews } from "../lib/api"
import type { CuratedArticle, CuratedBreakingNews } from "@shared/types"

interface Props {
  onSelect: (url: string) => void
}

const TOPIC_LABELS: Record<string, string> = {
  "tech-founder": "FOUNDER",
  "politics-leader": "LEADER",
  "ipo": "IPO",
  "war-conflict": "CONFLICT",
  "crypto-defi": "DeFi/RWA",
  "crypto-regulation": "REGULATION",
  "trending": "TRENDING",
  "markets": "MARKETS",
}

const TOPIC_COLORS: Record<string, string> = {
  "tech-founder": "#60cdff",
  "politics-leader": "#f59e0b",
  "ipo": "#22c55e",
  "war-conflict": "#ef4444",
  "crypto-defi": "#a78bfa",
  "crypto-regulation": "#f472b6",
  "trending": "#f97316",
  "markets": "#34d399",
}

function getDominantTopic(topics: string[]): string {
  const order = ["war-conflict", "politics-leader", "tech-founder", "ipo", "crypto-defi", "crypto-regulation", "trending", "markets"]
  for (const t of order) {
    if (topics.includes(t)) return t
  }
  return topics[0] || "trending"
}

export function BreakingNewsBar({ onSelect }: Props) {
  const query = useQuery({
    queryKey: ["breaking-news-curated"],
    queryFn: () => fetchCuratedBreakingNews() as Promise<CuratedBreakingNews>,
    refetchInterval: 120_000,
    staleTime: 60_000,
  })

  const items = query.data?.articles ?? []
  if (!items.length) return null

  const duplicated = [...items, ...items, ...items]

  function handleClick(url: string) {
    const idx = items.findIndex(a => a.url === url)
    if (idx >= 0) onSelect(url)
    else window.open(url, "_blank", "noopener")
  }

  return (
    <div className="breaking-bar">
      <div className="breaking-glow" />
      <div className="breaking-bar-inner">
        <div className="breaking-label">
          <span className="breaking-dot" />
          <span className="breaking-dot-pulse" />
          <span className="breaking-live">LIVE</span>
          <span className="breaking-text">NOW</span>
        </div>
        <div className="breaking-scroll">
          <div className="breaking-track">
            {duplicated.map((a, i) => {
              const topic = getDominantTopic(a.topics)
              const color = TOPIC_COLORS[topic] || "var(--glass-border)"
              const label = TOPIC_LABELS[topic] || topic.toUpperCase()
              return (
                <button
                  key={`${a.id}-${i}`}
                  onClick={() => handleClick(a.url)}
                  className="breaking-card"
                  style={{ borderLeftColor: color }}
                >
                  <div className="breaking-card-body">
                    <div className="breaking-card-top">
                      <span className="breaking-tag" style={{ color, borderColor: color }}>{label}</span>
                      <span className="breaking-time">{fmtTime(a.publishedAt)}</span>
                      <span className="breaking-source">{a.source}</span>
                    </div>
                    <div className="breaking-card-title">{a.title}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function fmtTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
