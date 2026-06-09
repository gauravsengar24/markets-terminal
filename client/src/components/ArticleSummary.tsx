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
      <div className="p-3">
        <h3 className="text-[10px] font-bold text-term-accent uppercase tracking-widest mb-3">Article Summary</h3>
        <p className="text-xs text-term-muted">Select a headline to view its summary.</p>
      </div>
    )
  }

  return (
    <div className="p-3">
      <h3 className="text-[10px] font-bold text-term-accent uppercase tracking-widest mb-3">Article Summary</h3>
      {query.isLoading ? (
        <div className="space-y-2">
          <div className="animate-pulse h-4 bg-term-border rounded w-3/4" />
          <div className="animate-pulse h-3 bg-term-border rounded w-full" />
          <div className="animate-pulse h-3 bg-term-border rounded w-5/6" />
        </div>
      ) : query.data ? (
        <>
          <h4 className="text-xs font-semibold text-term-text mb-2 leading-snug">{query.data.title}</h4>
          <p className="text-xs text-term-muted leading-relaxed">{query.data.summary}</p>
          <a href={query.data.url} target="_blank" rel="noopener noreferrer"
            className="inline-block mt-3 text-xs text-term-accent hover:underline">Read full article →</a>
        </>
      ) : (
        <p className="text-xs text-term-red">Failed to load summary.</p>
      )}
    </div>
  )
}
