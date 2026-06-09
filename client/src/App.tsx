import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useMemo } from "react"
import { fetchNews } from "./lib/api"
import type { NewsArticle } from "@shared/types"
import { REGIONS, ASSET_CLASSES } from "@shared/constants"
import { NewsTerminal } from "./components/NewsTerminal"
import { ArticleSummary } from "./components/ArticleSummary"
import { LastUpdated } from "./components/LastUpdated"
import { FilterDropdown } from "./components/FilterDropdown"

export default function App() {
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null)
  const [showSummary, setShowSummary] = useState(false)
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const client = useQueryClient()

  const news = useQuery({
    queryKey: ["news"],
    queryFn: () => fetchNews() as Promise<NewsArticle[]>,
    refetchInterval: 3_600_000,
    staleTime: 3_600_000,
  })

  const filtered = useMemo(() => {
    const all = news.data ?? []
    if (!selectedRegions.length && !selectedAssets.length) return all
    return all.filter(a => {
      if (selectedRegions.length && !selectedRegions.includes(a.region)) return false
      if (selectedAssets.length && !selectedAssets.includes(a.assetClass)) return false
      return true
    })
  }, [news.data, selectedRegions, selectedAssets])

  const refresh = () => client.invalidateQueries({ queryKey: ["news"] })

  const allRegions = useMemo(() => {
    const s = new Set(news.data?.map(a => a.region) ?? [])
    return REGIONS.filter(r => s.has(r))
  }, [news.data])

  const allAssets = useMemo(() => {
    const s = new Set(news.data?.map(a => a.assetClass) ?? [])
    return ASSET_CLASSES.filter(ac => s.has(ac))
  }, [news.data])

  function handleSelect(url: string | null) {
    setSelectedUrl(url)
    if (url) setShowSummary(true)
  }

  return (
    <div className="h-full flex flex-col bg-term-bg">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center justify-between px-3 md:px-5 py-2 md:py-2.5 border-b border-term-border bg-term-surface shrink-0 flex-wrap gap-1.5 md:gap-2">
            <div className="flex items-center gap-2 md:gap-4 flex-wrap">
              <span className="text-term-accent font-bold text-sm md:text-base uppercase tracking-widest">Markets</span>
              <FilterDropdown label="Region" options={allRegions} selected={selectedRegions} onChange={setSelectedRegions} />
              <FilterDropdown label="Asset" options={allAssets} selected={selectedAssets} onChange={setSelectedAssets} />
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <LastUpdated at={news.dataUpdatedAt} />
              <button
                onClick={refresh}
                disabled={news.isRefetching}
                className="text-sm md:text-base text-term-muted hover:text-term-accent disabled:opacity-40 px-3 md:px-4 py-1 md:py-1.5 border border-term-border hover:border-term-accent cursor-pointer transition-colors"
              >
                {news.isRefetching ? "⟳" : "↻"}
              </button>
            </div>
          </div>

          {news.error && (
            <div className="bg-term-red/10 border-b border-term-red/30 px-3 md:px-5 py-2 md:py-2.5 text-sm md:text-base text-term-red shrink-0">
              Failed to load news. Check API keys or try again later.
            </div>
          )}

          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <NewsTerminal
                articles={filtered}
                selectedUrl={showSummary ? selectedUrl : null}
                onSelect={handleSelect}
              />
            </div>

            {showSummary ? (
              <div className="fixed inset-0 z-50 md:static md:inset-auto md:z-auto md:w-96 md:border-l md:border-term-border md:overflow-y-auto md:shrink-0">
                <div className="h-full bg-term-bg md:bg-transparent flex flex-col">
                  <div className="flex items-center justify-between px-3 md:hidden py-2 border-b border-term-border bg-term-surface">
                    <span className="text-xs font-bold text-term-accent uppercase tracking-widest">Summary</span>
                    <button onClick={() => setShowSummary(false)}
                      className="text-term-muted hover:text-term-text text-sm px-2 py-1 cursor-pointer">
                      ✕ Close
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <ArticleSummary url={selectedUrl} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden md:block w-96 border-l border-term-border overflow-y-auto shrink-0">
                <ArticleSummary url={null} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
