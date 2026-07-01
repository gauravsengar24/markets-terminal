import { useState, useEffect, useRef, useMemo } from "react"

const TIMEFRAMES = ["1D", "1W", "1M", "3M", "1Y"] as const
type TF = (typeof TIMEFRAMES)[number]

function generateData(points: number, seed: number): number[] {
  const arr: number[] = []
  let v = seed
  for (let i = 0; i < points; i++) {
    v += (Math.random() - 0.48) * seed * 0.012
    arr.push(v)
  }
  return arr
}

const GOLD_SEED = 2415
const SILVER_SEED = 30.82

export function PriceChart() {
  const [tf, setTf] = useState<TF>("1M")
  const [hover, setHover] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ w: 600, h: 200 })
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setDims({ w: entry.contentRect.width, h: 220 })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  const n = useMemo(() => {
    const counts: Record<TF, number> = { "1D": 24, "1W": 40, "1M": 60, "3M": 90, "1Y": 120 }
    return counts[tf]
  }, [tf])
  const goldData = useMemo(() => generateData(n, GOLD_SEED), [n])
  const silverData = useMemo(() => generateData(n, SILVER_SEED), [n])

  const pad = { t: 20, r: 16, b: 24, l: 48 }
  const cw = dims.w - pad.l - pad.r
  const ch = dims.h - pad.t - pad.b

  const gMin = Math.min(...goldData) * 0.998
  const gMax = Math.max(...goldData) * 1.002
  const sMin = Math.min(...silverData) * 0.998
  const sMax = Math.max(...silverData) * 1.002

  function xPos(i: number) {
    return pad.l + (i / (n - 1)) * cw
  }
  function yPos(val: number, lo: number, hi: number) {
    return pad.t + ch - ((val - lo) / (hi - lo)) * ch
  }

  const goldPath = goldData.map((v, i) => `${i === 0 ? "M" : "L"}${xPos(i).toFixed(1)},${yPos(v, gMin, gMax).toFixed(1)}`).join(" ")
  const goldFill = `${goldPath}L${xPos(n - 1)},${pad.t + ch}L${xPos(0)},${pad.t + ch}Z`
  const silverPath = silverData.map((v, i) => `${i === 0 ? "M" : "L"}${xPos(i).toFixed(1)},${yPos(v, sMin, sMax).toFixed(1)}`).join(" ")

  const gf = goldData[0]
  const gl = goldData[n - 1]
  const sf = silverData[0]
  const sl = silverData[n - 1]

  const formatPrice = (v: number) =>
    v > 100 ? `$${v.toFixed(2)}` : `$${v.toFixed(2)}`

  const hoverIdx = hover !== null ? Math.round((hover - pad.l) / cw * (n - 1)) : null
  const hx = hoverIdx !== null ? xPos(Math.max(0, Math.min(n - 1, hoverIdx))) : null

  const gYLabel = (v: number) => `$${v.toFixed(0)}`
  const yTicks = [gMin, (gMin + gMax) / 2, gMax]

  return (
    <div className="chart-wrapper">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
        <h3 className="chart-title" style={{ margin: 0 }}>
          Gold & Silver — Price Chart
        </h3>
        <div className="chart-timeframes">
          {TIMEFRAMES.map(t => (
            <button key={t} className={`chart-tf-btn${tf === t ? " active" : ""}`} onClick={() => setTf(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div ref={containerRef} className="chart-svg-wrap" style={{ height: dims.h }}
        onMouseMove={e => {
          const rect = containerRef.current?.getBoundingClientRect()
          if (rect) setHover(e.clientX - rect.left)
        }}
        onMouseLeave={() => setHover(null)}
      >
        <svg width={dims.w} height={dims.h} style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d4a017" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#d4a017" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="silverFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9ca3af" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#9ca3af" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {yTicks.map((v, i) => (
            <g key={i}>
              <line x1={pad.l} y1={yPos(v, gMin, gMax)} x2={pad.l + cw} y2={yPos(v, gMin, gMax)}
                stroke="var(--color-border)" strokeWidth={1} />
              <text x={pad.l - 6} y={yPos(v, gMin, gMax) + 4} textAnchor="end"
                fill="var(--color-text-tertiary)" fontSize={10} fontFamily="Inter,sans-serif">
                {gYLabel(v)}
              </text>
            </g>
          ))}

          {[0, Math.floor(n / 2), n - 1].map(i => (
            <text key={i} x={xPos(i)} y={pad.t + ch + 14} textAnchor="middle"
              fill="var(--color-text-tertiary)" fontSize={10} fontFamily="Inter,sans-serif">
              {tf === "1D" ? `${i}h` : tf === "1W" ? `Day ${i + 1}` : i === 0 ? "Start" : i === n - 1 ? "Now" : ""}
            </text>
          ))}

          <path d={goldFill} fill="url(#goldFill)" style={{ opacity: visible ? 1 : 0, transition: "opacity 0.6s" }} />
          <path d={goldPath} fill="none" stroke="#d4a017" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            style={{ opacity: visible ? 1 : 0, transition: "opacity 0.6s" }} />

          <path d={silverPath} fill="none" stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
            style={{ opacity: visible ? 1 : 0, transition: "opacity 0.8s" }} />

          {hx !== null && (
            <>
              <line x1={hx} y1={pad.t} x2={hx} y2={pad.t + ch}
                stroke="var(--color-border-strong)" strokeWidth={1} strokeDasharray="3,3" />
              <circle cx={hx} cy={yPos(goldData[Math.max(0, Math.min(n - 1, hoverIdx!))], gMin, gMax)} r={4} fill="#d4a017" />
              <circle cx={hx} cy={yPos(silverData[Math.max(0, Math.min(n - 1, hoverIdx!))], sMin, sMax)} r={3} fill="#9ca3af" />
            </>
          )}
        </svg>
      </div>

      <div className="chart-legend">
        <div className="chart-legend-item">
          <span className="chart-legend-dot" style={{ background: "#d4a017" }} />
          <span>Gold <strong>{formatPrice(gl)}</strong></span>
          <span style={{ color: gl >= gf ? "var(--color-positive)" : "var(--color-negative)" }}>
            {gl >= gf ? "▲" : "▼"} {((gl / gf - 1) * 100).toFixed(2)}%
          </span>
        </div>
        <div className="chart-legend-item">
          <span className="chart-legend-dot" style={{ background: "#9ca3af" }} />
          <span>Silver <strong>{formatPrice(sl)}</strong></span>
          <span style={{ color: sl >= sf ? "var(--color-positive)" : "var(--color-negative)" }}>
            {sl >= sf ? "▲" : "▼"} {((sl / sf - 1) * 100).toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  )
}
