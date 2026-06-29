import { useMemo } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import type { NewsArticle, LayoutContext, CuratedArticle } from "@shared/types"
import { fetchCuratedBreakingNews } from "../lib/api"
import { decodeEntities } from "../lib/format"
import { PriceChart } from "../components/PriceChart"
import { MarketMovers } from "../components/MarketMovers"
import { MarketTimer } from "../components/MarketTimer"
import { MarketSummary } from "../components/MarketSummary"
import { TrendingTopics } from "../components/TrendingTopics"
import { SearchBar } from "../components/SearchBar"

const SPOT_METALS_DATA = [
  { name: "Gold", symbol: "XAU", bid: "2,415.30", ask: "2,416.10", change: "+12.40", changePct: "+0.52%", up: true },
  { name: "Silver", symbol: "XAG", bid: "30.82", ask: "30.87", change: "-0.15", changePct: "-0.48%", up: false },
  { name: "Platinum", symbol: "XPT", bid: "1,045.00", ask: "1,050.00", change: "+5.20", changePct: "+0.50%", up: true },
  { name: "Palladium", symbol: "XPD", bid: "982.00", ask: "987.00", change: "-8.50", changePct: "-0.86%", up: false },
]

const KITCO_INDICES = [
  { name: "XAU Index", value: "128.45", change: "+0.38%", up: true },
  { name: "HUI Index", value: "295.60", change: "-0.22%", up: false },
  { name: "KGX", value: "1,842.70", change: "+0.45%", up: true },
]

