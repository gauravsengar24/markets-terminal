---
name: threejs-r3f-shader-uiux
description: >
  Master skill for building immersive, production-grade 3D UI/UX using Three.js,
  React Three Fiber (R3F), and GLSL fragment shaders (ShaderToy-compatible).
  Trigger this skill whenever the user wants: 3D backgrounds, hero sections,
  interactive scenes, WebGL effects, particle systems, shader animations, canvas
  overlays, scroll-driven 3D, noise/distortion effects, post-processing, or any
  GPU-accelerated visual design in a React or vanilla JS context. Also trigger for
  ShaderToy port requests, custom GLSL materials, or UI components with depth/
  motion/glow/liquid/chromatic-aberration aesthetics. Use even when the user says
  "make it look cool", "add depth", "animated background", or "shader effect".
---

# Three.js · React Three Fiber · Fragment Shaders — UI/UX Design Skill

## Quick Reference

| Domain | Use When | Core Import |
|---|---|---|
| **Three.js (vanilla)** | Non-React projects, custom render loops, raw WebGL control | `import * as THREE from 'three'` |
| **React Three Fiber** | React apps, declarative 3D, component-based scenes | `import { Canvas } from '@react-three/fiber'` |
| **Fragment Shaders** | GPU effects, noise, distortion, post-processing, backgrounds | `glsl` template literal or `.glsl` file |
| **Drei** | R3F helpers: camera, controls, text, environment, effects | `import { ... } from '@react-three/drei'` |
| **Postprocessing** | Bloom, DOF, chromatic aberration, scanlines, vignette | `import { EffectComposer } from '@react-three/postprocessing'` |

---

## 1. Project Setup

### React (R3F Stack — preferred for UI/UX)
```bash
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing
npm install glsl-shader-helpers   # optional GLSL utils
```

### Vanilla Three.js
```bash
npm install three
npm install vite-plugin-glsl      # for .glsl imports in Vite
```

### Vite GLSL config (vite.config.ts)
```ts
import glsl from 'vite-plugin-glsl';
export default { plugins: [glsl()] };
```

---

## 2. Three.js (Vanilla) — Core Patterns

### 2.1 Minimal Scene Setup
```js
import * as THREE from 'three';

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // cap at 2x for perf
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene   = new THREE.Scene();
const camera  = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 100);
camera.position.z = 3;

// Responsive resize
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// Render loop
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  renderer.render(scene, camera);
}
animate();
```

### 2.2 Custom ShaderMaterial (Three.js)
```js
const material = new THREE.ShaderMaterial({
  uniforms: {
    uTime:       { value: 0 },
    uResolution: { value: new THREE.Vector2(innerWidth, innerHeight) },
    uMouse:      { value: new THREE.Vector2(0.5, 0.5) },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec2  uResolution;
    uniform vec2  uMouse;
    varying vec2  vUv;

    void main() {
      // Your shader logic here
      vec3 col = vec3(vUv, sin(uTime) * 0.5 + 0.5);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
  transparent: true,
  depthWrite: false,
});

// Update uniforms in loop
material.uniforms.uTime.value = clock.getElapsedTime();
```

### 2.3 Fullscreen Shader Plane (Background Effect)
```js
const geo = new THREE.PlaneGeometry(2, 2);   // NDC-spanning quad
// Use OrthographicCamera or trick PerspectiveCamera:
const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const mesh = new THREE.Mesh(geo, material);
scene.add(mesh);
// This renders the fragment shader across the entire canvas.
```

---

## 3. React Three Fiber — Declarative 3D UI/UX

### 3.1 Canvas Wrapper (app-level)
```tsx
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';

// Canvas fills its parent — wrap in a position:fixed or absolute div for bg effects
export default function Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: -1 }}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 75 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 2]}        // responsive pixel ratio
        flat                // disable tone mapping for UI work
      >
        <Suspense fallback={null}>
          <YourScene />
        </Suspense>
      </Canvas>
    </div>
  );
}
```

### 3.2 useFrame — Animation Loop
```tsx
import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';

function AnimatedMesh() {
  const ref = useRef<THREE.Mesh>(null!);
  const { clock, size, mouse } = useThree(); // built-in state

  useFrame(() => {
    const t = clock.getElapsedTime();
    ref.current.rotation.y = t * 0.5;
    // mouse is normalized [-1, 1]
  });

  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[1, 4]} />
      <meshStandardMaterial wireframe />
    </mesh>
  );
}
```

