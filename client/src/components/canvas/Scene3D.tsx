import { Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { Environment } from "@react-three/drei"
import { AuroraBackground } from "./AuroraBackground"
import { FloatingGeometries } from "./FloatingGeometries"
import { MarketRings } from "./MarketRings"
import { ParticleSystem } from "./ParticleSystem"
import { PostFX } from "./PostFX"
import { HeroGlobe } from "./HeroGlobe"

interface Scene3DProps {
  variant?: "full" | "minimal"
}

function SceneContent({ variant }: Scene3DProps) {
  return (
    <>
      <AuroraBackground />
      <FloatingGeometries />
      <MarketRings />
      <ParticleSystem />
      {variant === "full" && <HeroGlobe />}
      <PostFX />
      <Environment preset="night" />
    </>
  )
}

export function Scene3D({ variant = "full" }: Scene3DProps) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
      <Suspense fallback={null}>
        <Canvas
          camera={{ position: [0, 0, 3.5], fov: 70, near: 0.1, far: 20 }}
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
          <SceneContent variant={variant} />
        </Canvas>
      </Suspense>
    </div>
  )
}
