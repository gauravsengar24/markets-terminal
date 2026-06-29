import { useState, useEffect, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import type { MarketPrice, MarketSnapshotResponse } from "@shared/types"

function PriceRow({ symbol, name, price, changePercent }: MarketPrice) {
  const positive = changePercent >= 0
  const displayName = name || symbol
  const prevRef = useRef(price)
  const [flash, setFlash] = useState<"up" | "down" | null>(null)

  useEffect(() => {
    if (prevRef.current !== price) {
      setFlash(price > prevRef.current ? "up" : "down")
      prevRef.current = price
      const t = setTimeout(() => setFlash(null), 800)
      return () => clearTimeout(t)
    }
  }, [price])

  return (
    <div
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-md cursor-default flex-nowrap relative transition-[background] duration-200"
      style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)" }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
    >
      {flash && (
        <motion.div
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            position: "absolute", inset: 0, borderRadius: "6px",
            background: flash === "up"
              ? "rgba(34,197,94,0.15)"
              : "rgba(239,68,68,0.15)",
            pointerEvents: "none",
          }}
        />
      )}
      <span className="flex-1 min-w-[90px] text-xs truncate" style={{ color: "rgba(255,255,255,0.65)" }}>{displayName}</span>
      <motion.span
        key={`${symbol}-${price}`}
        initial={{ scale: 1.15 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="text-right text-xs font-medium font-mono tabular-nums w-[80px] shrink-0"
        style={{ color: "rgba(255,255,255,0.85)" }}
      >
        {price < 10 ? price.toFixed(4) : price < 1000 ? price.toFixed(2) : price.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
      </motion.span>
      <span className={`text-right text-[13px] font-semibold font-mono tabular-nums w-[68px] shrink-0 ${positive ? "text-up" : "text-down"}`}>
        {positive ? "+" : ""}{changePercent.toFixed(2)}%
      </span>
    </div>
  )
}

function SectionCard({ title, items }: { title: string; items: MarketPrice[] }) {
  if (!items.length) return null
  return (
    <div className="border-b border-[rgba(255,255,255,0.06)] last:border-b-0">
      <div className="flex items-center gap-1.5 px-2.5 py-2" style={{ background: "rgba(255,255,255,0.02)" }}>
        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.35)" }}>{title}</span>
        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.18)" }}>({items.length})</span>
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
      <div className="flex items-center gap-1.5 px-2.5 py-2" style={{ background: "rgba(255,255,255,0.02)" }}>
        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.35)" }}>{title}</span>
        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.18)" }}>({items.length})</span>
      </div>
      <div className="py-0.5">
        {items.map(item => {
          const p = item.changePercent >= 0
          return (
            <div
              key={item.symbol}
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-md cursor-default flex-nowrap"
              style={{ transition: "all 0.2s cubic-bezier(.16,1,.3,1)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: accent, boxShadow: `0 0 4px ${accent}` }} />
              <span className="flex-1 min-w-[90px] text-xs truncate" style={{ color: "rgba(255,255,255,0.65)" }}>{(item.name || item.symbol)}</span>
              <span className="text-right text-xs font-medium font-mono tabular-nums w-[80px] shrink-0" style={{ color: "rgba(255,255,255,0.85)" }}>
                {item.price < 10 ? item.price.toFixed(4) : item.price < 1000 ? item.price.toFixed(2) : item.price.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </span>
              <span className={`text-right text-[13px] font-semibold font-mono tabular-nums w-[68px] shrink-0 ${p ? "text-up" : "text-down"}`}>
                {p ? "+" : ""}{item.changePercent.toFixed(2)}%
              </span>
            </div>
          )
        })}
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

  return (
    <div className="glass-gradient" style={{ padding: 0, overflow: "hidden" }}>
      <div className="flex items-center justify-between px-3 py-3 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-2">
          <div className="w-[7px] h-[7px] rounded-full" style={{
            background: "rgba(6, 182, 212, 0.8)",
            boxShadow: "0 0 8px rgba(6, 182, 212, 0.3)",
          }} />
          <h3 className="text-xs font-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.6)" }}>
            Market Snapshot
          </h3>
          {error && <span className="text-[10px]" style={{ color: "#f59e0b" }}>⚠ {error}</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`block w-1.5 h-1.5 rounded-full ${isLive ? "animate-blink" : ""}`}
            style={{
              background: isLive ? "#22c55e" : "rgba(255,255,255,0.3)",
              boxShadow: isLive ? "0 0 6px rgba(34,197,94,0.6)" : "none",
            }}
          />
          <span className="text-[11px] font-semibold" style={{ color: isLive ? "#22c55e" : "rgba(255,255,255,0.35)" }}>
            {isLive ? "LIVE" : "DELAYED"}
          </span>
        </div>
      </div>

        {loading ? (
        <div className="p-3 flex flex-col gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-5 rounded-md animate-shimmer" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 100%)", backgroundSize: "200% 100%" }} />
          ))}
        </div>
      ) : (
        <div className="overflow-y-auto scrollbar-thin" style={{ maxHeight: "clamp(300px, calc(100vh - 200px), 600px)" }}>
          <div className="flex flex-col divide-y divide-[rgba(255,255,255,0.04)]">
            {data?.crypto?.length ? <SectionCard title="Crypto" items={data.crypto} /> : null}
            {data?.indiaIndices?.length ? <SectionCard title="Indian Stocks" items={data.indiaIndices} /> : null}
            {data?.usIndices?.length ? <SectionCard title="US Stocks" items={data.usIndices} /> : null}
            {data?.europeIndices?.length ? <SectionCard title="European Stocks" items={data.europeIndices} /> : null}
            {data?.ausIndices?.length ? <SectionCard title="Australia Stocks" items={data.ausIndices} /> : null}
            {data?.asiaIndices?.length ? <SectionCard title="Asia Indices" items={data.asiaIndices} /> : null}
            {data?.commodities?.length ? <SectionCard title="Commodities" items={data.commodities} /> : null}
            {data?.forex?.length ? <SectionCard title="Forex" items={data.forex} /> : null}
            {data?.usGainers?.length ? <MoversCard title="US Top Gainers" items={data.usGainers} type="gainers" /> : null}
            {data?.usLosers?.length ? <MoversCard title="US Top Losers" items={data.usLosers} type="losers" /> : null}
            {data?.niftyGainers?.length ? <MoversCard title="Nifty Gainers" items={data.niftyGainers} type="gainers" /> : null}
            {data?.niftyLosers?.length ? <MoversCard title="Nifty Losers" items={data.niftyLosers} type="losers" /> : null}
          </div>
        </div>
      )}
    </div>
  )
}
