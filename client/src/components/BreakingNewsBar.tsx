import { useQuery } from "@tanstack/react-query"
import { fetchCuratedBreakingNews } from "../lib/api"
import type { CuratedArticle } from "@shared/types"
import { decodeEntities } from "../lib/format"

interface Props {
  onSelect: (url: string) => void
}

export function BreakingNewsBar({ onSelect }: Props) {
  const query = useQuery({
    queryKey: ["breaking-news-curated"],
    queryFn: () => fetchCuratedBreakingNews() as Promise<{ articles: CuratedArticle[] }>,
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
    staleTime: 0,
  })

  const THREE_DAYS = 72 * 60 * 60 * 1000
  const items = (query.data?.articles ?? []).filter(a => Date.now() - new Date(a.publishedAt).getTime() < THREE_DAYS)
  if (!items.length) return null

  const duplicated = [...items, ...items, ...items]

  return (
    <div className="breaking-news-bar">
      <div className="breaking-news-inner">
        <div className="breaking-label">
          <span className="breaking-dot" />
          BREAKING
        </div>
        <div className="breaking-scroll-wrap">
          <div className="breaking-scroll-track">
            {duplicated.map((a, i) => (
              <button
                key={`${a.id}-${i}`}
                onClick={() => onSelect(a.url)}
                className="breaking-item"
              >
                <span className="breaking-item-sep" />
                {decodeEntities(a.title)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
