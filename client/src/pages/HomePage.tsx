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
import { HeroBanner } from "../components/HeroBanner"
import { ScrollReveal, StaggerReveal, staggerItem } from "../components/ScrollReveal"
import { AnimatedSection } from "../components/AnimatedSection"

const SIDEBAR_SECTIONS = [
  { label: "Crypto", link: "/crypto", color: "rgba(6, 182, 212, 0.6)", icon: "⟠" },
  { label: "Stocks", link: "/stocks", color: "rgba(47, 128, 237, 0.6)", icon: "⬡" },
  { label: "Commodities", link: "/commodities", color: "rgba(240, 180, 41, 0.6)", icon: "◇" },
  { label: "IPO", link: "/ipo", color: "rgba(168, 85, 247, 0.6)", icon: "◆" },
]

const VOLATILITY_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
}

const IMPACT_LABELS: Record<string, string> = {
  "central-bank": "Central Bank", geopolitical: "Geopolitical", crisis: "Crisis",
  pandemic: "Pandemic", trade: "Trade", election: "Election", currency: "Currency",
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

const FEATURES = [
  { icon: "⟠", title: "Real-Time Data", desc: "Live market prices across crypto, stocks, commodities and forex with sub-minute updates.", gradient: "blue-purple" as const },
  { icon: "◇", title: "AI Analysis", desc: "AI-powered impact analysis with reasoning for every market-moving event.", gradient: "purple-pink" as const },
  { icon: "◈", title: "Breaking News", desc: "Curated breaking news with topic classification and volatility scoring.", gradient: "orange-red" as const },
  { icon: "⬢", title: "Market Intelligence", desc: "Comprehensive market snapshot with gainers, losers, and sector performance.", gradient: "green-teal" as const },
]

function fmtShort(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
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
    (curated.data?.articles ?? []).filter(a => Date.now() - new Date(a.publishedAt).getTime() < THREE_DAYS),
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

  return (
    <div>
      {/* ─── SECTION 1: Hero ─── */}
      <HeroBanner />

      {/* ─── SECTION 2: Features ─── */}
      <AnimatedSection
        gradient="blue-purple"
        title="Market Intelligence Platform"
        subtitle="Real-time data, AI-powered analysis, and breaking news across global markets"
        delay={0.1}
      >
        <StaggerReveal stagger={0.08}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-8">
            {FEATURES.map((f) => (
              <motion.div key={f.title} variants={staggerItem}>
                <div className="glass-section-card p-5 md:p-6">
                  <div className={`gradient-text-${f.gradient === "blue-purple" ? "blue-purple" : f.gradient === "purple-pink" ? "pink-gold" : f.gradient === "orange-red" ? "orange-red" : "green-teal"} text-2xl mb-3 inline-block`}>
                    {f.icon}
                  </div>
                  <h3 className="text-base font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </StaggerReveal>
      </AnimatedSection>

      {/* ─── SECTION 3: Side-by-Side Content ─── */}
      <AnimatedSection
        gradient="purple-pink"
        title="Live Market Dashboard"
        subtitle="Stay ahead with real-time market data and AI-powered impact analysis"
        delay={0.1}
      >
        <div className="home-layout">
          <motion.div
            className="home-left"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
          >
            <ImpactAnalysis />
          </motion.div>

          <div className="home-main">
            <ScrollReveal direction="up" delay={0.1}>
              {!articles.length ? (
                <div className="flex items-center justify-center py-16">
                  <div className="mac-panel" style={{ padding: '2.5rem', textAlign: 'center', maxWidth: '24rem' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Loading markets...</p>
                  </div>
                </div>
              ) : (
                <>
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
                        const volatility = "volatility" in a ? (a as NewsArticle).volatility : undefined
                        return (
                          <motion.button
                            key={a.id}
                            variants={{
                              hidden: { opacity: 0, y: 16, scale: 0.98 },
                              visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } },
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
                                {volatility && (
                                  <span style={{
                                    fontSize: "0.5rem", fontWeight: 600, textTransform: "uppercase",
                                    padding: "0.1rem 0.35rem", borderRadius: "4px",
                                    background: `${VOLATILITY_COLORS[volatility]}15`,
                                    border: `1px solid ${VOLATILITY_COLORS[volatility]}30`,
                                    color: VOLATILITY_COLORS[volatility], letterSpacing: "0.06em",
                                  }}>{volatility}</span>
                                )}
                                <span className="mac-meta">{fmtShort(a.publishedAt)}</span>
                              </div>
                              <div className="news-card-title">{decodeEntities(a.title)}</div>
                              {a.snippet && <div className="news-card-snippet">{decodeEntities(a.snippet)}</div>}
                            </div>
                          </motion.button>
                        )
                      })}
                    </motion.div>
                  </div>

                  <ScrollReveal direction="up" delay={0.1}>
                    <CryptoSection articles={filtered} maxArticles={4} viewAllLink="/crypto" />
                  </ScrollReveal>
                  <ScrollReveal direction="up" delay={0.15}>
                    <StockSection articles={filtered} maxArticles={4} viewAllLink="/stocks" />
                  </ScrollReveal>
                  <ScrollReveal direction="up" delay={0.2}>
                    <CommoditySection articles={filtered} maxArticles={4} viewAllLink="/commodities" />
                  </ScrollReveal>
                  <ScrollReveal direction="up" delay={0.25}>
                    <IPOSection articles={filtered} maxArticles={4} viewAllLink="/ipo" />
                  </ScrollReveal>
                </>
              )}
            </ScrollReveal>
          </div>

          <motion.div
            className="home-sidebar"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          >
            <MarketSnapshot />
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ─── SECTION 4: Markets By Category ─── */}
      <AnimatedSection
        gradient="green-teal"
        title="Explore Markets"
        subtitle="Navigate through crypto, stocks, commodities, and IPOs"
        delay={0.1}
      >
        <StaggerReveal stagger={0.06}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {SIDEBAR_SECTIONS.map((s) => (
              <motion.button
                key={s.label}
                variants={staggerItem}
                onClick={() => navigate(s.link)}
                className="glass-section-card p-6 text-left cursor-pointer"
                whileHover={{ scale: 1.03, y: -3 }}
              >
                <div style={{ fontSize: "2rem", marginBottom: "0.75rem", color: s.color }}>{s.icon}</div>
                <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{s.label}</h3>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  View all {s.label.toLowerCase()} news and market data
                </p>
              </motion.button>
            ))}
          </div>
        </StaggerReveal>
      </AnimatedSection>

      {/* ─── SECTION 5: CTA / Stats ─── */}
      <AnimatedSection
        gradient="orange-red"
        title="Your Market Command Center"
        subtitle="AI-powered insights, real-time data, and comprehensive market coverage"
        delay={0.1}
      >
        <ScrollReveal delay={0.2}>
          <div className="text-center py-8">
            <div className="gradient-divider max-w-md mx-auto mb-8" />
            <p className="text-sm md:text-base" style={{ color: 'var(--text-tertiary)' }}>
              Data refreshes every 60s · AI analysis updates every 5min · Breaking news in real-time
            </p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <span className="live-dot" />
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#22c55e' }}>Live Data Feed</span>
            </div>
          </div>
        </ScrollReveal>
      </AnimatedSection>

      {/* ─── SECTION 6: Extra full article feed for infinite scroll feel ─── */}
      {filtered.length > 6 && (
        <AnimatedSection
          gradient="pink-gold"
          title="More News"
          subtitle="Continue exploring the latest market-moving stories"
          delay={0.1}
        >
          <div className="px-2 md:px-0">
            <StaggerReveal stagger={0.03}>
              <div className="grid gap-1.5 md:gap-2">
                {filtered.slice(3, 12).map((a) => (
                  <motion.button
                    key={a.id}
                    variants={staggerItem as any}
                    onClick={() => handleTopStoryClick(a.url)}
                    className="news-card w-full text-left cursor-pointer"
                  >
                    <div className="news-card-img-wrap" style={{ width: 72, minWidth: 72, height: 72 }}>
                      {a.imageUrl && (
                        <img src={a.imageUrl.replace(/&amp;/g, "&")} alt="" className="news-card-img" loading="lazy" />
                      )}
                    </div>
                    <div className="news-card-body">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="mac-source">{a.source}</span>
                        <span className="mac-meta">{fmtShort(a.publishedAt)}</span>
                      </div>
                      <div className="news-card-title">{decodeEntities(a.title)}</div>
                      {a.snippet && <div className="news-card-snippet">{decodeEntities(a.snippet)}</div>}
                    </div>
                  </motion.button>
                ))}
              </div>
            </StaggerReveal>
          </div>
        </AnimatedSection>
      )}

      {/* ─── SECTION 7: Final CTA / Footer Banner ─── */}
      <AnimatedSection
        gradient="blue-purple"
        title="Built for Traders & Analysts"
        subtitle="Real-time market intelligence with AI-powered analysis — all in one terminal"
        delay={0.1}
        fullHeight={false}
      >
        <ScrollReveal delay={0.3}>
          <div className="text-center py-6">
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <span className="feature-badge"><span className="live-dot" />Real-time</span>
              <span className="feature-badge" style={{ borderColor: 'rgba(180,140,255,0.2)', background: 'rgba(180,140,255,0.06)', color: '#b48cff' }}>AI-Powered</span>
              <span className="feature-badge" style={{ borderColor: 'rgba(255,100,180,0.2)', background: 'rgba(255,100,180,0.06)', color: '#ff64b4' }}>Multi-Market</span>
              <span className="feature-badge" style={{ borderColor: 'rgba(34,197,94,0.2)', background: 'rgba(34,197,94,0.06)', color: '#22c55e' }}>24/7 Live</span>
            </div>
          </div>
        </ScrollReveal>
      </AnimatedSection>
    </div>
  )
}
