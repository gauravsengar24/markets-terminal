import { useQuery } from "@tanstack/react-query"
import { fetchBreakingNews } from "../lib/api"
import type { BreakingNews } from "@shared/types"

export function BreakingNewsTicker() {
  const query = useQuery({
    queryKey: ["breaking-news"],
    queryFn: () => fetchBreakingNews() as Promise<BreakingNews[]>,
    refetchInterval: 900_000,
    staleTime: 450_000,
  })

  const items = query.data ?? []
  const tiles = items.flatMap(b => b.articles).slice(0, 30)
  if (!tiles.length) return null

  const duplicated = [...tiles, ...tiles]

  return (
    <div style={{
      background: "rgba(8,8,15,0.5)",
      backdropFilter: "var(--glass-blur)",
      WebkitBackdropFilter: "var(--glass-blur)",
      borderBottom: "1px solid var(--glass-border)",
      position: "relative",
      overflow: "hidden",
    }}>
      <div className="flex items-center gap-2.5" style={{ maxWidth: "1400px", margin: "0 auto", padding: "0.375rem 0.75rem" }}>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="block w-1.5 h-1.5 rounded-full animate-blink" style={{ background: "var(--color-negative)", boxShadow: "0 0 6px rgba(239,68,68,0.6)" }} />
          <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", color: "var(--color-negative)", whiteSpace: "nowrap" }}>BREAKING</span>
        </div>
        <div className="flex-1 overflow-hidden" style={{ maskImage: "linear-gradient(90deg,transparent,#000 2% 98%,transparent)", WebkitMaskImage: "linear-gradient(90deg,transparent,#000 2% 98%,transparent)" }}>
          <div className="flex gap-2 w-max marquee-cards">
            {duplicated.map((a, i) => (
              <a
                key={`${a.id}-${i}`}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-2.5 items-center w-60 min-w-60 h-[68px] p-2 rounded-lg no-underline transition-all duration-200 cursor-pointer shrink-0"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--glass-border)",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--glass-border-hover)"; e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.transform = "translateY(-1px)" }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--glass-border)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.transform = "translateY(0)" }}
              >
                <div className="w-12 h-12 min-w-12 rounded-md overflow-hidden shrink-0" style={{ background: "rgba(255,255,255,0.03)" }}>
                  {a.imageUrl ? (
                    <img src={a.imageUrl.replace(/&amp;/g, "&")} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, rgba(96,205,255,0.2), rgba(180,140,255,0.2))" }} />
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-0.5 whitespace-nowrap" style={{ fontSize: "9px", fontWeight: 700, color: "var(--color-negative)", letterSpacing: "0.08em" }}>
                      <span className="block w-1 h-1 rounded-full" style={{ background: "var(--color-negative)", animation: "ticker-blink 1.2s ease-in-out infinite" }} />
                      LIVE
                    </span>
                    <span style={{ fontSize: "9px", color: "var(--color-text-tertiary)", whiteSpace: "nowrap" }}>{a.source}</span>
                    <span style={{ fontSize: "9px", color: "var(--color-text-tertiary)", opacity: 0.6, whiteSpace: "nowrap" }}>{fmtTime(a.publishedAt)}</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--color-text-primary)", fontWeight: 500, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{a.title}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function fmtTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}