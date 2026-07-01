import { useState, useEffect, useCallback } from "react"
import type { MarketPrice, MarketSnapshotResponse } from "@shared/types"

interface SpotMetal {
  symbol: string
  name: string
  bid: string
  ask: string
  price: number
  change: string
  changePct: string
  up: boolean
}

interface TickerItem {
  name: string
  value: string
  change: string
  up: boolean
  price: number
}

interface CryptoQuote {
  name: string
  symbol: string
  price: string
  change: string
  up: boolean
}

interface MarketData {
  commodities: MarketPrice[]
  crypto: MarketPrice[]
  usIndices: MarketPrice[]
  europeIndices: MarketPrice[]
  asiaIndices: MarketPrice[]
  indiaIndices: MarketPrice[]
  ausIndices: MarketPrice[]
  forex: MarketPrice[]
  usGainers: MarketPrice[]
  usLosers: MarketPrice[]
  niftyGainers: MarketPrice[]
  niftyLosers: MarketPrice[]
}

export function useMarketData() {
  const [data, setData] = useState<MarketData>({
    commodities: [], crypto: [], usIndices: [], europeIndices: [],
    asiaIndices: [], indiaIndices: [], ausIndices: [], forex: [],
    usGainers: [], usLosers: [], niftyGainers: [], niftyLosers: [],
  })
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch("/api/market-snapshot")
      if (!res.ok) return
      const json = (await res.json()) as MarketSnapshotResponse
      setData(json)
    } catch {} finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 60_000)
    return () => clearInterval(interval)
  }, [fetchAll])

  function findIn(list: MarketPrice[] | undefined, sym: string): MarketPrice | undefined {
    return list?.find(c => c.symbol === sym)
  }

  const spotMetals: SpotMetal[] = [
    { sym: "GC=F", name: "Gold" },
    { sym: "SI=F", name: "Silver" },
    { sym: "PL=F", name: "Platinum" },
    { sym: "PA=F", name: "Palladium" },
  ].map(({ sym, name }) => {
    const item = findIn(data.commodities, sym)
    const price = item?.price ?? 0
    const pct = item?.changePercent ?? 0
    return {
      symbol: sym.replace("=F", ""),
      name,
      bid: price > 100 ? price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : price.toFixed(2),
      ask: price > 100 ? (price + 0.5).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (price + 0.05).toFixed(2),
      price,
      change: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`,
      changePct: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`,
      up: pct >= 0,
    }
  })

  const tickerItems: TickerItem[] = [
    { sym: "^GSPC", name: "S&P 500", list: "usIndices" },
    { sym: "^IXIC", name: "NASDAQ", list: "usIndices" },
    { sym: "^DJI", name: "Dow Jones", list: "usIndices" },
    { sym: "^FTSE", name: "FTSE 100", list: "europeIndices" },
    { sym: "^GDAXI", name: "DAX", list: "europeIndices" },
    { sym: "^NSEI", name: "Nifty 50", list: "indiaIndices" },
    { sym: "^N225", name: "Nikkei 225", list: "asiaIndices" },
    { sym: "GC=F", name: "Gold", list: "commodities" },
    { sym: "CL=F", name: "Crude Oil", list: "commodities" },
    { sym: "BTC", name: "Bitcoin", list: "crypto" },
  ].map(({ sym, name, list }) => {
    const items = (data as any)[list] as MarketPrice[] | undefined
    const item = sym === "BTC" ? findIn(items, "BTC") : findIn(items, sym)
    const price = item?.price ?? 0
    const pct = item?.changePercent ?? 0
    return {
      name,
      value: price >= 1000 ? price.toLocaleString(undefined, { maximumFractionDigits: 0 }) : `$${price.toFixed(2)}`,
      change: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`,
      up: pct >= 0,
      price,
    }
  })

  const cryptoQuotes: CryptoQuote[] = data.crypto.slice(0, 4).map(c => ({
    name: c.name,
    symbol: c.symbol,
    price: `$${c.price >= 1000 ? c.price.toLocaleString(undefined, { maximumFractionDigits: 0 }) : c.price.toFixed(2)}`,
    change: `${c.changePercent >= 0 ? "+" : ""}${c.changePercent.toFixed(2)}%`,
    up: c.changePercent >= 0,
  }))

  return { spotMetals, tickerItems, cryptoQuotes, data, loading }
}
