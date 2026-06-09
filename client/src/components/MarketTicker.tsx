import { useQuery } from "@tanstack/react-query"
import { fetchMarketSnapshot } from "../lib/api"
import type { MarketPrice } from "@shared/types"

export function MarketTicker() {
  const query = useQuery({
    queryKey: ["market-snapshot"],
    queryFn: () => fetchMarketSnapshot() as Promise<MarketPrice[]>,
    refetchInterval: 300_000,
    staleTime: 300_000,
  })

  const prices = query.data ?? []
  if (!prices.length) return null

  return (
    <div className="glass-ticker">
      <div className="flex items-center gap-2 md:gap-3 px-3 md:px-5 py-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {prices.map((p) => (
          <div key={p.symbol} className="glass-badge">
            <span style={{ fontSize: '0.65rem', fontWeight: 600, marginRight: '0.35rem', color: 'var(--electric-blue)' }}>{p.symbol}</span>
            <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
              ${p.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`mono ${p.changePercent >= 0 ? 'pos' : 'neg'}`} style={{ fontSize: '0.65rem', marginLeft: '0.35rem' }}>
              {p.changePercent >= 0 ? "▲" : "▼"}{Math.abs(p.changePercent).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
