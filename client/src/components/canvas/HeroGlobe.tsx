import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

export function HeroGlobe() {
  const groupRef = useRef<THREE.Group>(null!)
  const innerRef = useRef<THREE.Mesh>(null!)

  const [outerPositions, outerIndices] = useMemo(() => {
    const positions: number[] = []
    const indices: number[] = []
    const segments = 32
    const radius = 1.2

    for (let i = 0; i <= segments; i++) {
      const lat = Math.PI * (i / segments)
      for (let j = 0; j <= segments; j++) {
        const lng = 2 * Math.PI * (j / segments)
        const x = radius * Math.sin(lat) * Math.cos(lng)
        const y = radius * Math.cos(lat)
        const z = radius * Math.sin(lat) * Math.sin(lng)
        positions.push(x, y, z)
      }
    }

    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < segments; j++) {
        const a = i * (segments + 1) + j
        const b = i * (segments + 1) + j + 1
        const c = (i + 1) * (segments + 1) + j
        const d = (i + 1) * (segments + 1) + j + 1
        indices.push(a, b, c)
        indices.push(b, d, c)
      }
    }

    return [new Float32Array(positions), new Uint16Array(indices)]
  }, [])

  const outerGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.BufferAttribute(outerPositions, 3))
    g.setIndex(new THREE.BufferAttribute(outerIndices, 1))
    g.computeVertexNormals()
    return g
  }, [outerPositions, outerIndices])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    groupRef.current.rotation.y = t * 0.08
    groupRef.current.rotation.x = Math.sin(t * 0.03) * 0.1
    if (innerRef.current) {
      innerRef.current.rotation.y = -t * 0.12
      innerRef.current.rotation.x = Math.sin(t * 0.02 + 1) * 0.15
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, -2]}>
      <mesh ref={innerRef} scale={0.6}>
        <icosahedronGeometry args={[1, 1]} />
        <meshPhysicalMaterial
          color="#60cdff"
          transparent
          opacity={0.06}
          wireframe
          roughness={0.2}
          metalness={0.9}
          depthWrite={false}
        />
      </mesh>
      <mesh geometry={outerGeo} scale={1.0}>
        <meshBasicMaterial
          color="#60cdff"
          wireframe
          transparent
          opacity={0.08}
          depthWrite={false}
        />
      </mesh>
      <mesh scale={1.4}>
        <icosahedronGeometry args={[1, 0]} />
        <meshBasicMaterial
          color="#b48cff"
          wireframe
          transparent
          opacity={0.04}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
