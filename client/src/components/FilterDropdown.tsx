import { useState, useRef, useEffect } from "react"

interface Props {
  label: string
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
}

export function FilterDropdown({ label, options, selected, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const allSelected = selected.length === 0 || selected.length === options.length

  function toggle(opt: string) {
    if (selected.includes(opt)) {
      onChange(selected.filter(s => s !== opt))
    } else {
      onChange([...selected, opt])
    }
  }

  function toggleAll() {
    if (allSelected) onChange([])
    else onChange([...options])
  }

  const display = allSelected ? `All ${label}s` : `${selected.length} ${label}${selected.length > 1 ? "s" : ""}`
  if (!options.length) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="action-link text-xs"
      >
        {display} ▾
      </button>
      {open && (
        <div
          className="fixed left-2 right-2 md:absolute md:left-0 md:right-auto md:top-full mt-1 z-50 min-w-40 max-h-72 overflow-y-auto"
          style={{
            background: 'rgba(10, 10, 12, 0.85)',
            backdropFilter: 'blur(30px) saturate(220%)',
            WebkitBackdropFilter: 'blur(30px) saturate(220%)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            padding: '0.25rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}
        >
          <button
            onClick={toggleAll}
            style={{
              width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem', fontSize: '0.78rem',
              borderBottom: '1px solid var(--glass-border)', background: 'transparent',
              cursor: 'pointer', color: 'var(--text-muted)',
            }}
          >
            {allSelected ? "Deselect all" : "Select all"}
          </button>
          {options.map(opt => {
            const checked = selected.includes(opt) || allSelected
            return (
              <button
                key={opt}
                onClick={() => toggle(opt)}
                style={{
                  width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem', fontSize: '0.78rem',
                  background: checked ? 'rgba(47, 128, 237, 0.1)' : 'transparent',
                  cursor: 'pointer', color: checked ? 'var(--electric-blue)' : 'var(--text-muted)',
                  borderRadius: '6px',
                }}
              >
                {checked ? "✓ " : "  "}{opt}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
