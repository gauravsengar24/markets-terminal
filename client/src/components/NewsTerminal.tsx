import type { NewsArticle } from "@shared/types"

interface Props {
  articles: NewsArticle[]
  selectedUrl: string | null
  onSelect: (url: string | null) => void
}

const regionColors: Record<string, string> = {
  USA: "#60a5fa",
  Europe: "#22d3ee",
  China: "#f59e0b",
  Japan: "#f59e0b",
  India: "#22c55e",
  Korea: "#78788a",
  Australia: "#78788a",
}

export function NewsTerminal({ articles, selectedUrl, onSelect }: Props) {
  if (!articles.length) {
    return <div className="p-6 md:p-12 text-center text-base md:text-lg" style={{ color: "var(--text-tertiary)" }}>No articles match the current filters.</div>
  }

  return (
    <div>
      {articles.map((a) => (
        <button key={a.id} onClick={() => onSelect(selectedUrl === a.url ? null : a.url)}
          style={{
            display: "block",
            width: "100%",
            textAlign: "left",
            padding: "0.75rem 1.25rem",
            fontSize: "0.875rem",
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "background 0.2s ease",
            border: "none",
            borderTop: selectedUrl === a.url ? "none" : undefined,
            borderLeft: selectedUrl === a.url ? "2px solid var(--electric-blue)" : undefined,
            background: selectedUrl === a.url ? "rgba(96,205,255,0.05)" : "transparent",
            color: "var(--text-primary)",
          }}
          onMouseEnter={e => { if (selectedUrl !== a.url) e.currentTarget.style.background = "rgba(255,255,255,0.03)" }}
          onMouseLeave={e => { if (selectedUrl !== a.url) e.currentTarget.style.background = "transparent" }}
        >
          <div className="flex items-start gap-1.5 md:gap-2">
            <span className="hidden md:inline w-14 shrink-0 mono" style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}>{fmtTime(a.publishedAt)}</span>
            <span className="hidden md:inline w-20 shrink-0 text-sm font-bold uppercase truncate" style={{ color: regionColors[a.region] ?? "var(--text-tertiary)" }}>{a.region}</span>
            <span className="hidden md:inline w-24 shrink-0 text-sm uppercase truncate" style={{ color: "var(--text-tertiary)" }}>{a.assetClass.replace("_", " ")}</span>
            <div className="flex-1 min-w-0">
              <span style={{ color: "var(--text-primary)", lineHeight: 1.6 }}>{a.title}</span>
              <span className="md:hidden ml-2" style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>{a.source}</span>
              <div className="mt-0.5 flex gap-2 text-xs md:hidden" style={{ color: "var(--text-tertiary)" }}>
                <span style={{ color: regionColors[a.region] ?? "var(--text-tertiary)" }}>{a.region}</span>
                <span>{a.assetClass.replace("_", " ")}</span>
                <span>{fmtTime(a.publishedAt)}</span>
              </div>
            </div>
            <span className="hidden md:inline shrink-0 ml-1" style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}>{a.source}</span>
          </div>
          {a.snippet && (
            <div className="mt-1 md:mt-1.5 md:ml-[7.5rem] text-xs md:text-sm leading-relaxed line-clamp-2" style={{ color: "var(--text-secondary)" }}>{a.snippet}</div>
          )}
        </button>
      ))}
    </div>
  )
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
}
