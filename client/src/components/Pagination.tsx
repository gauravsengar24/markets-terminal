interface Props {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null

  const pages: number[] = []
  const start = Math.max(1, currentPage - 2)
  const end = Math.min(totalPages, currentPage + 2)
  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <div className="flex items-center justify-center gap-2 px-3 md:px-5 py-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="action-link text-xs"
      >
        ← Prev
      </button>
      {start > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className="action-link text-xs">1</button>
          {start > 2 && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>…</span>}
        </>
      )}
      {pages.map(p => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className="action-link text-xs"
          style={p === currentPage ? { background: 'rgba(47, 128, 237, 0.2)', borderColor: 'rgba(47, 128, 237, 0.4)', color: 'var(--electric-blue)' } : {}}
        >
          {p}
        </button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>…</span>}
          <button onClick={() => onPageChange(totalPages)} className="action-link text-xs">{totalPages}</button>
        </>
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="action-link text-xs"
      >
        Next →
      </button>
    </div>
  )
}
