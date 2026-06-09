import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useMemo, useEffect } from "react"
import { Outlet, useNavigate } from "react-router-dom"
import { fetchNews } from "../lib/api"
import { getPersisted, setPersisted, STORAGE_KEYS } from "../lib/persist"
import type { NewsArticle } from "@shared/types"
import { REGIONS, ASSET_CLASSES } from "@shared/constants"
import { BreakingNewsBar } from "./BreakingNewsBar"
import { MarketTicker } from "./MarketTicker"
import { LastUpdated } from "./LastUpdated"
import { FilterDropdown } from "./FilterDropdown"

export function Layout() {
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const navigate = useNavigate()
  const client = useQueryClient()

  const news = useQuery({
    queryKey: ["news"],
    queryFn: async () => {
      const data = await fetchNews() as NewsArticle[]
      setPersisted(STORAGE_KEYS.NEWS, data, 3_600_000)
      return data
    },
    refetchInterval: 3_600_000,
    staleTime: 3_600_000,
    initialData: () => getPersisted<NewsArticle[]>(STORAGE_KEYS.NEWS) ?? undefined,
  })

  useEffect(() => {
    if (news.data && !getPersisted(STORAGE_KEYS.NEWS)) {
      setPersisted(STORAGE_KEYS.NEWS, news.data, 3_600_000)
    }
  }, [news.data])

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

  function handleBreakingNewsSelect(url: string) {
    const article = news.data?.find(a => a.url === url)
    if (article) navigate(`/article/${article.id}`)
  }

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--oled-black)' }}>
      <div className="glass-nav shrink-0 z-10">
        <div className="flex items-center justify-between px-3 md:px-5 py-2 md:py-2.5 flex-wrap gap-1.5 md:gap-2">
          <div className="flex items-center gap-2 md:gap-4 flex-wrap">
            <button
              onClick={() => navigate("/")}
              className="text-term-accent font-bold text-sm md:text-base uppercase tracking-[0.15em] hover:opacity-80 transition-opacity cursor-pointer"
              style={{ color: 'var(--color-accent)' }}
            >
              Markets Terminal
            </button>
            <FilterDropdown label="Region" options={allRegions} selected={selectedRegions} onChange={setSelectedRegions} />
            <FilterDropdown label="Asset" options={allAssets} selected={selectedAssets} onChange={setSelectedAssets} />
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <LastUpdated at={news.dataUpdatedAt} />
            <button
              onClick={refresh}
              disabled={news.isRefetching}
              className="action-link text-xs"
              aria-label="Refresh news"
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

      <div className="flex-1 overflow-y-auto">
        <Outlet context={{ articles: filtered, selectedRegions, selectedAssets }} />
      </div>
    </div>
  )
}
