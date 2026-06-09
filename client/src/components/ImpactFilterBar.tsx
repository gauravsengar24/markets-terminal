import type { NewsArticle } from "@shared/types"

const IMPACT_CATEGORIES = [
  { id: "all", label: "All", vol: "all" },
  { id: "central-bank", label: "Central Bank", vol: "high" },
  { id: "geopolitical", label: "Geopolitical", vol: "high" },
  { id: "crisis", label: "Crisis", vol: "high" },
  { id: "pandemic", label: "Pandemic", vol: "high" },
  { id: "trade", label: "Trade", vol: "medium" },
  { id: "election", label: "Election", vol: "medium" },
  { id: "currency", label: "Currency", vol: "medium" },
]

interface Props {
  selected: string
  onSelect: (cat: string) => void
  articles: NewsArticle[]
}

export function ImpactFilterBar({ selected, onSelect, articles }: Props) {
  const counts = new Map<string, number>()
  counts.set("all", articles.length)
  for (const cat of IMPACT_CATEGORIES) {
    if (cat.id === "all") continue
    counts.set(cat.id, articles.filter(a => a.impactCategory === cat.id).length)
  }

  return (
    <div className="impact-filter-bar">
      {IMPACT_CATEGORIES.map((cat) => {
        const count = counts.get(cat.id) ?? 0
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`impact-pill ${selected === cat.id ? "active" : ""}`}
          >
            <span className={`pill-dot ${cat.vol}`} />
            {cat.label}
            <span style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", marginLeft: "1px" }}>
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
