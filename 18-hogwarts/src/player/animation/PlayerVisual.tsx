import type { CameraMode } from "../../core/state/game-store";
import { useGameStore } from "../../core/state/game-store";

interface PlayerVisualProps {
  cameraMode: CameraMode;
}

export function PlayerVisual({ cameraMode }: PlayerVisualProps) {
  const lumosEnabled = useGameStore((state) => state.quest.lumosEnabled);

  return (
    <group visible={cameraMode === "third"}>
      <mesh castShadow position={[0, 0.56, 0]}>
        <coneGeometry args={[0.42, 0.82, 16]} />
        <meshStandardMaterial color="#263854" roughness={0.78} metalness={0.08} />
      </mesh>
      <mesh castShadow position={[0, 1.1, 0]}>
        <capsuleGeometry args={[0.3, 0.52, 5, 12]} />
        <meshStandardMaterial color="#304563" roughness={0.74} metalness={0.08} />
      </mesh>
      <mesh castShadow position={[0, 1.62, 0]}>
        <sphereGeometry args={[0.235, 20, 16]} />
        <meshStandardMaterial color="#bd8d70" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 1.78, 0]}>
        <sphereGeometry args={[0.245, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
        <meshStandardMaterial color="#292b39" roughness={0.94} />
      </mesh>
      <mesh castShadow position={[0, 1.89, 0]}>
        <coneGeometry args={[0.31, 0.54, 12]} />
        <meshStandardMaterial color="#172035" roughness={0.82} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.67, 0]}>
        <torusGeometry args={[0.32, 0.045, 8, 20]} />
        <meshStandardMaterial color="#b49b6d" roughness={0.52} metalness={0.42} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} castShadow position={[side * 0.37, 1.08, -0.02]} rotation={[0.1, 0, side * -0.28]}>
          <capsuleGeometry args={[0.105, 0.56, 4, 8]} />
          <meshStandardMaterial color="#263854" roughness={0.76} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} castShadow position={[side * 0.2, 0.12, 0.04]}>
          <boxGeometry args={[0.26, 0.19, 0.42]} />
          <meshStandardMaterial color="#171c2a" roughness={0.78} />
        </mesh>
      ))}
      <group position={[0.38, 1.04, -0.32]} rotation={[0.26, 0, -0.28]}>
        <mesh castShadow rotation={[0.22, 0, 0]}>
          <cylinderGeometry args={[0.026, 0.036, 0.86, 8]} />
          <meshStandardMaterial color="#c19b60" roughness={0.42} metalness={0.5} />
        </mesh>
        <mesh position={[0, 0.46, 0]}>
          <sphereGeometry args={[0.055, 10, 8]} />
          <meshStandardMaterial color={lumosEnabled ? "#c8f5ff" : "#b38a51"} emissive={lumosEnabled ? "#78dcff" : "#000000"} emissiveIntensity={lumosEnabled ? 2.4 : 0} />
        </mesh>
        {lumosEnabled && <pointLight color="#9feaff" intensity={2.8} distance={6} decay={2} position={[0, 0.48, 0]} />}
      </group>
    </group>
  );
}
