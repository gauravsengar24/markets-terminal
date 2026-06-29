import { useQuery } from "@tanstack/react-query"
import { fetchSummary } from "../lib/api"

export function ArticleSummary({ url }: { url: string | null }) {
  const query = useQuery({
    queryKey: ["summary", url],
    queryFn: () => fetchSummary(url!),
    enabled: !!url,
    staleTime: 120_000,
  })

  if (!url) {
    return (
      <div className="p-4 md:p-5">
        <h3 className="text-xs md:text-sm font-bold text-text-secondary uppercase tracking-widest mb-3">Article Summary</h3>
        <p className="text-sm md:text-base text-text-tertiary">Select a headline to view its summary.</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-5">
      <h3 className="text-xs md:text-sm font-bold text-text-secondary uppercase tracking-widest mb-3">Article Summary</h3>
      {query.isLoading ? (
        <div className="space-y-3">
          <div className="animate-pulse h-5 rounded w-3/4" style={{ background: "var(--glass-border)" }} />
          <div className="animate-pulse h-4 rounded w-full" style={{ background: "var(--glass-border)" }} />
          <div className="animate-pulse h-4 rounded w-5/6" style={{ background: "var(--glass-border)" }} />
        </div>
      ) : query.data ? (
        <>
          <h4 className="text-sm md:text-base font-semibold text-text-primary mb-3 leading-relaxed">{query.data.title}</h4>
          <p className="text-sm md:text-base text-text-secondary leading-relaxed whitespace-pre-wrap">{query.data.summary}</p>
          <a href={query.data.url} target="_blank" rel="noopener noreferrer"
            className="inline-block mt-4 text-sm md:text-base text-electric-blue hover:underline">Read full article →</a>
        </>
      ) : (
        <p className="text-sm md:text-base text-negative">Failed to load summary. Try opening the article directly.</p>
      )}
    </div>
  )
}
