import { useState, useEffect } from "react"

function getMarketInfo(now: Date) {
  const ny = new Date(now)
  ny.setHours(9, 30, 0, 0)
  const close = new Date(now)
  close.setHours(16, 0, 0, 0)
  const pre = new Date(now)
  pre.setHours(4, 0, 0, 0)
  const after = new Date(now)
  after.setHours(20, 0, 0, 0)

  const isWeekend = now.getDay() === 0 || now.getDay() === 6
  const ms = now.getTime()

  if (isWeekend || ms < pre.getTime()) {
    const nextOpen = new Date(now)
    nextOpen.setDate(nextOpen.getDate() + (now.getDay() === 6 ? 2 : 1))
    nextOpen.setHours(9, 30, 0, 0)
    const diff = nextOpen.getTime() - ms
    return { status: "closed" as const, label: "Market Closed", note: "Opens in", diff }
  }
  if (ms < ny.getTime()) {
    const diff = ny.getTime() - ms
    return { status: "pre" as const, label: "Pre-Market", note: "Opens in", diff }
  }
  if (ms < close.getTime()) {
    const diff = close.getTime() - ms
    return { status: "open" as const, label: "Market Open", note: "Closes in", diff }
  }
  if (ms < after.getTime()) {
    const diff = after.getTime() - ms
    return { status: "pre" as const, label: "After Hours", note: "Extended ends in", diff }
  }
  const nextOpen = new Date(now)
  nextOpen.setDate(nextOpen.getDate() + 1)
  nextOpen.setHours(9, 30, 0, 0)
  const diff = nextOpen.getTime() - ms
  return { status: "closed" as const, label: "Market Closed", note: "Opens in", diff }
}

function fmtCountdown(ms: number) {
  if (ms <= 0) return "00:00:00"
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function progressPct(now: Date): number {
  const open = new Date(now)
  open.setHours(9, 30, 0, 0)
  const close = new Date(now)
  close.setHours(16, 0, 0, 0)
  const ms = now.getTime()
  if (ms < open.getTime() || ms > close.getTime()) return 0
  return ((ms - open.getTime()) / (close.getTime() - open.getTime())) * 100
}

export function MarketTimer() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const info = getMarketInfo(now)
  const pct = progressPct(now)

  return (
    <div className="market-timer-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
        <span className={`market-timer-session ${info.status}`}>
          <span className="spot-market-dot" style={{
            background: info.status === "open" ? "#10b981" : info.status === "pre" ? "#d4a017" : "#ef4444"
          }} />
          {info.label}
        </span>
        <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>
          NYSE
        </span>
      </div>
      <div className="market-timer-count">{fmtCountdown(info.diff)}</div>
      <div className="market-timer-note">{info.note} {info.status === "open" ? "" : "next session"}</div>

      <div className="market-timer-bar">
        <div className="market-timer-bar-fill" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6875rem", color: "var(--color-text-tertiary)", marginTop: "0.25rem" }}>
        <span>9:30 AM</span>
        <span>4:00 PM ET</span>
      </div>
    </div>
  )
}
