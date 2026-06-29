import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

const RING_CONFIGS = [
  { radius: 1.8, tubeRadius: 0.008, segments: 64, color: "#60cdff", opacity: 0.15, tilt: [0.2, 0.3, 0], speed: 0.15, phase: 0 },
  { radius: 2.4, tubeRadius: 0.006, segments: 80, color: "#b48cff", opacity: 0.12, tilt: [-0.3, 0.4, 0.1], speed: -0.1, phase: 1.0 },
  { radius: 3.0, tubeRadius: 0.005, segments: 96, color: "#ff64b4", opacity: 0.08, tilt: [0.1, -0.2, 0.2], speed: 0.08, phase: 2.0 },
  { radius: 1.2, tubeRadius: 0.004, segments: 48, color: "#22c55e", opacity: 0.1, tilt: [-0.1, 0.5, -0.1], speed: -0.2, phase: 3.0 },
]

function Ring({ config }: { config: typeof RING_CONFIGS[0] }) {
  const ref = useRef<THREE.Mesh>(null!)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    ref.current.rotation.x += config.speed * 0.005
    ref.current.rotation.y += config.speed * 0.008
    ref.current.rotation.z += config.speed * 0.003

    const pulse = 0.8 + 0.2 * Math.sin(t * 0.3 + config.phase)
    const mat = ref.current.material as THREE.MeshBasicMaterial
    mat.opacity = config.opacity * pulse
  })

  const geo = useMemo(
    () => new THREE.TorusGeometry(config.radius, config.tubeRadius, 8, config.segments),
    [config.radius, config.tubeRadius, config.segments]
  )

  return (
    <mesh
      ref={ref}
      geometry={geo}
      rotation={config.tilt as [number, number, number]}
    >
      <meshBasicMaterial
        color={config.color}
        transparent
        opacity={config.opacity}
        depthWrite={false}
      />
    </mesh>
  )
}

export function MarketRings() {
  return (
    <group position={[0, 0, -3]}>
      {RING_CONFIGS.map((c, i) => (
        <Ring key={i} config={c} />
      ))}
    </group>
  )
}
