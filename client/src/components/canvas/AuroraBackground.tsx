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

  float scrollInfluence = uScroll * 0.5;

  float t1 = uTime * 0.006 + scrollInfluence * 0.2;
  float t2 = uTime * 0.004 - scrollInfluence * 0.15;
  float t3 = uTime * 0.003 + scrollInfluence * 0.1;

  float n1 = fbm(uv * 0.8 + t1);
  float n2 = fbm(uv * 1.2 + t2 + 1.0);
  float n3 = fbm(uv * 0.5 + t3 + 2.0);

  float shift = uScroll * 0.3;

  float r = 0.02 + 0.03 * n1 + 0.01 * n2 + shift * 0.02;
  float g = 0.04 + 0.025 * n2 + 0.02 * n3 + (1.0 - abs(shift - 0.5)) * 0.02;
  float b = 0.10 + 0.05 * n1 + 0.03 * n3 + (1.0 - shift) * 0.03;

  float vignette = 1.0 - length(vUv - 0.5) * 0.6;
  vec3 col = vec3(r, g, b) * vignette;

  float glow = 0.025 * (n1 + n2) * smoothstep(0.3, 0.7, abs(uv.y - 0.5));
  float cyanMix = 0.3 + scrollInfluence * 0.3;
  float violetMix = 0.4 - scrollInfluence * 0.2;
  col += vec3(cyanMix * 0.2, 0.25, 0.5 + violetMix * 0.2) * glow;
  col += vec3(0.0, 0.02, 0.04) * (1.0 - abs(uv.y - 0.5) * 2.0);

  col = pow(col, vec3(1.0 / 2.2));

  float alpha = 0.75 + scrollInfluence * 0.1;
  gl_FragColor = vec4(col, alpha);
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
    uResolution: { value: new THREE.Vector2(1920, 1080) },
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
