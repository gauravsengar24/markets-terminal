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
uniform vec2 uMouse;
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
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.0 + shift; a *= 0.5; }
  return v;
}

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(6.28318 * (c * t + d));
}

void main() {
  vec2 uv = vUv;

  float aurora1 = fbm(uv * 1.5 + uTime * 0.015);
  float aurora2 = fbm(uv * 2.0 - uTime * 0.02 + 1.0);
  float aurora3 = fbm(uv * 3.0 + uTime * 0.01 + 2.0);

  vec3 col1 = palette(aurora1 * 0.4 + uTime * 0.005,
    vec3(0.5, 0.5, 0.5), vec3(0.5, 0.5, 0.5), vec3(1.0, 1.0, 1.0),
    vec3(0.00, 0.10, 0.20));

  vec3 col2 = palette(aurora2 * 0.3 + uTime * 0.003 + 0.5,
    vec3(0.5, 0.5, 0.5), vec3(0.5, 0.5, 0.5), vec3(1.0, 1.0, 1.0),
    vec3(0.30, 0.20, 0.50));

  vec3 col3 = palette(aurora3 * 0.2 + uTime * 0.004 + 1.0,
    vec3(0.5, 0.5, 0.5), vec3(0.5, 0.5, 0.5), vec3(1.0, 1.0, 1.0),
    vec3(0.10, 0.40, 0.30));

  vec3 col = col1 * 0.4 + col2 * 0.35 + col3 * 0.25;

  float vignette = 1.0 - length(vUv - 0.5) * 0.6;
  col *= vignette;

  float mouseGlow = 0.0;
  vec2 m = uMouse;
  float d = distance(uv, m);
  mouseGlow = 0.08 / (d + 0.1);
  col += vec3(0.3, 0.5, 0.8) * mouseGlow * 0.3;

  col *= 0.7;
  col = pow(col, vec3(1.0 / 2.2));

  gl_FragColor = vec4(col, 1.0);
}
`

export function AuroraBackground() {
  const ref = useRef<THREE.ShaderMaterial>(null!)

  useFrame(({ clock, pointer, size }) => {
    if (ref.current) {
      ref.current.uniforms.uTime.value = clock.getElapsedTime()
      ref.current.uniforms.uMouse.value = new THREE.Vector2(
        pointer.x / size.width * 0.5 + 0.25,
        pointer.y / size.height * 0.5 + 0.25
      )
    }
  })

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1920, 1080) },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
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