### 3.3 Custom Shader as R3F Material
```tsx
import { shaderMaterial } from '@react-three/drei';
import { extend, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 1. Define
const WaveMaterial = shaderMaterial(
  { uTime: 0, uColor: new THREE.Color('#ff6030'), uMouse: new THREE.Vector2() },
  // vertex
  `varying vec2 vUv;
   void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
  // fragment
  `uniform float uTime;
   uniform vec3  uColor;
   varying vec2  vUv;
   void main() {
     float d = sin(vUv.x * 10.0 + uTime) * 0.5 + 0.5;
     gl_FragColor = vec4(uColor * d, 1.0);
   }`
);

// 2. Register with R3F
extend({ WaveMaterial });

// 3. TypeScript declaration
declare module '@react-three/fiber' {
  interface ThreeElements { waveMaterial: ThreeElement<typeof WaveMaterial> }
}

// 4. Use JSX
function WavePlane() {
  const matRef = useRef<any>(null!);
  useFrame(({ clock }) => { matRef.current.uTime = clock.getElapsedTime(); });
  return (
    <mesh>
      <planeGeometry args={[2, 2, 64, 64]} />
      <waveMaterial ref={matRef} />
    </mesh>
  );
}
```

### 3.4 Drei Essentials for UI/UX
```tsx
import {
  OrbitControls,      // mouse-drag camera
  PerspectiveCamera,  // declarative camera
  Environment,        // HDRI lighting in one line
  Text,               // 3D typography (SDF fonts)
  Html,               // DOM inside 3D space
  Float,              // floating/bobbing animation
  MeshDistortMaterial,// built-in distortion shader
  MeshWobbleMaterial, // built-in wobble
  Sparkles,           // particle sparkle system
  Stars,              // star-field background
  ScrollControls,     // scroll-driven 3D animation
  useScroll,          // scroll progress hook
} from '@react-three/drei';

// Floating glassmorphism card example
function GlassCard() {
  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh>
        <planeGeometry args={[3, 2]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.15}
          roughness={0}
          metalness={0}
          envMapIntensity={1}
        />
      </mesh>
    </Float>
  );
}
```

---

## 4. Fragment Shaders — GLSL Reference

### 4.1 ShaderToy → Three.js Conversion Map
| ShaderToy Builtin | Three.js Equivalent |
|---|---|
| `iTime` | `uniform float uTime` |
| `iResolution` | `uniform vec2 uResolution` |
| `iMouse` | `uniform vec2 uMouse` |
| `fragCoord` | `vUv * uResolution` or `gl_FragCoord.xy` |
| `fragColor` | `gl_FragColor` |

```glsl
// ShaderToy mainImage → Three.js fragment shader wrapper
uniform float uTime;
uniform vec2  uResolution;
uniform vec2  uMouse;
varying vec2  vUv;

// Paste ShaderToy code here, rename fragCoord → gl_FragCoord.xy
void main() {
  vec2 fragCoord = vUv * uResolution;
  vec4 fragColor;

  // --- ShaderToy code block start ---
  vec2 uv = (fragCoord - 0.5 * uResolution) / uResolution.y;
  float d  = length(uv) - 0.3;
  vec3  col = vec3(smoothstep(0.01, 0.0, d));
  fragColor = vec4(col, 1.0);
  // --- ShaderToy code block end ---

  gl_FragColor = fragColor;
}
```

### 4.2 Essential GLSL Functions for UI Effects

```glsl
// ─── Noise (copy-paste ready) ───────────────────────────────────────────────
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f); // smoothstep
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x),
             mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}

float fbm(vec2 p) { // Fractal Brownian Motion — organic texture
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
  return v;
}

// ─── SDF Shapes ─────────────────────────────────────────────────────────────
float sdCircle(vec2 p, float r)         { return length(p) - r; }
float sdBox(vec2 p, vec2 b)             { vec2 d = abs(p) - b; return length(max(d,0.)) + min(max(d.x,d.y),0.); }
float sdRoundedBox(vec2 p, vec2 b, float r) { return sdBox(p, b-r) - r; }

// ─── Color ──────────────────────────────────────────────────────────────────
vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(6.28318 * (c * t + d)); // Iquilez palette
}

vec3 linearToSRGB(vec3 c) { return pow(c, vec3(1.0/2.2)); }

