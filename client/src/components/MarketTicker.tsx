import { useQuery } from "@tanstack/react-query"
import { fetchMarketSnapshot } from "../lib/api"
import type { MarketPrice } from "@shared/types"

const ASSET_ICONS: Record<string, string> = {
  crypto: "⟠",
  commodity: "◇",
  stock: "▤",
}

export function MarketTicker() {
  const query = useQuery({
    queryKey: ["market-snapshot"],
    queryFn: () => fetchMarketSnapshot() as Promise<MarketPrice[]>,
    refetchInterval: 300_000,
    staleTime: 300_000,
  })

  const prices = query.data ?? []
  if (!prices.length) return null

  const items = [...prices, ...prices, ...prices]

  return (
    <div className="ticker-wrap">
      <div className="ticker-strip">
        {items.map((p, i) => (
          <div key={`${p.symbol}-${i}`} className="ticker-item">
            <span className="ticker-sym">{p.symbol}</span>
            <span className="ticker-price">
              ${p.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`ticker-change ${p.changePercent >= 0 ? 'pos' : 'neg'}`}>
              {p.changePercent >= 0 ? "▲" : "▼"}{Math.abs(p.changePercent).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
