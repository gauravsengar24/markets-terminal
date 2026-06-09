import { useEffect, useState } from "react"

export function LastUpdated({ at }: { at: number }) {
  const [label, setLabel] = useState("")

  useEffect(() => {
    function tick() {
      if (!at) return setLabel("")
      const s = Math.floor((Date.now() - at) / 1000)
      if (s < 60) setLabel("just now")
      else if (s < 3600) setLabel(`${Math.floor(s / 60)}m ago`)
      else setLabel(`${Math.floor(s / 3600)}h ago`)
    }
    tick()
    const id = setInterval(tick, 10_000)
    return () => clearInterval(id)
  }, [at])

  return <span className="mono" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{label && `updated ${label}`}</span>
}
