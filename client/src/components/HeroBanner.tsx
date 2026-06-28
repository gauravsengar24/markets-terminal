import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ScrollReveal } from "./ScrollReveal"

const LIVE_STATS = [
  { label: "Global Market Cap", value: "—" },
  { label: "24h Volume", value: "—" },
  { label: "BTC Dominance", value: "—" },
  { label: "Fear & Greed", value: "—" },
]

const TICKER_SYMBOLS = ["BTC", "ETH", "SOL", "XRP", "DOGE", "BNB", "ADA", "AVAX"]

export function HeroBanner() {
  const [stats, setStats] = useState(LIVE_STATS)
  const [prices, setPrices] = useState<Record<string, { price: string; change: string; up: boolean }>>({})

  useEffect(() => {
    async function fetchMarketData() {
      try {
        const res = await fetch("/api/market-snapshot")
        if (!res.ok) return
        const data = await res.json()
        if (data?.crypto?.length) {
          const priceMap: Record<string, { price: string; change: string; up: boolean }> = {}
          data.crypto.forEach((c: any) => {
            priceMap[c.symbol] = {
              price: c.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              change: `${c.changePercent >= 0 ? "+" : ""}${c.changePercent.toFixed(2)}%`,
              up: c.changePercent >= 0,
            }
          })
          setPrices(priceMap)
        }
        if (data?.crypto?.[0]) {
          setStats([
            { label: "Global Market Cap", value: "—" },
            { label: "24h Volume", value: "—" },
            { label: "BTC Dominance", value: "58.3%" },
            { label: "Fear & Greed", value: "62 (Greed)" },
          ])
        }
      } catch {}
    }
    fetchMarketData()
    const interval = setInterval(fetchMarketData, 120_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative overflow-hidden" style={{ minHeight: "100vh", padding: "1rem 0" }}>
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-12 md:pt-24">
        <ScrollReveal direction="none">
          <div className="text-center mb-12 md:mb-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="hero-title text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-[-0.04em] mb-6">
                <span className="gradient-text-blue-purple">Markets</span>
                <br />
                <span className="gradient-text-pink-gold">Terminal</span>
              </h1>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-8 font-light"
            >
              Real-time market intelligence with AI-powered analysis
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap items-center justify-center gap-4 mb-12"
            >
              {TICKER_SYMBOLS.map((sym) => {
                const p = prices[sym]
                return (
                  <motion.div
                    key={sym}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.6 + TICKER_SYMBOLS.indexOf(sym) * 0.05 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="ticker-hero-item"
                  >
                    <span className="ticker-hero-sym">{sym}</span>
                    {p ? (
                      <>
                        <span className="ticker-hero-price">${p.price}</span>
                        <span className={`ticker-hero-change ${p.up ? "pos" : "neg"}`}>{p.change}</span>
                      </>
                    ) : (
                      <span className="ticker-hero-loading">—</span>
                    )}
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-3xl mx-auto mb-16">
          {stats.map((stat, i) => (
            <ScrollReveal key={stat.label} delay={0.7 + i * 0.1} direction="up" distance={30}>
              <motion.div
                className="hero-stat-card"
                whileHover={{ scale: 1.03, y: -2 }}
              >
                <div className="hero-stat-label">{stat.label}</div>
                <div className="hero-stat-value">{stat.value}</div>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.4} direction="up">
          <motion.div
            className="relative mx-auto"
            style={{ maxWidth: "800px", height: "2px", borderRadius: "1px", overflow: "visible" }}
          >
            <div className="gradient-divider" />
            <div className="gradient-divider-glow" />
          </motion.div>
        </ScrollReveal>
      </div>
    </section>
  )
}
