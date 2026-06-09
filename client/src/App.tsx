import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useCallback } from "react"
import { fetchNews } from "./lib/api"
import type { NewsArticle } from "@shared/types"
import { REGIONS, ASSET_CLASSES } from "@shared/constants"
import { FilterRail } from "./components/FilterRail"
import { NewsTerminal } from "./components/NewsTerminal"
import { ArticleSummary } from "./components/ArticleSummary"
import { LastUpdated } from "./components/LastUpdated"

function useUrlFilters() {
  const params = new URLSearchParams(window.location.search)
  const regions = params.get("regions")?.split(",").filter(Boolean) ?? []
  const assets = params.get("assetClasses")?.split(",").filter(Boolean) ?? []

  const setFilters = useCallback((r: string[], a: string[]) => {
    const sp = new URLSearchParams()
    if (r.length) sp.set("regions", r.join(","))
    if (a.length) sp.set("assetClasses", a.join(","))
    const qs = sp.toString()
    window.history.replaceState(null, "", qs ? `?${qs}` : "/")
  }, [])

  return { regions, assets, setFilters }
}

export default function App() {
  const { regions, assets, setFilters } = useUrlFilters()
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null)
  const client = useQueryClient()

  const news = useQuery({
    queryKey: ["news", regions, assets],
    queryFn: () => fetchNews(regions, assets) as Promise<NewsArticle[]>,
    refetchInterval: 60_000,
  })

  const toggleRegion = (r: string) => {
    const next = regions.includes(r) ? regions.filter((x) => x !== r) : [...regions, r]
    setFilters(next, assets)
  }

  const toggleAsset = (a: string) => {
    const next = assets.includes(a) ? assets.filter((x) => x !== a) : [...assets, a]
    setFilters(regions, next)
  }

  const refresh = () => client.invalidateQueries({ queryKey: ["news"] })

  return (
    <div className="h-full flex flex-col bg-term-bg">
      <div className="flex flex-1 overflow-hidden">
        <FilterRail
          regions={regions}
          assets={assets}
          onToggleRegion={toggleRegion}
          onToggleAsset={toggleAsset}
        />

        <div className="flex flex-col flex-1 overflow-hidden border-l border-term-border">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-term-border bg-term-surface shrink-0">
            <span className="text-term-accent font-bold text-xs uppercase tracking-widest">News Terminal</span>
            <div className="flex items-center gap-3">
              <LastUpdated at={news.dataUpdatedAt} />
              <button
                onClick={refresh}
                disabled={news.isRefetching}
                className="text-xs text-term-muted hover:text-term-accent disabled:opacity-40 px-2 py-0.5 border border-term-border hover:border-term-accent cursor-pointer transition-colors"
              >
                {news.isRefetching ? "⟳" : "↻"} Refresh
              </button>
            </div>
          </div>

          {news.error && (
            <div className="bg-term-red/10 border-b border-term-red/30 px-3 py-1.5 text-xs text-term-red shrink-0">
              {(news.error as any)?.detail
                ? `NewsData: ${(news.error as any).detail}`
                : "Failed to load news. Check your NewsData.io API key or try again later."}
            </div>
          )}

          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <NewsTerminal
                articles={news.data ?? []}
                selectedUrl={selectedUrl}
                onSelect={setSelectedUrl}
              />
            </div>

            <div className="w-80 border-l border-term-border overflow-y-auto shrink-0">
              <ArticleSummary url={selectedUrl} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
