import { useState } from "react"
import { useMarketData } from "../hooks/useMarketData"

export function MarketMovers() {
  const [tab, setTab] = useState<"gainers" | "losers">("gainers")
  const { data } = useMarketData()

  const gainers = data.usGainers ?? []
  const losers = data.usLosers ?? []

  const items = tab === "gainers" ? gainers : losers

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
      {items.length > 0 ? (
        <div className="data-table-container">
          <table className="movers-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th style={{ textAlign: "right" }}>Price</th>
                <th style={{ textAlign: "right" }}>Change</th>
                <th style={{ textAlign: "right" }}>%</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.symbol} style={{ animation: `fade-in-up 0.3s ease-out ${i * 0.04}s both` }}>
                  <td style={{ fontWeight: 600 }}>{item.symbol}</td>
                  <td style={{ color: "var(--color-text-tertiary)", fontSize: "0.75rem" }}>{item.name}</td>
                  <td style={{ textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                    ${item.price.toFixed(2)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span className={`movers-change ${tab === "gainers" ? "up" : "down"}`}>
                      {item.change >= 0 ? "+" : ""}{item.change.toFixed(2)}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span className={`movers-change ${tab === "gainers" ? "up" : "down"}`}>
                      {item.changePercent >= 0 ? "+" : ""}{item.changePercent.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ padding: "1.5rem 0", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: "0.8125rem" }}>
          Loading movers...
        </div>
      )}
    </section>
  )
}
