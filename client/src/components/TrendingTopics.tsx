import { useState } from "react"

const TOPICS = [
  "Gold", "Silver", "Fed", "Inflation", "Crypto",
  "Recession", "Housing", "AI", "Energy", "Mining",
  "Bonds", "Forex", "Commodities", "M&A"
]

interface Props {
  onSelect?: (topic: string | null) => void
}

export function TrendingTopics({ onSelect }: Props) {
  const [active, setActive] = useState<string | null>(null)

  const handle = (topic: string) => {
    const next = active === topic ? null : topic
    setActive(next)
    onSelect?.(next)
  }

  return (
    <section>
      <h2 style={{
        fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.08em", color: "var(--color-text-secondary)",
        paddingBottom: "0.5rem", borderBottom: "2px solid var(--color-border)",
        marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem"
      }}>
        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-gold)", flexShrink: 0 }} />
        Trending Topics
      </h2>
      <div className="trending-wrap">
        {TOPICS.map(t => (
          <button key={t}
            className={`trending-pill${active === t ? " active" : ""}`}
            onClick={() => handle(t)}
          >
            {t}
          </button>
        ))}
      </div>
    </section>
  )
}
