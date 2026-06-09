import type { Quote } from "@shared/types"
import { TICKERS } from "@shared/constants"

export function MarketSnapshot({ quotes }: { quotes: Quote[] }) {
  const map = new Map(quotes.map((q) => [q.symbol, q]))

  return (
    <div className="p-2">
      <h3 className="text-[10px] font-bold text-term-accent uppercase tracking-widest mb-2 px-1">Market Snapshot</h3>
      <div className="space-y-0.5">
        {TICKERS.map((t) => {
          const q = map.get(t.symbol)
          const ok = q && q.price > 0
          const up = ok && q!.change >= 0
          return (
            <div key={t.symbol} className="flex items-center justify-between px-2 py-1 text-xs hover:bg-term-bg transition-colors">
              <div className="flex items-center gap-2">
                <span className="font-bold text-term-text mono w-12">{t.symbol}</span>
                <span className="text-term-muted text-[10px] truncate max-w-20">{t.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`mono w-14 text-right ${ok ? "text-term-text" : "text-term-muted"}`}>
                  {ok ? q!.price.toFixed(2) : "--"}
                </span>
                <span className={`mono w-12 text-right ${ok ? (up ? "text-term-green" : "text-term-red") : "text-term-muted"}`}>
                  {ok ? `${up ? "+" : ""}${q!.change.toFixed(2)}` : ""}
                </span>
                <span className={`mono w-10 text-right ${ok ? (up ? "text-term-green" : "text-term-red") : "text-term-muted"}`}>
                  {ok ? `${up ? "+" : ""}${q!.changePercent.toFixed(1)}%` : ""}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
