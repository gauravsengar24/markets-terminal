import { useRef, useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { fetchMarketSnapshot } from "../lib/api"
import type { MarketPrice, MarketSnapshotResponse } from "@shared/types"

function flattenSnapshot(data: MarketSnapshotResponse): MarketPrice[] {
  const all: MarketPrice[] = []
  const keys: (keyof MarketSnapshotResponse)[] = ["crypto", "commodities", "usIndices", "europeIndices", "indiaIndices", "ausIndices", "asiaIndices", "forex", "usGainers", "usLosers", "niftyGainers", "niftyLosers"]
  for (const k of keys) {
    const items = data[k]
    if (items && items.length > 0) all.push(...items)
  }
  return all
}

function TickerItem({ p, index }: { p: MarketPrice; index: number }) {
  const prevRef = useRef(p.price)
  const [flash, setFlash] = useState<"up" | "down" | null>(null)

  useEffect(() => {
    if (prevRef.current !== p.price) {
      setFlash(p.price > prevRef.current ? "up" : "down")
      prevRef.current = p.price
      const t = setTimeout(() => setFlash(null), 600)
      return () => clearTimeout(t)
    }
  }, [p.price])

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.02, ease: [0.16, 1, 0.3, 1] }}
      className="ticker-item relative"
    >
      {flash && (
        <motion.div
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            position: "absolute", inset: 0, borderRadius: "12px",
            background: flash === "up" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
            pointerEvents: "none",
          }}
        />
      )}
      <span className="ticker-sym">{p.symbol}</span>
      <motion.span
        key={`${p.symbol}-${p.price}`}
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="ticker-price"
      >
        ${p.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </motion.span>
      <span className={`ticker-change ${p.changePercent >= 0 ? 'pos' : 'neg'}`}>
        {p.changePercent >= 0 ? "▲" : "▼"}{Math.abs(p.changePercent).toFixed(1)}%
      </span>
    </motion.div>
  )
}

export function MarketTicker() {
  const query = useQuery({
    queryKey: ["market-snapshot"],
    queryFn: async () => {
      const data = await fetchMarketSnapshot() as MarketSnapshotResponse
      return flattenSnapshot(data)
    },
    refetchInterval: 300_000,
    refetchIntervalInBackground: true,
    staleTime: 0,
  })

  const prices = query.data ?? []
  if (!prices.length) return null

  const items = [...prices, ...prices, ...prices]

  return (
    <div className="ticker-wrap">
      <div className="ticker-strip">
        {items.map((p, i) => (
          <TickerItem key={`${p.symbol}-${i}`} p={p} index={i} />
        ))}
      </div>
    </div>
  )
}
