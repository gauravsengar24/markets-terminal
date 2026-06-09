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
      <div className="p-5">
        <h3 className="text-sm font-bold text-term-accent uppercase tracking-widest mb-3">Article Summary</h3>
        <p className="text-base text-term-muted">Select a headline to view its summary.</p>
      </div>
    )
  }

  return (
    <div className="p-5">
      <h3 className="text-sm font-bold text-term-accent uppercase tracking-widest mb-3">Article Summary</h3>
      {query.isLoading ? (
        <div className="space-y-3">
          <div className="animate-pulse h-5 bg-term-border rounded w-3/4" />
          <div className="animate-pulse h-4 bg-term-border rounded w-full" />
          <div className="animate-pulse h-4 bg-term-border rounded w-5/6" />
        </div>
      ) : query.data ? (
        <>
          <h4 className="text-base font-semibold text-term-text mb-3 leading-relaxed">{query.data.title}</h4>
          <p className="text-base text-term-muted leading-relaxed whitespace-pre-wrap">{query.data.summary}</p>
          <a href={query.data.url} target="_blank" rel="noopener noreferrer"
            className="inline-block mt-4 text-base text-term-accent hover:underline">Read full article →</a>
        </>
      ) : (
        <p className="text-base text-term-red">Failed to load summary.</p>
      )}
    </div>
  )
}
