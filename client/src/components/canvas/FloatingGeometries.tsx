import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

interface GeoConfig {
  type: "icosahedron" | "torusKnot" | "octahedron" | "dodecahedron" | "sphere"
  position: [number, number, number]
  rotationSpeed: [number, number, number]
  floatSpeed: number
  floatAmplitude: number
  scale: number
  color: string
  wireframe?: boolean
  opacity: number
  phase: number
}

const geometries: GeoConfig[] = [
  { type: "icosahedron", position: [-2.5, 1.2, -1.5], rotationSpeed: [0.3, 0.5, 0.1], floatSpeed: 0.8, floatAmplitude: 0.3, scale: 0.6, color: "#60cdff", wireframe: true, opacity: 0.15, phase: 0 },
  { type: "torusKnot", position: [2.8, -0.8, -2], rotationSpeed: [0.4, 0.2, 0.3], floatSpeed: 0.6, floatAmplitude: 0.4, scale: 0.5, color: "#b48cff", wireframe: true, opacity: 0.12, phase: 1.5 },
  { type: "octahedron", position: [-1.5, -1.5, -1], rotationSpeed: [0.2, 0.6, 0.1], floatSpeed: 1.0, floatAmplitude: 0.25, scale: 0.4, color: "#ff64b4", wireframe: true, opacity: 0.1, phase: 3.0 },
  { type: "dodecahedron", position: [3.2, 1.5, -3], rotationSpeed: [0.15, 0.3, 0.05], floatSpeed: 0.5, floatAmplitude: 0.5, scale: 0.7, color: "#22c55e", wireframe: false, opacity: 0.06, phase: 4.5 },
  { type: "sphere", position: [0, 2.5, -1.5], rotationSpeed: [0.1, 0.2, 0.05], floatSpeed: 0.7, floatAmplitude: 0.2, scale: 0.3, color: "#60cdff", wireframe: false, opacity: 0.08, phase: 2.0 },
  { type: "torusKnot", position: [-3.5, -1.8, -2.5], rotationSpeed: [0.25, 0.35, 0.15], floatSpeed: 0.9, floatAmplitude: 0.35, scale: 0.45, color: "#f0b429", wireframe: true, opacity: 0.1, phase: 5.0 },
  { type: "icosahedron", position: [1.8, -2.2, -2], rotationSpeed: [0.35, 0.15, 0.2], floatSpeed: 0.6, floatAmplitude: 0.3, scale: 0.35, color: "#3b82f6", wireframe: false, opacity: 0.07, phase: 6.0 },
]

function FloatingMesh({ config }: { config: GeoConfig }) {
  const ref = useRef<THREE.Mesh>(null!)
  const startY = config.position[1]

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const speed = config.rotationSpeed
    ref.current.rotation.x += speed[0] * 0.008
    ref.current.rotation.y += speed[1] * 0.008
    ref.current.rotation.z += speed[2] * 0.008
    ref.current.position.y = startY + Math.sin(t * config.floatSpeed + config.phase) * config.floatAmplitude
  })

  const geo = useMemo(() => {
    switch (config.type) {
      case "icosahedron": return new THREE.IcosahedronGeometry(config.scale, 0)
      case "torusKnot": return new THREE.TorusKnotGeometry(config.scale * 0.8, config.scale * 0.3, 64, 8)
      case "octahedron": return new THREE.OctahedronGeometry(config.scale)
      case "dodecahedron": return new THREE.DodecahedronGeometry(config.scale)
      case "sphere": return new THREE.SphereGeometry(config.scale, 24, 24)
    }
  }, [config.type, config.scale])

  return (
    <mesh ref={ref} position={config.position} geometry={geo}>
      <meshPhysicalMaterial
        color={config.color}
        wireframe={config.wireframe}
        transparent
        opacity={config.opacity}
        roughness={0.3}
        metalness={0.8}
        envMapIntensity={0.5}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

export function FloatingGeometries() {
  return (
    <group>
      {geometries.map((g, i) => (
        <FloatingMesh key={i} config={g} />
      ))}
    </group>
  )
}
