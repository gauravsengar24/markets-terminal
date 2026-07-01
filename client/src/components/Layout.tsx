import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState, useEffect, createContext, useContext } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion"
import { fetchNews } from "../lib/api"
import type { NewsArticle, LayoutContext } from "@shared/types"
import { useMarketData } from "../hooks/useMarketData"
import { BreakingNewsBar } from "./BreakingNewsBar"
import { Footer } from "./Footer"
import { PriceFlash } from "./PriceFlash"

type Theme = "light" | "dark"

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({ theme: "light", toggle: () => {} })
export const useTheme = () => useContext(ThemeContext)

export function Layout() {
  const navigate = useNavigate()
  const client = useQueryClient()
  const location = useLocation()
  const { spotMetals, tickerItems } = useMarketData()

  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme")
      if (saved === "dark" || saved === "light") return saved
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }
    return "light"
  })

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    localStorage.setItem("theme", theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === "light" ? "dark" : "light")

  const { scrollYProgress } = useScroll()
  const smoothScroll = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })
  const [scrollVal, setScrollVal] = useState(0)
  useEffect(() => {
    const unsub = smoothScroll.on("change", (v) => setScrollVal(v))
    return () => unsub()
  }, [smoothScroll])

  const news = useQuery({
    queryKey: ["news"],
    queryFn: fetchNews as () => Promise<NewsArticle[]>,
    refetchInterval: 300_000,
    refetchIntervalInBackground: true,
    staleTime: 0,
  })

  const ctxRef = useMemo(() => ({
    articles: news.data ?? [],
    selectedImpact: "all",
    setSelectedImpact: () => {},
    scrollProgress: 0,
  }), [news.data])

  function handleBreakingNewsSelect(url: string) {
    const article = news.data?.find(a => a.url === url)
    if (article) navigate(`/article/${article.id}`)
    else window.open(url, "_blank", "noopener")
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle: toggleTheme }}>
      <div className="min-h-screen flex flex-col" style={{ background: "var(--color-background)" }}>
        <div className="progress-bar">
          <motion.div className="progress-bar-fill" style={{ scaleX: scrollVal }} />
        </div>

        {/* Spot Price Bar */}
        <div className="spot-bar">
          <div className="spot-bar-inner">
            {spotMetals.map((metal, i) => (
              <PriceFlash key={metal.symbol} price={metal.price}>
                <a href="/commodities" className="spot-item" onClick={(e) => { e.preventDefault(); navigate("/commodities"); }}>
                  <span className="spot-item-label">{metal.name}</span>
                  <span className={`spot-item-price ${metal.up ? "price-up" : "price-down"}`}>
                    ${metal.bid}
                  </span>
                  <span className={`spot-item-change ${metal.up ? "price-up" : "price-down"}`}>
                    {metal.change}
                  </span>
                </a>
              </PriceFlash>
            ))}
            <div className="spot-market-status">
              <span className="spot-market-dot open" />
              <span>Spot Market Open</span>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <header className="site-header">
          <div className="header-inner">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 bg-transparent border-none p-0 cursor-pointer" style={{ flexShrink: 0 }}>
              <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="45" fill="#d4a017" />
                <text x="50" y="62" textAnchor="middle" fill="#1C1C1C" fontSize="40" fontWeight="800" fontFamily="Inter,sans-serif">M</text>
              </svg>
              <span style={{ color: "var(--nav-text)", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
                Market<span style={{ color: "#d4a017" }}>Pulse</span>
              </span>
            </button>

            <nav className="nav-pill" style={{ display: "none" }} id="desktop-nav">
              <button className="nav-link" onClick={() => navigate("/")}>News</button>
              <button className="nav-link" onClick={() => navigate("/crypto")}>Crypto</button>
              <button className="nav-link" onClick={() => navigate("/stocks")}>Stocks</button>
              <button className="nav-link" onClick={() => navigate("/commodities")}>Commodities</button>
            </nav>

            <div className="flex items-center gap-2">
              <span style={{ fontSize: "0.75rem", color: "var(--spot-bar-text-muted)", display: "none" }} className="hidden md:inline">
                {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === "light" ? "🌙" : "☀️"}
              </button>
            </div>
          </div>
        </header>

        <div className="header-spacer" />

        {/* Market Ticker */}
        <div className="market-ticker">
          <div className="market-ticker-inner">
            <div className="ticker-label">Markets</div>
            <div className="ticker-scroll">
              <div className="ticker-track animate-ticker">
                {[...tickerItems, ...tickerItems].map((item, i) => (
                  <PriceFlash key={`${item.name}-${i}`} price={item.price}>
                    <a href="/" className="ticker-item" onClick={(e) => { e.preventDefault(); }}>
                      <span>{item.name}</span>
                      <span style={{ fontWeight: 600 }}>{item.value}</span>
                      <span className={item.up ? "price-up" : "price-down"}>
                        {item.up ? "▲" : "▼"} {item.change}
                      </span>
                    </a>
                  </PriceFlash>
                ))}
              </div>
            </div>
          </div>
        </div>

        <BreakingNewsBar onSelect={handleBreakingNewsSelect} />

        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet context={ctxRef} />
            </motion.div>
          </AnimatePresence>
        </div>

        <Footer />
      </div>
    </ThemeContext.Provider>
  )
}
