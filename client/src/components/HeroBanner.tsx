import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ScrollReveal } from "./ScrollReveal"

interface GlobalStats {
  totalMarketCap: number
  totalVolume: number
  btcDominance: number
  fearGreed: number
  fearGreedLabel: string
}

interface TickerPrice {
  symbol: string
  name: string
  price: string
  change: string
  up: boolean
}

function formatLargeNumber(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
  return `$${num.toFixed(2)}`
}

export function HeroBanner() {
  const [stats, setStats] = useState<GlobalStats | null>(null)
  const [prices, setPrices] = useState<TickerPrice[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [snapRes, statsRes] = await Promise.all([
          fetch("/api/market-snapshot"),
          fetch("/api/global-stats"),
        ])
        if (snapRes.ok) {
          const data = await snapRes.json()
          if (data?.crypto?.length) {
            const top = [...data.crypto].sort((a: any, b: any) => (b.price || 0) - (a.price || 0)).slice(0, 20)
            setPrices(
              top.map((c: any) => ({
                symbol: c.symbol,
                name: c.name,
                price: c.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }),
                change: `${c.changePercent >= 0 ? "+" : ""}${c.changePercent.toFixed(2)}%`,
                up: c.changePercent >= 0,
              }))
            )
          }
        }
        if (statsRes.ok) {
          setStats(await statsRes.json())
        }
      } catch {}
    }
    fetchData()
    const interval = setInterval(fetchData, 60_000)
    return () => clearInterval(interval)
  }, [])

  const statItems = stats
    ? [
        { label: "Global Market Cap", value: formatLargeNumber(stats.totalMarketCap), detail: "" },
        { label: "24h Volume", value: formatLargeNumber(stats.totalVolume), detail: "" },
        { label: "BTC Dominance", value: `${stats.btcDominance.toFixed(1)}%`, detail: "" },
        { label: "Fear & Greed", value: `${stats.fearGreed}`, detail: stats.fearGreedLabel },
      ]
    : [
        { label: "Global Market Cap", value: "—", detail: "" },
        { label: "24h Volume", value: "—", detail: "" },
        { label: "BTC Dominance", value: "—", detail: "" },
        { label: "Fear & Greed", value: "—", detail: "" },
      ]

  return (
    <section className="relative overflow-hidden" style={{ minHeight: "100vh", padding: "1rem 0" }}>
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-12 md:pt-24">
        <ScrollReveal direction="none">
          <div className="text-center mb-10 md:mb-14">
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
              className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-8 font-light"
            >
              Real-time market intelligence with AI-powered analysis
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap items-center justify-center gap-3 mb-12 max-w-5xl mx-auto"
            >
              {prices.map((p, i) => (
                <motion.div
                  key={p.symbol}
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.6 + i * 0.035, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  className="ticker-hero-item animate-ticker-float"
                  style={{ animationDelay: `${(i % 8) * 0.4}s` }}
                >
                  <span className="ticker-hero-sym">{p.symbol}</span>
                  <span className="ticker-hero-price">${p.price}</span>
                  <span className={`ticker-hero-change ${p.up ? "pos" : "neg"}`}>{p.change}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-3xl mx-auto mb-16">
          {statItems.map((stat, i) => (
            <ScrollReveal key={stat.label} delay={0.7 + i * 0.1} direction="up" distance={30}>
              <motion.div className="hero-stat-card" whileHover={{ scale: 1.03, y: -2 }}>
                <div className="hero-stat-label">{stat.label}</div>
                <div className="hero-stat-value">
                  {stat.value}
                  {stat.detail && <span className="hero-stat-detail">{stat.detail}</span>}
                </div>
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
