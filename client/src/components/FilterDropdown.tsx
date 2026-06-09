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
    if (allSelected) {
      onChange([])
    } else {
      onChange([...options])
    }
  }

  const display = allSelected ? `All ${label}s` : `${selected.length} ${label}${selected.length > 1 ? "s" : ""}`

  if (!options.length) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs md:text-sm text-term-muted hover:text-term-text px-2 md:px-3 py-1.5 md:py-1.5 border border-term-border hover:border-term-muted cursor-pointer transition-colors bg-term-bg whitespace-nowrap"
      >
        {display} ▾
      </button>
      {open && (
        <div className="fixed left-2 right-2 md:absolute md:left-0 md:right-auto md:top-full mt-1 bg-term-surface border border-term-border shadow-lg z-50 min-w-40 max-h-72 overflow-y-auto">
          <button
            onClick={toggleAll}
            className="w-full text-left text-sm md:text-sm px-3 py-2.5 md:py-1.5 border-b border-term-border hover:bg-term-bg cursor-pointer transition-colors text-term-muted min-h-[44px] md:min-h-0"
          >
            {allSelected ? "Deselect all" : "Select all"}
          </button>
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => toggle(opt)}
              className={`w-full text-left text-sm md:text-sm px-3 py-2.5 md:py-1.5 cursor-pointer transition-colors hover:bg-term-bg min-h-[44px] md:min-h-0 ${
                selected.includes(opt) || allSelected
                  ? "text-term-text bg-term-accent/10"
                  : "text-term-muted"
              }`}
            >
              {(selected.includes(opt) || allSelected) ? "✓ " : "  "}{opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
