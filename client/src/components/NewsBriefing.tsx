import { useQuery } from "@tanstack/react-query"
import { fetchBriefing } from "../lib/api"

interface Props {
  url: string | null
  fullPage?: boolean
}

export function NewsBriefing({ url, fullPage }: Props) {
  const query = useQuery({
    queryKey: ["briefing", url],
    queryFn: () => fetchBriefing(url!),
    enabled: !!url,
    staleTime: 600_000,
  })

  const wrapper = fullPage ? "max-w-3xl mx-auto" : ""

  if (!url) {
    return (
      <div className={`p-4 md:p-5 ${wrapper}`}>
        <div className="vibrant-glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <h3 style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--electric-blue)', marginBottom: '0.75rem' }}>News Briefing</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Select a headline to view a comprehensive briefing.</p>
        </div>
      </div>
    )
  }

  if (query.isLoading) {
    return (
      <div className={`p-4 md:p-5 ${wrapper}`}>
        <div className="vibrant-glass-card" style={{ padding: '1.5rem' }}>
          <div className="animate-pulse space-y-3">
            <div style={{ height: '0.75rem', background: 'var(--glass-border)', borderRadius: '4px', width: '60%' }} />
            <div style={{ height: '0.5rem', background: 'var(--glass-border)', borderRadius: '4px', width: '100%' }} />
            <div style={{ height: '0.5rem', background: 'var(--glass-border)', borderRadius: '4px', width: '80%' }} />
          </div>
        </div>
      </div>
    )
  }

  if (query.data) {
    const d = query.data
    return (
      <div className={`p-4 md:p-5 ${wrapper}`}>
        <div className="vibrant-glass-card" style={{ padding: fullPage ? '2rem' : '1.25rem', borderLeft: '4px solid rgba(168, 85, 247, 0.4)' }}>
          <div className="space-y-4">
            <div>
              <h3 style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--electric-blue)', marginBottom: '0.5rem' }}>News Briefing</h3>
              <h4 className="article-title" style={{ fontWeight: 600 }}>{d.title}</h4>
            </div>

            <div>
              <h5 style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-accent)', marginBottom: '0.35rem' }}>What Happened</h5>
              <p style={{ fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>{d.whatHappened}</p>
            </div>

            {d.marketContext && (
              <div>
                <h5 style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-accent)', marginBottom: '0.35rem' }}>Market Context</h5>
                <p style={{ fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>{d.marketContext}</p>
              </div>
            )}

            {d.keyTakeaways && d.keyTakeaways.length > 0 && (
              <div>
                <h5 style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-accent)', marginBottom: '0.35rem' }}>Key Takeaways</h5>
                <ul style={{ paddingLeft: '1rem' }}>
                  {d.keyTakeaways.map((t: string, i: number) => (
                    <li key={i} style={{ fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--text-muted)', marginBottom: '0.25rem', listStyle: 'disc' }}>{t}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <a
            href={d.url}
            target="_blank"
            rel="noopener noreferrer"
            className="action-link inline-flex mt-4 text-xs"
          >
            Read full article ↗
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-4 md:p-5 ${wrapper}`}>
      <div className="vibrant-glass-card" style={{ padding: '1.5rem' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-negative)' }}>Failed to load briefing.</p>
      </div>
    </div>
  )
}
