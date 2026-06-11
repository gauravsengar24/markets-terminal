import { useState, useEffect, useCallback } from "react"
import type { MarketPrice, MarketSnapshotResponse } from "@shared/types"

interface SectionProps {
  title: string
  items: MarketPrice[]
  icon?: string
}

function PriceRow({ symbol, name, price, change, changePercent, assetType }: MarketPrice) {
  const positive = change >= 0
  const symbolDisplay = assetType === "forex" ? symbol.replace("/USD", "").replace("=X", "") : symbol
  return (
    <div className="flex items-center px-3 h-7 gap-1.5 hover:bg-muted/10 transition-colors duration-100">
      <span className="w-16 shrink-0 text-[11px] font-bold text-muted-foreground/60 font-mono uppercase tracking-wider">
        {symbolDisplay}
      </span>
      <span className="flex-1 min-w-0 text-[11px] text-foreground/60 truncate">{name}</span>
      <span className="w-20 shrink-0 text-right text-[11px] font-medium text-foreground font-mono tabular-nums">
        {price < 10 ? price.toFixed(2) : price < 1000 ? price.toFixed(2) : price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 })}
      </span>
      <span className={`w-24 shrink-0 text-right text-[11px] font-medium font-mono tabular-nums ${positive ? "text-up" : "text-down"}`}>
        {positive ? "+" : ""}{changePercent.toFixed(2)}%
      </span>
    </div>
  )
}

function SectionCard({ title, items, icon }: SectionProps) {
  if (!items.length) return null
  return (
    <div className="border-b border-border/50 last:border-b-0">
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/5">
        {icon && <span className="text-[10px] opacity-60">{icon}</span>}
        <span className="text-[10px] font-bold tracking-widest text-muted-foreground/50 uppercase">{title}</span>
        <span className="text-[10px] text-muted-foreground/30">({items.length})</span>
      </div>
      <div className="py-0.5">
        {items.map(item => (
          <PriceRow key={item.symbol} {...item} />
        ))}
      </div>
    </div>
  )
}

export function MarketSnapshot() {
  const [data, setData] = useState<MarketSnapshotResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastFetch, setLastFetch] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch("/api/market-snapshot", { signal: AbortSignal.timeout(15000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json() as MarketSnapshotResponse
      setData(json)
      setError(null)
    } catch (e: any) {
      setError(e.message || "Failed to fetch")
    }
    setLastFetch(Date.now())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 60_000)
    return () => clearInterval(interval)
  }, [fetchAll])

  const dataAge = Date.now() - lastFetch
  const isLive = dataAge < 150_000

  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border overflow-hidden flex flex-col">
        <div className="px-3 py-2.5 border-b border-border">
          <h3 className="text-[11px] font-bold tracking-widest text-muted-foreground/70 uppercase">Market Snapshot</h3>
        </div>
        <div className="p-3 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-6 rounded bg-gradient-to-r from-muted/20 via-muted/40 to-muted/20 bg-[length:200%_100%] animate-shimmer" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden flex flex-col">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-[11px] font-bold tracking-widest text-muted-foreground/70 uppercase">
            Market Snapshot
          </h3>
          {error && <span className="text-[10px] text-amber-400">⚠ {error}</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`block w-1.5 h-1.5 rounded-full ${isLive ? "bg-up animate-blink" : "bg-muted-foreground/40"}`} />
          <span className={`text-[10px] font-semibold ${isLive ? "text-up" : "text-muted-foreground/50"}`}>
            {isLive ? "LIVE" : "DELAYED"}
          </span>
        </div>
      </div>

      <div className="overflow-y-auto scrollbar-thin max-h-[calc(100vh-200px)]">
        {data?.commodities && data.commodities.length > 0 && (
          <SectionCard title="Commodities" items={data.commodities} icon="◇" />
        )}
        {data?.crypto && data.crypto.length > 0 && (
          <SectionCard title="Crypto" items={data.crypto} icon="⟠" />
        )}
        {data?.forex && data.forex.length > 0 && (
          <SectionCard title="Forex" items={data.forex} icon="⇄" />
        )}
        {data?.usIndices && data.usIndices.length > 0 && (
          <SectionCard title="US Indices" items={data.usIndices} icon="▤" />
        )}
        {data?.europeIndices && data.europeIndices.length > 0 && (
          <SectionCard title="Europe Indices" items={data.europeIndices} icon="▤" />
        )}
        {data?.indiaIndices && data.indiaIndices.length > 0 && (
          <SectionCard title="India Indices" items={data.indiaIndices} icon="▤" />
        )}
        {data?.usGainers && data.usGainers.length > 0 && (
          <SectionCard title="US Top Gainers" items={data.usGainers} icon="↑" />
        )}
        {data?.usLosers && data.usLosers.length > 0 && (
          <SectionCard title="US Top Losers" items={data.usLosers} icon="↓" />
        )}
        {data?.niftyGainers && data.niftyGainers.length > 0 && (
          <SectionCard title="Nifty Gainers" items={data.niftyGainers} icon="↑" />
        )}
        {data?.niftyLosers && data.niftyLosers.length > 0 && (
          <SectionCard title="Nifty Losers" items={data.niftyLosers} icon="↓" />
        )}
      </div>
    </div>
  )
}
