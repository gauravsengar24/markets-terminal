import { Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { AuroraBackground } from "./AuroraBackground"
import { ParticleSystem } from "./ParticleSystem"

function SceneContent() {
  return (
    <>
      <AuroraBackground />
      <ParticleSystem />
    </>
  )
}

export function Scene3D() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
      <Suspense fallback={null}>
        <Canvas
          camera={{ position: [0, 0, 1], fov: 50, near: 0.1, far: 20 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            stencil: false,
            depth: true,
          }}
          dpr={[1, 1.5]}
          flat
          style={{ background: "transparent" }}
        >
          <SceneContent />
        </Canvas>
      </Suspense>
    </div>
  )
}
