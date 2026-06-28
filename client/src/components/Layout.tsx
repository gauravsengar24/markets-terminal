import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { fetchNews } from "../lib/api"
import type { NewsArticle } from "@shared/types"
import { BreakingNewsBar } from "./BreakingNewsBar"
import { MarketTicker } from "./MarketTicker"
import { LastUpdated } from "./LastUpdated"
import { ImpactFilterBar } from "./ImpactFilterBar"
import { ParticleField } from "./ParticleField"

export function Layout() {
  const navigate = useNavigate()
  const client = useQueryClient()
  const location = useLocation()
  const [selectedImpact, setSelectedImpact] = useState("all")

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
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--oled-black)', position: 'relative' }}>
      <ParticleField />

      <div className="glass-nav shrink-0 z-20 sticky top-0">
        <div className="flex items-center justify-between px-4 md:px-5 py-2.5 md:py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 mr-1">
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(6, 182, 212, 0.7)', display: 'inline-block' }} />
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(240, 180, 41, 0.5)', display: 'inline-block' }} />
            </div>
            <button
              onClick={() => navigate("/")}
              className="font-semibold text-sm md:text-base tracking-[-0.01em] hover:opacity-80 transition-opacity cursor-pointer"
              style={{ color: 'var(--text-primary)' }}
            >
              Markets Terminal
            </button>
          </div>
          <div className="flex items-center gap-3">
            <LastUpdated at={news.dataUpdatedAt} />
            <button
              onClick={refresh}
              disabled={news.isRefetching}
              className="action-link text-xs"
              aria-label="Refresh news"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0.35rem 0.85rem', fontSize: '0.95rem' }}
            >
              {news.isRefetching ? "⟳" : "↻"}
            </button>
          </div>
        </div>

        {news.error && (
          <div className="px-3 md:px-5 py-2 text-sm text-term-red" style={{ color: 'var(--color-negative)' }}>
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
            initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Outlet context={ctxRef} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
