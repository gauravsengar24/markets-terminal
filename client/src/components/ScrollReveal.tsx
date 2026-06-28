import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface Props {
  children: ReactNode
  className?: string
  direction?: "up" | "down" | "left" | "right" | "none"
  delay?: number
  duration?: number
  distance?: number
  once?: boolean
  style?: React.CSSProperties
}

const directionVariants = {
  up: { hidden: { opacity: 0, y: 60 }, visible: { opacity: 1, y: 0 } },
  down: { hidden: { opacity: 0, y: -60 }, visible: { opacity: 1, y: 0 } },
  left: { hidden: { opacity: 0, x: -60 }, visible: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: 60 }, visible: { opacity: 1, x: 0 } },
  none: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
}

export function ScrollReveal({
  children, className = "", direction = "up", delay = 0,
  duration = 0.5, distance = 60, once = true, style,
}: Props) {
  const v = directionVariants[direction]
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-40px" }}
      variants={{
        hidden: { ...v.hidden, y: direction === "up" ? distance : direction === "down" ? -distance : 0, x: direction === "left" ? -distance : direction === "right" ? distance : 0 },
        visible: { ...v.visible, transition: { duration, ease: [0.16, 1, 0.3, 1], delay } },
      }}
      style={style}
    >
      {children}
    </motion.div>
  )
}

export function StaggerReveal({ children, className, stagger = 0.04, once = true }: { children: ReactNode; className?: string; stagger?: number; once?: boolean }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-40px" }}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  )
}

export const staggerItem = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } },
} as const
