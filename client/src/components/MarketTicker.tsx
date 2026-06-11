import { useQuery } from "@tanstack/react-query"
import { fetchMarketSnapshot } from "../lib/api"
import type { MarketPrice, MarketSnapshotResponse } from "@shared/types"

function flattenSnapshot(data: MarketSnapshotResponse): MarketPrice[] {
  const all: MarketPrice[] = []
  const keys: (keyof MarketSnapshotResponse)[] = ["cryptoTopMovers", "forexPairs", "indianMarkets", "globalMovers", "usGainers", "usLosers", "niftyGainers", "niftyLosers"]
  for (const k of keys) {
    const items = data[k]
    if (items && items.length > 0) all.push(...items)
  }
  return all
}

export function MarketTicker() {
  const query = useQuery({
    queryKey: ["market-snapshot"],
    queryFn: async () => {
      const data = await fetchMarketSnapshot() as MarketSnapshotResponse
      return flattenSnapshot(data)
    },
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
