import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { Outlet, useNavigate } from "react-router-dom"
import { fetchNews } from "../lib/api"
import { getPersisted, setPersisted, STORAGE_KEYS } from "../lib/persist"
import type { NewsArticle } from "@shared/types"
import { BreakingNewsBar } from "./BreakingNewsBar"
import { MarketTicker } from "./MarketTicker"
import { LastUpdated } from "./LastUpdated"
import { ImpactFilterBar } from "./ImpactFilterBar"


export function Layout() {
  const navigate = useNavigate()
  const client = useQueryClient()
  const [selectedImpact, setSelectedImpact] = useState("all")

  const news = useQuery({
    queryKey: ["news"],
    queryFn: fetchNews as () => Promise<NewsArticle[]>,
    refetchInterval: 300_000,
    refetchIntervalInBackground: true,
    staleTime: 0,
  })

  const refresh = () => client.invalidateQueries({ queryKey: ["news"] })

  function handleBreakingNewsSelect(url: string) {
    const article = news.data?.find(a => a.url === url)
    if (article) navigate(`/article/${article.id}`)
    else window.open(url, "_blank", "noopener")
  }

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--oled-black)' }}>
      <div className="glass-nav shrink-0 z-10">
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

      <div className="flex-1 overflow-y-auto">
        <Outlet context={{ articles: news.data ?? [], selectedImpact, setSelectedImpact }} />
      </div>
    </div>
  )
}
