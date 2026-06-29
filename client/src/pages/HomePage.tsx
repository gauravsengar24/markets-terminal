import { useMemo, useState } from "react"
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
import { ImpactAnalysis } from "../components/ImpactAnalysis"
import { MarketSnapshot } from "../components/MarketSnapshot"
import { HeroBanner } from "../components/HeroBanner"
import { SignalChip } from "../components/SignalChip"

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

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

const TABS = ["All", "Market", "Crypto", "Stocks", "Commodities", "IPO"]

export function HomePage() {
  const navigate = useNavigate()
  const { articles, selectedImpact } = useOutletContext<LayoutContext>()
  const [activeTab, setActiveTab] = React.useState("All")

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
    (curated.data?.articles ?? []).filter(a => Date.now() - new Date(a.publishedAt).getTime() < THREE_DAYS),
    [curated.data?.articles]
  )

  const leadArticle = useMemo(() => {
    const all = [...filtered].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    return all[0] || null
  }, [filtered])

  const timeline = useMemo(() => {
    const all = [...filtered].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    return all.slice(0, 5).filter(a => a.id !== leadArticle?.id)
  }, [filtered, leadArticle])

  const trendingArticles = useMemo(() => {
    let result = [...filtered]
    result.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

    if (activeTab === "Crypto") result = result.filter(a => a.subCategory === "crypto" || a.assetClass === "crypto")
    else if (activeTab === "Stocks") result = result.filter(a => a.subCategory === "stocks" && a.assetClass !== "crypto")
    else if (activeTab === "Commodities") result = result.filter(a => a.subCategory === "commodities" || a.assetClass === "commodities")
    else if (activeTab === "IPO") result = result.filter(a => a.subCategory === "ipo")

    return result.slice(0, 8)
  }, [filtered, activeTab])

  const handleArticleClick = (url: string) => {
    const found = articles.find(a => a.url === url)
    if (found) navigate(`/article/${found.id}`)
    else window.open(url, "_blank", "noopener")
  }

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-6">
      <HeroBanner />

      {/* Split Featured Section */}
      <section className="mb-6 md:mb-8">
        <div className="flex items-center gap-2 mb-3 md:mb-4 px-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-brand)" }} />
          <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-text-tertiary)" }}>
            Top Stories
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Lead Article */}
          {leadArticle && (
            <motion.button
              className="lg:col-span-2 text-left cursor-pointer bg-transparent border-none p-0 group"
              onClick={() => handleArticleClick(leadArticle.url)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                className="relative overflow-hidden rounded-xl mb-3"
                style={{ aspectRatio: "16/9", background: "linear-gradient(135deg, #1a1a2e, #0a0a1a)" }}
              >
                {leadArticle.imageUrl && (
                  <img
                    src={leadArticle.imageUrl.replace(/&amp;/g, "&")}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    style={{ position: "absolute", inset: 0 }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{ background: "var(--color-brand-soft)", color: "var(--color-brand)" }}>
                  {leadArticle.source}
                </span>
                {leadArticle.volatility && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{
                      background: leadArticle.volatility === "high" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                      color: leadArticle.volatility === "high" ? "#ef4444" : "#f59e0b",
                    }}>
                    {leadArticle.volatility}
                  </span>
                )}
                <span className="text-[10px]" style={{ color: "var(--color-text-tertiary)" }}>
                  {fmtRelative(leadArticle.publishedAt)}
                </span>
              </div>
              <h3 className="text-lg md:text-xl font-bold leading-tight mb-1.5 transition-colors"
                style={{ color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
                {decodeEntities(leadArticle.title)}
              </h3>
              {leadArticle.snippet && (
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {decodeEntities(leadArticle.snippet)}
                </p>
              )}
            </motion.button>
          )}

          {/* Timeline */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 mb-2 px-1">
              <h3 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--color-text-tertiary)" }}>
                Latest Updates
              </h3>
            </div>
            {timeline.slice(0, 5).map((article, i) => (
              <motion.button
                key={article.id}
                className="w-full text-left cursor-pointer bg-transparent border-none p-0 group"
                onClick={() => handleArticleClick(article.url)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              >
                <div
                  className="flex items-start gap-2.5 px-2 py-2 rounded-lg transition-colors"
                  style={{ borderLeft: "2px solid var(--glass-border)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderLeftColor = "var(--color-brand)" }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderLeftColor = "var(--glass-border)" }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] font-medium" style={{ color: "var(--color-text-tertiary)" }}>
                        {article.source}
                      </span>
                      <span className="text-[9px]" style={{ color: "var(--color-text-tertiary)" }}>
                        {fmtRelative(article.publishedAt)}
                      </span>
                    </div>
                    <p className="text-xs font-medium leading-snug transition-colors line-clamp-2"
                      style={{ color: "var(--color-text-secondary)" }}>
                      {decodeEntities(article.title)}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Three Column Content */}
      <section className="mb-6 md:mb-8">
        <div className="flex items-center gap-2 mb-3 md:mb-4 px-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-soft-purple)" }} />
          <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-text-tertiary)" }}>
            Markets Overview
          </h2>
        </div>
        <div className="home-layout">
          <div className="home-left">
            <ImpactAnalysis />
          </div>
          <div className="home-main">
            {/* Tabbed Trending */}
            <div className="mb-4">
              <div className="flex items-center gap-1 mb-3 overflow-x-auto scrollbar-none" style={{ scrollbarWidth: "none" }}>
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="text-xs font-medium px-2.5 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap bg-transparent border-none"
                    style={{
                      color: activeTab === tab ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                      background: activeTab === tab ? "rgba(255,255,255,0.06)" : "transparent",
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                {trendingArticles.map((a, i) => {
                  const curated = "topics" in a ? (a as CuratedArticle) : null
                  const topic = curated?.topics?.[0]
                  const volatility = "volatility" in a ? (a as NewsArticle).volatility : undefined
                  return (
                    <motion.button
                      key={a.id}
                      onClick={() => handleArticleClick(a.url)}
                      className="news-card w-full text-left cursor-pointer"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.03 }}
                    >
                      <div className="news-card-img-wrap" style={{ width: 80, minWidth: 80, height: 60 }}>
                        {a.imageUrl && (
                          <img src={a.imageUrl.replace(/&amp;/g, "&")} alt="" className="news-card-img" loading="lazy" />
                        )}
                      </div>
                      <div className="news-card-body">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          {topic && (
                            <span style={{
                              fontSize: "0.45rem", fontWeight: 700, textTransform: "uppercase",
                              padding: "0.05rem 0.3rem", borderRadius: "3px", letterSpacing: "0.06em",
                              background: `${TOPIC_COLORS[topic] || "#64748b"}15`,
                              border: `1px solid ${TOPIC_COLORS[topic] || "#64748b"}30`,
                              color: TOPIC_COLORS[topic] || "#64748b",
                            }}>{TOPIC_LABELS[topic] || topic}</span>
                          )}
                          <span className="mac-source">{a.source}</span>
                          {volatility && (
                            <span style={{
                              fontSize: "0.45rem", fontWeight: 700, textTransform: "uppercase",
                              padding: "0.05rem 0.3rem", borderRadius: "3px",
                              background: `${VOLATILITY_COLORS[volatility]}12`,
                              border: `1px solid ${VOLATILITY_COLORS[volatility]}25`,
                              color: VOLATILITY_COLORS[volatility],
                            }}>{volatility}</span>
                          )}
                          <span className="mac-meta">{fmtRelative(a.publishedAt)}</span>
                        </div>
                        <div className="news-card-title" style={{ fontSize: "0.9rem" }}>{decodeEntities(a.title)}</div>
                        {a.snippet && <div className="news-card-snippet" style={{ fontSize: "0.78rem" }}>{decodeEntities(a.snippet)}</div>}
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Market Sections */}
            <CryptoSection articles={filtered} maxArticles={3} viewAllLink="/crypto" />
            <StockSection articles={filtered} maxArticles={3} viewAllLink="/stocks" />
            <CommoditySection articles={filtered} maxArticles={3} viewAllLink="/commodities" />
            <IPOSection articles={filtered} maxArticles={3} viewAllLink="/ipo" />
          </div>
          <div className="home-sidebar">
            <MarketSnapshot />
          </div>
        </div>
      </section>
    </div>
  )
}

const VOLATILITY_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
}
