import { useMemo } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import type { NewsArticle, LayoutContext, CuratedArticle } from "@shared/types"
import { fetchCuratedBreakingNews } from "../lib/api"
import { decodeEntities } from "../lib/format"
import { CryptoSection } from "../components/CryptoSection"
import { StockSection } from "../components/StockSection"
import { CommoditySection } from "../components/CommoditySection"
import { IPOSection } from "../components/IPOSection"
import { SectionHeading } from "../components/SectionHeading"
import { ImpactAnalysis } from "../components/ImpactAnalysis"
import { MarketSnapshot } from "../components/MarketSnapshot"

const SIDEBAR_SECTIONS = [
  { label: "Crypto", link: "/crypto", color: "rgba(6, 182, 212, 0.6)" },
  { label: "Stocks", link: "/stocks", color: "rgba(47, 128, 237, 0.6)" },
  { label: "Commodities", link: "/commodities", color: "rgba(240, 180, 41, 0.6)" },
  { label: "IPO", link: "/ipo", color: "rgba(168, 85, 247, 0.6)" },
]

const VOLATILITY_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
}

const IMPACT_LABELS: Record<string, string> = {
  "central-bank": "Central Bank",
  geopolitical: "Geopolitical",
  crisis: "Crisis",
  pandemic: "Pandemic",
  trade: "Trade",
  election: "Election",
  currency: "Currency",
}

const TOPIC_LABELS: Record<string, string> = {
  "tech-founder": "TECH", "politics-leader": "POLITICS", "ipo": "IPO",
  "war-conflict": "CONFLICT", "crypto-defi": "DeFi", "crypto-regulation": "REGULATION",
  "trending": "TRENDING", "markets": "MARKETS",
}

const TOPIC_COLORS: Record<string, string> = {
  "tech-founder": "#60cdff", "politics-leader": "#f59e0b", "ipo": "#22c55e",
  "war-conflict": "#ef4444", "crypto-defi": "#a78bfa", "crypto-regulation": "#f472b6",
  "trending": "#f97316", "markets": "#34d399",
}

export function HomePage() {
  const navigate = useNavigate()
  const { articles, selectedImpact } = useOutletContext<LayoutContext>()
  const handleTopStoryClick = (url: string) => {
    const found = articles.find(a => a.url === url)
    if (found) navigate(`/article/${found.id}`)
    else window.open(url, "_blank", "noopener")
  }

  const THREE_DAYS = 72 * 60 * 60 * 1000

  const curated = useQuery({
    queryKey: ["breaking-news-curated"],
    queryFn: () => fetchCuratedBreakingNews() as Promise<{ articles: CuratedArticle[] }>,
    staleTime: 0,
  })

  const filtered = useMemo(() => {
    let result = articles.filter(a => Date.now() - new Date(a.publishedAt).getTime() < THREE_DAYS)
    if (selectedImpact !== "all") {
      result = result.filter(a => a.impactCategory === selectedImpact)
    }
    return result
  }, [articles, selectedImpact])

  const curatedArticles = useMemo(() =>
    (curated.data?.articles ?? []).filter(
      a => Date.now() - new Date(a.publishedAt).getTime() < THREE_DAYS
    ),
    [curated.data?.articles]
  )
  const topArticles = useMemo(() => {
    if (curatedArticles.length >= 3) {
      const withTime = curatedArticles.map(a => ({ a, t: new Date(a.publishedAt).getTime() }))
      withTime.sort((a, b) => b.t - a.t)
      return withTime.slice(0, 3).map(({ a }) => a)
    }
    const withTime = filtered.map(a => ({ a, t: new Date(a.publishedAt).getTime() }))
    withTime.sort((a, b) => b.t - a.t)
    return withTime.slice(0, 3).map(({ a }) => a)
  }, [curatedArticles, filtered])

  if (!articles.length) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '50vh' }}>
        <div className="mac-panel" style={{ padding: '2.5rem', textAlign: 'center', maxWidth: '24rem' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Loading markets...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0.5rem 0' }}>
      <div className="home-layout">
        <motion.div
          className="home-left"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        >
          <ImpactAnalysis />
        </motion.div>
        <div className="home-main">
            <div className="mb-4 md:mb-5">
            <div className="flex items-center gap-2 px-2 md:px-5 mb-1.5 md:mb-2">
              <div className="mac-dot" style={{ background: 'rgba(6, 182, 212, 0.8)' }} />
              <h2 className="mac-section-title">
                {selectedImpact === "all" ? "Top Stories" : `${IMPACT_LABELS[selectedImpact] ?? "Top"} Stories`}
              </h2>
              <span className="mac-count-badge">{filtered.length}</span>
            </div>
            <motion.div
              className="px-2 md:px-5 grid gap-2"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
            >
              {topArticles.map((a) => {
                const curated = "topics" in a ? (a as CuratedArticle) : null
                const topic = curated?.topics?.[0]
                return (
                  <motion.button
                    key={a.id}
                    variants={{
                      hidden: { opacity: 0, y: 16, scale: 0.98 },
                      visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
                    }}
                    onClick={() => handleTopStoryClick(a.url)}
                    className="news-card w-full text-left cursor-pointer"
                  >
                  <div className="news-card-img-wrap">
                    {a.imageUrl && (
                      <img src={a.imageUrl.replace(/&amp;/g, "&")} alt="" className="news-card-img" loading="lazy" />
                    )}
                  </div>
                  <div className="news-card-body">
                    <div className="flex items-center gap-2 mb-1.5">
                      {topic && (
                        <span style={{
                          fontSize: "0.5rem", fontWeight: 600, textTransform: "uppercase",
                          padding: "0.1rem 0.35rem", borderRadius: "4px", letterSpacing: "0.06em",
                          background: `${TOPIC_COLORS[topic] || "#64748b"}20`,
                          border: `1px solid ${TOPIC_COLORS[topic] || "#64748b"}40`,
                          color: TOPIC_COLORS[topic] || "#64748b",
                        }}>{TOPIC_LABELS[topic] || topic.toUpperCase()}</span>
                      )}
                      <span className="mac-source">{a.source}</span>
                      {a.volatility && (
                        <span
                          style={{
                            fontSize: "0.5rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            padding: "0.1rem 0.35rem",
                            borderRadius: "4px",
                            background: `${VOLATILITY_COLORS[a.volatility]}15`,
                            border: `1px solid ${VOLATILITY_COLORS[a.volatility]}30`,
                            color: VOLATILITY_COLORS[a.volatility],
                            letterSpacing: "0.06em",
                          }}
                        >
                          {a.volatility}
                        </span>
                      )}
                      <span className="mac-meta">{fmtShort(a.publishedAt)}</span>
                    </div>
                    <div className="news-card-title">{decodeEntities(a.title)}</div>
                    {a.snippet && (
                      <div className="news-card-snippet">{decodeEntities(a.snippet)}</div>
                    )}
                  </div>
                </motion.button>
              )})}
            </motion.div>
          </div>

          <CryptoSection articles={filtered} maxArticles={4} viewAllLink="/crypto" />
          <StockSection articles={filtered} maxArticles={4} viewAllLink="/stocks" />
          <CommoditySection articles={filtered} maxArticles={4} viewAllLink="/commodities" />
          <IPOSection articles={filtered} maxArticles={4} viewAllLink="/ipo" />
        </div>

        <motion.div
          className="home-sidebar"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        >
          <MarketSnapshot />
        </motion.div>
      </div>
    </div>
  )
}

function fmtShort(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
