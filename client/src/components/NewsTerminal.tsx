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
    return <div className="p-6 md:p-12 text-center text-base md:text-lg text-term-muted">No articles match the current filters.</div>
  }

  return (
    <div className="divide-y divide-term-border/50">
      {articles.map((a) => (
        <button key={a.id} onClick={() => onSelect(selectedUrl === a.url ? null : a.url)}
          className={`w-full text-left px-3 md:px-5 py-3 md:py-3.5 text-sm md:text-base cursor-pointer transition-colors hover:bg-term-bg/80 ${
            selectedUrl === a.url ? "bg-term-accent/5 border-l-2 border-term-accent" : ""
          }`}>
          <div className="flex items-start gap-1.5 md:gap-2">
            <span className="hidden md:inline w-14 shrink-0 text-term-muted mono text-sm">{fmtTime(a.publishedAt)}</span>
            <span className={`hidden md:inline w-20 shrink-0 text-sm font-bold uppercase truncate ${regionColors[a.region] ?? "text-term-muted"}`}>{a.region}</span>
            <span className="hidden md:inline w-24 shrink-0 text-term-muted text-sm uppercase truncate">{a.assetClass.replace("_", " ")}</span>
            <div className="flex-1 min-w-0">
              <span className="text-term-text leading-relaxed text-sm md:text-base">{a.title}</span>
              <span className="md:hidden ml-2 text-term-muted text-xs">{a.source}</span>
              <div className="mt-0.5 flex gap-2 text-xs text-term-muted md:hidden">
                <span className={regionColors[a.region] ?? "text-term-muted"}>{a.region}</span>
                <span>{a.assetClass.replace("_", " ")}</span>
                <span>{fmtTime(a.publishedAt)}</span>
              </div>
            </div>
            <span className="hidden md:inline shrink-0 text-term-muted text-sm ml-1">{a.source}</span>
          </div>
          {a.snippet && (
            <div className="mt-1 md:mt-1.5 md:ml-[7.5rem] text-xs md:text-sm text-term-muted leading-relaxed line-clamp-2">{a.snippet}</div>
          )}
        </button>
      ))}
    </div>
  )
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
}
