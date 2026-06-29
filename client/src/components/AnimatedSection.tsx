import { motion } from "framer-motion"
import { type ReactNode } from "react"
import { ScrollReveal } from "./ScrollReveal"

interface Props {
  children: ReactNode
  className?: string
  title?: string
  subtitle?: string
  gradient?: "cyan-violet" | "violet-pink" | "emerald-cyan" | "orange-red" | "gold-amber"
  accentColor?: string
  delay?: number
  fullHeight?: boolean
  id?: string
}

const GRADIENT_MAPS = {
  "cyan-violet": { from: "rgba(0,229,255,0.12)", via: "rgba(124,58,237,0.08)", to: "transparent", border: "rgba(0,229,255,0.12)" },
  "violet-pink": { from: "rgba(124,58,237,0.12)", via: "rgba(236,72,153,0.08)", to: "transparent", border: "rgba(124,58,237,0.12)" },
  "emerald-cyan": { from: "rgba(16,185,129,0.10)", via: "rgba(0,229,255,0.06)", to: "transparent", border: "rgba(16,185,129,0.12)" },
  "orange-red": { from: "rgba(245,158,11,0.10)", via: "rgba(239,68,68,0.06)", to: "transparent", border: "rgba(245,158,11,0.12)" },
  "gold-amber": { from: "rgba(245,158,11,0.10)", via: "rgba(217,119,6,0.06)", to: "transparent", border: "rgba(245,158,11,0.12)" },
}

export function AnimatedSection({
  children, className = "", title, subtitle, gradient = "cyan-violet",
  accentColor, delay = 0, fullHeight, id,
}: Props) {
  const g = GRADIENT_MAPS[gradient]
  return (
    <section
      id={id}
      className={`relative ${fullHeight ? "min-h-screen" : "py-8 sm:py-10 md:py-16"} ${className}`}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${g.from}, ${g.via}, ${g.to})`,
          borderTop: `1px solid ${g.border}`,
        }}
      />
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        {(title || subtitle) && (
          <ScrollReveal direction="up" delay={delay}>
            <div className="text-center mb-8 md:mb-12">
              {title && (
                <motion.h2
                  className="section-title"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  {title}
                </motion.h2>
              )}
              {subtitle && (
                <motion.p
                  className="section-subtitle"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                >
                  {subtitle}
                </motion.p>
              )}
            </div>
          </ScrollReveal>
        )}
        {children}
      </div>
    </section>
  )
}
