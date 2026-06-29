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
uniform float uScroll;
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
  for (int i = 0; i < 3; i++) { v += a * noise(p); p = p * 2.0 + shift; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = vUv;
  vec2 p = uv - 0.5;

  float t = uTime * 0.004 + uScroll * 0.15;

  float n1 = fbm(p * 1.5 + t);
  float n2 = fbm(p * 2.0 - t * 0.6 + 1.5);

  float band = smoothstep(0.4, 0.6, abs(p.y) * 1.2 + n1 * 0.3);

  float r = 0.01 + 0.04 * n1 * band;
  float g = 0.02 + 0.04 * n2 * band + 0.02;
  float b = 0.06 + 0.08 * (1.0 - band) + 0.03 * n2;

  float cyanShift = 0.3 + uScroll * 0.15;
  float violetShift = 0.5 - uScroll * 0.1;

  vec3 col = vec3(r, g, b);
  col += vec3(0.0, 0.03, 0.06) * (1.0 - band);
  col += vec3(cyanShift * 0.15, 0.15, 0.3 + violetShift * 0.15) * n2 * 0.5;

  float vignette = 1.0 - dot(p, p) * 0.8;
  col *= vignette;

  col = pow(col, vec3(1.0 / 2.2));

  gl_FragColor = vec4(col, 0.65);
}
`

export function AuroraBackground({ scroll = 0 }: { scroll?: number }) {
  const ref = useRef<THREE.ShaderMaterial>(null!)

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.uniforms.uTime.value = clock.getElapsedTime()
      ref.current.uniforms.uScroll.value = scroll
    }
  })

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uScroll: { value: scroll },
  }), [scroll])

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
