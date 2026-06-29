const SUMMARY_ITEMS = [
  { label: "S&P 500", price: "5,432.15", change: "+0.84%", up: true },
  { label: "NASDAQ", price: "17,145.63", change: "+1.22%", up: true },
  { label: "Dow Jones", price: "38,987.42", change: "+0.65%", up: true },
  { label: "VIX", price: "14.82", change: "-3.15%", up: false },
  { label: "Gold", price: "$2,415.30", change: "+0.52%", up: true },
  { label: "Silver", price: "$30.82", change: "-0.48%", up: false },
  { label: "Bitcoin", price: "$68,432", change: "+2.34%", up: true },
  { label: "Ethereum", price: "$3,521", change: "+1.87%", up: true },
]

export function MarketSummary() {
  return (
    <section>
      <div className="summary-grid">
        {SUMMARY_ITEMS.map((item, i) => (
          <div key={i} className="summary-card"
            style={{ animation: `fade-in-up 0.3s ease-out ${i * 0.04}s both` }}>
            <div className="summary-card-label">{item.label}</div>
            <div className="summary-card-price">{item.price}</div>
            <div className={`summary-card-change ${item.up ? "up" : "down"}`}>
              {item.change}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
