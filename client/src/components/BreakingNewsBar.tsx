import { useQuery } from "@tanstack/react-query"
import { fetchBreakingNews } from "../lib/api"
import { getPersisted, setPersisted, STORAGE_KEYS } from "../lib/persist"
import type { BreakingNews } from "@shared/types"

interface Props {
  onSelect: (url: string) => void
}

const REGION_FLAGS: Record<string, string> = {
  USA: "US", Europe: "EU", China: "CN", Japan: "JP",
  India: "IN", Korea: "KR", Australia: "AU",
}

export function BreakingNewsBar({ onSelect }: Props) {
  const query = useQuery({
    queryKey: ["breaking-news"],
    queryFn: async () => {
      const data = await fetchBreakingNews() as BreakingNews[]
      setPersisted(STORAGE_KEYS.BREAKING, data, 600_000)
      return data
    },
    refetchInterval: 600_000,
    staleTime: 600_000,
    initialData: () => getPersisted<BreakingNews[]>(STORAGE_KEYS.BREAKING) ?? undefined,
  })

  const items = query.data ?? []
  if (!items.length) return null

  return (
    <div className="breaking-bar">
      <div className="breaking-bar-inner">
        <div className="breaking-label">
          <span className="breaking-dot" />
          <span className="breaking-text">BREAKING</span>
        </div>
        <div className="breaking-scroll">
          <div className="breaking-track">
            {[...items, ...items].map((b, i) => (
              b.articles.length > 0 && (
                <button
                  key={`${b.region}-${i}`}
                  onClick={() => onSelect(b.articles[0].url)}
                  className="breaking-card"
                >
                  {b.articles[0].imageUrl && (
                    <img src={b.articles[0].imageUrl} alt="" className="breaking-img" loading="lazy" />
                  )}
                  <div className="breaking-card-body">
                    <div className="breaking-card-top">
                      <span className="breaking-region">{REGION_FLAGS[b.region] ?? b.region}</span>
                      <span className="breaking-time">{fmtTime(b.articles[0].publishedAt)}</span>
                    </div>
                    <div className="breaking-card-title">{b.articles[0].title}</div>
                  </div>
                </button>
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
}
