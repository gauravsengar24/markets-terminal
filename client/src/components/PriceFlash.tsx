import { useState, useEffect, useRef } from "react"

interface Props {
  price: number
  children: React.ReactNode
}

export function PriceFlash({ price, children }: Props) {
  const prevRef = useRef(price)
  const [flash, setFlash] = useState<"up" | "down" | null>(null)

  useEffect(() => {
    if (prevRef.current !== price && price > 0 && prevRef.current > 0) {
      setFlash(price > prevRef.current ? "up" : "down")
      const t = setTimeout(() => setFlash(null), 700)
      prevRef.current = price
      return () => clearTimeout(t)
    }
    prevRef.current = price
  }, [price])

  if (!flash) return <>{children}</>

  return (
    <span className="relative inline-flex items-center" style={{ borderRadius: "4px", overflow: "hidden" }}>
      {children}
      <span
        style={{
          position: "absolute", inset: 0, pointerEvents: "none", borderRadius: "4px", opacity: 0.6,
          background: flash === "up" ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.18)",
          animation: "fade-out-flash 0.7s ease-out forwards",
        }}
      />
    </span>
  )
}