const CRYPTO_QUOTES = [
  { name: "Bitcoin", symbol: "BTC", price: "$68,432", change: "+2.34%", up: true },
  { name: "Ethereum", symbol: "ETH", price: "$3,521", change: "+1.87%", up: true },
  { name: "Solana", symbol: "SOL", price: "$148.25", change: "-0.62%", up: false },
  { name: "XRP", symbol: "XRP", price: "$0.54", change: "+1.15%", up: true },
]

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return "Just now"
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function HomePage() {
  const navigate = useNavigate()
  const { articles } = useOutletContext<LayoutContext>()

  const THREE_DAYS = 72 * 60 * 60 * 1000

  const curated = useQuery({
    queryKey: ["breaking-news-curated"],
    queryFn: () => fetchCuratedBreakingNews() as Promise<{ articles: CuratedArticle[] }>,
    staleTime: 0,
  })

  const active = useMemo(() =>
    articles.filter(a => Date.now() - new Date(a.publishedAt).getTime() < THREE_DAYS),
    [articles]
  )

  const latestArticles = useMemo(() => {
    const all = [...active].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    return all.slice(0, 5)
  }, [active])

  const curatedArticles = useMemo(() =>
    (curated.data?.articles ?? []).filter(a => Date.now() - new Date(a.publishedAt).getTime() < THREE_DAYS),
    [curated.data?.articles]
  )

  const sidebarArticles = useMemo(() => {
    const all = [...curatedArticles, ...active]
    const seen = new Set<string>()
    return all.filter(a => {
      if (seen.has(a.url)) return false
      seen.add(a.url)
      return true
    }).slice(0, 5)
  }, [curatedArticles, active])

  const cryptoArticles = useMemo(() =>
    active.filter(a => a.subCategory === "crypto" || a.assetClass === "crypto").slice(0, 3),
    [active]
  )

  const handleClick = (url: string) => {
    const found = articles.find(a => a.url === url)
    if (found) navigate(`/article/${found.id}`)
    else window.open(url, "_blank", "noopener")
  }

  return (
    <div className="container-main" style={{ paddingTop: "1.5rem", paddingBottom: "2rem" }}>
      {/* Market Summary — Full Width */}
      <MarketSummary />

      <div className="section-divider" />

      {/* Spot Prices Hero — Full Width */}
      <section className="full-width-section spot-hero" style={{ paddingTop: "1.5rem", paddingBottom: "2rem", marginBottom: "2rem" }}>
        <div className="container-main">
          <div className="spot-hero-grid" style={{ animation: "fade-in-up 0.5s ease-out" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                <h2 style={{ fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.6)", margin: 0 }}>
                  Live Spot Prices
                </h2>
                <span className="spot-market-dot open" style={{ marginLeft: "0.25rem" }} />
                <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>Market Open</span>
                <div style={{ marginLeft: "auto" }}>
                  <SearchBar placeholder="Search markets, news..." />
                </div>
              </div>
              <div className="spot-cards">
                {SPOT_METALS_DATA.map((metal, i) => (
                  <div key={i} className="spot-card" style={{ animation: `fade-in-up 0.4s ease-out ${i * 0.08}s both` }}>
                    <div className="spot-card-header">
                      <span className="spot-card-name">{metal.name}</span>
                      <span className="spot-card-symbol">{metal.symbol}</span>
                    </div>
                    <div className="spot-card-price">${metal.bid}</div>
                    <div className="spot-card-footer">
                      <span className={`spot-item-change ${metal.up ? "price-up" : "price-down"}`}>
                        {metal.up ? "▲" : "▼"} {metal.changePct}
                      </span>
                      <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.4)" }}>
                        Bid {metal.bid} / Ask {metal.ask}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="indices-panel">
              <h3 className="indices-panel-title">Mining Indices</h3>
              {KITCO_INDICES.map((idx, i) => (
                <div key={i} className="index-row" style={{ animation: `fade-in-up 0.3s ease-out ${i * 0.06}s both` }}>
                  <span className="index-row-name">{idx.name}</span>
                  <div className="index-row-value">
                    <div className="index-row-price">{idx.value}</div>
                    <div className={`index-row-change ${idx.up ? "price-up" : "price-down"}`}>{idx.change}</div>
                  </div>
                </div>
              ))}
              <div className="indices-footer">
                <div className="indices-footer-row">
                  <span>Gold/Oz</span>
                  <span className="indices-footer-value">$2,415.30</span>
                </div>
                <div className="indices-footer-row">
                  <span>Silver/Oz</span>
                  <span className="indices-footer-value">$30.82</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two-Column Layout: News + MarketMovers */}
      <div className="kitco-grid">
        <div className="content-main" style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>

          {/* Latest News */}
          <section>
            <h2 style={{
              fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.08em", color: "var(--color-text-secondary)",
              paddingBottom: "0.5rem", borderBottom: "2px solid var(--color-border)",
              marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem"
            }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-gold)", flexShrink: 0 }} />
              Latest News
            </h2>
            {latestArticles.length > 0 ? (
              <div className="animate-stagger">
                {latestArticles.map((a) => (
                  <button key={a.id} onClick={() => handleClick(a.url)} className="news-list-item">
                    <div className="news-list-item-header">
                      <span style={{
                        fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase",
                        letterSpacing: "0.05em", padding: "0.125rem 0.5rem", borderRadius: "3px",
                        background: "var(--color-surface-muted)", color: "var(--color-text-secondary)"
                      }}>
                        {a.source}
                      </span>
                      <span style={{
                        fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase",
                        letterSpacing: "0.05em", padding: "0.125rem 0.5rem", borderRadius: "3px",
                        background: "var(--color-surface-muted)", color: "var(--color-text-secondary)"
                      }}>
                        {a.subCategory || a.assetClass}
                      </span>
                    </div>
                    <h3 className="news-list-item-title">{decodeEntities(a.title)}</h3>
                    <div className="news-list-item-meta">
                      <span>{a.source}</span>
                      <span>·</span>
                      <time>{fmtRelative(a.publishedAt)}</time>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ padding: "2rem 0", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: "0.875rem" }}>
                Loading latest news...
              </div>
            )}
            <button onClick={() => navigate("/news")} className="view-all-link" style={{ marginTop: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.25rem", fontWeight: 600 }}>
              More News →
            </button>
          </section>

          {/* Price Chart */}
          <PriceChart />

          {/* Crypto Market Table */}
          <section>
            <h2 style={{
              fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.08em", color: "var(--color-text-secondary)",
              paddingBottom: "0.5rem", borderBottom: "2px solid var(--color-border)",
              marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem"
            }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-gold)", flexShrink: 0 }} />
              Cryptocurrency Market
            </h2>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Symbol</th>
                    <th style={{ textAlign: "right" }}>Price</th>
                    <th style={{ textAlign: "right" }}>24h Change</th>
                  </tr>
                </thead>
                <tbody>
                  {CRYPTO_QUOTES.map((coin, i) => (
                    <tr key={i} style={{ animation: `fade-in-up 0.3s ease-out ${i * 0.06}s both` }}>
                      <td style={{ fontWeight: 600 }}>{coin.name}</td>
                      <td style={{ color: "var(--color-text-tertiary)" }}>{coin.symbol}</td>
                      <td style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", textAlign: "right" }}>{coin.price}</td>
                      <td style={{ fontWeight: 600, color: coin.up ? "var(--color-positive)" : "var(--color-negative)", textAlign: "right" }}>{coin.change}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => navigate("/crypto")} className="view-all-link" style={{ marginTop: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.25rem", fontWeight: 600 }}>
              View all coins →
            </button>
          </section>

          {/* Trending Topics */}
          <TrendingTopics />

          {/* Crypto News */}
          {cryptoArticles.length > 0 && (
            <section>
              <div className="section-header" style={{ marginBottom: "0.75rem" }}>
                <h2 style={{
                  fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: "0.08em", color: "var(--color-text-secondary)",
                  paddingBottom: "0.5rem", borderBottom: "2px solid var(--color-border)",
                  margin: 0, display: "flex", alignItems: "center", gap: "0.5rem"
                }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-gold)", flexShrink: 0 }} />
                  Crypto News
                </h2>
                <button onClick={() => navigate("/crypto")} className="view-all-link" style={{ fontWeight: 600 }}>View All →</button>
              </div>
              <div className="article-grid-3">
                {cryptoArticles.map((a) => (
                  <button key={a.id} onClick={() => handleClick(a.url)} className="article-card">
                    <div className="article-card-img">
                      {a.imageUrl ? (
                        <img src={a.imageUrl.replace(/&amp;/g, "&")} alt="" className="article-card-img-inner" loading="lazy" />
                      ) : (
                        <div style={{ width: "100%", height: "100%", background: "var(--color-shades-extra-light)" }} />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="article-card-category">{a.source}</span>
                      <span className="article-card-meta" style={{ margin: 0 }}>{fmtRelative(a.publishedAt)}</span>
                    </div>
                    <h3 className="article-card-title">{decodeEntities(a.title)}</h3>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="content-sidebar">
          {/* Market Timer */}
          <MarketTimer />

          {/* Spot Prices Quick View */}
          <div style={{ background: "var(--color-surface-warm)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", padding: "1rem" }}>
            <h3 style={{ fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)", marginBottom: "0.75rem" }}>
              Spot Prices
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {SPOT_METALS_DATA.map((metal, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{metal.symbol}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>{metal.name}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${metal.bid}</div>
                    <div style={{ fontSize: "0.75rem", fontWeight: 600, color: metal.up ? "var(--color-positive)" : "var(--color-negative)" }}>
                      {metal.changePct}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Market Movers */}
          <MarketMovers />

          {/* Latest Headlines */}
          <div>
            <h3 style={{
              fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.08em", color: "var(--color-text-secondary)",
              paddingBottom: "0.5rem", borderBottom: "2px solid var(--color-border)",
              marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem"
            }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-gold)", flexShrink: 0 }} />
              Latest Headlines
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {sidebarArticles.map((a, i) => (
                <button
                  key={a.id}
                  onClick={() => handleClick(a.url)}
                  style={{
                    textAlign: "left", background: "transparent", border: "none",
                    padding: 0, cursor: "pointer", fontFamily: "inherit",
                    animation: `fade-in-up 0.3s ease-out ${i * 0.05}s both`
                  }}
                >
                  <h4 style={{
                    fontSize: "0.875rem", fontWeight: 500, lineHeight: "1.3",
                    color: "var(--color-text-primary)", display: "-webkit-box",
                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                    transition: "color 0.15s", margin: 0
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "var(--color-accent-blue)"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "var(--color-text-primary)"}
                  >
                    {decodeEntities(a.title)}
                  </h4>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    fontSize: "0.75rem", color: "var(--color-text-tertiary)", marginTop: "0.25rem"
                  }}>
                    <span style={{ color: "var(--color-text-secondary)" }}>{a.source}</span>
                    <span>·</span>
                    <time>{fmtRelative(a.publishedAt)}</time>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: "1px", background: "var(--color-border)" }} />

          {/* Newsletter Signup */}
          <div className="newsletter-card">
            <h4 className="newsletter-title">Market Briefing</h4>
            <p className="newsletter-sub">Get gold prices and market news in your inbox daily.</p>
            <div className="newsletter-form">
              <input type="email" className="newsletter-input" placeholder="your@email.com" />
              <button className="newsletter-btn">Subscribe</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
