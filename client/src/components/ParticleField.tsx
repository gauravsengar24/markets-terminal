import { useRef, useEffect, useCallback } from "react"

interface Particle {
  x: number; y: number; vx: number; vy: number; size: number
  alpha: number; alphaSpeed: number; color: string
}

const COLORS = ["rgba(96,205,255", "rgba(180,140,255", "rgba(255,100,180", "rgba(59,130,246", "rgba(255,180,50"]

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const dimsRef = useRef({ w: 0, h: 0 })

  const initParticles = useCallback((w: number, h: number) => {
    const count = Math.min(80, Math.floor((w * h) / 15000))
    const p: Particle[] = []
    for (let i = 0; i < count; i++) {
      p.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2.5 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
        alphaSpeed: (Math.random() - 0.5) * 0.005,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      })
    }
    particlesRef.current = p
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    let frameId: number

    function resize() {
      const w = window.innerWidth
      const h = window.innerHeight
      canvas!.width = w * devicePixelRatio
      canvas!.height = h * devicePixelRatio
      canvas!.style.width = `${w}px`
      canvas!.style.height = `${h}px`
      ctx.scale(devicePixelRatio, devicePixelRatio)
      dimsRef.current = { w, h }
      if (particlesRef.current.length === 0) initParticles(w, h)
    }

    resize()
    window.addEventListener("resize", resize)

    function draw(time: number) {
      ctx.clearRect(0, 0, dimsRef.current.w, dimsRef.current.h)
      const particles = particlesRef.current
      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.alpha += p.alphaSpeed
        if (p.alpha > 0.5 || p.alpha < 0.05) p.alphaSpeed *= -1

        if (p.x < 0) p.x = dimsRef.current.w
        if (p.x > dimsRef.current.w) p.x = 0
        if (p.y < 0) p.y = dimsRef.current.h
        if (p.y > dimsRef.current.h) p.y = 0

        const dx = mx - p.x
        const dy = my - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 120) {
          p.vx -= dx / dist * 0.02
          p.vy -= dy / dist * 0.02
        }
        p.vx *= 0.99
        p.vy *= 0.99

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `${p.color},${p.alpha})`
        ctx.fill()

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const ddx = p.x - p2.x
          const ddy = p.y - p2.y
          const d = Math.sqrt(ddx * ddx + ddy * ddy)
          if (d < 100) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(255,255,255,${(1 - d / 100) * 0.08})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      frameId = requestAnimationFrame(draw)
    }

    frameId = requestAnimationFrame(draw)

    function onMouse(e: MouseEvent) {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener("mousemove", onMouse)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", onMouse)
    }
  }, [initParticles])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
