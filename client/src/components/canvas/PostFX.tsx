import { EffectComposer, Bloom, ChromaticAberration, Vignette, Noise } from "@react-three/postprocessing"
import { BlendFunction } from "postprocessing"

export function PostFX() {
  return (
    <EffectComposer>
      <Bloom
        luminanceThreshold={0.15}
        luminanceSmoothing={0.9}
        intensity={0.8}
        mipmapBlur
      />
      <ChromaticAberration
        offset={[0.001, 0.001]}
        blendFunction={BlendFunction.NORMAL}
      />
      <Vignette darkness={0.3} offset={0.15} />
      <Noise opacity={0.015} />
    </EffectComposer>
  )
}
