import { motion } from "framer-motion"
import { type ReactNode } from "react"
import { ScrollReveal } from "./ScrollReveal"

interface Props {
  children: ReactNode
  className?: string
  title?: string
  subtitle?: string
  gradient?: "blue-purple" | "pink-gold" | "green-teal" | "orange-red" | "purple-pink"
  accentColor?: string
  delay?: number
  fullHeight?: boolean
  id?: string
}

const GRADIENT_MAPS = {
  "blue-purple": { from: "rgba(96,205,255,0.15)", via: "rgba(180,140,255,0.1)", to: "transparent", border: "rgba(96,205,255,0.15)" },
  "pink-gold": { from: "rgba(255,100,180,0.15)", via: "rgba(255,180,50,0.1)", to: "transparent", border: "rgba(255,100,180,0.15)" },
  "green-teal": { from: "rgba(34,197,94,0.12)", via: "rgba(96,205,255,0.08)", to: "transparent", border: "rgba(34,197,94,0.15)" },
  "orange-red": { from: "rgba(255,100,50,0.12)", via: "rgba(239,68,68,0.08)", to: "transparent", border: "rgba(255,100,50,0.15)" },
  "purple-pink": { from: "rgba(180,140,255,0.15)", via: "rgba(255,100,180,0.1)", to: "transparent", border: "rgba(180,140,255,0.15)" },
}

export function AnimatedSection({
  children, className = "", title, subtitle, gradient = "blue-purple",
  accentColor, delay = 0, fullHeight, id,
}: Props) {
  const g = GRADIENT_MAPS[gradient]
  return (
    <section
      id={id}
      className={`relative ${fullHeight ? "min-h-screen" : "py-12 md:py-16"} ${className}`}
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
