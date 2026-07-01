import { useMarketData } from "../hooks/useMarketData"
import { PriceFlash } from "./PriceFlash"

interface SummaryItem {
  label: string
  price: string
  change: string
  up: boolean
  rawPrice: number
}

export function MarketSummary() {
  const { data } = useMarketData()

  function findPrice(symbol: string, lookup: string): number {
    const items = (data as any)[lookup]
    if (!items) return 0
    const item = items.find((c: any) => c.symbol === symbol || c.name === symbol)
    return item?.price ?? 0
  }

  function findPct(symbol: string, lookup: string): number {
    const items = (data as any)[lookup]
    if (!items) return 0
    const item = items.find((c: any) => c.symbol === symbol || c.name === symbol)
    return item?.changePercent ?? 0
  }

  function fmt(price: number, isIndex: boolean) {
    if (price <= 0) return "—"
    if (isIndex) return price.toLocaleString(undefined, { maximumFractionDigits: 0 })
    if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    return `$${price.toFixed(2)}`
  }

  const items: SummaryItem[] = [
    { label: "S&P 500", price: fmt(findPrice("^GSPC", "usIndices"), true), change: `${findPct("^GSPC", "usIndices") >= 0 ? "+" : ""}${findPct("^GSPC", "usIndices").toFixed(2)}%`, up: findPct("^GSPC", "usIndices") >= 0, rawPrice: findPrice("^GSPC", "usIndices") },
    { label: "NASDAQ", price: fmt(findPrice("^IXIC", "usIndices"), true), change: `${findPct("^IXIC", "usIndices") >= 0 ? "+" : ""}${findPct("^IXIC", "usIndices").toFixed(2)}%`, up: findPct("^IXIC", "usIndices") >= 0, rawPrice: findPrice("^IXIC", "usIndices") },
    { label: "Dow Jones", price: fmt(findPrice("^DJI", "usIndices"), true), change: `${findPct("^DJI", "usIndices") >= 0 ? "+" : ""}${findPct("^DJI", "usIndices").toFixed(2)}%`, up: findPct("^DJI", "usIndices") >= 0, rawPrice: findPrice("^DJI", "usIndices") },
    { label: "VIX", price: fmt(findPrice("^VIX", "usIndices"), false), change: `${findPct("^VIX", "usIndices") >= 0 ? "+" : ""}${findPct("^VIX", "usIndices").toFixed(2)}%`, up: findPct("^VIX", "usIndices") >= 0, rawPrice: findPrice("^VIX", "usIndices") },
    { label: "Gold", price: fmt(findPrice("GC=F", "commodities"), false), change: `${findPct("GC=F", "commodities") >= 0 ? "+" : ""}${findPct("GC=F", "commodities").toFixed(2)}%`, up: findPct("GC=F", "commodities") >= 0, rawPrice: findPrice("GC=F", "commodities") },
    { label: "Silver", price: fmt(findPrice("SI=F", "commodities"), false), change: `${findPct("SI=F", "commodities") >= 0 ? "+" : ""}${findPct("SI=F", "commodities").toFixed(2)}%`, up: findPct("SI=F", "commodities") >= 0, rawPrice: findPrice("SI=F", "commodities") },
    { label: "Bitcoin", price: fmt(findPrice("BTC", "crypto"), false), change: `${findPct("BTC", "crypto") >= 0 ? "+" : ""}${findPct("BTC", "crypto").toFixed(2)}%`, up: findPct("BTC", "crypto") >= 0, rawPrice: findPrice("BTC", "crypto") },
    { label: "Ethereum", price: fmt(findPrice("ETH", "crypto"), false), change: `${findPct("ETH", "crypto") >= 0 ? "+" : ""}${findPct("ETH", "crypto").toFixed(2)}%`, up: findPct("ETH", "crypto") >= 0, rawPrice: findPrice("ETH", "crypto") },
  ]

  return (
    <section>
      <div className="summary-grid">
        {items.map((item, i) => (
          <PriceFlash key={item.label} price={item.rawPrice}>
            <div className="summary-card"
              style={{ animation: `fade-in-up 0.3s ease-out ${i * 0.04}s both` }}>
              <div className="summary-card-label">{item.label}</div>
              <div className="summary-card-price">{item.price}</div>
              <div className={`summary-card-change ${item.up ? "up" : "down"}`}>
                {item.change}
              </div>
            </div>
          </PriceFlash>
        ))}
      </div>
    </section>
  )
}
