import { useState, useEffect, useCallback } from "react"
import type { MarketPrice, MarketSnapshotResponse } from "@shared/types"

function PriceRow({ symbol, name, price, changePercent }: MarketPrice) {
  const positive = changePercent >= 0
  const displayName = name || symbol
  return (
    <div
      className="flex items-center gap-1 md:gap-1.5 px-2 py-1 rounded-md cursor-default"
      style={{
        transition: "all 0.2s cubic-bezier(.16,1,.3,1)",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)" }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
    >
      <span className="flex-1 min-w-0 text-[11px] truncate" style={{ color: "rgba(255,255,255,0.65)" }}>{displayName}</span>
      <span className="text-right text-[11px] font-medium font-mono tabular-nums w-[72px] shrink-0" style={{ color: "rgba(255,255,255,0.85)" }}>
        {price < 10 ? price.toFixed(4) : price < 1000 ? price.toFixed(2) : price.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
      </span>
      <span className={`text-right text-[12px] font-semibold font-mono tabular-nums w-[60px] shrink-0 ${positive ? "text-up" : "text-down"}`}>
        {positive ? "+" : ""}{changePercent.toFixed(2)}%
      </span>
    </div>
  )
}

function SectionCard({ title, items }: { title: string; items: MarketPrice[] }) {
  if (!items.length) return null
  return (
    <div className="border-b border-[rgba(255,255,255,0.06)] last:border-b-0">
      <div className="flex items-center gap-1.5 px-2 py-1.5" style={{ background: "rgba(255,255,255,0.02)" }}>
        <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.35)" }}>{title}</span>
        <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.18)" }}>({items.length})</span>
      </div>
      <div className="py-0.5">
        {items.map(item => <PriceRow key={item.symbol} {...item} />)}
      </div>
    </div>
  )
}

function MoversCard({ title, items, type }: { title: string; items: MarketPrice[]; type: "gainers" | "losers" }) {
  if (!items.length) return null
  const accent = type === "gainers" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"
  return (
    <div className="border-b border-[rgba(255,255,255,0.06)] last:border-b-0">
      <div className="flex items-center gap-1.5 px-2 py-1.5" style={{ background: "rgba(255,255,255,0.02)" }}>
        <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.35)" }}>{title}</span>
        <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.18)" }}>({items.length})</span>
      </div>
      <div className="py-0.5">
        {items.map(item => {
          const p = item.changePercent >= 0
          return (
            <div
              key={item.symbol}
              className="flex items-center gap-1 md:gap-1.5 px-2 py-1 rounded-md cursor-default"
              style={{ transition: "all 0.2s cubic-bezier(.16,1,.3,1)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
            >
              <span className="w-1 h-1 rounded-full shrink-0" style={{ background: accent, boxShadow: `0 0 4px ${accent}` }} />
              <span className="flex-1 min-w-0 text-[11px] truncate" style={{ color: "rgba(255,255,255,0.65)" }}>{(item.name || item.symbol)}</span>
              <span className="text-right text-[11px] font-medium font-mono tabular-nums w-[72px] shrink-0" style={{ color: "rgba(255,255,255,0.85)" }}>
                {item.price < 10 ? item.price.toFixed(4) : item.price < 1000 ? item.price.toFixed(2) : item.price.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </span>
              <span className={`text-right text-[12px] font-semibold font-mono tabular-nums w-[60px] shrink-0 ${p ? "text-up" : "text-down"}`}>
                {p ? "+" : ""}{item.changePercent.toFixed(2)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Shimmer({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-5 rounded-md bg-gradient-to-r from-[rgba(255,255,255,0.03)] via-[rgba(255,255,255,0.06)] to-[rgba(255,255,255,0.03)] bg-[length:200%_100%] animate-shimmer" />
      ))}
    </>
  )
}

export function MarketSnapshot() {
  const [data, setData] = useState<MarketSnapshotResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastFetch, setLastFetch] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch("/api/market-snapshot", { signal: AbortSignal.timeout(30000) })
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

  return (
    <div
      className="vibrant-glass-card"
      style={{
        padding: 0,
        overflow: "hidden",
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(5,5,8,0.6))",
        backdropFilter: "blur(25px) saturate(210%)",
        WebkitBackdropFilter: "blur(25px) saturate(210%)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
        transition: "all 0.3s cubic-bezier(.16,1,.3,1)",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"
        e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)"
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"
        e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)"
      }}
    >
      <div style={{
        position: "relative",
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)",
        height: "1px",
        pointerEvents: "none",
      }} />

      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-2">
          <div style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: "rgba(6, 182, 212, 0.8)",
            boxShadow: "0 0 8px rgba(6, 182, 212, 0.3)",
          }} />
          <h3 className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.6)" }}>
            Market Snapshot
          </h3>
          {error && <span className="text-[10px]" style={{ color: "#f59e0b" }}>⚠ {error}</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="block w-1.5 h-1.5 rounded-full"
            style={{
              background: isLive ? "#22c55e" : "rgba(255,255,255,0.3)",
              boxShadow: isLive ? "0 0 6px rgba(34,197,94,0.6)" : "none",
              animation: isLive ? "1.2s ease-in-out infinite ticker-blink" : "none",
            }}
          />
          <span className="text-[10px] font-semibold" style={{ color: isLive ? "#22c55e" : "rgba(255,255,255,0.35)" }}>
            {isLive ? "LIVE" : "DELAYED"}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-3 space-y-3">
          <Shimmer count={8} />
        </div>
      ) : (
        <div className="overflow-y-auto scrollbar-thin" style={{ maxHeight: "calc(100vh - 220px)" }}>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-y md:divide-y-0 divide-[rgba(255,255,255,0.04)]">
            <div className="flex flex-col divide-y divide-[rgba(255,255,255,0.04)]">
              {data?.usIndices?.length ? <SectionCard title="US Indices" items={data.usIndices} /> : null}
              {data?.europeIndices?.length ? <SectionCard title="Europe Indices" items={data.europeIndices} /> : null}
              {data?.indiaIndices?.length ? <SectionCard title="India Indices" items={data.indiaIndices} /> : null}
              {data?.ausIndices?.length ? <SectionCard title="Australia Indices" items={data.ausIndices} /> : null}
              {data?.asiaIndices?.length ? <SectionCard title="Asia Indices" items={data.asiaIndices} /> : null}
              {data?.commodities?.length ? <SectionCard title="Commodities" items={data.commodities} /> : null}
              {data?.forex?.length ? <SectionCard title="Forex" items={data.forex} /> : null}
            </div>
            <div className="flex flex-col divide-y divide-[rgba(255,255,255,0.04)]">
              {data?.crypto?.length ? <SectionCard title="Crypto" items={data.crypto} /> : null}
              {data?.usGainers?.length ? <MoversCard title="US Top Gainers" items={data.usGainers} type="gainers" /> : null}
              {data?.usLosers?.length ? <MoversCard title="US Top Losers" items={data.usLosers} type="losers" /> : null}
              {data?.niftyGainers?.length ? <MoversCard title="Nifty Gainers" items={data.niftyGainers} type="gainers" /> : null}
              {data?.niftyLosers?.length ? <MoversCard title="Nifty Losers" items={data.niftyLosers} type="losers" /> : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
