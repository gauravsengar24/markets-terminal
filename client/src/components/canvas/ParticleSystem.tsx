import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

const COUNT = 200
const COLORS = [
  new THREE.Color("#1f93ff"),
  new THREE.Color("#60cdff"),
  new THREE.Color("#b48cff"),
]

const vertexShader = `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aAlpha;
  attribute float aPhase;
  varying float vAlpha;
  varying vec3 vColor;
  uniform float uTime;

  void main() {
    vColor = aColor;
    vec3 pos = position;

    float waveX = sin(pos.x * 0.3 + uTime * 0.08 + aPhase) * 0.3;
    float waveY = cos(pos.y * 0.3 + uTime * 0.06 + aPhase) * 0.3;
    float waveZ = sin((pos.x + pos.y) * 0.3 + uTime * 0.05 + aPhase) * 0.2;
    pos.x += waveX;
    pos.y += waveY;
    pos.z += waveZ;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (200.0 / -mvPos.z);
    gl_Position = projectionMatrix * mvPos;

    float fadeIn = smoothstep(0.0, 4.0, uTime - aPhase * 0.3);
    float pulse = 0.6 + 0.4 * sin(uTime * 0.3 + aPhase);
    vAlpha = aAlpha * fadeIn * pulse;
  }
`

const fragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float d = length(center);
    if (d > 0.5) discard;
    float glow = exp(-d * 6.0);
    float core = exp(-d * 16.0);
    vec3 col = vColor * (0.5 + 0.5 * core);
    col += vColor * glow * 0.3;
    gl_FragColor = vec4(col, vAlpha * glow * 0.5);
  }
`

export function ParticleSystem() {
  const ref = useRef<THREE.Points>(null!)

  const [positions, colors, sizes, alphas, phases] = useMemo(() => {
    const pos = new Float32Array(COUNT * 3)
    const col = new Float32Array(COUNT * 3)
    const siz = new Float32Array(COUNT)
    const alp = new Float32Array(COUNT)
    const pha = new Float32Array(COUNT)

    for (let i = 0; i < COUNT; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 3 + Math.random() * 5
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.cos(phi) * 0.4
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)

      const c = COLORS[Math.floor(Math.random() * COLORS.length)]
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
      siz[i] = Math.random() * 0.08 + 0.02
      alp[i] = Math.random() * 0.2 + 0.05
      pha[i] = Math.random() * Math.PI * 2
    }
    return [pos, col, siz, alp, pha]
  }, [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const mat = ref.current.material as THREE.ShaderMaterial
    mat.uniforms.uTime.value = t
  })

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    g.setAttribute("aColor", new THREE.BufferAttribute(colors, 3))
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1))
    g.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1))
    g.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1))
    return g
  }, [positions, colors, sizes, alphas, phases])

  return (
    <points ref={ref} geometry={geo}>
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{ uTime: { value: 0 } }}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </points>
  )
}
