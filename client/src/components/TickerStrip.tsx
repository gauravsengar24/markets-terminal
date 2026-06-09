import type { Quote } from "@shared/types"

export function TickerStrip({ quotes }: { quotes: Quote[] }) {
  if (!quotes.length) {
    return (
      <div className="h-9 bg-term-surface border-b border-term-border flex items-center px-3 shrink-0">
        <span className="text-xs text-term-muted mono">Loading quotes...</span>
      </div>
    )
  }

  return (
    <div className="h-9 bg-term-surface border-b border-term-border flex items-center overflow-hidden shrink-0">
      <div className="flex ticker-scroll whitespace-nowrap">
        {[...quotes, ...quotes].map((q, i) => (
          <span key={`${q.symbol}-${i}`} className="inline-flex items-center gap-1.5 px-3 py-1 text-xs mono border-r border-term-border/50">
            <span className="font-bold text-term-text">{q.symbol}</span>
            <span className={q.price ? (q.change >= 0 ? "text-term-green" : "text-term-red") : "text-term-muted"}>
              {q.price ? q.price.toFixed(2) : "--"}
            </span>
            <span className={q.price ? (q.change >= 0 ? "text-term-green" : "text-term-red") : "text-term-muted"}>
              {q.change ? `${q.change >= 0 ? "+" : ""}${q.change.toFixed(2)}` : ""}
            </span>
            <span className={q.price ? (q.change >= 0 ? "text-term-green" : "text-term-red") : "text-term-muted"}>
              {q.changePercent ? `${q.changePercent >= 0 ? "+" : ""}${q.changePercent.toFixed(2)}%` : ""}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
