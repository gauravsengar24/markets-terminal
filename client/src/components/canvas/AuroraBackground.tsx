import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

const vertex = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragment = `
uniform float uTime;
uniform vec2 uResolution;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  vec2 shift = vec2(100.0);
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.0 + shift; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = vUv;

  float n1 = fbm(uv * 0.8 + uTime * 0.008);
  float n2 = fbm(uv * 1.2 - uTime * 0.006 + 1.0);
  float n3 = fbm(uv * 0.5 + uTime * 0.004 + 2.0);

  float r = 0.05 + 0.04 * n1 + 0.02 * n2;
  float g = 0.06 + 0.035 * n2 + 0.02 * n3;
  float b = 0.12 + 0.06 * n1 + 0.04 * n3;

  float vignette = 1.0 - length(vUv - 0.5) * 0.5;
  vec3 col = vec3(r, g, b) * vignette;

  float glow = 0.02 * (n1 + n2) * smoothstep(0.4, 0.8, abs(uv.y - 0.5));
  col += vec3(0.2, 0.3, 0.6) * glow;

  col = pow(col, vec3(1.0 / 2.2));

  gl_FragColor = vec4(col, 0.85);
}
`

export function AuroraBackground() {
  const ref = useRef<THREE.ShaderMaterial>(null!)

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.uniforms.uTime.value = clock.getElapsedTime()
    }
  })

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1920, 1080) },
  }), [])

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={ref}
        uniforms={uniforms}
        vertexShader={vertex}
        fragmentShader={fragment}
        depthWrite={false}
        transparent
      />
    </mesh>
  )
}
