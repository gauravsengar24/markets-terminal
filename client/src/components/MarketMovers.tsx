import { useState } from "react"

const GAINERS = [
  { symbol: "NVDA", name: "NVIDIA Corp", price: 128.45, change: 5.82, changePct: 4.75, volume: "45.2M" },
  { symbol: "AAPL", name: "Apple Inc", price: 218.30, change: 6.15, changePct: 2.90, volume: "38.1M" },
  { symbol: "META", name: "Meta Platforms", price: 512.75, change: 12.30, changePct: 2.46, volume: "22.8M" },
  { symbol: "AMZN", name: "Amazon.com", price: 198.20, change: 4.10, changePct: 2.11, volume: "31.5M" },
  { symbol: "GOOGL", name: "Alphabet Inc", price: 175.90, change: 3.25, changePct: 1.88, volume: "18.7M" },
]

const LOSERS = [
  { symbol: "INTC", name: "Intel Corp", price: 32.15, change: -2.45, changePct: -7.08, volume: "52.3M" },
  { symbol: "TSLA", name: "Tesla Inc", price: 245.80, change: -8.60, changePct: -3.38, volume: "42.6M" },
  { symbol: "AMD", name: "AMD", price: 158.30, change: -4.20, changePct: -2.58, volume: "28.4M" },
  { symbol: "BA", name: "Boeing Co", price: 185.40, change: -3.75, changePct: -1.98, volume: "12.1M" },
  { symbol: "NKE", name: "Nike Inc", price: 92.50, change: -1.65, changePct: -1.75, volume: "15.8M" },
]

export function MarketMovers() {
  const [tab, setTab] = useState<"gainers" | "losers">("gainers")
  const items = tab === "gainers" ? GAINERS : LOSERS

  return (
    <section>
      <h2 className="section-heading" style={{ marginBottom: 0 }}>
        Market Movers
      </h2>
      <div className="movers-tabs">
        <button className={`movers-tab${tab === "gainers" ? " active" : ""}`} onClick={() => setTab("gainers")}>
          Top Gainers
        </button>
        <button className={`movers-tab${tab === "losers" ? " active" : ""}`} onClick={() => setTab("losers")}>
          Top Losers
        </button>
      </div>
      <div className="data-table-container">
        <table className="movers-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Name</th>
              <th style={{ textAlign: "right" }}>Price</th>
              <th style={{ textAlign: "right" }}>Change</th>
              <th style={{ textAlign: "right" }}>%</th>
              <th style={{ textAlign: "right" }}>Volume</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} style={{ animation: `fade-in-up 0.3s ease-out ${i * 0.04}s both` }}>
                <td style={{ fontWeight: 600 }}>{item.symbol}</td>
                <td style={{ color: "var(--color-text-tertiary)", fontSize: "0.75rem" }}>{item.name}</td>
                <td style={{ textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  ${item.price.toFixed(2)}
                </td>
                <td style={{ textAlign: "right" }}>
                  <span className={`movers-change ${tab === "gainers" ? "up" : "down"}`}>
                    {tab === "gainers" ? "+" : ""}{item.change.toFixed(2)}
                  </span>
                </td>
                <td style={{ textAlign: "right" }}>
                  <span className={`movers-change ${tab === "gainers" ? "up" : "down"}`}>
                    {tab === "gainers" ? "+" : ""}{item.changePct.toFixed(2)}%
                  </span>
                </td>
                <td style={{ textAlign: "right", color: "var(--color-text-tertiary)", fontSize: "0.75rem" }}>
                  {item.volume}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
