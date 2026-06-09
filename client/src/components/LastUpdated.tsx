import { useEffect, useState } from "react"

export function LastUpdated({ at }: { at: number }) {
  const [label, setLabel] = useState("")

  useEffect(() => {
    function tick() {
      if (!at) return setLabel("--")
      const s = Math.floor((Date.now() - at) / 1000)
      if (s < 5) setLabel("just now")
      else if (s < 60) setLabel(`${s}s ago`)
      else setLabel(`${Math.floor(s / 60)}m ago`)
    }
    tick()
    const id = setInterval(tick, 10_000)
    return () => clearInterval(id)
  }, [at])

  return <span className="text-xs text-term-muted mono">{label && `updated ${label}`}</span>
}
