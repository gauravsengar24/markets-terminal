import { Suspense, useRef, useMemo } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

const PARTICLE_COUNT = 120
const COLORS = [
  new THREE.Color("#60cdff"),
  new THREE.Color("#b48cff"),
  new THREE.Color("#ff64b4"),
  new THREE.Color("#3b82f6"),
  new THREE.Color("#ffb432"),
]

const vertexShader = `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aAlpha;
  attribute float aPhase;
  varying float vAlpha;
  varying vec3 vColor;

  uniform float uTime;
  uniform vec2 uMouse;

  void main() {
    vColor = aColor;
    vec3 pos = position;

    float waveX = sin(pos.x * 0.8 + uTime * 0.15 + aPhase) * 0.3;
    float waveY = cos(pos.y * 0.6 + uTime * 0.12 + aPhase) * 0.3;
    float waveZ = sin((pos.x + pos.y) * 0.5 + uTime * 0.1 + aPhase) * 0.2;
    pos.x += waveX;
    pos.y += waveY;
    pos.z += waveZ;

    vec2 mouseVec = uMouse - pos.xy;
    float dist = length(mouseVec);
    float influence = smoothstep(1.5, 0.0, dist);
    pos.x -= mouseVec.x * influence * 0.3;
    pos.y -= mouseVec.y * influence * 0.3;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (200.0 / -mvPos.z);
    gl_Position = projectionMatrix * mvPos;

    float fadeIn = smoothstep(0.0, 2.0, uTime - aPhase * 0.5);
    float pulse = 0.6 + 0.4 * sin(uTime * 0.5 + aPhase);
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

    float glow = 1.0 - smoothstep(0.0, 0.5, d);
    float core = 1.0 - smoothstep(0.0, 0.15, d);
    vec3 col = vColor * (0.8 + 0.4 * core);
    col += vColor * glow * 0.3;

    gl_FragColor = vec4(col, vAlpha * glow);
  }
`

function ParticleSystem() {
  const ref = useRef<THREE.Points>(null!)
  const { size, pointer } = useThree()
  const mouse = useRef(new THREE.Vector2(9999, 9999))

  const [positions, colors, sizes, alphas, phases] = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3)
    const col = new Float32Array(PARTICLE_COUNT * 3)
    const siz = new Float32Array(PARTICLE_COUNT)
    const alp = new Float32Array(PARTICLE_COUNT)
    const pha = new Float32Array(PARTICLE_COUNT)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 6
      pos[i * 3 + 1] = (Math.random() - 0.5) * 4
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2

      const c = COLORS[Math.floor(Math.random() * COLORS.length)]
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b

      siz[i] = Math.random() * 0.15 + 0.05
      alp[i] = Math.random() * 0.4 + 0.15
      pha[i] = Math.random() * Math.PI * 2
    }

    return [pos, col, siz, alp, pha]
  }, [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    mouse.current.lerp(
      new THREE.Vector2(
        (pointer.x * size.width) / size.width * 3 - 1.5,
        -(pointer.y * size.height) / size.height * 2 + 1
      ),
      0.05
    )

    const mat = ref.current.material as THREE.ShaderMaterial
    mat.uniforms.uTime.value = t
    mat.uniforms.uMouse.value = mouse.current
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
        uniforms={{
          uTime: { value: 0 },
          uMouse: { value: new THREE.Vector2(9999, 9999) },
        }}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </points>
  )
}

export function ParticleField() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
      <Suspense fallback={null}>
        <Canvas
          camera={{ position: [0, 0, 3], fov: 75, near: 0.1, far: 10 }}
          gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
          dpr={[1, 1.5]}
          style={{ background: "transparent" }}
        >
          <ParticleSystem />
        </Canvas>
      </Suspense>
    </div>
  )
}
