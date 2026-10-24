import { Sparkles, Stars } from "@react-three/drei";

export function Atmosphere() {
  return (
    <>
      <hemisphereLight args={["#8498cf", "#121520", 1.42]} />
      <ambientLight color="#9ea8d5" intensity={0.52} />
      <directionalLight
        castShadow
        color="#d8ddff"
        intensity={2.1}
        position={[-18, 26, 12]}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-camera-left={-35}
        shadow-camera-right={35}
        shadow-camera-top={35}
        shadow-camera-bottom={-35}
      />
      <Stars radius={90} depth={45} count={900} factor={2.7} saturation={0.15} fade speed={0.25} />
      <Sparkles count={100} scale={[38, 12, 38]} size={1.2} speed={0.22} color="#b8d7ff" opacity={0.36} />
    </>
  );
}
