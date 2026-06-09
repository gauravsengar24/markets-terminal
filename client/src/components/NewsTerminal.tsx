import type { NewsArticle } from "@shared/types"

interface Props {
  articles: NewsArticle[]
  selectedUrl: string | null
  onSelect: (url: string | null) => void
}

const regionColors: Record<string, string> = {
  USA: "text-term-blue",
  Europe: "text-term-cyan",
  China: "text-term-amber",
  Japan: "text-term-amber",
  India: "text-term-green",
  Korea: "text-term-muted",
  Australia: "text-term-muted",
}

export function NewsTerminal({ articles, selectedUrl, onSelect }: Props) {
  if (!articles.length) {
    return <div className="p-8 text-center text-xs text-term-muted">No articles match the current filters.</div>
  }

  return (
    <div className="divide-y divide-term-border/50">
      {articles.map((a) => (
        <button key={a.id} onClick={() => onSelect(selectedUrl === a.url ? null : a.url)}
          className={`w-full text-left px-3 py-2 text-xs cursor-pointer transition-colors hover:bg-term-bg/80 ${
            selectedUrl === a.url ? "bg-term-accent/5 border-l-2 border-term-accent" : ""
          }`}>
          <div className="flex items-start gap-2">
            <span className="w-12 shrink-0 text-term-muted mono">{fmtTime(a.publishedAt)}</span>
            <span className={`w-12 shrink-0 text-[10px] font-bold uppercase ${regionColors[a.region] ?? "text-term-muted"}`}>{a.region}</span>
            <span className="w-14 shrink-0 text-term-muted text-[10px] uppercase">{a.assetClass.replace("_", " ")}</span>
            <span className="text-term-text flex-1 leading-snug">{a.title}</span>
            <span className="shrink-0 text-term-muted text-[10px]">{a.source}</span>
          </div>
        </button>
      ))}
    </div>
  )
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
}
