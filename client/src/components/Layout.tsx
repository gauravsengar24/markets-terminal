import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState, useEffect, useRef } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion"
import { fetchNews } from "../lib/api"
import type { NewsArticle } from "@shared/types"
import { BreakingNewsBar } from "./BreakingNewsBar"
import { MarketTicker } from "./MarketTicker"
import { LastUpdated } from "./LastUpdated"
import { ImpactFilterBar } from "./ImpactFilterBar"
import { Scene3D } from "./canvas/Scene3D"
import { Footer } from "./Footer"

export function Layout() {
  const navigate = useNavigate()
  const client = useQueryClient()
  const location = useLocation()
  const [selectedImpact, setSelectedImpact] = useState("all")
  const mainRef = useRef<HTMLDivElement>(null!)

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
    selectedImpact,
    setSelectedImpact,
  }), [news.data, selectedImpact, setSelectedImpact])

  const refresh = () => client.invalidateQueries({ queryKey: ["news"] })

  function handleBreakingNewsSelect(url: string) {
    const article = news.data?.find(a => a.url === url)
    if (article) navigate(`/article/${article.id}`)
    else window.open(url, "_blank", "noopener")
  }

  return (
    <div className="min-h-screen flex flex-col bg-oled-black relative">
      <div ref={mainRef} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }}>
        <Scene3D scrollProgress={scrollVal} />
      </div>

      <ProgressBar scroll={scrollVal} />

      <div className="glass-nav shrink-0 z-30 sticky top-0">
        <div className="flex items-center justify-between px-4 md:px-6 py-2.5 md:py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 cursor-pointer bg-transparent border-none p-0 group"
            >
              <div className="relative">
                <span className="w-2.5 h-2.5 rounded-full block transition-shadow duration-300 group-hover:shadow-[0_0_12px_var(--color-brand)]" style={{ background: "var(--color-brand)" }} />
                <span className="absolute -top-0.5 -right-0.5 w-1 h-1 rounded-full" style={{ background: "var(--color-soft-purple)", animation: "pulse-glow 2s ease-in-out infinite" }} />
              </div>
            </button>
            <div className="hidden md:flex items-center gap-1">
              {["Crypto", "Stocks", "Commodities", "IPO"].map((item) => (
                <button
                  key={item}
                  onClick={() => navigate(`/${item.toLowerCase()}`)}
                  className="text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors cursor-pointer bg-transparent border-none"
                  style={{ color: "var(--color-text-tertiary)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-text-primary)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)" }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-tertiary)"; e.currentTarget.style.background = "transparent" }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <LastUpdated at={news.dataUpdatedAt} />
            <motion.button
              onClick={refresh}
              disabled={news.isRefetching}
              className="action-link text-xs"
              aria-label="Refresh news"
              whileTap={{ scale: 0.95 }}
            >
              {news.isRefetching ? (
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>⟳</motion.span>
              ) : "↻"}
            </motion.button>
          </div>
        </div>

        {news.error && (
          <div className="px-3 md:px-5 py-2 text-sm" style={{ color: 'var(--color-negative)' }}>
            Failed to load news. Check API keys or try again later.
          </div>
        )}
      </div>

      <BreakingNewsBar onSelect={handleBreakingNewsSelect} />
      <MarketTicker />

      <ImpactFilterBar
        selected={selectedImpact}
        onSelect={setSelectedImpact}
        articles={news.data ?? []}
      />

      <div className="flex-1 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(3px)" }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Outlet context={{ ...ctxRef, scrollProgress: scrollVal }} />
          </motion.div>
        </AnimatePresence>
      </div>

      <Footer />
    </div>
  )
}

function ProgressBar({ scroll }: { scroll: number }) {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-50"
      style={{ height: 1.5, pointerEvents: "none" }}
    >
      <motion.div
        style={{
          height: "100%",
          background: "linear-gradient(90deg, var(--color-brand), var(--color-soft-purple), var(--color-soft-pink))",
          boxShadow: "0 0 10px rgba(0,229,255,0.3)",
          transformOrigin: "0%",
          scaleX: scroll,
        }}
      />
    </div>
  )
}
