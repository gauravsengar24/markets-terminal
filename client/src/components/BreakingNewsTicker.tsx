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
    <div className="bg-background/90 border-b border-border relative overflow-hidden">
      <div className="flex items-center gap-2.5 max-w-[1400px] mx-auto px-3 py-1.5">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="block w-1.5 h-1.5 rounded-full bg-down animate-blink shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
          <span className="text-[11px] font-bold tracking-widest text-down whitespace-nowrap">BREAKING</span>
        </div>
        <div className="flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_2%_98%,transparent)]">
          <div className="flex gap-2 w-max marquee-cards">
            {duplicated.map((a, i) => (
              <a
                key={`${a.id}-${i}`}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-2.5 items-center w-60 min-w-60 h-[68px] p-2 bg-card border border-border/60 rounded-lg no-underline transition-all duration-200 cursor-pointer shrink-0 hover:border-border hover:bg-card/80 hover:-translate-y-px"
              >
                <div className="w-12 h-12 min-w-12 rounded-md overflow-hidden bg-muted shrink-0">
                  {a.imageUrl ? (
                    <img src={a.imageUrl.replace(/&amp;/g, "&")} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-down tracking-wider whitespace-nowrap">
                      <span className="block w-1 h-1 rounded-full bg-down animate-blink" />
                      LIVE
                    </span>
                    <span className="text-[9px] text-muted-foreground whitespace-nowrap">{a.source}</span>
                    <span className="text-[9px] text-muted-foreground/60 whitespace-nowrap">{fmtTime(a.publishedAt)}</span>
                  </div>
                  <div className="text-[11px] text-foreground font-medium leading-tight line-clamp-2">{a.title}</div>
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
