import { Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { AuroraBackground } from "./AuroraBackground"
import { ParticleSystem } from "./ParticleSystem"

export function Scene3D({ scrollProgress = 0 }: { scrollProgress?: number }) {
  return (
    <Suspense fallback={null}>
      <Canvas
        camera={{ position: [0, 0, 2], fov: 60, near: 0.1, far: 10 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
          depth: false,
        }}
        dpr={[1, 1.5]}
        flat
        style={{ background: "transparent" }}
      >
        <AuroraBackground scroll={scrollProgress} />
        <ParticleSystem scroll={scrollProgress} />
      </Canvas>
    </Suspense>
  )
}
