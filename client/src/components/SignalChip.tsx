import { motion } from "framer-motion"

interface SignalChipProps {
  ticker: string
  change?: number
  sentiment?: "bullish" | "bearish" | "neutral"
  label?: string
}

export function SignalChip({ ticker, change, sentiment, label }: SignalChipProps) {
  const isPositive = change !== undefined ? change >= 0 : sentiment === "bullish"
  const color = isPositive ? "#22c55e" : "#ef4444"
  const bgColor = isPositive ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)"

  return (
    <motion.span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold leading-none"
      style={{
        background: bgColor,
        border: `1px solid ${color}25`,
        color,
        letterSpacing: "-0.01em",
        fontFamily: "'JetBrains Mono', monospace",
      }}
      whileHover={{ scale: 1.05 }}
    >
      <span className="font-bold">{ticker}</span>
      {change !== undefined && (
        <span>{isPositive ? "+" : ""}{change.toFixed(2)}%</span>
      )}
      {label && (
        <span className="opacity-70">{label}</span>
      )}
    </motion.span>
  )
}
