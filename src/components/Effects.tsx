import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

export default function Effects() {
  return (
    <EffectComposer>
      <Bloom
        intensity={1.2}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <Vignette darkness={0.4} offset={0.3} />
    </EffectComposer>
  );
}
