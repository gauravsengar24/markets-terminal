import { useState, useRef, useEffect } from "react"

interface Props {
  onSearch?: (query: string) => void
  placeholder?: string
}

export function SearchBar({ onSearch, placeholder = "Search news, symbols, topics..." }: Props) {
  const [value, setValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    return () => clearTimeout(timer.current)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setValue(v)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => onSearch?.(v), 300)
  }

  const clear = () => {
    setValue("")
    onSearch?.("")
    inputRef.current?.focus()
  }

  return (
    <div className="search-bar-wrap">
      <span className="search-bar-icon">🔍</span>
      <input
        ref={inputRef}
        className="search-bar-input"
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
      />
      {value && (
        <button className="search-bar-clear" onClick={clear} aria-label="Clear search">
          ✕
        </button>
      )}
    </div>
  )
}