// ─── Blend modes ────────────────────────────────────────────────────────────
vec3 blendScreen(vec3 a, vec3 b)    { return 1.0 - (1.0-a)*(1.0-b); }
vec3 blendOverlay(vec3 a, vec3 b)   { return mix(2.*a*b, 1.-2.*(1.-a)*(1.-b), step(0.5, a)); }
vec3 blendAdd(vec3 a, vec3 b)       { return min(a + b, vec3(1.0)); }
```

### 4.3 Common UI Visual Effects

```glsl
// ─── Aurora / Gradient Flow ─────────────────────────────────────────────────
vec3 aurora(vec2 uv, float t) {
  vec3 col = vec3(0.0);
  for (float i = 0.0; i < 3.0; i++) {
    float wave = sin(uv.x * 3.0 + t + i * 2.094) * 0.3;
    float band = smoothstep(0.4, 0.41, abs(uv.y - wave));
    col += (1.0 - band) * palette(i/3.0 + t*0.1,
      vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67));
  }
  return col;
}

// ─── Chromatic Aberration ───────────────────────────────────────────────────
vec3 chromaticAberration(sampler2D tex, vec2 uv, float strength) {
  vec2 offset = (uv - 0.5) * strength;
  float r = texture2D(tex, uv + offset).r;
  float g = texture2D(tex, uv).g;
  float b = texture2D(tex, uv - offset).b;
  return vec3(r, g, b);
}

// ─── Glitch / Scan Lines ────────────────────────────────────────────────────
float scanlines(vec2 uv, float count) {
  return smoothstep(0.3, 0.7, sin(uv.y * count * 3.14159));
}

float glitch(vec2 uv, float t, float intensity) {
  float n = step(0.95, noise(vec2(uv.y * 10.0, t * 5.0)));
  return n * intensity * noise(vec2(uv.x, t));
}

// ─── Vignette ───────────────────────────────────────────────────────────────
float vignette(vec2 uv, float strength) {
  vec2 q = uv * (1.0 - uv);
  return pow(q.x * q.y * 15.0, strength);
}

// ─── Liquid / Blob Metaballs ────────────────────────────────────────────────
float metaball(vec2 p, vec2 c, float r) { return r / dot(p-c, p-c); }
// Sum multiple metaballs, threshold at 1.0: if (sum > 1.0) render
```

---

## 5. Post-Processing (R3F)

```tsx
import { EffectComposer, Bloom, ChromaticAberration,
         Vignette, Noise, Scanline } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

function PostFX() {
  return (
    <EffectComposer>
      <Bloom
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
        intensity={1.5}
        mipmapBlur
      />
      <ChromaticAberration
        offset={[0.002, 0.002]}
        blendFunction={BlendFunction.NORMAL}
      />
      <Vignette darkness={0.5} offset={0.1} />
      <Noise opacity={0.02} />
    </EffectComposer>
  );
}

// Add <PostFX /> as a sibling inside <Canvas> — NOT inside a mesh.
```

---

## 6. Particle Systems

### 6.1 Points / GPU Particles (Three.js)
```tsx
function Particles({ count = 5000 }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i*3]   = (Math.random() - 0.5) * 10;
      arr[i*3+1] = (Math.random() - 0.5) * 10;
      arr[i*3+2] = (Math.random() - 0.5) * 10;
    }
    return arr;
  }, [count]);

  const ref = useRef<THREE.Points>(null!);
  useFrame(({ clock }) => {
    ref.current.rotation.y = clock.getElapsedTime() * 0.05;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions}
          count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.02} sizeAttenuation color="#88ccff"
        transparent opacity={0.8} depthWrite={false} />
    </points>
  );
}
```

### 6.2 Shader-Driven Particles (custom size/color per particle)
Use `ShaderMaterial` with `gl_PointSize` in vertex shader:
```glsl
// vertex
attribute float aSize;
attribute vec3  aColor;
varying   vec3  vColor;
uniform   float uTime;

void main() {
  vColor = aColor;
  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * (300.0 / -mvPos.z); // perspective scale
  gl_Position  = projectionMatrix * mvPos;
}
```

---

## 7. Scroll-Driven 3D (R3F + Drei)

```tsx
import { ScrollControls, useScroll, Scroll } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

function ScrollScene() {
  const scroll = useScroll();
  const ref    = useRef<THREE.Group>(null!);

  useFrame(() => {
    const t = scroll.offset; // 0 → 1
    ref.current.rotation.y   = t * Math.PI * 2;
    ref.current.position.z   = -t * 5;
  });

  return <group ref={ref}>{/* your 3D content */}</group>;
}

// Wrap Canvas:
<Canvas>
  <ScrollControls pages={5} damping={0.1}>
    <ScrollScene />
    <Scroll html>           {/* DOM layers that scroll with 3D */}
      <section style={{ position: 'absolute', top: '100vh' }}>
        <h1>Section 2</h1>
      </section>
    </Scroll>
  </ScrollControls>
