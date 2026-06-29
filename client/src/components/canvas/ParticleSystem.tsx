import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

const COUNT = 120
const COLOR = new THREE.Color("#00e5ff")

const vertexShader = `
  attribute float aSize;
  attribute float aAlpha;
  attribute float aPhase;
  varying float vAlpha;
  uniform float uTime;
  uniform float uScroll;

  void main() {
    vec3 pos = position;

    float drift = uScroll * 0.3;
    pos.x += sin(uTime * 0.04 + aPhase + drift) * 0.2;
    pos.y += cos(uTime * 0.03 + aPhase * 1.3 + drift) * 0.2;
    pos.z += sin(uTime * 0.02 + aPhase * 0.7 + drift) * 0.1;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (180.0 / -mvPos.z);
    gl_Position = projectionMatrix * mvPos;

    float fadeIn = smoothstep(0.0, 6.0, uTime - aPhase * 0.5);
    float pulse = 0.5 + 0.5 * sin(uTime * 0.15 + aPhase);
    vAlpha = aAlpha * fadeIn * pulse;
  }
`

const fragmentShader = `
  varying float vAlpha;

  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float d = length(center);
    if (d > 0.5) discard;
    float glow = exp(-d * 8.0);
    gl_FragColor = vec4(0.0, 0.6, 1.0, vAlpha * glow * 0.25);
  }
`

export function ParticleSystem({ scroll = 0 }: { scroll?: number }) {
  const ref = useRef<THREE.Points>(null!)

  const [positions, sizes, alphas, phases] = useMemo(() => {
    const pos = new Float32Array(COUNT * 3)
    const siz = new Float32Array(COUNT)
    const alp = new Float32Array(COUNT)
    const pha = new Float32Array(COUNT)

    for (let i = 0; i < COUNT; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 1.5 + Math.random() * 4
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.cos(phi) * 0.6
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)

      siz[i] = Math.random() * 0.04 + 0.01
      alp[i] = Math.random() * 0.08 + 0.02
      pha[i] = Math.random() * Math.PI * 2
    }
    return [pos, siz, alp, pha]
  }, [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const mat = ref.current.material as THREE.ShaderMaterial
    mat.uniforms.uTime.value = t
    mat.uniforms.uScroll.value = scroll
  })

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1))
    g.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1))
    g.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1))
    return g
  }, [positions, sizes, alphas, phases])

  return (
    <points ref={ref} geometry={geo}>
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{ uTime: { value: 0 }, uScroll: { value: 0 } }}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </points>
  )
}
