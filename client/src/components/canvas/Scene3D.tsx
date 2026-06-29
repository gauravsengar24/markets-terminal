import { motion } from "framer-motion"

const ORBS = [
  { size: 600, color: "rgba(0,229,255,0.04)", blur: 120, x: 15, y: 20, dx: -80, dy: -60, dur: 8, d: 0 },
  { size: 500, color: "rgba(124,58,237,0.03)", blur: 150, x: 70, y: 30, dx: 60, dy: -80, dur: 10, d: 1 },
  { size: 400, color: "rgba(0,229,255,0.025)", blur: 100, x: 40, y: 60, dx: -40, dy: 60, dur: 9, d: 2 },
  { size: 350, color: "rgba(236,72,153,0.02)", blur: 140, x: 80, y: 70, dx: 50, dy: 40, dur: 11, d: 3 },
  { size: 450, color: "rgba(124,58,237,0.025)", blur: 130, x: 10, y: 80, dx: 70, dy: -40, dur: 7, d: 1.5 },
]

export function Scene3D({ scrollProgress = 0 }: { scrollProgress?: number }) {
  const s = scrollProgress

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" style={{ background: "var(--color-oled-black)" }}>
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(${120 + s * 25}deg, rgba(0,229,255,0.03) 0%, rgba(124,58,237,0.02) 30%, transparent 60%)`,
          y: s * -40,
        }}
      />

      {ORBS.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.size, height: orb.size,
            background: `radial-gradient(circle at 30% 30%, ${orb.color}, transparent)`,
            filter: `blur(${orb.blur}px)`,
            willChange: "transform",
            left: `${orb.x}%`,
            top: `${orb.y + s * orb.dy * 0.02}%`,
          }}
          animate={{
            left: [`${orb.x}%`, `${orb.x + 0.8}%`, `${orb.x - 0.5}%`, `${orb.x}%`],
            top: [`${orb.y + s * orb.dy * 0.02}%`, `${orb.y + s * orb.dy * 0.02 - 0.6}%`, `${orb.y + s * orb.dy * 0.02 + 0.4}%`, `${orb.y + s * orb.dy * 0.02}%`],
          }}
          transition={{
            duration: orb.dur,
            repeat: Infinity,
            ease: "easeInOut",
            delay: orb.d,
          }}
        />
      ))}

      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,229,255,0.02), transparent)`,
          opacity: 0.3 + s * 0.5,
        }}
      />

      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: "40%",
          background: "linear-gradient(0deg, rgba(5,7,10,0.6) 0%, transparent 100%)",
        }}
      />
    </div>
  )
}
