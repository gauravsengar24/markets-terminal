import { useState, useEffect, useCallback } from "react"
import type { MarketPrice, MarketSnapshotResponse } from "@shared/types"

function CollapsibleSection({ title, items, icon, defaultOpen }: { title: string; items: MarketPrice[]; icon: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? true)

  return (
    <div className="border-b border-[rgba(255,255,255,0.06)] last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-2 cursor-pointer transition-all duration-200"
        style={{ background: open ? "rgba(255,255,255,0.03)" : "transparent" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)" }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = open ? "rgba(255,255,255,0.03)" : "transparent" }}
      >
        <span style={{ fontSize: "10px", opacity: 0.5 }}>{icon}</span>
        <span className="flex-1 text-[10px] font-bold tracking-widest uppercase text-left" style={{ color: "rgba(255,255,255,0.45)" }}>
          {title}
        </span>
        <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>{items.length}</span>
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.35s cubic-bezier(.16,1,.3,1)",
            color: "rgba(255,255,255,0.3)",
          }}
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: "grid-template-rows 0.35s cubic-bezier(.16,1,.3,1)",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <div className="py-0.5">
            {items.map(item => (
              <MarketRow key={item.symbol} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MarketRow({ item }: { item: MarketPrice }) {
  const positive = item.changePercent >= 0
  const priceStr = item.price < 10
    ? item.price.toFixed(4)
    : item.price < 1000
      ? item.price.toFixed(2)
      : item.price.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })

  function openChart() {
    const sym = item.symbol
    window.open(`https://www.tradingview.com/chart/?symbol=${sym}`, "_blank", "noopener")
  }

  return (
    <div
      onClick={openChart}
      className="flex items-center gap-1 md:gap-1.5 px-3 py-1 rounded-md cursor-pointer"
      style={{ transition: "all 0.2s cubic-bezier(.16,1,.3,1)" }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.background = "rgba(255,255,255,0.04)"
        el.style.transform = "translateX(2px)"
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.background = "transparent"
        el.style.transform = "translateX(0px)"
      }}
    >
      <span className="text-[11px] font-bold font-mono uppercase tracking-wider w-[52px] shrink-0" style={{ color: "rgba(255,255,255,0.5)" }}>
        {item.symbol}
      </span>
      <span className="flex-1 min-w-0 text-[11px] truncate" style={{ color: "rgba(255,255,255,0.65)" }}>{item.name}</span>
      <span className="text-right text-[11px] font-medium font-mono tabular-nums w-[80px] shrink-0" style={{ color: "rgba(255,255,255,0.85)" }}>
        {item.assetType === "forex" || (item.price < 50 && item.price > 0.01) ? priceStr : `$${priceStr}`}
      </span>
      <span className={`text-right text-[12px] font-semibold font-mono tabular-nums w-[64px] shrink-0 ${positive ? "text-up" : "text-down"}`}>
        {positive ? "▲" : "▼"}{Math.abs(item.changePercent).toFixed(2)}%
      </span>
    </div>
  )
}

function Shimmer({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-6 rounded-md bg-gradient-to-r from-[rgba(255,255,255,0.03)] via-[rgba(255,255,255,0.06)] to-[rgba(255,255,255,0.03)] bg-[length:200%_100%] animate-shimmer" />
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
          {data?.cryptoTopMovers?.length ? (
            <CollapsibleSection title="Crypto Top Movers" items={data.cryptoTopMovers} icon="⟠" defaultOpen />
          ) : null}
          {data?.forexPairs?.length ? (
            <CollapsibleSection title="Forex Majors" items={data.forexPairs} icon="💱" defaultOpen />
          ) : null}
          {data?.indianMarkets?.length ? (
            <CollapsibleSection title="Indian Markets" items={data.indianMarkets} icon="🇮🇳" defaultOpen />
          ) : null}
          {data?.globalMovers?.length ? (
            <CollapsibleSection title="Global Market Movers" items={data.globalMovers} icon="🌐" defaultOpen />
          ) : null}
          {(data?.usGainers?.length || data?.usLosers?.length || data?.niftyGainers?.length || data?.niftyLosers?.length) ? (
            <CollapsibleSection
              title="Top Movers"
              icon="⚡"
              items={[
                ...(data?.usGainers?.slice(0, 3) ?? []),
                ...(data?.usLosers?.slice(0, 3) ?? []),
                ...(data?.niftyGainers?.slice(0, 3) ?? []),
                ...(data?.niftyLosers?.slice(0, 3) ?? []),
              ]}
              defaultOpen={false}
            />
          ) : null}
        </div>
      )}
    </div>
  )
}
