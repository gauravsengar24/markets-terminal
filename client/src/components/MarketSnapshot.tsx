import { useState, useEffect, useCallback } from "react"

interface TickerData {
  symbol: string
  name: string
  price: number | null
  change: number | null
  changePercent: number | null
  error?: boolean
}

const TICKERS = [
  { symbol: "WTI", name: "Crude Oil WTI", yahooSymbol: "CL=F" },
  { symbol: "BRENT", name: "Brent Crude", yahooSymbol: "BZ=F" },
  { symbol: "GOLD", name: "Gold", yahooSymbol: "GC=F" },
  { symbol: "SILVER", name: "Silver", yahooSymbol: "SI=F" },
  { symbol: "BTC", name: "Bitcoin", apiId: "bitcoin" },
  { symbol: "ETH", name: "Ethereum", apiId: "ethereum" },
  { symbol: "SPX", name: "S&P 500", yahooSymbol: "^GSPC" },
  { symbol: "NDX", name: "Nasdaq 100", yahooSymbol: "^NDX" },
  { symbol: "N225", name: "Nikkei 225", yahooSymbol: "^N225" },
  { symbol: "HSI", name: "Hang Seng", yahooSymbol: "^HSI" },
  { symbol: "SPY", name: "SPDR S&P 500 ETF", yahooSymbol: "SPY" },
  { symbol: "QQQ", name: "Invesco QQQ ETF", yahooSymbol: "QQQ" },
]

const CRYPTO_IDS = TICKERS.filter(t => t.apiId).map(t => t.apiId).join(",")
const COINGECKO_URL = `https://api.coingecko.com/api/v3/simple/price?ids=${CRYPTO_IDS}&vs_currencies=usd&include_24hr_change=true`

async function fetchCrypto(): Promise<Record<string, { price: number; changePercent: number }>> {
  try {
    const res = await fetch(COINGECKO_URL, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return {}
    const json = await res.json() as Record<string, { usd: number; usd_24h_change?: number }>
    const map: Record<string, { price: number; changePercent: number }> = {}
    for (const t of TICKERS) {
      if (!t.apiId) continue
      const d = json[t.apiId]
      if (d) map[t.symbol] = { price: d.usd, changePercent: d.usd_24h_change ?? 0 }
    }
    return map
  } catch { return {} }
}

async function fetchYahooPrice(ticker: string): Promise<{ price: number | null; change: number | null; changePercent: number | null }> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=1d&interval=5m`,
      { signal: AbortSignal.timeout(5000), headers: { "User-Agent": "Mozilla/5.0" } }
    )
    if (!res.ok) return { price: null, change: null, changePercent: null }
    const json = await res.json() as any
    const meta = json?.chart?.result?.[0]?.meta
    if (!meta) return { price: null, change: null, changePercent: null }
    const price = meta.regularMarketPrice ?? meta.previousClose ?? null
    const prevClose = meta.previousClose ?? price ?? null
    const change = price !== null && prevClose !== null ? price - prevClose : null
    const changePercent = price !== null && prevClose !== null ? ((price - prevClose) / prevClose) * 100 : null
    return { price, change, changePercent }
  } catch {
    return { price: null, change: null, changePercent: null }
  }
}

function PriceRow({ symbol, name, price, change, changePercent, error }: TickerData) {
  const positive = change !== null && change >= 0
  return (
    <div className="flex items-center px-3 h-8 gap-2 hover:bg-muted/10 transition-colors duration-100">
      <div className="w-20 shrink-0 flex items-baseline gap-1.5">
        <span className="text-xs font-bold text-muted-foreground/60 font-mono uppercase tracking-wider">{symbol}</span>
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-xs text-foreground/70 truncate block">{name}</span>
      </div>
      <div className="w-24 shrink-0 text-right">
        {error ? (
          <span className="text-xs text-amber-400">⚠</span>
        ) : price !== null ? (
          <span className="text-xs font-medium text-foreground font-mono tabular-nums">
            {price < 1000 ? price.toFixed(2) : price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/30 font-mono">—</span>
        )}
      </div>
      <div className="w-28 shrink-0 text-right">
        {change !== null && changePercent !== null ? (
          <span className={`text-xs font-medium font-mono tabular-nums ${positive ? "text-up" : "text-down"}`}>
            {positive ? "+" : ""}{change.toFixed(2)} ({positive ? "+" : ""}{changePercent.toFixed(2)}%)
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/30 font-mono">—</span>
        )}
      </div>
    </div>
  )
}

export function MarketSnapshot() {
  const [data, setData] = useState<TickerData[]>(
    TICKERS.map(t => ({ ...t, price: null, change: null, changePercent: null }))
  )
  const [loading, setLoading] = useState(true)
  const [lastFetch, setLastFetch] = useState(0)

  const fetchAll = useCallback(async () => {
    const cryptoMap = await fetchCrypto()
    const yahooTickers = TICKERS.filter(t => t.yahooSymbol).map(t => ({
      symbol: t.symbol,
      yahooSymbol: t.yahooSymbol!,
    }))
    const yahooResults = await Promise.allSettled(
      yahooTickers.map(t => fetchYahooPrice(t.yahooSymbol))
    )
    const yahooMap: Record<string, { price: number | null; change: number | null; changePercent: number | null }> = {}
    yahooResults.forEach((r, i) => {
      if (r.status === "fulfilled") {
        yahooMap[yahooTickers[i].symbol] = r.value
      } else {
        yahooMap[yahooTickers[i].symbol] = { price: null, change: null, changePercent: null, error: true }
      }
    })

    setData(TICKERS.map(t => {
      if (t.apiId && cryptoMap[t.symbol]) {
        const c = cryptoMap[t.symbol]
        return { ...t, price: c.price, change: null, changePercent: c.changePercent }
      }
      const y = yahooMap[t.symbol]
      if (y) return { ...t, ...y }
      return { ...t, price: null, change: null, changePercent: null }
    }))
    setLastFetch(Date.now())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 60_000)
    return () => clearInterval(interval)
  }, [fetchAll])

  const dataAge = Date.now() - lastFetch
  const isLive = dataAge < 120_000

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden flex flex-col">
      <div className="px-3 py-2.5 border-b border-border">
        <h3 className="text-[11px] font-bold tracking-widest text-muted-foreground/70 uppercase">
          Market Snapshot
        </h3>
        <div className="flex items-center gap-1 text-[10px] mt-0.5">
          <span className={`block w-1 h-1 rounded-full ${isLive ? "bg-up animate-blink" : "bg-muted-foreground/40"}`} />
          <span className={`font-semibold ${isLive ? "text-up" : "text-muted-foreground/50"}`}>
            {isLive ? "LIVE" : "DELAYED"}
          </span>
        </div>
      </div>

      <div className="overflow-y-auto scrollbar-thin max-h-[calc(100vh-240px)]">
        {loading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-8 mx-3 my-0.5 rounded bg-gradient-to-r from-muted/20 via-muted/40 to-muted/20 bg-[length:200%_100%] animate-shimmer" />
          ))
        ) : (
          data.map(t => (
            <PriceRow key={t.symbol} {...t} />
          ))
        )}
      </div>
    </div>
  )
}