</Canvas>
```

---

## 8. Performance Checklist

| Issue | Fix |
|---|---|
| Jank on resize | `renderer.setPixelRatio(Math.min(dpr, 2))` |
| Too many draw calls | Merge geometries with `BufferGeometryUtils.mergeGeometries` |
| Shader recompile stutter | Create materials outside component render / use `useMemo` |
| Mobile GPU overload | Reduce particle count, use `frameloop="demand"` on Canvas |
| Memory leaks | Dispose geometry/material in `useEffect` cleanup |
| Transparency z-fighting | `depthWrite={false}`, sort by render order |

```tsx
// Lazy render (only re-render on change — good for static UI)
<Canvas frameloop="demand">

// Force re-render from outside:
import { invalidate } from '@react-three/fiber';
invalidate();
```

---

## 9. UI/UX Design Patterns

### Pattern A — Full-Screen Animated Gradient Background
```tsx
// ShaderMesh behind all DOM content
<div style={{ position: 'fixed', inset: 0, zIndex: -1 }}>
  <Canvas flat camera={{ near: 0.1, far: 1 }} orthographic>
    <FullscreenShader />
  </Canvas>
</div>
```

### Pattern B — Hero 3D Object with HTML Overlay
```tsx
<Canvas>
  <Float><GlassOrb /></Float>
  <Html center>
    <h1 style={{ color: 'white', mixBlendMode: 'overlay' }}>
      Your Headline
    </h1>
  </Html>
</Canvas>
```

### Pattern C — Pointer-Reactive Shader
```tsx
function ReactiveShader() {
  const ref = useRef<any>();
  useFrame(({ mouse }) => {
    // mouse is [-1,1] normalized
    ref.current.uMouse = [(mouse.x + 1) / 2, (mouse.y + 1) / 2];
  });
  return <mesh><planeGeometry args={[2,2]} /><yourMaterial ref={ref} /></mesh>;
}
```

### Pattern D — Glassmorphism + 3D Depth
```tsx
// Combine MeshPhysicalMaterial transmission for real glass
<meshPhysicalMaterial
  transmission={1}      // glass-like refraction
  thickness={0.5}
  roughness={0.05}
  ior={1.5}
  transparent
/>
// Requires: <Environment preset="city" /> or similar for reflections
```

---

## 10. Common Mistakes & Fixes

```
❌ Creating new materials/geometries inside render → massive GC pressure
✅ useMemo(() => new THREE.BufferGeometry(), [])

❌ Using useEffect for animation → causes re-renders
✅ useFrame for all per-tick updates

❌ Forgetting to dispose on unmount → VRAM leaks
✅ useEffect(() => () => { geo.dispose(); mat.dispose(); }, [])

❌ High-poly mesh behind text UI → unnecessary GPU load
✅ Reduce segments, use LOD, or fake depth with shader on a plane

❌ Import * as THREE inside shader string → GLSL ≠ JS
✅ GLSL is its own language; use uniforms to pass JS data in

❌ ShaderToy uv starts at pixel coords, Three.js vUv is 0–1
✅ Always normalize: vec2 uv = fragCoord / uResolution;
```

---

## 11. Recommended Ecosystem Links (for OpenCode context loading)

- Three.js docs: `https://threejs.org/docs/`
- R3F docs: `https://docs.pmnd.rs/react-three-fiber`
- Drei storybook: `https://drei.pmnd.rs/`
- ShaderToy: `https://shadertoy.com` (reference only — port via §4.1)
- Inigo Quilez SDFs: `https://iquilezles.org/articles/distfunctions2d/`
- Lygia shader library: `https://lygia.xyz/` (GLSL utilities, import-ready)

---

## 12. File Structure Convention (OpenCode Projects)

```
src/
├── components/
│   ├── canvas/
│   │   ├── Scene.tsx          # Canvas + camera + lighting root
│   │   ├── PostFX.tsx         # EffectComposer effects
│   │   └── particles/
│   │       └── Particles.tsx
│   └── ui/
│       └── HeroSection.tsx    # DOM overlay on top of Canvas
├── shaders/
│   ├── common/
│   │   ├── noise.glsl         # shared noise functions
│   │   └── sdf.glsl           # shared SDF functions
│   └── effects/
│       ├── aurora.glsl
│       └── glitch.glsl
├── materials/
│   └── WaveMaterial.ts        # shaderMaterial definitions
└── hooks/
    ├── useShaderMaterial.ts   # factory hook
    └── useMouseUniform.ts     # normalized mouse → uniform
```
