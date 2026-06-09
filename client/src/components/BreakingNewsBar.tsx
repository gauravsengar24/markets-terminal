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
    <div className="glass-ticker">
      <div className="flex items-center gap-3 md:gap-4 px-3 md:px-5 py-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        <span className="flex items-center gap-1.5 shrink-0" style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--color-negative)' }}>
          <span className="pulse-dot" />
          BREAKING
        </span>
        <div className="flex gap-2 md:gap-3">
          {items.map((b) => (
            b.articles.length > 0 && (
              <button
                key={b.region}
                onClick={() => onSelect(b.articles[0].url)}
                className="mac-card"
                style={{ padding: '0.4rem 0.75rem', minWidth: '200px', textAlign: 'left', cursor: 'pointer', borderLeft: '2px solid rgba(6, 182, 212, 0.3)' }}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(6, 182, 212, 0.8)' }}>{REGION_FLAGS[b.region] ?? b.region}</span>
                  <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>{fmtTime(b.articles[0].publishedAt)}</span>
                </div>
                <div style={{ fontSize: '0.95rem', lineHeight: 1.35, fontWeight: 450, color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {b.articles[0].title}
                </div>
              </button>
            )
          ))}
        </div>
      </div>
    </div>
  )
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
}
