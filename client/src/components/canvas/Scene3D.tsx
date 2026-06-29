import { Suspense, useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { AuroraBackground } from "./AuroraBackground"
import { ParticleSystem } from "./ParticleSystem"
import { FloatingGeometries } from "./FloatingGeometries"
import { MarketRings } from "./MarketRings"
import { HeroGlobe } from "./HeroGlobe"
import { PostFX } from "./PostFX"
import * as THREE from "three"

function SceneContent({ scroll }: { scroll: number }) {
  const groupRef = useRef<THREE.Group>(null!)

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.x = scroll * 0.05
      groupRef.current.rotation.y = scroll * 0.03
    }
  })

  return (
    <group ref={groupRef}>
      <AuroraBackground scroll={scroll} />
      <ParticleSystem scroll={scroll} />
      <FloatingGeometries />
      <MarketRings />
      <HeroGlobe />
      <PostFX />
    </group>
  )
}

export function Scene3D({ scrollProgress = 0 }: { scrollProgress?: number }) {
  return (
    <Suspense fallback={null}>
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 55, near: 0.1, far: 30 }}
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
        <SceneContent scroll={scrollProgress} />
      </Canvas>
    </Suspense>
  )
}
